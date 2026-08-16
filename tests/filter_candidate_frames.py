import os
import shutil
import re
import cv2
import numpy as np
from ultralytics import YOLO

# Configuration Parameters
MODEL_PATH = os.path.abspath("models/phone_chit_detector_v4.pt")
INPUT_DIR = os.path.abspath("data/labeling/cctv_frames")
OUTPUT_DIR = os.path.abspath("data/labeling/candidates_for_review")

# Threshold ratios relative to video averages
SKIN_MULTIPLE = 1.1          # Flag skin if it is > 1.1x the video's average skin pixels
MOTION_MULTIPLE = 1.3        # Flag motion if it is > 1.3x the video's average motion pixels

# Absolute minimum pixel thresholds to prevent false positives from tiny fluctuations
MIN_SKIN_PIXELS = 500
MIN_MOTION_PIXELS = 1000

DESK_Y_START_RATIO = 0.40    # Only analyze bottom 60% of frame (desk region)
YOLO_CONF_THRESHOLD = 0.01   # YOLO conf threshold for object-like signal

def extract_video_and_time(filename):
    match = re.search(r"^(.*?)(?:_t(\d+))\.([a-zA-Z]+)$", filename)
    return (match.group(1), int(match.group(2))) if match else (None, None)

def detect_skin(desk_roi):
    """
    Detects skin-colored pixels in the desk region using robust YCrCb color space.
    """
    ycrcb = cv2.cvtColor(desk_roi, cv2.COLOR_BGR2YCrCb)
    # Standard Cr/Cb skin cluster bounds
    lower_skin = np.array([0, 133, 77], dtype=np.uint8)
    upper_skin = np.array([255, 173, 127], dtype=np.uint8)
    mask = cv2.inRange(ycrcb, lower_skin, upper_skin)
    return cv2.countNonZero(mask)

def detect_motion(desk_roi, prev_desk_roi):
    """
    Detects moving pixels in the desk region.
    """
    diff = cv2.absdiff(desk_roi, prev_desk_roi)
    gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)
    return cv2.countNonZero(thresh)

def main():
    print("=== ExamVision AI CCTV Candidate Frame Filter ===")
    
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}")
        return
        
    if not os.path.exists(INPUT_DIR):
        print(f"Error: Input directory not found at {INPUT_DIR}")
        return
        
    # Clean output folder from any previous runs to start fresh
    if os.path.exists(OUTPUT_DIR):
        print(f"Cleaning existing output directory {OUTPUT_DIR}...")
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Load YOLOv8 model
    print(f"Loading model: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    
    # 2. Group frames by video name
    all_files = sorted([f for f in os.listdir(INPUT_DIR) if f.lower().endswith((".jpg", ".jpeg", ".png"))])
    video_groups = {}
    for filename in all_files:
        video_name, time_index = extract_video_and_time(filename)
        if video_name:
            if video_name not in video_groups:
                video_groups[video_name] = []
            video_groups[video_name].append((time_index, filename))
            
    print(f"Grouped {len(all_files)} files into {len(video_groups)} video sources.")
    
    # 3. PASS 1: Calculate video-specific baselines
    print("\n--- PASS 1: Calculating video-specific skin/motion baselines ---")
    video_stats = {}
    for video_name, frames in sorted(video_groups.items()):
        frames.sort()
        prev_desk_roi = None
        skin_list = []
        motion_list = []
        
        for time_index, filename in frames:
            img = cv2.imread(os.path.join(INPUT_DIR, filename))
            if img is None: continue
            h, w, c = img.shape
            desk_roi = img[int(h * DESK_Y_START_RATIO):h, :]
            
            skin_pixels = detect_skin(desk_roi)
            skin_list.append(skin_pixels)
            
            if prev_desk_roi is not None:
                motion_pixels = detect_motion(desk_roi, prev_desk_roi)
                motion_list.append(motion_pixels)
                
            prev_desk_roi = desk_roi.copy()
            
        avg_skin = np.mean(skin_list) if skin_list else 0
        avg_motion = np.mean(motion_list) if motion_list else 0
        video_stats[video_name] = {"avg_skin": avg_skin, "avg_motion": avg_motion}
        print(f"  {video_name:<20} | Avg Skin: {avg_skin:<8.1f} px | Avg Motion: {avg_motion:<8.1f} px")
        
    # 4. PASS 2: Apply adaptive thresholds and copy candidate frames
    print("\n--- PASS 2: Filtering and copying candidate frames ---")
    total_scanned = 0
    flagged_yolo = 0
    flagged_heuristic = 0
    flagged_both = 0
    total_flagged = 0
    
    for video_name, frames in sorted(video_groups.items()):
        frames.sort()
        prev_desk_roi = None
        stats = video_stats[video_name]
        
        for time_index, filename in frames:
            img_path = os.path.join(INPUT_DIR, filename)
            img = cv2.imread(img_path)
            if img is None: continue
            
            total_scanned += 1
            h, w, c = img.shape
            desk_roi = img[int(h * DESK_Y_START_RATIO):h, :]
            
            # Skin heuristic check
            skin_pixels = detect_skin(desk_roi)
            has_skin_spike = skin_pixels > (SKIN_MULTIPLE * stats["avg_skin"])
            
            # Motion heuristic check
            motion_pixels = 0
            has_motion_spike = False
            if prev_desk_roi is not None:
                motion_pixels = detect_motion(desk_roi, prev_desk_roi)
                has_motion_spike = motion_pixels > (MOTION_MULTIPLE * stats["avg_motion"])
                
            trigger_heuristic = (
                skin_pixels > MIN_SKIN_PIXELS and 
                motion_pixels > MIN_MOTION_PIXELS and 
                has_skin_spike and 
                has_motion_spike
            )
            
            # YOLO check
            results = model(img, conf=YOLO_CONF_THRESHOLD, verbose=False)
            trigger_yolo = len(results[0].boxes) > 0
            
            if trigger_yolo or trigger_heuristic:
                total_flagged += 1
                dst_path = os.path.join(OUTPUT_DIR, filename)
                shutil.copy2(img_path, dst_path)
                
                if trigger_yolo and trigger_heuristic:
                    flagged_both += 1
                elif trigger_yolo:
                    flagged_yolo += 1
                else:
                    flagged_heuristic += 1
                    
                reasons = []
                if trigger_yolo:
                    classes = [model.names[int(b.cls[0])] for b in results[0].boxes]
                    reasons.append(f"YOLO conf>=0.01: {classes}")
                if trigger_heuristic:
                    reasons.append(f"Heur (Skin: {skin_pixels} px, Motion: {motion_pixels} px)")
                    
                print(f"  Flagged candidate {filename} | {', '.join(reasons)}")
                
            prev_desk_roi = desk_roi.copy()
            
    print("\n" + "="*60)
    print("CCTV FRAME FILTERING SUMMARY REPORT (ADAPTIVE)")
    print("="*60)
    print(f"  Total Frames Scanned:         {total_scanned}")
    print(f"  Flagged by YOLO only:         {flagged_yolo}")
    print(f"  Flagged by Heuristics only:   {flagged_heuristic}")
    print(f"  Flagged by BOTH (YOLO + H):   {flagged_both}")
    print(f"  Total Flagged Candidates:      {total_flagged}")
    print(f"  Candidate Review Location:    {OUTPUT_DIR}")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
