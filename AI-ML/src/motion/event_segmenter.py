class EventSegmenter:
    """
    Groups frame-by-frame motion intensities into continuous event segments
    per zone using a state machine with min duration and gap thresholds.
    """
    def __init__(self, config=None):
        if config is None:
            config = {}
            
        self.config = {
            'motion_threshold': config.get('motion_threshold', 0.02),
            'min_event_frames': config.get('min_event_frames', 5),    # N frames to start
            'max_gap_frames': config.get('max_gap_frames', 15)       # M frames to end
        }

    def segment_events(self, motion_results):
        """
        Segments the input list of per-frame zone intensities into events.
        Args:
            motion_results (list): list of dicts with keys 'frame_idx', 'timestamp_sec', 'zone_intensities'
        Returns:
            list: list of dicts, each representing an event:
                  {start_time, end_time, zone_id, avg_motion_intensity}
        """
        if not motion_results:
            return []

        # Find all zone IDs
        zones = set()
        for res in motion_results:
            zones.update(res['zone_intensities'].keys())

        events = []
        motion_threshold = self.config['motion_threshold']
        min_event_frames = self.config['min_event_frames']
        max_gap_frames = self.config['max_gap_frames']

        for zone_id in sorted(list(zones)):
            # State for this zone
            state = 'IDLE'  # 'IDLE' or 'EVENT'
            buffer = []     # temporary list of (timestamp, intensity) during IDLE candidate or EVENT gap
            event_frames = [] # list of (timestamp, intensity) in the current event
            consecutive_active = 0
            consecutive_inactive = 0
            event_start_time = 0.0

            for res in motion_results:
                timestamp = res['timestamp_sec']
                intensity = res['zone_intensities'].get(zone_id, 0.0)
                is_above = intensity >= motion_threshold

                if state == 'IDLE':
                    if is_above:
                        consecutive_active += 1
                        buffer.append((timestamp, intensity))
                        if consecutive_active >= min_event_frames:
                            # Start of event detected
                            state = 'EVENT'
                            event_start_time = buffer[0][0]
                            event_frames = list(buffer)
                            buffer = []
                            consecutive_active = 0
                    else:
                        consecutive_active = 0
                        buffer = []

                elif state == 'EVENT':
                    if is_above:
                        consecutive_inactive = 0
                        # If we had a temporary gap, append the inactive frames to the event
                        if buffer:
                            event_frames.extend(buffer)
                            buffer = []
                        event_frames.append((timestamp, intensity))
                    else:
                        consecutive_inactive += 1
                        buffer.append((timestamp, intensity))
                        if consecutive_inactive >= max_gap_frames:
                            # End of event detected
                            state = 'IDLE'
                            # End time is the timestamp of the last confirmed active frame
                            end_time = event_frames[-1][0] if event_frames else timestamp
                            avg_intensity = sum(f[1] for f in event_frames) / len(event_frames) if event_frames else 0.0
                            
                            events.append({
                                'start_time': round(event_start_time, 2),
                                'end_time': round(end_time, 2),
                                'zone_id': zone_id,
                                'avg_motion_intensity': round(avg_intensity, 4)
                            })
                            
                            # Clean up state
                            event_frames = []
                            buffer = []
                            consecutive_inactive = 0
                            consecutive_active = 0

            # Handle edge case: video ended while event was still active
            if state == 'EVENT' and event_frames:
                end_time = event_frames[-1][0]
                avg_intensity = sum(f[1] for f in event_frames) / len(event_frames)
                events.append({
                    'start_time': round(event_start_time, 2),
                    'end_time': round(end_time, 2),
                    'zone_id': zone_id,
                    'avg_motion_intensity': round(avg_intensity, 4)
                })

        # Sort events by start time, then zone_id
        events.sort(key=lambda x: (x['start_time'], x['zone_id']))
        return events
