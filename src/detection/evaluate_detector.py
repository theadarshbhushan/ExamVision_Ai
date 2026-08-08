import os
import json
from ultralytics import YOLO

def main():
    print("=== Evaluating YOLOv8 Cheat Detector ===")
    
    # 1. Path to model and dataset
    model_path = os.path.join("models", "phone_chit_detector.pt")
    dataset_yaml = os.path.abspath(
        os.path.join("data", "datasets", "phone_chit_detection", "cheating_dataset", "data.yaml")
    )
    
    if not os.path.exists(model_path):
        print(f"Error: Trained model weights not found at: {model_path}")
        print("Please run src/detection/train_detector.py first.")
        return

    # 2. Load model
    print(f"Loading model from: {model_path}")
    model = YOLO(model_path)

    # 3. Run validation on test split
    print("Running evaluation on test split...")
    results = model.val(
        data=dataset_yaml,
        split="test",
        device="cpu"
    )

    # 4. Extract metrics
    # Extract bounding box metrics
    precision = results.results_dict.get('metrics/precision(B)', 0.0)
    recall = results.results_dict.get('metrics/recall(B)', 0.0)
    map50 = results.results_dict.get('metrics/mAP50(B)', 0.0)
    map50_95 = results.results_dict.get('metrics/mAP50-95(B)', 0.0)

    # Calculate F1 Score
    if precision + recall > 0:
        f1_score = 2 * (precision * recall) / (precision + recall)
    else:
        f1_score = 0.0

    metrics = {
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1_score), 4),
        "map50": round(float(map50), 4),
        "map50_95": round(float(map50_95), 4)
    }

    # 5. Print results
    print("\n" + "="*50)
    print("EVALUATION METRICS:")
    print(f"  Precision:   {metrics['precision'] * 100:.2f}%")
    print(f"  Recall:      {metrics['recall'] * 100:.2f}%")
    print(f"  F1-Score:    {metrics['f1_score'] * 100:.2f}%")
    print(f"  mAP@50:      {metrics['map50'] * 100:.2f}%")
    print(f"  mAP@50-95:   {metrics['map50_95'] * 100:.2f}%")
    print("="*50 + "\n")

    # 6. Save results to JSON
    output_json = os.path.join("models", "eval_results.json")
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved evaluation metrics to: {os.path.abspath(output_json)}")

if __name__ == "__main__":
    main()
