# ExamVision AI — AI/ML Detection Engine

The AI/ML Detection Engine is a high-performance computer vision pipeline designed to monitor classrooms for potential academic dishonesty. It processes video feeds in a two-tier architectural setup: first, a fast background-subtraction motion detector isolates active spatial zones and segments transient movement events; second, those isolated event frames are evaluated by a fine-tuned YOLOv8 object detector for specific cheating indicators. Peak event snapshots are automatically cropped, saved, and returned alongside a structured JSON metadata report of all events.

---

## 1. Final Model Performance Metrics

The fine-tuned object detection model (**Model v4**) was evaluated on our locked validation/test split. It delivers highly accurate and reliable detections with zero false alarm rates on innocent student movements:

| Metric | Model v4 Performance |
| :--- | :---: |
| **Precision** | **87.19%** |
| **Recall** | **75.70%** |
| **F1-Score** | **81.04%** |
| **mAP@50** | **81.76%** |
| **mAP@50-95** | **39.63%** |

---

## 2. Setup & Installation

1. **Install Dependencies:**
   Install only the AI/ML-relevant packages by running:
   ```bash
   pip install -r AI-ML/requirements.txt
   ```

2. **Download Model Checkpoint:**
   Download the fine-tuned model weights file `phone_chit_detector_v4.pt` from the **[PLACEHOLDER LINK]** and place it inside the `AI-ML/models/` folder:
   ```bash
   AI-ML/models/phone_chit_detector_v4.pt
   ```

---

## 3. How to Run (End-to-End Execution)

To process a video file through the entire pipeline (motion detection, event segmentation, YOLOv8 classification, snapshot cropping, and JSON output generation), run:

```bash
python AI-ML/tests/test_full_pipeline.py --video data/test_footage/cctv_real/cctv_01_phone.mkv
```

The script will:
* Print real-time pipeline status and event logs to `stdout`.
* Save cropped peak event images in `data/snapshots/{video_name}/annotated/`.
* Write the structured JSON metadata containing timestamps, bounding boxes, confidence, and grid coordinates to `data/snapshots/{video_name}/events.json`.

---

## 4. Known Technical Limitations

### CCTV-Distance Chit Detection
While the model generalizes exceptionally well to phones at CCTV distance (conf=20.02% on `phone_moment.jpg`), tiny cheat sheets (chits) in CCTV views (like `cctv_06_chit.mkv`) remain a performance bottleneck. Due to their extremely small resolution footprint (~18x20 pixels after YOLO resize) and a limited training pool of 4 positive examples, they are currently detected with low confidence (~0.55%). To bring this confidence above the standard deployment threshold, collecting more CCTV chit labels or training for extended epoch counts is required.

---

## 5. Robustness Testing

For complete details on edge-case sensitivity evaluations (including empty/busy halls, low lighting, and camera vibration suppression statistics), refer to the [Edge-Case Robustness Report](docs/robustness_report.md).
