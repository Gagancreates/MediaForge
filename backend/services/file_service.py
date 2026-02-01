import os
import aiofiles
from pathlib import Path
from fastapi import UploadFile
from backend.utils.helpers import get_temp_dir, generate_unique_filename, cleanup_file


async def save_upload_file(upload_file: UploadFile, suffix: str = "") -> str:
    """Save an uploaded file to temporary storage and return the path."""
    temp_dir = get_temp_dir()

    if suffix and not suffix.startswith('.'):
        suffix = f'.{suffix}'

    temp_path = str(temp_dir / generate_unique_filename(suffix))

    async with aiofiles.open(temp_path, 'wb') as f:
        content = await upload_file.read()
        await f.write(content)

    return temp_path


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return Path(filename).suffix.lower().lstrip('.')


def create_temp_output_path(input_path: str, target_format: str) -> str:
    """Create a temporary output file path with target format."""
    temp_dir = get_temp_dir()
    if not target_format.startswith('.'):
        target_format = f'.{target_format}'
    return str(temp_dir / generate_unique_filename(target_format))
