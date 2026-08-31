export const config = { runtime: 'nodejs' };

const IMAGE_MODEL = 'gpt-image-2';
const IMAGE_QUALITY = 'medium';
const IMAGE_SIZE = '1024x1024';

function isDebugEnabled() {
  return process.env.NODE_ENV === 'development' ||
    process.env.VERCEL_ENV === 'development' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.CAKE_IMAGE_DEBUG === 'true';
}

function debugPayload(prompt, configuration) {
  if (!isDebugEnabled()) return undefined;
  return {
    prompt,
    configuration,
    model: IMAGE_MODEL,
    quality: IMAGE_QUALITY,
    size: IMAGE_SIZE,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Vercel compiles this function to CommonJS. Load the ESM prompt module dynamically
    // so the function works both locally and in the Vercel Node.js runtime.
    const { buildCakeImagePrompt, normalizeCakeImageConfiguration } = await import('../cake-image-prompt.mjs');

    const configuration = normalizeCakeImageConfiguration(req.body?.configuration || req.body || {});
    const prompt = buildCakeImagePrompt(configuration);
    const debug = debugPayload(prompt, configuration);

    // Existing cost-free prompt preview/debug path: never calls OpenAI.
    if (req.body?.previewOnly === true) {
      return res.status(200).json({
        prompt,
        model: IMAGE_MODEL,
        quality: IMAGE_QUALITY,
        imageSize: IMAGE_SIZE,
        ...(debug ? { debug } : {}),
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY fehlt auf dem Server.' });
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        size: IMAGE_SIZE,
        quality: IMAGE_QUALITY,
        output_format: 'webp',
        output_compression: 82,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI image error', response.status, data?.error?.message);
      return res.status(response.status).json({
        error: data?.error?.message || 'Bildgenerierung fehlgeschlagen.',
        ...(debug ? { debug } : {}),
      });
    }

    const image = data?.data?.[0];
    if (!image) {
      return res.status(502).json({ error: 'OpenAI hat kein Bild zurückgegeben.', ...(debug ? { debug } : {}) });
    }

    if (image.b64_json) {
      return res.status(200).json({ image: `data:image/webp;base64,${image.b64_json}`, ...(debug ? { debug } : {}) });
    }
    if (image.url) {
      return res.status(200).json({ image: image.url, ...(debug ? { debug } : {}) });
    }
    return res.status(502).json({ error: 'Unbekanntes Bildformat von OpenAI.', ...(debug ? { debug } : {}) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || 'Interner Fehler bei der Bildgenerierung.' });
  }
}
