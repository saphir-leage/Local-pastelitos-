(() => {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) return;

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  function rnd(seed){ let s=seed>>>0; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296); }
  function colorTexture(base, seed, kind){
    const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
    x.fillStyle=base; x.fillRect(0,0,512,512); const r=rnd(seed);
    const n=kind==='cream'?900:kind==='berry'?2300:3200;
    for(let i=0;i<n;i++){
      const px=r()*512, py=r()*512, s=.4+r()*(kind==='crumb'?3.6:2.2);
      let col;
      if(kind==='berry') col=r()>.72?`rgba(255,174,126,${.03+r()*.11})`:`rgba(92,0,13,${.02+r()*.12})`;
      else if(kind==='cream') col=r()>.5?`rgba(255,255,245,${.02+r()*.06})`:`rgba(151,116,75,${.01+r()*.035})`;
      else col=r()>.48?`rgba(255,226,168,${.025+r()*.10})`:`rgba(67,37,17,${.02+r()*.11})`;
      x.fillStyle=col; x.beginPath(); x.ellipse(px,py,s,s*(.45+r()),r()*Math.PI,0,Math.PI*2); x.fill();
    }
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
  }
  const tex={
    vanilla:colorTexture('#d5a55f',21,'crumb'),
    chocolate:colorTexture('#5f3421',22,'crumb'),
    cream:colorTexture('#efe2ce',23,'cream'),
    strawberry:colorTexture('#c92f38',24,'berry')
  };

  function organicCylinder(radius,height,seed,segments=128){
    const g=new THREE.CylinderGeometry(radius,radius*.995,height,segments,12,false); const p=g.attributes.position; const r=rnd(seed);
    const wob=[]; for(let i=0;i<segments;i++) wob[i]=(r()-.5)*.05;
    for(let i=0;i<p.count;i++){
      let X=p.getX(i),Y=p.getY(i),Z=p.getZ(i), rr=Math.hypot(X,Z); if(rr<radius*.55) continue;
      const a=(Math.atan2(Z,X)+Math.PI*2)%(Math.PI*2); const k=Math.floor(a/(Math.PI*2)*segments)%segments;
      const edge=wob[k]+Math.sin(Y*18+k*.61)*.008+(r()-.5)*.003;
      const nr=rr+edge; p.setX(i,X/rr*nr); p.setZ(i,Z/rr*nr);
    }
    p.needsUpdate=true; g.computeVertexNormals(); return g;
  }
  function shadow(o){o.castShadow=o.receiveShadow=true; return o;}

  function makeSponge(type='vanilla'){
    const isChoc=type==='chocolate'; const group=new THREE.Group(); group.userData.assetId=`dough.${type}`;
    const mat=new THREE.MeshPhysicalMaterial({map:isChoc?tex.chocolate:tex.vanilla,color:isChoc?0x69402a:0xe0b46f,roughness:.88,metalness:0,sheen:.08,sheenRoughness:.8});
    const body=shadow(new THREE.Mesh(organicCylinder(1.65,.72,isChoc?202:201),mat)); group.add(body);
    const crustMat=new THREE.MeshStandardMaterial({color:isChoc?0x3d2118:0xa96b35,roughness:.96});
    const crust=new THREE.Mesh(new THREE.TorusGeometry(1.57,.035,8,128),crustMat); crust.rotation.x=Math.PI/2; crust.position.y=.34; group.add(crust);
    const poreMat=new THREE.MeshStandardMaterial({color:isChoc?0x2b1711:0x8d5f35,roughness:1}); const pr=rnd(isChoc?302:301); const pg=new THREE.SphereGeometry(.018,7,6);
    for(let i=0;i<180;i++){ const a=pr()*Math.PI*2,y=-.29+pr()*.58,s=.45+pr()*1.9; const m=new THREE.Mesh(pg,poreMat); m.scale.set(s*1.35,s,s*.55); m.position.set(Math.cos(a)*1.655,y,Math.sin(a)*1.655); group.add(m); }
    for(let i=0;i<55;i++){ const a=pr()*Math.PI*2,d=.3+pr()*1.25; const crumb=new THREE.Mesh(new THREE.SphereGeometry(.012+pr()*.018,6,5),mat); crumb.scale.set(1.5,.8,1); crumb.position.set(Math.cos(a)*d,.37+(pr()-.5)*.035,Math.sin(a)*d); group.add(crumb); }
    return group;
  }

  function makeVanillaFilling(){
    const g=new THREE.Group(); g.userData.assetId='filling.vanilla';
    const mat=new THREE.MeshPhysicalMaterial({map:tex.cream,color:0xf3e7d4,roughness:.56,metalness:0,sheen:.3,sheenColor:new THREE.Color(0xfff6e9),sheenRoughness:.65,clearcoat:.025,clearcoatRoughness:.7});
    const body=shadow(new THREE.Mesh(organicCylinder(1.7,.34,420),mat)); g.add(body); const r=rnd(421);
    for(let i=0;i<46;i++){ const a=i/46*Math.PI*2+(r()-.5)*.08; const blob=new THREE.Mesh(new THREE.SphereGeometry(.075+r()*.055,12,8),mat); blob.scale.set(1.3,.52,.8); blob.position.set(Math.cos(a)*1.69,(r()-.5)*.10,Math.sin(a)*1.69); g.add(blob); }
    for(let i=0;i<22;i++){ const a=r()*Math.PI*2, rad=.25+r()*1.2; const ridge=new THREE.Mesh(new THREE.TorusGeometry(.12+r()*.22,.014+r()*.012,6,24,Math.PI*(.7+r()*.8)),mat); ridge.rotation.set(Math.PI/2,(r()-.5)*.4,a); ridge.position.set(Math.cos(a)*rad,.175+(r()-.5)*.018,Math.sin(a)*rad); g.add(ridge); }
    return g;
  }

  function makeStrawberry(){
    const g=new THREE.Group(); g.userData.assetId='fruit.strawberry';
    const pts=[]; for(let i=0;i<=36;i++){ const t=i/36, y=-.58+t*1.16; const bell=Math.sin(Math.PI*t); const taper=.35+.65*(1-t*.62); const rr=.09+bell*.43*taper; pts.push(new THREE.Vector2(rr,y)); }
    const bodyMat=new THREE.MeshPhysicalMaterial({map:tex.strawberry,color:0xd9363e,roughness:.36,clearcoat:.11,clearcoatRoughness:.23,sheen:.12,metalness:0});
    const body=shadow(new THREE.Mesh(new THREE.LatheGeometry(pts,128),bodyMat)); body.scale.set(1,.98,.94); g.add(body);
    const seedMat=new THREE.MeshPhysicalMaterial({color:0xf6d58b,roughness:.47,clearcoat:.04}); const r=rnd(511);
    for(let row=0;row<11;row++){
      const t=.14+row/12*.72, y=-.58+t*1.16; const bell=Math.sin(Math.PI*t); const rad=.09+bell*.43*(.35+.65*(1-t*.62)); const count=8+Math.round(bell*6);
      for(let j=0;j<count;j++){ const a=(j/count)*Math.PI*2+(row%2)*.19+(r()-.5)*.10; const s=new THREE.Mesh(new THREE.SphereGeometry(.018,7,6),seedMat); s.scale.set(.62,1.45,.38); s.position.set(Math.cos(a)*(rad+.012),y+(r()-.5)*.025,Math.sin(a)*(rad+.012)); s.rotation.z=a; g.add(s); }
    }
    const leafMat=new THREE.MeshPhysicalMaterial({color:0x4d7f39,roughness:.63,sheen:.12});
    for(let i=0;i<7;i++){ const shape=new THREE.Shape(); shape.moveTo(0,0); shape.quadraticCurveTo(.12,.15,.06,.42); shape.quadraticCurveTo(0,.50,-.06,.42); shape.quadraticCurveTo(-.12,.15,0,0); const geo=new THREE.ShapeGeometry(shape,12); const leaf=new THREE.Mesh(geo,leafMat); leaf.rotation.set(-Math.PI/2+.20,(i/7)*Math.PI*2,.25*(i%2?-1:1)); leaf.position.y=.56; leaf.scale.set(.85,.85,.85); g.add(leaf); }
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.18,12),leafMat); stem.position.y=.66; stem.rotation.z=.18; g.add(stem);
    return g;
  }

  function create(id){
    if(id==='fruit.strawberry') return makeStrawberry();
    if(id==='filling.vanilla') return makeVanillaFilling();
    if(id==='dough.vanilla') return makeSponge('vanilla');
    if(id==='dough.chocolate') return makeSponge('chocolate');
    throw new Error(`Unknown Pastelitos asset: ${id}`);
  }

  window.PastelitosAssetsV1={version:'1.0.0-prototype',create,ids:['fruit.strawberry','filling.vanilla','dough.vanilla','dough.chocolate']};
})();
