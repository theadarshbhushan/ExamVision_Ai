import os
import cv2
import numpy as np
from ultralytics import YOLO

class YOLODetector:
    """
    YOLOv8 wrapper for detecting exam cheating tools (phones, chits, supplement passing, etc.).
    Fine-tuned on cheating_dataset.
    """
    def __init__(self, model_path=None):
        if model_path is None:
            model_path = os.path.join("models", "phone_chit_detector.pt")
        
        self.model_path = model_path
        
        # Handle the case where the model weights file does not exist yet (raise a clear error)
        if not os.path.exists(self.model_path):
            error_msg = (
                f"Error: Model weights file not found at '{os.path.abspath(self.model_path)}'.\n"
                f"Please train the model first by running:\n"
                f"  python src/detection/train_detector.py"
            )
            print(error_msg)
            raise FileNotFoundError(error_msg)
            
        print(f"YOLODetector: Loading fine-tuned model from: {self.model_path}")
        self.model = YOLO(self.model_path)
        # Class names supported by the cheating_dataset
        self.classes = ['chits', 'hand', 'peeking', 'phone', 'supplement-passing']

    def detect_objects(self, frame):
        """
        Runs object detection on a frame.
        Args:
            frame (np.ndarray): cv2 image frame (BGR format)
        Returns:
            list: List of dictionary detections:
                  [{'class_name': 'phone', 'confidence': 0.89, 'bounding_box': [x1, y1, x2, y2]}]
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded. Cannot run inference.")
            
        # Run inference (verbose=False keeps stdout clean)
        results = self.model(frame, verbose=False)
        
        detections = []
        for r in results:
            for box in r.boxes:
                class_id = int(box.cls[0])
                class_name = self.model.names.get(class_id, str(class_id))
                confidence = float(box.conf[0])
                bbox = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                
                detections.append({
                    'class_name': class_name,
                    'confidence': confidence,
                    'bounding_box': bbox
                })
                
        return detections
