from ultralytics import YOLO
import numpy as np
from backend.config import id2name
# Load YOLOv8 model (e.g., yolov8n - nano version for efficiency)
model = YOLO("models/yolov8n.pt")  # Tải mô hình YOLOv8n (hoặc yolov8s.pt, yolov8m.pt, ...)

def load_model():
    return None, None

def inference(_, __, img_arr, conf_thresh=0.5):
    try:
        # Chạy YOLOv8 trên hình ảnh
        results = model.predict(img_arr, conf=conf_thresh, verbose=False)

        # Xử lý kết quả
        detections = []
        for result in results[0].boxes:  # Lấy boxes từ kết quả YOLO
            class_id = int(result.cls)
            conf = float(result.conf)
            bbox = result.xyxy[0].cpu().numpy()  # [xmin, ymin, xmax, ymax]
            detections.append({
                "name": id2name.get(class_id, f"Unknown_{class_id}"),
                "conf": conf,
                "bbox": [int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])]
            })

        return {"results": detections}
    except Exception as e:
        raise Exception(f"Inference error: {str(e)}")