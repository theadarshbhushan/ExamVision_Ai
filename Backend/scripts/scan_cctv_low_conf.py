import os
import sys
from ultralytics import YOLO

def scan_directory(dir_path, model):
    if not os.path.exists(dir_path):
        print(f"Directory {dir_path} does not exist.")
        return
        
    print(f"\nScanning: {dir_path} with conf=0.01...")
    found_any = False
    
    # Sort files naturally
    filenames = sorted(os.listdir(dir_path), key=lambda x: int(x.split('_')[1].split('.')[0]) if '_' in x and x.split('_')[1].split('.')[0].isdigit() else 0)
    
    for filename in filenames:
        if not filename.endswith(".jpg"):
            continue
            
        filepath = os.path.join(dir_path, filename)
        results = model(filepath, conf=0.01, verbose=False)
        
        for r in results:
            if len(r.boxes) > 0:
                print(f"  [DETECTED] Frame: {filename}")
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names.get(class_id, str(class_id))
                    confidence = float(box.conf[0])
                    bbox = box.xyxy[0].tolist()
                    print(f"    Class: {class_name:<15} | Conf: {confidence:.4f} | BBox: {[round(x, 2) for x in bbox]}")
                found_any = True
                
    if not found_any:
        print("  Genuinely nothing detected in this directory at conf=0.01.")

def main():
    model_path = r"D:\ExamVision_Ai\AI-ML\models\phone_chit_detector_v4.pt"
    model = YOLO(model_path)
    
    cctv02_dir = r"D:\ExamVision_Ai\AI-ML\data\snapshots\cctv_02_phone\reference"
    cctv03_dir = r"D:\ExamVision_Ai\AI-ML\data\snapshots\cctv_03_phone\reference"
    
    scan_directory(cctv02_dir, model)
    scan_directory(cctv03_dir, model)

if __name__ == "__main__":
    main()
