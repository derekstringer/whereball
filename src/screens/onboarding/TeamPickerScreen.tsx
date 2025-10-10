/**
 * Team Picker Screen - Onboarding Step 4 (Final)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { NHL_TEAMS } from '../../constants/teams';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/appStore';
import { trackEvent } from '../../lib/analytics';
import { useTheme } from '../../hooks/useTheme';

interface TeamPickerScreenProps {
  navigation: any;
  route: any;
}

export const TeamPickerScreen: React.FC<TeamPickerScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isPremium } = useAppStore();
  const { zip, services } = route.params || {};

  const maxTeams = 999; // Temporarily unlimited for testing (TODO: Restore free tier limit)

  const toggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams((prev) => prev.filter((id) => id !== teamId));
    } else {
      if (selectedTeams.length >= maxTeams) {
        // Show paywall message for free users
        Alert.alert(
          'Upgrade to Premium',
          'Free users can follow 1 team. Upgrade to Premium to follow unlimited teams!',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {/* Navigate to paywall */} },
          ]
        );
        return;
      }
      setSelectedTeams((prev) => [...prev, teamId]);
    }
  };

  const handleFinish = async () => {
    if (selectedTeams.length === 0) {
      Alert.alert('Select a Team', 'Please select at least one team to follow.');
      return;
    }

    setLoading(true);

    try {
      // Track completion
      trackEvent({
        name: 'onboarding_complete',
        properties: {
          zip_present: !!zip,
          services_count: services?.length || 0,
          teams_selected: selectedTeams.length,
        },
      });

      // Update store immediately
      const { setFollows } = useAppStore.getState();
      const follows = selectedTeams.map((teamId) => {
        const team = NHL_TEAMS.find((t) => t.id === teamId);
        return {
          user_id: user?.id || '',
          team_id: teamId,
          league: team?.league || 'NHL',
          created_at: new Date().toISOString(),
        };
      });
      setFollows(follows);

      // Save selected teams to database if user is authenticated
      if (user?.id) {
        const { error } = await supabase
          .from('follows')
          .insert(follows);

        if (error) {
          console.warn('Failed to save teams to Supabase (demo mode continues):', error);
        }
      }

      // Navigate to main app (Tonight screen) and reset stack to prevent going back
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error: any) {
      console.error('Error:', error);
      // Still navigate even if there's an error (demo mode)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.progress, { color: colors.textSecondary }]}>Step 3 of 3</Text>

          <Text style={styles.emoji}>🏒</Text>
          <Text style={[styles.title, { color: colors.text }]}>Follow your team</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select all the teams you want to follow.
          </Text>

          <View style={styles.teamsGrid}>
            {NHL_TEAMS.sort((a, b) => a.market.localeCompare(b.market)).map((team) => {
              const isSelected = selectedTeams.includes(team.id);
              const primaryColor = team.primary_colors?.light || '#0066CC';

              // Check if team is LAK or PIT (black teams that need visible border)
              const isDarkTeam = team.short_code === 'LAK' || team.short_code === 'PIT';
              
              // Debug logging for PIT
              if (team.short_code === 'PIT' && isSelected) {
                console.log('PIT Debug:', {
                  shortCode: team.short_code,
                  isDarkTeam,
                  primaryColor,
                  borderColor: isDarkTeam ? colors.border : primaryColor,
                  borderWidth: isDarkTeam ? 3 : 2,
                });
              }
              
              return (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamCard,
                    {
                      backgroundColor: isSelected ? primaryColor : colors.surface,
                      borderColor: isSelected 
                        ? (isDarkTeam ? '#666666' : primaryColor)
                        : 'transparent',
                      borderWidth: isSelected 
                        ? (isDarkTeam ? 0.75 : 2) 
                        : 2,
                    },
                  ]}
                  onPress={() => toggleTeam(team.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.teamName,
                      { color: colors.text },
                      isSelected && styles.teamNameSelected,
                    ]}
                  >
                    {team.short_code}
                  </Text>
                  <Text
                    style={[
                      styles.teamCity,
                      { color: colors.textSecondary },
                      isSelected && styles.teamCitySelected,
                    ]}
                  >
                    {team.market}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title={`Finish Setup (${selectedTeams.length} team${selectedTeams.length !== 1 ? 's' : ''})`}
            onPress={handleFinish}
            loading={loading}
            disabled={loading || selectedTeams.length === 0}
          />

          <Text style={[styles.upgradeNote, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
            🧪 Testing mode: Multi-team enabled
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 32,
    lineHeight: 24,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  teamCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamNameSelected: {
    color: '#FFFFFF',
  },
  teamCity: {
    fontSize: 14,
  },
  teamCitySelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  upgradeNote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
});
