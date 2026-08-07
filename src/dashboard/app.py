import streamlit as st
import os
import json

st.set_page_config(
    page_title="ExamVision AI Dashboard",
    page_icon="👁️",
    layout="wide"
)

st.title("👁️ ExamVision AI Dashboard")
st.subheader("Offline Video Segmentation & ROI Detection (Drishti AI Hackathon 2026)")

st.markdown("""
This prototype segments exam hall CCTV footage to identify zones of active motion.
Flagged areas are targeted for secondary analysis (YOLOv8 phone/chit detection).
""")

# Sidebar settings
st.sidebar.header("🔧 Motion Detection Configuration")
subtractor_type = st.sidebar.selectbox("Background Subtractor", ["MOG2", "KNN"])
grid_rows = st.sidebar.slider("Grid Rows (N)", 1, 10, 3)
grid_cols = st.sidebar.slider("Grid Columns (M)", 1, 10, 3)
motion_threshold = st.sidebar.slider("Motion Threshold", 0.005, 0.1, 0.02, step=0.005)
min_event_frames = st.sidebar.slider("Min Event Duration (Frames)", 2, 30, 5)
max_gap_frames = st.sidebar.slider("Max Gap Duration (Frames)", 2, 60, 15)

# Main container
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("📹 Video Analysis Source")
    video_path = st.text_input("Enter local video file path:", placeholder="e.g. test_video.mp4")
    
    # Upload simulation
    uploaded_file = st.file_uploader("Or upload video file:", type=["mp4", "avi", "mov"])
    if uploaded_file:
        # Save temp file
        temp_path = os.path.join("temp_uploaded_video.mp4")
        with open(temp_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        video_path = temp_path
        st.success("Uploaded file saved locally.")

    if st.button("🚀 Run Analysis Pipeline"):
        if not video_path:
            st.error("Please provide a video path.")
        elif not os.path.exists(video_path):
            st.error(f"Video file not found at: {video_path}")
        else:
            st.info("Running pipeline... (stub simulation)")
            # TODO: Wire up to MotionDetector and EventSegmenter
            st.success("Analysis complete! (Results would be visualized below)")

with col2:
    st.subheader("📊 Detected Events & Alerts")
    st.info("No events analyzed yet. Run analysis to display results here.")
    
    # Stub for event list
    # st.json(events)
    # st.dataframe(events_df)
