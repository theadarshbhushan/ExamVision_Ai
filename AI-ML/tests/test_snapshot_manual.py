import os
import glob
import sys
import cv2

# Add src folder to python path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.motion.motion_detector import MotionDetector
from src.motion.event_segmenter import EventSegmenter
from src.snapshot.snapshot_generator import get_event_peak_frame

def main():
    print("=== Running Manual Snapshot Integration Test ===")
    
    # 1. Resolve target video path (most recent recording)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    self_recorded_dir = os.path.join(base_dir, "data", "self_recorded")
    video_files = []
    if os.path.exists(self_recorded_dir):
        for file in os.listdir(self_recorded_dir):
            if file.lower().endswith((".mp4", ".avi", ".mov", ".mkv")):
                full_path = os.path.join(self_recorded_dir, file)
                if os.path.isfile(full_path):
                    video_files.append(full_path)
                    
    if video_files:
        video_files.sort(key=os.path.getmtime, reverse=True)
        video_path = video_files[0]
        print(f"Automatically selected the most recent recording: {video_path}")
    else:
        video_path = os.path.join(base_dir, "tests", "debug_artifacts", "test_video.avi")
        print(f"No self-recorded clips found. Falling back to default: {video_path}")
        
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        return

    # 2. Run Motion Detection Pipeline
    print("\nRunning motion detector...")
    motion_config = {
        'subtractor_type': 'MOG2',
        'history': 500,
        'var_threshold': 16,
        'detect_shadows': True,
        'morph_kernel_size': 3,
        'morph_iterations': 1,
        'morph_ops': [('open', 1), ('close', 1)],
        'min_contour_area': 150,
        'learning_rate': 0.002,
        'grid_rows': 3,
        'grid_cols': 3,
        'motion_threshold': 0.02,
        'vibration_suppression_enabled': True,
        'vibration_intensity_threshold': 0.01,
        'vibration_active_zone_ratio': 0.70
    }
    detector = MotionDetector(config=motion_config)
    motion_results = detector.detect_motion(video_path)
    print(f"Processed {len(motion_results)} frames.")

    # 3. Segment Events
    print("Segmenting events...")
    segmenter_config = {
        'motion_threshold': 0.02,
        'min_event_frames': 4,
        'max_gap_frames': 8
    }
    segmenter = EventSegmenter(config=segmenter_config)
    events = segmenter.segment_events(motion_results)
    print(f"Detected {len(events)} events.")

    # 4. Generate Snapshots
    print("\nExtracting and saving event peak frames...")
    snapshots_created = 0
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    out_dir = os.path.join("data", "snapshots", video_name)
    os.makedirs(out_dir, exist_ok=True)
    
    for idx, ev in enumerate(events):
        event_id = f"{idx+1:02d}"
        frame, frame_idx, timestamp = get_event_peak_frame(
            video_path=video_path,
            event=ev,
            event_id=event_id,
            motion_results=motion_results
        )
        
        if frame is not None:
            peak_path = os.path.join(out_dir, f"event_{event_id}_peak.jpg")
            cv2.imwrite(peak_path, frame)
            snapshots_created += 1
            print(f"  Event #{event_id}: Zone {ev['zone_id']} | Peak frame {frame_idx} ({timestamp}s) saved to {os.path.basename(peak_path)}")
            
    # 5. Print Summary
    print("\n" + "="*50)
    print("SNAPSHOT GENERATION SUMMARY")
    print(f"  Total Events:          {len(events)}")
    print(f"  Peak Frames Saved:     {snapshots_created} / {len(events)}")
    print(f"  Storage Location:      {os.path.abspath(out_dir)}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
