/**
 * TeamsSearch - Debounced search input for teams
 */

import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface TeamsSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const TeamsSearch: React.FC<TeamsSearchProps> = ({
  value,
  onChangeText,
  placeholder = 'Search teams...',
}) => {
  const { colors } = useTheme();
  const [localValue, setLocalValue] = useState(value);

  // Debounce: Update parent after 250ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [localValue, value, onChangeText]);

  // Sync with external changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <View style={styles.container}>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={localValue}
          onChangeText={setLocalValue}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {localValue.length > 0 && (
          <Text
            style={[styles.clearButton, { color: colors.textSecondary }]}
            onPress={() => {
              setLocalValue('');
              onChangeText('');
            }}
          >
            ✕
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearButton: {
    fontSize: 18,
    fontWeight: '300',
    padding: 4,
  },
});
