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

test('V2 material library covers every selectable sponge, filling and finish', () => {
  const source = fs.readFileSync(path.join(root, 'assets', 'asset-set-v2.js'), 'utf8');
  assert.doesNotThrow(() => new vm.Script(source));
  const expectedIds = [
    'sponge.vanilla', 'sponge.chocolate', 'sponge.lemon', 'sponge.red-velvet', 'sponge.marble',
    'cream.buttercream', 'cream.strawberry', 'cream.chocolate', 'cream.lemon', 'cream.pistachio',
    'finish.vanilla', 'finish.chocolate', 'finish.strawberry', 'finish.pistachio'
  ];
  for (const id of expectedIds) assert.ok(source.includes(`'${id}'`), `missing ${id}`);
});

test('central catalog contains complete cream and finish structures', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'catalog', 'materials.json'), 'utf8'));
  const materials = new Map(catalog.assets.map(asset => [asset.id, asset]));
  const ids = [
    'cream.buttercream', 'cream.strawberry', 'cream.chocolate', 'cream.lemon', 'cream.pistachio',
    'finish.vanilla', 'finish.chocolate', 'finish.strawberry', 'finish.pistachio'
  ];
  for (const id of ids) {
    const asset = materials.get(id);
    assert.ok(asset, `missing ${id}`);
    assert.equal(asset.rendering.proceduralAssetId, id);
    assert.equal(asset.material.normalTexture, null);
    assert.deepEqual(asset.recipe.ingredients, []);
    assert.deepEqual(asset.allergens, []);
  }
});
