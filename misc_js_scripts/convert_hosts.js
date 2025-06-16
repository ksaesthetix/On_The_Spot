// This script converts an array of objects like:
// { name: "...", lat: ..., lng: ..., type: "..." }
// into the desired format for cannesfringeeventdata_with_coords.json

const fs = require('fs');

// Load your original hosts data
const hosts = require('./originalhosts.json');

// Map to new format
const converted = hosts.map(entry => ({
    date_time: "",
    "host ": entry.name || "",
    event_name: entry.name || "",
    description: "",
    event_type: entry.type || "",
    url_link: "",
    rsvp: "",
    location: "",
    latitude: entry.lat || null,
    longitude: entry.lng || null
}));

// Save to a new file
fs.writeFileSync(
    './org_host_data.json',
    JSON.stringify(converted, null, 2)
);

console.log('Conversion complete! Output written to cannesfringeeventdata_with_coords.json');