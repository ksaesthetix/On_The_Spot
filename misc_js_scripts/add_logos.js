const fs = require('fs');
const path = './cannesfringeeventdata_with_coords.json';

const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const updated = data.map(ev => ({
    ...ev,
    logo: ev.logo || ""
}));

fs.writeFileSync(path, JSON.stringify(updated, null, 2));
console.log('Added "logo" field to all entries.');