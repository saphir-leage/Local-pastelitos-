const DEFAULT_DIMENSIONS = Object.freeze({
  spongeThicknessCm: 3,
  creamThicknessCm: 1,
  exteriorFinishThicknessMm: 3,
});

function cleanText(value) {
  return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, 500);
}

function cleanList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanText).filter(Boolean).slice(0, 12);
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeCakeImageConfiguration(configuration = {}) {
  const dimensions = configuration.dimensions || {};
  return {
    size: cleanText(configuration.size),
    shape: cleanText(configuration.shape),
    layers: cleanList(configuration.layers || configuration.doughs),
    fillings: cleanList(configuration.fillings || configuration.creams),
    finish: cleanText(configuration.finish || configuration.glaze),
    decorations: cleanList(configuration.decorations || configuration.decor),
    spongeThicknessCm: numberOrDefault(configuration.spongeThicknessCm ?? dimensions.spongeThicknessCm, DEFAULT_DIMENSIONS.spongeThicknessCm),
    creamThicknessCm: numberOrDefault(configuration.creamThicknessCm ?? dimensions.creamThicknessCm, DEFAULT_DIMENSIONS.creamThicknessCm),
    exteriorFinishThicknessMm: numberOrDefault(configuration.exteriorFinishThicknessMm ?? dimensions.exteriorFinishThicknessMm, DEFAULT_DIMENSIONS.exteriorFinishThicknessMm),
  };
}

function buildCutFaceSections(config) {
  const sections = [];
  config.layers.forEach((flavor, index) => {
    sections.push({ type: 'SPONGE', flavor, thickness: `${config.spongeThicknessCm} cm`, visualWeight: 'THICK' });
    if (index < config.layers.length - 1 && config.fillings[index]) {
      sections.push({ type: 'CREAM', flavor: config.fillings[index], thickness: `${config.creamThicknessCm} cm`, visualWeight: 'THIN' });
    }
  });
  return sections;
}

function formatConfigurationSummary(config) {
  const lines = ['EXACT CONFIGURATION SUMMARY'];
  if (config.size) lines.push(`Size: ${config.size}.`);
  if (config.shape) lines.push(`Shape: ${config.shape}.`);
  if (config.layers.length) lines.push(`Sponge layers, bottom to top: ${config.layers.join(' > ')}.`);
  if (config.fillings.length) lines.push(`Cream layers, bottom to top: ${config.fillings.join(' > ')}.`);
  if (config.finish) lines.push(`Exterior finish: ${config.finish}.`);
  lines.push(config.decorations.length ? `Configured decoration: ${config.decorations.join(' | ')}.` : 'Configured decoration: none.');
  return lines.join('\n');
}

export function buildCakeImagePrompt(configuration = {}) {
  const config = normalizeCakeImageConfiguration(configuration);
  const sections = buildCutFaceSections(config);
  const numberOfSponges = config.layers.length;
  const numberOfCreams = sections.filter(section => section.type === 'CREAM').length;
  const totalVisibleSections = sections.length;
  const hasCandles = config.decorations.some(item => /kerze|candle/i.test(item));

  const cutFace = sections.length
    ? `VISIBLE CUT FACE — EXACTLY ${totalVisibleSections} HORIZONTAL SECTIONS\n\nBOTTOM\n\n${sections.map((section, index) => `SECTION ${index + 1} — ${section.type}\n${section.type} — ${section.flavor} ${section.type === 'SPONGE' ? 'sponge cake' : 'cream filling'}\n${section.visualWeight} — approximately ${section.thickness}`).join('\n\n')}\n\nTOP`
    : 'VISIBLE CUT FACE\nNo internal layer structure was provided. Do not invent internal flavors or layers.';

  const exteriorBlock = config.finish
    ? `EXTERIOR COATING\n${config.finish} finish.\nThin coating only.\nApproximately ${config.exteriorFinishThicknessMm} mm thick.\nApplied only to the outside surfaces of the cake and slice.\nThis is NOT an internal layer.`
    : 'EXTERIOR COATING\nNo exterior finish was configured. Do not invent one.';

  const decorationBlock = config.decorations.length
    ? `DECORATION\nUse ONLY these configured decorations: ${config.decorations.join(' | ')}.\nKeep decorations on the exterior/top surfaces only.\nDo not invent additional toppings, sauces, macarons, chocolate pieces, flowers, candles or text unless they are explicitly included in the configured decoration list.`
    : 'DECORATION\nNo decoration is configured. Do not add toppings, sauces, fruit, macarons, chocolate pieces, flowers, candles or text.';

  return `MAIN IMAGE INSTRUCTION
Create one photorealistic premium product photograph of the exact configured cake. Show the complete configured cake at a slight three-quarter angle with exactly ONE wedge-shaped slice removed. Put that exact removed slice on a separate elegant ceramic dessert plate directly in front of the cake, also slightly angled toward the camera. Keep both exposed cut faces clearly visible.

${formatConfigurationSummary(config)}

STRUCTURAL COUNT
Exactly ${numberOfSponges} sponge layers.
Exactly ${numberOfCreams} cream layers.
Exactly ${totalVisibleSections} visible horizontal internal sections.
There must be no additional internal layers.

${cutFace}

THICKNESS AND PROPORTIONS
Every sponge layer is approximately ${config.spongeThicknessCm} cm thick.
Every cream layer is approximately ${config.creamThicknessCm} cm thick.
SPONGE : CREAM visual thickness ratio = ${config.spongeThicknessCm} : ${config.creamThicknessCm}.
Every sponge layer must be approximately three times as thick as every cream layer when the configured ratio is 3 : 1.
The exterior coating is approximately ${config.exteriorFinishThicknessMm} mm thick and must visually read as an extremely thin coating, never as another cake or cream layer.
Configured sponge and cream flavors must remain visually distinguishable through realistic crumb, cream texture and natural flavor-appropriate appearance while preserving the exact layer type and order.

${exteriorBlock}

${decorationBlock}

CAKE + REMOVED SLICE RELATIONSHIP
The complete cake remains clearly visible behind the plated slice.
The missing wedge in the cake visibly corresponds to the slice on the plate.
The slice is the exact physical piece removed from that visible wedge.
The removed slice and the exposed cut face of the remaining cake must show EXACTLY the same vertical layer structure, section count, order, relative thicknesses, flavors and exterior coating.
Do not create a generic slice with a different internal structure.
Cake and slice must match one-to-one.

CRITICAL STRUCTURE RULES
- Do not add layers.
- Do not remove layers.
- Do not duplicate layers.
- Do not split layers.
- Do not merge layers.
- Do not swap layers.
- Do not reorder layers.
- Do not turn cream layers into sponge layers.
- Do not turn sponge layers into cream layers.
- Do not interpret the exterior coating as an internal filling.
- Do not place decorations inside the cake.
- Do not create additional fillings.
- Cake and slice must match one-to-one.

PHOTOGRAPHY STYLE
Photorealistic premium food photography.
High-end modern European patisserie.
Natural realistic cake textures.
Clearly visible crumb structure in sponge layers.
Clearly visible smooth cream texture in filling layers.
Natural window light.
Soft realistic shadows.
Shallow depth of field.
Elegant neutral ceramic plates.
Warm natural tabletop.
Subtle restrained background styling.
No people.
No hands.
No text.
No logos.
${hasCandles ? 'Candles are allowed only because they are explicitly configured.' : 'No candles.'}
The cake is the hero product.
Avoid illustration, CGI, cartoon or overly perfect synthetic textures.`;
}
