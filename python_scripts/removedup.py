import json

with open('cannesfringeeventdata_with_coords.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

seen = set()
unique_events = []
duplicates_removed = 0

for event in data:
    # Define what makes an event unique; adjust fields as needed
    # Here, we use name + date_time + longitude + latitude if available
    key = (
        event.get('name'),
        event.get('date_time'),
        event.get('longitude'),
        event.get('latitude')
    )
    if key not in seen:
        unique_events.append(event)
        seen.add(key)
    else:
        print(f"Duplicate removed: {event}")
        duplicates_removed += 1

print(f"Total duplicates removed: {duplicates_removed}")

with open('cannesfringeeventdata_with_coords_deduped.json', 'w', encoding='utf-8') as f:
    json.dump(unique_events, f, ensure_ascii=False, indent=2)