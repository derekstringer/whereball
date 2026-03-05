// Cloudflare Worker: fetches real animal photos from Austin's open data
// The "Found Pets Map" dataset (hye6-gvq2) includes image URLs
// Fallback: tries the known AAC image URL pattern
// Deploy: cd worker && npx wrangler deploy
// Free tier: 100k requests/day

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Austin's Found Pets Map dataset includes an image column
const FOUND_PETS_API = 'https://data.austintexas.gov/resource/hye6-gvq2.json';
// Known URL pattern for AAC animal images
const AAC_IMAGE_BASE = 'https://www.austintexas.gov/sites/default/files/aac_image';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // GET /photos/:animalId — get photo for one animal
    const match = url.pathname.match(/^\/photos\/([A-Za-z0-9]+)$/);
    if (match) {
      const animalId = match[1];
      const photos = await getAnimalPhotos(animalId);
      return json({ animal_id: animalId, photos });
    }

    // GET /batch?ids=A123,A456 — get photos for multiple animals
    if (url.pathname === '/batch') {
      const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 20);
      const results = await getBatchPhotos(ids);
      return json(results);
    }

    return json({ error: 'Use GET /photos/:animalId or GET /batch?ids=A1,A2' }, 400);
  }
};

async function getAnimalPhotos(animalId) {
  const photos = [];

  // Strategy 1: Query the Found Pets Map dataset for this animal's image link
  try {
    const socrataUrl = `${FOUND_PETS_API}?animal_id=${animalId}&$limit=1`;
    const res = await fetch(socrataUrl, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0 && data[0].image) {
        let imgUrl = data[0].image;
        // Ensure HTTPS
        if (imgUrl.startsWith('http://')) imgUrl = imgUrl.replace('http://', 'https://');
        photos.push(imgUrl);
      }
    }
  } catch (e) { /* continue to fallback */ }

  // Strategy 2: Try the known AAC image URL pattern
  if (photos.length === 0) {
    const directUrl = `${AAC_IMAGE_BASE}/${animalId}.jpg`;
    try {
      const res = await fetch(directUrl, { method: 'HEAD', redirect: 'follow' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.startsWith('image/')) {
          photos.push(directUrl);
        }
      }
    } catch (e) { /* no photo available */ }
  }

  return photos;
}

async function getBatchPhotos(ids) {
  const results = {};

  // First, bulk-query the Found Pets Map for all IDs at once
  const imageMap = {};
  if (ids.length > 0) {
    try {
      const idList = ids.map(id => `'${id}'`).join(',');
      const where = encodeURIComponent(`animal_id in(${idList})`);
      const socrataUrl = `${FOUND_PETS_API}?$where=${where}&$limit=${ids.length}`;
      const res = await fetch(socrataUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        for (const row of data) {
          if (row.animal_id && row.image) {
            let imgUrl = row.image;
            if (imgUrl.startsWith('http://')) imgUrl = imgUrl.replace('http://', 'https://');
            imageMap[row.animal_id] = [imgUrl];
          }
        }
      }
    } catch (e) { /* continue to HEAD fallback */ }
  }

  // For IDs not found in the dataset, try the direct AAC URL pattern
  const missing = ids.filter(id => !imageMap[id]);
  const chunks = [];
  for (let i = 0; i < missing.length; i += 6) chunks.push(missing.slice(i, i + 6));
  for (const chunk of chunks) {
    await Promise.all(chunk.map(async id => {
      const directUrl = `${AAC_IMAGE_BASE}/${id}.jpg`;
      try {
        const res = await fetch(directUrl, { method: 'HEAD', redirect: 'follow' });
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.startsWith('image/')) {
            imageMap[id] = [directUrl];
          }
        }
      } catch (e) { /* no photo */ }
    }));
  }

  // Build final results (empty array for IDs with no photo)
  for (const id of ids) {
    results[id] = imageMap[id] || [];
  }
  return results;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
  });
}
