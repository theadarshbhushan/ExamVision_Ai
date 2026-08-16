import os
from ultralytics import YOLO

def main():
    print("=== Checking striped sleeve false positive ===")
    model = YOLO("models/phone_chit_detector_v4.pt")
    
    # We saved phone_moment.jpg earlier which has the student in the striped shirt
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
            cap.release()
            
    if os.path.exists(img_path):
        results = model.predict(img_path, conf=0.15)
        detections = []
        for r in results:
            for box in r.boxes:
                class_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = r.names[class_id]
                detections.append((name, conf))
                
        print(f"Detections at conf>=0.15: {detections}")
        chits_detections = [d for d in detections if d[0] == "chits"]
        if not chits_detections:
            print("SUCCESS: No false positive chits detected on the striped shirt sleeve!")
        else:
            print("FAILED: False positive chits still detected on the sleeve.")
    else:
        print("Error: Could not obtain phone_moment.jpg")

if __name__ == "__main__":
    main()
