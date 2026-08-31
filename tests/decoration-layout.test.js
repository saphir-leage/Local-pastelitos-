'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

test('finish UI offers one simple decoration-layout choice', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const value of ['smart', 'wreath', 'portions', 'spiral', 'accent']) {
    assert.match(html, new RegExp(`<option value="${value}"`));
  }
  assert.match(html, /decorationLayout:l\.value/);
  assert.match(html, /decorationLayoutLabel/);
  const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  for (const source of inlineScripts) assert.doesNotThrow(() => new vm.Script(source));
});

test('renderer adapts layouts to each decoration family', () => {
  const source = fs.readFileSync(path.join(root, 'cake-3d.js'), 'utf8');
  assert.doesNotThrow(() => new vm.Script(source));
  for (const asset of ['Frische Beeren', 'Streusel', 'Blumen', 'Kerzen']) {
    assert.ok(source.includes(`asset==='${asset}'`), `missing smart placement for ${asset}`);
  }
  for (const layout of ['wreath', 'portions', 'spiral', 'accent', 'scatter']) {
    assert.ok(source.includes(`layout==='${layout}'`), `missing renderer layout ${layout}`);
  }
});

test('decoration catalog declares supported placement layouts', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'catalog', 'decorations.json'), 'utf8'));
  assert.equal(catalog.assets.length, 4);
  for (const asset of catalog.assets) {
    assert.ok(asset.placement.smartDefault);
    assert.ok(asset.placement.supportedLayouts.length >= 4);
  }
});
