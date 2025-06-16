import json
from rapidfuzz import fuzz

# Load hosts
with open('host_groups2.json', encoding='utf-8') as f:
    hosts = json.load(f)

names = [host['name'] for host in hosts if 'name' in host]
groups = []
used = set()

# Threshold for similarity (adjust as needed)
SIMILARITY_THRESHOLD = 85

for i, name in enumerate(names):
    if i in used:
        continue
    group = [name]
    used.add(i)
    for j in range(i + 1, len(names)):
        if j in used:
            continue
        if fuzz.token_sort_ratio(name, names[j]) >= SIMILARITY_THRESHOLD:
            group.append(names[j])
            used.add(j)
    groups.append(group)

# Output as JSON
with open('host_groups3.json', 'w', encoding='utf-8') as f:
    json.dump(groups, f, indent=2, ensure_ascii=False)

print(f"Grouped hosts written to host_groups3.json")