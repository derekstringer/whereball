/**
 * SportsChips - Multi-select chips for sports filtering
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Sport } from './types';

interface SportsChipsProps {
  selectedSports: Sport[];
  onToggleSport: (sport: Sport) => void;
}

const SPORT_DATA: Record<Sport, { icon: string; label: string; color: string }> = {
  nhl: { icon: '🏒', label: 'Hockey', color: '#00B8CC' },
  nba: { icon: '🏀', label: 'Basketball', color: '#FF6B35' },
  nfl: { icon: '🏈', label: 'Football', color: '#4CAF50' },
  mlb: { icon: '⚾', label: 'Baseball', color: '#9C27B0' },
};

export const SportsChips: React.FC<SportsChipsProps> = ({
  selectedSports,
  onToggleSport,
}) => {
  const { colors } = useTheme();

  const sports: Sport[] = ['nhl', 'nba', 'nfl', 'mlb'];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        SPORTS
      </Text>

      <View style={styles.chipsRow}>
        {sports.map(sport => {
          const data = SPORT_DATA[sport];
          const isSelected = selectedSports.includes(sport);

          return (
            <TouchableOpacity
              key={sport}
              style={[
                styles.sportChip,
                { backgroundColor: colors.card, borderColor: colors.stroke },
                isSelected && {
                  borderColor: data.color,
                  backgroundColor: data.color + '15',
                  shadowColor: data.color,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
              onPress={() => onToggleSport(sport)}
              activeOpacity={0.8}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${data.label}, ${isSelected ? 'selected' : 'not selected'}`}
            >
              <Text style={styles.sportIcon}>{data.icon}</Text>
              <Text
                style={[
                  styles.sportLabel,
                  { color: colors.textSecondary },
                  isSelected && { color: data.color, fontWeight: '700' },
                ]}
              >
                {data.label}
              </Text>
              {isSelected && (
                <View style={[styles.sportBadge, { backgroundColor: data.color }]}>
                  <Text style={styles.sportBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  sportIcon: {
    fontSize: 32,
  },
  sportLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sportBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
