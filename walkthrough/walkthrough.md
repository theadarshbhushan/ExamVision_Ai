# Walkthrough: YOLOv8 Cheating Detector fine-tuning

We have successfully completed Phase 2: YOLOv8 Object Detection implementation. This includes dataset configuration corrections, training on CPU, test split evaluation, detector class wrapping, and visual verification.

## Key Changes

1. **Dataset Configuration**:
   - Modified [data.yaml](file:///d:/ExamVision_Ai/data/datasets/phone_chit_detection/cheating_dataset/data.yaml) to use absolute paths, ensuring correct split resolving on local directories.
   - Mapped `test` split to `valid/images` as a fallback since the export lacked a dedicated test folder on disk.

2. **Training Implementation**:
   - Created [src/detection/train_detector.py](file:///d:/ExamVision_Ai/src/detection/train_detector.py) which loads pretrained `yolov8n.pt` (nano) and fine-tunes it for 30 epochs at resolution `imgsz=416` on CPU.
   - Automatically copies the best weights to `models/phone_chit_detector.pt` upon training completion.

3. **Evaluation Framework**:
   - Created [src/detection/evaluate_detector.py](file:///d:/ExamVision_Ai/src/detection/evaluate_detector.py) to validate the trained model against the test images.
   - Saves metrics to [models/eval_results.json](file:///d:/ExamVision_Ai/models/eval_results.json).

4. **Detector Wrapper**:
   - Updated the stub [src/detection/detector.py](file:///d:/ExamVision_Ai/src/detection/detector.py) to load `models/phone_chit_detector.pt`, check weights existence, raise proper `FileNotFoundError` if missing, and parse the raw detections into standard output structures: `{'class_name', 'confidence', 'bounding_box'}`.

5. **Manual Verification**:
   - Created [tests/test_detector_manual.py](file:///d:/ExamVision_Ai/tests/test_detector_manual.py) to run the detector wrapper on validation split samples and write annotated frames.

## Verification Results

### 1. Fine-Tuning Execution
- **Device**: CPU (Intel Core i7-14650HX)
- **Duration**: 30 epochs completed in **0.175 hours** (~10 minutes).
- **Weights File**: Successfully saved to `models/phone_chit_detector.pt`.

### 2. Evaluation Metrics (Test Split)
Evaluated on the test split (65 validation images) containing 74 ground truth instances. The metrics are saved in [models/eval_results.json](file:///d:/ExamVision_Ai/models/eval_results.json):

| Metric | Value | Note |
| :--- | :--- | :--- |
| **Precision** | **74.66%** | Ratio of correct cheating flags to total flags |
| **Recall** | **77.22%** | Ratio of flagged cheating instances to total cheating instances |
| **F1-Score** | **75.92%** | Balanced harmonic mean of Precision and Recall |
| **mAP@50** | **80.09%** | Mean Average Precision at IoU threshold 0.5 |
| **mAP@50-95** | **35.60%** | Average precision across IoU thresholds 0.5 to 0.95 |

#### Per-Class mAP@50 Breakdown:
- `supplement-passing`: **97.8%**
- `peeking`: **84.1%**
- `hand`: **79.7%**
- `chits`: **76.0%**
- `phone`: **62.9%** (Lower score likely due to small phone size / background occlusion)

### 3. Manual Detection Verification
Running `tests/test_detector_manual.py` verified the wrapper's runtime execution. The wrapper successfully loaded the model and correctly flagged cheating behaviors in the validation set:
- **Sample 2**: Detected **supplement-passing** with **86.0%** confidence at bounding box `[305.5, 426.5, 365.5, 480.9]`.
- **Sample 3**: Detected **hand** with **87.0%** confidence at bounding box `[370.7, 362.1, 404.3, 383.7]`.

The annotated images showing bounding box labels can be inspected in the directory [data/visualizations/detections/](file:///d:/ExamVision_Ai/data/visualizations/detections/).
