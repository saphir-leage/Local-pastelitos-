(() => {
  'use strict';

  const brandLink = document.createElement('link');
  brandLink.rel = 'stylesheet';
  brandLink.href = 'pastelitos-brand.css';
  document.head.appendChild(brandLink);

  function loadScript(src, ready) {
    return new Promise(resolve => {
      if (ready()) return resolve(true);
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  async function loadAssets() {
    const v1 = await loadScript('assets/asset-set-v1.js', () => !!window.PastelitosAssetsV1);
    const v2 = await loadScript('assets/asset-set-v2.js', () => !!window.PastelitosAssetsV2);
    return v1 && v2;
  }

  if (!window.THREE) return;
  const THREE = window.THREE;
  const canvas = document.getElementById('cakeCanvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8ded5);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(6.2, 4.2, 8.4);
  camera.lookAt(0, 1.45, 0);

  const root = new THREE.Group();
  root.rotation.set(-.05, -.38, 0);
  scene.add(root);

  const hemi = new THREE.HemisphereLight(0xfffaf2, 0x665a54, 1.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff3e6, 4.6);
  key.position.set(4.8, 7.5, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  scene.add(key);
  const fillLight = new THREE.PointLight(0xffe5dc, 8, 18, 2);
  fillLight.position.set(-4.2, 3.2, 4.3); scene.add(fillLight);
  const rimLight = new THREE.PointLight(0xe5ecff, 7, 16, 2);
  rimLight.position.set(4.2, 4.6, -5.5); scene.add(rimLight);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.MeshStandardMaterial({color:0xe8ded5,roughness:.94}));
  floor.rotation.x = -Math.PI/2; floor.position.y = -.15; floor.receiveShadow = true; scene.add(floor);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.75,2.86,.1,96), new THREE.MeshPhysicalMaterial({color:0xf8f4ee,roughness:.25,clearcoat:.55,clearcoatRoughness:.2}));
  plate.position.y = -.05; plate.castShadow = plate.receiveShadow = true; root.add(plate);

  let cakeGroup = new THREE.Group();
  root.add(cakeGroup);
  let pendingConfig = null;
  let assetsReady = false;
  let strawberryTexture = null;

  const sizeScale = { Klein: .9, Mittel: 1, Groß: 1.12 };
  const doughTint = { Vanille:0xffffff, Schokolade:0xffffff, Zitrone:0xf1cf67, 'Red Velvet':0x9d3f48, Marmor:0xbc8f70 };
  const fillingTint = { Buttercreme:0xffffff, Erdbeere:0xef9ca9, Schokolade:0x704330, Zitrone:0xf1dc87, Pistazie:0xb3c793 };
  const glazeColor = { Keine:null, Vanille:0xf0dfc9, Schokolade:0x5b3427, Erdbeere:0xe58a9c, Pistazie:0xa8be86 };

  new THREE.TextureLoader().load('assets/strawberry-photo-v1.webp', tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    strawberryTexture = tex;
    if (pendingConfig && assetsReady) build(pendingConfig);
  });

  function disposeObject(obj){
    obj.traverse(c=>{
      if(c.geometry) c.geometry.dispose();
      if(c.material){
        const mats=Array.isArray(c.material)?c.material:[c.material];
        mats.forEach(m=>m.dispose && m.dispose());
      }
    });
  }

  function clearCake(){
    root.remove(cakeGroup);
    disposeObject(cakeGroup);
    cakeGroup = new THREE.Group();
    root.add(cakeGroup);
  }

  function cloneTintedAsset(id, tint, family='v1'){
    const factory = family==='v2' ? window.PastelitosAssetsV2 : window.PastelitosAssetsV1;
    const obj = factory.create(id);
    obj.traverse(c=>{
      if(c.isMesh && c.material){
        c.material = c.material.clone();
        if(tint && tint !== 0xffffff && c.material.color) c.material.color.multiply(new THREE.Color(tint));
        c.castShadow = c.receiveShadow = true;
      }
    });
    return obj;
  }

  function addSponge(radius,height,y,flavor){
    const base = flavor === 'Schokolade' ? 'dough.chocolate.v2' : 'dough.vanilla.v2';
    const a = cloneTintedAsset(base, doughTint[flavor] || 0xffffff, 'v2');
    a.scale.set(radius/1.65, height/.72, radius/1.65);
    a.position.y = y;
    cakeGroup.add(a);
  }

  function addFilling(radius,y,flavor){
    const a = cloneTintedAsset('filling.vanilla', fillingTint[flavor] || 0xffffff);
    a.scale.set(radius/1.7, .56, radius/1.7);
    a.position.y = y;
    cakeGroup.add(a);
  }

  function addFinish(radius,bottom,top,flavor){
    if(flavor==='Keine') return;
    const h = top-bottom;
    if(flavor==='Schokolade' && window.PastelitosAssetsV2){
      const glaze = cloneTintedAsset('finish.chocolate.v2',0xffffff,'v2');
      glaze.scale.set(radius/1.72,h,radius/1.72);
      glaze.position.y = bottom;
      cakeGroup.add(glaze);
      return;
    }
    const color = glazeColor[flavor] || glazeColor.Vanille;
    const mat = new THREE.MeshPhysicalMaterial({color,roughness:.57,clearcoat:.04,clearcoatRoughness:.38,sheen:.16,transparent:true,opacity:flavor==='Vanille'?.9:.96});
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,h,96,8,true),mat);
    shell.position.y = bottom+h/2; shell.castShadow = shell.receiveShadow = true; cakeGroup.add(shell);
    const topDisk = new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,.11,96),mat.clone());
    topDisk.position.y = top+.035; topDisk.castShadow = true; cakeGroup.add(topDisk);
  }

  function addStrawberry(x,y,z,scale=.34,rot=0){
    if (strawberryTexture) {
      const mat = new THREE.SpriteMaterial({map:strawberryTexture,transparent:true,alphaTest:.18,depthWrite:true,toneMapped:true});
      const s = new THREE.Sprite(mat);
      s.scale.set(1.22*scale/.34, .82*scale/.34, 1);
      s.position.set(x,y,z);
      s.material.rotation = -.08 + rot*.04;
      cakeGroup.add(s);
      return;
    }
    const s = cloneTintedAsset('fruit.strawberry',0xffffff);
    s.scale.setScalar(scale); s.position.set(x,y,z); s.rotation.y=rot; cakeGroup.add(s);
  }

  function addDecorations(radius,topY,list){
    if(list.includes('Frische Beeren')){
      const positions=[[0,0,.42],[-.48,.03,.16],[.43,.02,.12],[-.2,.05,-.34],[.28,.04,-.28]];
      positions.forEach((p,i)=>addStrawberry(p[0],topY+.25+p[1],p[2],.28+(i%2)*.025,i*.9));
    }
    if(list.includes('Streusel')){
      const mat=new THREE.MeshStandardMaterial({color:0xb94b61,roughness:.55});
      for(let i=0;i<36;i++){const a=i*2.39,rr=.22+(i%9)/9*radius*.68;const m=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.07,3,5),mat);m.position.set(Math.cos(a)*rr,topY+.14+(i%4)*.008,Math.sin(a)*rr);m.rotation.set(i*.23,a,i*.37);cakeGroup.add(m);}
    }
    if(list.includes('Kerzen')){
      for(let i=0;i<3;i++){const mat=new THREE.MeshStandardMaterial({color:[0xd57682,0xe2b86c,0x899e82][i],roughness:.5});const c=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.55,12),mat);c.position.set((i-1)*.38,topY+.4,-.18);cakeGroup.add(c);}
    }
    if(list.includes('Blumen')){
      const petalMat=new THREE.MeshPhysicalMaterial({color:0xe9bfc3,roughness:.58,sheen:.15});
      for(let j=0;j<2;j++){const cx=(j?-.55:.55),cz=.15;for(let i=0;i<7;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),petalMat);p.scale.set(1,.35,.6);p.position.set(cx+Math.cos(i/7*Math.PI*2)*.13,topY+.2,cz+Math.sin(i/7*Math.PI*2)*.13);p.rotation.y=i/7*Math.PI*2;cakeGroup.add(p);}}
    }
  }

  function build(config){
    pendingConfig=config;
    if(!assetsReady){return;}
    clearCake();
    const scale=sizeScale[config.size]||1;
    const radius=1.72*scale, spongeH=.62, fillH=.18, base=.22;
    let y=base;
    config.layers.forEach((flavor,i)=>{
      const cy=y+spongeH/2;
      addSponge(radius,spongeH,cy,flavor);
      y+=spongeH;
      if(i<config.fillings.length){addFilling(radius,y+fillH/2,config.fillings[i]);y+=fillH;}
    });
    addFinish(radius,base-.02,y+.02,config.glaze);
    addDecorations(radius,y+.08,config.decorations||[]);
    const targetY=Math.max(1.05,y*.52);
    camera.lookAt(0,targetY,0);
  }

  function resize(){
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
    if(canvas.width!==w*renderer.getPixelRatio()||canvas.height!==h*renderer.getPixelRatio()) renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  }

  let dragging=false,lastX=0,lastY=0;
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;root.rotation.y+=dx*.008;root.rotation.x=Math.max(-.25,Math.min(.14,root.rotation.x+dy*.003));lastX=e.clientX;lastY=e.clientY});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);

  function resetView(){root.rotation.set(-.05,-.38,0)}
  const left=document.getElementById('rotateLeft'),right=document.getElementById('rotateRight'),reset=document.getElementById('resetView');
  if(left)left.onclick=()=>root.rotation.y-=.35;if(right)right.onclick=()=>root.rotation.y+=.35;if(reset)reset.onclick=resetView;

  window.Cake3D={update:build,resetView};
  loadAssets().then(ok=>{
    assetsReady=ok && !!window.PastelitosAssetsV1 && !!window.PastelitosAssetsV2;
    if(!assetsReady){console.error('Pastelitos assets could not be loaded.');return;}
    const badge=document.querySelector('.viewer-badge');
    if(badge) badge.textContent='ASSET-SET · V2';
    if(pendingConfig) build(pendingConfig);
  });

  function animate(){requestAnimationFrame(animate);resize();renderer.render(scene,camera)}
  animate();
})();
