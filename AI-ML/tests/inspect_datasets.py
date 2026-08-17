"""
Quick inventory check for downloaded datasets.
Run from your ExamVision_Ai folder: python AI-ML/tests/inspect_datasets.py
"""
import os
import glob

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_ROOT = os.path.join(base_dir, "data", "raw")

def find_yaml(folder):
    matches = glob.glob(os.path.join(folder, "**", "data.yaml"), recursive=True)
    return matches[0] if matches else None

def count_images(folder):
    exts = (".jpg", ".jpeg", ".png")
    count = 0
    for root, _, files in os.walk(folder):
        count += sum(1 for f in files if f.lower().endswith(exts))
    return count

def main():
    if not os.path.isdir(DATA_ROOT):
        print(f"'{DATA_ROOT}' not found. Run this from your ExamVision_Ai project root.")
        return

    for name in sorted(os.listdir(DATA_ROOT)):
        folder = os.path.join(DATA_ROOT, name)
        if not os.path.isdir(folder):
            continue

        print(f"\n=== {name} ===")
        n_images = count_images(folder)
        print(f"  Images found: {n_images}")

        yaml_path = find_yaml(folder)
        if yaml_path:
            print(f"  data.yaml: {yaml_path}")
            with open(yaml_path, "r", encoding="utf-8") as f:
                content = f.read()
            print("  --- data.yaml contents ---")
            print("  " + content.replace("\n", "\n  "))
        else:
            print("  No data.yaml found (not a standard YOLO export, or unlabeled images).")

if __name__ == "__main__":
    main()