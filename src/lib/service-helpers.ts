/**
 * Service Helper Functions
 * Utilities for service matching, preferences, and affiliate handling
 */

import { NHLGame } from './nhl-api';
import { getServicesForGame, getUserServicesForGame } from './broadcast-mapper';
import { STREAMING_SERVICES } from '../constants/services';

export interface Service {
  code: string;
  name: string;
}

/**
 * Get the user's preferred service from available options
 * Uses stored preferences or defaults to first subscribed service
 */
export const getPreferredService = (
  game: NHLGame,
  userServiceCodes: string[]
): Service | null => {
  const availableServices = getUserServicesForGame(game, userServiceCodes);
  
  if (availableServices.length === 0) {
    return null;
  }

  // TODO: Check user's preferred service from settings
  // For now, just return the first available
  const serviceCode = availableServices[0];
  const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
  
  if (!service) return null;
  
  return {
    code: service.code,
    name: service.name,
  };
};

/**
 * Get services for a game split into subscribed/unsubscribed
 */
export const getServicesForGameSplit = (
  game: NHLGame,
  userServiceCodes: string[]
): { subscribed: Service[]; unsubscribed: Service[] } => {
  const allServices = getServicesForGame(game);
  
  const subscribed = allServices
    .filter(code => userServiceCodes.includes(code))
    .map(code => {
      const service = STREAMING_SERVICES.find(s => s.code === code);
      return service ? { code: service.code, name: service.name } : null;
    })
    .filter((s): s is Service => s !== null);
  
  const unsubscribed = allServices
    .filter(code => !userServiceCodes.includes(code))
    .map(code => {
      const service = STREAMING_SERVICES.find(s => s.code === code);
      return service ? { code: service.code, name: service.name } : null;
    })
    .filter((s): s is Service => s !== null);
  
  return { subscribed, unsubscribed };
};

/**
 * Handle affiliate CTA - opens affiliate link or service info
 * TODO: Implement actual affiliate tracking
 */
export const affiliateCTA = (serviceCode: string) => {
  console.log(`Affiliate CTA for: ${serviceCode}`);
  // TODO: Open affiliate link with tracking
  // TODO: Track affiliate click event
};

/**
 * Deep link to service app to watch game
 * TODO: Implement actual deep linking
 */
export const deepLinkToService = (serviceCode: string, gameId: string) => {
  console.log(`Deep link to ${serviceCode} for game ${gameId}`);
  // TODO: Construct and open deep link URL
  // TODO: Handle fallback if app not installed
};
