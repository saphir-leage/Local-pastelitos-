(() => {
  'use strict';
  function init(){
    const form=document.getElementById('orderForm');
    if(!form||form.dataset.robustSubmit==='1') return;
    form.dataset.robustSubmit='1';
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      const error=document.getElementById('formError');
      const success=document.getElementById('formSuccess');
      const button=document.getElementById('submitBtn');
      if(error) error.style.display='none';
      if(success) success.style.display='none';
      if(!form.checkValidity()){form.reportValidity();return;}
      if(typeof window.update==='function') window.update();
      if(button){button.disabled=true;button.textContent='Wird gesendet …';}
      try{
        const data=new FormData(form);
        const response=await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'}});
        let payload=null;
        try{payload=await response.json();}catch(_e){}
        if(!response.ok){
          const detail=payload?.errors?.map(x=>x.message||x.field).filter(Boolean).join(' · ')||payload?.error||'';
          throw new Error(detail||`Anfrage konnte nicht gesendet werden (HTTP ${response.status}).`);
        }
        if(success){success.textContent='Danke! Deine Konfiguration wurde erfolgreich gesendet.';success.style.display='block';}
      }catch(err){
        if(error){error.textContent=`Senden fehlgeschlagen: ${err?.message||'Unbekannter Fehler'}`;error.style.display='block';}
      }finally{
        if(button){button.disabled=false;button.textContent='Konfiguration senden';}
      }
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
