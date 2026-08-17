import os
import json

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
results_path = os.path.join(base_dir, "data", "results", "clip_20260810_141828_results.json")

if os.path.exists(results_path):
    with open(results_path) as f:
        results = json.load(f)
    for r in results:
        print(f"Event {r['event_id']}: {r['start_time']}s - {r['end_time']}s, zone {r['zone_id']}")
else:
    print(f"Results file not found at: {results_path}")
