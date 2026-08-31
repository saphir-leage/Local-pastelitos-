(() => {
  'use strict';

  const brandLink = document.createElement('link');
  brandLink.rel = 'stylesheet';
  brandLink.href = 'pastelitos-brand.css';
  document.head.appendChild(brandLink);

  const modeStyle = document.createElement('style');
  modeStyle.textContent = `
    .cake-view-modes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0 8px;padding:5px;background:rgba(255,253,249,.88);border:1px solid var(--pt-line);border-radius:999px;box-shadow:0 8px 24px rgba(66,43,32,.06)}
    .cake-view-modes button{border:0;background:transparent;color:var(--pt-muted);border-radius:999px;padding:10px 12px;font:800 .67rem/1 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:.18s}
    .cake-view-modes button:hover{color:var(--pt-accent)}
    .cake-view-modes button.is-active{background:var(--pt-ink);color:#fff;box-shadow:0 6px 16px rgba(42,33,29,.14)}
    .cake-fullscreen-close{display:none;position:absolute;top:18px;right:18px;z-index:230;border:1px solid rgba(42,33,29,.15);background:rgba(255,253,249,.9);color:#2a211d;width:44px;height:44px;border-radius:50%;font-size:1.55rem;line-height:1;box-shadow:0 10px 30px rgba(42,33,29,.12);backdrop-filter:blur(12px)}
    .visual-stage.is-cake-fullscreen{position:fixed!important;inset:0!important;z-index:220!important;width:100vw!important;height:100dvh!important;background:#e8ded5!important;padding:0!important;margin:0!important}
    .visual-stage.is-cake-fullscreen .cake-viewer{width:100vw!important;height:100dvh!important;min-height:100dvh!important;border:0!important;border-radius:0!important;box-shadow:none!important}
    .visual-stage.is-cake-fullscreen #cakeCanvas{width:100vw!important;height:100dvh!important;min-height:100dvh!important;cursor:grab}
    .visual-stage.is-cake-fullscreen .viewer-topline,.visual-stage.is-cake-fullscreen .viewer-hint,.visual-stage.is-cake-fullscreen .cake-view-modes,.visual-stage.is-cake-fullscreen .view-controls{display:none!important}
    .visual-stage.is-cake-fullscreen .cake-fullscreen-close{display:grid;place-items:center}
    body.cake-fullscreen-open{overflow:hidden!important}
    @media(max-width:720px){.cake-view-modes{border-radius:16px}.cake-view-modes button{padding:10px 7px;font-size:.61rem}.cake-fullscreen-close{top:12px;right:12px;width:42px;height:42px}}
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
  let hazelnutTexture = null;
  let viewMode = 'cutaway';

  const sizeScale = { Klein: .9, Mittel: 1, Groß: 1.12 };
  const doughTint = { Vanille:0xffffff, Schokolade:0xffffff, Zitrone:0xf1cf67, 'Red Velvet':0x9d3f48, Marmor:0xbc8f70, Nuss:0xffffff };
  const fillingTint = { Buttercreme:0xffffff, Erdbeere:0xef9ca9, Schokolade:0x704330, Zitrone:0xf1dc87, Pistazie:0xb3c793 };
  const glazeColor = { Keine:null, Vanille:0xf0dfc9, Schokolade:0x5b3427, Erdbeere:0xe58a9c, Pistazie:0xa8be86 };
  const CUT_CENTER = Math.PI * .25;
  const CUT_GAP = Math.PI * .34;
  const doughAsset = { Vanille:'sponge.vanilla', Schokolade:'sponge.chocolate', Zitrone:'sponge.lemon', 'Red Velvet':'sponge.red-velvet', Marmor:'sponge.marble', Nuss:'sponge.vanilla' };
  const fillingAsset = { Buttercreme:'cream.buttercream', Erdbeere:'cream.strawberry', Schokolade:'cream.chocolate', Zitrone:'cream.lemon', Pistazie:'cream.pistachio' };
  const finishAsset = { Vanille:'finish.vanilla', Schokolade:'finish.chocolate', Erdbeere:'finish.strawberry', Pistazie:'finish.pistachio' };

  new THREE.TextureLoader().load('assets/strawberry-photo-v1.webp', tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    strawberryTexture = tex;
    if (pendingConfig && assetsReady) build(pendingConfig);
  });

  new THREE.TextureLoader().load('assets/textures/sponge/hazelnut-basecolor.png', tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.4, .72);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    hazelnutTexture = tex;
    if (pendingConfig && assetsReady && pendingConfig.layers.includes('Nuss')) build(pendingConfig);
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
    const id = doughAsset[flavor] || doughAsset.Vanille;
    const material = materialFromAsset(id,doughTint[flavor]||0xffffff,'v2');
    if(flavor==='Nuss' && hazelnutTexture){
      material.map = hazelnutTexture;
      material.color.set(0xffffff);
      material.roughness = .9;
      material.needsUpdate = true;
    }
    return material;
  }

  function fillingMaterial(flavor){
    return materialFromAsset(fillingAsset[flavor]||fillingAsset.Buttercreme,0xffffff,'v2');
  }

  function finishMaterial(flavor){
    return materialFromAsset(finishAsset[flavor]||finishAsset.Vanille,0xffffff,'v2');
  }

  function addSponge(radius,height,y,flavor,target=cakeGroup){
    const base = doughAsset[flavor] || doughAsset.Vanille;
    const a = cloneTintedAsset(base, doughTint[flavor] || 0xffffff, 'v2');
    if(flavor==='Nuss' && hazelnutTexture){
      a.traverse(c=>{
        if(c.isMesh && c.material && c.material.map){
          c.material.map = hazelnutTexture;
          c.material.color.set(0xffffff);
          c.material.roughness = .9;
          c.material.needsUpdate = true;
        }
      });
      a.userData.assetId = 'sponge.hazelnut';
    }
    a.scale.set(radius/1.65, height/.72, radius/1.65);
    a.position.y = y;
    target.add(a);
  }

  function addFilling(radius,y,flavor,target=cakeGroup){
    const a = cloneTintedAsset(fillingAsset[flavor]||fillingAsset.Buttercreme, 0xffffff, 'v2');
    a.scale.set(radius/1.7, .56, radius/1.7);
    a.position.y = y;
    target.add(a);
  }

  function addFinish(radius,bottom,top,flavor,target=cakeGroup){
    if(flavor==='Keine') return;
    const h = top-bottom;
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

  function portionCount(size){ return size==='Klein'?8:size==='Groß'?16:12; }

  function assetLayout(requested,asset,list,size){
    if(requested && requested!=='smart') return requested;
    if(asset==='Streusel') return list.length===1?'scatter':'wreath';
    if(asset==='Frische Beeren') return list.length===1?'portions':'accent';
    if(asset==='Blumen') return 'accent';
    if(asset==='Kerzen') return size==='Groß'?'wreath':'accent';
    if(asset==='Spritzdekor') return list.includes('Frische Beeren')?'portions':'wreath';
    return 'accent';
  }

  function decorationPoints(layout,count,radius,cutaway=false,phase=-.72){
    const points=[];
    for(let i=0;i<count;i++){
      const t=count===1?.5:i/(count-1),golden=i*2.399963;
      let angle=phase,rr=radius*.5;
      if(layout==='wreath'){angle=phase+i/count*Math.PI*2;rr=radius*.76;}
      else if(layout==='portions'){angle=phase+i/count*Math.PI*2;rr=radius*.72;}
      else if(layout==='spiral'){angle=phase+i*.88;rr=radius*(.12+.68*t);}
      else if(layout==='scatter'){angle=phase+golden;rr=radius*(.16+.7*Math.sqrt((i+.5)/count));}
      else {angle=phase+(i-(count-1)/2)*.3;rr=radius*(.48+(i%3)*.12);}
      const delta=Math.atan2(Math.sin(angle-CUT_CENTER),Math.cos(angle-CUT_CENTER));
      if(cutaway && Math.abs(delta)<CUT_GAP*.72) angle+=delta<0?-CUT_GAP:CUT_GAP;
      points.push({x:Math.sin(angle)*rr,z:Math.cos(angle)*rr,angle,scale:.92+(i%3)*.06});
    }
    return points;
  }

  function addFlower(point,topY,index,target){
    const colors=[0xe9bfc3,0xf3d8bd,0xd9b9d5],petalMat=new THREE.MeshPhysicalMaterial({color:colors[index%colors.length],roughness:.58,sheen:.15});
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2,p=new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),petalMat);p.scale.set(1,.32,.58);p.position.set(point.x+Math.cos(a)*.12,topY+.2,point.z+Math.sin(a)*.12);p.rotation.y=a;target.add(p);}
    const center=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshStandardMaterial({color:0xd5a44a,roughness:.72}));center.position.set(point.x,topY+.235,point.z);target.add(center);
  }

  function addCandle(point,topY,index,target){
    const colors=[0xd57682,0xe2b86c,0x899e82,0x8fa8be],mat=new THREE.MeshStandardMaterial({color:colors[index%colors.length],roughness:.5});
    const candle=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.55,12),mat);candle.position.set(point.x,topY+.4,point.z);target.add(candle);
    const flame=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),new THREE.MeshBasicMaterial({color:0xf1a52f}));flame.scale.set(.65,1.35,.65);flame.position.set(point.x,topY+.72,point.z);target.add(flame);
  }

  function pipingMaterial(config){
    const colors={Vanille:0xf5e7d2,Schokolade:0x6a392a,Erdbeere:0xea9aaa,Pistazie:0xb4c68e,Keine:0xf5e7d2};
    return new THREE.MeshPhysicalMaterial({color:colors[config.glaze]||colors.Vanille,roughness:.48,metalness:0,sheen:.3,sheenRoughness:.64,clearcoat:.035,clearcoatRoughness:.7});
  }

  function makePipingMotif(style,material){
    const group=new THREE.Group();
    if(style==='rosettes'){
      const swirl=new THREE.Mesh(new THREE.TorusKnotGeometry(.105,.032,48,7,2,7),material);swirl.rotation.x=Math.PI/2;swirl.scale.y=.48;swirl.position.y=.035;group.add(swirl);
      const center=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),material);center.scale.y=.6;center.position.y=.045;group.add(center);
    }else{
      const profile=[new THREE.Vector2(.018,0),new THREE.Vector2(.12,.018),new THREE.Vector2(.09,.06),new THREE.Vector2(.17,.105),new THREE.Vector2(.11,.15),new THREE.Vector2(.135,.2),new THREE.Vector2(.065,.255),new THREE.Vector2(0,.31)];
      const tuff=new THREE.Mesh(new THREE.LatheGeometry(profile,14),material);group.add(tuff);
    }
    return group;
  }

  function addPipingMotif(point,y,style,side,radius,material,target){
    const motif=makePipingMotif(style==='borders'?'tufts':style,material);
    const scale=style==='borders'?.58:style==='rosettes'?.9:.82;motif.scale.setScalar(scale);
    if(side){
      const normal=new THREE.Vector3(point.x,0,point.z).normalize();
      motif.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
      motif.position.set(normal.x*radius,y,normal.z*radius);
    }else motif.position.set(point.x,y,point.z);
    motif.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;}});target.add(motif);
  }

  function addPiping(radius,topY,config,target,cutaway){
    const style=config.pipingStyle||'tufts',position=config.pipingPosition||'top',requested=config.decorationLayout||'smart',list=config.decorations||[];
    const layout=assetLayout(requested,'Spritzdekor',list,config.size),pieces=portionCount(config.size),material=pipingMaterial(config),hasBerries=list.includes('Frische Beeren');
    if(position==='top'||position==='both'){
      const topLayout=style==='borders'?'wreath':layout,count=style==='borders'?32:topLayout==='portions'?pieces:topLayout==='wreath'?14:topLayout==='spiral'?12:7;
      decorationPoints(topLayout,count,radius,cutaway,hasBerries?-.48:-.72).forEach(p=>addPipingMotif(p,topY+.12,style,false,radius,material,target));
    }
    if(position==='side'||position==='both'){
      const sideLayout=style==='borders'?'wreath':layout,count=style==='borders'?28:sideLayout==='portions'?pieces:sideLayout==='wreath'?14:sideLayout==='spiral'?13:7;
      decorationPoints(sideLayout,count,radius,cutaway,hasBerries?-.44:-.68).forEach((p,i)=>{
        const sideY=topY-(style==='borders'?.34:sideLayout==='spiral'?.25+(i/count)*.72:.48);
        addPipingMotif(p,sideY,style,true,radius*1.035,material,target);
      });
    }
  }

  function addDecorations(radius,topY,config,target=cakeGroup,cutaway=false){
    const list=config.decorations||[],requested=config.decorationLayout||'smart',pieces=portionCount(config.size);
    if(list.includes('Frische Beeren')){
      const layout=assetLayout(requested,'Frische Beeren',list,config.size),count=layout==='portions'?pieces:layout==='wreath'?12:layout==='spiral'?11:7;
      decorationPoints(layout,count,radius,cutaway).forEach((p,i)=>addStrawberry(p.x,topY+.24,p.z,.24*p.scale,i*.7,target));
    }
    if(list.includes('Streusel')){
      const layout=assetLayout(requested,'Streusel',list,config.size),count=layout==='portions'?pieces*3:layout==='spiral'?72:layout==='wreath'?64:layout==='accent'?48:84;
      const colors=[0xb94b61,0xe2b86c,0x719c91,0x8c6fa6];
      decorationPoints(layout,count,radius,cutaway,.15).forEach((p,i)=>{const mat=new THREE.MeshStandardMaterial({color:colors[i%colors.length],roughness:.55});const m=new THREE.Mesh(new THREE.CapsuleGeometry(.016,.065,3,5),mat);m.position.set(p.x,topY+.14+(i%4)*.006,p.z);m.rotation.set(i*.23,p.angle,i*.37);target.add(m);});
    }
    if(list.includes('Blumen')){
      const layout=assetLayout(requested,'Blumen',list,config.size),count=layout==='wreath'?7:layout==='portions'?Math.min(pieces,8):layout==='spiral'?6:3;
      decorationPoints(layout,count,radius*.9,cutaway,-1.05).forEach((p,i)=>addFlower(p,topY,i,target));
    }
    if(list.includes('Kerzen')){
      const layout=assetLayout(requested,'Kerzen',list,config.size),count=layout==='portions'?Math.min(pieces,8):layout==='wreath'?8:layout==='spiral'?6:4;
      decorationPoints(layout,count,radius*.78,cutaway,-.25).forEach((p,i)=>addCandle(p,topY,i,target));
    }
    if(list.includes('Spritzdekor')) addPiping(radius,topY,config,target,cutaway);
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
    addDecorations(radius,y+.08,config);
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
    addDecorations(radius,y+.08,config,cakeGroup,true);

    const slicePlate=new THREE.Mesh(new THREE.CylinderGeometry(1.38,1.44,.07,72),new THREE.MeshPhysicalMaterial({color:0xf7f1e8,roughness:.3,clearcoat:.35,clearcoatRoughness:.25}));
    slicePlate.scale.z=.76; slicePlate.position.set(2.95,.02,1.25); slicePlate.castShadow=slicePlate.receiveShadow=true; cakeGroup.add(slicePlate);

    const slice=new THREE.Group();
    const sliceGap=CUT_GAP;
    const sliceStart=CUT_CENTER-sliceGap/2;
    let sy=.10;
    config.layers.forEach((flavor,i)=>{
      sectorLayer(radius,spongeH,sy+spongeH/2,doughMaterial(flavor),sliceStart,sliceGap,slice);
      sy+=spongeH;
      if(i<config.fillings.length){
        sectorLayer(radius*1.006,fillH,sy+fillH/2,fillingMaterial(config.fillings[i]),sliceStart,sliceGap,slice);
        sy+=fillH;
      }
    });
    if(config.glaze!=='Keine'){
      const sm=finishMaterial(config.glaze);
      sectorShell(radius,sy+.02,(sy+.02)/2,sm,sliceStart,sliceGap,slice);
      const stop=new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,.085,80,2,false,sliceStart,sliceGap),sm.clone());
      stop.position.y=sy+.06; slice.add(stop);
    }
    if((config.decorations||[]).includes('Frische Beeren') && (config.decorationLayout==='portions'||config.decorationLayout==='smart')) addStrawberry(Math.sin(CUT_CENTER)*radius*.44,sy+.32,Math.cos(CUT_CENTER)*radius*.44,.24,.2,slice);
    slice.position.set(1.95,.10,.43);
    slice.rotation.y=-.12;
    cakeGroup.add(slice);

    return {top:y,radius};
  }

  function buildSliceOnly(config){
    const scale=sizeScale[config.size]||1;
    const radius=1.72*scale,spongeH=.62,fillH=.18,sliceStart=-CUT_GAP/2;
    let y=.12;
    config.layers.forEach((flavor,i)=>{
      sectorLayer(radius,spongeH,y+spongeH/2,doughMaterial(flavor),sliceStart,CUT_GAP,cakeGroup);
      y+=spongeH;
      if(i<config.fillings.length){sectorLayer(radius*1.006,fillH,y+fillH/2,fillingMaterial(config.fillings[i]),sliceStart,CUT_GAP,cakeGroup);y+=fillH;}
    });
    if(config.glaze!=='Keine'){
      const mat=finishMaterial(config.glaze);
      sectorShell(radius,y+.02,(y+.02)/2,mat,sliceStart,CUT_GAP,cakeGroup);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(radius*1.025,radius*1.02,.085,80,2,false,sliceStart,CUT_GAP),mat.clone());
      top.position.y=y+.06; top.castShadow=true; cakeGroup.add(top);
    }
    if((config.decorations||[]).includes('Frische Beeren')) addStrawberry(0,y+.32,radius*.48,.24,.2,cakeGroup);
    cakeGroup.rotation.y=-.42;
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
    addDecorations(radius,y,config);
    return {top:y,radius};
  }

  function applyViewFraming(top){
    root.position.set(0,0,0); root.scale.setScalar(1);
    if(viewMode==='cutaway'){
      root.position.x=-.28; root.scale.setScalar(.83);
      camera.position.set(7.3,4.6,9.4);
    }else if(viewMode==='slice'){
      root.scale.setScalar(1.08);
      camera.position.set(5.3,3.65,7.2);
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
    if(status) status.textContent=viewMode==='cutaway'?'Anschnitt · Innenansicht':viewMode==='slice'?'Tortenstück · Detailansicht':viewMode==='exploded'?'Explosionsansicht':'Ganze Torte';
  }

  function setViewMode(mode){
    if(!['whole','cutaway','slice','exploded'].includes(mode)) return;
    viewMode=mode; updateModeUI(); resetView(); if(pendingConfig) build(pendingConfig);
  }

  function mountViewModes(){
    const controls=document.querySelector('.view-controls');
    if(!controls || document.querySelector('.cake-view-modes')) return;
    const modes=document.createElement('div');
    modes.className='cake-view-modes';
    modes.setAttribute('aria-label','Darstellung der Torte');
    modes.innerHTML='<button type="button" data-cake-view="whole">Ganz</button><button type="button" data-cake-view="cutaway" class="is-active">Anschnitt</button><button type="button" data-cake-view="slice">Stück</button><button type="button" data-cake-view="exploded">Schichten</button>';
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
    else if(viewMode==='slice') result=buildSliceOnly(config);
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

  const visualStage=canvas.closest('.visual-stage');
  let fullscreen=false;
  function setCakeFullscreen(open){
    if(!visualStage) return;
    fullscreen=!!open;
    visualStage.classList.toggle('is-cake-fullscreen',fullscreen);
    document.body.classList.toggle('cake-fullscreen-open',fullscreen);
    const close=visualStage.querySelector('.cake-fullscreen-close');
    if(close) close.setAttribute('aria-hidden',fullscreen?'false':'true');
    requestAnimationFrame(resize);
  }
  if(visualStage){
    const close=document.createElement('button');
    close.type='button'; close.className='cake-fullscreen-close'; close.setAttribute('aria-label','Vollbild schließen'); close.setAttribute('aria-hidden','true'); close.textContent='×';
    close.addEventListener('click',e=>{e.stopPropagation();setCakeFullscreen(false)});
    visualStage.appendChild(close);
  }

  let dragging=false,lastX=0,lastY=0,pointerStartX=0,pointerStartY=0,pointerMoved=false;
  canvas.addEventListener('pointerdown',e=>{dragging=true;pointerMoved=false;pointerStartX=lastX=e.clientX;pointerStartY=lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.hypot(e.clientX-pointerStartX,e.clientY-pointerStartY)>7)pointerMoved=true;root.rotation.y+=dx*.008;root.rotation.x=Math.max(-.25,Math.min(.14,root.rotation.x+dy*.003));lastX=e.clientX;lastY=e.clientY});
  canvas.addEventListener('pointerup',()=>{const shouldToggle=!pointerMoved;dragging=false;if(shouldToggle)setCakeFullscreen(!fullscreen)});
  canvas.addEventListener('pointercancel',()=>dragging=false);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fullscreen)setCakeFullscreen(false)});

  function resetView(){root.rotation.set(-.05,-.38,0)}
  const left=document.getElementById('rotateLeft'),right=document.getElementById('rotateRight'),reset=document.getElementById('resetView');
  if(left)left.onclick=()=>root.rotation.y-=.35;
  if(right)right.onclick=()=>root.rotation.y+=.35;
  if(reset)reset.onclick=resetView;

  window.Cake3D={update:build,resetView,setViewMode,getViewMode:()=>viewMode,setFullscreen:setCakeFullscreen};
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
