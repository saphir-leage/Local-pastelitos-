export const config = { runtime: 'nodejs' };

const ALLOWED_SIZES = new Set(['1024x1024','1536x1024','1024x1536','auto']);

function clean(value, fallback = '') {
  if (Array.isArray(value)) return value.map(v => clean(v)).filter(Boolean).slice(0, 12);
  return String(value ?? fallback).replace(/[<>]/g, '').trim().slice(0, 500);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY fehlt auf dem Server.' });

  try {
    const c = req.body?.configuration || req.body || {};
    const size = clean(c.size, 'mittel');
    const shape = clean(c.shape, 'rund');
    const layers = clean(c.layers || c.doughs || []);
    const fillings = clean(c.fillings || c.creams || []);
    const finish = clean(c.finish || c.glaze, '');
    const decorations = clean(c.decorations || c.decor, []);
    const extra = clean(c.description, '');

    const prompt = `Create a premium, highly photorealistic editorial food photograph of the exact cake described below. Do not use a reference image. The cake configuration is the source of truth.

CAKE CONFIGURATION
- Size: ${size}
- Shape: ${shape}
- Cake layers / sponge, bottom to top: ${layers.join(' | ') || 'not specified'}
- Fillings / creams, bottom to top: ${fillings.join(' | ') || 'not specified'}
- Exterior finish / glaze: ${finish || 'not specified'}
- Decorations: ${decorations.join(' | ') || 'none'}
- Additional configuration: ${extra || 'none'}

SCENE
Show the finished cake on a refined warm natural table in a premium modern patisserie setting. A neat wedge is cut out so the configured internal layers and fillings are clearly visible. Put the matching slice on a small elegant ceramic plate beside the cake. Warm natural window light, subtle linen, restrained flowers or greenery, a few realistic crumbs, shallow depth of field, professional high-end food photography. Warm cream, cocoa and berry mood. No people, no hands, no text, no logos, no candles unless explicitly configured.

ACCURACY RULES
Preserve the configured shape, relative size, number and order of cake layers, number and order of fillings, exterior finish and decorations. Do not invent additional cake layers, fillings, toppings or decorations. Make edible materials physically plausible and appetizing.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt,
        size: ALLOWED_SIZES.has(req.body?.imageSize) ? req.body.imageSize : '1536x1024',
        quality: 'high',
        output_format: 'webp'
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
