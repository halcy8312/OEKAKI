document.addEventListener('DOMContentLoaded', function() {
    const backgroundCanvas = document.getElementById('backgroundCanvas');
    const backgroundCtx = backgroundCanvas.getContext('2d');
    const drawingCanvas = document.getElementById('drawingCanvas');
    const drawingCtx = drawingCanvas.getContext('2d');
    const uploadButton = document.getElementById('upload');
    const saveButton = document.getElementById('save');
    const fileInput = document.getElementById('fileInput');
    const downloadOption = document.getElementById('downloadOption');
    const toolSelect = document.getElementById('tool');
    const colorPicker = document.getElementById('colorPicker');
    const sizePicker = document.getElementById('sizePicker');

    let drawing = false;
    let tool = 'pen';
    let color = '#000000';
    let size = 5;
    let image = null;

    function startDrawing(event) {
        drawing = true;
        draw(event);
    }

    function stopDrawing() {
        drawing = false;
        drawingCtx.beginPath();
    }

    function draw(event) {
        if (!drawing) return;

        event.preventDefault();
        drawingCtx.lineWidth = size;
        drawingCtx.lineCap = 'round';

        const rect = drawingCanvas.getBoundingClientRect();
        let x, y;

        if (event.touches) {
            x = event.touches[0].clientX - rect.left;
            y = event.touches[0].clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }

        if (tool === 'pen') {
            drawingCtx.globalCompositeOperation = 'source-over';
            drawingCtx.strokeStyle = color;
        } else if (tool === 'eraser') {
            drawingCtx.globalCompositeOperation = 'destination-out';
            drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
        }

        drawingCtx.lineTo(x, y);
        drawingCtx.stroke();
        drawingCtx.beginPath();
        drawingCtx.moveTo(x, y);
    }

    function resizeCanvasToDisplaySize() {
        const width = drawingCanvas.clientWidth;
        const height = drawingCanvas.clientHeight;

        if (drawingCanvas.width !== width || drawingCanvas.height !== height) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = drawingCanvas.width;
            tempCanvas.height = drawingCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(drawingCanvas, 0, 0);

            drawingCanvas.width = width;
            drawingCanvas.height = height;

            drawingCtx.drawImage(tempCanvas, 0, 0, width, height);
        }
    }

    function updateCanvasSize(width, height) {
        backgroundCanvas.width = width;
        backgroundCanvas.height = height;
        drawingCanvas.width = width;
        drawingCanvas.height = height;
    }

    function drawImageOnBackgroundCanvas(img) {
        const aspectRatio = img.width / img.height;
        const maxCanvasWidth = window.innerWidth - 20;
        const maxCanvasHeight = window.innerHeight - 20;

        let canvasWidth, canvasHeight;
        if (aspectRatio > 1) {
            canvasWidth = maxCanvasWidth;
            canvasHeight = maxCanvasWidth / aspectRatio;
        } else {
            canvasHeight = maxCanvasHeight;
            canvasWidth = maxCanvasHeight * aspectRatio;
        }

        updateCanvasSize(canvasWidth, canvasHeight);
        backgroundCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    }

    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('touchstart', startDrawing);
    drawingCanvas.addEventListener('touchend', stopDrawing);
    drawingCanvas.addEventListener('touchmove', draw);

    toolSelect.addEventListener('change', function() {
        tool = this.value;
    });

    colorPicker.addEventListener('input', function() {
        color = this.value;
    });

    sizePicker.addEventListener('input', function() {
        size = this.value;
    });

    uploadButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        const file = fileInput.files[0];
        if (!file) {
            console.error('No file selected');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.filename) {
                console.log('File uploaded:', data.filename);
                const img = new Image();
                img.src = `/static/images/${data.filename}`;
                img.onload = function() {
                    image = img;
                    drawImageOnBackgroundCanvas(img);
                };
            } else {
                console.error('File upload failed:', data.error);
            }
        })
        .catch(error => {
            console.error('An error occurred while uploading the image:', error);
        });
    });

    saveButton.addEventListener('click', function() {
        const option = downloadOption.value;
        let dataUrl;

        if (option === 'merged') {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = drawingCanvas.width;
            tempCanvas.height = drawingCanvas.height;
            tempCtx.drawImage(backgroundCanvas, 0, 0);
            tempCtx.drawImage(drawingCanvas, 0, 0);
            dataUrl = tempCanvas.toDataURL('image/png');
        } else {
            dataUrl = drawingCanvas.toDataURL('image/png');
        }

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = option === 'merged' ? 'merged_image.png' : 'drawing_only.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    window.addEventListener('resize', resizeCanvasToDisplaySize);
});
