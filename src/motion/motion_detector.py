import cv2
import numpy as np

class MotionDetector:
    """
    Offline motion detector that performs frame-to-frame background subtraction,
    filters noise using morphological operations, and computes motion intensity
    per zone in a configurable grid.
    """
    def __init__(self, config=None):
        if config is None:
            config = {}
        
        self.config = {
            'subtractor_type': config.get('subtractor_type', 'MOG2'),
            'history': config.get('history', 500),
            'var_threshold': config.get('var_threshold', 16),
            'detect_shadows': config.get('detect_shadows', True),
            'morph_kernel_size': config.get('morph_kernel_size', 3),
            'morph_iterations': config.get('morph_iterations', 1),
            'grid_rows': config.get('grid_rows', 3),
            'grid_cols': config.get('grid_cols', 3),
            'motion_threshold': config.get('motion_threshold', 0.02)  # Active threshold ratio
        }
        
        # Initialize background subtractor
        sub_type = self.config['subtractor_type'].upper()
        if sub_type == 'KNN':
            self.subtractor = cv2.createBackgroundSubtractorKNN(
                history=self.config['history'],
                dist2Threshold=self.config['var_threshold'],
                detectShadows=self.config['detect_shadows']
            )
        else:
            self.subtractor = cv2.createBackgroundSubtractorMOG2(
                history=self.config['history'],
                varThreshold=self.config['var_threshold'],
                detectShadows=self.config['detect_shadows']
            )
            
        # Create structuring element for morph operations
        k_size = self.config['morph_kernel_size']
        self.kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))

    def detect_motion_generator(self, video_path):
        """
        Generator yielding motion estimation frame-by-frame.
        Yields:
            tuple: (frame_idx, timestamp_sec, dict of per-zone intensities)
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise IOError(f"Could not open video source: {video_path}")
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 10.0  # Fallback FPS default
            
        frame_idx = 0
        grid_rows = self.config['grid_rows']
        grid_cols = self.config['grid_cols']
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            timestamp_sec = frame_idx / fps
            
            # Apply background subtractor
            fg_mask = self.subtractor.apply(frame)
            
            # Extract foreground only (filter shadows, which are marked 127)
            if self.config['detect_shadows']:
                _, fg_mask = cv2.threshold(fg_mask, 250, 255, cv2.THRESH_BINARY)
            
            # Noise filtering using morphological opening/closing
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, self.kernel, iterations=self.config['morph_iterations'])
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, self.kernel, iterations=self.config['morph_iterations'])
            
            # Compute grid measurements
            h, w = fg_mask.shape[:2]
            cell_h = h / grid_rows
            cell_w = w / grid_cols
            
            zone_intensities = {}
            for r in range(grid_rows):
                for c in range(grid_cols):
                    # Crop the mask to the cell boundaries
                    y_start = int(r * cell_h)
                    y_end = int((r + 1) * cell_h) if r < grid_rows - 1 else h
                    x_start = int(c * cell_w)
                    x_end = int((c + 1) * cell_w) if c < grid_cols - 1 else w
                    
                    zone_crop = fg_mask[y_start:y_end, x_start:x_end]
                    # Calculate fraction of pixels that represent motion (white pixels)
                    ratio = np.mean(zone_crop) / 255.0
                    zone_id = r * grid_cols + c
                    zone_intensities[zone_id] = float(ratio)
                    
            yield frame_idx, timestamp_sec, zone_intensities
            frame_idx += 1
            
        cap.release()

    def detect_motion(self, video_path):
        """
        Utility method to process entire video synchronously.
        """
        results = []
        for frame_idx, timestamp_sec, intensities in self.detect_motion_generator(video_path):
            results.append({
                'frame_idx': frame_idx,
                'timestamp_sec': timestamp_sec,
                'zone_intensities': intensities
            })
        return results
