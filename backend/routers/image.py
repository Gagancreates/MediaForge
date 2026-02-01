from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from backend.services import ffmpeg_service, file_service
from backend.models.schemas import FormatListResponse
from backend.utils.helpers import cleanup_file
import os

router = APIRouter(prefix="/api/image", tags=["image"])


@router.post("/convert")
async def convert_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),
    quality: int = Form(85)
):
    """Convert image to target format."""
    input_path = None
    output_path = None

    try:
        input_ext = file_service.get_file_extension(file.filename)
        input_path = await file_service.save_upload_file(file, input_ext)

        output_path = file_service.create_temp_output_path(input_path, target_format)

        ffmpeg_service.convert_image(input_path, output_path, target_format, quality)

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Conversion failed")

        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}.{target_format}"

        background_tasks.add_task(cleanup_file, input_path)
        background_tasks.add_task(cleanup_file, output_path)

        return FileResponse(
            output_path,
            media_type=f"image/{target_format}",
            filename=download_name
        )

    except ffmpeg_service.FFmpegError as e:
        if input_path:
            cleanup_file(input_path)
        if output_path:
            cleanup_file(output_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if input_path:
            cleanup_file(input_path)
        if output_path:
            cleanup_file(output_path)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/compress")
async def compress_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_size_kb: int = Form(...),
    format: str = Form(...)
):
    """Compress image to target file size."""
    input_path = None
    output_path = None

    try:
        input_ext = file_service.get_file_extension(file.filename)
        input_path = await file_service.save_upload_file(file, input_ext)

        output_path = file_service.create_temp_output_path(input_path, format)

        ffmpeg_service.compress_image(input_path, output_path, target_size_kb, format)

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Compression failed")

        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_compressed.{format}"

        background_tasks.add_task(cleanup_file, input_path)
        background_tasks.add_task(cleanup_file, output_path)

        return FileResponse(
            output_path,
            media_type=f"image/{format}",
            filename=download_name
        )

    except ffmpeg_service.FFmpegError as e:
        if input_path:
            cleanup_file(input_path)
        if output_path:
            cleanup_file(output_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if input_path:
            cleanup_file(input_path)
        if output_path:
            cleanup_file(output_path)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/formats", response_model=FormatListResponse)
async def get_image_formats():
    """Get list of supported image formats."""
    return FormatListResponse(formats=ffmpeg_service.get_supported_image_formats())
