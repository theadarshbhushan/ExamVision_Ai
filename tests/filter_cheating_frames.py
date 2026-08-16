import os
import shutil
import cv2
from ultralytics import YOLO

def main():
    print("=== ExamVision AI Cheating Frame Screener ===")
    
    model_path = os.path.join("models", "phone_chit_detector_v4.pt")
    if not os.path.exists(model_path):
        print(f"Error: Model not found at: {model_path}")
        return
        
    frames_dir = os.path.abspath(os.path.join("data", "labeling", "cctv_frames"))
    candidates_dir = os.path.abspath(os.path.join("data", "labeling", "cheating_candidates"))
    annotated_dir = os.path.abspath(os.path.join("data", "labeling", "cheating_candidates_annotated"))
    
    if not os.path.exists(frames_dir):
        print(f"Error: Frames directory not found: {frames_dir}")
        return
        
    os.makedirs(candidates_dir, exist_ok=True)
    os.makedirs(annotated_dir, exist_ok=True)
    
    # Load fine-tuned YOLO model
    print(f"Loading detector model: {model_path}...")
    model = YOLO(model_path)
    
    # Get all extracted JPEG images
    image_files = [f for f in os.listdir(frames_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"Screening {len(image_files)} frames...")
    
    cheating_classes = {0: "chits", 2: "peeking", 3: "phone", 4: "supplement-passing"}
    saved_count = 0
    
    for idx, filename in enumerate(image_files):
        img_path = os.path.join(frames_dir, filename)
        
        # Run YOLO with a low confidence threshold to capture all potential cheating candidates (recall-first)
        results = model.predict(img_path, conf=0.15, verbose=False)
        
        cheating_detections = []
        
        for r in results:
            for box in r.boxes:
                class_id = int(box.cls[0])
                conf = float(box.conf[0])
                if class_id in cheating_classes:
                    cheating_detections.append((class_id, conf, box.xyxy[0].tolist()))
                    
        if cheating_detections:
            # Copy original frame to candidates folder
            shutil.copy2(img_path, os.path.join(candidates_dir, filename))
            
            # Save annotated frame for easy visual review
            frame = cv2.imread(img_path)
            if frame is not None:
                for class_id, conf, bbox in cheating_detections:
                    class_name = cheating_classes[class_id]
                    x1, y1, x2, y2 = map(int, bbox)
                    
                    # Draw box and label
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    label = f"{class_name} {int(round(conf * 100))}%"
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                    
                cv2.imwrite(os.path.join(annotated_dir, filename), frame)
                
            saved_count += 1
            detected_summary = ", ".join([f"{cheating_classes[cid]} ({c:.0%})" for cid, c, _ in cheating_detections])
            print(f"  [{saved_count}] Detected in {filename}: {detected_summary}")
            
    print("\n" + "="*50)
    print("SCREENING COMPLETE")
    print(f"  Total Frames Screened:      {len(image_files)}")
    print(f"  Cheating Candidate Frames:  {saved_count}")
    print(f"  Original Files Saved:       {candidates_dir}")
    print(f"  Annotated Previews Saved:   {annotated_dir}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
