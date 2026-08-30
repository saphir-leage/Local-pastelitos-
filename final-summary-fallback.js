(() => {
  'use strict';

  function initFinalSummaryFallback(){
    const nav=document.querySelector('.step-nav');
    const editor=document.querySelector('.editor-card');
    const actions=document.querySelector('.editor-actions');
    if(!nav||!editor||!actions||document.querySelector('[data-pane="4"]')) return;

    nav.classList.add('has-summary-step');
    const navButton=document.createElement('button');
    navButton.type='button';
    navButton.dataset.step='4';
    navButton.innerHTML='<b>05</b><span>Ergebnis</span><small>Zusammenfassung</small>';
    nav.appendChild(navButton);

    const pane=document.createElement('div');
    pane.className='step-pane';
    pane.dataset.pane='4';
    pane.innerHTML='<p class="step-kicker">05 · Ergebnis</p><h2>Deine Torte auf einen Blick.</h2><p class="step-copy">Prüfe deine Auswahl. Zutaten und Zubereitung kannst du bei Bedarf aufklappen.</p><div class="final-summary"><div><div class="final-summary-overview"><div class="final-summary-item"><small>Größe</small><strong id="finalSummarySize">–</strong></div><div class="final-summary-item"><small>Aufbau</small><strong id="finalSummaryLayers">–</strong></div><div class="final-summary-item"><small>Cremes</small><strong id="finalSummaryFillings">–</strong></div><div class="final-summary-item"><small>Finish & Deko</small><strong id="finalSummaryFinish">–</strong></div></div><div class="final-details"><details><summary>Zutaten anzeigen</summary><ul id="finalIngredientList"></ul></details><details><summary>Zubereitung anzeigen</summary><ol id="finalPrepList"></ol></details></div></div><div class="final-summary-price"><small>Richtwert</small><output id="finalSummaryPrice">–</output><button type="button" id="finalRequestButton">Torte anfragen</button></div></div>';
    editor.insertBefore(pane,actions);

    const style=document.createElement('style');
    style.textContent='.step-nav.has-summary-step{grid-template-columns:repeat(5,1fr)}.final-summary{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:26px;align-items:start}.final-summary-overview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:20px 0}.final-summary-item{border:1px solid var(--pt-line);border-radius:12px;padding:14px;background:#fff}.final-summary-item small{display:block;color:var(--pt-muted);font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}.final-summary-item strong{font-size:.82rem;line-height:1.35}.final-summary-price{border:1px solid var(--pt-line);border-radius:16px;padding:18px;background:var(--pt-soft)}.final-summary-price small{display:block;color:var(--pt-muted);font-size:.66rem;text-transform:uppercase;letter-spacing:.08em}.final-summary-price output{display:block;font:500 2.35rem/1 Georgia,serif;color:var(--pt-accent);margin:7px 0 14px}.final-summary-price button{width:100%;border:0;border-radius:999px;background:var(--pt-accent);color:#fff;padding:13px 16px;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.final-details{margin-top:12px;border-top:1px solid var(--pt-line);padding:14px 0 0}.final-details details{border:1px solid var(--pt-line);border-radius:12px;background:#fff;margin:8px 0;padding:13px 15px}.final-details summary{cursor:pointer;font-weight:800;font-size:.77rem}.final-details ul,.final-details ol{margin:12px 0 0;padding-left:20px;color:var(--pt-muted);font-size:.74rem;line-height:1.55}@media(max-width:760px){.step-nav.has-summary-step button{padding:9px 3px}.step-nav.has-summary-step span{font-size:.54rem}.final-summary{grid-template-columns:1fr}.final-summary-overview{grid-template-columns:1fr}.final-summary-price{order:-1}}';
    document.head.appendChild(style);

    function render(){
      if(typeof update==='function') update();
      const detail=document.querySelectorAll('#configDetail li');
      finalSummarySize.textContent=summarySize?.textContent||'–';
      finalSummaryLayers.textContent=detail[0]?.textContent||'–';
      finalSummaryFillings.textContent=detail[1]?.textContent||'–';
      finalSummaryFinish.textContent=[detail[2]?.textContent,detail[3]?.textContent].filter(Boolean).join(' · ')||'–';
      finalSummaryPrice.textContent=configPrice?.textContent||'–';
      finalIngredientList.innerHTML=ingredientList?.innerHTML||'';
      finalPrepList.innerHTML=prepList?.innerHTML||'';
    }

    setStep=function(n){
      activeStep=Math.max(0,Math.min(4,n));
      document.querySelectorAll('[data-pane]').forEach(e=>e.classList.toggle('is-active',+e.dataset.pane===activeStep));
      document.querySelectorAll('[data-step]').forEach(e=>{e.classList.toggle('is-active',+e.dataset.step===activeStep);e.classList.toggle('is-done',+e.dataset.step<activeStep)});
      prevStep.disabled=activeStep===0;
      nextStep.textContent=activeStep===4?'Torte anfragen':'Weiter';
      if(activeStep===4) render();
    };
    document.querySelectorAll('[data-step]').forEach(e=>e.onclick=()=>setStep(+e.dataset.step));
    prevStep.onclick=()=>setStep(activeStep-1);
    nextStep.onclick=()=>activeStep===4?openRequest():setStep(activeStep+1);
    finalRequestButton.onclick=openRequest;
    setStep(activeStep);
  }

  if(document.readyState==='complete') initFinalSummaryFallback();
  else window.addEventListener('load',initFinalSummaryFallback,{once:true});
})();
