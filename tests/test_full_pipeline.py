import os
import sys
import argparse

# Add root folder to python path so we can import src modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.pipeline import ExamVisionPipeline

def main():
    print("=== Running ExamVision AI Full Pipeline Integration Test ===")
    
    # Parse arguments
    parser = argparse.ArgumentParser(description="ExamVision AI Full Pipeline Integration Test")
    parser.add_argument("--video", type=str, default=None, help="Path to target video file")
    args = parser.parse_args()
    
    # 1. Resolve target video path
    if args.video is not None:
        video_path = args.video
        print(f"Using explicitly specified video: {video_path}")
    else:
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

    # 2. Clean up snapshots folder for this specific video from previous runs
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    video_snapshots_dir = os.path.join("data", "snapshots", video_name)
    if os.path.exists(video_snapshots_dir):
        print(f"Cleaning up old snapshot files in {video_snapshots_dir}...")
        import shutil
        try:
            shutil.rmtree(video_snapshots_dir)
        except Exception as e:
            print(f"Warning: Could not remove directory {video_snapshots_dir}: {e}")

    # 3. Instantiate and run pipeline
    pipeline = ExamVisionPipeline()
    output = pipeline.process_video(video_path)
    
    results = output['events']
    total_frames = output['total_frames']
    yolo_frames = output['yolo_frames']
    
    # 4. Analyze and print statistics
    total_events = len(results)
    events_with_detections = 0
    detected_classes = set()
    
    for r in results:
        detections = r['detections']
        if detections:
            events_with_detections += 1
            for d in detections:
                detected_classes.add(d['class_name'])
                
    # Count generated annotated images in snapshot folder
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    video_snapshots_dir = os.path.join("data", "snapshots", video_name, "annotated")
    generated_annotated_count = 0
    if os.path.exists(video_snapshots_dir):
        for file in os.listdir(video_snapshots_dir):
            if file.lower().endswith(".jpg"):
                generated_annotated_count += 1
                
    efficiency_pct = (yolo_frames / total_frames * 100) if total_frames > 0 else 0.0
    
    print("\n" + "="*50)
    print("EXAMVISION PIPELINE INTEGRATION TEST SUMMARY")
    print(f"  Target Video:          {video_path}")
    print(f"  Total Events:          {total_events}")
    print(f"  Events with Detection: {events_with_detections} / {total_events}")
    print(f"  Annotated Images:      {generated_annotated_count}")
    print(f"  Cheating Classes Found: {sorted(list(detected_classes))}")
    print(f"  Video Total Frames:    {total_frames}")
    print(f"  Frames Sent to YOLO:   {yolo_frames} ({efficiency_pct:.2f}%)")
    print(f"  YOLO Bypass Ratio:     {100.0 - efficiency_pct:.2f}% (frames skipped)")
    print(f"  Results JSON Saved:    {os.path.abspath(output['results_path'])}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
