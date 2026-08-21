import sys
import os

# Add Backend and AI-ML roots
sys.path.append(r"D:\ExamVision_Ai\Backend")
sys.path.append(r"D:\ExamVision_Ai\AI-ML")

from src.pipeline import ExamVisionPipeline
from src.snapshot.snapshot_generator import get_event_peak_frame

def main():
    video_path = r"D:\ExamVision_Ai\Backend\app\data\uploads\deac8469-9b71-4d1c-b620-503dc1b20e70\cheating.mp4"
    pipeline = ExamVisionPipeline()
    
    print("Running motion detection...")
    motion_results = pipeline.motion_detector.detect_motion(video_path)
    
    print("Segmenting events...")
    events = pipeline.event_segmenter.segment_events(motion_results)
    
    print("\n--- Event Cross-Reference Table ---")
    print(f"{'Event ID':<10} | {'Zone':<5} | {'Start (s)':<10} | {'End (s)':<10} | {'Peak Frame':<12} | {'Peak Time (s)':<15}")
    print("-" * 75)
    
    for idx, ev in enumerate(events):
        event_id = f"{idx+1:02d}"
        _, after_frame_idx, after_time = get_event_peak_frame(
            video_path=video_path,
            event=ev,
            event_id=event_id,
            motion_results=motion_results
        )
        print(f"{event_id:<10} | {ev['zone_id']:<5} | {ev['start_time']:<10.2f} | {ev['end_time']:<10.2f} | {after_frame_idx:<12} | {after_time:<15.2f}")

if __name__ == "__main__":
    main()
