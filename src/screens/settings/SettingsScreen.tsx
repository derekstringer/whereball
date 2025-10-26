/**
 * Profile Screen - Modern, collapsible design
 * World-class settings with Lucide icons
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import {
  User,
  AlarmClockCheck,
  BellRing,
  MapPin,
  Settings as SettingsIcon,
  Info,
  ChevronRight,
  ChevronDown,
  X,
  HelpCircle,
  Trash2,
  LogOut,
} from 'lucide-react-native';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';
import type { ColorMode } from '../../styles/tokens';

interface SettingsScreenProps {
  onClose: () => void;
  isBottomSheet?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, isBottomSheet = false }) => {
  const { 
    colorMode, 
    setColorMode,
    alerts,
    removeAlertsForGame,
  } = useAppStore();
  const { colors } = useTheme();
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    account: false,
    reminders: true, // Expanded by default if reminders exist
    notifications: false,
    location: false,
    settings: false,
  });
  
  // Form state
  const [zip, setZip] = useState('75201'); // TODO: Get from store
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [nationalFlipAlerts, setNationalFlipAlerts] = useState(false);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement sign out
            console.log('Sign out');
          },
        },
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete account
            console.log('Delete account');
          },
        },
      ]
    );
  };
  
  const handleClearAllReminders = () => {
    Alert.alert(
      'Clear All Reminders',
      'Remove all active game reminders?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            // TODO: Clear all reminders
            console.log('Clear all reminders');
          },
        },
      ]
    );
  };
  
  // Get unique game IDs with reminders
  const gamesWithReminders = Array.from(new Set(alerts.map(a => a.game_id)));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('account')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <User size={20} color={colors.text} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
            </View>
            {expandedSections.account ? (
              <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          {expandedSections.account && (
            <View style={styles.sectionContent}>
              <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  <User size={32} color={colors.textSecondary} strokeWidth={2} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: colors.text }]}>Guest User</Text>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                    Not signed in
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.menuButton, { backgroundColor: colors.surface }]}
                onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
              >
                <Text style={[styles.menuButtonText, { color: colors.text }]}>
                  Manage Subscription
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  // TODO: RevenueCat restore
                  Alert.alert('Restore Purchases', 'Checking for purchases...');
                }}
              >
                <Text style={[styles.menuButtonText, { color: colors.text }]}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuButton, { backgroundColor: colors.surface }]}
                onPress={handleSignOut}
              >
                <LogOut size={18} color={colors.text} strokeWidth={2} style={styles.menuButtonIcon} />
                <Text style={[styles.menuButtonText, { color: colors.text }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuButton, { backgroundColor: colors.surface }]}
                onPress={handleDeleteAccount}
              >
                <Trash2 size={18} color="#FF4D67" strokeWidth={2} style={styles.menuButtonIcon} />
                <Text style={[styles.menuButtonText, { color: '#FF4D67' }]}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Reminders Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('reminders')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <AlarmClockCheck size={20} color={colors.text} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>My Reminders</Text>
              {gamesWithReminders.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{gamesWithReminders.length}</Text>
                </View>
              )}
            </View>
            {expandedSections.reminders ? (
              <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          {expandedSections.reminders && (
            <View style={styles.sectionContent}>
              {gamesWithReminders.length === 0 ? (
                <View style={styles.emptyState}>
                  <AlarmClockCheck size={48} color={colors.textSecondary} strokeWidth={1.5} opacity={0.3} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    No active reminders
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                    Tap "Set Reminder" on any game card
                  </Text>
                </View>
              ) : (
                <>
                  {gamesWithReminders.map(gameId => (
                    <View 
                      key={gameId}
                      style={[styles.reminderCard, { backgroundColor: colors.surface }]}
                    >
                      <View style={styles.reminderInfo}>
                        <Text style={[styles.reminderGame, { color: colors.text }]}>
                          Game {gameId}
                        </Text>
                        <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>
                          {alerts.filter(a => a.game_id === gameId).length} reminder
                          {alerts.filter(a => a.game_id === gameId).length > 1 ? 's' : ''} set
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeAlertsForGame(gameId)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <X size={20} color={colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity 
                    style={[styles.clearAllButton, { borderColor: '#FF4D67' }]}
                    onPress={handleClearAllReminders}
                  >
                    <Text style={styles.clearAllButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <BellRing size={20} color={colors.text} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
            </View>
            {expandedSections.notifications ? (
              <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          {expandedSections.notifications && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Enable Notifications
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                    Master switch for all alerts
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    National Flip Alerts
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                    Premium feature
                  </Text>
                </View>
                <Switch
                  value={nationalFlipAlerts}
                  onValueChange={setNationalFlipAlerts}
                  disabled={true}
                  trackColor={{ false: colors.border, true: colors.border }}
                  thumbColor="#CCCCCC"
                />
              </View>
              
              <View style={styles.infoBox}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Default reminder times: 2 hours and 30 minutes before game
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Location Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('location')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <MapPin size={20} color={colors.text} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            </View>
            {expandedSections.location ? (
              <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          {expandedSections.location && (
            <View style={styles.sectionContent}>
              <View style={styles.inlineInputContainer}>
                <TextInput
                  style={[styles.inlineInput, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholderTextColor={colors.textSecondary}
                  value={zip}
                  onChangeText={setZip}
                  placeholder="ZIP"
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <Text style={[styles.inlineHelper, { color: colors.textSecondary }]}>
                  For blackout rules
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('settings')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <SettingsIcon size={20} color={colors.text} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
            </View>
            {expandedSections.settings ? (
              <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          {expandedSections.settings && (
            <View style={styles.sectionContent}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>Appearance</Text>
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    colorMode === 'dark' && { borderColor: colors.primary },
                  ]}
                  onPress={() => setColorMode('dark')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.themeOptionIcon}>🌙</Text>
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: colors.textSecondary },
                      colorMode === 'dark' && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    colorMode === 'light' && { borderColor: colors.primary },
                  ]}
                  onPress={() => setColorMode('light')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.themeOptionIcon}>☀️</Text>
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: colors.textSecondary },
                      colorMode === 'light' && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    colorMode === 'system' && { borderColor: colors.primary },
                  ]}
                  onPress={() => setColorMode('system')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.themeOptionIcon}>⚙️</Text>
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: colors.textSecondary },
                      colorMode === 'system' && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    System
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* About Section (Always visible, compact) */}
        <View style={[styles.section, styles.sectionCompact, { borderBottomWidth: 0 }]}>
          <View style={styles.sectionHeaderLeft}>
            <Info size={20} color={colors.text} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          </View>
          <View style={styles.aboutContent}>
            <Text style={[styles.version, { color: colors.textSecondary }]}>
              SportStream v1.0.0
            </Text>
            <View style={styles.aboutLinks}>
              <TouchableOpacity onPress={() => Linking.openURL('https://sportstream.app/privacy')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Privacy</Text>
              </TouchableOpacity>
              <Text style={[styles.linkDivider, { color: colors.textSecondary }]}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://sportstream.app/terms')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Terms</Text>
              </TouchableOpacity>
              <Text style={[styles.linkDivider, { color: colors.textSecondary }]}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://sportstream.app/support')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionCompact: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionContent: {
    marginTop: 16,
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  menuButtonIcon: {
    marginRight: -4,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderGame: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  reminderTime: {
    fontSize: 13,
  },
  clearAllButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  clearAllButtonText: {
    color: '#FF4D67',
    fontSize: 14,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 13,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  inlineInput: {
    height: 40,
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  inlineHelper: {
    fontSize: 13,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  themeOptionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  aboutContent: {
    marginTop: 8,
    gap: 8,
  },
  version: {
    fontSize: 13,
  },
  aboutLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkDivider: {
    fontSize: 13,
  },
});
