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

interface TeamPickerScreenProps {
  navigation: any;
  route: any;
}

export const TeamPickerScreen: React.FC<TeamPickerScreenProps> = ({
  navigation,
  route,
}) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isPremium } = useAppStore();
  const { zip, services } = route.params || {};

  const maxTeams = isPremium ? 999 : 1; // Free: 1 team, Premium: unlimited

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
      // Save selected teams to database
      if (user?.id) {
        const follows = selectedTeams.map((teamId) => {
          const team = NHL_TEAMS.find((t) => t.id === teamId);
          return {
            user_id: user.id,
            team_id: teamId,
            league: team?.league || 'NHL',
          };
        });

        const { error } = await supabase
          .from('follows')
          .insert(follows);

        if (error) throw error;

        // Track completion
        trackEvent({
          name: 'onboarding_complete',
          properties: {
            zip_present: !!zip,
            services_count: services?.length || 0,
            teams_selected: selectedTeams.length,
          },
        });

        // Navigate to main app (Tonight screen)
        navigation.navigate('Main');
      }
    } catch (error: any) {
      console.error('Failed to save teams:', error);
      Alert.alert('Error', 'Failed to save your teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.progress}>Step 3 of 3</Text>

          <Text style={styles.emoji}>🏒</Text>
          <Text style={styles.title}>Follow your team</Text>
          <Text style={styles.subtitle}>
            {isPremium
              ? 'Select all the teams you want to follow.'
              : 'Pick your favorite NHL team (Free: 1 team)'}
          </Text>

          <View style={styles.teamsGrid}>
            {NHL_TEAMS.map((team) => {
              const isSelected = selectedTeams.includes(team.id);
              const primaryColor = team.primary_colors?.light || '#0066CC';

              return (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamCard,
                    isSelected && {
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                    },
                  ]}
                  onPress={() => toggleTeam(team.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.teamName,
                      isSelected && styles.teamNameSelected,
                    ]}
                  >
                    {team.short_code}
                  </Text>
                  <Text
                    style={[
                      styles.teamCity,
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

          {!isPremium && (
            <Text style={styles.upgradeNote}>
              💡 Want more teams? Upgrade to Premium for unlimited teams!
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#999999',
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
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
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
    backgroundColor: '#F5F5F5',
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
    color: '#000000',
    marginBottom: 4,
  },
  teamNameSelected: {
    color: '#FFFFFF',
  },
  teamCity: {
    fontSize: 14,
    color: '#666666',
  },
  teamCitySelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  upgradeNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
});
