document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const uploadButton = document.getElementById('upload');
    const saveButton = document.getElementById('save');
    const fileInput = document.getElementById('fileInput');
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
        ctx.beginPath();
    }

    function draw(event) {
        if (!drawing) return;

        event.preventDefault();
        ctx.lineWidth = size;
        ctx.lineCap = 'round';

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if (event.touches) {
            x = event.touches[0].clientX - rect.left;
            y = event.touches[0].clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }

        if (tool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
        } else if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    function resizeCanvasToDisplaySize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (canvas.width !== width || canvas.height !== height) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchmove', draw);

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

                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'drawing.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    window.addEventListener('resize', resizeCanvasToDisplaySize);
});
