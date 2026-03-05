/**
 * Pet photo enrichment — two-tier strategy:
 *
 * 1. Cloudflare Worker (scrapes real photos from 24PetConnect)
 * 2. Breed-based fallback (Dog CEO / TheCatAPI) if worker returns nothing
 *
 * Results are cached in-memory per animal ID and per breed.
 */

import type { PetPhoto } from '../types';
import { PHOTO_WORKER_URL } from '../config/env';

const breedCache = new Map<string, PetPhoto | null>();

function makePhoto(url: string): PetPhoto {
  return { small: url, medium: url, large: url, full: url };
}

// ─── Tier 1: Cloudflare Worker (real photos) ────────────────────────────────

async function fetchWorkerPhotos(
  animalIds: string[],
): Promise<Record<string, string[]>> {
  if (!PHOTO_WORKER_URL || animalIds.length === 0) return {};

  try {
    const url = `${PHOTO_WORKER_URL}/batch?ids=${animalIds.join(',')}`;
    const res = await fetch(url);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

// ─── Tier 2: Breed-based fallback ───────────────────────────────────────────

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
  staffordshire: 'staffordshire/bull',
};

function findDogCeoBreed(breed: string): string | null {
  const lower = breed.toLowerCase();
  for (const [key, val] of Object.entries(DOG_BREED_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

async function fetchBreedPhoto(species: string, breed: string): Promise<PetPhoto | null> {
  const key = `${species}:${breed}`.toLowerCase();
  if (breedCache.has(key)) return breedCache.get(key) ?? null;

  let photo: PetPhoto | null = null;
  const lower = species.toLowerCase();

  if (lower === 'dog') {
    const mapped = findDogCeoBreed(breed);
    const endpoint = mapped
      ? `https://dog.ceo/api/breed/${mapped}/images/random`
      : 'https://dog.ceo/api/breeds/image/random';
    try {
      let res = await fetch(endpoint);
      if (!res.ok && mapped) {
        res = await fetch('https://dog.ceo/api/breeds/image/random');
      }
      if (res.ok) {
        const data = await res.json();
        if (data.message) photo = makePhoto(data.message);
      }
    } catch { /* ignore */ }
  } else if (lower === 'cat') {
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search?limit=1');
      if (res.ok) {
        const data = await res.json();
        if (data[0]?.url) photo = makePhoto(data[0].url);
      }
    } catch { /* ignore */ }
  }

  breedCache.set(key, photo);
  return photo;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getBreedPhoto(species: string, breed: string): Promise<PetPhoto | null> {
  return fetchBreedPhoto(species, breed);
}

/**
 * Enrich pets with real photos from the Cloudflare Worker, then fall back
 * to breed-based photos for any that the worker couldn't find.
 *
 * Each pet must have an `_animalId` field (the original AAC animal_id string
 * like "A123456") for the worker lookup to work.
 */
export async function enrichWithPhotos<
  T extends {
    photos: PetPhoto[];
    species: string;
    breeds: { primary: string | null };
    _animalId?: string;
  },
>(pets: T[]): Promise<T[]> {
  const petsNeedingPhotos = pets.filter((p) => p.photos.length === 0);
  if (petsNeedingPhotos.length === 0) return pets;

  // ── Tier 1: Cloudflare Worker batch lookup ──
  const idsForWorker = petsNeedingPhotos
    .map((p) => p._animalId)
    .filter((id): id is string => !!id);

  if (idsForWorker.length > 0) {
    const workerResults = await fetchWorkerPhotos(idsForWorker);
    for (const p of petsNeedingPhotos) {
      if (p._animalId && workerResults[p._animalId]?.length > 0) {
        p.photos = workerResults[p._animalId].map(makePhoto);
      }
    }
  }

  // ── Tier 2: Breed fallback for any still without photos ──
  const stillNeedPhotos = petsNeedingPhotos.filter((p) => p.photos.length === 0);
  if (stillNeedPhotos.length > 0) {
    const uniqueBreeds = new Map<string, { species: string; breed: string }>();
    for (const p of stillNeedPhotos) {
      const key = `${p.species}:${p.breeds.primary ?? 'unknown'}`.toLowerCase();
      if (!uniqueBreeds.has(key)) {
        uniqueBreeds.set(key, { species: p.species, breed: p.breeds.primary ?? 'unknown' });
      }
    }

    await Promise.all(
      Array.from(uniqueBreeds.values()).map(({ species, breed }) =>
        fetchBreedPhoto(species, breed),
      ),
    );

    for (const p of stillNeedPhotos) {
      const key = `${p.species}:${p.breeds.primary ?? 'unknown'}`.toLowerCase();
      const photo = breedCache.get(key);
      if (photo) p.photos = [photo];
    }
  }

  return pets;
}
