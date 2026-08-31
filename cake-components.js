(function () {
  'use strict';

  var components = {
    sizes: {
      Klein: { label: 'Klein (ca. 8 Personen)', scale: 0.93, multiplier: 0.82 },
      Mittel: { label: 'Mittel (ca. 12 Personen)', scale: 1.05, multiplier: 1.15 },
      Groß: { label: 'Groß (ca. 18 Personen)', scale: 1.16, multiplier: 1.55 }
    },
    doughs: {
      Vanille: { type: 'cake-layer', price: 0, ingredients: [
        { name: 'Mehl', amount: 95, unit: 'g' }, { name: 'Zucker', amount: 78, unit: 'g' },
        { name: 'Butter', amount: 66, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
        { name: 'Milch', amount: 48, unit: 'ml' }, { name: 'Vanille', amount: 2, unit: 'g' }
      ]},
      Schokolade: { type: 'cake-layer', price: 2, ingredients: [
        { name: 'Mehl', amount: 82, unit: 'g' }, { name: 'Zucker', amount: 82, unit: 'g' },
        { name: 'Butter', amount: 64, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
        { name: 'Milch', amount: 52, unit: 'ml' }, { name: 'Kakao', amount: 18, unit: 'g' }
      ]},
      Zitrone: { type: 'cake-layer', price: 2, ingredients: [
        { name: 'Mehl', amount: 94, unit: 'g' }, { name: 'Zucker', amount: 80, unit: 'g' },
        { name: 'Butter', amount: 66, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
        { name: 'Zitrone', amount: 0.35, unit: 'Stk.' }, { name: 'Milch', amount: 42, unit: 'ml' }
      ]},
      'Red Velvet': { type: 'cake-layer', price: 3, ingredients: [
        { name: 'Mehl', amount: 88, unit: 'g' }, { name: 'Zucker', amount: 84, unit: 'g' },
        { name: 'Butter', amount: 60, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
        { name: 'Buttermilch', amount: 52, unit: 'ml' }, { name: 'Kakao', amount: 8, unit: 'g' }
      ]},
      Marmor: { type: 'cake-layer', price: 2, ingredients: [
        { name: 'Mehl', amount: 92, unit: 'g' }, { name: 'Zucker', amount: 80, unit: 'g' },
        { name: 'Butter', amount: 66, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
        { name: 'Milch', amount: 48, unit: 'ml' }, { name: 'Kakao', amount: 9, unit: 'g' }
      ]},
      Nuss: {
        type: 'cake-layer',
        assetId: 'sponge.hazelnut',
        price: 0,
        ingredients: []
      }
    },
    fillings: {
      Buttercreme: { type: 'filling', price: 0, ingredients: [{ name: 'Butter', amount: 55, unit: 'g' }, { name: 'Puderzucker', amount: 42, unit: 'g' }, { name: 'Milch', amount: 8, unit: 'ml' }] },
      Erdbeere: { type: 'filling', price: 3, ingredients: [{ name: 'Erdbeeren', amount: 75, unit: 'g' }, { name: 'Mascarpone', amount: 52, unit: 'g' }, { name: 'Sahne', amount: 38, unit: 'ml' }, { name: 'Zucker', amount: 12, unit: 'g' }] },
      Schokolade: { type: 'filling', price: 3, ingredients: [{ name: 'Schokolade', amount: 48, unit: 'g' }, { name: 'Sahne', amount: 46, unit: 'ml' }] },
      Zitrone: { type: 'filling', price: 2, ingredients: [{ name: 'Mascarpone', amount: 50, unit: 'g' }, { name: 'Sahne', amount: 38, unit: 'ml' }, { name: 'Zitrone', amount: 0.3, unit: 'Stk.' }] },
      Pistazie: { type: 'filling', price: 4, ingredients: [{ name: 'Mascarpone', amount: 48, unit: 'g' }, { name: 'Sahne', amount: 35, unit: 'ml' }, { name: 'Pistazien', amount: 24, unit: 'g' }] }
    },
    glazes: {
      Keine: { type: 'finish', price: 0, ingredients: [] },
      Vanille: { type: 'finish', price: 5, ingredients: [{ name: 'Butter', amount: 95, unit: 'g' }, { name: 'Puderzucker', amount: 75, unit: 'g' }, { name: 'Frischkäse', amount: 62, unit: 'g' }, { name: 'Vanille', amount: 2, unit: 'g' }] },
      Schokolade: { type: 'finish', price: 6, ingredients: [{ name: 'Schokolade', amount: 110, unit: 'g' }, { name: 'Sahne', amount: 90, unit: 'ml' }] },
      Erdbeere: { type: 'finish', price: 6, ingredients: [{ name: 'Erdbeeren', amount: 75, unit: 'g' }, { name: 'Puderzucker', amount: 70, unit: 'g' }, { name: 'Frischkäse', amount: 75, unit: 'g' }] },
      Pistazie: { type: 'finish', price: 7, ingredients: [{ name: 'Pistazien', amount: 45, unit: 'g' }, { name: 'Frischkäse', amount: 90, unit: 'g' }, { name: 'Puderzucker', amount: 65, unit: 'g' }] }
    },
    decorations: {
      'Frische Beeren': { type: 'decoration', price: 7, ingredients: [{ name: 'Erdbeeren', amount: 125, unit: 'g' }, { name: 'Himbeeren', amount: 65, unit: 'g' }, { name: 'Blaubeeren', amount: 45, unit: 'g' }] },
      Blumen: { type: 'decoration', price: 8, ingredients: [{ name: 'Essbare Blüten', amount: 5, unit: 'Stk.' }] },
      Streusel: { type: 'decoration', price: 4, ingredients: [{ name: 'Zuckerstreusel', amount: 28, unit: 'g' }] },
      Kerzen: { type: 'decoration', price: 3, ingredients: [{ name: 'Kerzen', amount: 3, unit: 'Stk.' }] },
      Spritzdekor: { type: 'decoration', assetId: 'decoration.piping', price: 0, ingredients: [] }
    }
  };

  function ingredientTotals(config) {
    var factor = (components.sizes[config.size] && components.sizes[config.size].multiplier) || 1;
    var rows = [];
    config.layers.forEach(function (name) { rows = rows.concat((components.doughs[name] && components.doughs[name].ingredients) || []); });
    config.fillings.forEach(function (name) { rows = rows.concat((components.fillings[name] && components.fillings[name].ingredients) || []); });
    rows = rows.concat((components.glazes[config.glaze] && components.glazes[config.glaze].ingredients) || []);
    config.decorations.forEach(function (name) { rows = rows.concat((components.decorations[name] && components.decorations[name].ingredients) || []); });

    var totals = {};
    rows.forEach(function (row) {
      var key = row.name + '|' + row.unit;
      totals[key] = (totals[key] || 0) + row.amount * factor;
    });

    return Object.keys(totals).map(function (key) {
      var parts = key.split('|');
      var unit = parts[1];
      var amount = totals[key];
      return { name: parts[0], unit: unit, amount: unit === 'Stk.' ? Math.ceil(amount * 2) / 2 : Math.round(amount) };
    }).sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
  }

  window.CakeCatalog = components;
  window.CakeCatalog.ingredientTotals = ingredientTotals;
})();

(function () {
  'use strict';

  window.addEventListener('load', function () {
    var nav = document.querySelector('.step-nav');
    var editor = document.querySelector('.editor-card');
    var actions = document.querySelector('.editor-actions');
    if (!nav || !editor || !actions || document.querySelector('[data-pane="4"]')) return;

    var style = document.createElement('style');
    style.textContent = '\n      .step-nav.has-summary-step{grid-template-columns:repeat(5,1fr)}\n      .final-summary{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:26px;align-items:start}\n      .final-summary-overview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:20px 0}\n      .final-summary-item{border:1px solid var(--pt-line);border-radius:12px;padding:14px;background:#fff}\n      .final-summary-item small{display:block;color:var(--pt-muted);font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}\n      .final-summary-item strong{font-size:.82rem;line-height:1.35}\n      .final-summary-price{border:1px solid var(--pt-line);border-radius:16px;padding:18px;background:var(--pt-soft)}\n      .final-summary-price small{display:block;color:var(--pt-muted);font-size:.66rem;text-transform:uppercase;letter-spacing:.08em}\n      .final-summary-price output{display:block;font:500 2.35rem/1 Georgia,serif;color:var(--pt-accent);margin:7px 0 14px}\n      .final-summary-price button{width:100%;border:0;border-radius:999px;background:var(--pt-accent);color:#fff;padding:13px 16px;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}\n      .final-details{margin-top:12px;border-top:1px solid var(--pt-line);padding:14px 0 0}\n      .final-details details{border:1px solid var(--pt-line);border-radius:12px;background:#fff;margin:8px 0;padding:13px 15px}\n      .final-details summary{cursor:pointer;font-weight:800;font-size:.77rem}\n      .final-details ul,.final-details ol{margin:12px 0 0;padding-left:20px;color:var(--pt-muted);font-size:.74rem;line-height:1.55}\n      @media(max-width:760px){.step-nav.has-summary-step button{padding:9px 3px}.step-nav.has-summary-step span{font-size:.54rem}.final-summary{grid-template-columns:1fr}.final-summary-overview{grid-template-columns:1fr}.final-summary-price{order:-1}}\n    ';
    document.head.appendChild(style);

    nav.classList.add('has-summary-step');
    var summaryNav = document.createElement('button');
    summaryNav.type = 'button';
    summaryNav.dataset.step = '4';
    summaryNav.innerHTML = '<b>05</b><span>Ergebnis</span><small>Zusammenfassung</small>';
    nav.appendChild(summaryNav);

    var pane = document.createElement('div');
    pane.className = 'step-pane';
    pane.dataset.pane = '4';
    pane.innerHTML = '<p class="step-kicker">05 · Ergebnis</p><h2>Deine Torte auf einen Blick.</h2><p class="step-copy">Prüfe deine Auswahl. Zutaten und Zubereitung kannst du bei Bedarf aufklappen.</p><div class="final-summary"><div><div class="final-summary-overview"><div class="final-summary-item"><small>Größe</small><strong id="finalSummarySize">–</strong></div><div class="final-summary-item"><small>Aufbau</small><strong id="finalSummaryLayers">–</strong></div><div class="final-summary-item"><small>Cremes</small><strong id="finalSummaryFillings">–</strong></div><div class="final-summary-item"><small>Finish & Deko</small><strong id="finalSummaryFinish">–</strong></div></div><div class="final-details"><details><summary>Zutaten anzeigen</summary><ul id="finalIngredientList"></ul></details><details><summary>Zubereitung anzeigen</summary><ol id="finalPrepList"></ol></details></div></div><div class="final-summary-price"><small>Richtwert</small><output id="finalSummaryPrice">–</output><button type="button" id="finalRequestButton">Torte anfragen</button></div></div>';
    editor.insertBefore(pane, actions);

    function renderFinalSummary() {
      if (typeof update === 'function') update();
      var detail = document.querySelectorAll('#configDetail li');
      document.getElementById('finalSummarySize').textContent = document.getElementById('summarySize') ? document.getElementById('summarySize').textContent : '–';
      document.getElementById('finalSummaryLayers').textContent = detail[0] ? detail[0].textContent : '–';
      document.getElementById('finalSummaryFillings').textContent = detail[1] ? detail[1].textContent : '–';
      document.getElementById('finalSummaryFinish').textContent = [detail[2] ? detail[2].textContent : '', detail[3] ? detail[3].textContent : ''].filter(Boolean).join(' · ');
      document.getElementById('finalSummaryPrice').textContent = document.getElementById('configPrice') ? document.getElementById('configPrice').textContent : '–';
      var ingredients = document.getElementById('ingredientList');
      var prep = document.getElementById('prepList');
      document.getElementById('finalIngredientList').innerHTML = ingredients ? ingredients.innerHTML : '';
      document.getElementById('finalPrepList').innerHTML = prep ? prep.innerHTML : '';
    }

    setStep = function (n) {
      activeStep = Math.max(0, Math.min(4, n));
      document.querySelectorAll('[data-pane]').forEach(function (e) { e.classList.toggle('is-active', +e.dataset.pane === activeStep); });
      document.querySelectorAll('[data-step]').forEach(function (e) {
        e.classList.toggle('is-active', +e.dataset.step === activeStep);
        e.classList.toggle('is-done', +e.dataset.step < activeStep);
      });
      document.getElementById('prevStep').disabled = activeStep === 0;
      document.getElementById('nextStep').textContent = activeStep === 4 ? 'Torte anfragen' : 'Weiter';
      if (activeStep === 4) renderFinalSummary();
    };

    document.querySelectorAll('[data-step]').forEach(function (e) { e.onclick = function () { setStep(+e.dataset.step); }; });
    prevStep.onclick = function () { setStep(activeStep - 1); };
    nextStep.onclick = function () { activeStep === 4 ? openRequest() : setStep(activeStep + 1); };
    document.getElementById('finalRequestButton').onclick = function () { openRequest(); };
    setStep(activeStep);
  });
})();
