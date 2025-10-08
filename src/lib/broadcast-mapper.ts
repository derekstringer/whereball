/**
 * Broadcast to Service Mapper
 * Maps broadcast networks to streaming service codes
 */

import { STREAMING_SERVICES } from '../constants/services';
import type { NHLGame } from './nhl-api';

// Map broadcast network names to service codes
const NETWORK_TO_SERVICE_MAP: Record<string, string[]> = {
  'espn+': ['espn_plus'],
  'espn': ['youtube_tv', 'hulu_live', 'fubo', 'directv_stream', 'sling'],
  'espn2': ['youtube_tv', 'hulu_live', 'fubo', 'directv_stream', 'sling'],
  'abc': ['youtube_tv', 'hulu_live', 'fubo', 'directv_stream'],
  'tnt': ['youtube_tv', 'hulu_live', 'directv_stream', 'sling', 'max'],
  'tbs': ['youtube_tv', 'hulu_live', 'directv_stream', 'sling', 'max'],
  'nhl network': ['youtube_tv', 'fubo', 'directv_stream'],
  'nbc': ['youtube_tv', 'hulu_live', 'fubo', 'directv_stream', 'peacock'],
  'nbcsn': ['peacock'],
  'cbs': ['youtube_tv', 'hulu_live', 'fubo', 'directv_stream', 'paramount_plus'],
  'prime video': ['prime_video'],
  'apple tv+': ['apple_tv_plus'],
};

/**
 * Get service codes that carry a specific broadcast network
 */
export const getServicesForBroadcast = (networkName: string): string[] => {
  const normalizedNetwork = networkName.toLowerCase().trim();
  
  // Check direct matches
  for (const [key, services] of Object.entries(NETWORK_TO_SERVICE_MAP)) {
    if (normalizedNetwork.includes(key)) {
      return services;
    }
  }
  
  return [];
};

/**
 * Get all service codes that can show a game
 */
export const getServicesForGame = (game: NHLGame): string[] => {
  const allServices = new Set<string>();
  
  game.broadcasts.forEach(broadcast => {
    const services = getServicesForBroadcast(broadcast.network);
    services.forEach(service => allServices.add(service));
  });
  
  return Array.from(allServices);
};

/**
 * Get services that the user has which can show the game
 */
export const getUserServicesForGame = (
  game: NHLGame,
  userServiceCodes: string[]
): string[] => {
  const gameServices = getServicesForGame(game);
  return gameServices.filter(service => userServiceCodes.includes(service));
};

/**
 * Get services the user doesn't have which can show the game
 */
export const getMissingServicesForGame = (
  game: NHLGame,
  userServiceCodes: string[]
): string[] => {
  const gameServices = getServicesForGame(game);
  return gameServices.filter(service => !userServiceCodes.includes(service));
};

/**
 * Get human-readable service names for tooltip
 */
export const getServiceNames = (serviceCodes: string[]): string => {
  const names = serviceCodes
    .map(code => {
      const service = STREAMING_SERVICES.find(s => s.code === code);
      return service?.name;
    })
    .filter(Boolean);
  
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  
  const last = names.pop();
  return `${names.join(', ')}, and ${last}`;
};
