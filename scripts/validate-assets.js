'use strict';
const fs = require('node:fs');
const path = require('node:path');

const catalogDir = path.join(__dirname, '..', 'assets', 'catalog');
const files = ['materials.json', 'geometry.json', 'decorations.json', 'ingredients.json'];
const ids = new Set();
for (const file of files) {
  const document = JSON.parse(fs.readFileSync(path.join(catalogDir, file), 'utf8'));
  for (const asset of document.assets || []) {
    if (!asset.id) throw new Error(file + ': asset without id');
    if (ids.has(asset.id)) throw new Error('Duplicate asset id: ' + asset.id);
    ids.add(asset.id);
  }
}
if (!ids.has('sponge.vanilla')) throw new Error('Missing example asset sponge.vanilla');
console.log('Asset catalogs valid (' + ids.size + ' stable IDs).');
