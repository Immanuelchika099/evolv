const ALLOWED_SKINS = ['#F5D4B8', '#E9B995', '#D99A70', '#B97853', '#8D573D', '#603A2B', '#39251F']
const ALLOWED_HAIRS = ['#171311', '#38251D', '#69452F', '#A56A3D', '#D2AD72', '#B64B35', '#7A4D8D', '#D7D1C7']
const ALLOWED_EYES = ['#38251D', '#2E5945', '#4B7192', '#6B4C32']
const ALLOWED_FACES = ['oval', 'round', 'slim', 'angular', 'square', 'heart']
const ALLOWED_STYLES = ['curls', 'afro', 'fade', 'braids', 'cornrows', 'locs', 'bob', 'long', 'bun', 'ponytail', 'waves', 'shaved']
const ALLOWED_PRESENTATION = ['feminine', 'masculine', 'androgynous']
const ALLOWED_FACIAL_HAIR = ['none', 'mustache', 'beard', 'goatee']
const ALLOWED_ACCESSORIES = ['none', 'glasses', 'earrings']

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}
function nearestColor(value, palette, fallback) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) return fallback
  const rgb = value.match(/[0-9a-f]{2}/ig).map(part => parseInt(part, 16))
  return palette.reduce((best, color) => {
    const candidate = color.match(/[0-9a-f]{2}/ig).map(part => parseInt(part, 16))
    const distance = rgb.reduce((sum, channel, i) => sum + (channel - candidate[i]) ** 2, 0)
    return distance < best.distance ? { color, distance } : best
  }, { color: fallback, distance: Infinity }).color
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Use POST to analyze a selfie.' })
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Selfie analysis is not configured yet. Add GEMINI_API_KEY to your Vercel environment variables.' })

  const { image, mimeType } = req.body || {}
  if (typeof image !== 'string' || image.length < 100 || image.length > 7_000_000) {
    return res.status(400).json({ error: 'Please choose a clear image under 5 MB.' })
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return res.status(400).json({ error: 'Use a JPG, PNG, or WebP image.' })
  }

  const prompt = `Look at this selfie only to suggest a friendly illustrated avatar configuration. Do not identify the person, infer identity, ethnicity, race, health, personality, or any other sensitive trait. Describe only visible appearance. Return ONLY valid JSON with these keys: face (one of oval, round, slim, angular, square, heart), hair (one of curls, afro, fade, braids, cornrows, locs, bob, long, bun, ponytail, waves, shaved), skinColor (hex), hairColor (hex), eyesColor (hex), facialHair (one of none, mustache, beard, goatee), accessory (one of none, glasses, earrings), presentation (one of feminine, masculine, androgynous). Choose the closest visible hairstyle and face shape; if uncertain use neutral defaults. skinColor should be an approximate visual illustration color, not a statement about race. For presentation use androgynous unless the visible styling clearly supports another avatar presentation. For accessories, only select glasses if visible; otherwise none. No explanations or markdown.`

  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: image } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 300 }
      })
    })
    const result = await upstream.json()
    if (!upstream.ok) {
      console.error('Gemini avatar analysis failed:', upstream.status, result?.error?.message || 'unknown error')
      return res.status(502).json({ error: 'The avatar analysis could not finish. Please try again in a moment.' })
    }
    const raw = result?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('')
    if (!raw) return res.status(502).json({ error: 'The photo could not be analyzed. Try a clearer, front-facing selfie.' })
    const parsed = JSON.parse(raw)
    return res.status(200).json({
      avatar: {
        face: pick(parsed.face, ALLOWED_FACES, 'oval'),
        hair: pick(parsed.hair, ALLOWED_STYLES, 'curls'),
        skin: nearestColor(parsed.skinColor, ALLOWED_SKINS, '#B97853'),
        hairColor: nearestColor(parsed.hairColor, ALLOWED_HAIRS, '#211812'),
        eyes: nearestColor(parsed.eyesColor, ALLOWED_EYES, '#38251D'),
        facialHair: pick(parsed.facialHair, ALLOWED_FACIAL_HAIR, 'none'),
        accessory: pick(parsed.accessory, ALLOWED_ACCESSORIES, 'none'),
        presentation: pick(parsed.presentation, ALLOWED_PRESENTATION, 'androgynous')
      }
    })
  } catch (error) {
    console.error('Avatar analysis request failed:', error?.message || error)
    return res.status(502).json({ error: 'Something went wrong while analyzing the photo. Please try again.' })
  }
}
