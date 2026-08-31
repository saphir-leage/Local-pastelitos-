(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PastelitosAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FLAVOR_ASSET_IDS = Object.freeze({
    Vanille: 'sponge.vanilla',
    Schokolade: 'sponge.chocolate',
    Zitrone: 'sponge.lemon',
    'Red Velvet': 'sponge.red-velvet',
    Marmor: 'sponge.marble',
    Nuss: 'sponge.hazelnut'
  });
  const CREAM_ASSET_IDS = Object.freeze({
    Buttercreme: 'cream.buttercream',
    Erdbeere: 'cream.strawberry',
    Schokolade: 'cream.chocolate',
    Zitrone: 'cream.lemon',
    Pistazie: 'cream.pistachio'
  });

  class ResourceCache {
    constructor(loader, debug) {
      if (typeof loader !== 'function') throw new TypeError('ResourceCache requires a loader');
      this.loader = loader;
      this.entries = new Map();
      this.debug = debug || function () {};
    }
    get(key) {
      if (this.entries.has(key)) {
        this.debug('Cache hit ' + key);
        return this.entries.get(key);
      }
      const pending = Promise.resolve().then(() => this.loader(key));
      this.entries.set(key, pending);
      pending.catch(() => this.entries.delete(key));
      return pending;
    }
    clear() { this.entries.clear(); }
  }

  class AssetCatalog {
    constructor(entries) {
      this.assets = new Map();
      (entries || []).forEach(entry => this.register(entry));
    }
    register(entry) {
      if (!entry || typeof entry.id !== 'string') throw new TypeError('Catalog assets need a stable id');
      if (this.assets.has(entry.id)) throw new Error('Duplicate asset id: ' + entry.id);
      this.assets.set(entry.id, Object.freeze(Object.assign({}, entry)));
    }
    get(id) { return this.assets.get(id); }
    require(id) {
      const asset = this.get(id);
      if (!asset) throw new Error('Unknown asset: ' + id);
      return asset;
    }
    static async load(urls, fetchImpl) {
      const fetcher = fetchImpl || globalThis.fetch;
      const documents = await Promise.all(urls.map(async url => {
        const response = await fetcher(url);
        if (!response.ok) throw new Error('Catalog load failed: ' + url + ' (' + response.status + ')');
        return response.json();
      }));
      return new AssetCatalog(documents.flatMap(document => document.assets || []));
    }
  }

  function mapFlavorToAssetId(label) { return FLAVOR_ASSET_IDS[label] || null; }
  function mapCreamToAssetId(label) { return CREAM_ASSET_IDS[label] || null; }

  function buildCakeStructure(configuration) {
    const spongeLayers = configuration.layers || [];
    const fillings = configuration.fillings || [];
    const layers = [];
    spongeLayers.forEach((label, index) => {
      layers.push({ type: 'sponge', label, assetId: mapFlavorToAssetId(label), thicknessCm: 3 });
      if (index < spongeLayers.length - 1 && fillings[index]) {
        layers.push({ type: 'cream', label: fillings[index], assetId: mapCreamToAssetId(fillings[index]), thicknessCm: 1 });
      }
    });
    return Object.freeze({
      shape: configuration.shape || 'round',
      layers: Object.freeze(layers),
      finish: configuration.finish || null,
      decorations: Object.freeze((configuration.decorations || []).slice())
    });
  }

  function createDebug(enabled, logger) {
    return enabled ? message => (logger || console).debug('[PastelitosAssets] ' + message) : function () {};
  }

  class CakeAssetManager {
    constructor(options) {
      options = options || {};
      this.catalog = options.catalog;
      this.debug = createDebug(Boolean(options.debug), options.logger);
      this.fallbacks = options.fallbacks || {};
      this.textureCache = new ResourceCache(options.loadTexture || (url => Promise.reject(new Error('No texture loader for ' + url))), this.debug);
      this.geometryCache = new ResourceCache(options.loadGeometry || (url => Promise.reject(new Error('No geometry loader for ' + url))), this.debug);
      this.createMaterial = options.createMaterial || (definition => ({ kind: 'material-definition', definition }));
    }
    async loadCakeMaterial(assetId) {
      const asset = this.catalog && this.catalog.get(assetId);
      try {
        if (!asset) throw new Error('Unknown asset: ' + assetId);
        const maps = {};
        const material = asset.material || {};
        const keys = ['baseColorTexture', 'normalTexture', 'roughnessTexture', 'heightTexture'];
        await Promise.all(keys.map(async key => {
          if (material[key]) maps[key] = await this.textureCache.get(material[key]);
        }));
        const result = this.createMaterial({ asset, maps });
        this.debug('Loaded ' + assetId);
        return result;
      } catch (error) {
        const fallback = this.fallbacks[assetId];
        if (!fallback) throw error;
        this.debug('Falling back to procedural ' + assetId);
        return fallback(asset || { id: assetId }, error);
      }
    }
    async loadCakeAsset(assetId) { return this.loadCakeMaterial(assetId); }
    async loadGeometry(assetId) {
      const asset = this.catalog.require(assetId);
      const loaded = await this.geometryCache.get(asset.url);
      return loaded && typeof loaded.clone === 'function' ? loaded.clone(true) : loaded;
    }
  }

  function createThreeMaterialFactory(THREE, renderer) {
    return function ({ asset, maps }) {
      const material = asset.material || {};
      const rendering = asset.rendering || {};
      const colorMap = maps.baseColorTexture;
      if (colorMap && THREE.SRGBColorSpace) colorMap.colorSpace = THREE.SRGBColorSpace;
      Object.values(maps).forEach(texture => {
        if (texture && renderer && renderer.capabilities && texture.anisotropy !== undefined) {
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
      });
      return new THREE.MeshPhysicalMaterial({
        color: material.baseColor || '#ffffff', map: colorMap || null,
        normalMap: maps.normalTexture || null, roughnessMap: maps.roughnessTexture || null,
        bumpMap: maps.heightTexture || null, roughness: rendering.roughness == null ? 0.8 : rendering.roughness,
        metalness: rendering.metalness || 0, bumpScale: rendering.bumpScale || 0,
        clearcoat: rendering.clearcoat || 0, sheen: rendering.sheen || 0
      });
    };
  }

  return { AssetCatalog, CakeAssetManager, ResourceCache, buildCakeStructure,
    mapFlavorToAssetId, mapCreamToAssetId, createThreeMaterialFactory,
    FLAVOR_ASSET_IDS, CREAM_ASSET_IDS };
});
