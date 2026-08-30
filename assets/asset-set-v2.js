(() => {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) return;

  function rnd(seed){ let s=seed>>>0; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296); }

  function makeTexture(base, seed, mode, size=1024){
    const c=document.createElement('canvas'); c.width=c.height=size;
    const x=c.getContext('2d'); const r=rnd(seed);
    x.fillStyle=base; x.fillRect(0,0,size,size);
    const count=mode==='crumb'?7600:mode==='chocolate'?5200:2600;
    for(let i=0;i<count;i++){
      const px=r()*size,py=r()*size;
      if(mode==='crumb'){
        const s=.7+r()*5.5;
        x.fillStyle=r()>.48?`rgba(255,232,183,${.025+r()*.12})`:`rgba(72,42,22,${.025+r()*.13})`;
        x.beginPath(); x.ellipse(px,py,s,s*(.35+r()*.9),r()*Math.PI,0,Math.PI*2); x.fill();
      } else if(mode==='chocolate'){
        const s=.5+r()*3.2;
        x.fillStyle=r()>.56?`rgba(255,190,138,${.015+r()*.055})`:`rgba(45,14,8,${.02+r()*.09})`;
        x.beginPath(); x.ellipse(px,py,s,s*(.4+r()*.8),r()*Math.PI,0,Math.PI*2); x.fill();
      } else {
        const s=.5+r()*2.5;
        x.fillStyle=`rgba(255,255,255,${.01+r()*.05})`;
        x.beginPath(); x.arc(px,py,s,0,Math.PI*2); x.fill();
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
    const count=mode==='crumb'?5200:3600;
    for(let i=0;i<count;i++){
      const px=r()*size,py=r()*size,s=1+r()*(mode==='crumb'?7:4);
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
    glaze:makeTexture('#3b1d16',805,'chocolate'),
    glazeBump:makeBump(806,'chocolate')
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
    const choc=type==='chocolate',g=new THREE.Group(); g.userData.assetId=`dough.${type}.v2`;
    const map=choc?textures.chocolateCake:textures.vanilla,bump=choc?textures.chocolateCakeBump:textures.vanillaBump;
    const mat=new THREE.MeshPhysicalMaterial({map,bumpMap:bump,bumpScale:.035,color:choc?0x70432d:0xe2b978,roughness:.91,metalness:0,sheen:.05,sheenRoughness:.9});
    const body=new THREE.Mesh(organicCylinder(1.65,.72,choc?911:910),mat); body.castShadow=body.receiveShadow=true; g.add(body);

    const rimMat=new THREE.MeshStandardMaterial({color:choc?0x3d2118:0xa56834,roughness:.98});
    const topRim=new THREE.Mesh(new THREE.TorusGeometry(1.57,.045,10,160),rimMat); topRim.rotation.x=Math.PI/2; topRim.position.y=.335; g.add(topRim);
    const bottomRim=topRim.clone(); bottomRim.position.y=-.335; g.add(bottomRim);

    const r=rnd(choc?913:912),poreMat=new THREE.MeshStandardMaterial({color:choc?0x24120d:0x79502c,roughness:1});
    for(let i=0;i<280;i++){
      const a=r()*Math.PI*2,y=-.3+r()*.6,rad=1.648+(r()-.5)*.025;
      const sx=.014+r()*.032,sy=.012+r()*.025;
      const pore=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),poreMat);
      pore.scale.set(sx,sy,sx*.35); pore.position.set(Math.cos(a)*rad,y,Math.sin(a)*rad); pore.rotation.y=-a; g.add(pore);
    }
    for(let i=0;i<75;i++){
      const a=r()*Math.PI*2,d=.18+r()*1.32;
      const crumb=new THREE.Mesh(new THREE.SphereGeometry(.01+r()*.026,7,5),mat);
      crumb.scale.set(1.5,.65,1.1); crumb.position.set(Math.cos(a)*d,.37+(r()-.5)*.05,Math.sin(a)*d); g.add(crumb);
    }
    return g;
  }

  function makeChocolateGlaze(){
    const g=new THREE.Group(); g.userData.assetId='finish.chocolate.v2';
    const mat=new THREE.MeshPhysicalMaterial({map:textures.glaze,bumpMap:textures.glazeBump,bumpScale:.012,color:0x4a251c,roughness:.24,metalness:0,clearcoat:.34,clearcoatRoughness:.18,sheen:.05});
    const shell=new THREE.Mesh(new THREE.CylinderGeometry(1.72,1.71,1,144,12,true),mat); shell.position.y=.5; shell.castShadow=shell.receiveShadow=true; g.add(shell);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(1.725,1.72,.09,144,4,false),mat); top.position.y=1.015; top.castShadow=true; g.add(top);
    const r=rnd(1001);
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2+(r()-.5)*.14;
      const len=.08+r()*.24,w=.045+r()*.035;
      const drip=new THREE.Mesh(new THREE.CapsuleGeometry(w,len,5,10),mat);
      drip.position.set(Math.cos(a)*1.715,.95-len*.42,Math.sin(a)*1.715); drip.rotation.z=Math.PI/2; drip.rotation.y=-a; drip.scale.z=.6; g.add(drip);
    }
    return g;
  }

  function create(id){
    if(id==='dough.vanilla.v2') return makeSponge('vanilla');
    if(id==='dough.chocolate.v2') return makeSponge('chocolate');
    if(id==='finish.chocolate.v2') return makeChocolateGlaze();
    throw new Error(`Unknown Pastelitos V2 asset: ${id}`);
  }

  window.PastelitosAssetsV2={version:'2.0.0-prototype',create,ids:['dough.vanilla.v2','dough.chocolate.v2','finish.chocolate.v2']};

  function mountFullscreenButton(){
    const viewer=document.querySelector('.cake-viewer');
    if(!viewer || viewer.querySelector('.cake-fullscreen-open-button')) return;
    const style=document.createElement('style');
    style.textContent=`
      .cake-fullscreen-open-button{position:absolute;top:12px;left:12px;z-index:35;width:44px;height:44px;border:1px solid rgba(42,33,29,.14);border-radius:50%;background:rgba(255,253,249,.9);color:#2a211d;display:grid;place-items:center;box-shadow:0 8px 24px rgba(42,33,29,.11);backdrop-filter:blur(12px);font-size:1.18rem;line-height:1;cursor:pointer}
      .cake-fullscreen-open-button:hover{background:#fff;color:#b8515f}
      .cake-viewer .viewer-topline{top:64px}
      .visual-stage.is-cake-fullscreen .cake-fullscreen-open-button{display:none!important}
      @media(max-width:720px){.cake-fullscreen-open-button{top:10px;left:10px;width:42px;height:42px}.cake-viewer .viewer-topline{top:60px}}
    `;
    document.head.appendChild(style);
    const button=document.createElement('button');
    button.type='button';
    button.className='cake-fullscreen-open-button';
    button.setAttribute('aria-label','Torte im Vollbild anzeigen');
    button.setAttribute('title','Vollbild');
    button.innerHTML='&#x26F6;';
    button.addEventListener('pointerdown',e=>e.stopPropagation());
    button.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      window.Cake3D?.setFullscreen?.(true);
    });
    viewer.appendChild(button);
  }

  requestAnimationFrame(mountFullscreenButton);

  const summaryFallback=document.createElement('script');
  summaryFallback.src='final-summary-fallback.js?v=20260830-2328';
  summaryFallback.async=true;
  document.head.appendChild(summaryFallback);
})();
