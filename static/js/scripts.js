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

        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        
        if (tool === 'pen') {
            ctx.strokeStyle = color;
        } else if (tool === 'eraser') {
            ctx.strokeStyle = '#FFFFFF';
        }

        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(event.offsetX, event.offsetY);
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);

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

        fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                original_image: dataUrl,
                drawing: dataUrl
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Image saved successfully!');
            }
        });
    });
});
