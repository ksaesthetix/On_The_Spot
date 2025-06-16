import csv
import json

input_file = 'Cannes Lions Fringe Events List 2025.csv'
output_file = 'hosts.json'

hosts = set()

with open(input_file, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        host = row.get('HOST ') or row.get('HOST')  # handle possible trailing space
        if host:
            hosts.add(host.strip())

with open(output_file, 'w', encoding='utf-8') as jsonfile:
    json.dump(sorted(list(hosts)), jsonfile, indent=2, ensure_ascii=False)

print(f"Extracted {len(hosts)} hosts to {output_file}")