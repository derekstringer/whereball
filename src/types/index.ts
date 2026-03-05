// ─── Pet Types (Petfinder API v2) ────────────────────────────────────────────

export interface Pet {
  id: number;
  organization_id: string;
  url: string;
  type: string;
  species: string;
  breeds: {
    primary: string | null;
    secondary: string | null;
    mixed: boolean;
    unknown: boolean;
  };
  colors: {
    primary: string | null;
    secondary: string | null;
    tertiary: string | null;
  };
  age: PetAge;
  gender: PetGender;
  size: PetSize;
  coat: string | null;
  name: string;
  description: string | null;
  photos: PetPhoto[];
  videos: PetVideo[];
  status: 'adoptable' | 'adopted' | 'found';
  attributes: {
    spayed_neutered: boolean;
    house_trained: boolean;
    declawed: boolean | null;
    special_needs: boolean;
    shots_current: boolean;
  };
  environment: {
    children: boolean | null;
    dogs: boolean | null;
    cats: boolean | null;
  };
  tags: string[];
  contact: {
    email: string | null;
    phone: string | null;
    address: {
      address1: string | null;
      address2: string | null;
      city: string;
      state: string;
      postcode: string;
      country: string;
    };
  };
  published_at: string;
  distance: number | null;
}

export interface PetPhoto {
  small: string;
  medium: string;
  large: string;
  full: string;
}

export interface PetVideo {
  embed: string;
}

export type PetAge = 'Baby' | 'Young' | 'Adult' | 'Senior';
export type PetGender = 'Male' | 'Female' | 'Unknown';
export type PetSize = 'Small' | 'Medium' | 'Large' | 'Extra Large';
export type PetSpecies =
  | 'Dog'
  | 'Cat'
  | 'Rabbit'
  | 'Bird'
  | 'Small & Furry'
  | 'Horse'
  | 'Barnyard'
  | 'Scales, Fins & Other';

export const ALL_SPECIES: PetSpecies[] = [
  'Dog', 'Cat', 'Rabbit', 'Bird', 'Small & Furry',
  'Horse', 'Barnyard', 'Scales, Fins & Other',
];

export const SPECIES_EMOJI: Record<PetSpecies, string> = {
  'Dog': '🐕',
  'Cat': '🐈',
  'Rabbit': '🐇',
  'Bird': '🐦',
  'Small & Furry': '🐹',
  'Horse': '🐴',
  'Barnyard': '🐔',
  'Scales, Fins & Other': '🐢',
};

// ─── Organization / Shelter ──────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  url: string;
  website: string | null;
  mission_statement: string | null;
  address: {
    address1: string | null;
    address2: string | null;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  hours: Record<string, string | null>;
  social_media: Record<string, string | null>;
  photos: PetPhoto[];
  distance: number | null;
}

// ─── Search Filters ──────────────────────────────────────────────────────────

export interface SearchFilters {
  type: PetSpecies | null;
  breed: string | null;
  size: PetSize | null;
  gender: PetGender | null;
  age: PetAge | null;
  coat: string | null;
  color: string | null;
  location: string;
  distance: number;
  sort: 'recent' | 'distance' | '-distance' | 'random';
  goodWithChildren: boolean | null;
  goodWithDogs: boolean | null;
  goodWithCats: boolean | null;
  houseTrained: boolean | null;
  specialNeeds: boolean | null;
}

export const DEFAULT_FILTERS: SearchFilters = {
  type: null,
  breed: null,
  size: null,
  gender: null,
  age: null,
  coat: null,
  color: null,
  location: '76301',
  distance: 25,
  sort: 'distance',
  goodWithChildren: null,
  goodWithDogs: null,
  goodWithCats: null,
  houseTrained: null,
  specialNeeds: null,
};

export const DISTANCE_OPTIONS = [10, 25, 50, 100, 250, 500];

// ─── API Response Types ──────────────────────────────────────────────────────

export interface PetfinderPagination {
  count_per_page: number;
  total_count: number;
  current_page: number;
  total_pages: number;
}

export interface PetfinderAnimalsResponse {
  animals: Pet[];
  pagination: PetfinderPagination;
}

export interface PetfinderAnimalResponse {
  animal: Pet;
}

export interface PetfinderBreedsResponse {
  breeds: { name: string }[];
}

export interface PetfinderTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
}

export interface PetfinderOrganizationsResponse {
  organizations: Organization[];
  pagination: PetfinderPagination;
}

// ─── User Types ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  default_location: string | null;
  default_radius: number;
  created_at: string;
}

export interface FavoritePet {
  id: string;
  user_id: string;
  pet_id: number;
  pet_name: string;
  pet_photo_url: string | null;
  pet_species: string;
  pet_breed: string | null;
  organization_name: string | null;
  saved_at: string;
  notes: string | null;
}

// ─── App State ───────────────────────────────────────────────────────────────

export type ColorMode = 'light' | 'dark' | 'system';

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Main: undefined;
  PetDetail: { petId: number };
  ShelterDetail: { organizationId: string };
};

export type MainTabParamList = {
  Search: undefined;
  Favorites: undefined;
  Shelters: undefined;
  Profile: undefined;
};
