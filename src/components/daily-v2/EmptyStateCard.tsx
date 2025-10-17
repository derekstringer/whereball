/**
 * EmptyStateCard - Shows when no games match filters
 * Per FILTERS_WIRING_PLAN.md
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  primary?: boolean;
}

interface EmptyStateCardProps {
  message: string;
  description?: string;
  actions?: EmptyStateAction[];
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  message,
  description,
  actions = [],
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.icon, { color: colors.textSecondary }]}>
        🔍
      </Text>
      
      <Text style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
      
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.primary 
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary }
              ]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  action.primary 
                    ? { color: '#FFFFFF' }
                    : { color: colors.primary }
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 40,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
