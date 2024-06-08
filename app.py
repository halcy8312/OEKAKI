import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from werkzeug.utils import secure_filename
from PIL import Image
import io
import base64

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/images/'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.secret_key = 'supersecretkey'

# Ensure the upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        app.logger.info(f'File uploaded: {filename}')
        return jsonify({'filename': filename})
    flash('File not allowed')
    return redirect(request.url)

@app.route('/save', methods=['POST'])
def save_image():
    data = request.json
    merged_image_data = data['merged_image']
    drawing_image_data = data['drawing_image']

    merged_image = Image.open(io.BytesIO(base64.b64decode(merged_image_data.split(',')[1])))
    drawing_image = Image.open(io.BytesIO(base64.b64decode(drawing_image_data.split(',')[1])))

    merged_image_path = os.path.join(app.config['UPLOAD_FOLDER'], 'merged_image.png')
    drawing_image_path = os.path.join(app.config['UPLOAD_FOLDER'], 'drawing_image.png')

    merged_image.save(merged_image_path)
    drawing_image.save(drawing_image_path)

    return jsonify(status='success')

@app.route('/result')
def result():
    return render_template('result.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
