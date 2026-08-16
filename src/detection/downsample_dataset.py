import os
import shutil
import random
from collections import Counter

# Paths
DATASET_DIR = os.path.abspath("data/datasets/phone_chit_detection/cheating_dataset")
TRAIN_IMAGES_DIR = os.path.join(DATASET_DIR, "train", "images")
TRAIN_LABELS_DIR = os.path.join(DATASET_DIR, "train", "labels")

TARGET_PEEKING_TOTAL = 700

def get_class_distribution(dataset_dir, splits):
    class_names = ['chits', 'hand', 'peeking', 'phone', 'supplement-passing']
    total_counts = Counter()
    split_counts = {}
    
    for split in splits:
        split_dir = os.path.join(dataset_dir, split)
        labels_dir = os.path.join(split_dir, "labels")
        counts = Counter()
        
        if os.path.exists(labels_dir):
            for filename in os.listdir(labels_dir):
                if not filename.endswith(".txt"):
                    continue
                file_path = os.path.join(labels_dir, filename)
                with open(file_path, "r", encoding="utf-8") as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts:
                            class_id = int(parts[0])
                            if 0 <= class_id < len(class_names):
                                counts[class_names[class_id]] += 1
                                total_counts[class_names[class_id]] += 1
        split_counts[split] = counts
        
    return split_counts, total_counts

def main():
    print("=== Analyzing Training Set for Peeking Downsampling ===")
    
    # 1. Categorize all training files
    all_label_files = [f for f in os.listdir(TRAIN_LABELS_DIR) if f.endswith(".txt")]
    
    background_files = []
    peeking_only_files = []  # contains only class 2
    mixed_files = []         # contains class 2 and other classes
    other_pos_files = []     # contains classes other than 2, but no class 2
    
    peeking_in_mixed = 0
    
    for filename in all_label_files:
        path = os.path.join(TRAIN_LABELS_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            classes = [int(line.strip().split()[0]) for line in f if line.strip()]
            
        if not classes:
            background_files.append(filename)
        elif all(c == 2 for c in classes):
            peeking_only_files.append((filename, len(classes)))
        elif 2 in classes:
            mixed_files.append((filename, classes.count(2)))
            peeking_in_mixed += classes.count(2)
        else:
            other_pos_files.append(filename)
            
    print(f"Initial statistics:")
    print(f"  Total train files: {len(all_label_files)}")
    print(f"  Background images: {len(background_files)}")
    print(f"  Peeking-only images: {len(peeking_only_files)} (containing {sum(count for _, count in peeking_only_files)} annotations)")
    print(f"  Mixed images containing peeking: {len(mixed_files)} (containing {peeking_in_mixed} annotations)")
    print(f"  Other positive images: {len(other_pos_files)}")
    
    # 2. Randomly select peeking-only files to hit the target total
    random.seed(42)  # For deterministic reproducibility
    random.shuffle(peeking_only_files)
    
    selected_peeking_only = []
    current_peeking_total = peeking_in_mixed
    
    for filename, count in peeking_only_files:
        if current_peeking_total < TARGET_PEEKING_TOTAL:
            selected_peeking_only.append(filename)
            current_peeking_total += count
        else:
            # We reached the target. Deleting this file and its image
            # Find matching image file
            base_name = os.path.splitext(filename)[0]
            # Try different image extensions
            img_deleted = False
            for ext in [".jpg", ".jpeg", ".png", ".JPG", ".PNG"]:
                img_path = os.path.join(TRAIN_IMAGES_DIR, f"{base_name}{ext}")
                if os.path.exists(img_path):
                    os.remove(img_path)
                    img_deleted = True
                    break
            
            # Delete label file
            label_path = os.path.join(TRAIN_LABELS_DIR, filename)
            if os.path.exists(label_path):
                os.remove(label_path)
                
    print(f"\nDownsampling complete:")
    print(f"  Selected peeking-only images: {len(selected_peeking_only)}")
    print(f"  Deleted peeking-only images: {len(peeking_only_files) - len(selected_peeking_only)}")
    print(f"  Resulting peeking training annotations: {current_peeking_total}")
    
    # 3. Report final dataset statistics
    print("\n" + "="*50)
    print("FINAL DATASET STATISTICS AFTER PEEKING DOWNSAMPLING")
    print("="*50)
    print("\nNew total image count per split:")
    total_imgs = 0
    for split in ["train", "valid", "test"]:
        img_count = len([f for f in os.listdir(os.path.join(DATASET_DIR, split, "images")) if f.lower().endswith((".jpg", ".jpeg", ".png"))])
        lbl_count = len([f for f in os.listdir(os.path.join(DATASET_DIR, split, "labels")) if f.endswith(".txt")])
        print(f"  {split:<6}: {img_count:<5} images | {lbl_count:<5} labels")
        total_imgs += img_count
    print(f"  Total : {total_imgs} images")
    
    # Class distribution
    split_dist, overall_dist = get_class_distribution(DATASET_DIR, ["train", "valid", "test"])
    
    print("\nNew Class Distribution (individual annotations):")
    print(f"{'Class Name':<20} | {'Train':<7} | {'Valid':<7} | {'Test (Unchanged)':<16} | {'Total':<7}")
    print("-" * 70)
    class_names = ['chits', 'hand', 'peeking', 'phone', 'supplement-passing']
    for cls in class_names:
        tr_c = split_dist["train"].get(cls, 0)
        va_c = split_dist["valid"].get(cls, 0)
        te_c = split_dist["test"].get(cls, 0)
        tot_c = overall_dist.get(cls, 0)
        print(f"{cls:<20} | {tr_c:<7} | {va_c:<7} | {te_c:<16} | {tot_c:<7}")
    print("-" * 70)
    
    # Calculate background images
    print("\nNegative background samples (images with 0 annotations):")
    for split in ["train", "valid", "test"]:
        bg_count = 0
        labels_dir = os.path.join(DATASET_DIR, split, "labels")
        for filename in os.listdir(labels_dir):
            if filename.endswith(".txt"):
                file_path = os.path.join(labels_dir, filename)
                if os.path.getsize(file_path) == 0:
                    bg_count += 1
                else:
                    with open(file_path, "r") as f:
                        if not f.read().strip():
                            bg_count += 1
        print(f"  {split:<6}: {bg_count} negative images")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
