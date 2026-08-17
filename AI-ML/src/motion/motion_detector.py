import os
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
            'morph_ops': config.get('morph_ops', [('open', 1), ('close', 1)]),
            'min_contour_area': config.get('min_contour_area', 100),  # Default contour area filter
            'learning_rate': config.get('learning_rate', -1),          # Background subtractor learning rate
            'grid_rows': config.get('grid_rows', 3),
            'grid_cols': config.get('grid_cols', 3),
            'custom_zones': config.get('custom_zones', None),          # Custom irregular zones (normalized bbox list)
            'zone_weights': config.get('zone_weights', None),          # Zone weights/masking (dict of zone_id: weight)
            'motion_threshold': config.get('motion_threshold', 0.02), # Active threshold ratio
            # Vibration suppression
            'vibration_suppression_enabled': config.get('vibration_suppression_enabled', True),
            'vibration_intensity_threshold': config.get('vibration_intensity_threshold', 0.01),
            'vibration_active_zone_ratio': config.get('vibration_active_zone_ratio', 0.70)
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

    def _get_pixel_zones(self, w, h):
        """
        Maps normalized zones configuration to pixel coordinates based on frame dimensions.
        Supports standard grids and custom irregular bounding boxes to address the 
        "Crowded Examination Halls" and uneven bench layouts.
        """
        custom_zones = self.config.get('custom_zones', None)
        pixel_zones = []
        if custom_zones:
            for idx, item in enumerate(custom_zones):
                if isinstance(item, dict):
                    zone_id = item.get('id', idx)
                    bbox = item['bbox']
                else:
                    zone_id = idx
                    bbox = item
                x_min, y_min, x_max, y_max = bbox
                pixel_zones.append({
                    'id': zone_id,
                    'x_start': int(x_min * w),
                    'y_start': int(y_min * h),
                    'x_end': int(x_max * w),
                    'y_end': int(y_max * h)
                })
        else:
            # Generate standard grid
            grid_rows = self.config['grid_rows']
            grid_cols = self.config['grid_cols']
            cell_h = h / grid_rows
            cell_w = w / grid_cols
            for r in range(grid_rows):
                for c in range(grid_cols):
                    y_start = int(r * cell_h)
                    y_end = int((r + 1) * cell_h) if r < grid_rows - 1 else h
                    x_start = int(c * cell_w)
                    x_end = int((c + 1) * cell_w) if c < grid_cols - 1 else w
                    zone_id = r * grid_cols + c
                    pixel_zones.append({
                        'id': zone_id,
                        'x_start': x_start,
                        'y_start': y_start,
                        'x_end': x_end,
                        'y_end': y_end
                    })
        return pixel_zones

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
        vibration_suppressed_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            timestamp_sec = frame_idx / fps
            
            # 1. Apply background subtractor with configurable learning rate.
            # This directly mitigates "Lighting Variations" risks by adjusting how fast the
            # background subtractor adapts to daylight changes or slow-moving shadows.
            learning_rate = self.config['learning_rate']
            fg_mask = self.subtractor.apply(frame, learningRate=learning_rate)
            
            # 2. Extract foreground only (filter shadows, which MOG2 marks as 127)
            if self.config['detect_shadows']:
                _, fg_mask = cv2.threshold(fg_mask, 250, 255, cv2.THRESH_BINARY)
            
            # 3. Apply configurable morphological operations to remove small noise blobs.
            # This mitigates "Camera Noise" risk from compression artifacts and sensor noise.
            for op, iterations in self.config['morph_ops']:
                if op == 'open':
                    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, self.kernel, iterations=iterations)
                elif op == 'close':
                    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, self.kernel, iterations=iterations)
                elif op == 'erode':
                    fg_mask = cv2.erode(fg_mask, self.kernel, iterations=iterations)
                elif op == 'dilate':
                    fg_mask = cv2.dilate(fg_mask, self.kernel, iterations=iterations)
            
            # 4. Filter contours below minimum area threshold.
            # This mitigates "Camera Noise" risk by ignoring high-frequency spatial flickering.
            min_area = self.config['min_contour_area']
            if min_area > 0:
                contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                fg_mask_filtered = np.zeros_like(fg_mask)
                for c in contours:
                    if cv2.contourArea(c) >= min_area:
                        cv2.drawContours(fg_mask_filtered, [c], -1, 255, -1)
                fg_mask = fg_mask_filtered

            # Compute zone measurements
            h, w = fg_mask.shape[:2]
            pixel_zones = self._get_pixel_zones(w, h)
            
            # 5. Track motion intensity independently per zone.
            # This addresses the "Crowded Examination Halls" risk, keeping nearby student
            # movements separated and preventing them from merging into one global blob.
            zone_intensities = {}
            for zone in pixel_zones:
                zone_id = zone['id']
                x_start, y_start = zone['x_start'], zone['y_start']
                x_end, y_end = zone['x_end'], zone['y_end']
                
                zone_crop = fg_mask[y_start:y_end, x_start:x_end]
                # Calculate fraction of pixels that represent motion (white pixels)
                ratio = np.mean(zone_crop) / 255.0 if zone_crop.size > 0 else 0.0
                
                # Apply zone weights if configured
                weights = self.config.get('zone_weights', None)
                if weights and zone_id in weights:
                    ratio *= weights[zone_id]
                    
                zone_intensities[zone_id] = float(ratio)
                
            # 6. Camera Vibration Detection & Suppression.
            # Identifies when motion is spread unusually uniformly across zones simultaneously.
            if self.config['vibration_suppression_enabled'] and len(zone_intensities) > 0:
                v_threshold = self.config['vibration_intensity_threshold']
                v_ratio_thresh = self.config['vibration_active_zone_ratio']
                
                active_zones = sum(1 for intensity in zone_intensities.values() if intensity > v_threshold)
                active_ratio = active_zones / len(zone_intensities)
                
                if active_ratio >= v_ratio_thresh:
                    # Uniform global motion: suppress frame motion signals.
                    vibration_suppressed_count += 1
                    for zone_id in zone_intensities:
                        zone_intensities[zone_id] = 0.0
            
            yield frame_idx, timestamp_sec, zone_intensities, frame
            frame_idx += 1
            
        cap.release()
        
        # Print a summary log on complete execution
        if self.config['vibration_suppression_enabled'] and vibration_suppressed_count > 0:
            print(f"[Vibration Control] Suppressed motion in {vibration_suppressed_count} frames due to global camera vibration / shake.")

    def detect_motion(self, video_path):
        """
        Utility method to process entire video synchronously.
        """
        results = []
        for frame_idx, timestamp_sec, intensities, _ in self.detect_motion_generator(video_path):
            results.append({
                'frame_idx': frame_idx,
                'timestamp_sec': timestamp_sec,
                'zone_intensities': intensities
            })
        return results

    def visualize_grid(self, frame, zone_intensities, output_path=None, show_all_intensities=True):
        """
        Draws the zone boundaries and their current motion intensities on the frame.
        Shades active zones based on their intensity and saves the frame if output_path is provided.
        """
        vis_frame = frame.copy()
        h, w = vis_frame.shape[:2]
        pixel_zones = self._get_pixel_zones(w, h)
        
        # Overlay for colored rectangles
        overlay = np.zeros_like(vis_frame)
        
        for zone in pixel_zones:
            zone_id = zone['id']
            x_start, y_start = zone['x_start'], zone['y_start']
            x_end, y_end = zone['x_end'], zone['y_end']
            
            intensity = zone_intensities.get(zone_id, 0.0)
            is_active = intensity >= self.config['motion_threshold']
            
            if is_active:
                # Highlight active zone in red (semi-transparent)
                cv2.rectangle(overlay, (x_start, y_start), (x_end, y_end), (0, 0, 255), -1)
                
        # Blend the color overlay with the frame (25% opacity for shading)
        cv2.addWeighted(overlay, 0.25, vis_frame, 1.0, 0, dst=vis_frame)
        
        # Now draw borders and text labels on top to keep them crisp
        for zone in pixel_zones:
            zone_id = zone['id']
            x_start, y_start = zone['x_start'], zone['y_start']
            x_end, y_end = zone['x_end'], zone['y_end']
            
            intensity = zone_intensities.get(zone_id, 0.0)
            is_active = intensity >= self.config['motion_threshold']
            
            # Draw boundary line
            border_color = (0, 255, 0) if is_active else (200, 200, 200)
            border_thickness = 2 if is_active else 1
            cv2.rectangle(vis_frame, (x_start, y_start), (x_end, y_end), border_color, border_thickness)
            
            if show_all_intensities or is_active:
                # Overlay label
                text = f"Zone {zone_id}: {intensity:.3f}"
                text_color = (0, 0, 255) if is_active else (255, 255, 255)
                # Outline
                cv2.putText(vis_frame, text, (x_start + 10, y_start + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2, cv2.LINE_AA)
                # Text
                cv2.putText(vis_frame, text, (x_start + 10, y_start + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1, cv2.LINE_AA)
                
        if output_path:
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)
            cv2.imwrite(output_path, vis_frame)
            
        return vis_frame
