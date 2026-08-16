import os
import cv2
import glob
import shutil
from ultralytics import YOLO

# Configurable Parameters at the top of the script
MODEL_PATH = os.path.abspath("models/phone_chit_detector_v4.pt")
YOLO_CONF_THRESHOLD = 0.01

def extract_frames_from_video(video_path, output_dir, model):
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video: {video_path}")
        return 0, 0
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0 # Fallback
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps
    
    print(f"  FPS: {fps:.2f} | Total Frames: {total_frames} | Duration: {duration_sec:.1f}s")
    
    scanned_count = 0
    saved_count = 0
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract 1 frame per second
    for second in range(int(duration_sec)):
        frame_idx = int(round(second * fps))
        if frame_idx >= total_frames:
            break
            
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        
        if ret and frame is not None:
            scanned_count += 1
            # Run YOLO filtering at low threshold
            results = model(frame, conf=YOLO_CONF_THRESHOLD, verbose=False)
            trigger_yolo = len(results[0].boxes) > 0
            
            if trigger_yolo:
                output_filename = f"{video_name}_t{second:03d}.jpg"
                output_path = os.path.join(output_dir, output_filename)
                cv2.imwrite(output_path, frame)
                saved_count += 1
            
    cap.release()
    ratio = (saved_count / scanned_count * 100) if scanned_count > 0 else 0
    print(f"  Scanned: {scanned_count} | Saved: {saved_count} | Saved Ratio: {ratio:.1f}%")
    return scanned_count, saved_count

def main():
    print("=== ExamVision AI CCTV Frame Extractor with YOLO Filtering ===")
    
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}")
        return
        
    input_dir = os.path.abspath(os.path.join("data", "test_footage", "cctv_real"))
    output_dir = os.path.abspath(os.path.join("data", "labeling", "cctv_frames"))
    
    if not os.path.exists(input_dir):
        print(f"Error: Input directory not found: {input_dir}")
        return
        
    video_extensions = ["*.mp4", "*.mkv", "*.avi", "*.mov", "*.webm"]
    video_paths = []
    for ext in video_extensions:
        video_paths.extend(glob.glob(os.path.join(input_dir, ext)))
        
    video_paths = sorted(list(set(video_paths)))
    
    if not video_paths:
        print(f"No video files found in: {input_dir}")
        return
        
    print(f"Loading YOLO filtering model from: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    
    print(f"Found {len(video_paths)} videos to process.")
    total_scanned = 0
    total_saved = 0
    
    # Clean output folder first to ensure a clean filtered run
    if os.path.exists(output_dir):
        print(f"Cleaning existing output directory {output_dir}...")
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    for idx, video_path in enumerate(video_paths):
        print(f"\n[{idx+1}/{len(video_paths)}] Processing: {os.path.basename(video_path)}")
        scanned, saved = extract_frames_from_video(video_path, output_dir, model)
        total_scanned += scanned
        total_saved += saved
        
    final_ratio = (total_saved / total_scanned * 100) if total_scanned > 0 else 0
    print("\n" + "="*60)
    print("FRAME EXTRACTION & FILTERING SUMMARY")
    print("="*60)
    print(f"  Total Videos Processed: {len(video_paths)}")
    print(f"  Total Frames Scanned:   {total_scanned}")
    print(f"  Total Frames Saved:     {total_saved}")
    print(f"  Overall Saved Ratio:    {final_ratio:.1f}%")
    print(f"  Output Location:        {output_dir}")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
