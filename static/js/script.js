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

    canvas.addEventListener('mousedown', function() {
        drawing = true;
    });

    canvas.addEventListener('mouseup', function() {
        drawing = false;
        ctx.beginPath();
    });

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

    function draw(event) {
        if (!drawing) return;

        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        
        if (tool === 'pen') {
            ctx.strokeStyle = color;
        } else if (tool === 'eraser') {
            ctx.strokeStyle = '#FFFFFF';
        }

        ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    }

    uploadButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.filename) {
                const img = new Image();
                img.src = `/static/images/${data.filename}`;
                img.onload = function() {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
            }
        });
    });

    saveButton.addEventListener('click', function() {
        const dataUrl = canvas.toDataURL('image/png');
        const originalImage = canvas.toDataURL('image/png'); // Change this to get the original image URL

        fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                original_image: originalImage,
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
