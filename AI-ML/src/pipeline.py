import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import cv2
from src.motion.motion_detector import MotionDetector
from src.motion.event_segmenter import EventSegmenter
from src.detection.detector import YOLODetector
from src.snapshot.snapshot_generator import get_event_peak_frame

class ExamVisionPipeline:
    """
    Main orchestrator that fuses motion detection, event segmentation,
    zone-cropped snapshot generation, and fine-tuned YOLOv8 object detection
    into a cohesive exam monitoring pipeline.
    """
    def __init__(self, model_path=None, motion_config=None, segmenter_config=None):
        # Configuration presets matching validated component parameters
        self.motion_config = motion_config or {
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
        self.segmenter_config = segmenter_config or {
            'motion_threshold': 0.02,
            'min_event_frames': 4,
            'max_gap_frames': 8
        }
        
        # Initialize sub-modules
        self.data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        self.detector = YOLODetector(model_path=model_path)
        self.motion_detector = MotionDetector(config=self.motion_config)
        self.event_segmenter = EventSegmenter(config=self.segmenter_config)

    def process_video(self, video_path):
        """
        Runs the full video processing pipeline end-to-end.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")

        # 1. Retrieve total frames and video properties
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise IOError(f"Could not open video file: {video_path}")
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()

        # 2. Run motion detection (Offline first-tier processing)
        print(f"Pipeline: Running motion detection on: {video_path}...")
        motion_results = self.motion_detector.detect_motion(video_path)
        
        # 3. Segment motion events
        print("Pipeline: Segmenting motion events...")
        events = self.event_segmenter.segment_events(motion_results)
        print(f"Pipeline: Detected {len(events)} candidate motion events.")

        results = []
        detections_cache = {}
        yolo_frames_count = 0

        # 4. Generate snapshots and run YOLO detection on relevant frames (second-tier)
        print("Pipeline: Generating snapshots and running object detection...")
        for idx, ev in enumerate(events):
            event_id = f"{idx+1:02d}"
            
            # Extract the peak frame of the event in memory (no disk writing yet)
            after_frame, after_frame_idx, after_time = get_event_peak_frame(
                video_path=video_path,
                event=ev,
                event_id=event_id,
                motion_results=motion_results
            )
            
            # Print seeker info
            print(f"DEBUG: Event #{event_id} | Zone: {ev['zone_id']} | start_time: {ev['start_time']:.2f}s | end_time: {ev['end_time']:.2f}s | before_frame_idx: {max(0, after_frame_idx - 15)} | after_frame_idx: {after_frame_idx} | Gap: 15")
            
            detections = []
            annotated_path = None
            
            if after_frame is not None:
                # Check cache to avoid duplicate YOLO runs on co-occurring events sharing the same after frame
                if after_frame_idx not in detections_cache:
                    # Save a copy of that EXACT frame (uncropped, full frame) to /data/debug/yolo_input_frames/event_{id}.jpg
                    debug_dir = os.path.join(self.data_dir, "debug", "yolo_input_frames")
                    os.makedirs(debug_dir, exist_ok=True)
                    debug_path = os.path.join(debug_dir, f"event_{event_id}.jpg")
                    cv2.imwrite(debug_path, after_frame)
                    
                    # Print metadata details for the frame sent to YOLO
                    print(f"DEBUG: YOLO Input Frame | Event ID: {event_id} | Frame Index: {after_frame_idx} | Timestamp: {after_time:.2f}s | Crop Status: full-frame")
                    
                    yolo_frames_count += 1
                    detections = self.detector.detect_objects(after_frame)
                    detections_cache[after_frame_idx] = (detections, after_frame)
                else:
                    detections, _ = detections_cache[after_frame_idx]
                
                # If any objects are detected, annotate the full-frame after snapshot and save it
                if detections:
                    annotated_frame = self._draw_annotations(after_frame, detections)
                    
                    # Save annotated full-frame image inside a video-specific subfolder
                    video_name = os.path.splitext(os.path.basename(video_path))[0]
                    output_dir = os.path.join(self.data_dir, "snapshots", video_name, "annotated")
                    os.makedirs(output_dir, exist_ok=True)
                    
                    annotated_filename = f"event_{event_id}.jpg"
                    annotated_path = os.path.join(output_dir, annotated_filename)
                    cv2.imwrite(annotated_path, annotated_frame)
                    
            results.append({
                'event_id': event_id,
                'start_time': ev['start_time'],
                'end_time': ev['end_time'],
                'zone_id': ev['zone_id'],
                'motion_intensity': ev['avg_motion_intensity'],
                'detections': detections,
                'before_snapshot_path': None,
                'after_snapshot_path': None,
                'annotated_snapshot_path': annotated_path
            })
            
        # 5. Save results to results JSON
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        results_dir = os.path.join(self.data_dir, "results")
        os.makedirs(results_dir, exist_ok=True)
        results_path = os.path.join(results_dir, f"{video_name}_results.json")
        
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
            
        print(f"Pipeline: Saved results JSON file to: {results_path}")
        efficiency_pct = (yolo_frames_count / total_frames * 100) if total_frames > 0 else 0.0
        print(f"Pipeline: Efficiency - Sent {yolo_frames_count} / {total_frames} frames to YOLO ({efficiency_pct:.2f}%)")
        
        return {
            'results_path': results_path,
            'total_frames': total_frames,
            'yolo_frames': yolo_frames_count,
            'events': results
        }

    def _draw_annotations(self, image, detections):
        """
        Draws bounding boxes and labels for YOLO detections onto the full frame image.
        """
        annotated = image.copy()
        for det in detections:
            bbox = det['bounding_box']
            x1, y1, x2, y2 = [int(round(coord)) for coord in bbox]
            label = f"{det['class_name']}"
            
            # Calculate text size
            (text_w, text_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            
            # Position label and back-plate rectangle cleanly
            y_text = y1 - 5
            if y_text - text_h < 0:
                # Text goes off-screen top; place text box inside the bounding box boundary
                cv2.rectangle(annotated, (x1, y1), (x1 + text_w + 10, y1 + text_h + 10), (0, 0, 255), -1)
                cv2.putText(annotated, label, (x1 + 5, y1 + text_h + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            else:
                # Place text box above the bounding box boundary
                cv2.rectangle(annotated, (x1, y1 - text_h - 10), (x1 + text_w + 10, y1), (0, 0, 255), -1)
                cv2.putText(annotated, label, (x1 + 5, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
                
            # Draw primary red bounding box around the detected cheating element
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
            
        return annotated

def run_pipeline(video_path, model_path=None, motion_config=None, segmenter_config=None):
    """
    Convenience function to instantiate and run the ExamVision monitoring pipeline.
    """
    pipeline = ExamVisionPipeline(
        model_path=model_path,
        motion_config=motion_config,
        segmenter_config=segmenter_config
    )
    return pipeline.process_video(video_path)


if __name__ == "__main__":
    import argparse
    import shutil
    import sys
    
    parser = argparse.ArgumentParser(description="ExamVision AI Pipeline CLI")
    parser.add_argument("--input", required=True, help="Path to input video file")
    parser.add_argument("--output", required=True, help="Path to save results JSON")
    parser.add_argument("--snapshot-dir", required=True, help="Directory to save snapshots")
    
    args = parser.parse_args()
    
    try:
        if not os.path.exists(args.input):
            print(f"Error: Input video not found at {args.input}", file=sys.stderr)
            sys.exit(1)
            
        # Instantiate and run pipeline
        pipeline = ExamVisionPipeline()
        output = pipeline.process_video(args.input)
        
        # Ensure snapshot directory exists
        os.makedirs(args.snapshot_dir, exist_ok=True)
        
        # Post-process events: copy snapshots and map keys for backend compatibility
        reshaped_events = []
        for ev in output.get("events", []):
            event_id = ev["event_id"]
            ann_path = ev.get("annotated_snapshot_path")
            
            copied_snapshot_path = None
            if ann_path and os.path.exists(ann_path):
                dest_path = os.path.join(args.snapshot_dir, f"event_{event_id}.jpg")
                shutil.copy2(ann_path, dest_path)
                copied_snapshot_path = dest_path
            
            # Map keys to match the backend expectations
            reshaped_ev = {
                "event_id": ev["event_id"],
                "start_time": ev["start_time"],
                "end_time": ev["end_time"],
                "zone_id": ev["zone_id"],
                "motion_intensity": ev["motion_intensity"],
                "detections": ev["detections"],
                "before_snapshot": None,
                "after_snapshot": None,
                "annotated_snapshot": copied_snapshot_path
            }
            reshaped_events.append(reshaped_ev)
            
        # Structure the final JSON output matching the ResultsResponse expectation
        final_output = {
            "video_name": os.path.splitext(os.path.basename(args.input))[0],
            "total_frames": output.get("total_frames", 0),
            "frames_sent_to_yolo": output.get("yolo_frames", 0),
            "events": reshaped_events
        }
        
        # Write to requested output path
        with open(args.output, "w") as f:
            json.dump(final_output, f, indent=2)
            
        print(f"Success: Results written to {args.output}")
        sys.exit(0)
        
    except Exception as e:
        import traceback
        print(f"Error executing pipeline: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

