import uuid
from abc import ABC, abstractmethod

import boto3
from botocore.config import Config

from app.config import settings


class FileStorage(ABC):
    @abstractmethod
    async def upload(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Upload a file and return its public URL."""
        ...

    @abstractmethod
    async def delete(self, file_url: str) -> None:
        """Delete a file by its URL."""
        ...


class S3Storage(FileStorage):
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=Config(signature_version="s3v4"),
        )
        self.bucket = settings.s3_bucket

    async def upload(self, file_data: bytes, filename: str, content_type: str) -> str:
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
        key = f"thumbnails/{uuid.uuid4()}.{ext}"
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=file_data,
            ContentType=content_type,
        )
        return f"{settings.s3_endpoint}/{self.bucket}/{key}"

    async def delete(self, file_url: str) -> None:
        prefix = f"{settings.s3_endpoint}/{self.bucket}/"
        if file_url.startswith(prefix):
            key = file_url[len(prefix):]
            self.client.delete_object(Bucket=self.bucket, Key=key)
