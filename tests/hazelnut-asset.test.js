'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

test('active configurator catalog exposes the hazelnut sponge', () => {
  const source = fs.readFileSync(path.join(root, 'cake-components.js'), 'utf8');
  const context = { window: { addEventListener() {} }, document: {} };
  vm.runInNewContext(source, context);

  const hazelnut = context.window.CakeCatalog.doughs.Nuss;
  assert.equal(hazelnut.assetId, 'sponge.hazelnut');
  assert.equal(hazelnut.price, 0);
  assert.deepEqual(Array.from(hazelnut.ingredients), []);
});

test('active renderer references the registered hazelnut texture', () => {
  const renderer = fs.readFileSync(path.join(root, 'cake-3d.js'), 'utf8');
  assert.match(renderer, /assets\/textures\/sponge\/hazelnut-basecolor\.png/);
  assert.match(renderer, /flavor==='Nuss'/);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'textures', 'sponge', 'hazelnut-basecolor.png')));
});
