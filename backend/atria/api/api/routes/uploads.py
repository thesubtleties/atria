# api/api/routes/uploads.py
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify, send_file
from io import BytesIO

from api.services.storage import storage_service, StorageBucket
from api.api.schemas.upload import (
    ImageUploadSchema,
    ImageUploadResponseSchema,
    PresignedUrlResponseSchema
)
from api.commons.decorators import event_member_required
from api.models import User


blp = Blueprint(
    "uploads",
    "uploads",
    url_prefix="/api",
    description="File upload and storage operations",
)


@blp.route("/uploads/image")
class ImageUploadResource(MethodView):
    @blp.arguments(ImageUploadSchema, location="form")
    @blp.response(201, ImageUploadResponseSchema)
    @blp.doc(
        summary="Upload an image",
        description="Upload an image file to storage. Supports JPEG, PNG, GIF, and WebP formats up to 5MB.",
        responses={
            400: {"description": "Invalid file or validation error"},
            401: {"description": "Authentication required"},
            500: {"description": "Server error during upload"},
        },
    )
    @jwt_required()
    def post(self, args):
        """Upload an image file"""
        current_user_id = int(get_jwt_identity())
        
        if 'file' not in request.files:
            abort(400, message="No file provided")
        
        file = request.files['file']
        if not file or file.filename == '':
            abort(400, message="No file selected")
        
        context = args['context']
        
        # Build kwargs based on context
        kwargs = {}
        if context == 'avatar':
            kwargs['user_id'] = current_user_id
        elif context in ['event_logo', 'event_banner', 'sponsor_logo', 'event_document']:
            if 'event_id' not in args:
                abort(400, message="event_id required for this context")
            kwargs['event_id'] = args['event_id']
        
        try:
            # Upload the image
            result = storage_service.upload_image(file, context=context, **kwargs)
            
            # For public bucket, URL is already set
            # For private buckets, construct the appropriate route URL
            if result['bucket'] == StorageBucket.PUBLIC.value:
                url = result['url']
            elif result['bucket'] == StorageBucket.AUTHENTICATED.value:
                url = f"/api/content/{result['object_key']}"
            else:  # PRIVATE bucket
                url = f"/api/private/{result['object_key']}"
            
            return {
                'object_key': result['object_key'],
                'bucket': result['bucket'],
                'url': url,
                'context': result['context']
            }, 201
            
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            return {"message": "Failed to upload image"}, 500


@blp.route("/content/<path:object_key>")
class AuthenticatedContentResource(MethodView):
    @blp.response(200, PresignedUrlResponseSchema)
    @blp.doc(
        summary="Get authenticated content URL",
        description="Get a presigned URL for authenticated content (requires login)",
        responses={
            401: {"description": "Authentication required"},
            404: {"description": "Content not found"},
        },
    )
    @jwt_required()
    def get(self, object_key):
        """Get presigned URL for authenticated content"""
        # Verify file exists
        if not storage_service.file_exists(StorageBucket.AUTHENTICATED.value, object_key):
            return {"message": "Content not found"}, 404
        
        # Generate presigned URL
        url = storage_service.get_presigned_url(
            StorageBucket.AUTHENTICATED.value,
            object_key
        )
        
        return {
            'url': url,
            'expires_in': 900  # 15 minutes
        }


@blp.route("/private/<path:object_key>")
class PrivateContentResource(MethodView):
    @blp.response(200, PresignedUrlResponseSchema)
    @blp.doc(
        summary="Get private content URL",
        description="Get a presigned URL for private content (requires login and event membership)",
        responses={
            401: {"description": "Authentication required"},
            403: {"description": "Not authorized to access this content"},
            404: {"description": "Content not found"},
        },
    )
    @jwt_required()
    def get(self, object_key):
        """Get presigned URL for private content"""
        current_user_id = int(get_jwt_identity())
        
        # Extract event_id from object_key (format: events/{event_id}/...)
        parts = object_key.split('/')
        if len(parts) < 2 or parts[0] != 'events':
            abort(400, message="Invalid private content path")
        
        try:
            event_id = int(parts[1])
        except ValueError:
            abort(400, message="Invalid event ID in path")
        
        # Check event membership using the decorator logic
        from api.models import Event, User
        current_user = User.query.get_or_404(current_user_id)
        event = Event.query.get_or_404(event_id)
        
        if not event.is_user_in_event(current_user):
            return {"message": "Not authorized to access this content"}, 403
        
        # Verify file exists
        if not storage_service.file_exists(StorageBucket.PRIVATE.value, object_key):
            return {"message": "Content not found"}, 404
        
        # Generate presigned URL
        url = storage_service.get_presigned_url(
            StorageBucket.PRIVATE.value,
            object_key
        )
        
        return {
            'url': url,
            'expires_in': 900  # 15 minutes
        }


@blp.route("/public/<path:object_key>")
class PublicContentResource(MethodView):
    @blp.doc(
        summary="Redirect to public content",
        description="Redirect to public content URL (no authentication required)",
        responses={
            302: {"description": "Redirect to content"},
            404: {"description": "Content not found"},
        },
    )
    def get(self, object_key):
        """Redirect to public content"""
        # For public content, just redirect to the MinIO URL
        external_url = storage_service.external_url
        return "", 302, {'Location': f"{external_url}/{StorageBucket.PUBLIC.value}/{object_key}"}


@blp.route("/uploads/<path:object_key>")
class UploadDeleteResource(MethodView):
    @blp.response(204)
    @blp.doc(
        summary="Delete an uploaded file",
        description="Delete an uploaded file from storage",
        responses={
            401: {"description": "Authentication required"},
            403: {"description": "Not authorized to delete this file"},
            404: {"description": "File not found"},
        },
    )
    @jwt_required()
    def delete(self, object_key):
        """Delete an uploaded file"""
        current_user_id = int(get_jwt_identity())
        
        # Determine which bucket based on object_key prefix
        bucket = None
        if object_key.startswith('users/'):
            bucket = StorageBucket.AUTHENTICATED.value
            # Verify ownership
            parts = object_key.split('/')
            if len(parts) >= 2:
                try:
                    file_user_id = int(parts[1])
                    if file_user_id != current_user_id:
                        return {"message": "Not authorized to delete this file"}, 403
                except ValueError:
                    pass
        elif object_key.startswith('events/'):
            bucket = StorageBucket.PRIVATE.value
            # TODO: Add event admin check
        else:
            bucket = StorageBucket.PUBLIC.value
            # TODO: Add admin check for public content
        
        if not bucket:
            abort(400, message="Invalid file path")
        
        success = storage_service.delete_file(bucket, object_key)
        if not success:
            return {"message": "Failed to delete file"}, 404
        
        return '', 204