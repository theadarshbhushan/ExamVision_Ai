import os
import cv2
import numpy as np
import glob

def make_preview_contact_sheet(video_path, output_dir):
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    output_path = os.path.join(output_dir, f"{video_name}_preview.jpg")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video: {video_path}")
        return False
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0 # Fallback
        
    if total_frames <= 0:
        print(f"Warning: Video {video_name} has invalid frame count: {total_frames}")
        return False
        
    # Calculate 6 evenly-spaced frame indices
    indices = [int(i * (total_frames - 1) / 5) for i in range(6)]
    
    frames = []
    target_width = 400
    target_height = None
    
    for i, idx in enumerate(indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        
        # Calculate timestamp
        timestamp_sec = idx / fps
        minutes = int(timestamp_sec // 60)
        seconds = timestamp_sec % 60
        time_str = f"{minutes:02d}:{seconds:05.2f}"
        
        # Setup dimensions if not done yet
        if ret and frame is not None:
            h, w = frame.shape[:2]
            if target_height is None:
                target_height = int(h * target_width / w)
            frame_resized = cv2.resize(frame, (target_width, target_height))
        else:
            # Placeholder black frame
            if target_height is None:
                target_height = 300 # Fallback
            frame_resized = np.zeros((target_height, target_width, 3), dtype=np.uint8)
            time_str = "Error/Missing"
            
        # Draw clean overlay text with a dark background banner for readability
        label_text = f"Frame {idx} ({time_str})"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.4
        thickness = 1
        text_size, _ = cv2.getTextSize(label_text, font, font_scale, thickness)
        
        # Draw background rectangle
        bg_x1, bg_y1 = 10, 10
        bg_x2 = bg_x1 + text_size[0] + 10
        bg_y2 = bg_y1 + text_size[1] + 8
        cv2.rectangle(frame_resized, (bg_x1, bg_y1), (bg_x2, bg_y2), (0, 0, 0), -1)
        
        # Draw text in white
        text_x = bg_x1 + 5
        text_y = bg_y1 + text_size[1] + 4
        cv2.putText(frame_resized, label_text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
        
        # Add thin outer border around each grid cell
        cv2.rectangle(frame_resized, (0, 0), (target_width - 1, target_height - 1), (50, 50, 50), 1)
        
        frames.append(frame_resized)
        
    cap.release()
    
    # Check if we successfully gathered 6 frames
    if len(frames) != 6:
        print(f"Error: Failed to extract 6 frames from {video_name}")
        return False
        
    # Arrange frames into a 2x3 grid
    row1 = np.hstack([frames[0], frames[1], frames[2]])
    row2 = np.hstack([frames[3], frames[4], frames[5]])
    contact_sheet = np.vstack([row1, row2])
    
    # Save the contact sheet
    os.makedirs(output_dir, exist_ok=True)
    cv2.imwrite(output_path, contact_sheet)
    print(f"Saved contact-sheet preview: {output_path}")
    return True

def main():
    print("=== ExamVision AI CCTV Footage Preview Generator ===")
    
    input_dir = os.path.abspath(os.path.join("data", "test_footage", "cctv_real"))
    output_dir = os.path.abspath(os.path.join("data", "test_footage", "previews"))
    
    if not os.path.exists(input_dir):
        print(f"Error: Input directory not found: {input_dir}")
        return
        
    # Support multiple common video formats
    video_extensions = ["*.mp4", "*.mkv", "*.avi", "*.mov", "*.webm"]
    video_paths = []
    for ext in video_extensions:
        video_paths.extend(glob.glob(os.path.join(input_dir, ext)))
        
    # Sort for deterministic processing order
    video_paths = sorted(list(set(video_paths)))
    
    if not video_paths:
        print(f"No video files found in: {input_dir}")
        return
        
    print(f"Found {len(video_paths)} videos to process.")
    success_count = 0
    
    for idx, video_path in enumerate(video_paths):
        print(f"[{idx+1}/{len(video_paths)}] Processing: {os.path.basename(video_path)}")
        if make_preview_contact_sheet(video_path, output_dir):
            success_count += 1
            
    print(f"\nFinished! Successfully created {success_count}/{len(video_paths)} previews under:\n{output_dir}")

if __name__ == "__main__":
    main()
