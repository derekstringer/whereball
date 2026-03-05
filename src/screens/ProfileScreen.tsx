import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  User,
  LogOut,
  Moon,
  Sun,
  Smartphone,
  MapPin,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/appStore';
import { signOut } from '../lib/auth';
import type { ColorMode } from '../types';
import { spacing, typography, radii } from '../styles/tokens';

export const ProfileScreen = ({ navigation }: any) => {
  const { colors, isDark, mode } = useTheme();
  const user = useAppStore((s) => s.user);
  const isAuth = useAppStore((s) => s.isAuthenticated);
  const colorMode = useAppStore((s) => s.colorMode);
  const setColorMode = useAppStore((s) => s.setColorMode);
  const filters = useAppStore((s) => s.filters);
  const favCount = useAppStore((s) => s.favorites.length);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const themes: { label: string; value: ColorMode; icon: any }[] = [
    { label: 'Dark', value: 'dark', icon: Moon },
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'System', value: 'system', icon: Smartphone },
  ];

  const Row = ({
    icon: Icon,
    label,
    value,
    onPress,
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[s.row, { borderBottomColor: colors.divider }]}
    >
      <Icon size={20} color={colors.primary} />
      <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
      {value && (
        <Text style={[s.rowValue, { color: colors.textMuted }]}>{value}</Text>
      )}
      {onPress && <ChevronRight size={18} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Profile</Text>
      </View>

      {/* Account */}
      <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isAuth ? (
          <>
            <View style={s.userRow}>
              <View style={[s.avatar, { backgroundColor: colors.primaryDim }]}>
                <User size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={[s.userName, { color: colors.text }]}>
                  {user?.display_name ?? user?.email ?? 'User'}
                </Text>
                <Text style={[s.userEmail, { color: colors.textMuted }]}>
                  {user?.email}
                </Text>
              </View>
            </View>
            <Row icon={MapPin} label="Default Location" value={filters.location} />
            <Row
              icon={LogOut}
              label="Sign Out"
              onPress={handleSignOut}
            />
          </>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            style={[s.signInBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={s.signInText}>Sign In or Create Account</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>STATS</Text>
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.primary }]}>{favCount}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>Favorites</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.primary }]}>{filters.distance}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>Mile radius</Text>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={s.themeRow}>
          {themes.map(({ label, value, icon: Icon }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setColorMode(value)}
              style={[
                s.themeBtn,
                {
                  backgroundColor:
                    colorMode === value ? colors.primaryDim : colors.surface,
                  borderColor:
                    colorMode === value ? colors.primary : colors.border,
                },
              ]}
            >
              <Icon
                size={18}
                color={colorMode === value ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  s.themeBtnLabel,
                  {
                    color:
                      colorMode === value ? colors.primary : colors.textMuted,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* About */}
      <Text style={[s.about, { color: colors.textMuted }]}>
        PawFinder v1.0.0 · Powered by RescueGroups.org
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2 },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.captionBold,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { ...typography.bodyBold },
  userEmail: { ...typography.caption, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLabel: { ...typography.body, flex: 1 },
  rowValue: { ...typography.caption },
  statsRow: { flexDirection: 'row', gap: spacing.xl },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '700' },
  statLabel: { ...typography.caption, marginTop: 2 },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  themeBtnLabel: { ...typography.captionBold },
  signInBtn: {
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  signInText: { color: '#FFF', ...typography.button },
  about: { ...typography.small, textAlign: 'center', marginTop: spacing.xxl },
});
