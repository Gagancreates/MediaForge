from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routers import image, video
from backend.utils.helpers import get_temp_dir
import os
from pathlib import Path

app = FastAPI(
    title="Media Converter API",
    description="Self-hosted media conversion and compression service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image.router)
app.include_router(video.router)

frontend_path = Path(__file__).parent.parent / "frontend"

@app.get("/")
async def serve_index():
    """Serve the index.html file."""
    index_path = frontend_path / "index.html"
    return FileResponse(index_path)

if frontend_path.exists():
    app.mount("/css", StaticFiles(directory=str(frontend_path / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(frontend_path / "js")), name="js")


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    temp_dir = get_temp_dir()
    print(f"Temporary directory: {temp_dir}")
    print("Media Converter API is ready")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    print("Shutting down Media Converter API")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "media-converter"}
