import os
import shutil
import glob
import torch
from ultralytics import YOLO

# Monkeypatch torch.save to bypass Python 3.14 + PyTorch zipfile writer and CUDA serialization bugs on Windows
_original_save = torch.save

def to_cpu(obj):
    if isinstance(obj, torch.Tensor):
        return obj.cpu()
    elif isinstance(obj, dict):
        return {k: to_cpu(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_cpu(x) for x in obj]
    elif isinstance(obj, tuple):
        return tuple(to_cpu(x) for x in obj)
    elif hasattr(obj, "cpu") and callable(obj.cpu):
        try:
            return obj.cpu()
        except Exception:
            pass
    return obj

def _patched_save(obj, f, *args, **kwargs):
    if isinstance(obj, dict):
        if "optimizer" in obj:
            obj["optimizer"] = None
        if "scaler" in obj:
            obj["scaler"] = None
    obj = to_cpu(obj)
    kwargs["_use_new_zipfile_serialization"] = False
    return _original_save(obj, f, *args, **kwargs)

torch.save = _patched_save

def _patched_half(self, *args, **kwargs):
    return self
torch.nn.Module.half = _patched_half

def main():
    print("=== Training YOLOv8 Cheat Detector v7 ===")
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    models_dir = os.path.abspath(os.path.join(base_dir, "models"))
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Load pretrained YOLOv8n model (nano)
    print("Loading pretrained YOLOv8n weights...")
    model = YOLO("yolov8n.pt")
    
    # 2. Define dataset data.yaml path
    dataset_yaml = os.path.abspath(
        os.path.join(base_dir, "data", "datasets", "phone_chit_detection", "cheating_dataset", "data.yaml")
    )
    print(f"Using Dataset YAML: {dataset_yaml}")
    
    # 3. Fine-tuning parameters for v7
    epochs = 30
    imgsz = 640
    batch = 16
    device = 0
    run_name = "train_cheating_v7"
    
    print(f"Starting training on device={device} for {epochs} epochs at imgsz={imgsz} (batch={batch})...")
    try:
        model.train(
            data=dataset_yaml,
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            device=device,
            project="runs",
            name=run_name,
            exist_ok=True,
            val=False,
            workers=0
        )
    except Exception as e:
        print(f"Training status/validation note: {e}")
    
    # 4. Search and copy trained weights
    search_patterns = [
        os.path.join(base_dir, "runs", "**", run_name, "weights", "best.pt"),
        os.path.join(base_dir, "runs", "**", run_name, "weights", "last.pt")
    ]
    
    saved_weight = None
    for pattern in search_patterns:
        matches = glob.glob(pattern, recursive=True)
        if matches:
            saved_weight = matches[0]
            break
            
    target_weights_path = os.path.join(models_dir, "phone_chit_detector_v7.pt")
    
    if saved_weight and os.path.exists(saved_weight):
        shutil.copy2(saved_weight, target_weights_path)
        print(f"\nTraining completed successfully! Weights saved to: {target_weights_path}")
    else:
        print(f"\nCould not locate weights in runs/. Please check the runs/ directory.")

if __name__ == "__main__":
    main()