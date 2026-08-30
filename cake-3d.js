(() => {
  'use strict';

  function loadCatalog(done) {
    if (window.CakeCatalog) return done();
    const script = document.createElement('script');
    script.src = 'cake-components.js';
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  }

  loadCatalog(() => {
    if (!window.THREE) {
      console.error('Three.js is required for the cake renderer.');
      return;
    }

    const THREE = window.THREE;
    const canvas = document.getElementById('cakeCanvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.07;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4efe9);

    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(5.9, 3.85, 7.7);
    camera.lookAt(0, 1.4, 0);

    const root = new THREE.Group();
    root.rotation.set(-0.055, -0.38, 0);
    scene.add(root);

    function random(seed) {
      let t = seed + 0x6D2B79F5;
      return () => {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    }

    function studioEnvironment() {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 512;
      const ctx = c.getContext('2d');
      const bg = ctx.createLinearGradient(0, 0, 0, 512);
      bg.addColorStop(0, '#fffaf4'); bg.addColorStop(.55, '#e8ddd4'); bg.addColorStop(1, '#85766d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 512);
      const softbox = ctx.createRadialGradient(235, 160, 5, 235, 160, 250);
      softbox.addColorStop(0, 'rgba(255,255,255,1)'); softbox.addColorStop(.25, 'rgba(255,250,240,.85)'); softbox.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = softbox; ctx.fillRect(0, 0, 520, 410);
      const rim = ctx.createRadialGradient(800, 210, 4, 800, 210, 180);
      rim.addColorStop(0, 'rgba(225,236,255,.72)'); rim.addColorStop(1, 'rgba(225,236,255,0)');
      ctx.fillStyle = rim; ctx.fillRect(600, 40, 424, 380);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromEquirectangular(tex).texture;
      tex.dispose(); pmrem.dispose();
      return env;
    }
    scene.environment = studioEnvironment();

    const hemi = new THREE.HemisphereLight(0xfff8ef, 0x695f5b, 1.35);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff4e7, 4.7);
    key.position.set(4.4, 7.2, 5.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; key.shadow.bias = -0.0002;
    scene.add(key);
    const fill = new THREE.PointLight(0xffe0df, 11, 16, 2); fill.position.set(-4.4, 3.3, 4.3); scene.add(fill);
    const rim = new THREE.PointLight(0xdce7ff, 9, 15, 2); rim.position.set(3.8, 4.4, -5.2); scene.add(rim);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0xece3dc, roughness: .92 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.12; floor.receiveShadow = true; scene.add(floor);

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.83, .11, 128), new THREE.MeshPhysicalMaterial({ color: 0xf7f3ef, roughness: .22, clearcoat: .8, clearcoatRoughness: .16 }));
    plate.position.y = -.02; plate.castShadow = plate.receiveShadow = true; root.add(plate);
    const rimPlate = new THREE.Mesh(new THREE.TorusGeometry(2.45, .045, 12, 128), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .19, clearcoat: 1 }));
    rimPlate.rotation.x = Math.PI / 2; rimPlate.position.y = .045; root.add(rimPlate);

    let cakeGroup = new THREE.Group(); root.add(cakeGroup);
    let currentConfig = null;

    function disposeObject(object) {
      object.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose());
      });
    }

    function shadow(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

    function noisyTexture(base, seed, contrast = .16, pores = 2400) {
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const ctx = c.getContext('2d'); ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 512);
      const rnd = random(seed);
      for (let i = 0; i < pores; i++) {
        const light = rnd() > .48;
        const alpha = .018 + rnd() * .095;
        ctx.fillStyle = light ? `rgba(255,245,218,${alpha})` : `rgba(71,42,24,${alpha * contrast * 4})`;
        const s = .7 + rnd() * 3.3;
        ctx.beginPath(); ctx.ellipse(rnd()*512, rnd()*512, s, s*(.5+rnd()), rnd()*Math.PI, 0, Math.PI*2); ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2.4, 1.25);
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8); return tex;
    }

    function roughnessTexture(seed, strength=.35) {
      const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d'); const img = ctx.createImageData(256,256); const rnd=random(seed);
      for(let i=0;i<img.data.length;i+=4){const v=Math.round(120+rnd()*110*strength);img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;} ctx.putImageData(img,0,0);
      const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,2);return tex;
    }

    const textures = {
      vanilla: noisyTexture('#d4a05e', 11, .18), chocolate: noisyTexture('#59301f', 12, .24), lemon: noisyTexture('#d1ae48', 13, .15),
      red: noisyTexture('#792126', 14, .24), marble: noisyTexture('#a87552', 15, .2), cream: noisyTexture('#eadbc8', 16, .055, 1200),
      crumbRough: roughnessTexture(44, .7), creamRough: roughnessTexture(45, .22)
    };
    const doughTex = { Vanille:textures.vanilla, Schokolade:textures.chocolate, Zitrone:textures.lemon, 'Red Velvet':textures.red, Marmor:textures.marble };
    const doughColor = { Vanille:0xd7a464, Schokolade:0x5d3422, Zitrone:0xd4b24c, 'Red Velvet':0x7e2529, Marmor:0xaa7955 };
    const fillingColor = { Buttercreme:0xf2e2c7, Erdbeere:0xde7188, Schokolade:0x603426, Zitrone:0xead06a, Pistazie:0x9db57b };
    const glazeColor = { Vanille:0xeadbc8, Schokolade:0x4f2c22, Erdbeere:0xe68a9f, Pistazie:0x9dbb7a, Keine:null };

    function irregularCylinder(radius, height, seed, segments=128) {
      const geo = new THREE.CylinderGeometry(radius, radius*.998, height, segments, 10, false);
      const pos = geo.attributes.position; const rnd = random(seed); const offsets = new Map();
      for (let i=0;i<pos.count;i++) {
        const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i); const r=Math.hypot(x,z); if(r < radius*.7) continue;
        const key=Math.round(Math.atan2(z,x)*segments/(Math.PI*2));
        if(!offsets.has(key)) offsets.set(key, (rnd()-.5)*.032);
        const wobble=offsets.get(key)+Math.sin(y*12+key*.7)*.006;
        const nr=Math.max(.01,r+wobble); pos.setX(i,x/r*nr); pos.setZ(i,z/r*nr);
      }
      pos.needsUpdate=true; geo.computeVertexNormals(); return geo;
    }

    function makeSponge(radius, height, y, flavor, seed) {
      const mat = new THREE.MeshStandardMaterial({ color:doughColor[flavor]||doughColor.Vanille, map:doughTex[flavor]||textures.vanilla, roughnessMap:textures.crumbRough, roughness:.92, metalness:0 });
      const sponge = shadow(new THREE.Mesh(irregularCylinder(radius,height,seed),mat)); sponge.position.y=y; cakeGroup.add(sponge);
      const rnd=random(seed+800); const poreMat=new THREE.MeshStandardMaterial({color:0x6b4529,roughness:1}); const poreGeo=new THREE.SphereGeometry(.012,6,5);
      for(let i=0;i<125;i++){const a=rnd()*Math.PI*2;const yy=y-height/2+.05+rnd()*(height-.1);const p=new THREE.Mesh(poreGeo,poreMat);p.position.set(Math.cos(a)*(radius+.006),yy,Math.sin(a)*(radius+.006));const s=.45+rnd()*1.45;p.scale.set(s*1.4,s,s*.5);cakeGroup.add(p);}
      const crust = new THREE.Mesh(new THREE.TorusGeometry(radius*.965,.023,8,128),new THREE.MeshStandardMaterial({color:0xa96c32,roughness:.95})); crust.rotation.x=Math.PI/2; crust.position.y=y+height/2-.015; cakeGroup.add(crust);
    }

    function addFilling(radius,y,flavor){
      const mat=new THREE.MeshPhysicalMaterial({color:fillingColor[flavor]||0xf2e2c7,roughness:flavor==='Schokolade'?.4:.66,sheen:.22,sheenRoughness:.6,clearcoat:flavor==='Schokolade'?.14:.02});
      const cream=shadow(new THREE.Mesh(irregularCylinder(radius*1.015,.18,320+Math.round(y*100)),mat));cream.position.y=y;cakeGroup.add(cream);
      const rnd=random(900+Math.round(y*200));
      for(let i=0;i<24;i++){const a=i/24*Math.PI*2+(rnd()-.5)*.08;const blob=new THREE.Mesh(new THREE.SphereGeometry(.052+rnd()*.025,10,7),mat);blob.scale.set(1.25,.55,.75);blob.position.set(Math.cos(a)*radius*1.014,y+(rnd()-.5)*.055,Math.sin(a)*radius*1.014);cakeGroup.add(blob);}
      if(flavor==='Erdbeere') for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2+.1;const jam=new THREE.Mesh(new THREE.SphereGeometry(.032,10,8),new THREE.MeshPhysicalMaterial({color:0xa91e37,roughness:.32,clearcoat:.38}));jam.position.set(Math.cos(a)*radius*1.026,y+(i%3-1)*.025,Math.sin(a)*radius*1.026);cakeGroup.add(jam);}
    }

    function addSemiNakedFinish(radius,bottomY,topY,flavor){
      if(flavor==='Keine') return;
      const color=glazeColor[flavor]||0xeadbc8; const height=topY-bottomY;
      const mat=new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:flavor==='Vanille'?.86:.96,roughness:flavor==='Schokolade'?.3:.58,roughnessMap:textures.creamRough,clearcoat:flavor==='Schokolade'?.34:.06,clearcoatRoughness:.3,sheen:.22});
      const shell=shadow(new THREE.Mesh(irregularCylinder(radius*1.025,height,771),mat)); shell.position.y=bottomY+height/2; cakeGroup.add(shell);
      if(flavor==='Vanille') {
        const scrapeMat=new THREE.MeshStandardMaterial({color:0xf5eadb,roughness:.72,transparent:true,opacity:.5}); const rnd=random(72);
        for(let i=0;i<34;i++){const a=rnd()*Math.PI*2;const h=.08+rnd()*.3;const mark=new THREE.Mesh(new THREE.BoxGeometry(.012,h,.035),scrapeMat);mark.position.set(Math.cos(a)*radius*1.036,bottomY+.12+rnd()*(height-.22),Math.sin(a)*radius*1.036);mark.rotation.y=-a;cakeGroup.add(mark);}
      }
    }

    function addTopFrosting(radius,topY,flavor){
      if(flavor==='Keine') return;
      const color=glazeColor[flavor]; const mat=new THREE.MeshPhysicalMaterial({color,roughness:flavor==='Schokolade'?.24:.5,roughnessMap:flavor==='Vanille'?textures.creamRough:null,clearcoat:flavor==='Schokolade'?.5:.08,clearcoatRoughness:.2,sheen:.3});
      const top=shadow(new THREE.Mesh(irregularCylinder(radius*1.025,.12,512),mat));top.position.y=topY+.05;cakeGroup.add(top);
      const rnd=random(514);for(let i=0;i<16;i++){const a=i/16*Math.PI*2+(rnd()-.5)*.08;const len=.08+rnd()*.25;const drip=shadow(new THREE.Mesh(new THREE.CapsuleGeometry(.027+rnd()*.018,len,5,8),mat));drip.position.set(Math.cos(a)*radius*1.027,topY-len/2+.02,Math.sin(a)*radius*1.027);cakeGroup.add(drip);}
    }

    function strawberry(x,y,z,scale=1,rot=0){
      const pts=[];for(let i=0;i<=18;i++){const t=i/18;const yy=-.15+t*.3;const rr=.02+Math.sin(t*Math.PI)*.115*(.85+.15*(1-t));pts.push(new THREE.Vector2(rr,yy));}
      const body=shadow(new THREE.Mesh(new THREE.LatheGeometry(pts,28),new THREE.MeshPhysicalMaterial({color:0xd93243,roughness:.34,clearcoat:.28,clearcoatRoughness:.2})));body.position.set(x,y,z);body.scale.setScalar(scale);body.rotation.z=Math.PI;body.rotation.y=rot;cakeGroup.add(body);
      const seedMat=new THREE.MeshStandardMaterial({color:0xf0c77f,roughness:.75}); const seedGeo=new THREE.SphereGeometry(.009,6,5);
      for(let i=0;i<18;i++){const a=(i%6)/6*Math.PI*2+((i/6)|0)*.32;const h=-.06+((i/6)|0)*.055;const r=.095*(1-Math.abs(h)/.2);const s=new THREE.Mesh(seedGeo,seedMat);s.position.set(x+Math.cos(a)*r*scale,y-h*scale,z+Math.sin(a)*r*scale);cakeGroup.add(s);}
      const leafMat=new THREE.MeshStandardMaterial({color:0x3f6d36,roughness:.82,side:THREE.DoubleSide});for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.055*scale,.12*scale,3),leafMat);leaf.position.set(x,y+.145*scale,z);leaf.rotation.z=Math.PI/2;leaf.rotation.y=i*Math.PI*2/5;cakeGroup.add(leaf);}
    }

    function blueberry(x,y,z,scale=1){const mat=new THREE.MeshPhysicalMaterial({color:0x334a78,roughness:.48,clearcoat:.18});const b=shadow(new THREE.Mesh(new THREE.SphereGeometry(.085*scale,20,14),mat));b.position.set(x,y,z);b.scale.y=.92;cakeGroup.add(b);const crown=new THREE.Mesh(new THREE.TorusGeometry(.026*scale,.008*scale,6,8),new THREE.MeshStandardMaterial({color:0x273650,roughness:.85}));crown.rotation.x=Math.PI/2;crown.position.set(x,y+.077*scale,z);cakeGroup.add(crown);}
    function raspberry(x,y,z,scale=1){const mat=new THREE.MeshPhysicalMaterial({color:0xc51f45,roughness:.46,clearcoat:.12});for(let r=0;r<4;r++)for(let i=0;i<8-r;i++){const a=i/(8-r)*Math.PI*2;const rr=.055*(1-r*.13);const bead=new THREE.Mesh(new THREE.SphereGeometry(.026*scale,10,8),mat);bead.position.set(x+Math.cos(a)*rr*scale,y+(r-.8)*.034*scale,z+Math.sin(a)*rr*scale);bead.castShadow=true;cakeGroup.add(bead);}}

    function creamDollop(x,y,z,scale=1){const pts=[];for(let i=0;i<=16;i++){const t=i/16;const rr=.12*Math.sin(Math.PI*t)*(.7+.3*Math.cos(t*Math.PI*5));pts.push(new THREE.Vector2(Math.max(.006,rr),t*.22));}const m=new THREE.Mesh(new THREE.LatheGeometry(pts,24),new THREE.MeshPhysicalMaterial({color:0xf0e3d1,roughness:.6,sheen:.25}));m.position.set(x,y,z);m.scale.setScalar(scale);m.castShadow=true;cakeGroup.add(m);}

    function addBerryArrangement(radius,topY){
      const p=[[-.55,.05,1.08],[-.28,-.31,.95],[.02,-.08,1.16],[.32,-.31,.92],[.54,.03,1.04],[.18,.35,.9],[-.28,.36,.92]];
      p.forEach((v,i)=>{if(i<4) strawberry(v[0]*radius,topY+.22,v[1]*radius,v[2],i*.7);else if(i%2) raspberry(v[0]*radius,topY+.2,v[1]*radius,1.05);else blueberry(v[0]*radius,topY+.18,v[1]*radius,1.05);});
      creamDollop(-.08*radius,topY+.12,.26*radius,1.05);creamDollop(.38*radius,topY+.12,.18*radius,.92);creamDollop(-.42*radius,topY+.12,-.17*radius,.9);
    }

    function addFlowers(radius,topY){const colors=[0xf7d9df,0xeeb2c0,0xffeee8];for(let j=0;j<3;j++){const x=(-.42+j*.42)*radius,z=(j===1?.3:-.04)*radius;const mat=new THREE.MeshPhysicalMaterial({color:colors[j],roughness:.57,sheen:.42,side:THREE.DoubleSide});for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const petal=new THREE.Mesh(new THREE.SphereGeometry(.085,14,8),mat);petal.scale.set(1.5,.24,.72);petal.position.set(x+Math.cos(a)*.09,topY+.18,z+Math.sin(a)*.09);petal.rotation.y=-a;cakeGroup.add(petal);}}}
    function addSprinkles(radius,topY){const cols=[0xe75574,0x5da8a2,0xe8b43c,0x8c67ab];const rnd=random(1002);for(let i=0;i<60;i++){const a=rnd()*Math.PI*2,r=radius*Math.sqrt(rnd())*.82;const s=new THREE.Mesh(new THREE.CapsuleGeometry(.015,.055,3,5),new THREE.MeshStandardMaterial({color:cols[i%cols.length],roughness:.55}));s.position.set(Math.cos(a)*r,topY+.15,Math.sin(a)*r);s.rotation.set(rnd()*Math.PI,rnd()*Math.PI,rnd()*Math.PI);cakeGroup.add(s);}}
    function addCandles(radius,topY){[-.25,0,.25].forEach((x,i)=>{const c=shadow(new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.48,16),new THREE.MeshStandardMaterial({color:[0xe76f88,0x6fb3af,0xe7b850][i],roughness:.55})));c.position.set(x*radius,topY+.38,.02);cakeGroup.add(c);const f=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshBasicMaterial({color:0xffaa30}));f.scale.y=1.7;f.position.set(x*radius,topY+.66,.02);cakeGroup.add(f);});}

    function ingredientPanel(config){
      if(!window.CakeCatalog?.ingredientTotals) return;
      let panel=document.getElementById('ingredientPreview');
      if(!panel){panel=document.createElement('details');panel.id='ingredientPreview';panel.style.cssText='margin-top:16px;padding:12px;border:1px solid #eadde2;border-radius:12px;background:#fff9fb;font-size:.88rem';panel.innerHTML='<summary style="cursor:pointer;font-weight:800;color:#8e3152">Backdaten & Zutaten</summary><p class="small" style="margin:8px 0">Die Werte sind derzeit Planungswerte und können später durch echte Rezepte ersetzt werden.</p><ul id="ingredientList" style="columns:2;padding-left:18px;margin:0"></ul>';document.querySelector('.config-summary')?.appendChild(panel);}
      const rows=window.CakeCatalog.ingredientTotals(config);const list=document.getElementById('ingredientList');if(list)list.innerHTML=rows.map(r=>`<li>${r.name}: ${r.amount} ${r.unit}</li>`).join('');
    }

    function addPresetButton(){
      if(document.getElementById('photoPreset')) return;
      const controls=document.querySelector('.view-controls'); if(!controls) return;
      const b=document.createElement('button');b.id='photoPreset';b.type='button';b.textContent='📷 Foto-Referenz';b.title='Vanille, 3 Schichten, Erdbeerfüllung, Vanillecreme und frische Beeren';controls.appendChild(b);
      b.addEventListener('click',()=>{
        while(document.querySelectorAll('[data-layer]').length<3) document.getElementById('addLayer')?.click();
        setTimeout(()=>{
          document.querySelectorAll('[data-layer]').forEach(el=>{el.value='Vanille';el.dispatchEvent(new Event('change',{bubbles:true}));});
          document.querySelectorAll('[data-filling]').forEach(el=>{el.value='Erdbeere';el.dispatchEvent(new Event('change',{bubbles:true}));});
          const glaze=document.getElementById('glaze');if(glaze){glaze.value='Vanille';glaze.dispatchEvent(new Event('change',{bubbles:true}));}
          const berry=document.querySelector('input[name="config-decoration"][value="Frische Beeren"]');if(berry){berry.checked=true;berry.dispatchEvent(new Event('change',{bubbles:true}));}
        },0);
      });
    }

    function rebuild(config){
      currentConfig=config;root.remove(cakeGroup);disposeObject(cakeGroup);cakeGroup=new THREE.Group();root.add(cakeGroup);
      const catalog=window.CakeCatalog; const sizeScale=catalog?.sizes?.[config.size]?.scale || (config.size==='Groß'?1.16:config.size==='Mittel'?1.05:.93);
      const radius=1.72*sizeScale, layerH=.58, fillingH=.18; let y=.11+layerH/2; const bottomY=.11;
      config.layers.forEach((flavor,index)=>{makeSponge(radius*.995,layerH,y,flavor,100+index*37);y+=layerH/2;if(index<config.layers.length-1){y+=fillingH/2;addFilling(radius,y,config.fillings[index]||'Buttercreme');y+=fillingH/2+layerH/2;}});
      const topY=y;addSemiNakedFinish(radius,bottomY,topY+.03,config.glaze);addTopFrosting(radius,topY,config.glaze);
      if(config.decorations.includes('Frische Beeren'))addBerryArrangement(radius,topY);
      if(config.decorations.includes('Blumen'))addFlowers(radius,topY);
      if(config.decorations.includes('Streusel'))addSprinkles(radius,topY);
      if(config.decorations.includes('Kerzen'))addCandles(radius,topY);
      ingredientPanel(config); camera.lookAt(0,Math.max(1.2,(topY+.45)*.48),0);
    }

    function resize(){const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}
    let dragging=false,lastX=0,lastY=0,tilt=-.055;
    canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(!dragging)return;root.rotation.y+=(e.clientX-lastX)*.011;tilt=Math.max(-.22,Math.min(.14,tilt+(e.clientY-lastY)*.003));root.rotation.x=tilt;lastX=e.clientX;lastY=e.clientY});
    canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
    document.getElementById('rotateLeft')?.addEventListener('click',()=>root.rotation.y-=.35);document.getElementById('rotateRight')?.addEventListener('click',()=>root.rotation.y+=.35);document.getElementById('resetView')?.addEventListener('click',()=>{root.rotation.set(-.055,-.38,0);tilt=-.055});
    addPresetButton();

    window.Cake3D={update:rebuild,resetView(){root.rotation.set(-.055,-.38,0);tilt=-.055},getComponentData(){return window.CakeCatalog},getCurrentConfig(){return currentConfig}};
    (function animate(){resize();renderer.render(scene,camera);requestAnimationFrame(animate)})();
  });
})();