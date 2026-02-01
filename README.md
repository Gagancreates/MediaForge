# MediaForge

A self-hosted web application for converting and compressing images and videos using FFmpeg.

<img width="1226" height="967" alt="Image" src="https://github.com/user-attachments/assets/d69c92ef-b4be-4554-af5d-939dcba61f0e" />

<img width="1357" height="907" alt="Image" src="https://github.com/user-attachments/assets/b96d47cd-3a99-4cf6-86ba-f7f9211a107f" />

<img width="1572" height="995" alt="Image" src="https://github.com/user-attachments/assets/9b4b8a10-2de5-4226-adf6-c607aebf04a1" />

## Features

- Convert images between JPG, PNG, WebP, AVIF, BMP, TIFF, and GIF
- Convert videos between MP4, WebM, AVI, MKV, MOV, and FLV
- Compress to specific target file sizes with intelligent algorithms
- No file size limits or data retention
- Modern UI with drag-and-drop support and live comparison
- Self-hosted with complete privacy

## Quick Start

### Using Docker (Recommended)

```bash
git clone https://github.com/Gagancreates/MediaForge.git
cd MediaForge
docker-compose up -d
```

Access at `http://localhost:8000`

### Local Development

1. Install FFmpeg and Python 3.11+
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run the server:
   ```bash
   ./run.bat  # Windows
   ./run.sh   # Mac/Linux
   ```

## Technology Stack

- **Backend**: FastAPI + Python
- **Processing**: FFmpeg
- **Frontend**: Vanilla JavaScript
- **Deployment**: Docker

## Supported Formats

**Images**: JPG, PNG, WebP, AVIF, BMP, TIFF, GIF
**Videos**: MP4, WebM, AVI, MKV, MOV, FLV
**Codecs**: H.264, H.265, VP8, VP9, MPEG-4

## How It Works

**Image Compression**: Uses binary search (70-95 quality range) to hit target file size within 5% accuracy in up to 5 iterations.

**Video Compression**: Calculates optimal bitrate based on target size and duration, then uses 2-pass encoding for best quality.

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Configuration

Modify timeout in `backend/services/ffmpeg_service.py`:
```python
def run_ffmpeg_command(cmd: List[str], timeout: int = 3600):
```

For Docker memory limits, edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 4G
```

## Troubleshooting

**FFmpeg not found**: Ensure FFmpeg is in your PATH
```bash
ffmpeg -version
```

**Slow processing**: Video encoding is CPU-intensive. Use lower quality settings or H.264 codec for faster processing.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Fork the repo, create a feature branch, and submit a PR.
