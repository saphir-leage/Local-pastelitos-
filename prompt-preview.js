(() => {
  'use strict';

  function listText(selector){
    return [...document.querySelectorAll(selector)].map(el=>el.textContent.trim()).filter(Boolean);
  }

  function currentConfiguration(){
    const detail=[...document.querySelectorAll('#configDetail li')].map(el=>el.textContent.trim());
    return {
      size:document.getElementById('summarySize')?.textContent?.trim()||'',
      layers:detail[0]?[detail[0]]:[],
      fillings:detail[1]?[detail[1]]:[],
      finish:detail[2]||'',
      decorations:detail[3]?[detail[3]]:[],
      description:`Zutaten: ${listText('#ingredientList li').join('; ')}. Zubereitung: ${listText('#prepList li').join(' ')}`
    };
  }

  function mount(){
    const generate=document.getElementById('generateCakePhoto');
    if(!generate || document.getElementById('showCakePrompt')) return false;

    const button=document.createElement('button');
    button.type='button';
    button.id='showCakePrompt';
    button.textContent='Prompt anzeigen (kostenlos)';
    button.style.marginLeft='8px';
    button.style.background='var(--pt-ink)';

    const panel=document.createElement('div');
    panel.id='cakePromptPreview';
    panel.hidden=true;
    panel.style.cssText='margin-top:14px;border:1px solid var(--pt-line);border-radius:12px;background:var(--pt-soft);padding:14px;';
    panel.innerHTML='<small style="display:block;margin-bottom:8px">Testansicht · erzeugt kein KI-Bild und verursacht keine Bildgenerierungskosten</small><pre id="cakePromptText" style="white-space:pre-wrap;word-break:break-word;margin:0;font:500 .72rem/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--pt-ink)"></pre>';

    generate.insertAdjacentElement('afterend',button);
    generate.closest('.ambience-copy')?.appendChild(panel);

    button.addEventListener('click',async()=>{
      button.disabled=true;
      const old=button.textContent;
      button.textContent='Prompt wird erstellt …';
      try{
        const response=await fetch('/api/generate-cake-image',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({configuration:currentConfiguration(),imageSize:'1024x1024',previewOnly:true})
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.prompt) throw new Error(data.error||`Serverfehler ${response.status}`);
        document.getElementById('cakePromptText').textContent=data.prompt;
        panel.hidden=false;
        button.textContent='Prompt aktualisieren';
      }catch(error){
        document.getElementById('cakePromptText').textContent=`Prompt konnte nicht geladen werden: ${error.message}`;
        panel.hidden=false;
        button.textContent=old;
      }finally{button.disabled=false;}
    });
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(mount()||tries>80) clearInterval(timer);
  },100);
})();
