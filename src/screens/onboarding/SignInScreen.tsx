/**
 * Sign In Screen - Onboarding Step 1
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
  Alert,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { signInWithEmail, signInWithApple, signInWithGoogle } from '../../lib/auth';
import { trackEvent } from '../../lib/analytics';
import { useTheme } from '../../hooks/useTheme';

interface SignInScreenProps {
  navigation: any;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSignIn = async () => {
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setLoading(true);
    
    const result = await signInWithEmail(email);
    
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Check your email',
        `We've sent a magic link to ${email}. Click the link to sign in.`,
        [{ text: 'OK' }]
      );
      
      trackEvent({ name: 'onboarding_start' });
    } else {
      Alert.alert('Error', result.error || 'Failed to send magic link');
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    const result = await signInWithApple();
    setLoading(false);

    if (result.success) {
      trackEvent({ name: 'onboarding_start' });
      navigation.navigate('ZipEntry');
    } else {
      Alert.alert('Error', result.error || 'Failed to sign in with Apple');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.success) {
      trackEvent({ name: 'onboarding_start' });
      navigation.navigate('ZipEntry');
    } else {
      Alert.alert('Error', result.error || 'Failed to sign in with Google');
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
            <Text style={styles.emoji}>🏒</Text>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to WhereBall</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We route you to the legal option for YOUR ZIP and services.
            </Text>

            <View style={styles.formContainer}>
              <Input
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
              />

              <Button
                title="Continue with Email"
                onPress={handleEmailSignIn}
                loading={loading}
                disabled={loading}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {Platform.OS === 'ios' && (
                <Button
                  title="Continue with Apple"
                  onPress={handleAppleSignIn}
                  variant="outline"
                  disabled={loading}
                  style={styles.socialButton}
                />
              )}

              <Button
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                variant="outline"
                disabled={loading}
                style={styles.socialButton}
              />
            </View>

            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
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
    paddingTop: 60,
    paddingBottom: 24,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  socialButton: {
    marginTop: 12,
  },
  disclaimer: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
