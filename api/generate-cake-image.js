export const config = { runtime: 'nodejs' };

const ALLOWED_SIZES = new Set(['1024x1024','1536x1024','1024x1536','auto']);

function clean(value, fallback = '') {
  if (Array.isArray(value)) return value.map(v => clean(v)).filter(Boolean).slice(0, 12);
  return String(value ?? fallback).replace(/[<>]/g, '').trim().slice(0, 500);
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
    const extra = clean(c.description, '');

    const prompt = `Photorealistic premium food photo of ONE cake slice only, standing slightly angled on an elegant ceramic plate. Do not show the remaining whole cake anywhere in the image.\n\nEXACT CAKE CONFIGURATION\nSize: ${size}. Shape: ${shape}.\nCake sponge layers from BOTTOM TO TOP: ${layers.join(' > ') || 'not specified'}.\nFillings/creams from BOTTOM TO TOP, positioned between the sponge layers in that exact order: ${fillings.join(' > ') || 'not specified'}.\nExterior finish: ${finish || 'not specified'}.\nDecorations: ${decorations.join(' | ') || 'none'}.\nAdditional information: ${extra || 'none'}.\n\nThe cut face of the single slice must clearly show the configured sponge layers and fillings in the exact bottom-to-top order above. Do not add, remove, duplicate or reorder layers or fillings. Keep the configured finish and decorations. Warm natural tabletop, refined modern patisserie atmosphere, subtle linen, restrained flowers/greenery, realistic crumbs, shallow depth of field, natural window light. No people, hands, text, logos or whole cake. The slice is the clear hero subject.`;

    // Test mode: return the exact prompt without calling OpenAI and without generating costs.
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
