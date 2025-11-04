/**
 * NHL API Service
 * Fetches schedule and game data from NHL's public API
 */

// Request cache to prevent duplicate API calls
const requestCache = new Map<string, { data: any; timestamp: number; is404: boolean }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for successful fetches
const CACHE_DURATION_404 = 24 * 60 * 60 * 1000; // 24 hours for 404s (don't retry)
const pendingRequests = new Map<string, Promise<any>>();

// Date range validation - prevent API calls that will definitely 404
const isDateInValidRange = (dateString: string): boolean => {
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // NHL removes game data older than 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Games aren't scheduled more than 120 days out
  const maxFuture = new Date(today);
  maxFuture.setDate(maxFuture.getDate() + 120);
  
  // NHL season typically runs Sep-June (allow Jul-Aug for playoffs)
  const month = targetDate.getMonth(); // 0-11
  const year = targetDate.getFullYear();
  
  // Block dates outside valid range
  if (targetDate < sevenDaysAgo || targetDate > maxFuture) {
    return false;
  }
  
  return true;
};

// Helper to get cached data or make new request
const cachedFetch = async (url: string, cacheKey: string): Promise<any> => {
  // Check if we have a valid cached response
  const cached = requestCache.get(cacheKey);
  if (cached) {
    // Check if it's a cached 404
    if (cached.is404) {
      // Don't retry 404s for 24 hours
      if (Date.now() - cached.timestamp < CACHE_DURATION_404) {
        return cached.data;
      }
    } else {
      // Normal successful response cache
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
  }
  
  // Check if there's already a pending request for this URL
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }
  
  // Make new request
  const promise = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        // If 404, cache it so we don't retry
        if (response.status === 404) {
          const emptyData = { gameWeek: [] };
          requestCache.set(cacheKey, {
            data: emptyData,
            timestamp: Date.now(),
            is404: true,
          });
          pendingRequests.delete(cacheKey);
          return emptyData;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Cache the successful response
      requestCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        is404: false,
      });
      
      // Clean up pending request
      pendingRequests.delete(cacheKey);
      
      return data;
    })
    .catch((error) => {
      // Clean up pending request on error
      pendingRequests.delete(cacheKey);
      throw error;
    });
  
  // Store as pending
  pendingRequests.set(cacheKey, promise);
  
  return promise;
};

export interface NHLGame {
  id: string;
  gameDate: string;
  startTime: string;
  homeTeam: {
    id: number;
    name: string;
    abbreviation: string;
    score?: number; // Optional: only present for LIVE/FINAL games
  };
  awayTeam: {
    id: number;
    name: string;
    abbreviation: string;
    score?: number; // Optional: only present for LIVE/FINAL games
  };
  venue: string;
  gameState: 'FUT' | 'LIVE' | 'FINAL' | 'OFF';
  broadcasts: Array<{
    network: string;
    type: 'national' | 'home' | 'away';
  }>;
  clock?: {
    timeRemaining: string;  // "12:34" format
    period: number;         // 1, 2, 3, 4+ (OT periods)
    periodType: 'REG' | 'OT' | 'SO';
    inIntermission: boolean;
    periodOrdinal: string;  // "1st", "2nd", "3rd", "OT", "2OT", "SO"
  };
}

/**
 * Fetch NHL games for a specific date
 * @param date - Date object or YYYY-MM-DD string (defaults to today)
 */
export const getGamesForDate = async (date?: Date | string): Promise<NHLGame[]> => {
  try {
    let dateString: string;
    
    if (!date) {
      dateString = new Date().toISOString().split('T')[0];
    } else if (typeof date === 'string') {
      dateString = date;
    } else {
      dateString = date.toISOString().split('T')[0];
    }
    
    // PREVENT 404 ERRORS: Skip API call for dates outside valid range
    if (!isDateInValidRange(dateString)) {
      console.log(`[NHL API] Skipping API call for out-of-range date: ${dateString}`);
      return []; // Return empty array immediately, no API call
    }
    
    // Use cached fetch to prevent duplicate API calls
    const url = `https://api-web.nhle.com/v1/schedule/${dateString}`;
    const cacheKey = `schedule-${dateString}`;
    const data = await cachedFetch(url, cacheKey);
    
    // Transform API response to our format
    const games: NHLGame[] = [];
    
    if (data.gameWeek && data.gameWeek.length > 0) {
      for (const week of data.gameWeek) {
        if (week.games) {
          for (const game of week.games) {
            // Use the game's actual date, not the queried date
            const gameDateStr = game.gameDate || week.date || dateString;
            
            // IMPORTANT: Only include games that match the queried date
            // NHL API returns a gameWeek which may include multiple days
            if (gameDateStr !== dateString) {
              continue; // Skip games from other days
            }
            
            // Parse scores for live/final games
            const homeScore = game.homeTeam.score;
            const awayScore = game.awayTeam.score;
            
            // Parse clock data for live games
            let clock: NHLGame['clock'] = undefined;
            if (game.gameState === 'LIVE') {
              // NHL API may have clock data in different places
              const period = game.period || game.periodDescriptor?.number || 0;
              const periodType = game.periodDescriptor?.periodType || 'REG';
              const isShootout = periodType === 'SO';
              const isOT = periodType === 'OT';
              
              // Determine period ordinal
              let periodOrdinal = '';
              if (isShootout) {
                periodOrdinal = 'SO';
              } else if (isOT) {
                const otNum = period - 3;
                periodOrdinal = otNum === 1 ? 'OT' : `${otNum}OT`;
              } else {
                periodOrdinal = ['1st', '2nd', '3rd'][period - 1] || `${period}th`;
              }
              
              // Extract time remaining (may be in different formats)
              let timeRemaining = '20:00';
              if (game.clock?.timeRemaining) {
                timeRemaining = game.clock.timeRemaining;
              } else if (game.periodDescriptor?.periodTime) {
                timeRemaining = game.periodDescriptor.periodTime;
              }
              
              clock = {
                timeRemaining: timeRemaining,
                period: period,
                periodType: isShootout ? 'SO' : isOT ? 'OT' : 'REG',
                inIntermission: game.clock?.inIntermission || game.periodDescriptor?.inIntermission || false,
                periodOrdinal: periodOrdinal,
              };
            }
            
            games.push({
              id: game.id.toString(),
              gameDate: gameDateStr,
              startTime: game.startTimeUTC,
              homeTeam: {
                id: game.homeTeam.id,
                name: game.homeTeam.placeName.default + ' ' + game.homeTeam.commonName.default,
                abbreviation: game.homeTeam.abbrev,
                score: homeScore,
              },
              awayTeam: {
                id: game.awayTeam.id,
                name: game.awayTeam.placeName.default + ' ' + game.awayTeam.commonName.default,
                abbreviation: game.awayTeam.abbrev,
                score: awayScore,
              },
              venue: game.venue?.default || 'TBD',
              gameState: game.gameState,
              broadcasts: game.tvBroadcasts?.map((b: any) => ({
                network: b.network,
                type: b.market === 'N' ? 'national' : 'home',
              })) || [],
              clock: clock,
            });
          }
        }
      }
    }

    return games;
  } catch (error) {
    console.error('Error fetching NHL games:', error);
    // Return mock data for development if API fails
    return getMockGames();
  }
};

/**
 * Mock games for development/demo
 */
const getMockGames = (): NHLGame[] => {
  const today = new Date();
  const tonight7pm = new Date(today);
  tonight7pm.setHours(19, 0, 0, 0);
  
  const tonight8pm = new Date(today);
  tonight8pm.setHours(20, 0, 0, 0);
  
  return [
    {
      id: 'mock-1',
      gameDate: today.toISOString().split('T')[0],
      startTime: tonight7pm.toISOString(),
      homeTeam: {
        id: 25,
        name: 'Dallas Stars',
        abbreviation: 'DAL',
      },
      awayTeam: {
        id: 3,
        name: 'New York Rangers',
        abbreviation: 'NYR',
      },
      venue: 'American Airlines Center',
      gameState: 'FUT',
      broadcasts: [
        { network: 'ESPN', type: 'national' },
        { network: 'Bally Sports Southwest', type: 'home' },
      ],
    },
    {
      id: 'mock-2',
      gameDate: today.toISOString().split('T')[0],
      startTime: tonight8pm.toISOString(),
      homeTeam: {
        id: 28,
        name: 'Arizona Coyotes',
        abbreviation: 'ARI',
      },
      awayTeam: {
        id: 16,
        name: 'Chicago Blackhawks',
        abbreviation: 'CHI',
      },
      venue: 'Mullett Arena',
      gameState: 'FUT',
      broadcasts: [
        { network: 'ESPN+', type: 'national' },
      ],
    },
  ];
};

/**
 * Fetch NHL games for a date range
 * @param startDate - Start date
 * @param endDate - End date
 */
export const getGamesForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<NHLGame[]> => {
  try {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    // Fetch games for each day in the range
    const promises: Promise<NHLGame[]>[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      promises.push(getGamesForDate(new Date(currentDate)));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching games for date range:', error);
    return [];
  }
};

/**
 * Get games grouped by date
 */
export const getGamesGroupedByDate = async (
  startDate: Date,
  endDate: Date
): Promise<Record<string, NHLGame[]>> => {
  const games = await getGamesForDateRange(startDate, endDate);
  
  const grouped: Record<string, NHLGame[]> = {};
  
  games.forEach(game => {
    const dateKey = game.gameDate;
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(game);
  });
  
  return grouped;
};

/**
 * Fetch live clock data for a specific game
 */
export const getLiveGameClock = async (gameId: string): Promise<NHLGame['clock'] | null> => {
  try {
    const response = await fetch(
      `https://api-web.nhle.com/v1/gamecenter/${gameId}/play-by-play`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.clock || !data.periodDescriptor) {
      return null;
    }
    
    const period = data.periodDescriptor.number || 1;
    const periodType = data.periodDescriptor.periodType || 'REG';
    const isShootout = periodType === 'SO';
    const isOT = periodType === 'OT';
    
    // Determine period ordinal
    let periodOrdinal = '';
    if (isShootout) {
      periodOrdinal = 'SO';
    } else if (isOT) {
      const otNum = period - 3;
      periodOrdinal = otNum === 1 ? 'OT' : `${otNum}OT`;
    } else {
      periodOrdinal = ['1st', '2nd', '3rd'][period - 1] || `${period}th`;
    }
    
    return {
      timeRemaining: data.clock.timeRemaining || '20:00',
      period: period,
      periodType: isShootout ? 'SO' : isOT ? 'OT' : 'REG',
      inIntermission: data.clock.inIntermission || false,
      periodOrdinal: periodOrdinal,
    };
  } catch (error) {
    console.error(`Error fetching clock for game ${gameId}:`, error);
    return null;
  }
};

/**
 * Format game time to local time
 */
export const formatGameTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};
