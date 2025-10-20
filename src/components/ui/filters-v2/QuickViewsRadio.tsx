/**
 * QuickViewsRadio - 2x2 grid of Quick View presets
 * Updated to match SportStream spec
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { QuickView } from './types';
import { QUICK_VIEW_PRESETS } from './presets';

interface QuickViewsRadioProps {
  selected: QuickView;
  onSelect: (view: Exclude<QuickView, 'custom'>) => void;
  lastPreset?: Exclude<QuickView, 'custom'>;
}

export const QuickViewsRadio: React.FC<QuickViewsRadioProps> = ({
  selected,
  onSelect,
  lastPreset,
}) => {
  const { colors } = useTheme();

  const presetIds: Array<Exclude<QuickView, 'custom'>> = [
    'my_teams_my_services',
    'my_teams_any_service',
    'all_games_my_services',
    'all_games_any_service',
  ];

  const renderBlock = (presetId: Exclude<QuickView, 'custom'>) => {
    const preset = QUICK_VIEW_PRESETS[presetId];
    const isSelected = selected === presetId;

    return (
      <TouchableOpacity
        key={presetId}
        style={[
          styles.block,
          { 
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
          isSelected && {
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          },
        ]}
        onPress={() => onSelect(presetId)}
        activeOpacity={0.7}
        role="radio"
        aria-checked={isSelected}
        aria-label={`${preset.line1} ${preset.line2} ${preset.line3}`}
      >
        {/* Line 1 - ALL CAPS */}
        <Text
          style={[
            styles.line1,
            { color: isSelected ? colors.primary : colors.text },
          ]}
          numberOfLines={1}
        >
          {preset.line1}
        </Text>

        {/* Line 2 - Small "ON" */}
        <Text
          style={[
            styles.line2,
            { color: isSelected ? colors.primary : colors.textSecondary },
          ]}
        >
          {preset.line2}
        </Text>

        {/* Line 3 - ALL CAPS */}
        <Text
          style={[
            styles.line3,
            { color: isSelected ? colors.primary : colors.text },
          ]}
          numberOfLines={2}
        >
          {preset.line3}
        </Text>

        {/* Selection indicator (radio dot in top-right corner) */}
        <View
          style={[
            styles.radioIndicator,
            { borderColor: isSelected ? colors.primary : colors.border },
          ]}
        >
          {isSelected && (
            <View
              style={[styles.radioInner, { backgroundColor: colors.primary }]}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        QUICK VIEWS
      </Text>

      {/* Show "Custom" indicator if not on a preset */}
      {selected === 'custom' && lastPreset && QUICK_VIEW_PRESETS[lastPreset] && (
        <View
          style={[
            styles.customBanner,
            {
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            },
          ]}
        >
          <Text style={[styles.customText, { color: colors.primary }]}>
            Custom selection
          </Text>
          <TouchableOpacity onPress={() => onSelect(lastPreset)}>
            <Text style={[styles.resetLink, { color: colors.primary }]}>
              Reset to preset
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Helper text on first run */}
      <Text style={[styles.helperText, { color: colors.textSecondary }]}>
        Pick a quick view. You can still fine-tune below.
      </Text>

      {/* 2x2 Grid */}
      <View style={styles.grid} role="radiogroup" aria-label="Quick Views">
        {/* Row 1 */}
        <View style={styles.row}>
          {renderBlock('my_teams_my_services')}
          {renderBlock('my_teams_any_service')}
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {renderBlock('all_games_my_services')}
          {renderBlock('all_games_any_service')}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16, // Prevents content from scrolling behind header when bouncing
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  customBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  customText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetLink: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  block: {
    flex: 1,
    aspectRatio: 1.6, // Rectangular blocks (wider than tall)
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  line1: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  line2: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 4,
  },
  line3: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  radioIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
