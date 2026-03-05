/**
 * Pet Data API — Smart Router
 *
 * Primary:  RescueGroups.org API v5 (requires API key)
 * Fallback: Austin Animal Center via Socrata SODA API (free, no key needed)
 *
 * When EXPO_PUBLIC_RESCUEGROUPS_API_KEY is not set, automatically falls back
 * to live municipal shelter data from Austin Animal Center.
 */

import { PETFINDER_API_KEY, PETFINDER_BASE_URL } from '../config/env';
import * as Socrata from './socrata';
import type {
  PetfinderAnimalsResponse,
  PetfinderAnimalResponse,
  PetfinderBreedsResponse,
  PetfinderOrganizationsResponse,
  SearchFilters,
  Pet,
  PetPhoto,
  Organization,
  PetfinderPagination,
} from '../types';

/** True when a RescueGroups API key is configured */
const HAS_RG_KEY = !!PETFINDER_API_KEY && PETFINDER_API_KEY !== 'your-rescuegroups-api-key';

// ─── RescueGroups response types ─────────────────────────────────────────────

interface RGAnimalAttributes {
  name: string;
  breedPrimary: string | null;
  breedSecondary: string | null;
  breedPrimaryId: number | null;
  species: string | null;
  sex: string | null;
  ageGroup: string | null;
  sizeGroup: string | null;
  colorDetails: string | null;
  coatLength: string | null;
  descriptionText: string | null;
  pictureThumbnailUrl: string | null;
  pictureUrl: string | null;
  isSpecialNeeds: boolean | null;
  isNeedingFoster: boolean | null;
  distance: number | null;
  citystate: string | null;
  locationPostalcode: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  url: string | null;
  adoptedDate: string | null;
  birthDate: string | null;
  foundDate: string | null;
  createdDate: string | null;
  updatedDate: string | null;
  isHousetrained: string | null;
  isOKWithCats: string | null;
  isOKWithDogs: string | null;
  isOKWithKids: string | null;
  isDeclawed: string | null;
  isMicrochipped: string | null;
  isCurrentVaccinations: string | null;
  isAltered: string | null;
  qualities: string[] | null;
  activityLevel: string | null;
  indoorOutdoor: string | null;
  newPeopleReaction: string | null;
  obedienceTraining: string | null;
  organizationId: string | null;
  [key: string]: any;
}

interface RGEntity<T> {
  type: string;
  id: string;
  attributes: T;
  relationships?: any;
}

interface RGMeta {
  count: number;
  countReturned: number;
  pageReturned: number;
  limit: number;
  pages: number;
}

interface RGResponse<T> {
  data: RGEntity<T>[];
  meta: RGMeta;
  included?: RGEntity<any>[];
}

interface RGSingleResponse<T> {
  data: RGEntity<T>;
  included?: RGEntity<any>[];
}

interface RGOrgAttributes {
  name: string;
  email: string | null;
  phone: string | null;
  url: string | null;
  website: string | null;
  missionStatement: string | null;
  city: string | null;
  state: string | null;
  postalcode: string | null;
  country: string | null;
  distance: number | null;
  [key: string]: any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE = PETFINDER_BASE_URL; // We reuse the env var name
const API_KEY = PETFINDER_API_KEY;

const headers = (): Record<string, string> => ({
  Authorization: API_KEY,
  'Content-Type': 'application/vnd.api+json',
});

function mapAnimalToPet(entity: RGEntity<RGAnimalAttributes>): Pet {
  const a = entity.attributes;
  const photo: PetPhoto | null =
    a.pictureUrl || a.pictureThumbnailUrl
      ? {
          small: a.pictureThumbnailUrl ?? a.pictureUrl ?? '',
          medium: a.pictureUrl ?? a.pictureThumbnailUrl ?? '',
          large: a.pictureUrl ?? '',
          full: a.pictureUrl ?? '',
        }
      : null;

  return {
    id: parseInt(entity.id, 10),
    organization_id: a.organizationId ?? '',
    url: a.url ?? `https://www.rescuegroups.org/animals/${entity.id}`,
    type: a.species ?? 'Unknown',
    species: a.species ?? 'Unknown',
    breeds: {
      primary: a.breedPrimary ?? null,
      secondary: a.breedSecondary ?? null,
      mixed: !!(a.breedPrimary && a.breedSecondary),
      unknown: !a.breedPrimary,
    },
    colors: {
      primary: a.colorDetails ?? null,
      secondary: null,
      tertiary: null,
    },
    age: mapAge(a.ageGroup),
    gender: mapGender(a.sex),
    size: mapSize(a.sizeGroup),
    coat: a.coatLength ?? null,
    name: a.name ?? 'Unknown',
    description: a.descriptionText ?? null,
    photos: photo ? [photo] : [],
    videos: [],
    status: 'adoptable',
    attributes: {
      spayed_neutered: a.isAltered === 'Yes',
      house_trained: a.isHousetrained === 'Yes',
      declawed: a.isDeclawed === 'Yes' ? true : null,
      special_needs: a.isSpecialNeeds === true,
      shots_current: a.isCurrentVaccinations === 'Yes',
    },
    environment: {
      children: a.isOKWithKids === 'Yes' ? true : a.isOKWithKids === 'No' ? false : null,
      dogs: a.isOKWithDogs === 'Yes' ? true : a.isOKWithDogs === 'No' ? false : null,
      cats: a.isOKWithCats === 'Yes' ? true : a.isOKWithCats === 'No' ? false : null,
    },
    tags: a.qualities ?? [],
    contact: {
      email: null,
      phone: null,
      address: {
        address1: a.locationAddress ?? null,
        address2: null,
        city: a.locationCity ?? '',
        state: a.locationState ?? '',
        postcode: a.locationPostalcode ?? '',
        country: a.locationCountry ?? 'US',
      },
    },
    published_at: a.createdDate ?? new Date().toISOString(),
    distance: a.distance ?? null,
  };
}

function mapAge(age: string | null): Pet['age'] {
  if (!age) return 'Adult';
  const lower = age.toLowerCase();
  if (lower === 'baby') return 'Baby';
  if (lower === 'young') return 'Young';
  if (lower === 'senior') return 'Senior';
  return 'Adult';
}

function mapGender(sex: string | null): Pet['gender'] {
  if (!sex) return 'Unknown';
  const lower = sex.toLowerCase();
  if (lower === 'male') return 'Male';
  if (lower === 'female') return 'Female';
  return 'Unknown';
}

function mapSize(size: string | null): Pet['size'] {
  if (!size) return 'Medium';
  const lower = size.toLowerCase();
  if (lower.includes('small')) return 'Small';
  if (lower.includes('large') || lower.includes('x-large')) return 'Large';
  if (lower.includes('extra')) return 'Extra Large';
  return 'Medium';
}

function mapSpecies(type: string | null): string {
  if (!type) return '';
  const map: Record<string, string> = {
    'Dog': 'dogs',
    'Cat': 'cats',
    'Rabbit': 'rabbits',
    'Bird': 'birds',
    'Small & Furry': 'small-furry',
    'Horse': 'horses',
    'Barnyard': 'barnyard',
    'Scales, Fins & Other': 'scales-fins-other',
  };
  return map[type] ?? '';
}

// ─── Public API (routes to RescueGroups or Socrata fallback) ─────────────────

export async function searchAnimals(
  filters: SearchFilters,
  page = 1,
): Promise<PetfinderAnimalsResponse> {
  if (!HAS_RG_KEY) return Socrata.searchAnimals(filters, page);
  const speciesPath = filters.type ? mapSpecies(filters.type) : '';
  const endpoint = speciesPath
    ? `/public/animals/search/available/${speciesPath}/`
    : '/public/animals/search/available/';

  // Build filters array
  const rgFilters: any[] = [];

  if (filters.breed) {
    rgFilters.push({
      fieldName: 'animals.breedPrimary',
      operation: 'contains',
      criteria: filters.breed,
    });
  }
  if (filters.age) {
    rgFilters.push({
      fieldName: 'animals.ageGroup',
      operation: 'equals',
      criteria: filters.age,
    });
  }
  if (filters.size) {
    const sizeMap: Record<string, string> = {
      'Small': 'Small',
      'Medium': 'Medium',
      'Large': 'Large',
      'Extra Large': 'X-Large',
    };
    rgFilters.push({
      fieldName: 'animals.sizeGroup',
      operation: 'equals',
      criteria: sizeMap[filters.size] ?? filters.size,
    });
  }
  if (filters.gender && filters.gender !== 'Unknown') {
    rgFilters.push({
      fieldName: 'animals.sex',
      operation: 'equals',
      criteria: filters.gender,
    });
  }
  if (filters.color) {
    rgFilters.push({
      fieldName: 'animals.colorDetails',
      operation: 'contains',
      criteria: filters.color,
    });
  }
  if (filters.coat) {
    rgFilters.push({
      fieldName: 'animals.coatLength',
      operation: 'contains',
      criteria: filters.coat,
    });
  }
  if (filters.goodWithChildren === true) {
    rgFilters.push({
      fieldName: 'animals.isOKWithKids',
      operation: 'equals',
      criteria: 'Yes',
    });
  }
  if (filters.goodWithDogs === true) {
    rgFilters.push({
      fieldName: 'animals.isOKWithDogs',
      operation: 'equals',
      criteria: 'Yes',
    });
  }
  if (filters.goodWithCats === true) {
    rgFilters.push({
      fieldName: 'animals.isOKWithCats',
      operation: 'equals',
      criteria: 'Yes',
    });
  }
  if (filters.houseTrained === true) {
    rgFilters.push({
      fieldName: 'animals.isHousetrained',
      operation: 'equals',
      criteria: 'Yes',
    });
  }
  if (filters.specialNeeds === true) {
    rgFilters.push({
      fieldName: 'animals.isSpecialNeeds',
      operation: 'equals',
      criteria: true,
    });
  }

  // Sort mapping
  let sort = '+animals.distance';
  if (filters.sort === 'recent') sort = '-animals.updatedDate';
  else if (filters.sort === '-distance') sort = '-animals.distance';
  else if (filters.sort === 'random') sort = 'random';

  const params = new URLSearchParams({
    limit: '24',
    page: String(page),
    sort,
  });

  const body: any = { data: {} };
  if (rgFilters.length > 0) body.data.filters = rgFilters;

  // Location / radius
  if (filters.location) {
    body.data.filterRadius = {
      miles: filters.distance,
      postalcode: filters.location,
    };
  }

  const url = `${BASE}${endpoint}?${params.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`RescueGroups search: ${res.status}`);
  const json: RGResponse<RGAnimalAttributes> = await res.json();

  return {
    animals: (json.data ?? []).map(mapAnimalToPet),
    pagination: {
      count_per_page: json.meta?.limit ?? 24,
      total_count: json.meta?.count ?? 0,
      current_page: json.meta?.pageReturned ?? page,
      total_pages: json.meta?.pages ?? 1,
    },
  };
}

export async function getAnimal(id: number): Promise<PetfinderAnimalResponse> {
  if (!HAS_RG_KEY) return Socrata.getAnimal(id);
  const res = await fetch(`${BASE}/public/animals/${id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`RescueGroups animal ${id}: ${res.status}`);
  const json: RGSingleResponse<RGAnimalAttributes> = await res.json();
  return { animal: mapAnimalToPet(json.data) };
}

export async function getBreeds(type: string): Promise<PetfinderBreedsResponse> {
  if (!HAS_RG_KEY) return Socrata.getBreeds(type);
  // RescueGroups doesn't have a separate breeds endpoint in v5 public API
  // so we search for distinct breeds by species
  const speciesPath = mapSpecies(type);
  const endpoint = speciesPath
    ? `/public/animals/breeds/search/${speciesPath}/`
    : '/public/animals/breeds/';

  try {
    const res = await fetch(`${BASE}${endpoint}?limit=250`, {
      headers: headers(),
    });

    if (res.ok) {
      const json = await res.json();
      const breeds = (json.data ?? []).map((b: any) => ({
        name: b.attributes?.name ?? b.attributes?.breedName ?? b.id ?? 'Unknown',
      }));
      return { breeds };
    }
  } catch {
    // Fall through to empty
  }

  // Fallback: return empty — the filter still works via text search
  return { breeds: [] };
}

export async function searchOrganizations(
  location: string,
  distance: number,
  page = 1,
): Promise<PetfinderOrganizationsResponse> {
  if (!HAS_RG_KEY) return Socrata.searchOrganizations(location, distance, page);
  const body = {
    data: {
      filterRadius: {
        miles: distance,
        postalcode: location,
      },
    },
  };

  const params = new URLSearchParams({
    limit: '20',
    page: String(page),
    sort: '+orgs.distance',
  });

  const res = await fetch(
    `${BASE}/public/orgs/search/?${params.toString()}`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) throw new Error(`RescueGroups orgs: ${res.status}`);
  const json: RGResponse<RGOrgAttributes> = await res.json();

  const organizations: Organization[] = (json.data ?? []).map((e) => {
    const a = e.attributes;
    return {
      id: e.id,
      name: a.name ?? 'Unknown',
      email: a.email ?? null,
      phone: a.phone ?? null,
      url: a.url ?? `https://www.rescuegroups.org/orgs/${e.id}`,
      website: a.website ?? null,
      mission_statement: a.missionStatement ?? null,
      address: {
        address1: null,
        address2: null,
        city: a.city ?? '',
        state: a.state ?? '',
        postcode: a.postalcode ?? '',
        country: a.country ?? 'US',
      },
      hours: {},
      social_media: {},
      photos: [],
      distance: a.distance ?? null,
    };
  });

  return {
    organizations,
    pagination: {
      count_per_page: json.meta?.limit ?? 20,
      total_count: json.meta?.count ?? 0,
      current_page: json.meta?.pageReturned ?? page,
      total_pages: json.meta?.pages ?? 1,
    },
  };
}
