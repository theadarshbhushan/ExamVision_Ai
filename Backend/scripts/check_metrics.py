import sys
from ultralytics import YOLO

def print_split_metrics(split_name, metrics, model):
    print("\n" + "="*50)
    print(f"=== PERFORMANCE SUMMARY ON {split_name.upper()} SPLIT ===")
    print("="*50)
    print(f"Overall Precision (P):   {metrics.results_dict['metrics/precision(B)'] * 100:.2f}%")
    print(f"Overall Recall (R):      {metrics.results_dict['metrics/recall(B)'] * 100:.2f}%")
    print(f"Overall mAP@50:          {metrics.results_dict['metrics/mAP50(B)'] * 100:.2f}%")
    print(f"Overall mAP@50-95:       {metrics.results_dict['metrics/mAP50-95(B)'] * 100:.2f}%")
    print("\n=== PER-CLASS METRICS (mAP@50) ===")
    print(f"{'Class ID':<8} | {'Class Name':<20} | {'mAP@50':<10}")
    print("-" * 45)
    
    # Class names map
    class_names = model.names
    
    # Per-class AP@50
    ap50 = metrics.box.ap50
    for idx, class_name in class_names.items():
        val_ap50 = ap50[idx] if idx < len(ap50) else 0.0
        print(f"{idx:<8} | {class_name:<20} | {val_ap50 * 100:.2f}%")
    print("="*50)

def main():
    model_path = r"D:\ExamVision_Ai\AI-ML\models\phone_chit_detector_v4.pt"
    data_yaml = r"D:\ExamVision_Ai\AI-ML\data\datasets\phone_chit_detection\cheating_dataset\data.yaml"
    
    print(f"Loading model: {model_path}")
    model = YOLO(model_path)
    
    print(f"Running validation on valid split...")
    val_metrics = model.val(data=data_yaml, split='val', verbose=False)
    print_split_metrics("validation", val_metrics, model)
    
    print(f"\nRunning validation on test split...")
    test_metrics = model.val(data=data_yaml, split='test', verbose=False)
    print_split_metrics("test", test_metrics, model)

if __name__ == "__main__":
    main()
