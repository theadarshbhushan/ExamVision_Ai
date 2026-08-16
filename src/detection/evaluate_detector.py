import os
import json
from ultralytics import YOLO

def evaluate_model(model_path, dataset_yaml):
    if not os.path.exists(model_path):
        print(f"Error: Model weights not found at: {model_path}")
        return None

    print(f"Loading model from: {model_path}")
    model = YOLO(model_path)
    
    # Run validation on test split
    print(f"Running evaluation on test split...")
    results = model.val(
        data=dataset_yaml,
        split="test",
        device="cpu",
        verbose=False
    )
    
    # Extract overall metrics
    precision = results.results_dict.get('metrics/precision(B)', 0.0)
    recall = results.results_dict.get('metrics/recall(B)', 0.0)
    map50 = results.results_dict.get('metrics/mAP50(B)', 0.0)
    map50_95 = results.results_dict.get('metrics/mAP50-95(B)', 0.0)
    
    if precision + recall > 0:
        f1_score = 2 * (precision * recall) / (precision + recall)
    else:
        f1_score = 0.0
        
    # Extract per-class mAP@50
    class_map50 = {}
    names = results.names
    ap50_array = results.box.ap50
    for idx, class_name in names.items():
        if idx < len(ap50_array):
            class_map50[class_name] = float(ap50_array[idx])
            
    return {
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1_score), 4),
        "map50": round(float(map50), 4),
        "map50_95": round(float(map50_95), 4),
        "class_map50": class_map50
    }

def main():
    print("=== Evaluating YOLOv8 Cheat Detectors ===")
    
    dataset_yaml = os.path.abspath(
        os.path.join("data", "datasets", "phone_chit_detection", "cheating_dataset", "data.yaml")
    )
    
    model_v1_path = os.path.join("models", "phone_chit_detector.pt")
    model_v2_path = os.path.join("models", "phone_chit_detector_v2.pt")
    model_v3_path = os.path.join("models", "phone_chit_detector_v3.pt")
    model_v4_path = os.path.join("models", "phone_chit_detector_v4.pt")
    model_v5_path = os.path.join("models", "phone_chit_detector_v5.pt")
    
    # 1. Evaluate Model v1
    v1_metrics = evaluate_model(model_v1_path, dataset_yaml)
    
    # 2. Evaluate Model v2
    v2_metrics = evaluate_model(model_v2_path, dataset_yaml)
    
    # 3. Evaluate Model v3
    v3_metrics = evaluate_model(model_v3_path, dataset_yaml)
    
    # 4. Evaluate Model v4
    v4_metrics = evaluate_model(model_v4_path, dataset_yaml)
    
    # 5. Evaluate Model v5
    v5_metrics = evaluate_model(model_v5_path, dataset_yaml)
    
    # 6. Print Comparison Table
    print("\n" + "="*160)
    print("DETECTOR PERFORMANCE COMPARISON ON ORIGINAL TEST BENCHMARK:")
    print("="*160)
    
    # Overall metrics comparison
    print(f"{'Metric':<25} | {'Model v1 (Original)':<22} | {'Model v2 (Baseline)':<22} | {'Model v3 (Failed)':<22} | {'Model v4 (Baseline CCTV)':<22} | {'Model v5 (Latest CCTV)':<22}")
    print("-" * 160)
    
    metrics_to_show = [
        ("Precision", "precision"),
        ("Recall", "recall"),
        ("F1-Score", "f1_score"),
        ("mAP@50", "map50"),
        ("mAP@50-95", "map50_95")
    ]
    for label, key in metrics_to_show:
        v1_val = f"{v1_metrics[key] * 100:.2f}%" if v1_metrics else "N/A"
        v2_val = f"{v2_metrics[key] * 100:.2f}%" if v2_metrics else "N/A"
        v3_val = f"{v3_metrics[key] * 100:.2f}%" if v3_metrics else "N/A"
        v4_val = f"{v4_metrics[key] * 100:.2f}%" if v4_metrics else "N/A"
        v5_val = f"{v5_metrics[key] * 100:.2f}%" if v5_metrics else "N/A"
        print(f"{label:<25} | {v1_val:<22} | {v2_val:<22} | {v3_val:<22} | {v4_val:<22} | {v5_val:<22}")
        
    print("-" * 160)
    print("\nPER-CLASS mAP@50 BREAKDOWN:")
    print("-" * 160)
    print(f"{'Class Name':<25} | {'Model v1 mAP@50':<22} | {'Model v2 mAP@50':<22} | {'Model v3 mAP@50':<22} | {'Model v4 mAP@50':<22} | {'Model v5 mAP@50':<22}")
    print("-" * 160)
    
    all_classes = sorted(list(set(
        (list(v1_metrics["class_map50"].keys()) if v1_metrics else []) +
        (list(v2_metrics["class_map50"].keys()) if v2_metrics else []) +
        (list(v3_metrics["class_map50"].keys()) if v3_metrics else []) +
        (list(v4_metrics["class_map50"].keys()) if v4_metrics else []) +
        (list(v5_metrics["class_map50"].keys()) if v5_metrics else [])
    )))
    
    for cls in all_classes:
        v1_ap = f"{v1_metrics['class_map50'].get(cls, 0.0) * 100:.2f}%" if (v1_metrics and cls in v1_metrics['class_map50']) else "N/A"
        v2_ap = f"{v2_metrics['class_map50'].get(cls, 0.0) * 100:.2f}%" if (v2_metrics and cls in v2_metrics['class_map50']) else "N/A"
        v3_ap = f"{v3_metrics['class_map50'].get(cls, 0.0) * 100:.2f}%" if (v3_metrics and cls in v3_metrics['class_map50']) else "N/A"
        v4_ap = f"{v4_metrics['class_map50'].get(cls, 0.0) * 100:.2f}%" if (v4_metrics and cls in v4_metrics['class_map50']) else "N/A"
        v5_ap = f"{v5_metrics['class_map50'].get(cls, 0.0) * 100:.2f}%" if (v5_metrics and cls in v5_metrics['class_map50']) else "N/A"
        print(f"{cls:<25} | {v1_ap:<22} | {v2_ap:<22} | {v3_ap:<22} | {v4_ap:<22} | {v5_ap:<22}")
        
    print("="*160 + "\n")
    
    # 7. Save v5 results to JSON
    if v5_metrics:
        output_metrics = {k: v for k, v in v5_metrics.items() if k != "class_map50"}
        output_json = os.path.join("models", "eval_results_v5.json")
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(output_metrics, f, indent=2)
        print(f"Saved Model v5 evaluation metrics to: {os.path.abspath(output_json)}")
        
if __name__ == "__main__":
    main()
