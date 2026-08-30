(() => {
  'use strict';

  const components = {
    sizes: {
      Klein: { label: 'Klein (ca. 8 Personen)', scale: 0.93, multiplier: 0.82 },
      Mittel: { label: 'Mittel (ca. 12 Personen)', scale: 1.05, multiplier: 1.15 },
      Groß: { label: 'Groß (ca. 18 Personen)', scale: 1.16, multiplier: 1.55 }
    },
    doughs: {
      Vanille: {
        type: 'cake-layer', price: 0,
        visual: { crumb: '#d5a364', crust: '#b87938', roughness: 0.86 },
        ingredients: [
          { name: 'Mehl', amount: 95, unit: 'g' }, { name: 'Zucker', amount: 78, unit: 'g' },
          { name: 'Butter', amount: 66, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
          { name: 'Milch', amount: 48, unit: 'ml' }, { name: 'Vanille', amount: 2, unit: 'g' }
        ]
      },
      Schokolade: {
        type: 'cake-layer', price: 2,
        visual: { crumb: '#5e3323', crust: '#442117', roughness: 0.9 },
        ingredients: [
          { name: 'Mehl', amount: 82, unit: 'g' }, { name: 'Zucker', amount: 82, unit: 'g' },
          { name: 'Butter', amount: 64, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
          { name: 'Milch', amount: 52, unit: 'ml' }, { name: 'Kakao', amount: 18, unit: 'g' }
        ]
      },
      Zitrone: {
        type: 'cake-layer', price: 2,
        visual: { crumb: '#d4b452', crust: '#b38e31', roughness: 0.86 },
        ingredients: [
          { name: 'Mehl', amount: 94, unit: 'g' }, { name: 'Zucker', amount: 80, unit: 'g' },
          { name: 'Butter', amount: 66, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
          { name: 'Zitrone', amount: 0.35, unit: 'Stk.' }, { name: 'Milch', amount: 42, unit: 'ml' }
        ]
      },
      'Red Velvet': {
        type: 'cake-layer', price: 3,
        visual: { crumb: '#7a2226', crust: '#571518', roughness: 0.88 },
        ingredients: [
          { name: 'Mehl', amount: 88, unit: 'g' }, { name: 'Zucker', amount: 84, unit: 'g' },
          { name: 'Butter', amount: 60, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
          { name: 'Buttermilch', amount: 52, unit: 'ml' }, { name: 'Kakao', amount: 8, unit: 'g' }
        ]
      },
      Marmor: {
        type: 'cake-layer', price: 2,
        visual: { crumb: '#ad7c58', crust: '#875336', roughness: 0.88 },
        ingredients: [
          { name: 'Mehl', amount: 92, unit: 'g' }, { name: 'Zucker', amount: 80, unit: 'g' },
          { name: 'Butter', amount: 66, unit: 'g' }, { name: 'Ei', amount: 1.35, unit: 'Stk.' },
          { name: 'Milch', amount: 48, unit: 'ml' }, { name: 'Kakao', amount: 9, unit: 'g' }
        ]
      }
    },
    fillings: {
      Buttercreme: { type: 'filling', price: 0, visual: { color: '#f5e4c9' }, ingredients: [{ name: 'Butter', amount: 55, unit: 'g' }, { name: 'Puderzucker', amount: 42, unit: 'g' }, { name: 'Milch', amount: 8, unit: 'ml' }] },
      Erdbeere: { type: 'filling', price: 3, visual: { color: '#df7189' }, ingredients: [{ name: 'Erdbeeren', amount: 75, unit: 'g' }, { name: 'Mascarpone', amount: 52, unit: 'g' }, { name: 'Sahne', amount: 38, unit: 'ml' }, { name: 'Zucker', amount: 12, unit: 'g' }] },
      Schokolade: { type: 'filling', price: 3, visual: { color: '#633626' }, ingredients: [{ name: 'Schokolade', amount: 48, unit: 'g' }, { name: 'Sahne', amount: 46, unit: 'ml' }] },
      Zitrone: { type: 'filling', price: 2, visual: { color: '#edd36e' }, ingredients: [{ name: 'Mascarpone', amount: 50, unit: 'g' }, { name: 'Sahne', amount: 38, unit: 'ml' }, { name: 'Zitrone', amount: 0.3, unit: 'Stk.' }] },
      Pistazie: { type: 'filling', price: 4, visual: { color: '#9eb67c' }, ingredients: [{ name: 'Mascarpone', amount: 48, unit: 'g' }, { name: 'Sahne', amount: 35, unit: 'ml' }, { name: 'Pistazien', amount: 24, unit: 'g' }] }
    },
    glazes: {
      Keine: { type: 'finish', price: 0, ingredients: [] },
      Vanille: { type: 'finish', price: 5, visual: { color: '#f2e3ce', roughness: 0.58 }, ingredients: [{ name: 'Butter', amount: 95, unit: 'g' }, { name: 'Puderzucker', amount: 75, unit: 'g' }, { name: 'Frischkäse', amount: 62, unit: 'g' }, { name: 'Vanille', amount: 2, unit: 'g' }] },
      Schokolade: { type: 'finish', price: 6, visual: { color: '#543025', roughness: 0.29 }, ingredients: [{ name: 'Schokolade', amount: 110, unit: 'g' }, { name: 'Sahne', amount: 90, unit: 'ml' }] },
      Erdbeere: { type: 'finish', price: 6, visual: { color: '#e98aa0', roughness: 0.42 }, ingredients: [{ name: 'Erdbeeren', amount: 75, unit: 'g' }, { name: 'Puderzucker', amount: 70, unit: 'g' }, { name: 'Frischkäse', amount: 75, unit: 'g' }] },
      Pistazie: { type: 'finish', price: 7, visual: { color: '#9ebc7c', roughness: 0.48 }, ingredients: [{ name: 'Pistazien', amount: 45, unit: 'g' }, { name: 'Frischkäse', amount: 90, unit: 'g' }, { name: 'Puderzucker', amount: 65, unit: 'g' }] }
    },
    decorations: {
      'Frische Beeren': { type: 'decoration', price: 7, visual: { assetFamily: 'fresh-berries' }, ingredients: [{ name: 'Erdbeeren', amount: 125, unit: 'g' }, { name: 'Himbeeren', amount: 65, unit: 'g' }, { name: 'Blaubeeren', amount: 45, unit: 'g' }] },
      Blumen: { type: 'decoration', price: 8, visual: { assetFamily: 'edible-flowers' }, ingredients: [{ name: 'Essbare Blüten', amount: 5, unit: 'Stk.' }] },
      Streusel: { type: 'decoration', price: 4, visual: { assetFamily: 'sprinkles' }, ingredients: [{ name: 'Zuckerstreusel', amount: 28, unit: 'g' }] },
      Kerzen: { type: 'decoration', price: 3, visual: { assetFamily: 'candles' }, ingredients: [{ name: 'Kerzen', amount: 3, unit: 'Stk.' }] }
    }
  };

  function ingredientTotals(config) {
    const factor = components.sizes[config.size]?.multiplier || 1;
    const rows = [];
    config.layers.forEach(name => rows.push(...(components.doughs[name]?.ingredients || [])));
    config.fillings.forEach(name => rows.push(...(components.fillings[name]?.ingredients || [])));
    rows.push(...(components.glazes[config.glaze]?.ingredients || []));
    config.decorations.forEach(name => rows.push(...(components.decorations[name]?.ingredients || []));
    const totals = new Map();
    rows.forEach(row => {
      const key = `${row.name}|${row.unit}`;
      totals.set(key, (totals.get(key) || 0) + row.amount * factor);
    });
    return [...totals.entries()].map(([key, amount]) => {
      const [name, unit] = key.split('|');
      const rounded = unit === 'Stk.' ? Math.ceil(amount * 2) / 2 : Math.round(amount);
      return { name, unit, amount: rounded };
    }).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  window.CakeCatalog = { ...components, ingredientTotals };
})();