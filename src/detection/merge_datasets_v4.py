import os
import shutil
import zipfile
import random
from collections import Counter

# Paths
ZIP_PATH = os.path.abspath("data/archive/zips/cheating dataset.v1i.yolov8.zip")
DST_DATASET_DIR = os.path.abspath("data/datasets/phone_chit_detection/cheating_dataset")
REFINED_DIR = os.path.abspath("data/datasets/phone_chit_detection/new_labeled_refined")
CCTV_V2_DIR = os.path.abspath("data/datasets/phone_chit_detection/cctv_labeled_v2")

def remap_and_copy_refined_labels(src_dir, dst_dir):
    os.makedirs(dst_dir, exist_ok=True)
    for filename in os.listdir(src_dir):
        if not filename.endswith(".txt"):
            continue
        src_path = os.path.join(src_dir, filename)
        dst_path = os.path.join(dst_dir, f"refined_{filename}")
        
        with open(src_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        new_lines = []
        for line in lines:
            parts = line.strip().split()
            if not parts:
                continue
            class_id = int(parts[0])
            # Remap class index: 1 (phone in new_labeled) -> 3 (phone in cheating_dataset)
            if class_id == 1:
                class_id = 3
            elif class_id == 0:
                class_id = 0
            else:
                print(f"Warning: Unexpected class ID {class_id} in {src_path}")
            
            parts[0] = str(class_id)
            new_lines.append(" ".join(parts) + "\n")
            
        with open(dst_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)

def copy_refined_images(src_dir, dst_dir):
    os.makedirs(dst_dir, exist_ok=True)
    for filename in os.listdir(src_dir):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        src_path = os.path.join(src_dir, filename)
        dst_path = os.path.join(dst_dir, f"refined_{filename}")
        shutil.copy2(src_path, dst_path)

def copy_cctv_files(src_images, src_labels, dst_split):
    dst_images_dir = os.path.join(DST_DATASET_DIR, dst_split, "images")
    dst_labels_dir = os.path.join(DST_DATASET_DIR, dst_split, "labels")
    
    os.makedirs(dst_images_dir, exist_ok=True)
    os.makedirs(dst_labels_dir, exist_ok=True)
    
    copied = 0
    for img_path in src_images:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        # Copy image
        shutil.copy2(img_path, os.path.join(dst_images_dir, f"cctv_{base_name}{os.path.splitext(img_path)[1]}"))
        
        # Copy label if exists, else create empty
        lbl_filename = f"{base_name}.txt"
        matching_lbl = [p for p in src_labels if os.path.basename(p) == lbl_filename]
        dst_lbl_path = os.path.join(dst_labels_dir, f"cctv_{lbl_filename}")
        
        if matching_lbl:
            # Remap class IDs from cctv_labeled_v2:
            # 0 -> 0 (chits)
            # 1 -> 3 (phone)
            with open(matching_lbl[0], "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            for line in lines:
                parts = line.strip().split()
                if not parts:
                    continue
                class_id = int(parts[0])
                if class_id == 1:
                    class_id = 3
                elif class_id == 0:
                    class_id = 0
                else:
                    print(f"Warning: Unexpected class ID {class_id} in CCTV label {matching_lbl[0]}")
                parts[0] = str(class_id)
                new_lines.append(" ".join(parts) + "\n")
            with open(dst_lbl_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        else:
            with open(dst_lbl_path, "w", encoding="utf-8") as f:
                pass
        copied += 1
    return copied

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
    print("=== Re-extracting baseline cheating_dataset ===")
    if os.path.exists(DST_DATASET_DIR):
        print(f"Removing existing destination folder {DST_DATASET_DIR}...")
        shutil.rmtree(DST_DATASET_DIR)
        
    os.makedirs(DST_DATASET_DIR, exist_ok=True)
    print(f"Extracting {ZIP_PATH} to {DST_DATASET_DIR}...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(DST_DATASET_DIR)
        
    # 2. Duplicate validation split to create test split to protect benchmark
    valid_images_dir = os.path.join(DST_DATASET_DIR, "valid", "images")
    valid_labels_dir = os.path.join(DST_DATASET_DIR, "valid", "labels")
    test_images_dir = os.path.join(DST_DATASET_DIR, "test", "images")
    test_labels_dir = os.path.join(DST_DATASET_DIR, "test", "labels")
    
    print("Creating untouched test benchmark split from baseline validation split...")
    shutil.copytree(valid_images_dir, test_images_dir)
    shutil.copytree(valid_labels_dir, test_labels_dir)
    
    # Update data.yaml test path
    yaml_path = os.path.join(DST_DATASET_DIR, "data.yaml")
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        new_lines = []
        for line in lines:
            if line.strip().startswith("test:"):
                new_lines.append("test: test/images\n")
            elif line.strip().startswith("path:"):
                new_lines.append(f"path: {DST_DATASET_DIR.replace('\\\\', '/')}\n")
            else:
                new_lines.append(line)
        with open(yaml_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print("Updated data.yaml of cheating_dataset.")

    # 3. Merge new_labeled_refined (webcam refined labels)
    print("\nMerging new_labeled_refined training data...")
    copy_refined_images(os.path.join(REFINED_DIR, "train", "images"), os.path.join(DST_DATASET_DIR, "train", "images"))
    remap_and_copy_refined_labels(os.path.join(REFINED_DIR, "train", "labels"), os.path.join(DST_DATASET_DIR, "train", "labels"))
    
    print("Merging new_labeled_refined validation data...")
    copy_refined_images(os.path.join(REFINED_DIR, "valid", "images"), os.path.join(DST_DATASET_DIR, "valid", "images"))
    remap_and_copy_refined_labels(os.path.join(REFINED_DIR, "valid", "labels"), os.path.join(DST_DATASET_DIR, "valid", "labels"))

    # 4. Merge CCTV v2 positive labeled images
    print("\nScanning for CCTV positive-labeled files in cctv_labeled_v2...")
    
    cctv_images = []
    cctv_labels = []
    
    # Recursively find images and labels
    for root, _, files in os.walk(CCTV_V2_DIR):
        for f in files:
            full_p = os.path.join(root, f)
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                cctv_images.append(full_p)
            elif f.endswith(".txt"):
                cctv_labels.append(full_p)
                
    print(f"Found {len(cctv_images)} CCTV images and {len(cctv_labels)} CCTV labels.")
    
    if not cctv_images:
        print("Warning: cctv_labeled_v2 is currently empty. No CCTV positives merged.")
    else:
        # Determine split structure
        # Check if train/valid directories exist inside CCTV_V2_DIR
        has_splits = False
        train_img_dir = os.path.join(CCTV_V2_DIR, "train", "images")
        if os.path.exists(train_img_dir):
            has_splits = True
            
        if has_splits:
            print("Merging CCTV images using existing train/valid splits...")
            for split in ["train", "valid"]:
                split_images = []
                for root, _, files in os.walk(os.path.join(CCTV_V2_DIR, split, "images")):
                    for f in files:
                        if f.lower().endswith((".jpg", ".jpeg", ".png")):
                            split_images.append(os.path.join(root, f))
                split_labels = []
                for root, _, files in os.walk(os.path.join(CCTV_V2_DIR, split, "labels")):
                    for f in files:
                        if f.endswith(".txt"):
                            split_labels.append(os.path.join(root, f))
                
                copied = copy_cctv_files(split_images, split_labels, split)
                print(f"  Merged {copied} CCTV images into cheating_dataset/{split}")
        else:
            print("Merging CCTV images using 80/20 train/valid split partition...")
            # Match images with labels first
            cctv_pairs = []
            for img in cctv_images:
                base_name = os.path.splitext(os.path.basename(img))[0]
                lbl_filename = f"{base_name}.txt"
                matching_lbl = [p for p in cctv_labels if os.path.basename(p) == lbl_filename]
                cctv_pairs.append((img, matching_lbl[0] if matching_lbl else None))
                
            # Random shuffle with seed 42
            random.seed(42)
            random.shuffle(cctv_pairs)
            
            split_idx = int(0.8 * len(cctv_pairs))
            train_pairs = cctv_pairs[:split_idx]
            val_pairs = cctv_pairs[split_idx:]
            
            # Copy to train
            train_images_list = [p[0] for p in train_pairs]
            train_labels_list = [p[1] for p in train_pairs if p[1] is not None]
            copied_tr = copy_cctv_files(train_images_list, train_labels_list, "train")
            
            # Copy to val
            val_images_list = [p[0] for p in val_pairs]
            val_labels_list = [p[1] for p in val_pairs if p[1] is not None]
            copied_val = copy_cctv_files(val_images_list, val_labels_list, "valid")
            
            print(f"  Merged {copied_tr} CCTV images into cheating_dataset/train")
            print(f"  Merged {copied_val} CCTV images into cheating_dataset/valid")

    # 5. Clean up any mismatch between images and labels
    # If there is a .jpg image, there MUST be a .txt label file (even if empty)
    for split in ["train", "valid", "test"]:
        split_dir = os.path.join(DST_DATASET_DIR, split)
        images_dir = os.path.join(split_dir, "images")
        labels_dir = os.path.join(split_dir, "labels")
        os.makedirs(labels_dir, exist_ok=True)
        for filename in os.listdir(images_dir):
            if filename.lower().endswith((".jpg", ".jpeg", ".png")):
                base_name = os.path.splitext(filename)[0]
                label_filename = f"{base_name}.txt"
                label_path = os.path.join(labels_dir, label_filename)
                if not os.path.exists(label_path):
                    with open(label_path, "w", encoding="utf-8") as f:
                        pass

    # 6. Report statistics
    print("\n" + "="*50)
    print("DATASET MERGE COMPLETE & STATISTICS REPORT")
    print("="*50)
    print("\nNew total image count per split:")
    total_imgs = 0
    for split in ["train", "valid", "test"]:
        img_count = len([f for f in os.listdir(os.path.join(DST_DATASET_DIR, split, "images")) if f.lower().endswith((".jpg", ".jpeg", ".png"))])
        lbl_count = len([f for f in os.listdir(os.path.join(DST_DATASET_DIR, split, "labels")) if f.endswith(".txt")])
        print(f"  {split:<6}: {img_count:<5} images | {lbl_count:<5} labels")
        total_imgs += img_count
    print(f"  Total : {total_imgs} images")
    
    # Class distribution
    split_dist, overall_dist = get_class_distribution(DST_DATASET_DIR, ["train", "valid", "test"])
    
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
        labels_dir = os.path.join(DST_DATASET_DIR, split, "labels")
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
