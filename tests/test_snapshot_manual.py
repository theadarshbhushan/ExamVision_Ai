import os
import glob
import sys

# Add src folder to python path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.motion.motion_detector import MotionDetector
from src.motion.event_segmenter import EventSegmenter
from src.snapshot.snapshot_generator import generate_snapshots

def main():
    print("=== Running Manual Snapshot Integration Test ===")
    
    # 1. Resolve target video path (most recent recording)
    self_recorded_dir = os.path.join("data", "self_recorded")
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
        video_path = "test_video.avi"
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

    # 4. Generate Snapshot Pairs
    print("\nGenerating before/after snapshot pairs...")
    snapshots_created = 0
    snapshot_meta = []
    
    for idx, ev in enumerate(events):
        event_id = f"{idx+1:02d}"
        meta = generate_snapshots(
            video_path=video_path,
            event=ev,
            event_id=event_id,
            motion_results=motion_results,
            before_offset=1.0,
            grid_rows=motion_config.get('grid_rows', 3),
            grid_cols=motion_config.get('grid_cols', 3),
            custom_zones=motion_config.get('custom_zones', None)
        )
        snapshot_meta.append(meta)
        
        # Check files on disk
        b_size = os.path.getsize(meta['before_path']) if os.path.exists(meta['before_path']) else 0
        a_size = os.path.getsize(meta['after_path']) if os.path.exists(meta['after_path']) else 0
        
        if b_size > 0 and a_size > 0:
            snapshots_created += 1
            diff_str = ""
            if 'pixel_diff' in meta and meta['pixel_diff'] is not None:
                diff_str = f" | Pixel Diff: {meta['pixel_diff']:.2f}"
            print(f"  Event #{event_id}: Zone {ev['zone_id']} | Before: {b_size/1024:.1f}KB | Peak/After: {a_size/1024:.1f}KB{diff_str}")
            
    # 5. Print Summary
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    out_dir = os.path.join("data", "snapshots", video_name)
    
    print("\n" + "="*50)
    print("SNAPSHOT GENERATION SUMMARY")
    print(f"  Total Events:          {len(events)}")
    print(f"  Snapshot Pairs Saved:  {snapshots_created} / {len(events)}")
    print(f"  Storage Location:      {os.path.abspath(out_dir)}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
