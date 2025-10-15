import os
import uuid
from typing import Optional, Tuple, Dict
from datetime import timedelta
from io import BytesIO
from enum import Enum

from minio import Minio
from minio.error import S3Error
from PIL import Image, ImageOps
from werkzeug.datastructures import FileStorage



class StorageBucket(Enum):
    """Storage bucket types based on access patterns."""
    # Bucket names are configurable via environment variables for multi-environment support
    PUBLIC = os.getenv('MINIO_BUCKET_PUBLIC', 'atria-public')
    AUTHENTICATED = os.getenv('MINIO_BUCKET_AUTHENTICATED', 'atria-authenticated')
    PRIVATE = os.getenv('MINIO_BUCKET_PRIVATE', 'atria-private')


class StorageService:
    """Service for handling file storage with MinIO using three-tier bucket structure."""
    
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Max dimensions by context
    MAX_DIMENSIONS = {
        'avatar': 600,
        'sponsor_logo': 800,
        'event_logo': 800,
        'event_banner': 1600,
    }
    
    # Storage paths by context
    # Note: Bucket names are read from StorageBucket enum which uses environment variables
    STORAGE_PATHS = {
        # Public bucket paths
        'marketing': (StorageBucket.PUBLIC.value, 'marketing'),
        'email_assets': (StorageBucket.PUBLIC.value, 'email-assets'),

        # Authenticated bucket paths
        'avatar': (StorageBucket.AUTHENTICATED.value, 'users/{user_id}/avatars'),

        # Private bucket paths
        'event_logo': (StorageBucket.PRIVATE.value, 'events/{event_id}/logos'),
        'event_banner': (StorageBucket.PRIVATE.value, 'events/{event_id}/banners'),
        'sponsor_logo': (StorageBucket.PRIVATE.value, 'events/{event_id}/sponsors/logos'),
        'event_document': (StorageBucket.PRIVATE.value, 'events/{event_id}/documents'),
    }
    
    def __init__(self):
        """Initialize MinIO client."""
        # IMPORTANT: In production, MINIO_ENDPOINT must be set to the external URL (storage.sbtl.dev)
        # so that presigned URLs work correctly. The signature is calculated based on the endpoint
        # used here, so it must match what browsers will use to access the files.
        self.endpoint = os.getenv('MINIO_ENDPOINT', 'minio-api.infrastructure.svc.cluster.local:9000')
        self.access_key = os.getenv('MINIO_ACCESS_KEY')
        self.secret_key = os.getenv('MINIO_SECRET_KEY')
        self.use_ssl = os.getenv('MINIO_USE_SSL', 'false').lower() == 'true'
        self.external_url = os.getenv('MINIO_EXTERNAL_URL', 'https://storage.sbtl.dev')
        self.client = None
        self._connected = False
        
        if not self.access_key or not self.secret_key:
            print("Warning: MinIO credentials not configured. Storage operations will fail.")
            return
        
        try:
            self.client = Minio(
                self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.use_ssl
            )
            
            self._ensure_buckets_exist()
            self._connected = True
            print(f"Successfully connected to MinIO at {self.endpoint}")
        except Exception as e:
            print(f"Warning: Could not connect to MinIO at {self.endpoint}: {e}")
            print("Storage operations will fail, but app will start")
    
    def _ensure_buckets_exist(self):
        """Ensure all required buckets exist."""
        for bucket in StorageBucket:
            try:
                if not self.client.bucket_exists(bucket.value):
                    print(f"Warning: Bucket {bucket.value} does not exist. It should be created by infrastructure.")
            except S3Error as e:
                print(f"Error checking bucket {bucket.value}: {e}")
    
    def _validate_image(self, file: FileStorage) -> Tuple[bool, Optional[str]]:
        """Validate image file."""
        if not file:
            return False, "No file provided"
        
        # Check file extension
        filename = file.filename
        if not filename:
            return False, "No filename provided"
        
        ext = filename.lower().split('.')[-1]
        if ext not in self.ALLOWED_IMAGE_EXTENSIONS:
            return False, f"Invalid file type. Allowed types: {', '.join(self.ALLOWED_IMAGE_EXTENSIONS)}"
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if size > self.MAX_IMAGE_SIZE:
            return False, f"File too large. Maximum size: {self.MAX_IMAGE_SIZE // (1024 * 1024)}MB"
        
        # Verify it's a valid image
        try:
            img = Image.open(file)
            img.verify()
            file.seek(0)  # Reset after verify
        except Exception:
            return False, "Invalid image file"
        
        return True, None
    
    def _optimize_image(self, image: Image.Image, context: str) -> Tuple[BytesIO, str]:
        """Optimize image for web delivery."""
        # Fix orientation based on EXIF data
        image = ImageOps.exif_transpose(image)
        
        # Get max dimensions for context
        max_dimension = self.MAX_DIMENSIONS.get(context, 1200)
        
        # Resize if needed (maintaining aspect ratio)
        if image.width > max_dimension or image.height > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        
        # Determine if image has transparency
        has_transparency = image.mode in ('RGBA', 'LA') or (
            image.mode == 'P' and 'transparency' in image.info
        )
        
        output = BytesIO()
        
        # Try WebP first (best compression)
        try:
            if has_transparency and context in ['sponsor_logo', 'avatar']:
                # Use lossless WebP for logos/avatars with transparency
                image.save(output, format='WEBP', lossless=True, quality=100)
            else:
                # Use lossy WebP for everything else
                if image.mode == 'RGBA' and context not in ['sponsor_logo', 'avatar']:
                    # Convert RGBA to RGB for non-logo/avatar images
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[3])
                    image = background
                image.save(output, format='WEBP', quality=85, method=6)
            format_ext = 'webp'
        except Exception:
            # Fallback to PNG for transparency or JPEG for non-transparent
            output = BytesIO()  # Reset buffer
            if has_transparency:
                image.save(output, format='PNG', optimize=True)
                format_ext = 'png'
            else:
                if image.mode == 'RGBA':
                    # Convert RGBA to RGB for JPEG
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[3])
                    image = background
                image.save(output, format='JPEG', quality=85, optimize=True, progressive=True)
                format_ext = 'jpg'
        
        output.seek(0)
        return output, format_ext
    
    def _get_storage_config(self, context: str, **kwargs) -> Tuple[str, str]:
        """Get bucket and path for a given storage context."""
        if context not in self.STORAGE_PATHS:
            raise ValueError(f"Invalid storage context: {context}")
        
        bucket, path_template = self.STORAGE_PATHS[context]
        
        # Format path with provided kwargs (e.g., user_id, event_id)
        try:
            path = path_template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing required parameter for {context}: {e}")
        
        return bucket, path
    
    def upload_image(self, file: FileStorage, context: str, **kwargs) -> Dict[str, str]:
        """
        Upload an image file to MinIO.
        
        Args:
            file: The file to upload
            context: Storage context (e.g., 'avatar', 'event_logo')
            **kwargs: Context-specific parameters (e.g., user_id, event_id)
            
        Returns:
            Dictionary with object_key and url
        """
        # Validate the image first
        is_valid, error = self._validate_image(file)
        if not is_valid:
            raise ValueError(error)
        
        # Get bucket and path
        bucket, path = self._get_storage_config(context, **kwargs)
        
        # Open image and optimize it (this works even without MinIO)
        image = Image.open(file)
        optimized_buffer, format_ext = self._optimize_image(image, context)
        
        # Generate unique filename with optimized extension
        filename = f"{uuid.uuid4()}.{format_ext}"
        object_name = f"{path}/{filename}"
        
        if not self._connected:
            # Development mode - just log what would happen
            optimized_size = optimized_buffer.getbuffer().nbytes
            original_size = file.tell()
            print(f"[DEV MODE] Would upload optimized {context}:")
            print(f"  Original: {file.filename} ({original_size:,} bytes)")
            print(f"  Optimized: {filename} ({optimized_size:,} bytes)")
            print(f"  Compression: {(1 - optimized_size/original_size)*100:.1f}% reduction")
            print(f"  Path: {bucket}/{object_name}")
            
            # Return mock response for development
            return {
                'object_key': object_name,
                'bucket': bucket,
                'url': None,
                'context': context
            }
        
        try:
            # Get size of optimized image
            optimized_size = optimized_buffer.getbuffer().nbytes
            
            # Upload optimized image to MinIO
            self.client.put_object(
                bucket,
                object_name,
                optimized_buffer,
                optimized_size,
                content_type=f"image/{format_ext}"
            )
            
            # Return appropriate URL based on bucket type
            if bucket == StorageBucket.PUBLIC.value:
                # For public bucket, return direct URL
                url = f"{self.external_url}/{bucket}/{object_name}"
            else:
                # For private buckets, we'll generate presigned URLs through Flask routes
                url = None  # Will be handled by Flask routes
            
            return {
                'object_key': object_name,
                'bucket': bucket,
                'url': url,
                'context': context
            }
            
        except S3Error as e:
            raise Exception(f"Failed to upload file: {str(e)}")
    
    def delete_file(self, bucket: str, object_name: str) -> bool:
        """
        Delete a file from MinIO.
        
        Args:
            bucket: The bucket name
            object_name: The object key to delete
            
        Returns:
            True if successful, False otherwise
        """
        if not self._connected:
            return False
            
        try:
            self.client.remove_object(bucket, object_name)
            return True
        except S3Error:
            return False
    
    def get_presigned_url(self, bucket: str, object_name: str, expires: timedelta = timedelta(minutes=15)) -> str:
        """
        Generate a presigned URL for accessing a file.
        
        Args:
            bucket: The bucket name
            object_name: The object key
            expires: How long the URL should be valid (default 15 minutes)
            
        Returns:
            Presigned URL
        """
        if not self._connected:
            raise Exception("Storage service not connected")
            
        try:
            url = self.client.presigned_get_object(
                bucket,
                object_name,
                expires=expires
            )
            return url
        except S3Error as e:
            raise Exception(f"Failed to generate URL: {str(e)}")
    
    def file_exists(self, bucket: str, object_name: str) -> bool:
        """Check if a file exists in MinIO."""
        if not self._connected:
            return False
            
        try:
            self.client.stat_object(bucket, object_name)
            return True
        except S3Error:
            return False


# Create singleton instance
storage_service = StorageService()