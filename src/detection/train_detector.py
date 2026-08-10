import os
import shutil
from ultralytics import YOLO

def main():
    print("=== Training YOLOv8 Cheat Detector ===")
    
    # 1. Load pretrained YOLOv8n model (nano)
    print("Loading pretrained YOLOv8n weights...")
    model = YOLO("yolov8n.pt")
    
    # 2. Define dataset data.yaml path
    dataset_yaml = os.path.abspath(
        os.path.join("data", "datasets", "phone_chit_detection", "cheating_dataset", "data.yaml")
    )
    print(f"Dataset configuration: {dataset_yaml}")
    
    # 3. Create models directory if it doesn't exist
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)
    
    # 4. Fine-tune on CPU (since CUDA is not available)
    # Using imgsz=416 for fast CPU training, and 30 epochs
    epochs = 30
    imgsz = 416
    batch = 16
    device = "cpu"
    
    # Print dataset counts for verification
    cheating_dataset_dir = os.path.dirname(dataset_yaml)
    print("\nDataset split counts before training:")
    for split in ["train", "valid"]:
        img_dir = os.path.join(cheating_dataset_dir, split, "images")
        if os.path.exists(img_dir):
            count = len([f for f in os.listdir(img_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))])
            print(f"  {split} set: {count} images")
    print()

    print(f"Starting training on device={device} for {epochs} epochs at imgsz={imgsz}...")
    model.train(
        data=dataset_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        project="runs",
        name="train_cheating",
        exist_ok=True
    )
    
    # 5. Copy the best weights to models/phone_chit_detector_v2.pt
    best_weights_path = os.path.join("runs", "detect", "runs", "train_cheating", "weights", "best.pt")
    target_weights_path = os.path.join(models_dir, "phone_chit_detector_v2.pt")
    if os.path.exists(best_weights_path):
        shutil.copy(best_weights_path, target_weights_path)
        print("\n" + "="*60)
        print("TRAINING COMPLETED SUCCESSFULLY")
        print(f"Copied fine-tuned weights to: {os.path.abspath(target_weights_path)}")
        print("="*60 + "\n")
    else:
        print(f"Error: Could not find best weights at {best_weights_path}")

if __name__ == "__main__":
    main()
