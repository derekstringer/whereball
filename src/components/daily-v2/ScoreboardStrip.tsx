/**
 * Scoreboard Strip - Horizontal scrollable strip of game tiles
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { NHLGame } from '../../lib/nhl-api';
import { GameTile } from './GameTile';
import { GameCardExpanded } from './GameCardExpanded';
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
    <View>
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
      
      {/* Expanded game card (shown below strip) */}
      {expandedGameId && (
        <GameCardExpanded
          game={games.find(g => g.id === expandedGameId)!}
          userServiceCodes={userServiceCodes}
          onCollapse={() => setExpandedGameId?.('NHL', null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
