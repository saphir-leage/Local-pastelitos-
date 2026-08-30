(() => {
  'use strict';

  const brandLink = document.createElement('link');
  brandLink.rel = 'stylesheet';
  brandLink.href = 'pastelitos-brand.css';
  document.head.appendChild(brandLink);

  const modeStyle = document.createElement('style');
  modeStyle.textContent = `
    .cake-view-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0 8px;padding:5px;background:rgba(255,253,249,.88);border:1px solid var(--pt-line);border-radius:999px;box-shadow:0 8px 24px rgba(66,43,32,.06)}
    .cake-view-modes button{border:0;background:transparent;color:var(--pt-muted);border-radius:999px;padding:10px 12px;font:800 .67rem/1 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:.18s}
    .cake-view-modes button:hover{color:var(--pt-accent)}
    .cake-view-modes button.is-active{background:var(--pt-ink);color:#fff;box-shadow:0 6px 16px rgba(42,33,29,.14)}
    @media(max-width:720px){.cake-view-modes{border-radius:16px}.cake-view-modes button{padding:10px 7px;font-size:.61rem}}
  `;
  document.head.appendChild(modeStyle);

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
  key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
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
  let viewMode = 'cutaway';

  const sizeScale = { Klein: .9, Mittel: 1, Groß: 1.12 };
  const doughTint = { Vanille:0xffffff, Schokolade:0xffffff, Zitrone:0xf1cf67, 'Red Velvet':0x9d3f48, Marmor:0xbc8f70 };
  const fillingTint = { Buttercreme:0xffffff, Erdbeere:0xef9ca9, Schokolade:0x704330, Zitrone:0xf1dc87, Pistazie:0xb3c793 };
  const glazeColor = { Keine:null, Vanille:0xf0dfc9, Schokolade:0x5b3427, Erdbeere:0xe58a9c, Pistazie:0xa8be86 };
  const CUT_CENTER = Math.PI * .25;
  const CUT_GAP = Math.PI * .34;

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

  function materialFromAsset(id, tint=0xffffff, family='v1'){
    const factory = family==='v2' ? window.PastelitosAssetsV2 : window.PastelitosAssetsV1;
    const temp = factory.create(id);
    let material = null;
    temp.traverse(c=>{ if(!material && c.isMesh && c.material) material = c.material.clone(); });
    if(!material) material = new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.7});
    if(tint !== 0xffffff && material.color) material.color.multiply(new THREE.Color(tint));
    disposeObject(temp);
    return material;
  }

  function doughMaterial(flavor){
    const id = flavor==='Schokolade' ? 'dough.chocolate.v2' : 'dough.vanilla.v2';
    return materialFromAsset(id,doughTint[flavor]||0xffffff,'v2');
  }

  function fillingMaterial(flavor){
    return materialFromAsset('filling.vanilla',fillingTint[flavor]||0xffffff,'v1');
  }

  function finishMaterial(flavor){
    if(flavor==='Schokolade') return materialFromAsset('finish.chocolate.v2',0xffffff,'v2');
    return new THREE.MeshPhysicalMaterial({color:glazeColor[flavor]||glazeColor.Vanille,roughness:.54,clearcoat:.08,clearcoatRoughness:.38,sheen:.14,transparent:true,opacity:flavor==='Vanille'?.94:.98});
  }

  function addSponge(radius,height,y,flavor,target=cakeGroup){
    const base = flavor === 'Schokolade' ? 'dough.chocolate.v2' : 'dough.vanilla.v2';
    const a = cloneTintedAsset(base, doughTint[flavor] || 0xffffff, 'v2');
    a.scale.set(radius/1.65, height/.72, radius/1.65);
    a.position.y = y;
    target.add(a);
  }

  function addFilling(radius,y,flavor,target=cakeGroup){
    const a = cloneTintedAsset('filling.vanilla', fillingTint[flavor] || 0xffffff);
    a.scale.set(radius/1.7, .56, radius/1.7);
    a.position.y = y;
    target.add(a);
  }

  function addFinish(radius,bottom,top,flavor,target=cakeGroup){
    if(flavor==='Keine') return;
    const h = top-bottom;
    if(flavor==='Schokolade' && window.PastelitosAssetsV2){
      const glaze = cloneTintedAsset('finish.chocolate.v2',0xffffff,'v2');
      glaze.scale.set(radius/1.72,h,radius/1.72);
      glaze.position.y = bottom;
      target.add(glaze);
      return;
    }
    const mat = finishMaterial(flavor);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,h,96,8,true),mat);
    shell.position.y = bottom+h/2; shell.castShadow = shell.receiveShadow = true; target.add(shell);
    const topDisk = new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,.11,96),mat.clone());
    topDisk.position.y = top+.035; topDisk.castShadow = true; target.add(topDisk);
  }

  function addStrawberry(x,y,z,scale=.34,rot=0,target=cakeGroup){
    if (strawberryTexture) {
      const mat = new THREE.SpriteMaterial({map:strawberryTexture,transparent:true,alphaTest:.18,depthWrite:true,toneMapped:true});
      const s = new THREE.Sprite(mat);
      s.scale.set(1.22*scale/.34, .82*scale/.34, 1);
      s.position.set(x,y,z);
      s.material.rotation = -.08 + rot*.04;
      target.add(s);
      return;
    }
    const s = cloneTintedAsset('fruit.strawberry',0xffffff);
    s.scale.setScalar(scale); s.position.set(x,y,z); s.rotation.y=rot; target.add(s);
  }

  function addDecorations(radius,topY,list,target=cakeGroup,cutaway=false){
    if(list.includes('Frische Beeren')){
      const positions=cutaway
        ? [[-.18,0,-.48],[-.62,.03,-.1],[.18,.02,-.55],[-.66,.05,.36],[-.1,.04,.52]]
        : [[0,0,.42],[-.48,.03,.16],[.43,.02,.12],[-.2,.05,-.34],[.28,.04,-.28]];
      positions.forEach((p,i)=>addStrawberry(p[0],topY+.25+p[1],p[2],.28+(i%2)*.025,i*.9,target));
    }
    if(list.includes('Streusel')){
      const mat=new THREE.MeshStandardMaterial({color:0xb94b61,roughness:.55});
      for(let i=0;i<32;i++){const a=i*2.39,rr=.22+(i%9)/9*radius*.68;const m=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.07,3,5),mat);m.position.set(Math.cos(a)*rr,topY+.14+(i%4)*.008,Math.sin(a)*rr);m.rotation.set(i*.23,a,i*.37);target.add(m);}
    }
    if(list.includes('Kerzen')){
      for(let i=0;i<3;i++){const mat=new THREE.MeshStandardMaterial({color:[0xd57682,0xe2b86c,0x899e82][i],roughness:.5});const c=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.55,12),mat);c.position.set((i-1)*.38,topY+.4,-.18);target.add(c);}
    }
    if(list.includes('Blumen')){
      const petalMat=new THREE.MeshPhysicalMaterial({color:0xe9bfc3,roughness:.58,sheen:.15});
      for(let j=0;j<2;j++){const cx=(j?-.55:.55),cz=-.18;for(let i=0;i<7;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),petalMat);p.scale.set(1,.35,.6);p.position.set(cx+Math.cos(i/7*Math.PI*2)*.13,topY+.2,cz+Math.sin(i/7*Math.PI*2)*.13);p.rotation.y=i/7*Math.PI*2;target.add(p);}}
    }
  }

  function radialFace(radius,height,y,angle,material,target){
    const face=new THREE.Mesh(new THREE.BoxGeometry(radius*.985,height*.96,.025),material.clone());
    face.position.set(Math.sin(angle)*radius*.492,y,Math.cos(angle)*radius*.492);
    face.rotation.y=angle-Math.PI/2;
    face.castShadow=face.receiveShadow=true;
    target.add(face);
  }

  function sectorLayer(radius,height,y,material,start,length,target){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*.995,height,128,10,false,start,length),material);
    mesh.position.y=y; mesh.castShadow=mesh.receiveShadow=true; target.add(mesh);
    radialFace(radius,height,y,start,material,target);
    radialFace(radius,height,y,start+length,material,target);
  }

  function sectorShell(radius,height,y,material,start,length,target){
    const shell=new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,height,128,8,true,start,length),material);
    shell.position.y=y; shell.castShadow=shell.receiveShadow=true; target.add(shell);
  }

  function buildWhole(config){
    const scale=sizeScale[config.size]||1;
    const radius=1.72*scale,spongeH=.62,fillH=.18,base=.22;
    let y=base;
    config.layers.forEach((flavor,i)=>{
      addSponge(radius,spongeH,y+spongeH/2,flavor);
      y+=spongeH;
      if(i<config.fillings.length){addFilling(radius,y+fillH/2,config.fillings[i]);y+=fillH;}
    });
    addFinish(radius,base-.02,y+.02,config.glaze);
    addDecorations(radius,y+.08,config.decorations||[]);
    return {top:y,radius};
  }

  function buildCutaway(config){
    const scale=sizeScale[config.size]||1;
    const radius=1.72*scale,spongeH=.62,fillH=.18,base=.22;
    const start=CUT_CENTER+CUT_GAP/2,length=Math.PI*2-CUT_GAP;
    let y=base;
    config.layers.forEach((flavor,i)=>{
      const mat=doughMaterial(flavor);
      sectorLayer(radius,spongeH,y+spongeH/2,mat,start,length,cakeGroup);
      y+=spongeH;
      if(i<config.fillings.length){
        const fm=fillingMaterial(config.fillings[i]);
        sectorLayer(radius*1.006,fillH,y+fillH/2,fm,start,length,cakeGroup);
        y+=fillH;
      }
    });

    if(config.glaze!=='Keine'){
      const gm=finishMaterial(config.glaze),h=y-base+.04;
      sectorShell(radius,h,base-.02+h/2,gm,start,length,cakeGroup);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,.1,128,3,false,start,length),gm.clone());
      top.position.y=y+.055; top.castShadow=true; cakeGroup.add(top);
    }
    addDecorations(radius,y+.08,config.decorations||[],cakeGroup,true);

    const slicePlate=new THREE.Mesh(new THREE.CylinderGeometry(1.38,1.44,.07,72),new THREE.MeshPhysicalMaterial({color:0xf7f1e8,roughness:.3,clearcoat:.35,clearcoatRoughness:.25}));
    slicePlate.scale.z=.76; slicePlate.position.set(2.95,.02,1.25); slicePlate.castShadow=slicePlate.receiveShadow=true; cakeGroup.add(slicePlate);

    const slice=new THREE.Group();
    const sliceGap=CUT_GAP*.76;
    const sliceStart=CUT_CENTER-sliceGap/2;
    let sy=.10;
    config.layers.forEach((flavor,i)=>{
      sectorLayer(radius*.83,spongeH,sy+spongeH/2,doughMaterial(flavor),sliceStart,sliceGap,slice);
      sy+=spongeH;
      if(i<config.fillings.length){
        sectorLayer(radius*.835,fillH,sy+fillH/2,fillingMaterial(config.fillings[i]),sliceStart,sliceGap,slice);
        sy+=fillH;
      }
    });
    if(config.glaze!=='Keine'){
      const sm=finishMaterial(config.glaze);
      sectorShell(radius*.83,sy+.02,(sy+.02)/2,sm,sliceStart,sliceGap,slice);
      const stop=new THREE.Mesh(new THREE.CylinderGeometry(radius*.85,radius*.84,.085,80,2,false,sliceStart,sliceGap),sm.clone());
      stop.position.y=sy+.06; slice.add(stop);
    }
    if((config.decorations||[]).includes('Frische Beeren')) addStrawberry(Math.sin(CUT_CENTER)*radius*.44,sy+.32,Math.cos(CUT_CENTER)*radius*.44,.24,.2,slice);
    slice.scale.set(.72,.72,.72);
    slice.position.set(1.95,.06,.43);
    slice.rotation.y=-.12;
    cakeGroup.add(slice);

    return {top:y,radius};
  }

  function buildExploded(config){
    const scale=sizeScale[config.size]||1;
    const radius=1.62*scale,spongeH=.5,fillH=.15,base=.22,gap=.34;
    let y=base;
    config.layers.forEach((flavor,i)=>{
      addSponge(radius,spongeH,y+spongeH/2,flavor);
      y+=spongeH+gap;
      if(i<config.fillings.length){
        addFilling(radius,y+fillH/2,config.fillings[i]);
        y+=fillH+gap;
      }
    });
    if(config.glaze!=='Keine'){
      const mat=finishMaterial(config.glaze);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(radius*1.02,radius*1.02,.16,100),mat);
      cap.position.y=y+.08; cap.castShadow=true; cakeGroup.add(cap); y+=.2+gap*.55;
    }
    addDecorations(radius,y,config.decorations||[]);
    return {top:y,radius};
  }

  function applyViewFraming(top){
    root.position.set(0,0,0); root.scale.setScalar(1);
    if(viewMode==='cutaway'){
      root.position.x=-.28; root.scale.setScalar(.83);
      camera.position.set(7.3,4.6,9.4);
    }else if(viewMode==='exploded'){
      root.scale.setScalar(.84);
      camera.position.set(6.6,5.0,9.2);
    }else{
      camera.position.set(6.2,4.2,8.4);
    }
    camera.lookAt(0,Math.max(1.05,top*.52),0);
  }

  function updateModeUI(){
    document.querySelectorAll('[data-cake-view]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.cakeView===viewMode));
    const status=document.getElementById('viewerStatus');
    if(status) status.textContent=viewMode==='cutaway'?'Anschnitt · Innenansicht':viewMode==='exploded'?'Explosionsansicht':'Ganze Torte';
  }

  function setViewMode(mode){
    if(!['whole','cutaway','exploded'].includes(mode)) return;
    viewMode=mode; updateModeUI(); resetView(); if(pendingConfig) build(pendingConfig);
  }

  function mountViewModes(){
    const controls=document.querySelector('.view-controls');
    if(!controls || document.querySelector('.cake-view-modes')) return;
    const modes=document.createElement('div');
    modes.className='cake-view-modes';
    modes.setAttribute('aria-label','Darstellung der Torte');
    modes.innerHTML='<button type="button" data-cake-view="whole">Ganz</button><button type="button" data-cake-view="cutaway" class="is-active">Mit Anschnitt</button><button type="button" data-cake-view="exploded">Explodiert</button>';
    controls.insertAdjacentElement('beforebegin',modes);
    modes.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>setViewMode(btn.dataset.cakeView)));
    updateModeUI();
  }

  function build(config){
    pendingConfig=config;
    if(!assetsReady) return;
    clearCake();
    let result;
    if(viewMode==='cutaway') result=buildCutaway(config);
    else if(viewMode==='exploded') result=buildExploded(config);
    else result=buildWhole(config);
    applyViewFraming(result.top);
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
  canvas.addEventListener('pointerup',()=>dragging=false); canvas.addEventListener('pointercancel',()=>dragging=false);

  function resetView(){root.rotation.set(-.05,-.38,0)}
  const left=document.getElementById('rotateLeft'),right=document.getElementById('rotateRight'),reset=document.getElementById('resetView');
  if(left)left.onclick=()=>root.rotation.y-=.35;
  if(right)right.onclick=()=>root.rotation.y+=.35;
  if(reset)reset.onclick=resetView;

  window.Cake3D={update:build,resetView,setViewMode,getViewMode:()=>viewMode};
  mountViewModes();
  loadAssets().then(ok=>{
    assetsReady=ok && !!window.PastelitosAssetsV1 && !!window.PastelitosAssetsV2;
    if(!assetsReady){console.error('Pastelitos assets could not be loaded.');return;}
    updateModeUI();
    if(pendingConfig) build(pendingConfig);
  });

  function animate(){requestAnimationFrame(animate);resize();renderer.render(scene,camera)}
  animate();
})();
