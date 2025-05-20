from flask import Flask, request, jsonify, render_template
from PIL import Image
import numpy as np
import base64
import io
import logging

from backend.tf_inference import load_model, inference

# Load model globally
sess, detection_graph = load_model()  # sess và detection_graph là None với YOLOv8

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/', methods=["POST"])
def main_interface():
    try:
        response = request.get_json()
        if not response or 'image' not in response:
            return jsonify({"error": "Missing 'image' key in JSON"}), 400

        data_str = response['image']
        base64_str = data_str[data_str.find(',') + 1:] if ',' in data_str else data_str

        try:
            image = base64.b64decode(base64_str)
        except base64.binascii.Error:
            return jsonify({"error": "Invalid base64 encoding"}), 400

        try:
            img = Image.open(io.BytesIO(image))
        except Exception as e:
            return jsonify({"error": f"Failed to open image: {str(e)}"}), 400

        if img.mode != 'RGB':
            img = img.convert("RGB")

        img_arr = np.array(img)
        if len(img_arr.shape) != 3 or img_arr.shape[2] != 3:
            return jsonify({"error": "Image must be RGB with shape (height, width, 3)"}), 400

        results = inference(sess, detection_graph, img_arr, conf_thresh=0.5)
        app.logger.info(f"Inference results: {results}")
        return jsonify(results)

    except Exception as e:
        app.logger.error(f"Server error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.after_request
def add_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)