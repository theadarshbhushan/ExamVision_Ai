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

def extract_frame_at_time(cap, timestamp_sec, fps, total_frames):
    """
    Seeks to a specific timestamp in seconds and reads the frame.
    Uses frame index calculations for maximum accuracy and determinism.
    """
    frame_idx = int(round(timestamp_sec * fps))
    if total_frames > 0:
        frame_idx = max(0, min(frame_idx, total_frames - 1))
        
    return extract_frame_at_index(cap, frame_idx)

def get_zone_bbox(zone_id, w, h, grid_rows=3, grid_cols=3, custom_zones=None):
    """
    Retrieves the bounding box coordinates (x_start, y_start, x_end, y_end) for a given zone.
    Supports standard grids and custom irregular zones.
    """
    if custom_zones:
        for idx, item in enumerate(custom_zones):
            if isinstance(item, dict):
                z_id = item.get('id', idx)
                bbox = item['bbox']
            else:
                z_id = idx
                bbox = item
            if z_id == zone_id:
                x_min, y_min, x_max, y_max = bbox
                return int(x_min * w), int(y_min * h), int(x_max * w), int(y_max * h)
    else:
        cell_h = h / grid_rows
        cell_w = w / grid_cols
        r = zone_id // grid_cols
        c = zone_id % grid_cols
        y_start = int(r * cell_h)
        y_end = int((r + 1) * cell_h) if r < grid_rows - 1 else h
        x_start = int(c * cell_w)
        x_end = int((c + 1) * cell_w) if c < grid_cols - 1 else w
        return x_start, y_start, x_end, y_end
    return None

def generate_snapshots(video_path, event, event_id, motion_results=None, before_offset=1.0, grid_rows=3, grid_cols=3, custom_zones=None):
    """
    Extracts two snapshot frames for a motion event:
    1. Before event: baseline frame extracted with minimum frame gap and back-offset logic
    2. After/Peak event: frame from peak intensity within the event window (or midpoint fallback)
    
    Args:
        video_path (str): Path to input video file
        event (dict): Event data dictionary with keys: 'start_time', 'end_time', 'zone_id'
        event_id (int or str): Unique ID for naming the snapshot files
        motion_results (list, optional): Per-frame motion detector outputs used to locate peak intensity
        before_offset (float): Offset in seconds to capture the 'before' baseline frame
        grid_rows (int): Number of rows in grid
        grid_cols (int): Number of columns in grid
        custom_zones (list, optional): Custom irregular zones mapping
        
    Returns:
        dict: Metadata containing paths, timestamps, identifiers, and pixel similarity diff
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

        # 3. Calculate timestamps and frame indices
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

        # Convert after_time to frame index
        after_frame_idx = int(round(after_time * fps))
        
        # Enforce minimum frame gap (adjust based on video's FPS)
        min_frame_gap = max(10, int(round(fps * 0.5)))
        
        # Calculate initial 'before' time and index
        before_time = max(0.0, start_time - before_offset)
        before_frame_idx = int(round(before_time * fps))
        
        # If the gap is too small, extend "before" further back (e.g., 2.0s instead of before_offset)
        if after_frame_idx - before_frame_idx < min_frame_gap:
            extended_offset = max(2.0, before_offset + 1.0)
            before_time = max(0.0, start_time - extended_offset)
            before_frame_idx = int(round(before_time * fps))
            
            # If the gap is still too small, force it by adjusting frame indices
            if after_frame_idx - before_frame_idx < min_frame_gap:
                before_frame_idx = after_frame_idx - min_frame_gap
                
        # Clamp frame indices to valid video range
        if total_frames > 0:
            after_frame_idx = max(0, min(after_frame_idx, total_frames - 1))
            before_frame_idx = max(0, min(before_frame_idx, total_frames - 1))
            
            # If clamping reduced the gap below min_frame_gap, adjust within video bounds
            if after_frame_idx - before_frame_idx < min_frame_gap:
                before_frame_idx = max(0, after_frame_idx - min_frame_gap)
                if after_frame_idx - before_frame_idx < min_frame_gap:
                    after_frame_idx = min(total_frames - 1, before_frame_idx + min_frame_gap)

        print(f"DEBUG: Event #{event_id} | Zone: {zone_id} | start_time: {start_time:.2f}s | end_time: {end_time:.2f}s | before_frame_idx: {before_frame_idx} | after_frame_idx: {after_frame_idx} | Gap: {after_frame_idx - before_frame_idx}")

        # 4. Extract frames from video
        ret_before, before_frame = extract_frame_at_index(cap, before_frame_idx)
        ret_after, after_frame = extract_frame_at_index(cap, after_frame_idx)
        
        if not ret_before:
            print(f"Warning: Failed to extract 'before' frame at index {before_frame_idx}.")
        if not ret_after:
            print(f"Warning: Failed to extract 'after' frame at index {after_frame_idx}.")

        # Crop frames to zone boundaries with 10% padding margin
        before_cropped = None
        after_cropped = None
        
        if ret_before and before_frame is not None:
            bh, bw = before_frame.shape[:2]
            coords = get_zone_bbox(zone_id, bw, bh, grid_rows, grid_cols, custom_zones)
            if coords is not None:
                x_start, y_start, x_end, y_end = coords
                pad_w = int((x_end - x_start) * 0.10)
                pad_h = int((y_end - y_start) * 0.10)
                crop_x_start = max(0, x_start - pad_w)
                crop_y_start = max(0, y_start - pad_h)
                crop_x_end = min(bw, x_end + pad_w)
                crop_y_end = min(bh, y_end + pad_h)
                before_cropped = before_frame[crop_y_start:crop_y_end, crop_x_start:crop_x_end]
            else:
                before_cropped = before_frame
                
        if ret_after and after_frame is not None:
            ah, aw = after_frame.shape[:2]
            coords = get_zone_bbox(zone_id, aw, ah, grid_rows, grid_cols, custom_zones)
            if coords is not None:
                x_start, y_start, x_end, y_end = coords
                pad_w = int((x_end - x_start) * 0.10)
                pad_h = int((y_end - y_start) * 0.10)
                crop_x_start = max(0, x_start - pad_w)
                crop_y_start = max(0, y_start - pad_h)
                crop_x_end = min(aw, x_end + pad_w)
                crop_y_end = min(ah, y_end + pad_h)
                after_cropped = after_frame[crop_y_start:crop_y_end, crop_x_start:crop_x_end]
            else:
                after_cropped = after_frame

        # 5. Sanity check: Compute difference metric between cropped frames
        mean_diff = None
        if before_cropped is not None and after_cropped is not None:
            if before_cropped.shape == after_cropped.shape:
                diff = cv2.absdiff(before_cropped, after_cropped)
                mean_diff = float(diff.mean())
                if mean_diff < 1.0:
                    print(f"Warning: Event #{event_id} before and after cropped frames are suspiciously similar "
                          f"(mean absolute pixel difference: {mean_diff:.4f}).")

        # Save frames to directory
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        output_dir = os.path.join("data", "snapshots", video_name)
        os.makedirs(output_dir, exist_ok=True)
        
        before_filename = f"event_{event_id}_before.jpg"
        after_filename = f"event_{event_id}_after.jpg"
        before_full_filename = f"event_{event_id}_before_full.jpg"
        after_full_filename = f"event_{event_id}_after_full.jpg"
        
        before_path = os.path.join(output_dir, before_filename)
        after_path = os.path.join(output_dir, after_filename)
        before_full_path = os.path.join(output_dir, before_full_filename)
        after_full_path = os.path.join(output_dir, after_full_filename)
        
        if before_cropped is not None:
            cv2.imwrite(before_path, before_cropped)
        if after_cropped is not None:
            cv2.imwrite(after_path, after_cropped)
        if ret_before and before_frame is not None:
            cv2.imwrite(before_full_path, before_frame)
        if ret_after and after_frame is not None:
            cv2.imwrite(after_full_path, after_frame)
            
        # 6. Return metadata dictionary
        return {
            'event_id': event_id,
            'before_path': before_path,
            'after_path': after_path,
            'before_full_path': before_full_path,
            'after_full_path': after_full_path,
            'timestamp': round(after_frame_idx / fps, 2),
            'after_frame_idx': after_frame_idx,
            'zone_id': zone_id,
            'pixel_diff': mean_diff
        }
        
    finally:
        cap.release()
