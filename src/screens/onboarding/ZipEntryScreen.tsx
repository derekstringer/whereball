/**
 * ZIP Entry Screen - Onboarding Step 2
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';

interface ZipEntryScreenProps {
  navigation: any;
}

export const ZipEntryScreen: React.FC<ZipEntryScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const [zipError, setZipError] = useState('');
  const { user } = useAppStore();

  const validateZip = (zip: string) => {
    // US ZIP code: 5 digits or 5+4 format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };

  const handleContinue = async () => {
    setZipError('');
    
    if (!zip.trim()) {
      setZipError('ZIP code is required');
      return;
    }
    
    if (!validateZip(zip)) {
      setZipError('Please enter a valid ZIP code');
      return;
    }

    setLoading(true);

    try {
      // Update user's ZIP in database
      if (user?.id) {
        const { error } = await supabase
          .from('users')
          .update({ zip: zip.trim() })
          .eq('id', user.id);

        if (error) throw error;
      }

      // Navigate to services selector
      navigation.navigate('ServicesSelector', { zip: zip.trim() });
    } catch (error: any) {
      setZipError(error.message || 'Failed to save ZIP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={[styles.progress, { color: colors.textSecondary }]}>Step 1 of 3</Text>
            
            <Text style={styles.emoji}>📍</Text>
            <Text style={[styles.title, { color: colors.text }]}>What's your ZIP code?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We'll use this to check blackouts and find the right streaming options for your area.
            </Text>

            <View style={styles.formContainer}>
              <Input
                label="ZIP Code"
                value={zip}
                onChangeText={(text) => {
                  // Only allow numbers and dash
                  const cleaned = text.replace(/[^\d-]/g, '');
                  setZip(cleaned);
                  setZipError('');
                }}
                placeholder="75201"
                placeholderTextColor={colors.textMuted + '60'}
                keyboardType="number-pad"
                maxLength={10}
                error={zipError}
              />

              <Button
                title="Continue"
                onPress={handleContinue}
                loading={loading}
                disabled={loading || !zip.trim()}
              />
            </View>

            <Text style={[styles.note, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
              💡 We only use your ZIP to determine blackouts. We never share your location data.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  progress: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    padding: 16,
    borderRadius: 12,
  },
});
