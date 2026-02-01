# Media Converter

A self-hosted web application for converting and compressing images and videos using FFmpeg.

## Features

- **Image Conversion**: Convert between JPG, PNG, WebP, AVIF, BMP, TIFF, and GIF formats
- **Image Compression**: Compress images to a specific target file size
- **Video Conversion**: Convert between MP4, WebM, AVI, MKV, MOV, and FLV formats
- **Video Compression**: Compress videos to a target file size using 2-pass encoding
- **No File Size Limits**: Process files of any size
- **No Persistent Storage**: Files are processed and immediately deleted after download
- **Quality Control**: Adjustable quality settings for conversions
- **Modern UI**: Clean, responsive interface with drag-and-drop support
- **Self-Hosted**: Complete control over your data and processing

## Technology Stack

- **Backend**: Python with FastAPI
- **Processing**: FFmpeg for all media operations
- **Frontend**: Vanilla JavaScript with modern CSS
- **Deployment**: Docker and Docker Compose

## Requirements

- Docker and Docker Compose (recommended)
- OR Python 3.11+ and FFmpeg (for local development)

## Installation

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd media-converter
```

2. Build and start the container:
```bash
docker-compose up -d
```

3. Access the application at `http://localhost:8000`

### Local Development

1. Install FFmpeg:
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

2. Install Python dependencies:
```bash
cd media-converter
pip install -r backend/requirements.txt
```

3. Run the application:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

4. Access the application at `http://localhost:8000`

## Usage

### Converting Images

1. Select the "Images" tab
2. Upload an image by dragging and dropping or clicking to browse
3. Choose "Convert Format" operation
4. Select target format and quality level
5. Click "Process Image"
6. Download will start automatically when complete

### Compressing Images

1. Select the "Images" tab
2. Upload an image
3. Choose "Compress to Size" operation
4. Enter target file size in kilobytes
5. Select output format
6. Click "Process Image"
7. Download will start automatically

### Converting Videos

1. Select the "Videos" tab
2. Upload a video file
3. Choose "Convert Format" operation
4. Select target format, codec, and quality preset
5. Click "Process Video"
6. Wait for processing to complete (may take several minutes)
7. Download will start automatically

### Compressing Videos

1. Select the "Videos" tab
2. Upload a video file
3. Choose "Compress to Size" operation
4. Enter target file size in megabytes
5. Select output format and codec
6. Click "Process Video"
7. Download will start automatically when complete

## API Documentation

Once the application is running, access the automatic API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Supported Formats

### Images

- Input: All formats supported by FFmpeg
- Output: JPG, JPEG, PNG, WebP, AVIF, BMP, TIFF, GIF

### Videos

- Input: All formats supported by FFmpeg
- Output: MP4, WebM, AVI, MKV, MOV, FLV

### Video Codecs

- H.264 (libx264)
- H.265 (libx265)
- VP8 (libvpx)
- VP9 (libvpx-vp9)
- MPEG-4

## Configuration

### Environment Variables

You can configure the application using environment variables in `docker-compose.yml`:

```yaml
environment:
  - PYTHONUNBUFFERED=1
  # Add custom configuration here
```

### Timeout Settings

Video processing timeout is set to 3600 seconds (1 hour) by default. Modify in `backend/services/ffmpeg_service.py`:

```python
def run_ffmpeg_command(cmd: List[str], timeout: int = 3600):
```

## Project Structure

```
media-converter/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── routers/
│   │   ├── image.py           # Image conversion endpoints
│   │   └── video.py           # Video conversion endpoints
│   ├── services/
│   │   ├── ffmpeg_service.py  # FFmpeg wrapper functions
│   │   └── file_service.py    # File handling utilities
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   ├── utils/
│   │   └── helpers.py         # Helper functions
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
└── README.md
```

## How It Works

### Image Compression Algorithm

1. Binary search is used to find the optimal quality setting
2. Starting quality is 85, with a range between 70-95
3. Image is compressed and output size is checked
4. Quality is adjusted up or down based on target size
5. Process repeats up to 5 iterations or until within 5% of target

### Video Compression Algorithm

1. Video duration is extracted using FFprobe
2. Target bitrate is calculated: `(target_size_MB * 8192) / duration_seconds`
3. Audio bitrate (128 kbps) is subtracted from total bitrate
4. 2-pass encoding is performed for optimal quality:
   - Pass 1: Analysis phase (no output file)
   - Pass 2: Encoding phase with calculated bitrate

## Security Considerations

- No persistent storage means no data retention
- Files are automatically deleted after processing
- Temporary files are stored in system temp directory
- No authentication required for local/self-hosted use
- Consider adding authentication if exposing to network

## Troubleshooting

### FFmpeg Not Found

Ensure FFmpeg is installed and accessible in your system PATH:

```bash
ffmpeg -version
```

### Out of Memory Errors

For very large files, increase Docker memory limits in Docker Desktop settings or use:

```yaml
services:
  media-converter:
    deploy:
      resources:
        limits:
          memory: 4G
```

### Slow Video Processing

Video processing is CPU-intensive and can take time. For faster processing:

- Use lower quality settings
- Choose more efficient codecs (H.264 over H.265)
- Use a machine with more CPU cores

### Permission Errors

Ensure the temporary directory has write permissions:

```bash
chmod 755 /tmp/media-converter
```

## Development

### Running Tests

```bash
# Install dev dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Style

The project follows PEP 8 guidelines. Format code using:

```bash
pip install black
black backend/
```

## Performance Tips

1. **Image Processing**: Fast, typically completes in under 5 seconds
2. **Video Processing**: Can take several minutes for large files
3. **Compression**: 2-pass encoding is slower but produces better quality
4. **Concurrent Processing**: Multiple users can process files simultaneously

## Limitations

- Video compression requires video to have a duration (cannot compress images saved as video)
- Very small target sizes may not be achievable while maintaining reasonable quality
- Processing time scales with input file size and complexity

## Future Enhancements

- Batch processing for multiple files
- Preset configurations (web optimized, archive quality, etc.)
- Video trimming and cutting functionality
- Image filters and adjustments
- Processing queue with status tracking
- WebSocket support for real-time progress updates
- API key authentication option
- Dark mode toggle in UI

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues, questions, or suggestions, please open an issue in the repository.

## Acknowledgments

- Built with FastAPI
- Powered by FFmpeg
- Inspired by the need for privacy-focused media processing tools
