from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from rembg import remove
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "running", "service": "N.A.I.R AI Background Removal"}), 200

@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    try:
        # Read image
        input_image = Image.open(file.stream)
        
        # Remove background
        output_image = remove(input_image)
        
        # Save to buffer
        img_io = io.BytesIO()
        output_image.save(img_io, 'PNG')
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/png')
    
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    # Using port 5001 for AI service
    app.run(host='0.0.0.0', port=5001)
