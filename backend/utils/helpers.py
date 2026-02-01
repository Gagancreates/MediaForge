import os
import uuid
import tempfile
from pathlib import Path
from contextlib import contextmanager
from typing import Generator


def get_temp_dir() -> Path:
    """Get or create temporary directory for file processing."""
    temp_dir = Path(tempfile.gettempdir()) / "media-converter"
    temp_dir.mkdir(exist_ok=True)
    return temp_dir


def generate_unique_filename(suffix: str = "") -> str:
    """Generate a unique filename with optional suffix."""
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{suffix}"


def get_file_size_mb(file_path: str) -> float:
    """Get file size in megabytes."""
    return os.path.getsize(file_path) / (1024 * 1024)


def get_file_size_kb(file_path: str) -> float:
    """Get file size in kilobytes."""
    return os.path.getsize(file_path) / 1024


def cleanup_file(file_path: str) -> None:
    """Safely delete a file if it exists."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error cleaning up file {file_path}: {e}")


@contextmanager
def temp_file_context(suffix: str = "") -> Generator[str, None, None]:
    """Context manager for temporary file that auto-cleans up."""
    temp_dir = get_temp_dir()
    temp_path = str(temp_dir / generate_unique_filename(suffix))
    try:
        yield temp_path
    finally:
        cleanup_file(temp_path)
