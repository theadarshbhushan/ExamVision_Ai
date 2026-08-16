import os
from ultralytics import YOLO

def main():
    print("=== Testing phone_moment.jpg with Model v4 ===")
    model_path = "models/phone_chit_detector_v4.pt"
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return
        
    model = YOLO(model_path)
    img_path = "phone_moment.jpg"
    
    if not os.path.exists(img_path):
        print(f"Warning: {img_path} not found. Creating it from CCTV 01 video...")
        import cv2
        cap = cv2.VideoCapture("data/test_footage/cctv_real/cctv_01_phone.mkv")
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_POS_MSEC, 15000)
            ret, frame = cap.read()
            if ret:
                cv2.imwrite(img_path, frame)
                print(f"Successfully extracted {img_path}")
            cap.release()
            
    if os.path.exists(img_path):
        for conf in [0.05, 0.15, 0.25]:
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
    else:
        print(f"Error: {img_path} could not be found or created.")

if __name__ == "__main__":
    main()
