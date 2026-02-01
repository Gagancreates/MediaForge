from pydantic import BaseModel, Field
from typing import Optional, List


class ImageConvertRequest(BaseModel):
    target_format: str = Field(..., description="Target image format (e.g., 'png', 'jpg', 'webp')")
    quality: Optional[int] = Field(85, ge=1, le=100, description="Quality level (1-100)")


class ImageCompressRequest(BaseModel):
    target_size_kb: int = Field(..., gt=0, description="Target file size in kilobytes")
    format: str = Field(..., description="Output format (e.g., 'jpg', 'webp')")


class VideoConvertRequest(BaseModel):
    target_format: str = Field(..., description="Target video format (e.g., 'mp4', 'webm')")
    codec: Optional[str] = Field(None, description="Video codec (e.g., 'h264', 'vp9')")
    quality: Optional[str] = Field("medium", description="Quality preset (low, medium, high)")


class VideoCompressRequest(BaseModel):
    target_size_mb: float = Field(..., gt=0, description="Target file size in megabytes")
    format: str = Field(..., description="Output format (e.g., 'mp4', 'webm')")
    codec: Optional[str] = Field(None, description="Video codec")


class MediaInfoResponse(BaseModel):
    format: str
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: int
    codec: Optional[str] = None


class FormatListResponse(BaseModel):
    formats: List[str]
