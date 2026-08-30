(() => {
  'use strict';

  function currentConfiguration(){
    if (typeof getConfig === 'function') {
      const c=getConfig();
      return {
        size:c.size||'',
        shape:c.shape||'rund',
        layers:[...(c.layers||[])],
        fillings:[...(c.fillings||[])],
        finish:c.glaze||'',
        decorations:[...(c.decorations||[])],
        spongeThicknessCm:3,
        creamThicknessCm:1,
        exteriorFinishThicknessMm:3
      };
    }
    return {shape:'rund',layers:[],fillings:[],finish:'',decorations:[],spongeThicknessCm:3,creamThicknessCm:1,exteriorFinishThicknessMm:3};
  }

  async function generatePhoto(){
    const button=document.getElementById('generateCakePhoto');
    const status=document.getElementById('aiPhotoStatus');
    const image=document.getElementById('aiCakePhoto');
    const placeholder=document.getElementById('aiPhotoPlaceholder');
    if(!button||!status||!image||!placeholder) return;
    button.disabled=true;button.textContent='Bild wird erstellt …';status.textContent='Das kann einen Moment dauern.';
    try{
      const response=await fetch('/api/generate-cake-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({configuration:currentConfiguration()})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.image) throw new Error(data.error||`Serverfehler ${response.status}`);
      image.src=data.image;image.hidden=false;placeholder.hidden=true;status.textContent='Vorschau erstellt.';button.textContent='Bild neu generieren';
    }catch(error){status.textContent=`Bild konnte nicht erstellt werden: ${error.message}`;button.textContent='Erneut versuchen';}
    finally{button.disabled=false;}
  }

  function mount(){
    const generate=document.getElementById('generateCakePhoto');
    if(!generate) return false;
    if(generate.dataset.exactCakeConfig!=='true'){
      generate.onclick=generatePhoto;
      generate.dataset.exactCakeConfig='true';
    }
    if(document.getElementById('showCakePrompt')) return true;

    const button=document.createElement('button');
    button.type='button';button.id='showCakePrompt';button.textContent='Prompt anzeigen (kostenlos)';button.style.marginLeft='8px';button.style.background='var(--pt-ink)';
    const panel=document.createElement('div');
    panel.id='cakePromptPreview';panel.hidden=true;panel.style.cssText='margin-top:14px;border:1px solid var(--pt-line);border-radius:12px;background:var(--pt-soft);padding:14px;';
    panel.innerHTML='<small style="display:block;margin-bottom:8px">Testansicht · erzeugt kein KI-Bild und verursacht keine Bildgenerierungskosten</small><pre id="cakePromptText" style="white-space:pre-wrap;word-break:break-word;margin:0;font:500 .72rem/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--pt-ink)"></pre>';
    generate.insertAdjacentElement('afterend',button);generate.closest('.ambience-copy')?.appendChild(panel);

    button.addEventListener('click',async()=>{
      button.disabled=true;const old=button.textContent;button.textContent='Prompt wird erstellt …';
      try{
        const response=await fetch('/api/generate-cake-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({configuration:currentConfiguration(),previewOnly:true})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.prompt) throw new Error(data.error||`Serverfehler ${response.status}`);
        document.getElementById('cakePromptText').textContent=data.prompt;panel.hidden=false;button.textContent='Prompt aktualisieren';
      }catch(error){document.getElementById('cakePromptText').textContent=`Prompt konnte nicht geladen werden: ${error.message}`;panel.hidden=false;button.textContent=old;}
      finally{button.disabled=false;}
    });
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{tries++;if(mount()||tries>80) clearInterval(timer);},100);
})();
