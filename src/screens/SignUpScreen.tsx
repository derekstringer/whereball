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
import { signUpWithEmail } from '../lib/auth';
import { spacing, typography, radii } from '../styles/tokens';

export const SignUpScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirm) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg }]}>
        <View style={s.inner}>
          <Text style={s.paw}>✉️</Text>
          <Text style={[s.title, { color: colors.text }]}>Check your email</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>
            We sent a confirmation link to {email}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            style={[s.btn, { backgroundColor: colors.primary }]}
          >
            <Text style={s.btnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.container, { backgroundColor: colors.bg }]}
    >
      <View style={s.inner}>
        <Text style={s.paw}>🐾</Text>
        <Text style={[s.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Save favorites & get notified
        </Text>

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
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={colors.textMuted}
            value={confirm}
            onChangeText={setConfirm}
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
            onPress={handleSignUp}
            disabled={loading}
            style={[s.btn, { backgroundColor: colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.linkRow}
        >
          <Text style={[s.linkText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Text style={[s.linkBold, { color: colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  paw: { fontSize: 56, textAlign: 'center', marginBottom: spacing.sm },
  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing.xxxl },
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
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  linkText: { ...typography.body },
  linkBold: { ...typography.bodyBold },
});
