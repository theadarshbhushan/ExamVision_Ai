import os
import glob
import cv2
import sys

# Add src folder to python path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.detection.detector import YOLODetector

def main():
    print("=== Running Manual Detection Verification Test ===")
    
    # 1. Instantiate the YOLODetector
    try:
        detector = YOLODetector()
    except FileNotFoundError:
        print("Test failed: Model is not trained yet. Please run src/detection/train_detector.py.")
        return
        
    # 2. Find sample images from the validation split
    valid_images_path = os.path.join(
        "data", "datasets", "phone_chit_detection", "cheating_dataset", "valid", "images"
    )
    image_files = glob.glob(os.path.join(valid_images_path, "*.jpg"))
    if not image_files:
        image_files = glob.glob(os.path.join(valid_images_path, "*.jpeg"))
        
    if not image_files:
        print(f"Error: No validation images found in: {valid_images_path}")
        return
        
    # Test on up to 3 sample images
    samples_to_test = image_files[:3]
    print(f"Found {len(image_files)} validation images. Testing on {len(samples_to_test)} samples...")
    
    vis_dir = os.path.join("data", "visualizations", "detections")
    os.makedirs(vis_dir, exist_ok=True)
    
    for idx, img_path in enumerate(samples_to_test):
        print(f"\nProcessing Sample #{idx+1}: {os.path.basename(img_path)}")
        frame = cv2.imread(img_path)
        if frame is None:
            print("  Error: Could not read image.")
            continue
            
        detections = detector.detect_objects(frame)
        print(f"  Detections: {len(detections)}")
        
        # Draw bounding boxes
        annotated_frame = frame.copy()
        for d in detections:
            class_name = d['class_name']
            conf = d['confidence']
            bbox = d['bounding_box']
            print(f"    - {class_name} ({conf:.2f}): {bbox}")
            
            # Draw bbox
            x1, y1, x2, y2 = map(int, bbox)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            # Label
            label = f"{class_name} {conf:.2f}"
            cv2.putText(annotated_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
        # Save output
        out_path = os.path.join(vis_dir, f"detected_{os.path.basename(img_path)}")
        cv2.imwrite(out_path, annotated_frame)
        print(f"  Saved visual confirmation to: {os.path.abspath(out_path)}")
        
    print("\nVerification script finished.")

if __name__ == "__main__":
    main()
