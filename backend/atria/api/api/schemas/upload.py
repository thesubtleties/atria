# api/api/schemas/upload.py
from marshmallow import Schema, fields, validate


class ImageUploadSchema(Schema):
    """Schema for image upload request"""
    context = fields.String(
        required=True,
        validate=validate.OneOf([
            'avatar',
            'event_logo', 
            'event_banner',
            'sponsor_logo',
            'event_document',
            'marketing',
            'email_assets'
        ]),
        description="Context for the upload"
    )
    event_id = fields.Integer(
        required=False,
        description="Event ID (required for event-related contexts)"
    )


class ImageUploadResponseSchema(Schema):
    """Schema for image upload response"""
    object_key = fields.String(
        required=True, 
        description="Object key in storage",
        dump_only=True
    )
    bucket = fields.String(
        required=True,
        description="Storage bucket name",
        dump_only=True
    )
    url = fields.String(
        required=True, 
        description="URL to access the image",
        dump_only=True
    )
    context = fields.String(
        required=True,
        description="Upload context",
        dump_only=True
    )


class PresignedUrlResponseSchema(Schema):
    """Schema for presigned URL response"""
    url = fields.String(
        required=True,
        description="Presigned URL for accessing the content",
        dump_only=True
    )
    expires_in = fields.Integer(
        required=True,
        description="URL expiration time in seconds",
        dump_only=True
    )