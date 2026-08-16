import os
from ultralytics import YOLO

def main():
    print("=== Testing cctv_06 chit detection with Model v5 ===")
    model_path = "models/phone_chit_detector_v5.pt"
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return
        
    model = YOLO(model_path)
    img_path = "data/datasets/phone_chit_detection/cctv_labeled_v2/train/images/cctv_06_scan_011_t22-0s_jpg.rf.ce0f05722201934f3f2d32dda2abfdbd.jpg"
    
    if not os.path.exists(img_path):
        print(f"Error: Image not found at {img_path}")
        return
        
    for conf in [0.005, 0.01, 0.05]:
        print(f"\n--- Detections at conf >= {conf} ---")
        results = model.predict(img_path, conf=conf, verbose=False)
        found = False
        for r in results:
            for box in r.boxes:
                class_id = int(box.cls[0])
                box_conf = float(box.conf[0])
                name = r.names[class_id]
                xyxy = box.xyxy[0].tolist()
                xyxy_rounded = [round(v, 2) for v in xyxy]
                print(f"  Detected: {name} (conf={box_conf:.4f}) at bbox={xyxy_rounded}")
                found = True
        if not found:
            print("  No detections.")

if __name__ == "__main__":
    main()
