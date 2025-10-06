/**
 * Tonight Screen - Main Home Screen
 * Shows games for followed teams
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export const TonightScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏒</Text>
        <Text style={styles.title}>Tonight</Text>
        <Text style={styles.subtitle}>
          Your games will appear here once we add the schedule data!
        </Text>
        <Text style={styles.note}>
          🎉 Onboarding complete! You're all set up.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  note: {
    fontSize: 15,
    color: '#0066CC',
    textAlign: 'center',
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
  },
});
