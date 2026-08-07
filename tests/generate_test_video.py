import os
import glob
import cv2

def generate_video(image_dir, output_video_path, fps=10, prefix="0001"):
    """
    Sequences images matching a prefix in image_dir into an MP4 video.
    """
    print(f"Searching for images in: {image_dir}")
    # Search for files matching prefix
    search_pattern = os.path.join(image_dir, f"{prefix}*.jpg")
    image_paths = sorted(glob.glob(search_pattern))
    
    if not image_paths:
        # Try lowercase extension
        search_pattern = os.path.join(image_dir, f"{prefix}*.jpeg")
        image_paths = sorted(glob.glob(search_pattern))
        
    if not image_paths:
        # Fallback to all jpg images if prefix fails
        search_pattern = os.path.join(image_dir, "*.jpg")
        image_paths = sorted(glob.glob(search_pattern))[:100]
        
    if not image_paths:
        raise FileNotFoundError(f"No images found in {image_dir} matching pattern.")
        
    print(f"Found {len(image_paths)} images to sequence.")
    
    # Read the first image to get dimensions
    first_img = cv2.imread(image_paths[0])
    if first_img is None:
        raise ValueError(f"Could not read the first image: {image_paths[0]}")
        
    h, w, _ = first_img.shape
    print(f"Video resolution: {w}x{h} at {fps} FPS")
    
    # Ensure output directory exists
    output_dir = os.path.dirname(output_video_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Define VideoWriter
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    writer = cv2.VideoWriter(output_video_path, fourcc, fps, (w, h))
    
    try:
        for idx, img_path in enumerate(image_paths):
            img = cv2.imread(img_path)
            if img is None:
                print(f"Warning: Skipping unreadable image {img_path}")
                continue
            # Resize image to match initial video size
            img_resized = cv2.resize(img, (w, h))
            writer.write(img_resized)
            if (idx + 1) % 20 == 0 or idx == len(image_paths) - 1:
                print(f"Processed {idx + 1}/{len(image_paths)} frames...")
                
        print(f"Successfully generated video: {output_video_path}")
    finally:
        writer.release()

if __name__ == "__main__":
    # Path relative to workspace root
    img_directory = os.path.join(
        "data", "datasets", "motion_reference", "scb_bowturnhead",
        "SCB_BowTurnHead_20250509", "SCB5-Turn-Bow-Head-2024-9-17", "images", "train"
    )
    out_video = "test_video.avi"
    
    generate_video(img_directory, out_video, fps=10, prefix="0001")
