import os
import cv2
import numpy as np

def extract_frame_at_index(cap, frame_idx):
    """
    Seeks to a specific frame index and reads the frame.
    """
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    return ret, frame

def get_event_peak_frame(video_path, event, event_id, motion_results=None):
    """
    Seeks the video source to extract the peak motion frame (or midpoint fallback)
    for a given motion event.
    
    Args:
        video_path (str): Path to input video file
        event (dict): Event data dictionary with keys: 'start_time', 'end_time', 'zone_id'
        event_id (int or str): Unique ID for the event
        motion_results (list, optional): Per-frame motion detector outputs used to locate peak intensity
        
    Returns:
        tuple: (frame, frame_idx, timestamp)
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Could not open video file: {video_path}")
        
    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 10.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        start_time = event['start_time']
        end_time = event['end_time']
        zone_id = event['zone_id']
        
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
                        
        after_frame_idx = int(round(after_time * fps))
        
        # Clamp frame indices to valid video range
        if total_frames > 0:
            after_frame_idx = max(0, min(after_frame_idx, total_frames - 1))
            
        ret, frame = extract_frame_at_index(cap, after_frame_idx)
        if not ret or frame is None:
            print(f"Warning: Failed to extract peak frame for event #{event_id} at index {after_frame_idx}")
            return None, after_frame_idx, after_time
            
        return frame, after_frame_idx, round(after_time, 2)
        
    finally:
        cap.release()
