'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { AssetCatalog, CakeAssetManager, ResourceCache, buildCakeStructure, mapFlavorToAssetId } = require('../src/3d/pastelitos-assets.js');

test('catalog looks assets up by stable id', () => {
  const catalog = new AssetCatalog([{ id: 'sponge.vanilla', type: 'sponge' }]);
  assert.equal(catalog.require('sponge.vanilla').type, 'sponge');
  assert.equal(catalog.get('missing'), undefined);
});

test('maps legacy UI flavor names to asset ids', () => {
  assert.equal(mapFlavorToAssetId('Vanille'), 'sponge.vanilla');
  assert.equal(mapFlavorToAssetId('Schokolade'), 'sponge.chocolate');
  assert.equal(mapFlavorToAssetId('Nuss'), 'sponge.hazelnut');
  assert.equal(mapFlavorToAssetId('Unbekannt'), null);
});

test('all configured sponge assets share the reusable material structure', () => {
  const catalogPath = path.join(__dirname, '..', 'assets', 'catalog', 'materials.json');
  const document = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const sponges = document.assets.filter(asset => asset.type === 'sponge');
  assert.deepEqual(sponges.map(asset => asset.id), [
    'sponge.vanilla', 'sponge.chocolate', 'sponge.lemon',
    'sponge.red-velvet', 'sponge.marble', 'sponge.hazelnut'
  ]);
  for (const asset of sponges) {
    assert.equal(asset.geometryId, 'geometry.layer.round');
    assert.equal(asset.dimensions.defaultThicknessCm, 3);
    assert.deepEqual(Object.keys(asset.material), [
      'baseColor', 'baseColorTexture', 'normalTexture', 'roughnessTexture', 'heightTexture'
    ]);
    assert.deepEqual(asset.recipe.ingredients, []);
    assert.deepEqual(asset.allergens, []);
  }
});

test('cache deduplicates concurrent and subsequent loads', async () => {
  let calls = 0;
  const cache = new ResourceCache(async key => { calls += 1; return { key }; });
  const [first, second] = await Promise.all([cache.get('texture.ktx2'), cache.get('texture.ktx2')]);
  assert.strictEqual(first, second);
  await cache.get('texture.ktx2');
  assert.equal(calls, 1);
});

test('missing or failed asset uses its procedural fallback', async () => {
  const manager = new CakeAssetManager({
    catalog: new AssetCatalog([]),
    fallbacks: { 'sponge.vanilla': () => ({ procedural: true }) }
  });
  assert.deepEqual(await manager.loadCakeAsset('sponge.vanilla'), { procedural: true });
});

test('logical cake keeps sponge and cream order unchanged', () => {
  const structure = buildCakeStructure({ layers: ['Vanille', 'Schokolade'], fillings: ['Buttercreme'] });
  assert.deepEqual(structure.layers.map(layer => layer.assetId), [
    'sponge.vanilla', 'cream.buttercream', 'sponge.chocolate'
  ]);
});
