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
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { NHL_TEAMS } from '../../constants/teams';
import { STREAMING_SERVICES } from '../../constants/services';
import { Follow } from '../../types';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { subscriptions, setSubscriptions, follows, setFollows } = useAppStore();
  const [zip, setZip] = useState('75201'); // TODO: Get from store
  const [selectedTeam, setSelectedTeam] = useState(
    follows.length > 0 ? follows[0].team_id : 'nhl_ari'
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

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    
    // Auto-save team selection
    const newFollow: Follow = {
      user_id: 'user-1', // TODO: Get from auth
      team_id: teamId,
      league: 'NHL',
      created_at: new Date().toISOString(),
    };
    setFollows([newFollow]);
    
    const team = NHL_TEAMS.find(t => t.id === teamId);
    showToastNotification(`Team updated to ${team?.market || 'selected team'}`);
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ZIP Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Your Location</Text>
          <Text style={styles.sectionDescription}>
            We use your ZIP to determine blackout rules
          </Text>
          <TextInput
            style={styles.input}
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

        {/* Followed Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Followed Team</Text>
          <Text style={styles.sectionDescription}>
            Free tier: 1 team • Premium: Unlimited
          </Text>
          <View style={styles.teamsGrid}>
            {(showAllTeams ? NHL_TEAMS : NHL_TEAMS.slice(0, 12))
              .sort((a, b) => {
                // Selected team first
                if (a.id === selectedTeam) return -1;
                if (b.id === selectedTeam) return 1;
                // Then alphabetical by market name
                return a.market.localeCompare(b.market);
              })
              .map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamChip,
                    selectedTeam === team.id && styles.teamChipActive,
                  ]}
                  onPress={() => handleTeamChange(team.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.teamChipText,
                      selectedTeam === team.id && styles.teamChipTextActive,
                    ]}
                  >
                    {team.short_code}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
          {NHL_TEAMS.length > 12 && (
            <TouchableOpacity onPress={() => setShowAllTeams(!showAllTeams)}>
              <Text style={styles.moreTeams}>
                {showAllTeams ? '− Show less' : `+ ${NHL_TEAMS.length - 12} more teams`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📺 Your Streaming Services</Text>
          <Text style={styles.sectionDescription}>
            Select all services you subscribe to
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
                    selectedServices.includes(service.code) && styles.serviceChipActive,
                  ]}
                  onPress={() => toggleService(service.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.serviceChipText,
                      selectedServices.includes(service.code) &&
                        styles.serviceChipTextActive,
                    ]}
                  >
                    {selectedServices.includes(service.code) ? '✓ ' : ''}
                    {service.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Game start reminders</Text>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              National flip alerts (Premium)
            </Text>
            <View style={[styles.toggle, styles.toggleDisabled]}>
              <Text style={styles.toggleTextDisabled}>OFF</Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Account</Text>
          <TouchableOpacity style={styles.accountButton}>
            <Text style={styles.accountButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountButton}>
            <Text style={styles.accountButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accountButton, styles.accountButtonDanger]}>
            <Text style={[styles.accountButtonText, styles.accountButtonTextDanger]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <Text style={styles.aboutText}>WhereBall v1.0.0</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamChipActive: {
    backgroundColor: '#E6F2FF',
    borderColor: '#0066CC',
  },
  teamChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666666',
  },
  teamChipTextActive: {
    color: '#0066CC',
  },
  moreTeams: {
    fontSize: 14,
    color: '#0066CC',
    marginTop: 12,
    fontWeight: '600',
  },
  servicesGrid: {
    gap: 8,
  },
  serviceChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceChipActive: {
    backgroundColor: '#E6F2FF',
    borderColor: '#0066CC',
  },
  serviceChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  serviceChipTextActive: {
    color: '#0066CC',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 15,
    color: '#000000',
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
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 8,
  },
  accountButtonDanger: {
    backgroundColor: '#FFE6E6',
  },
  accountButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  accountButtonTextDanger: {
    color: '#D32F2F',
  },
  aboutText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#0066CC',
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
});
