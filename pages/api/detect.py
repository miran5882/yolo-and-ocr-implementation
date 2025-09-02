import cv2
import numpy as np
import easyocr
from ultralytics import YOLO
from PIL import Image
import base64
import io
import os
import urllib.request
from pathlib import Path
from http.server import BaseHTTPRequestHandler
import json
import tempfile

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Set CORS headers
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            # Get content length
            content_length = int(self.headers['Content-Length'])
            
            # Read the raw data
            raw_data = self.rfile.read(content_length)
            
            # Parse multipart form data manually (simplified)
            # In production, you'd want to use a proper multipart parser
            boundary_start = raw_data.find(b'Content-Type: image/')
            if boundary_start == -1:
                raise ValueError("No image found in request")
            
            # Find the start of image data
            image_start = raw_data.find(b'\r\n\r\n', boundary_start) + 4
            
            # Find the end boundary
            boundary_end = raw_data.find(b'\r\n--', image_start)
            if boundary_end == -1:
                boundary_end = len(raw_data)
            
            # Extract image data
            image_data = raw_data[image_start:boundary_end]
            
            # Process the image
            result = self.process_image(image_data)
            
            # Send response
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def process_image(self, image_data):
        # Download model if not present
        model_path = "/tmp/yolov8n.pt"
        if not Path(model_path).exists():
            urllib.request.urlretrieve(
                "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt",
                model_path
            )
        
        # Load models
        model = YOLO(model_path)
        reader = easyocr.Reader(['en'], gpu=False)  # Disable GPU for serverless
        
        # Convert image data to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to OpenCV format
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Resize if image is too large (to save processing time)
        height, width = img_cv.shape[:2]
        if width > 1280 or height > 720:
            scale = min(1280/width, 720/height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            img_cv = cv2.resize(img_cv, (new_width, new_height))
        
        # YOLO Object Detection
        results = model(img_cv)
        annotated_frame = results[0].plot()
        
        # OCR Text Detection
        ocr_results = reader.readtext(img_cv)
        detected_text = ""
        for detection in ocr_results:
            detected_text += detection[1] + "\n"
        
        # Convert annotated frame to base64
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            'image': img_base64,
            'text': detected_text.strip()
        }
