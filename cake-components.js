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
      ]}
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
      Kerzen: { type: 'decoration', price: 3, ingredients: [{ name: 'Kerzen', amount: 3, unit: 'Stk.' }] }
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

  var suggestionScript = document.createElement('script');
  suggestionScript.src = 'assets/cake-suggestion.js';
  suggestionScript.defer = true;
  document.head.appendChild(suggestionScript);
})();