import pytest
from src.motion.motion_detector import MotionDetector
from src.motion.event_segmenter import EventSegmenter

def test_motion_detector_init():
    """
    Verifies that the MotionDetector initializes with correct default configuration.
    """
    detector = MotionDetector()
    assert detector.config['subtractor_type'] == 'MOG2'
    assert detector.config['grid_rows'] == 3
    assert detector.config['grid_cols'] == 3
    assert detector.config['motion_threshold'] == 0.02

def test_event_segmenter_segmentation():
    """
    Verifies that the EventSegmenter state machine correctly handles
    event start thresholds, bridges short gaps, and ends events on long gaps.
    """
    segmenter = EventSegmenter({
        'motion_threshold': 0.05,
        'min_event_frames': 3,
        'max_gap_frames': 2
    })
    
    # Simulated frame intensities for zone 0:
    # Frame 0: 0.01 (idle)
    # Frame 1: 0.08 (active candidate 1)
    # Frame 2: 0.08 (active candidate 2)
    # Frame 3: 0.08 (active candidate 3 -> Event starts at t=0.1)
    # Frame 4: 0.02 (gap frame 1)
    # Frame 5: 0.09 (active -> reset gap)
    # Frame 6: 0.01 (gap frame 1)
    # Frame 7: 0.01 (gap frame 2 -> Event ends at last active frame: t=0.5)
    motion_results = [
        {'frame_idx': 0, 'timestamp_sec': 0.0, 'zone_intensities': {0: 0.01}},
        {'frame_idx': 1, 'timestamp_sec': 0.1, 'zone_intensities': {0: 0.08}},
        {'frame_idx': 2, 'timestamp_sec': 0.2, 'zone_intensities': {0: 0.08}},
        {'frame_idx': 3, 'timestamp_sec': 0.3, 'zone_intensities': {0: 0.08}},
        {'frame_idx': 4, 'timestamp_sec': 0.4, 'zone_intensities': {0: 0.02}},
        {'frame_idx': 5, 'timestamp_sec': 0.5, 'zone_intensities': {0: 0.09}},
        {'frame_idx': 6, 'timestamp_sec': 0.6, 'zone_intensities': {0: 0.01}},
        {'frame_idx': 7, 'timestamp_sec': 0.7, 'zone_intensities': {0: 0.01}},
    ]
    
    events = segmenter.segment_events(motion_results)
    
    assert len(events) == 1
    event = events[0]
    assert event['zone_id'] == 0
    assert event['start_time'] == 0.1
    assert event['end_time'] == 0.5
    # Avg of active frames + bridged gaps: [0.08, 0.08, 0.08, 0.02, 0.09]
    expected_avg = (0.08 + 0.08 + 0.08 + 0.02 + 0.09) / 5
    assert pytest.approx(event['avg_motion_intensity'], 0.0001) == expected_avg
