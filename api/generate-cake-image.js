export const config = { runtime: 'nodejs' };

const ALLOWED_SIZES = new Set(['1024x1024','1536x1024','1024x1536','auto']);

function clean(value, fallback = '') {
  if (Array.isArray(value)) return value.map(v => clean(v)).filter(Boolean).slice(0, 12);
  return String(value ?? fallback).replace(/[<>]/g, '').trim().slice(0, 500);
}

function buildStack(layers, fillings) {
  const stack = [];
  layers.forEach((layer, index) => {
    stack.push(`${stack.length + 1}. SPONGE: ${layer} — exactly 3 cm thick`);
    if (index < layers.length - 1 && fillings[index]) {
      stack.push(`${stack.length + 1}. CREAM/FILLING: ${fillings[index]} — exactly 1 cm thick`);
    }
  });
  return stack.join('\n');
}

function buildPrompt({size, shape, layers, fillings, finish, decorations}) {
  const stack = buildStack(layers, fillings);
  return `Photorealistic premium food photograph of the configured cake, shown slightly angled in a refined modern patisserie setting. Show the COMPLETE CAKE with exactly ONE wedge-shaped slice cut out of it. Place that removed cake slice on an elegant ceramic dessert plate directly in front of the cake, also slightly angled toward the camera so its cut face and all layers are clearly visible.

EXACT CAKE CONFIGURATION — THIS IS THE SOURCE OF TRUTH
Size: ${size}. Shape: ${shape}.
Number of sponge layers: ${layers.length}.
Number of cream/filling layers: ${fillings.length}.
Exterior finish: ${finish || 'none'} — exactly 3 mm thick wherever applied.
Decorations: ${decorations.join(' | ') || 'none'}.

MANDATORY VERTICAL STACK FROM BOTTOM TO TOP:
${stack || 'not specified'}

CRITICAL STRUCTURE RULES:
- Reproduce the vertical stack above EXACTLY from bottom to top in BOTH the remaining cake and the slice on the plate.
- Every sponge layer is exactly 3 cm thick.
- Every cream/filling layer is exactly 1 cm thick and sits only between its two corresponding sponge layers.
- The exterior finish is exactly 3 mm thick. It is a thin exterior coating, NOT an additional filling layer.
- Do not add, remove, duplicate, merge, split, swap or reorder any sponge or cream layer.
- The slice on the plate must visibly match the exposed cut face of the remaining cake one-to-one.
- Preserve the configured finish and decorations; do not invent additional toppings or fillings.

COMPOSITION AND STYLE:
The whole cake remains clearly visible behind the plated slice. The missing wedge in the cake should visibly correspond to the slice on the plate. Show the cake and plated slice at a slight three-quarter angle, with the plated slice in the foreground. Warm natural tabletop, elegant ceramic plate, refined modern patisserie atmosphere, subtle linen, restrained flowers or greenery, realistic crumbs, shallow depth of field and natural window light. High-end realistic food photography. No people, hands, text, logos or candles unless candles are explicitly configured.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const c = req.body?.configuration || req.body || {};
    const size = clean(c.size, 'mittel');
    const shape = clean(c.shape, 'rund');
    const layers = clean(c.layers || c.doughs || []);
    const fillings = clean(c.fillings || c.creams || []);
    const finish = clean(c.finish || c.glaze, '');
    const decorations = clean(c.decorations || c.decor, []);
    const prompt = buildPrompt({size, shape, layers, fillings, finish, decorations});

    if (req.body?.previewOnly === true) {
      return res.status(200).json({ prompt, model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini', quality: 'medium', imageSize: ALLOWED_SIZES.has(req.body?.imageSize) ? req.body.imageSize : '1024x1024' });
    }

    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY fehlt auf dem Server.' });

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini',
        prompt,
        size: ALLOWED_SIZES.has(req.body?.imageSize) ? req.body.imageSize : '1024x1024',
        quality: 'medium',
        output_format: 'webp',
        output_compression: 82
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI image error', response.status, data?.error?.message);
      return res.status(response.status).json({ error: data?.error?.message || 'Bildgenerierung fehlgeschlagen.' });
    }

    const image = data?.data?.[0];
    if (!image) return res.status(502).json({ error: 'OpenAI hat kein Bild zurückgegeben.' });
    if (image.b64_json) return res.status(200).json({ image: `data:image/webp;base64,${image.b64_json}` });
    if (image.url) return res.status(200).json({ image: image.url });
    return res.status(502).json({ error: 'Unbekanntes Bildformat von OpenAI.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || 'Interner Fehler bei der Bildgenerierung.' });
  }
}
