from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
from PIL import Image
import io
import base64

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/images/'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'filename': filename})
    return jsonify({'error': 'File not allowed'})

@app.route('/save', methods=['POST'])
def save_image():
    data = request.json
    original_image = Image.open(os.path.join(app.config['UPLOAD_FOLDER'], data['original_image']))
    drawing_data = data['drawing']

    drawing_image = Image.open(io.BytesIO(base64.b64decode(drawing_data.split(',')[1])))
    original_image.paste(drawing_image, (0, 0), drawing_image)

    output = io.BytesIO()
    original_image.save(output, format='PNG')
    output.seek(0)

    return jsonify({'status': 'success'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
