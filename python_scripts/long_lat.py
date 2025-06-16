import json
import requests
import time

# Cannes bounding box
MIN_LAT, MAX_LAT = 43.5, 43.6
MIN_LON, MAX_LON = 6.9, 7.2

# Load the data
with open("cannesfringeeventdata.json", "r", encoding="utf-8") as f:
    events = json.load(f)

def is_in_cannes(lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
        return MIN_LAT <= lat <= MAX_LAT and MIN_LON <= lon <= MAX_LON
    except (TypeError, ValueError):
        return False

# Geocoding function using Nominatim
def geocode_location(location):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location,
        "format": "json",
        "limit": 1,
        "countrycodes": "fr"
    }
    response = requests.get(url, params=params, headers={"User-Agent": "CannesEventsMapper/1.0"})
    if response.status_code == 200 and response.json():
        data = response.json()[0]
        lat, lon = data["lat"], data["lon"]
        if is_in_cannes(lat, lon):
            return lat, lon
    return None, None

# Loop through events and add lat/lon
for event in events:
    location = event.get("location", "").strip()
    if location and location.lower() not in ["tba", "varied", "various"]:
        lat, lon = geocode_location(location)
        event["latitude"] = lat
        event["longitude"] = lon
        print(f"Added coordinates for '{location}': lat={lat}, lon={lon}")
        time.sleep(1)  # Respect API rate limits
    else:
        event["latitude"] = None
        event["longitude"] = None

# Save the updated data
with open("cannesfringeeventdata_with_coords.json", "w", encoding="utf-8") as f:
    json.dump(events, f, ensure_ascii=False, indent=2)

print("Done adding coordinates.")
