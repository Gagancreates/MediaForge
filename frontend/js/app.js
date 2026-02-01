const API_BASE = window.location.origin;

class MediaConverter {
    constructor() {
        this.currentTab = 'image';
        this.imageFile = null;
        this.videoFile = null;
        this.originalMetadata = {};
        this.processedBlob = null;
        this.processedFilename = '';
        this.processedMetadata = {};
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupImageHandlers();
        this.setupVideoHandlers();
        this.setupComparisonHandlers();
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tab);
        });

        this.hideError();
    }

    setupImageHandlers() {
        const dropzone = document.getElementById('imageDropzone');
        const input = document.getElementById('imageInput');
        const processButton = document.getElementById('imageProcessButton');
        const operationRadios = document.querySelectorAll('input[name="imageOperation"]');

        dropzone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => this.handleImageSelect(e.target.files[0]));

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageSelect(file);
            }
        });

        operationRadios.forEach(radio => {
            radio.addEventListener('change', () => this.toggleImageForms());
        });

        processButton.addEventListener('click', () => this.processImage());

        const imageQuality = document.getElementById('imageQuality');
        const imageQualityValue = document.getElementById('imageQualityValue');
        imageQuality.addEventListener('input', (e) => {
            imageQualityValue.textContent = e.target.value;
        });

        const imageTargetSize = document.getElementById('imageTargetSize');
        const imageTargetSizeValue = document.getElementById('imageTargetSizeValue');
        imageTargetSize.addEventListener('input', (e) => {
            imageTargetSizeValue.textContent = `${e.target.value} KB`;
        });

        document.getElementById('imageDownloadBtn').addEventListener('click', () => {
            if (this.processedBlob && this.processedFilename) {
                this.downloadFile(this.processedBlob, this.processedFilename);
            }
        });

        document.getElementById('imageCompareBtn').addEventListener('click', () => {
            this.showComparison();
        });

        document.getElementById('imageProcessAnotherBtn').addEventListener('click', () => {
            this.resetImageForm();
        });
    }

    setupVideoHandlers() {
        const dropzone = document.getElementById('videoDropzone');
        const input = document.getElementById('videoInput');
        const processButton = document.getElementById('videoProcessButton');
        const operationRadios = document.querySelectorAll('input[name="videoOperation"]');

        dropzone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => this.handleVideoSelect(e.target.files[0]));

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                this.handleVideoSelect(file);
            }
        });

        operationRadios.forEach(radio => {
            radio.addEventListener('change', () => this.toggleVideoForms());
        });

        processButton.addEventListener('click', () => this.processVideo());

        const videoTargetSize = document.getElementById('videoTargetSize');
        const videoTargetSizeValue = document.getElementById('videoTargetSizeValue');
        videoTargetSize.addEventListener('input', (e) => {
            videoTargetSizeValue.textContent = `${e.target.value} MB`;
        });

        document.getElementById('videoDownloadBtn').addEventListener('click', () => {
            if (this.processedBlob && this.processedFilename) {
                this.downloadFile(this.processedBlob, this.processedFilename);
            }
        });

        document.getElementById('videoCompareBtn').addEventListener('click', () => {
            this.showComparison();
        });

        document.getElementById('videoProcessAnotherBtn').addEventListener('click', () => {
            this.resetVideoForm();
        });
    }

    setupComparisonHandlers() {
        document.getElementById('closeComparison').addEventListener('click', () => {
            this.hideComparison();
        });

        document.getElementById('metricsViewBtn').addEventListener('click', () => {
            this.switchComparisonView('metrics');
        });

        document.getElementById('compareViewBtn').addEventListener('click', () => {
            this.switchComparisonView('compare');
        });
    }

    async handleImageSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showError('Please select a valid image file');
            return;
        }

        this.imageFile = file;
        this.originalMetadata = await this.getImageMetadata(file);

        document.getElementById('imageFileName').textContent = file.name;
        document.getElementById('imageFileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('imageFileInfo').style.display = 'flex';
        document.getElementById('imageProcessButton').disabled = false;
        this.hideError();
    }

    async handleVideoSelect(file) {
        if (!file || !file.type.startsWith('video/')) {
            this.showError('Please select a valid video file');
            return;
        }

        this.videoFile = file;
        this.originalMetadata = await this.getVideoMetadata(file);

        document.getElementById('videoFileName').textContent = file.name;
        document.getElementById('videoFileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('videoFileInfo').style.display = 'flex';
        document.getElementById('videoProcessButton').disabled = false;
        this.hideError();
    }

    async getImageMetadata(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    type: 'image',
                    format: file.type.split('/')[1].toUpperCase(),
                    size: file.size,
                    width: img.width,
                    height: img.height,
                    file: file
                });
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
                resolve({
                    type: 'image',
                    format: file.type.split('/')[1].toUpperCase(),
                    size: file.size,
                    file: file
                });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    async getVideoMetadata(file) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                resolve({
                    type: 'video',
                    format: file.type.split('/')[1].toUpperCase(),
                    size: file.size,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration,
                    file: file
                });
                URL.revokeObjectURL(video.src);
            };
            video.onerror = () => {
                resolve({
                    type: 'video',
                    format: file.type.split('/')[1].toUpperCase(),
                    size: file.size,
                    file: file
                });
            };
            video.src = URL.createObjectURL(file);
        });
    }

    toggleImageForms() {
        const operation = document.querySelector('input[name="imageOperation"]:checked').value;
        document.getElementById('imageConvertForm').style.display = operation === 'convert' ? 'block' : 'none';
        document.getElementById('imageCompressForm').style.display = operation === 'compress' ? 'block' : 'none';
    }

    toggleVideoForms() {
        const operation = document.querySelector('input[name="videoOperation"]:checked').value;
        document.getElementById('videoConvertForm').style.display = operation === 'convert' ? 'block' : 'none';
        document.getElementById('videoCompressForm').style.display = operation === 'compress' ? 'block' : 'none';
    }

    async processImage() {
        if (!this.imageFile) return;

        const operation = document.querySelector('input[name="imageOperation"]:checked').value;
        const formData = new FormData();
        formData.append('file', this.imageFile);

        let endpoint;
        let targetFormat;

        if (operation === 'convert') {
            endpoint = '/api/image/convert';
            targetFormat = document.getElementById('imageTargetFormat').value;
            formData.append('target_format', targetFormat);
            formData.append('quality', document.getElementById('imageQuality').value);
        } else {
            endpoint = '/api/image/compress';
            targetFormat = document.getElementById('imageCompressFormat').value;
            formData.append('target_size_kb', document.getElementById('imageTargetSize').value);
            formData.append('format', targetFormat);
        }

        this.showProcessing('Converting your image...');

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Processing failed');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            const filename = this.extractFilename(contentDisposition) || 'converted-image';

            this.processedBlob = blob;
            this.processedFilename = filename;

            const processedMetadata = await this.getImageMetadata(new File([blob], filename, { type: blob.type }));
            processedMetadata.format = targetFormat.toUpperCase();
            this.processedMetadata = processedMetadata;

            this.hideProcessing();
            this.showImageResult();

        } catch (error) {
            this.hideProcessing();
            this.showError(error.message);
        }
    }

    async processVideo() {
        if (!this.videoFile) return;

        const operation = document.querySelector('input[name="videoOperation"]:checked').value;
        const formData = new FormData();
        formData.append('file', this.videoFile);

        let endpoint;
        let targetFormat;

        if (operation === 'convert') {
            endpoint = '/api/video/convert';
            targetFormat = document.getElementById('videoTargetFormat').value;
            formData.append('target_format', targetFormat);
            formData.append('quality', document.getElementById('videoQuality').value);
            const codec = document.getElementById('videoCodec').value;
            if (codec) formData.append('codec', codec);
        } else {
            endpoint = '/api/video/compress';
            targetFormat = document.getElementById('videoCompressFormat').value;
            formData.append('target_size_mb', document.getElementById('videoTargetSize').value);
            formData.append('format', targetFormat);
            const codec = document.getElementById('videoCompressCodec').value;
            if (codec) formData.append('codec', codec);
        }

        this.showProcessing('Processing your video... This may take a while.');

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Processing failed');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            const filename = this.extractFilename(contentDisposition) || 'converted-video';

            this.processedBlob = blob;
            this.processedFilename = filename;

            const processedMetadata = await this.getVideoMetadata(new File([blob], filename, { type: blob.type }));
            processedMetadata.format = targetFormat.toUpperCase();
            this.processedMetadata = processedMetadata;

            this.hideProcessing();
            this.showVideoResult();

        } catch (error) {
            this.hideProcessing();
            this.showError(error.message);
        }
    }

    showImageResult() {
        document.getElementById('imageDropzone').style.display = 'none';
        document.getElementById('imageFileInfo').style.display = 'none';
        document.querySelector('.operation-selector').style.display = 'none';
        document.getElementById('imageConvertForm').style.display = 'none';
        document.getElementById('imageCompressForm').style.display = 'none';
        document.getElementById('imageProcessButton').style.display = 'none';

        document.getElementById('imageResultFormat').textContent = this.processedMetadata.format;
        document.getElementById('imageResultSize').textContent = this.formatFileSize(this.processedMetadata.size);

        const preview = document.getElementById('imageResultPreview');
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(this.processedBlob);
        preview.appendChild(img);

        document.getElementById('imageResultView').style.display = 'block';
    }

    showVideoResult() {
        document.getElementById('videoDropzone').style.display = 'none';
        document.getElementById('videoFileInfo').style.display = 'none';
        document.querySelectorAll('.operation-selector')[1].style.display = 'none';
        document.getElementById('videoConvertForm').style.display = 'none';
        document.getElementById('videoCompressForm').style.display = 'none';
        document.getElementById('videoProcessButton').style.display = 'none';

        document.getElementById('videoResultFormat').textContent = this.processedMetadata.format;
        document.getElementById('videoResultSize').textContent = this.formatFileSize(this.processedMetadata.size);

        const preview = document.getElementById('videoResultPreview');
        preview.innerHTML = '';
        const video = document.createElement('video');
        video.src = URL.createObjectURL(this.processedBlob);
        video.controls = true;
        preview.appendChild(video);

        document.getElementById('videoResultView').style.display = 'block';
    }

    showComparison() {
        document.getElementById('originalFormat').textContent = this.originalMetadata.format;
        document.getElementById('originalSize').textContent = this.formatFileSize(this.originalMetadata.size);

        document.getElementById('processedFormat').textContent = this.processedMetadata.format;
        document.getElementById('processedSize').textContent = this.formatFileSize(this.processedMetadata.size);

        const reduction = ((this.originalMetadata.size - this.processedMetadata.size) / this.originalMetadata.size * 100).toFixed(1);
        const reductionEl = document.getElementById('sizeReduction');
        reductionEl.textContent = reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`;
        reductionEl.style.color = reduction > 0 ? 'var(--success)' : 'var(--error)';

        if (this.originalMetadata.type === 'image') {
            if (this.originalMetadata.width && this.originalMetadata.height) {
                document.getElementById('originalDimensionsContainer').style.display = 'flex';
                document.getElementById('originalDimensions').textContent = `${this.originalMetadata.width} × ${this.originalMetadata.height}`;
            }
            if (this.processedMetadata.width && this.processedMetadata.height) {
                document.getElementById('processedDimensionsContainer').style.display = 'flex';
                document.getElementById('processedDimensions').textContent = `${this.processedMetadata.width} × ${this.processedMetadata.height}`;
            }
        } else if (this.originalMetadata.type === 'video') {
            if (this.originalMetadata.width && this.originalMetadata.height) {
                document.getElementById('originalDimensionsContainer').style.display = 'flex';
                document.getElementById('originalDimensions').textContent = `${this.originalMetadata.width} × ${this.originalMetadata.height}`;
            }
            if (this.originalMetadata.duration) {
                document.getElementById('originalDurationContainer').style.display = 'flex';
                document.getElementById('originalDuration').textContent = this.formatDuration(this.originalMetadata.duration);
            }
            if (this.processedMetadata.width && this.processedMetadata.height) {
                document.getElementById('processedDimensionsContainer').style.display = 'flex';
                document.getElementById('processedDimensions').textContent = `${this.processedMetadata.width} × ${this.processedMetadata.height}`;
            }
            if (this.processedMetadata.duration) {
                document.getElementById('processedDurationContainer').style.display = 'flex';
                document.getElementById('processedDuration').textContent = this.formatDuration(this.processedMetadata.duration);
            }
        }

        this.setupComparisonPreviews();
        document.getElementById('comparisonOverlay').style.display = 'flex';
    }

    setupComparisonPreviews() {
        const originalPreview = document.getElementById('originalPreview');
        const processedPreview = document.getElementById('processedPreview');

        originalPreview.innerHTML = '';
        processedPreview.innerHTML = '';

        if (this.originalMetadata.type === 'image') {
            const originalImg = document.createElement('img');
            originalImg.src = URL.createObjectURL(this.originalMetadata.file);
            originalPreview.appendChild(originalImg);

            const processedImg = document.createElement('img');
            processedImg.src = URL.createObjectURL(this.processedBlob);
            processedPreview.appendChild(processedImg);
        } else if (this.originalMetadata.type === 'video') {
            const originalVideo = document.createElement('video');
            originalVideo.src = URL.createObjectURL(this.originalMetadata.file);
            originalVideo.controls = true;
            originalPreview.appendChild(originalVideo);

            const processedVideo = document.createElement('video');
            processedVideo.src = URL.createObjectURL(this.processedBlob);
            processedVideo.controls = true;
            processedPreview.appendChild(processedVideo);
        }
    }

    hideComparison() {
        document.getElementById('comparisonOverlay').style.display = 'none';
        document.getElementById('originalDimensionsContainer').style.display = 'none';
        document.getElementById('originalDurationContainer').style.display = 'none';
        document.getElementById('processedDimensionsContainer').style.display = 'none';
        document.getElementById('processedDurationContainer').style.display = 'none';
    }

    switchComparisonView(view) {
        const metricsBtn = document.getElementById('metricsViewBtn');
        const compareBtn = document.getElementById('compareViewBtn');
        const metricsView = document.getElementById('metricsView');
        const compareView = document.getElementById('compareView');

        if (view === 'metrics') {
            metricsBtn.classList.add('active');
            compareBtn.classList.remove('active');
            metricsView.style.display = 'block';
            compareView.style.display = 'none';
        } else {
            compareBtn.classList.add('active');
            metricsBtn.classList.remove('active');
            compareView.style.display = 'block';
            metricsView.style.display = 'none';
        }
    }

    resetImageForm() {
        this.imageFile = null;
        this.originalMetadata = {};
        this.processedBlob = null;
        this.processedFilename = '';
        this.processedMetadata = {};

        document.getElementById('imageResultView').style.display = 'none';
        document.getElementById('imageDropzone').style.display = 'block';
        document.querySelector('.operation-selector').style.display = 'flex';
        document.getElementById('imageProcessButton').style.display = 'block';
        document.getElementById('imageProcessButton').disabled = true;
        document.getElementById('imageInput').value = '';
        this.toggleImageForms();
    }

    resetVideoForm() {
        this.videoFile = null;
        this.originalMetadata = {};
        this.processedBlob = null;
        this.processedFilename = '';
        this.processedMetadata = {};

        document.getElementById('videoResultView').style.display = 'none';
        document.getElementById('videoDropzone').style.display = 'block';
        document.querySelectorAll('.operation-selector')[1].style.display = 'flex';
        document.getElementById('videoProcessButton').style.display = 'block';
        document.getElementById('videoProcessButton').disabled = true;
        document.getElementById('videoInput').value = '';
        this.toggleVideoForms();
    }

    showProcessing(message) {
        document.getElementById('processingText').textContent = message;
        document.getElementById('processingOverlay').style.display = 'flex';
    }

    hideProcessing() {
        document.getElementById('processingOverlay').style.display = 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    extractFilename(contentDisposition) {
        if (!contentDisposition) return null;
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        return match && match[1] ? match[1].replace(/['"]/g, '') : null;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MediaConverter();
});
