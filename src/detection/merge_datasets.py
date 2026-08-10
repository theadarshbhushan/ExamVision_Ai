import os
import shutil

def remap_and_copy_labels(src_dir, dst_dir):
    os.makedirs(dst_dir, exist_ok=True)
    for filename in os.listdir(src_dir):
        if not filename.endswith(".txt"):
            continue
        src_path = os.path.join(src_dir, filename)
        dst_path = os.path.join(dst_dir, filename)
        
        # Check collision
        if os.path.exists(dst_path):
            print(f"Warning: Label file collision for {filename}. Renaming...")
            base, ext = os.path.splitext(filename)
            dst_path = os.path.join(dst_dir, f"{base}_new{ext}")
            
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

def copy_images(src_dir, dst_dir):
    os.makedirs(dst_dir, exist_ok=True)
    for filename in os.listdir(src_dir):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        src_path = os.path.join(src_dir, filename)
        dst_path = os.path.join(dst_dir, filename)
        
        # Check collision
        if os.path.exists(dst_path):
            print(f"Warning: Image file collision for {filename}. Renaming...")
            base, ext = os.path.splitext(filename)
            dst_path = os.path.join(dst_dir, f"{base}_new{ext}")
            
        shutil.copy2(src_path, dst_path)

def main():
    print("=== ExamVision AI Dataset Merging ===")
    
    cheating_dataset_dir = os.path.abspath(os.path.join("data", "datasets", "phone_chit_detection", "cheating_dataset"))
    new_labeled_dir = os.path.abspath(os.path.join("data", "datasets", "phone_chit_detection", "new_labeled"))
    
    # 1. Verify existence of directories
    if not os.path.exists(cheating_dataset_dir):
        print(f"Error: cheating_dataset directory not found at {cheating_dataset_dir}")
        return
    if not os.path.exists(new_labeled_dir):
        print(f"Error: new_labeled directory not found at {new_labeled_dir}")
        return
        
    # 2. Duplicate validation split to create test split to protect benchmark
    valid_images_dir = os.path.join(cheating_dataset_dir, "valid", "images")
    valid_labels_dir = os.path.join(cheating_dataset_dir, "valid", "labels")
    test_images_dir = os.path.join(cheating_dataset_dir, "test", "images")
    test_labels_dir = os.path.join(cheating_dataset_dir, "test", "labels")
    
    if not os.path.exists(test_images_dir):
        print(f"Creating test split at {os.path.dirname(test_images_dir)} from existing validation split...")
        shutil.copytree(valid_images_dir, test_images_dir)
        shutil.copytree(valid_labels_dir, test_labels_dir)
        print("Test split created successfully.")
    else:
        print("Test split already exists.")
        
    # 3. Update data.yaml of cheating_dataset
    yaml_path = os.path.join(cheating_dataset_dir, "data.yaml")
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        new_lines = []
        modified = False
        for line in lines:
            if line.strip().startswith("test:"):
                # Change test: valid/images to test: test/images
                new_lines.append("test: test/images\n")
                modified = True
            else:
                new_lines.append(line)
        if modified:
            with open(yaml_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
            print("Updated data.yaml test path to 'test/images'.")
        else:
            print("data.yaml already updated or 'test:' key not found.")
            
    # 4. Merge new_labeled/train into cheating_dataset/train
    print("\nMerging training data...")
    new_train_images = os.path.join(new_labeled_dir, "train", "images")
    new_train_labels = os.path.join(new_labeled_dir, "train", "labels")
    dst_train_images = os.path.join(cheating_dataset_dir, "train", "images")
    dst_train_labels = os.path.join(cheating_dataset_dir, "train", "labels")
    
    copy_images(new_train_images, dst_train_images)
    remap_and_copy_labels(new_train_labels, dst_train_labels)
    
    # 5. Merge new_labeled/valid into cheating_dataset/valid
    print("\nMerging validation data...")
    new_valid_images = os.path.join(new_labeled_dir, "valid", "images")
    new_valid_labels = os.path.join(new_labeled_dir, "valid", "labels")
    dst_valid_images = os.path.join(cheating_dataset_dir, "valid", "images")
    dst_valid_labels = os.path.join(cheating_dataset_dir, "valid", "labels")
    
    copy_images(new_valid_images, dst_valid_images)
    remap_and_copy_labels(new_valid_labels, dst_valid_labels)
    
    print("\nMerge complete. Counts in cheating_dataset:")
    for split in ["train", "valid", "test"]:
        img_count = len([f for f in os.listdir(os.path.join(cheating_dataset_dir, split, "images")) if f.lower().endswith((".jpg", ".jpeg", ".png"))])
        lbl_count = len([f for f in os.listdir(os.path.join(cheating_dataset_dir, split, "labels")) if f.endswith(".txt")])
        print(f"  {split}: {img_count} images, {lbl_count} labels")

if __name__ == "__main__":
    main()
