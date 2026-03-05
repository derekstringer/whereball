/**
 * Breed-based photo lookup using free APIs (no keys required).
 *
 * - Dogs: Dog CEO API (https://dog.ceo/dog-api/)
 * - Cats: TheCatAPI free tier
 * - Others: returns null
 *
 * Results are cached in-memory by breed so the same breed always shows the
 * same photo within a session.
 */

import type { PetPhoto } from '../types';

const cache = new Map<string, PetPhoto | null>();

// Dog CEO expects lowercase, hyphenated, no spaces. "Labrador Retriever" → "labrador"
// We try the first word of the primary breed for the best match.
const DOG_BREED_MAP: Record<string, string> = {
  labrador: 'labrador',
  retriever: 'golden/retriever',
  'golden retriever': 'retriever/golden',
  'german shepherd': 'germanshepherd',
  shepherd: 'germanshepherd',
  chihuahua: 'chihuahua',
  pitbull: 'pitbull',
  'pit bull': 'pitbull',
  poodle: 'poodle',
  beagle: 'beagle',
  rottweiler: 'rottweiler',
  dachshund: 'dachshund',
  boxer: 'boxer',
  husky: 'husky',
  bulldog: 'bulldog',
  pug: 'pug',
  doberman: 'doberman',
  corgi: 'corgi/cardigan',
  collie: 'collie',
  'border collie': 'collie/border',
  mastiff: 'mastiff/english',
  'great dane': 'dane/great',
  malinois: 'malinois',
  akita: 'akita',
  dalmatian: 'dalmatian',
  pomeranian: 'pomeranian',
  maltese: 'maltese',
  shiba: 'shiba',
  terrier: 'terrier/yorkshire',
  'yorkshire terrier': 'terrier/yorkshire',
  'australian shepherd': 'australian/shepherd',
  weimaraner: 'weimaraner',
  vizsla: 'vizsla',
  newfoundland: 'newfoundland',
  samoyed: 'samoyed',
  havanese: 'havanese',
  papillon: 'papillon',
  basenji: 'basenji',
  greyhound: 'greyhound',
  whippet: 'whippet',
  schnauzer: 'schnauzer/miniature',
  cocker: 'cocker/english',
  'cocker spaniel': 'cocker/english',
  pointer: 'pointer/germanlonghair',
  setter: 'setter/english',
  hound: 'hound/blood',
  bloodhound: 'hound/blood',
  coonhound: 'coonhound',
  ridgeback: 'ridgeback/rhodesian',
  chow: 'chow',
  'chow chow': 'chow',
  'staffordshire': 'staffordshire/bull',
};

function findDogCeoBreed(breed: string): string | null {
  const lower = breed.toLowerCase();
  // Try exact match first
  for (const [key, val] of Object.entries(DOG_BREED_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function makePhoto(url: string): PetPhoto {
  return { small: url, medium: url, large: url, full: url };
}

async function fetchDogPhoto(breed: string): Promise<PetPhoto | null> {
  const mapped = findDogCeoBreed(breed);
  const endpoint = mapped
    ? `https://dog.ceo/api/breed/${mapped}/images/random`
    : 'https://dog.ceo/api/breeds/image/random';

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      // If specific breed fails, try random
      if (mapped) {
        const fallback = await fetch('https://dog.ceo/api/breeds/image/random');
        if (!fallback.ok) return null;
        const data = await fallback.json();
        return data.message ? makePhoto(data.message) : null;
      }
      return null;
    }
    const data = await res.json();
    return data.message ? makePhoto(data.message) : null;
  } catch {
    return null;
  }
}

async function fetchCatPhoto(): Promise<PetPhoto | null> {
  try {
    const res = await fetch('https://api.thecatapi.com/v1/images/search?limit=1');
    if (!res.ok) return null;
    const data = await res.json();
    if (data[0]?.url) return makePhoto(data[0].url);
    return null;
  } catch {
    return null;
  }
}

/**
 * Get a photo for a pet based on species + breed.
 * Returns cached result if available.
 */
export async function getBreedPhoto(
  species: string,
  breed: string,
): Promise<PetPhoto | null> {
  const key = `${species}:${breed}`.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  let photo: PetPhoto | null = null;
  const lower = species.toLowerCase();

  if (lower === 'dog') {
    photo = await fetchDogPhoto(breed);
  } else if (lower === 'cat') {
    photo = await fetchCatPhoto();
  }

  cache.set(key, photo);
  return photo;
}

/**
 * Enrich an array of pets with breed photos in parallel.
 * Mutates the pets array for efficiency.
 */
export async function enrichWithPhotos<T extends { photos: PetPhoto[]; species: string; breeds: { primary: string | null } }>(
  pets: T[],
): Promise<T[]> {
  const petsNeedingPhotos = pets.filter((p) => p.photos.length === 0);
  if (petsNeedingPhotos.length === 0) return pets;

  // Dedupe by species+breed to minimize API calls
  const uniqueBreeds = new Map<string, { species: string; breed: string }>();
  for (const p of petsNeedingPhotos) {
    const key = `${p.species}:${p.breeds.primary ?? 'unknown'}`.toLowerCase();
    if (!uniqueBreeds.has(key)) {
      uniqueBreeds.set(key, { species: p.species, breed: p.breeds.primary ?? 'unknown' });
    }
  }

  // Fetch all unique breeds in parallel
  await Promise.all(
    Array.from(uniqueBreeds.values()).map(({ species, breed }) =>
      getBreedPhoto(species, breed),
    ),
  );

  // Assign cached photos to pets
  for (const p of petsNeedingPhotos) {
    const key = `${p.species}:${p.breeds.primary ?? 'unknown'}`.toLowerCase();
    const photo = cache.get(key);
    if (photo) p.photos = [photo];
  }

  return pets;
}
