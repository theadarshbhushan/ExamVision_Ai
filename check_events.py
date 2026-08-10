import json
with open("data/results/clip_20260810_141828_results.json") as f:
    results = json.load(f)
for r in results:
    print(f"Event {r['event_id']}: {r['start_time']}s - {r['end_time']}s, zone {r['zone_id']}")
