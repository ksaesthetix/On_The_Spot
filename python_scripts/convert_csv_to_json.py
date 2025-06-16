# Save this as convert_csv_to_json.py
import csv
import json

input_file = 'Cannes Lions Fringe Events List 2025.csv'
output_file = 'cannesfringeeventdata.json'

with open(input_file, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    data = [row for row in reader]

with open(output_file, 'w', encoding='utf-8') as jsonfile:
    json.dump(data, jsonfile, indent=2, ensure_ascii=False)

print(f"Converted {input_file} to {output_file}")