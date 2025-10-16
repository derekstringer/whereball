/**
 * QuickViewsRadio - Radio group for selecting Quick View presets
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

  const presetIds: Array<Exclude<QuickView, 'custom'>> = ['preset1', 'preset2', 'preset3'];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        QUICK VIEWS
      </Text>
      
      {/* Show "Custom" indicator if not on a preset */}
      {selected === 'custom' && lastPreset && (
        <View style={[styles.customBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.customText, { color: colors.primary }]}>
            Custom selection
          </Text>
          <TouchableOpacity onPress={() => onSelect(lastPreset)}>
            <Text style={[styles.resetLink, { color: colors.primary }]}>
              Reset to {QUICK_VIEW_PRESETS[lastPreset].label}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.radioGroup} role="radiogroup" aria-label="Quick Views">
        {presetIds.map(presetId => {
          const preset = QUICK_VIEW_PRESETS[presetId];
          const isSelected = selected === presetId;

          return (
            <TouchableOpacity
              key={presetId}
              style={[
                styles.radioOption,
                { backgroundColor: colors.card, borderColor: colors.stroke },
                isSelected && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '10',
                  shadowColor: colors.primary,
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
              onPress={() => onSelect(presetId)}
              activeOpacity={0.7}
              role="radio"
              aria-checked={isSelected}
              aria-label={preset.label}
            >
              {/* Radio indicator */}
              <View style={styles.radioIndicator}>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: isSelected ? colors.primary : colors.border },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[styles.radioInner, { backgroundColor: colors.primary }]}
                    />
                  )}
                </View>
              </View>

              {/* Label */}
              <View style={styles.radioText}>
                <Text
                  style={[
                    styles.radioLabel,
                    { color: colors.text },
                    isSelected && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[
                    styles.radioDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {preset.description}
                </Text>
              </View>
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
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 13,
  },
});
