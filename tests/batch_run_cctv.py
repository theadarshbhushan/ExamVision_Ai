import os
import glob
import subprocess
import sys

def main():
    print("=== ExamVision AI CCTV Batch Pipeline Runner ===")
    
    input_dir = os.path.abspath(os.path.join("data", "test_footage", "cctv_real"))
    pipeline_script = os.path.abspath(os.path.join("tests", "test_full_pipeline.py"))
    
    if not os.path.exists(input_dir):
        print(f"Error: Input directory not found: {input_dir}")
        return
        
    video_extensions = ["*.mp4", "*.mkv", "*.avi", "*.mov", "*.webm"]
    video_paths = []
    for ext in video_extensions:
        video_paths.extend(glob.glob(os.path.join(input_dir, ext)))
        
    video_paths = sorted(list(set(video_paths)))
    
    if not video_paths:
        print(f"No video files found in: {input_dir}")
        return
        
    print(f"Found {len(video_paths)} videos to process.")
    
    # Use active virtual environment python interpreter
    python_exe = sys.executable
    
    for idx, video_path in enumerate(video_paths):
        video_name = os.path.basename(video_path)
        print(f"\n==================================================")
        print(f"[{idx+1}/{len(video_paths)}] Running pipeline for: {video_name}")
        print(f"==================================================")
        
        # Run test_full_pipeline.py in a subprocess with the --video argument
        cmd = [python_exe, pipeline_script, "--video", video_path]
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error: Pipeline run failed for {video_name}: {e}")
            
    print("\nBatch pipeline processing complete!")
    print("All generated snapshots have been stored directly under data/snapshots/")

if __name__ == "__main__":
    main()
