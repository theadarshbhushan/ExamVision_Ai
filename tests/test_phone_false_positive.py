import os
import sys
import pytest
from ultralytics import YOLO

# Add root folder to python path so we can import src modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

def test_event_02_no_false_positive_chits():
    """
    Regression Test: Ensures that the phone-only image event_02 does not
    generate a high-confidence false positive detection for class 'chits'.
    """
    model_path = os.path.join("models", "phone_chit_detector_v4.pt")
    assert os.path.exists(model_path), f"Retrained model weights not found at: {model_path}"
    
    model = YOLO(model_path)
    
    img_path = os.path.join(
        "data", "datasets", "phone_chit_detection", "new_labeled", "train", "images",
        "event_02_jpg.rf.eada98dc5081567b785d7859d668454a.jpg"
    )
    assert os.path.exists(img_path), f"Problematic test image not found at: {img_path}"
    
    results = model.predict(img_path, conf=0.25, verbose=False)
    
    phone_detected = False
    chits_detected = False
    chits_conf = 0.0
    
    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = model.names.get(class_id, str(class_id))
            
            if class_name == "phone":
                phone_detected = True
            elif class_name == "chits":
                chits_detected = True
                chits_conf = max(chits_conf, confidence)
                
    # Phone should be detected with high confidence
    assert phone_detected, "Expected phone detection on event_02 image, but none was found."
    
    # Chits should not be detected with high confidence (must be below 0.40 confidence)
    if chits_detected:
        assert chits_conf < 0.40, f"False positive 'chits' detected on event_02 image with high confidence: {chits_conf:.4f}"
