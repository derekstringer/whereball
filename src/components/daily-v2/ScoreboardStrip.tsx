/**
 * Scoreboard Strip - Horizontal scrollable strip of game tiles
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NHLGame } from '../../lib/nhl-api';
import { GameTile } from './GameTile';
import { useAppStore } from '../../store/appStore';
import { deepLinkToService } from '../../lib/service-helpers';

interface ScoreboardStripProps {
  games: NHLGame[];
  userServiceCodes: string[];
}

export const ScoreboardStrip: React.FC<ScoreboardStripProps> = ({
  games,
  userServiceCodes,
}) => {
  const { expandedGameIdBySport, setExpandedGameId } = useAppStore();
  const expandedGameId = expandedGameIdBySport?.['NHL'] || null;

  const handleGamePress = (gameId: string) => {
    // Toggle expansion
    if (expandedGameId === gameId) {
      setExpandedGameId?.('NHL', null);
    } else {
      setExpandedGameId?.('NHL', gameId);
    }
  };

  const handleServicePress = (gameId: string, serviceCode: string) => {
    deepLinkToService(serviceCode, gameId);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {games.map((game) => (
        <GameTile
          key={game.id}
          game={game}
          userServiceCodes={userServiceCodes}
          isExpanded={expandedGameId === game.id}
          onPress={() => handleGamePress(game.id)}
          onServicePress={(serviceCode) => handleServicePress(game.id, serviceCode)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
