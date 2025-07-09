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
        ])
    )
    event_id = fields.Integer(
        required=False
    )


class ImageUploadResponseSchema(Schema):
    """Schema for image upload response"""
    object_key = fields.String(
        required=True, 
        dump_only=True
    )
    bucket = fields.String(
        required=True,
        dump_only=True
    )
    url = fields.String(
        required=True, 
        dump_only=True
    )
    context = fields.String(
        required=True,
        dump_only=True
    )


class PresignedUrlResponseSchema(Schema):
    """Schema for presigned URL response"""
    url = fields.String(
        required=True,
        dump_only=True
    )
    expires_in = fields.Integer(
        required=True,
        dump_only=True
    )