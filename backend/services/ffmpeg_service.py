import subprocess
import json
import os
from typing import Dict, Any, Optional, List
from backend.utils.helpers import get_file_size_kb, get_file_size_mb


class FFmpegError(Exception):
    """Custom exception for FFmpeg-related errors."""
    pass


def run_ffmpeg_command(cmd: List[str], timeout: int = 3600) -> subprocess.CompletedProcess:
    """Run an FFmpeg command and return the result."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False
        )
        if result.returncode != 0:
            raise FFmpegError(f"FFmpeg error: {result.stderr}")
        return result
    except subprocess.TimeoutExpired:
        raise FFmpegError("Operation timed out")
    except FileNotFoundError:
        raise FFmpegError("FFmpeg not found. Please ensure FFmpeg is installed.")


def get_media_info(file_path: str) -> Dict[str, Any]:
    """Extract media metadata using FFprobe."""
    cmd = [
        'ffprobe',
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        file_path
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)

        info = {
            'format': data.get('format', {}).get('format_name', 'unknown'),
            'size_bytes': int(data.get('format', {}).get('size', 0)),
            'duration': float(data.get('format', {}).get('duration', 0)) or None,
        }

        video_stream = next((s for s in data.get('streams', []) if s.get('codec_type') == 'video'), None)
        if video_stream:
            info['width'] = video_stream.get('width')
            info['height'] = video_stream.get('height')
            info['codec'] = video_stream.get('codec_name')

        return info
    except Exception as e:
        raise FFmpegError(f"Failed to get media info: {str(e)}")


def convert_image(input_path: str, output_path: str, target_format: str, quality: int = 85) -> None:
    """Convert image to target format with specified quality."""
    cmd = ['ffmpeg', '-i', input_path]

    if target_format.lower() in ['jpg', 'jpeg']:
        cmd.extend(['-q:v', str(int((100 - quality) / 100 * 31 + 2))])
    elif target_format.lower() == 'webp':
        cmd.extend(['-quality', str(quality)])
    elif target_format.lower() == 'png':
        cmd.extend(['-compression_level', '6'])

    cmd.extend(['-y', output_path])
    run_ffmpeg_command(cmd)


def compress_image(input_path: str, output_path: str, target_size_kb: int, format: str) -> None:
    """Compress image to target size using binary search on quality."""
    quality_min = 70
    quality_max = 95
    max_iterations = 5
    tolerance = 0.05

    for iteration in range(max_iterations):
        quality = (quality_min + quality_max) // 2

        convert_image(input_path, output_path, format, quality)

        current_size_kb = get_file_size_kb(output_path)
        size_ratio = current_size_kb / target_size_kb

        if abs(size_ratio - 1.0) <= tolerance:
            return

        if current_size_kb > target_size_kb:
            quality_max = quality - 1
        else:
            quality_min = quality + 1

        if quality_min > quality_max:
            break

    convert_image(input_path, output_path, format, quality_min)


def convert_video(
    input_path: str,
    output_path: str,
    target_format: str,
    codec: Optional[str] = None,
    quality: str = "medium"
) -> None:
    """Convert video to target format with specified codec and quality."""
    cmd = ['ffmpeg', '-i', input_path]

    if codec:
        cmd.extend(['-c:v', codec])
    else:
        if target_format.lower() == 'mp4':
            cmd.extend(['-c:v', 'libx264'])
        elif target_format.lower() == 'webm':
            cmd.extend(['-c:v', 'libvpx-vp9'])

    quality_presets = {
        'low': '28',
        'medium': '23',
        'high': '18'
    }
    crf = quality_presets.get(quality, '23')
    cmd.extend(['-crf', crf])

    cmd.extend(['-c:a', 'aac', '-b:a', '128k'])
    cmd.extend(['-y', output_path])

    run_ffmpeg_command(cmd)


def compress_video(
    input_path: str,
    output_path: str,
    target_size_mb: float,
    format: str,
    codec: Optional[str] = None
) -> None:
    """Compress video to target size using 2-pass encoding."""
    info = get_media_info(input_path)
    duration = info.get('duration')

    if not duration or duration <= 0:
        raise FFmpegError("Cannot determine video duration")

    audio_bitrate_kbps = 128
    target_size_bits = target_size_mb * 8 * 1024 * 1024
    audio_size_bits = audio_bitrate_kbps * 1000 * duration
    video_size_bits = target_size_bits - audio_size_bits
    video_bitrate_kbps = int(video_size_bits / duration / 1000)

    if video_bitrate_kbps < 100:
        raise FFmpegError("Target size too small for video duration")

    if not codec:
        codec = 'libx264' if format.lower() == 'mp4' else 'libvpx-vp9'

    passlogfile = output_path + '_passlog'

    pass1_cmd = [
        'ffmpeg', '-i', input_path,
        '-c:v', codec,
        '-b:v', f'{video_bitrate_kbps}k',
        '-pass', '1',
        '-passlogfile', passlogfile,
        '-an',
        '-f', format,
        '-y', os.devnull if os.name != 'nt' else 'NUL'
    ]

    pass2_cmd = [
        'ffmpeg', '-i', input_path,
        '-c:v', codec,
        '-b:v', f'{video_bitrate_kbps}k',
        '-pass', '2',
        '-passlogfile', passlogfile,
        '-c:a', 'aac',
        '-b:a', f'{audio_bitrate_kbps}k',
        '-y', output_path
    ]

    try:
        run_ffmpeg_command(pass1_cmd)
        run_ffmpeg_command(pass2_cmd)
    finally:
        for ext in ['', '-0.log', '-0.log.mbtree']:
            log_file = f'{passlogfile}{ext}'
            if os.path.exists(log_file):
                os.remove(log_file)


def get_supported_image_formats() -> List[str]:
    """Return list of supported image formats."""
    return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'tiff', 'gif']


def get_supported_video_formats() -> List[str]:
    """Return list of supported video formats."""
    return ['mp4', 'webm', 'avi', 'mkv', 'mov', 'flv']


def get_supported_video_codecs() -> List[str]:
    """Return list of supported video codecs."""
    return ['libx264', 'libx265', 'libvpx', 'libvpx-vp9', 'mpeg4']
