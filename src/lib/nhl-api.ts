/**
 * NHL API Service
 * Fetches schedule and game data from NHL's public API
 */

export interface NHLGame {
  id: string;
  gameDate: string;
  startTime: string;
  homeTeam: {
    id: number;
    name: string;
    abbreviation: string;
  };
  awayTeam: {
    id: number;
    name: string;
    abbreviation: string;
  };
  venue: string;
  gameState: 'FUT' | 'LIVE' | 'FINAL' | 'OFF';
  broadcasts: Array<{
    network: string;
    type: 'national' | 'home' | 'away';
  }>;
}

/**
 * Fetch today's NHL games
 */
export const getTodaysGames = async (): Promise<NHLGame[]> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // NHL API v1 endpoint
    const response = await fetch(
      `https://api-web.nhle.com/v1/schedule/${today}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch NHL schedule');
    }

    const data = await response.json();
    
    // Transform API response to our format
    const games: NHLGame[] = [];
    
    if (data.gameWeek && data.gameWeek.length > 0) {
      for (const week of data.gameWeek) {
        if (week.games) {
          for (const game of week.games) {
            games.push({
              id: game.id.toString(),
              gameDate: game.gameDate,
              startTime: game.startTimeUTC,
              homeTeam: {
                id: game.homeTeam.id,
                name: game.homeTeam.placeName.default + ' ' + game.homeTeam.commonName.default,
                abbreviation: game.homeTeam.abbrev,
              },
              awayTeam: {
                id: game.awayTeam.id,
                name: game.awayTeam.placeName.default + ' ' + game.awayTeam.commonName.default,
                abbreviation: game.awayTeam.abbrev,
              },
              venue: game.venue?.default || 'TBD',
              gameState: game.gameState,
              broadcasts: game.tvBroadcasts?.map((b: any) => ({
                network: b.network,
                type: b.market === 'N' ? 'national' : 'home',
              })) || [],
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
