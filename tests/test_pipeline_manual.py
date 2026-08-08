import os
import json
import pprint
import sys
import argparse

# Add src folder to python path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.motion.motion_detector import MotionDetector
from src.motion.event_segmenter import EventSegmenter

# ==============================================================================
# --- TUNABLE MOTION DETECTOR CONSTANTS ---
# Background subtractor learning rate. Slower rate (e.g. 0.001 or 0.0005) ensures
# a seated/stationary person is not absorbed into the background model too quickly.
LEARNING_RATE = 0.002

# Minimum area in pixels of motion contours to keep (filters out webcam noise)
MIN_CONTOUR_AREA = 150

# Threshold ratio (fraction of zone area) to flag motion as active in a zone
MOTION_THRESHOLD = 0.02
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Run manual pipeline integration test.")
    parser.add_argument(
        "--video",
        type=str,
        default=None,
        help="Path to the input video file (default: most recent file in data/self_recorded/)"
    )
    args = parser.parse_args()

    video_path = args.video
    if not video_path:
        self_recorded_dir = os.path.join("data", "self_recorded")
        video_files = []
        if os.path.exists(self_recorded_dir):
            for file in os.listdir(self_recorded_dir):
                if file.lower().endswith((".mp4", ".avi", ".mov", ".mkv")):
                    full_path = os.path.join(self_recorded_dir, file)
                    if os.path.isfile(full_path):
                        video_files.append(full_path)
        
        if video_files:
            # Sort by modification time, most recent first
            video_files.sort(key=os.path.getmtime, reverse=True)
            video_path = video_files[0]
            print(f"No --video argument provided. Automatically selected the most recent recording: {video_path}")
        else:
            video_path = "test_video.avi"
            print(f"No recordings found in '{self_recorded_dir}'. Falling back to default: {video_path}")
    else:
        print(f"Using explicitly specified video file: {video_path}")

    if not os.path.exists(video_path):
        if video_path == "test_video.avi":
            print(f"Error: {video_path} not found. Please run tests/generate_test_video.py first.")
        else:
            print(f"Error: Video file not found: {video_path}")
        return

    print("=== Running Manual Pipeline Integration Test ===")
    
    # Configure Motion Detector with noise and lighting robustness features
    motion_config = {
        'subtractor_type': 'MOG2',
        'history': 500,
        'var_threshold': 16,
        'detect_shadows': True,
        'morph_kernel_size': 3,
        'morph_iterations': 1,
        'morph_ops': [('open', 1), ('close', 1)],
        'min_contour_area': MIN_CONTOUR_AREA,        # Mitigates Camera Noise (drops small sensor/compression blobs)
        'learning_rate': LEARNING_RATE,              # Mitigates Lighting Variations (slow adaptation rate)
        'grid_rows': 3,
        'grid_cols': 3,
        # 'zone_weights': {5: 0.0, 8: 0.0},            # UNCOMMENT to mask out curtain/AC distractor zones during testing
        'motion_threshold': MOTION_THRESHOLD,        # Trigger threshold
        'vibration_suppression_enabled': True,       # Suppresses camera vibration/shake
        'vibration_intensity_threshold': 0.01,
        'vibration_active_zone_ratio': 0.70
    }
    
    detector = MotionDetector(config=motion_config)
    
    print("Step 1: Running Motion Detector (Background Subtraction + Zone Division)...")
    
    # Process frames, collecting intensities and saving visual samples
    motion_results = []
    vis_dir = os.path.join("data", "visualizations")
    os.makedirs(vis_dir, exist_ok=True)
    saved_samples = 0
    last_saved_frame_idx = -100  # Ensure we can save the first visual sample immediately
    
    for frame_idx, timestamp_sec, intensities, frame in detector.detect_motion_generator(video_path):
        motion_results.append({
            'frame_idx': frame_idx,
            'timestamp_sec': timestamp_sec,
            'zone_intensities': intensities
        })
        
        # Save a few visual samples when motion is detected
        active_zones = sum(1 for z_val in intensities.values() if z_val >= motion_config['motion_threshold'])
        if active_zones > 0 and saved_samples < 5:
            # Enforce a gap of at least 40 frames between saved visual samples
            if frame_idx - last_saved_frame_idx >= 40:
                sample_path = os.path.join(vis_dir, f"vis_frame_{frame_idx:04d}.jpg")
                detector.visualize_grid(frame, intensities, output_path=sample_path)
                print(f"  [Visualization] Saved active frame sample {frame_idx} to {sample_path}")
                saved_samples += 1
                last_saved_frame_idx = frame_idx
                
    print(f"Processed {len(motion_results)} frames successfully.")
    
    # Configure Event Segmenter
    segmenter_config = {
        'motion_threshold': MOTION_THRESHOLD, # Match detector motion threshold
        'min_event_frames': 4,    # Minimum event duration (e.g. 0.4s at 10fps)
        'max_gap_frames': 8       # Max gap allowance (0.8s)
    }
    
    segmenter = EventSegmenter(config=segmenter_config)
    
    print("Step 2: Segmenting Frame Intensities into Zone Events...")
    events = segmenter.segment_events(motion_results)
    
    print("\n=== Segmented Motion Events ===")
    print(f"Total events found: {len(events)}")
    for idx, ev in enumerate(events):
        print(f"  Event #{idx+1:02d}: Zone {ev['zone_id']} | Time: {ev['start_time']}s - {ev['end_time']}s | Avg Intensity: {ev['avg_motion_intensity']:.4f}")
    
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
