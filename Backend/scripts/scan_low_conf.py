import os
import sys

# Add AI-ML root to path
sys.path.append(r"D:\ExamVision_Ai\AI-ML")

from ultralytics import YOLO

def main():
    model_path = r"D:\ExamVision_Ai\AI-ML\models\phone_chit_detector_v4.pt"
    debug_dir = r"D:\ExamVision_Ai\AI-ML\data\debug\yolo_input_frames"
    
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return
        
    print(f"Loading YOLO model: {model_path}")
    model = YOLO(model_path)
    
    print(f"Scanning frames in: {debug_dir} with conf=0.01...")
    
    found_any = False
    for filename in sorted(os.listdir(debug_dir)):
        if not filename.startswith("event_") or not filename.endswith(".jpg"):
            continue
            
        filepath = os.path.join(debug_dir, filename)
        
        # Run inference with conf=0.01
        results = model(filepath, conf=0.01, verbose=False)
        
        for r in results:
            if len(r.boxes) > 0:
                print(f"\n[DETECTED] Frame: {filename}")
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names.get(class_id, str(class_id))
                    confidence = float(box.conf[0])
                    bbox = box.xyxy[0].tolist()
                    print(f"  Class: {class_name} | Conf: {confidence:.4f} | BBox: {[round(x, 2) for x in bbox]}")
                found_any = True
                
    if not found_any:
        print("\nGenuinely nothing detected in any frame, even at conf=0.01 threshold.")

if __name__ == "__main__":
    main()
