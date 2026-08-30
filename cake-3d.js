(() => {
  'use strict';

  if (!window.THREE) {
    console.error('Three.js is required for the cake renderer.');
    return;
  }

  const THREE = window.THREE;
  const canvas = document.getElementById('cakeCanvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfff9fb);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(5.8, 4.1, 7.4);
  camera.lookAt(0, 1.45, 0);

  const world = new THREE.Group();
  scene.add(world);

  const cakeRoot = new THREE.Group();
  cakeRoot.rotation.y = -0.35;
  world.add(cakeRoot);

  const hemi = new THREE.HemisphereLight(0xfff6f0, 0x7a6670, 2.1);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff1df, 4.3);
  key.position.set(4.5, 7.5, 5.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.bias = -0.00015;
  scene.add(key);

  const fill = new THREE.PointLight(0xffc9d8, 22, 18, 2);
  fill.position.set(-5, 4.8, 3.2);
  scene.add(fill);

  const rim = new THREE.PointLight(0xdde8ff, 15, 16, 2);
  rim.position.set(3.4, 3.4, -5.6);
  scene.add(rim);

  const groundMat = new THREE.MeshStandardMaterial({ color: 0xf3e7e9, roughness: 0.92, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(7, 96), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.11;
  ground.receiveShadow = true;
  scene.add(ground);

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55, 2.7, 0.12, 96),
    new THREE.MeshPhysicalMaterial({ color: 0xfbfafa, roughness: 0.2, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.18 })
  );
  plate.position.y = 0;
  plate.receiveShadow = true;
  plate.castShadow = true;
  cakeRoot.add(plate);

  const plateRim = new THREE.Mesh(
    new THREE.TorusGeometry(2.35, 0.055, 12, 96),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, clearcoat: 1 })
  );
  plateRim.rotation.x = Math.PI / 2;
  plateRim.position.y = 0.07;
  cakeRoot.add(plateRim);

  let currentConfig = null;
  let cakeGroup = new THREE.Group();
  cakeRoot.add(cakeGroup);

  function random(seed) {
    let t = seed + 0x6D2B79F5;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeTexture(base, speckles, seed = 1) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    const rnd = random(seed);
    for (let i = 0; i < 1800; i++) {
      const a = 0.025 + rnd() * 0.08;
      const shade = speckles[Math.floor(rnd() * speckles.length)];
      ctx.fillStyle = shade.replace('ALPHA', a.toFixed(3));
      const s = 0.6 + rnd() * 2.3;
      ctx.fillRect(rnd() * 256, rnd() * 256, s, s);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.5, 1.4);
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return tex;
  }

  function makeBump(seed = 11) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    const image = ctx.createImageData(256, 256);
    const rnd = random(seed);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = 118 + Math.floor(rnd() * 35);
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }

  const textures = {
    vanilla: makeTexture('#d8a866', ['rgba(88,52,20,ALPHA)', 'rgba(255,235,185,ALPHA)'], 1),
    chocolate: makeTexture('#5f321f', ['rgba(35,14,7,ALPHA)', 'rgba(210,154,98,ALPHA)'], 2),
    lemon: makeTexture('#d7b64f', ['rgba(126,91,15,ALPHA)', 'rgba(255,246,167,ALPHA)'], 3),
    redvelvet: makeTexture('#7e2025', ['rgba(50,8,10,ALPHA)', 'rgba(216,93,89,ALPHA)'], 4),
    marble: makeTexture('#b88760', ['rgba(70,38,20,ALPHA)', 'rgba(247,220,180,ALPHA)'], 5),
    cream: makeTexture('#f5e7d0', ['rgba(175,145,110,ALPHA)', 'rgba(255,255,255,ALPHA)'], 6),
    bump: makeBump()
  };

  const doughMap = {
    'Vanille': { tex: textures.vanilla, color: 0xe0b774 },
    'Schokolade': { tex: textures.chocolate, color: 0x633723 },
    'Zitrone': { tex: textures.lemon, color: 0xd9bb56 },
    'Red Velvet': { tex: textures.redvelvet, color: 0x86292e },
    'Marmor': { tex: textures.marble, color: 0xac7c59 }
  };

  const fillingColors = {
    'Buttercreme': 0xffeed6,
    'Erdbeere': 0xf28ba5,
    'Schokolade': 0x6a3825,
    'Zitrone': 0xf6dc78,
    'Pistazie': 0x9fbd7a
  };

  const glazeColors = {
    'Vanille': 0xfff2d7,
    'Schokolade': 0x5c3022,
    'Erdbeere': 0xf49ab1,
    'Pistazie': 0xa8c887,
    'Keine': null
  };

  function disposeObject(object) {
    object.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => {
          if (mat.map && !Object.values(textures).includes(mat.map)) mat.map.dispose();
          mat.dispose();
        });
      }
    });
  }

  function shadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function addCrumbPores(group, radius, y, height, color, seed) {
    const rnd = random(seed);
    const poreMat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    const poreGeo = new THREE.SphereGeometry(0.012, 6, 5);
    const count = 95;
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const yy = y - height / 2 + 0.08 + rnd() * (height - 0.16);
      const r = radius + 0.004;
      const pore = new THREE.Mesh(poreGeo, poreMat);
      pore.position.set(Math.cos(a) * r, yy, Math.sin(a) * r);
      const scale = 0.45 + rnd() * 1.25;
      pore.scale.set(scale * 1.25, scale, scale * 0.55);
      group.add(pore);
    }
  }

  function makeCakeLayer(radius, height, y, flavor, seed) {
    const spec = doughMap[flavor] || doughMap.Vanille;
    const mat = new THREE.MeshStandardMaterial({
      color: spec.color,
      map: spec.tex,
      bumpMap: textures.bump,
      bumpScale: 0.018,
      roughness: 0.78,
      metalness: 0
    });
    const mesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.992, height, 96, 4), mat));
    mesh.position.y = y;
    cakeGroup.add(mesh);
    addCrumbPores(cakeGroup, radius, y, height, 0x7b583a, seed);

    const topCrumb = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.97, radius * 0.97, 0.018, 96),
      new THREE.MeshStandardMaterial({ color: spec.color, map: spec.tex, roughness: 0.84, bumpMap: textures.bump, bumpScale: 0.014 })
    );
    topCrumb.position.y = y + height / 2 + 0.009;
    cakeGroup.add(topCrumb);
  }

  function addFilling(radius, y, flavor) {
    const color = fillingColors[flavor] || fillingColors.Buttercreme;
    const cream = shadow(new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.018, radius * 1.018, 0.19, 96),
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: flavor === 'Schokolade' ? 0.46 : 0.62,
        sheen: 0.35,
        sheenRoughness: 0.7,
        clearcoat: flavor === 'Schokolade' ? 0.18 : 0.06,
        bumpMap: textures.bump,
        bumpScale: 0.007
      })
    ));
    cream.position.y = y;
    cakeGroup.add(cream);

    const rnd = random(Math.floor(y * 1000) + flavor.length);
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2;
      const dollop = new THREE.Mesh(
        new THREE.SphereGeometry(0.055 + rnd() * 0.035, 10, 8),
        cream.material
      );
      dollop.scale.y = 0.55;
      dollop.position.set(Math.cos(a) * radius * 1.01, y + (rnd() - 0.5) * 0.08, Math.sin(a) * radius * 1.01);
      cakeGroup.add(dollop);
    }
  }

  function addGlaze(radius, topY, flavor) {
    const color = glazeColors[flavor];
    if (!color) return;
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: flavor === 'Schokolade' ? 0.22 : 0.3,
      metalness: 0,
      clearcoat: 0.78,
      clearcoatRoughness: 0.18,
      sheen: 0.28,
      sheenRoughness: 0.45
    });
    const top = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.025, radius * 1.025, 0.105, 96), mat));
    top.position.y = topY + 0.045;
    cakeGroup.add(top);

    const rnd = random(flavor.length * 31 + Math.round(radius * 100));
    const count = 18;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rnd() * 0.16;
      const len = 0.1 + rnd() * 0.36;
      const drip = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.035 + rnd() * 0.025, len, 6, 10), mat));
      drip.position.set(Math.cos(a) * radius * 1.024, topY - len / 2 + 0.025, Math.sin(a) * radius * 1.024);
      cakeGroup.add(drip);
    }
  }

  function addBerry(x, y, z, scale, color = 0xb51f41) {
    const berryMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.34, clearcoat: 0.48, clearcoatRoughness: 0.2 });
    const berry = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.105 * scale, 22, 16), berryMat));
    berry.scale.y = 0.9;
    berry.position.set(x, y, z);
    cakeGroup.add(berry);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.055 * scale, 0.065 * scale, 6), new THREE.MeshStandardMaterial({ color: 0x3f6b37, roughness: 0.8 }));
    cap.position.set(x, y + 0.105 * scale, z);
    cap.rotation.x = Math.PI;
    cakeGroup.add(cap);
  }

  function addFlower(x, y, z, scale, color) {
    const petalMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, sheen: 0.6, sheenRoughness: 0.45, side: THREE.DoubleSide });
    for (let p = 0; p < 7; p++) {
      const a = p * Math.PI * 2 / 7;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.095 * scale, 16, 10), petalMat);
      petal.scale.set(1.45, 0.27, 0.72);
      petal.rotation.y = -a;
      petal.rotation.z = 0.24;
      petal.position.set(x + Math.cos(a) * 0.105 * scale, y, z + Math.sin(a) * 0.105 * scale);
      petal.castShadow = true;
      cakeGroup.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.055 * scale, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0xe4ad39, roughness: 0.55 }));
    center.position.set(x, y + 0.025, z);
    cakeGroup.add(center);
  }

  function addSprinkles(radius, topY) {
    const colors = [0xe95b7a, 0x57aaa5, 0xf0ba3f, 0x9067b5, 0xf3f0e7];
    const geo = new THREE.CapsuleGeometry(0.018, 0.07, 3, 6);
    const rnd = random(888);
    for (let i = 0; i < 58; i++) {
      const a = rnd() * Math.PI * 2;
      const r = radius * Math.sqrt(rnd()) * 0.88;
      const s = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.52 }));
      s.position.set(Math.cos(a) * r, topY + 0.12 + rnd() * 0.02, Math.sin(a) * r);
      s.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
      s.castShadow = true;
      cakeGroup.add(s);
    }
  }

  function addCandles(radius, topY) {
    const colors = [0xe86e88, 0x6eb5b2, 0xe9bd52];
    [-0.28, 0, 0.28].forEach((x, i) => {
      const candle = shadow(new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.54, 16),
        new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.55 })
      ));
      candle.position.set(x * radius, topY + 0.34, 0.02);
      cakeGroup.add(candle);
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.052, 14, 10),
        new THREE.MeshBasicMaterial({ color: 0xffa72c })
      );
      flame.scale.y = 1.65;
      flame.position.set(x * radius, topY + 0.68, 0.02);
      cakeGroup.add(flame);
      const glow = new THREE.PointLight(0xff9e35, 0.8, 1.2, 2);
      glow.position.copy(flame.position);
      cakeGroup.add(glow);
    });
  }

  function rebuild(config) {
    currentConfig = config;
    cakeRoot.remove(cakeGroup);
    disposeObject(cakeGroup);
    cakeGroup = new THREE.Group();
    cakeRoot.add(cakeGroup);

    const sizeScale = config.size === 'Groß' ? 1.16 : config.size === 'Mittel' ? 1.05 : 0.93;
    const radius = 1.76 * sizeScale;
    const layerHeight = 0.66;
    const fillingHeight = 0.19;
    let y = 0.16 + layerHeight / 2;

    config.layers.forEach((flavor, index) => {
      makeCakeLayer(radius, layerHeight, y, flavor, 100 + index * 17);
      y += layerHeight / 2;
      if (index < config.layers.length - 1) {
        y += fillingHeight / 2;
        addFilling(radius, y, config.fillings[index] || 'Buttercreme');
        y += fillingHeight / 2 + layerHeight / 2;
      }
    });

    const topY = y;
    addGlaze(radius, topY, config.glaze);
    const decorY = topY + (config.glaze === 'Keine' ? 0.08 : 0.13);

    if (config.decorations.includes('Frische Beeren')) {
      const positions = [
        [-0.62, 0.03], [-0.3, -0.38], [0.06, -0.12], [0.42, -0.4], [0.64, 0.08], [0.2, 0.45], [-0.28, 0.42]
      ];
      positions.forEach((p, i) => addBerry(p[0] * radius, decorY + 0.1, p[1] * radius, i % 3 === 0 ? 1.14 : 0.94, i % 2 ? 0x9d1738 : 0xcf2e4e));
    }
    if (config.decorations.includes('Blumen')) {
      addFlower(-0.48 * radius, decorY + 0.08, 0.05 * radius, 1.1, 0xffe5ec);
      addFlower(0.18 * radius, decorY + 0.09, 0.32 * radius, 0.95, 0xf49ab3);
      addFlower(0.48 * radius, decorY + 0.08, -0.16 * radius, 0.82, 0xfff3f6);
    }
    if (config.decorations.includes('Streusel')) addSprinkles(radius, topY);
    if (config.decorations.includes('Kerzen')) addCandles(radius, topY);

    const targetHeight = topY + 0.45;
    camera.lookAt(0, Math.max(1.35, targetHeight * 0.52), 0);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let tilt = -0.08;

  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    cakeRoot.rotation.y += (event.clientX - lastX) * 0.012;
    tilt += (event.clientY - lastY) * 0.004;
    tilt = Math.max(-0.28, Math.min(0.2, tilt));
    cakeRoot.rotation.x = tilt;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });

  document.getElementById('rotateLeft')?.addEventListener('click', () => { cakeRoot.rotation.y -= 0.35; });
  document.getElementById('rotateRight')?.addEventListener('click', () => { cakeRoot.rotation.y += 0.35; });
  document.getElementById('resetView')?.addEventListener('click', () => {
    cakeRoot.rotation.set(-0.08, -0.35, 0);
    tilt = -0.08;
  });

  function animate() {
    resize();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.Cake3D = {
    update: rebuild,
    resetView() {
      cakeRoot.rotation.set(-0.08, -0.35, 0);
      tilt = -0.08;
    }
  };

  animate();
})();