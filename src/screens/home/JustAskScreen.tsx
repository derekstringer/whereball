/**
 * Just Ask Screen - AI Concierge Interface
 * Voice-activated AI assistant for app control
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export const JustAskScreen: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <MessageCircle size={64} color={colors.primary} strokeWidth={1.5} />
        <Text style={[styles.title, { color: colors.text }]}>Just Ask</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          AI assistant will be implemented here
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
  },
});
