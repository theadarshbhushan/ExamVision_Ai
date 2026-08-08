import os
import cv2

def extract_frame_at_time(cap, timestamp_sec, fps, total_frames):
    """
    Seeks to a specific timestamp in seconds and reads the frame.
    Uses frame index calculations for maximum accuracy and determinism.
    """
    frame_idx = int(round(timestamp_sec * fps))
    if total_frames > 0:
        frame_idx = max(0, min(frame_idx, total_frames - 1))
        
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    return ret, frame

def generate_snapshots(video_path, event, event_id, motion_results=None, before_offset=1.0):
    """
    Extracts two snapshot frames for a motion event:
    1. Before event: frame from event['start_time'] - before_offset seconds (capped at 0.0)
    2. After/Peak event: frame from peak intensity within the event window (or midpoint fallback)
    
    Args:
        video_path (str): Path to input video file
        event (dict): Event data dictionary with keys: 'start_time', 'end_time', 'zone_id'
        event_id (int or str): Unique ID for naming the snapshot files
        motion_results (list, optional): Per-frame motion detector outputs used to locate peak intensity
        before_offset (float): Offset in seconds to capture the 'before' baseline frame
        
    Returns:
        dict: Metadata containing paths, timestamps, and identifiers
    """
    # 1. Open the video source
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Could not open video file: {video_path}")
        
    try:
        # 2. Retrieve video parameters
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 10.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # 3. Calculate timestamps
        start_time = event['start_time']
        end_time = event['end_time']
        zone_id = event['zone_id']
        
        # Calculate 'before' time (clamped at 0.0)
        before_time = max(0.0, start_time - before_offset)
        
        # Calculate 'after' time (peak motion frame or midpoint fallback)
        after_time = (start_time + end_time) / 2.0
        if motion_results:
            max_intensity = -1.0
            for res in motion_results:
                t = res['timestamp_sec']
                if start_time <= t <= end_time:
                    intensity = res['zone_intensities'].get(zone_id, 0.0)
                    if intensity > max_intensity:
                        max_intensity = intensity
                        after_time = t

        # 4. Extract frames from video
        ret_before, before_frame = extract_frame_at_time(cap, before_time, fps, total_frames)
        ret_after, after_frame = extract_frame_at_time(cap, after_time, fps, total_frames)
        
        if not ret_before:
            print(f"Warning: Failed to extract 'before' frame at {before_time}s.")
        if not ret_after:
            print(f"Warning: Failed to extract 'after' frame at {after_time}s.")

        # 5. Save frames to directory
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        output_dir = os.path.join("data", "snapshots", video_name)
        os.makedirs(output_dir, exist_ok=True)
        
        before_filename = f"event_{event_id}_before.jpg"
        after_filename = f"event_{event_id}_after.jpg"
        
        before_path = os.path.join(output_dir, before_filename)
        after_path = os.path.join(output_dir, after_filename)
        
        if ret_before and before_frame is not None:
            cv2.imwrite(before_path, before_frame)
        if ret_after and after_frame is not None:
            cv2.imwrite(after_path, after_frame)
            
        # 6. Return metadata dictionary
        return {
            'event_id': event_id,
            'before_path': before_path,
            'after_path': after_path,
            'timestamp': round(after_time, 2),
            'zone_id': zone_id
        }
        
    finally:
        cap.release()
