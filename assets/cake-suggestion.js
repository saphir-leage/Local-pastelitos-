(() => {
  'use strict';

  function setValue(el, value) {
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applyRecommendation() {
    const medium = document.querySelector('input[name="config-size"][value="Mittel"]');
    if (medium) {
      medium.checked = true;
      medium.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const addLayer = document.getElementById('addLayer');
    const count = document.getElementById('layerCount');
    if (addLayer && count) {
      while (Number(count.textContent) < 3) addLayer.click();
    }

    document.querySelectorAll('[data-layer]').forEach(el => setValue(el, 'Vanille'));
    document.querySelectorAll('[data-filling]').forEach(el => setValue(el, 'Erdbeere'));
    setValue(document.getElementById('glaze'), 'Vanille');

    document.querySelectorAll('input[name="config-decoration"]').forEach(el => {
      el.checked = el.value === 'Frische Beeren';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function mount() {
    const intro = document.querySelector('.intro');
    if (!intro || document.querySelector('.cake-recommendation')) return;

    const style = document.createElement('style');
    style.textContent = `
      .cake-recommendation{margin:0 0 34px;padding:22px 24px;border-top:1px solid rgba(32,25,22,.18);border-bottom:1px solid rgba(32,25,22,.18);display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;background:rgba(252,249,244,.55)}
      .cake-recommendation__eyebrow{margin:0 0 7px;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#8a7e76}
      .cake-recommendation h2{margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:clamp(1.45rem,3vw,2.15rem);font-weight:400;line-height:1.08}
      .cake-recommendation p{margin:0;color:#655b55;font-size:.92rem;line-height:1.55}
      .cake-recommendation button{border:1px solid #201916;background:#201916;color:#fff;padding:12px 18px;border-radius:0;font:600 .8rem/1.2 Arial,sans-serif;letter-spacing:.04em;cursor:pointer;white-space:nowrap}
      .cake-recommendation button:hover{background:#7b2f3a;border-color:#7b2f3a}
      @media(max-width:720px){.cake-recommendation{grid-template-columns:1fr}.cake-recommendation button{width:100%}}
    `;
    document.head.appendChild(style);

    const card = document.createElement('section');
    card.className = 'cake-recommendation';
    card.setAttribute('aria-label', 'Pastelitos Empfehlung');
    card.innerHTML = `
      <div>
        <p class="cake-recommendation__eyebrow">Unsere Empfehlung zum Start</p>
        <h2>Vanille · Erdbeere · frische Beeren</h2>
        <p>Drei Vanilleböden, zwei Erdbeercremes, Vanille-Finish und frische Erdbeeren. Ein ausgewogener Ausgangspunkt, den du danach frei verändern kannst.</p>
      </div>
      <button type="button" id="applyCakeRecommendation">Vorschlag übernehmen</button>
    `;
    intro.insertAdjacentElement('afterend', card);
    document.getElementById('applyCakeRecommendation')?.addEventListener('click', applyRecommendation);

    setTimeout(applyRecommendation, 180);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
