from torchvision.version import cuda
from ultralytics import YOLO
from backend.config import id2name
import torch

# Load YOLOv8 model (e.g., yolov8n - nano version for efficiency)
model = YOLO("models/yolov8n.pt")  # Tải mô hình YOLOv8n (hoặc yolov8s.pt, yolov8m.pt, ...)

def inference(img_arr, conf_thresh=0.5):
    try:
        # Chạy YOLOv8 trên hình ảnh
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        results = model.predict(img_arr, conf=conf_thresh, device=device, verbose=False)

        print(device)
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