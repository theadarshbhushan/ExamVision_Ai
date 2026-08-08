import os
import time
import cv2

# --- CONFIGURABLE PARAMETERS ---
WIDTH = 640                  # Target camera resolution width
HEIGHT = 480                 # Target camera resolution height
FPS = 20                     # Target frame rate for recording
MAX_DURATION_SECONDS = 180   # Auto-stop after 3 minutes (180 seconds)
OUTPUT_FORMAT = "mp4"        # Video format: "mp4" or "avi"
OUTPUT_DIR = os.path.join("data", "self_recorded")
# ------------------------------

def draw_text_with_shadow(img, text, org, font_face, font_scale, color, thickness=1, shadow_color=(0, 0, 0), shadow_offset=(2, 2)):
    """
    Draws text with a drop shadow for high readability against any background.
    """
    shadow_org = (org[0] + shadow_offset[0], org[1] + shadow_offset[1])
    cv2.putText(img, text, shadow_org, font_face, font_scale, shadow_color, thickness + 1, cv2.LINE_AA)
    cv2.putText(img, text, org, font_face, font_scale, color, thickness, cv2.LINE_AA)

def main():
    print("=== ExamVision AI — Webcam Recording Utility ===")
    
    # 1. Open the default webcam
    print("Initializing webcam (index 0)...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open the default webcam (index 0).")
        print("Please ensure your webcam is connected and not in use by another application.")
        return

    # Set resolution and FPS on the capture device
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, FPS)

    # Read back actual resolution to ensure VideoWriter matches exactly
    actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    actual_fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Handle cases where get() returns 0 or invalid values
    if actual_width <= 0 or actual_height <= 0:
        actual_width, actual_height = WIDTH, HEIGHT
    
    print(f"Webcam active: {actual_width}x{actual_height} (Target: {WIDTH}x{HEIGHT})")
    print(f"Target recording FPS: {FPS} (Webcam hardware reported FPS: {actual_fps})")
    print("-------------------------------------------------")
    print("Keyboard Controls:")
    print("  Press 'R' - Start recording")
    print("  Press 'S' - Stop recording and save file")
    print("  Press 'Q' - Quit program")
    print("-------------------------------------------------")

    recording = False
    out_writer = None
    start_time = None
    output_path = None
    frames_recorded = 0

    preview_window_name = "ExamVision AI - Webcam Preview (Press Q to quit)"
    cv2.namedWindow(preview_window_name, cv2.WINDOW_AUTOSIZE)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to grab frame from camera. Exiting...")
                break

            # Create a copy for the preview window so overlays are not burned into the recorded video file.
            # This ensures the saved test clip remains a clean, natural video for motion detection validation.
            preview_frame = frame.copy()
            current_time = time.time()

            # Handle recording state and autostop logic
            if recording:
                elapsed_seconds = current_time - start_time
                
                # Check maximum duration auto-stop limit
                if elapsed_seconds >= MAX_DURATION_SECONDS:
                    print(f"\nAuto-stop: Maximum recording duration of {MAX_DURATION_SECONDS}s reached.")
                    break

                # Write clean frame to output video file
                if out_writer is not None:
                    out_writer.write(frame)
                    frames_recorded += 1

                # Draw "REC" indicator (filled red circle) and red text on preview window
                pulse = int((current_time * 2) % 2)  # Blink effect for the REC light
                if pulse == 0:
                    cv2.circle(preview_frame, (30, 30), 8, (0, 0, 255), -1)
                
                # Format elapsed time
                mins, secs = divmod(int(elapsed_seconds), 60)
                time_str = f"REC {mins:02d}:{secs:02d} / {int(MAX_DURATION_SECONDS/60):02d}:00"
                draw_text_with_shadow(preview_frame, time_str, (50, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                # Idle / Ready indicator
                draw_text_with_shadow(preview_frame, "READY", (30, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            # Draw constant on-screen instructions at the bottom of the window
            instructions = "Press R to start recording | S to stop | Q to quit"
            draw_text_with_shadow(preview_frame, instructions, (20, actual_height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            # Show the preview frame with overlays
            cv2.imshow(preview_window_name, preview_frame)

            # Wait for keypress
            key = cv2.waitKey(1) & 0xFF
            
            # 'R' or 'r' - Start recording
            if key == ord('r') or key == ord('R'):
                if not recording:
                    # Create output directory if it doesn't exist
                    os.makedirs(OUTPUT_DIR, exist_ok=True)
                    
                    timestamp = time.strftime("%Y%m%d_%H%M%S")
                    filename = f"clip_{timestamp}.{OUTPUT_FORMAT.lower()}"
                    output_path = os.path.join(OUTPUT_DIR, filename)

                    # Determine codec based on selected format
                    if OUTPUT_FORMAT.lower() == "mp4":
                        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                    else:
                        fourcc = cv2.VideoWriter_fourcc(*'MJPG')

                    out_writer = cv2.VideoWriter(output_path, fourcc, FPS, (actual_width, actual_height))
                    
                    if not out_writer.isOpened():
                        print(f"Error: Could not open VideoWriter for path: {output_path}")
                        out_writer = None
                        output_path = None
                    else:
                        recording = True
                        start_time = current_time
                        frames_recorded = 0
                        print(f"Recording started... Saving to: {output_path}")
                else:
                    print("Already recording...")

            # 'S' or 's' - Stop recording
            elif key == ord('s') or key == ord('S'):
                if recording:
                    print("Recording stopped by user request.")
                    break
                else:
                    print("Not currently recording. Press 'R' to start recording.")

            # 'Q' or 'q' - Quit program
            elif key == ord('q') or key == ord('Q'):
                if recording:
                    print("Recording stopped due to exit request.")
                else:
                    print("Exiting...")
                break

    finally:
        # Clean up resources
        cap.release()
        if out_writer is not None:
            out_writer.release()
        cv2.destroyAllWindows()

        # Print saved file path clearly on exit
        if output_path and frames_recorded > 0:
            abs_path = os.path.abspath(output_path)
            print("\n" + "="*60)
            print("RECORDING SUCCESSFUL")
            print(f"Saved file path: {abs_path}")
            print(f"Total duration:  {time.time() - start_time:.1f} seconds")
            print(f"Total frames:    {frames_recorded}")
            print("="*60 + "\n")
        else:
            print("\nNo recording was saved.\n")

if __name__ == "__main__":
    main()
