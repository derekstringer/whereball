/**
 * Socrata Open Data (SODA) API Client — Austin Animal Center
 *
 * Free, zero-signup fallback for when no RescueGroups API key is available.
 * Uses the Austin Animal Center's public datasets via the Socrata SODA API.
 *
 * Datasets:
 *   - Intakes:  https://data.austintexas.gov/resource/wter-evkm.json
 *   - Outcomes: https://data.austintexas.gov/resource/9t4d-g238.json
 *
 * We query recent intakes and subtract outcomes to approximate "currently available".
 */

import type {
  PetfinderAnimalsResponse,
  PetfinderAnimalResponse,
  PetfinderBreedsResponse,
  PetfinderOrganizationsResponse,
  SearchFilters,
  Pet,
  PetPhoto,
  Organization,
} from '../types';

// ─── Socrata endpoints ───────────────────────────────────────────────────────

const INTAKES_URL = 'https://data.austintexas.gov/resource/wter-evkm.json';
const OUTCOMES_URL = 'https://data.austintexas.gov/resource/9t4d-g238.json';
const PAGE_SIZE = 24;

// ─── Socrata record types ────────────────────────────────────────────────────

interface SocrataIntake {
  animal_id: string;
  name: string;
  datetime: string;
  found_location: string;
  intake_type: string;
  intake_condition: string;
  animal_type: string;
  sex_upon_intake: string;
  age_upon_intake: string;
  breed: string;
  color: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function parseAge(ageStr: string | undefined): Pet['age'] {
  if (!ageStr) return 'Adult';
  const lower = ageStr.toLowerCase();
  // AAC format: "2 years" / "3 months" / "1 week" etc.
  const match = lower.match(/(\d+)\s*(year|month|week|day)/);
  if (!match) return 'Adult';
  const num = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'year' && num < 1) return 'Baby';
  if (unit === 'month' || unit === 'week' || unit === 'day') {
    if (num <= 6 && (unit === 'month' || unit === 'week' || unit === 'day')) return 'Baby';
    return 'Young';
  }
  if (num <= 2) return 'Young';
  if (num >= 8) return 'Senior';
  return 'Adult';
}

function parseGender(sexStr: string | undefined): Pet['gender'] {
  if (!sexStr) return 'Unknown';
  const lower = sexStr.toLowerCase();
  if (lower.includes('male') && !lower.includes('female')) return 'Male';
  if (lower.includes('female')) return 'Female';
  return 'Unknown';
}

function parseSpecies(animalType: string | undefined): string {
  if (!animalType) return 'Unknown';
  const lower = animalType.toLowerCase();
  if (lower === 'dog') return 'Dog';
  if (lower === 'cat') return 'Cat';
  if (lower === 'bird') return 'Bird';
  if (lower.includes('rabbit') || lower.includes('bunny')) return 'Rabbit';
  return animalType;
}

function parseSize(breed: string | undefined): Pet['size'] {
  if (!breed) return 'Medium';
  const lower = breed.toLowerCase();
  // Rough heuristic based on breed keywords
  if (lower.includes('chihuahua') || lower.includes('miniature') || lower.includes('toy') || lower.includes('yorkie')) return 'Small';
  if (lower.includes('great dane') || lower.includes('mastiff') || lower.includes('saint bernard') || lower.includes('newfoundland')) return 'Large';
  if (lower.includes('lab') || lower.includes('shepherd') || lower.includes('retriever') || lower.includes('husky') || lower.includes('rottweiler')) return 'Large';
  return 'Medium';
}

function mapIntakeToPet(record: SocrataIntake, index: number): Pet {
  const isSpayedNeutered = (record.sex_upon_intake ?? '').toLowerCase().includes('neutered') ||
    (record.sex_upon_intake ?? '').toLowerCase().includes('spayed');

  const breed = record.breed ?? 'Unknown';
  const primaryBreed = breed.split('/')[0]?.trim() ?? breed;
  const secondaryBreed = breed.includes('/') ? breed.split('/')[1]?.trim() ?? null : null;

  return {
    id: hashId(record.animal_id ?? `aac-${index}`),
    organization_id: 'austin-animal-center',
    url: 'https://www.austintexas.gov/austin-animal-center',
    type: parseSpecies(record.animal_type),
    species: parseSpecies(record.animal_type),
    breeds: {
      primary: primaryBreed,
      secondary: secondaryBreed,
      mixed: breed.toLowerCase().includes('mix') || breed.includes('/'),
      unknown: !breed || breed === 'Unknown',
    },
    colors: {
      primary: record.color?.split('/')[0]?.trim() ?? null,
      secondary: record.color?.includes('/') ? record.color.split('/')[1]?.trim() ?? null : null,
      tertiary: null,
    },
    age: parseAge(record.age_upon_intake),
    gender: parseGender(record.sex_upon_intake),
    size: parseSize(breed),
    coat: null,
    name: record.name || 'Unknown',
    description: buildDescription(record),
    photos: [],
    videos: [],
    status: 'adoptable',
    attributes: {
      spayed_neutered: isSpayedNeutered,
      house_trained: false,
      declawed: null,
      special_needs: false,
      shots_current: false,
    },
    environment: {
      children: null,
      dogs: null,
      cats: null,
    },
    tags: [record.intake_type, record.intake_condition].filter(Boolean),
    contact: {
      email: 'animal.srvcinfo@austintexas.gov',
      phone: '(512) 978-0500',
      address: {
        address1: '7201 Levander Loop',
        address2: null,
        city: 'Austin',
        state: 'TX',
        postcode: '78702',
        country: 'US',
      },
    },
    published_at: record.datetime ?? new Date().toISOString(),
    distance: null,
  };
}

function buildDescription(record: SocrataIntake): string {
  const parts: string[] = [];
  if (record.name) parts.push(`Meet ${record.name}!`);
  if (record.breed) parts.push(`Breed: ${record.breed}.`);
  if (record.color) parts.push(`Color: ${record.color}.`);
  if (record.age_upon_intake) parts.push(`Age at intake: ${record.age_upon_intake}.`);
  if (record.intake_condition) parts.push(`Condition: ${record.intake_condition}.`);
  if (record.found_location) parts.push(`Found near: ${record.found_location}.`);
  parts.push('Available at Austin Animal Center. Call (512) 978-0500 for info.');
  return parts.join(' ');
}

/** Simple numeric hash from a string ID */
function hashId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── SODA query helpers ──────────────────────────────────────────────────────

function buildWhereClause(filters: SearchFilters): string {
  const clauses: string[] = [];

  // Only recent intakes (last 90 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  clauses.push(`datetime > '${cutoff.toISOString().slice(0, 10)}'`);

  // Species filter
  if (filters.type) {
    const typeMap: Record<string, string> = {
      'Dog': 'Dog',
      'Cat': 'Cat',
      'Bird': 'Bird',
      'Rabbit': 'Rabbit',
    };
    const mapped = typeMap[filters.type];
    if (mapped) clauses.push(`animal_type = '${mapped}'`);
  }

  // Gender filter
  if (filters.gender && filters.gender !== 'Unknown') {
    const genderStr = filters.gender === 'Male' ? 'Male' : 'Female';
    clauses.push(`sex_upon_intake LIKE '%${genderStr}%'`);
  }

  // Breed filter
  if (filters.breed) {
    clauses.push(`breed LIKE '%${filters.breed.replace(/'/g, "''")}%'`);
  }

  // Color filter
  if (filters.color) {
    clauses.push(`color LIKE '%${filters.color.replace(/'/g, "''")}%'`);
  }

  // Only animals in normal condition (exclude "dead", "euthanasia request", etc.)
  clauses.push(`intake_condition NOT IN ('Dead', 'Euthanasia Request')`);

  return clauses.join(' AND ');
}

// ─── Public API (matches petfinder.ts interface) ─────────────────────────────

export async function searchAnimals(
  filters: SearchFilters,
  page = 1,
): Promise<PetfinderAnimalsResponse> {
  const offset = (page - 1) * PAGE_SIZE;
  const where = buildWhereClause(filters);

  // Get recent intake IDs that have an outcome (meaning they left the shelter)
  // We'll subtract these from our intake results
  const outcomeParams = new URLSearchParams({
    $select: 'animal_id',
    $where: where.split(' AND ')[0], // just the date filter
    $limit: '5000',
  });

  const intakeParams = new URLSearchParams({
    $where: where,
    $order: 'datetime DESC',
    $limit: String(PAGE_SIZE),
    $offset: String(offset),
  });

  const [intakeRes, outcomeRes] = await Promise.all([
    fetch(`${INTAKES_URL}?${intakeParams}`),
    fetch(`${OUTCOMES_URL}?${outcomeParams}`),
  ]);

  if (!intakeRes.ok) throw new Error(`Austin Animal Center intakes: ${intakeRes.status}`);

  const intakes: SocrataIntake[] = await intakeRes.json();

  // Build set of animal IDs that have had outcomes (already adopted/returned/etc.)
  let outcomIds = new Set<string>();
  if (outcomeRes.ok) {
    const outcomes: { animal_id: string }[] = await outcomeRes.json();
    outcomIds = new Set(outcomes.map((o) => o.animal_id));
  }

  // Filter to animals still in the shelter (no outcome yet)
  const available = intakes.filter((r) => !outcomIds.has(r.animal_id));

  // Apply age filter in-memory (SODA doesn't support our age parsing)
  const filtered = filters.age
    ? available.filter((r) => parseAge(r.age_upon_intake) === filters.age)
    : available;

  const pets = filtered.map(mapIntakeToPet);

  // We don't know exact total from SODA without a separate count query, approximate it
  const hasMore = intakes.length === PAGE_SIZE;

  return {
    animals: pets,
    pagination: {
      count_per_page: PAGE_SIZE,
      total_count: hasMore ? (page + 1) * PAGE_SIZE : page * pets.length,
      current_page: page,
      total_pages: hasMore ? page + 1 : page,
    },
  };
}

export async function getAnimal(id: number): Promise<PetfinderAnimalResponse> {
  // SODA doesn't have a single-record lookup by our hashed ID.
  // Fetch recent intakes and find by hash match.
  const params = new URLSearchParams({
    $order: 'datetime DESC',
    $limit: '200',
  });

  const res = await fetch(`${INTAKES_URL}?${params}`);
  if (!res.ok) throw new Error(`Austin Animal Center: ${res.status}`);
  const intakes: SocrataIntake[] = await res.json();

  const match = intakes.find((r, i) => hashId(r.animal_id ?? `aac-${i}`) === id);
  if (!match) throw new Error(`Animal ${id} not found`);

  return { animal: mapIntakeToPet(match, 0) };
}

export async function getBreeds(_type: string): Promise<PetfinderBreedsResponse> {
  // Query distinct breeds from recent intakes
  const typeMap: Record<string, string> = {
    'Dog': 'Dog',
    'Cat': 'Cat',
    'Bird': 'Bird',
    'Rabbit': 'Rabbit',
  };
  const mapped = typeMap[_type] ?? _type;

  const params = new URLSearchParams({
    $select: 'breed',
    $where: `animal_type = '${mapped}'`,
    $group: 'breed',
    $order: 'breed',
    $limit: '250',
  });

  try {
    const res = await fetch(`${INTAKES_URL}?${params}`);
    if (!res.ok) return { breeds: [] };
    const data: { breed: string }[] = await res.json();
    return {
      breeds: data.map((d) => ({ name: d.breed })),
    };
  } catch {
    return { breeds: [] };
  }
}

export async function searchOrganizations(
  _location: string,
  _distance: number,
  _page = 1,
): Promise<PetfinderOrganizationsResponse> {
  // Austin Animal Center is the only "organization" in this data source
  const aac: Organization = {
    id: 'austin-animal-center',
    name: 'Austin Animal Center',
    email: 'animal.srvcinfo@austintexas.gov',
    phone: '(512) 978-0500',
    url: 'https://www.austintexas.gov/austin-animal-center',
    website: 'https://www.austintexas.gov/austin-animal-center',
    mission_statement:
      'Austin Animal Center is the largest no-kill municipal shelter in the nation, sheltering over 18,000 animals each year.',
    address: {
      address1: '7201 Levander Loop',
      address2: null,
      city: 'Austin',
      state: 'TX',
      postcode: '78702',
      country: 'US',
    },
    hours: {
      Monday: '11am-7pm',
      Tuesday: '11am-7pm',
      Wednesday: '11am-7pm',
      Thursday: '11am-7pm',
      Friday: '11am-7pm',
      Saturday: '11am-7pm',
      Sunday: '11am-7pm',
    },
    social_media: {},
    photos: [],
    distance: null,
  };

  return {
    organizations: [aac],
    pagination: {
      count_per_page: 20,
      total_count: 1,
      current_page: 1,
      total_pages: 1,
    },
  };
}
