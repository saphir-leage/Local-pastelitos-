(() => {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) return;

  function rnd(seed){ let s=seed>>>0; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296); }

  function makeTexture(base, seed, mode, size=1024){
    const c=document.createElement('canvas'); c.width=c.height=size;
    const x=c.getContext('2d'); const r=rnd(seed);
    x.fillStyle=base; x.fillRect(0,0,size,size);
    const count=mode==='crumb'?7600:mode==='cream'?1800:mode==='marble'?3400:mode==='fruit'?4200:mode==='nut'?5200:5200;
    for(let i=0;i<count;i++){
      const px=r()*size,py=r()*size;
      if(mode==='crumb'){
        const s=.7+r()*5.5;
        x.fillStyle=r()>.48?`rgba(255,232,183,${.025+r()*.12})`:`rgba(72,42,22,${.025+r()*.13})`;
        x.beginPath(); x.ellipse(px,py,s,s*(.35+r()*.9),r()*Math.PI,0,Math.PI*2); x.fill();
      } else if(mode==='cream'){
        const w=8+r()*42,h=.5+r()*3.2;
        x.fillStyle=r()>.5?`rgba(255,255,255,${.018+r()*.07})`:`rgba(80,45,30,${.008+r()*.035})`;
        x.beginPath(); x.ellipse(px,py,w,h,r()*Math.PI,0,Math.PI*2); x.fill();
      } else if(mode==='marble'){
        const w=18+r()*80,h=1+r()*7;
        x.fillStyle=r()>.5?`rgba(92,43,24,${.08+r()*.2})`:`rgba(255,224,165,${.04+r()*.16})`;
        x.beginPath(); x.ellipse(px,py,w,h,r()*Math.PI,0,Math.PI*2); x.fill();
      } else if(mode==='fruit'){
        const s=.6+r()*4.5;
        x.fillStyle=r()>.62?`rgba(255,205,190,${.04+r()*.13})`:`rgba(92,10,26,${.025+r()*.13})`;
        x.beginPath(); x.ellipse(px,py,s,s*(.35+r()),r()*Math.PI,0,Math.PI*2); x.fill();
      } else if(mode==='nut'){
        const s=.6+r()*4;
        x.fillStyle=r()>.56?`rgba(224,185,115,${.035+r()*.12})`:`rgba(65,37,18,${.025+r()*.12})`;
        x.beginPath(); x.ellipse(px,py,s,s*(.3+r()),r()*Math.PI,0,Math.PI*2); x.fill();
      } else {
        const s=.5+r()*3.2;
        x.fillStyle=r()>.56?`rgba(255,190,138,${.015+r()*.055})`:`rgba(45,14,8,${.02+r()*.09})`;
        x.beginPath(); x.ellipse(px,py,s,s*(.4+r()*.8),r()*Math.PI,0,Math.PI*2); x.fill();
      }
    }
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=12;
    return t;
  }

  function makeBump(seed,mode,size=1024){
    const c=document.createElement('canvas'); c.width=c.height=size;
    const x=c.getContext('2d'); const r=rnd(seed);
    x.fillStyle='#858585'; x.fillRect(0,0,size,size);
    const count=mode==='crumb'?5200:mode==='cream'?1800:3600;
    for(let i=0;i<count;i++){
      const px=r()*size,py=r()*size,s=1+r()*(mode==='crumb'?7:mode==='cream'?14:4);
      const v=mode==='crumb'?(55+Math.floor(r()*80)):(95+Math.floor(r()*60));
      x.fillStyle=`rgb(${v},${v},${v})`;
      x.beginPath(); x.ellipse(px,py,s,s*(.4+r()),r()*Math.PI,0,Math.PI*2); x.fill();
    }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=12; return t;
  }

  const textures={
    vanilla:makeTexture('#d7ad6e',801,'crumb'),
    vanillaBump:makeBump(802,'crumb'),
    chocolateCake:makeTexture('#56301f',803,'crumb'),
    chocolateCakeBump:makeBump(804,'crumb'),
    lemonCake:makeTexture('#dfbd58',807,'crumb'),
    redVelvetCake:makeTexture('#8f3038',809,'crumb'),
    marbleCake:makeTexture('#bd8b5d',811,'marble'),
    creamVanilla:makeTexture('#eee0c9',821,'cream'),
    creamStrawberry:makeTexture('#d77b88',823,'fruit'),
    creamChocolate:makeTexture('#5a3023',825,'chocolate'),
    creamLemon:makeTexture('#e8d174',827,'cream'),
    creamPistachio:makeTexture('#9caf76',829,'nut'),
    creamBump:makeBump(831,'cream'),
    finishVanilla:makeTexture('#ead8bd',841,'cream'),
    finishChocolate:makeTexture('#3b1d16',843,'chocolate'),
    finishStrawberry:makeTexture('#d97987',845,'fruit'),
    finishPistachio:makeTexture('#91a96e',847,'nut'),
    finishBump:makeBump(849,'cream')
  };

  const spongeStyles={
    vanilla:{map:textures.vanilla,bump:textures.vanillaBump,color:0xe2b978,crust:0xa56834,pore:0x79502c,seed:910},
    chocolate:{map:textures.chocolateCake,bump:textures.chocolateCakeBump,color:0x70432d,crust:0x3d2118,pore:0x24120d,seed:911},
    lemon:{map:textures.lemonCake,bump:textures.vanillaBump,color:0xefd66d,crust:0xb88432,pore:0x8b642c,seed:914},
    'red-velvet':{map:textures.redVelvetCake,bump:textures.vanillaBump,color:0xa13b43,crust:0x6f252c,pore:0x5a2027,seed:916},
    marble:{map:textures.marbleCake,bump:textures.vanillaBump,color:0xd0a06f,crust:0x8c542f,pore:0x67412a,seed:918}
  };

  const fillingStyles={
    buttercream:{map:textures.creamVanilla,color:0xf3e7d4,roughness:.56},
    strawberry:{map:textures.creamStrawberry,color:0xe68f9d,roughness:.5},
    chocolate:{map:textures.creamChocolate,color:0x633729,roughness:.46},
    lemon:{map:textures.creamLemon,color:0xead77d,roughness:.54},
    pistachio:{map:textures.creamPistachio,color:0xa7ba82,roughness:.53}
  };

  const finishStyles={
    vanilla:{map:textures.finishVanilla,color:0xf0dfc9,roughness:.5,clearcoat:.08},
    chocolate:{map:textures.finishChocolate,color:0x4a251c,roughness:.24,clearcoat:.34},
    strawberry:{map:textures.finishStrawberry,color:0xe58a9c,roughness:.4,clearcoat:.16},
    pistachio:{map:textures.finishPistachio,color:0xa8be86,roughness:.46,clearcoat:.12}
  };

  function organicCylinder(radius,height,seed,segments=160){
    const g=new THREE.CylinderGeometry(radius,radius*.992,height,segments,16,false);
    const p=g.attributes.position,r=rnd(seed),wob=[];
    for(let i=0;i<segments;i++) wob[i]=(r()-.5)*.045;
    for(let i=0;i<p.count;i++){
      let X=p.getX(i),Y=p.getY(i),Z=p.getZ(i),rr=Math.hypot(X,Z); if(rr<radius*.5) continue;
      const a=(Math.atan2(Z,X)+Math.PI*2)%(Math.PI*2),k=Math.floor(a/(Math.PI*2)*segments)%segments;
      const edge=wob[k]+Math.sin(Y*22+k*.47)*.008+(r()-.5)*.004;
      const nr=rr+edge; p.setX(i,X/rr*nr); p.setZ(i,Z/rr*nr);
    }
    p.needsUpdate=true; g.computeVertexNormals(); return g;
  }

  function makeSponge(type='vanilla'){
    const style=spongeStyles[type]||spongeStyles.vanilla,g=new THREE.Group(); g.userData.assetId=`sponge.${type}`;
    const mat=new THREE.MeshPhysicalMaterial({map:style.map,bumpMap:style.bump,bumpScale:.035,color:style.color,roughness:.91,metalness:0,sheen:.05,sheenRoughness:.9});
    const body=new THREE.Mesh(organicCylinder(1.65,.72,style.seed),mat); body.castShadow=body.receiveShadow=true; g.add(body);
    const rimMat=new THREE.MeshStandardMaterial({color:style.crust,roughness:.98});
    const topRim=new THREE.Mesh(new THREE.TorusGeometry(1.57,.045,10,160),rimMat); topRim.rotation.x=Math.PI/2; topRim.position.y=.335; g.add(topRim);
    const bottomRim=topRim.clone(); bottomRim.position.y=-.335; g.add(bottomRim);
    const r=rnd(style.seed+2),poreMat=new THREE.MeshStandardMaterial({color:style.pore,roughness:1});
    for(let i=0;i<280;i++){const a=r()*Math.PI*2,y=-.3+r()*.6,rad=1.648+(r()-.5)*.025;const sx=.014+r()*.032,sy=.012+r()*.025;const pore=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),poreMat);pore.scale.set(sx,sy,sx*.35);pore.position.set(Math.cos(a)*rad,y,Math.sin(a)*rad);pore.rotation.y=-a;g.add(pore);}
    for(let i=0;i<75;i++){const a=r()*Math.PI*2,d=.18+r()*1.32;const crumb=new THREE.Mesh(new THREE.SphereGeometry(.01+r()*.026,7,5),mat);crumb.scale.set(1.5,.65,1.1);crumb.position.set(Math.cos(a)*d,.37+(r()-.5)*.05,Math.sin(a)*d);g.add(crumb);}
    return g;
  }

  function makeFilling(type='buttercream'){
    const style=fillingStyles[type]||fillingStyles.buttercream,g=new THREE.Group(); g.userData.assetId=`cream.${type}`;
    const mat=new THREE.MeshPhysicalMaterial({map:style.map,bumpMap:textures.creamBump,bumpScale:.012,color:style.color,roughness:style.roughness,metalness:0,sheen:.28,sheenRoughness:.68,clearcoat:.035,clearcoatRoughness:.72});
    const body=new THREE.Mesh(organicCylinder(1.7,.34,950+Object.keys(fillingStyles).indexOf(type)),mat);body.castShadow=body.receiveShadow=true;g.add(body);
    const r=rnd(960+Object.keys(fillingStyles).indexOf(type));
    for(let i=0;i<52;i++){const a=i/52*Math.PI*2+(r()-.5)*.09;const blob=new THREE.Mesh(new THREE.SphereGeometry(.07+r()*.055,12,8),mat);blob.scale.set(1.35,.5,.82);blob.position.set(Math.cos(a)*1.69,(r()-.5)*.105,Math.sin(a)*1.69);g.add(blob);}
    return g;
  }

  function makeSurfaceSample(type='vanilla'){
    const style=finishStyles[type]||finishStyles.vanilla,g=new THREE.Group();g.userData.assetId=`finish.${type}`;
    const mat=new THREE.MeshPhysicalMaterial({map:style.map,bumpMap:textures.finishBump,bumpScale:.009,color:style.color,roughness:style.roughness,metalness:0,clearcoat:style.clearcoat,clearcoatRoughness:.28,sheen:.12});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat));return g;
  }

  function create(id){
    const spongeMatch=id.match(/^(?:dough|sponge)\.(vanilla|chocolate|lemon|red-velvet|marble)(?:\.v2)?$/);
    if(spongeMatch) return makeSponge(spongeMatch[1]);
    const fillingMatch=id.match(/^cream\.(buttercream|strawberry|chocolate|lemon|pistachio)(?:\.v2)?$/);
    if(fillingMatch) return makeFilling(fillingMatch[1]);
    const finishMatch=id.match(/^finish\.(vanilla|chocolate|strawberry|pistachio)(?:\.v2)?$/);
    if(finishMatch) return makeSurfaceSample(finishMatch[1]);
    throw new Error(`Unknown Pastelitos V2 asset: ${id}`);
  }

  window.PastelitosAssetsV2={version:'2.1.0-material-library',create,ids:[
    'sponge.vanilla','sponge.chocolate','sponge.lemon','sponge.red-velvet','sponge.marble',
    'cream.buttercream','cream.strawberry','cream.chocolate','cream.lemon','cream.pistachio',
    'finish.vanilla','finish.chocolate','finish.strawberry','finish.pistachio'
  ]};

  function mountFullscreenButton(){
    const viewer=document.querySelector('.cake-viewer');
    if(!viewer || viewer.querySelector('.cake-fullscreen-open-button')) return;
    const style=document.createElement('style');
    style.textContent=`.cake-fullscreen-open-button{position:absolute;top:12px;left:12px;z-index:35;width:44px;height:44px;border:1px solid rgba(42,33,29,.14);border-radius:50%;background:rgba(255,253,249,.9);color:#2a211d;display:grid;place-items:center;box-shadow:0 8px 24px rgba(42,33,29,.11);backdrop-filter:blur(12px);font-size:1.18rem;line-height:1;cursor:pointer}.cake-fullscreen-open-button:hover{background:#fff;color:#b8515f}.cake-viewer .viewer-topline{top:64px}.visual-stage.is-cake-fullscreen .cake-fullscreen-open-button{display:none!important}@media(max-width:720px){.cake-fullscreen-open-button{top:10px;left:10px;width:42px;height:42px}.cake-viewer .viewer-topline{top:60px}}`;
    document.head.appendChild(style);
    const button=document.createElement('button');button.type='button';button.className='cake-fullscreen-open-button';button.setAttribute('aria-label','Torte im Vollbild anzeigen');button.setAttribute('title','Vollbild');button.innerHTML='&#x26F6;';button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.Cake3D?.setFullscreen?.(true);});viewer.appendChild(button);
  }

  requestAnimationFrame(mountFullscreenButton);

  const summaryFallback=document.createElement('script');summaryFallback.src='final-summary-fallback.js?v=20260831-0205';summaryFallback.async=true;document.head.appendChild(summaryFallback);
  const promptPreview=document.createElement('script');promptPreview.src='prompt-preview.js?v=20260831-0148';promptPreview.async=true;document.head.appendChild(promptPreview);
})();
