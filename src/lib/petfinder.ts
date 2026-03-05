/**
 * Petfinder API v2 Client
 *
 * Auto-manages OAuth2 token lifecycle. All search methods hit the live API
 * so the app always reflects the latest available pets.
 */

import {
  PETFINDER_API_KEY,
  PETFINDER_API_SECRET,
  PETFINDER_BASE_URL,
} from '../config/env';
import type {
  PetfinderAnimalsResponse,
  PetfinderAnimalResponse,
  PetfinderBreedsResponse,
  PetfinderOrganizationsResponse,
  PetfinderTokenResponse,
  SearchFilters,
} from '../types';

// ─── Token management ────────────────────────────────────────────────────────

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const res = await fetch(`${PETFINDER_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: PETFINDER_API_KEY,
      client_secret: PETFINDER_API_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`Petfinder auth failed: ${res.status}`);

  const data: PetfinderTokenResponse = await res.json();
  accessToken = data.access_token;
  // Expire 60 s early to avoid edge-case 401s
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getToken();
  const url = new URL(`${PETFINDER_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    // Token expired mid-flight — clear and retry once
    accessToken = null;
    tokenExpiry = 0;
    const freshToken = await getToken();
    const retry = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    if (!retry.ok) throw new Error(`Petfinder ${path}: ${retry.status}`);
    return retry.json();
  }

  if (!res.ok) throw new Error(`Petfinder ${path}: ${res.status}`);
  return res.json();
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function searchAnimals(
  filters: SearchFilters,
  page = 1,
): Promise<PetfinderAnimalsResponse> {
  const params: Record<string, string> = {
    location: filters.location,
    distance: String(filters.distance),
    sort: filters.sort,
    page: String(page),
    limit: '24',
  };

  if (filters.type) params.type = filters.type;
  if (filters.breed) params.breed = filters.breed;
  if (filters.size) params.size = filters.size;
  if (filters.gender) params.gender = filters.gender;
  if (filters.age) params.age = filters.age;
  if (filters.coat) params.coat = filters.coat;
  if (filters.color) params.color = filters.color;

  // Compatibility booleans
  if (filters.goodWithChildren === true) params.good_with_children = 'true';
  if (filters.goodWithDogs === true) params.good_with_dogs = 'true';
  if (filters.goodWithCats === true) params.good_with_cats = 'true';
  if (filters.houseTrained === true) params.house_trained = 'true';
  if (filters.specialNeeds === true) params.special_needs = 'true';

  return apiFetch<PetfinderAnimalsResponse>('/animals', params);
}

export async function getAnimal(id: number): Promise<PetfinderAnimalResponse> {
  return apiFetch<PetfinderAnimalResponse>(`/animals/${id}`);
}

export async function getBreeds(type: string): Promise<PetfinderBreedsResponse> {
  return apiFetch<PetfinderBreedsResponse>(`/types/${encodeURIComponent(type)}/breeds`);
}

export async function searchOrganizations(
  location: string,
  distance: number,
  page = 1,
): Promise<PetfinderOrganizationsResponse> {
  return apiFetch<PetfinderOrganizationsResponse>('/organizations', {
    location,
    distance: String(distance),
    page: String(page),
    limit: '20',
    sort: 'distance',
  });
}
