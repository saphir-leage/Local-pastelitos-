import assert from 'node:assert/strict';
import { buildCakeImagePrompt } from '../cake-image-prompt.mjs';

const prompt = buildCakeImagePrompt({
  shape: 'rund',
  size: 'Klein',
  layers: ['Vanille', 'Schokolade', 'Red Velvet', 'Marmor'],
  fillings: ['Erdbeere', 'Schokolade', 'Pistazie'],
  finish: 'Erdbeere',
  decorations: ['Frische Beeren'],
});

assert.match(prompt, /Exactly 4 sponge layers\./);
assert.match(prompt, /Exactly 3 cream layers\./);
assert.match(prompt, /Exactly 7 visible horizontal internal sections\./);

const expected = [
  'SECTION 1 — SPONGE\nSPONGE — Vanille sponge cake',
  'SECTION 2 — CREAM\nCREAM — Erdbeere cream filling',
  'SECTION 3 — SPONGE\nSPONGE — Schokolade sponge cake',
  'SECTION 4 — CREAM\nCREAM — Schokolade cream filling',
  'SECTION 5 — SPONGE\nSPONGE — Red Velvet sponge cake',
  'SECTION 6 — CREAM\nCREAM — Pistazie cream filling',
  'SECTION 7 — SPONGE\nSPONGE — Marmor sponge cake',
];

let previous = -1;
for (const item of expected) {
  const current = prompt.indexOf(item);
  assert.ok(current > previous, `Missing or out-of-order section: ${item}`);
  previous = current;
}

assert.match(prompt, /SPONGE : CREAM visual thickness ratio = 3 : 1\./);
assert.match(prompt, /Erdbeere finish\./);
assert.match(prompt, /Use ONLY these configured decorations: Frische Beeren\./);
assert.doesNotMatch(prompt, /Zutaten|Zubereitung/);

console.log('cake-image-prompt tests passed');
