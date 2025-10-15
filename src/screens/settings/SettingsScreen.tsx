/**
 * Settings Screen
 * Manage user preferences, followed teams, services, and account
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
  Appearance,
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';
import { NHL_TEAMS } from '../../constants/teams';
import { STREAMING_SERVICES } from '../../constants/services';
import { Follow } from '../../types';
import type { ColorMode } from '../../styles/tokens';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { 
    subscriptions, 
    setSubscriptions, 
    follows, 
    setFollows, 
    colorMode, 
    setColorMode, 
    systemThemeUpdateTrigger,
    preferredServices,
    togglePreferredService
  } = useAppStore();
  const { colors, mode } = useTheme();
  const [zip, setZip] = useState('75201'); // TODO: Get from store
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    follows.map(f => f.team_id)
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    subscriptions.map(s => s.service_code)
  );
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleTeamToggle = (teamId: string) => {
    const isSelected = selectedTeams.includes(teamId);
    const newTeams = isSelected
      ? selectedTeams.filter(id => id !== teamId)
      : [...selectedTeams, teamId];
    
    setSelectedTeams(newTeams);
    
    // Auto-save team selections
    const newFollows: Follow[] = newTeams.map(id => ({
      user_id: 'user-1', // TODO: Get from auth
      team_id: id,
      league: 'NHL',
      created_at: new Date().toISOString(),
    }));
    setFollows(newFollows);
    
    const team = NHL_TEAMS.find(t => t.id === teamId);
    const action = isSelected ? 'removed' : 'added';
    showToastNotification(`${team?.market || 'Team'} ${action} (${newTeams.length} teams)`);
  };

  const toggleService = (serviceCode: string) => {
    const newServices = selectedServices.includes(serviceCode)
      ? selectedServices.filter(s => s !== serviceCode)
      : [...selectedServices, serviceCode];
    
    setSelectedServices(newServices);
    
    // Auto-save services
    const newSubscriptions = newServices.map(code => ({
      user_id: 'user-1', // TODO: Get from auth
      service_code: code,
      created_at: new Date().toISOString(),
    }));
    setSubscriptions(newSubscriptions);
    
    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
    const action = selectedServices.includes(serviceCode) ? 'removed' : 'added';
    showToastNotification(`${service?.name || 'Service'} ${action}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scrollContent}>
        {/* ZIP Code */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Your Location</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            We use your ZIP to determine blackout rules
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text
            }]}
            placeholderTextColor={colors.textSecondary}
            value={zip}
            onChangeText={setZip}
            onBlur={() => {
              // Auto-save ZIP on blur
              if (zip.length === 5) {
                // TODO: Save to store when ZIP is added
                showToastNotification(`ZIP updated to ${zip}`);
              }
            }}
            placeholder="Enter ZIP code"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>

        {/* Followed Teams */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ Followed Teams</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected • Free tier: 1 team • Premium: Unlimited
          </Text>
          <View style={styles.teamsGrid}>
            {NHL_TEAMS
              .sort((a, b) => {
                // Selected teams first
                const aSelected = selectedTeams.includes(a.id);
                const bSelected = selectedTeams.includes(b.id);
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                // Then alphabetical by market name
                return a.market.localeCompare(b.market);
              })
              .slice(0, showAllTeams ? NHL_TEAMS.length : 12)
              .map(team => {
                const isSelected = selectedTeams.includes(team.id);
                return (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.teamChip,
                      { backgroundColor: colors.surface },
                      isSelected && {
                        backgroundColor: colors.surface,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleTeamToggle(team.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.teamChipText,
                        { color: colors.textSecondary },
                        isSelected && { color: colors.primary },
                      ]}
                    >
                      {isSelected ? '✓ ' : ''}
                      {team.short_code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
          {NHL_TEAMS.length > 12 && (
            <TouchableOpacity onPress={() => setShowAllTeams(!showAllTeams)}>
              <Text style={[styles.moreTeams, { color: colors.primary }]}>
                {showAllTeams ? '− Show less' : `+ ${NHL_TEAMS.length - 12} more teams`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Services */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📺 Your Streaming Services</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Select all services you subscribe to • {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} connected
          </Text>
          <View style={styles.servicesGrid}>
            {STREAMING_SERVICES
              .sort((a, b) => {
                // Selected services first
                const aSelected = selectedServices.includes(a.code);
                const bSelected = selectedServices.includes(b.code);
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                // Then alphabetical by name
                return a.name.localeCompare(b.name);
              })
              .map(service => (
                <TouchableOpacity
                  key={service.code}
                  style={[
                    styles.serviceChip,
                    { backgroundColor: colors.surface },
                    selectedServices.includes(service.code) && {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => toggleService(service.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.serviceChipText,
                      { color: colors.textSecondary },
                      selectedServices.includes(service.code) && {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {selectedServices.includes(service.code) ? '✓ ' : ''}
                    {service.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Preferred Services */}
        {selectedServices.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ Preferred Services</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Mark your favorite services to see them first in game cards • {preferredServices.length} preferred
            </Text>
            <View style={styles.servicesGrid}>
              {STREAMING_SERVICES
                .filter(service => selectedServices.includes(service.code))
                .sort((a, b) => {
                  // Preferred services first
                  const aPreferred = preferredServices.includes(a.code);
                  const bPreferred = preferredServices.includes(b.code);
                  if (aPreferred && !bPreferred) return -1;
                  if (!aPreferred && bPreferred) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map(service => (
                  <TouchableOpacity
                    key={service.code}
                    style={[
                      styles.serviceChip,
                      { backgroundColor: colors.surface },
                      preferredServices.includes(service.code) && {
                        backgroundColor: colors.surface,
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() => {
                      togglePreferredService(service.code);
                      const isPreferred = preferredServices.includes(service.code);
                      const action = isPreferred ? 'removed from' : 'added to';
                      showToastNotification(`${service.name} ${action} preferred services`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        { color: colors.textSecondary },
                        preferredServices.includes(service.code) && {
                          color: colors.accent,
                        },
                      ]}
                    >
                      {preferredServices.includes(service.code) ? '⭐ ' : ''}
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
            {preferredServices.length === 0 && (
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                Tap a service above to mark it as preferred
              </Text>
            )}
          </View>
        )}

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 Appearance</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>Choose your theme</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.surface },
                colorMode === 'dark' && {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                setColorMode('dark');
                showToastNotification('Dark mode enabled');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.themeOptionIcon}>🌙</Text>
              <Text
                style={[
                  styles.themeOptionText,
                  { color: colors.textSecondary },
                  colorMode === 'dark' && { color: colors.primary },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.surface },
                colorMode === 'light' && {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                setColorMode('light');
                showToastNotification('Light mode enabled');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.themeOptionIcon}>☀️</Text>
              <Text
                style={[
                  styles.themeOptionText,
                  { color: colors.textSecondary },
                  colorMode === 'light' && { color: colors.primary },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.surface },
                colorMode === 'system' && {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                setColorMode('system');
                const detectedMode = Appearance.getColorScheme() || 'dark';
                showToastNotification(`System theme enabled (${detectedMode} detected)`);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.themeOptionIcon}>⚙️</Text>
              <Text
                style={[
                  styles.themeOptionText,
                  { color: colors.textSecondary },
                  colorMode === 'system' && { color: colors.primary },
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔔 Notifications</Text>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Game start reminders</Text>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              National flip alerts (Premium)
            </Text>
            <View style={[styles.toggle, styles.toggleDisabled]}>
              <Text style={styles.toggleTextDisabled}>OFF</Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 Account</Text>
          <TouchableOpacity style={[styles.accountButton, { backgroundColor: colors.surface }]}>
            <Text style={[styles.accountButtonText, { color: colors.text }]}>Manage Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accountButton, { backgroundColor: colors.surface }]}>
            <Text style={[styles.accountButtonText, { color: colors.text }]}>Restore Purchases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accountButton, { backgroundColor: colors.surface }]}>
            <Text style={[styles.accountButtonText, { color: '#FF4D67' }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ About</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>SportStream v1.0.0</Text>
          <TouchableOpacity>
            <Text style={[styles.linkText, { color: colors.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.linkText, { color: colors.primary }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    padding: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamChipActive: {
    borderWidth: 2,
  },
  teamChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamChipTextActive: {
  },
  moreTeams: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  servicesGrid: {
    gap: 8,
  },
  serviceChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceChipActive: {
    borderWidth: 2,
  },
  serviceChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  serviceChipTextActive: {
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 15,
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  toggleDisabled: {
    backgroundColor: '#E0E0E0',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleTextDisabled: {
    color: '#999999',
  },
  accountButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  accountButtonDanger: {
  },
  accountButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  accountButtonTextDanger: {
  },
  aboutText: {
    fontSize: 14,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerSpacer: {
    width: 40,
  },
  toastContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderWidth: 2,
  },
  themeOptionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeOptionTextActive: {
  },
  hintText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});
