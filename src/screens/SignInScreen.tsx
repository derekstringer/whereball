import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { signInWithEmail } from '../lib/auth';
import { useAppStore } from '../store/appStore';
import { spacing, typography, radii } from '../styles/tokens';

export const SignInScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await signInWithEmail(email.trim(), password);
      if (data.user) {
        useAppStore.getState().setUser({
          id: data.user.id,
          email: data.user.email ?? '',
          display_name: null,
          default_location: null,
          default_radius: 25,
          created_at: data.user.created_at ?? new Date().toISOString(),
        });
        useAppStore.getState().setAuthenticated(true);
      }
    } catch (e: any) {
      setError(e.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.container, { backgroundColor: colors.bg }]}
    >
      <View style={s.inner}>
        {/* Logo area */}
        <Text style={s.paw}>🐾</Text>
        <Text style={[s.title, { color: colors.text }]}>PawFinder</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Find your new best friend
        </Text>

        {/* Form */}
        <View style={s.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              s.input,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[
              s.input,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          />

          {error ? (
            <Text style={[s.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            style={[s.btn, { backgroundColor: colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          style={s.linkRow}
        >
          <Text style={[s.linkText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Text style={[s.linkBold, { color: colors.primary }]}>Sign Up</Text>
        </TouchableOpacity>

        {/* Skip for now */}
        <TouchableOpacity
          onPress={() => navigation.replace('Main')}
          style={s.skipRow}
        >
          <Text style={[s.skipText, { color: colors.textMuted }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  paw: { fontSize: 56, textAlign: 'center', marginBottom: spacing.sm },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  form: { gap: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body,
  },
  error: { ...typography.caption, textAlign: 'center' },
  btn: {
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnText: { color: '#FFF', ...typography.button },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  linkText: { ...typography.body },
  linkBold: { ...typography.bodyBold },
  skipRow: { alignItems: 'center', marginTop: spacing.lg },
  skipText: { ...typography.caption },
});
