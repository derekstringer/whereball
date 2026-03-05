// Cloudflare Worker: scrapes 24PetConnect for real animal photos
// Deploy: cd worker && npx wrangler deploy
// Free tier: 100k requests/day

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const shelter = env.SHELTER || 'ASTN';

    // GET /photos/:animalId — scrape photos for one animal
    const match = url.pathname.match(/^\/photos\/([A-Za-z0-9]+)$/);
    if (match) {
      const animalId = match[1];
      const photos = await scrapeAnimalPhotos(animalId, shelter);
      return json({ animal_id: animalId, photos });
    }

    // GET /batch?ids=A123,A456 — scrape photos for multiple animals
    if (url.pathname === '/batch') {
      const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 20);
      const results = {};
      // Process in parallel, max 6 concurrent
      const chunks = [];
      for (let i = 0; i < ids.length; i += 6) chunks.push(ids.slice(i, i + 6));
      for (const chunk of chunks) {
        const batch = await Promise.all(
          chunk.map(async id => ({ id, photos: await scrapeAnimalPhotos(id, shelter) }))
        );
        batch.forEach(r => { results[r.id] = r.photos; });
      }
      return json(results);
    }

    return json({ error: 'Use GET /photos/:animalId or GET /batch?ids=A1,A2' }, 400);
  }
};

async function scrapeAnimalPhotos(animalId, shelter) {
  const detailUrl = `https://24petconnect.com/${shelter}Found/Details/${shelter}/${animalId}`;
  try {
    const res = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PawFinder/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    if (!res.ok) return [];
    const html = await res.text();
    return extractImageUrls(html, animalId);
  } catch (e) {
    return [];
  }
}

function extractImageUrls(html, animalId) {
  const urls = new Set();

  // Match img src attributes
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgRe.exec(html)) !== null) {
    addIfPhoto(m[1], urls);
  }

  // Match data-src (lazy loaded)
  const dataSrcRe = /data-src=["']([^"']+)["']/gi;
  while ((m = dataSrcRe.exec(html)) !== null) {
    addIfPhoto(m[1], urls);
  }

  // Match background-image: url(...)
  const bgRe = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((m = bgRe.exec(html)) !== null) {
    addIfPhoto(m[1], urls);
  }

  // Match any URL that looks like an animal photo (broad catch)
  const urlRe = /["'](https?:\/\/[^"']+(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/gi;
  while ((m = urlRe.exec(html)) !== null) {
    // Skip tiny icons and logos
    if (!m[1].includes('logo') && !m[1].includes('icon') && !m[1].includes('favicon')) {
      urls.add(m[1]);
    }
  }

  // Also look for the /image/ pattern we found in RSS feeds
  const imagePathRe = /["'](\/image\/[^"']+)["']/gi;
  while ((m = imagePathRe.exec(html)) !== null) {
    urls.add('https://24petconnect.com' + m[1]);
  }

  return [...urls];
}

function addIfPhoto(src, urls) {
  // Make relative URLs absolute
  if (src.startsWith('/')) src = 'https://24petconnect.com' + src;
  if (!src.startsWith('http')) return;
  // Skip logos, icons, tracking pixels
  const lower = src.toLowerCase();
  if (lower.includes('logo') || lower.includes('icon') || lower.includes('favicon') ||
      lower.includes('tracking') || lower.includes('pixel') || lower.includes('spacer') ||
      lower.includes('.svg') || lower.includes('badge')) return;
  // Keep anything that looks like a photo
  if (lower.includes('/image/') || lower.includes('/photo/') || lower.includes('/img/') ||
      lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') ||
      lower.includes('.webp') || lower.includes(src.includes('/Image/'))) {
    urls.add(src);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
  });
}
