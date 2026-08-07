import os
import json
import pprint
import sys

# Add src folder to python path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.motion.motion_detector import MotionDetector
from src.motion.event_segmenter import EventSegmenter

def main():
    video_path = "test_video.avi"
    if not os.path.exists(video_path):
        print(f"Error: {video_path} not found. Please run tests/generate_test_video.py first.")
        return

    print("=== Running Manual Pipeline Integration Test ===")
    
    # Configure Motion Detector
    # 3x3 grid, var_threshold=16, morph_kernel=3
    motion_config = {
        'subtractor_type': 'MOG2',
        'history': 500,
        'var_threshold': 16,
        'detect_shadows': True,
        'morph_kernel_size': 3,
        'morph_iterations': 1,
        'grid_rows': 3,
        'grid_cols': 3,
        'motion_threshold': 0.01  # Trigger threshold (1% of zone area)
    }
    
    detector = MotionDetector(config=motion_config)
    
    print("Step 1: Running Motion Detector (Background Subtraction + Zone Division)...")
    motion_results = detector.detect_motion(video_path)
    print(f"Processed {len(motion_results)} frames successfully.")
    
    # Configure Event Segmenter
    segmenter_config = {
        'motion_threshold': 0.01,
        'min_event_frames': 4,   # 0.4 seconds at 10 fps
        'max_gap_frames': 8       # 0.8 seconds gap allowance
    }
    
    segmenter = EventSegmenter(config=segmenter_config)
    
    print("Step 2: Segmenting Frame Intensities into Zone Events...")
    events = segmenter.segment_events(motion_results)
    
    print("\n=== Segmented Motion Events ===")
    print(f"Total events found: {len(events)}")
    pprint.pprint(events)
    
    # Print a summary counts per zone
    zone_counts = {}
    for ev in events:
        z_id = ev['zone_id']
        zone_counts[z_id] = zone_counts.get(z_id, 0) + 1
        
    print("\n=== Event Count per Zone ===")
    for z_id in sorted(zone_counts.keys()):
        print(f"Zone {z_id}: {zone_counts[z_id]} events")
        
    # Write events to file
    out_json = "detected_events.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2)
    print(f"\nWritten all events to {out_json}")

if __name__ == "__main__":
    main()
