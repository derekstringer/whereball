/**
 * FiltersSheetV2 - Complete rebuild per SportStream spec
 * Features: 2x2 Quick Views, collapsible sections, mode switcher, badges
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { useAppStore } from '../../../store/appStore';
import { FiltersWorkingState, QuickView, Sport, TeamsMode } from './types';
import { buildStateFromPreset } from './presets';
import { QuickViewsRadio } from './QuickViewsRadio';
import { SportsSectionV3 } from './SportsSectionV3';
import { TeamsSectionV3 } from './TeamsSectionV3';
import { ServicesSectionV3 } from './ServicesSectionV3';
import { BadgesLabelsSection } from './BadgesLabelsSection';

interface FiltersSheetV2Props {
  visible: boolean;
  onClose: () => void;
}

export const FiltersSheetV2: React.FC<FiltersSheetV2Props> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const { filtersV2, follows, subscriptions, setFiltersV2 } = useAppStore();

  // Working state (changes only on Apply)
  const [workingState, setWorkingState] = useState<FiltersWorkingState & { 
    ownedServices: string[];
    followedSports: Sport[];
  }>({
    quickView: 'my_teams_my_services',
    lastPreset: 'my_teams_my_services',
    teamsMode: 'followed',
    selectedTeams: [],
    excludedTeams: [],
    selectedSports: [],
    selectedServices: [],
    ownedServices: [], // Track owned services in working state
    followedSports: [], // Track followed sports in working state
    showElsewhereBadges: true,
    showNationalBadges: true,
  });

  // Accordion state: only one section open at a time
  const [expandedSection, setExpandedSection] = useState<'sports' | 'teams' | 'services' | null>('teams');

  // Initialize working state on open (ONLY when sheet becomes visible)
  useEffect(() => {
    if (visible) {
      // Auto-check all followed teams
      const followedTeamIds = follows.map(f => f.team_id);
      const ownedServiceCodes = subscriptions.map(s => s.service_code);
      
      // Load current state
      if (filtersV2.quickView !== 'custom') {
        const presetState = buildStateFromPreset(filtersV2.quickView, follows, subscriptions);
        setWorkingState({
          quickView: filtersV2.quickView,
          lastPreset: filtersV2.lastPreset || filtersV2.quickView,
          teamsMode: 'followed', // presets always start in followed mode
          selectedTeams: followedTeamIds, // Auto-check all followed teams
          excludedTeams: [],
          selectedSports: presetState.selectedSports,
          selectedServices: presetState.selectedServices,
          ownedServices: ownedServiceCodes, // Initialize from store
          followedSports: [], // TODO: Get from store when implemented
          showElsewhereBadges: presetState.showElsewhereBadges,
          showNationalBadges: presetState.showNationalBadges,
        });
      } else {
        // Load custom selections, but ensure followed teams are checked
        const customTeams = filtersV2.customSelections?.teams || [];
        const mergedTeams = Array.from(new Set([...customTeams, ...followedTeamIds]));
        
        setWorkingState({
          quickView: 'custom',
          lastPreset: filtersV2.lastPreset || 'my_teams_my_services',
          teamsMode: filtersV2.customSelections?.teamsMode || 'followed',
          selectedTeams: mergedTeams, // Include followed teams
          excludedTeams: filtersV2.customSelections?.excludedTeams || [],
          selectedSports: filtersV2.customSelections?.sports || [],
          selectedServices: filtersV2.customSelections?.services || [],
          ownedServices: ownedServiceCodes, // Initialize from store
          followedSports: [], // TODO: Get from store when implemented
          showElsewhereBadges: filtersV2.showElsewhereBadges,
          showNationalBadges: filtersV2.showNationalBadges,
        });
      }
    }
    // Only run when sheet becomes visible, NOT when follows/subscriptions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Handle preset selection - auto-save
  const handlePresetSelect = (preset: Exclude<QuickView, 'custom'>) => {
    const presetState = buildStateFromPreset(preset, follows, subscriptions);
    const ownedServiceCodes = subscriptions.map(s => s.service_code);
    const newState = {
      quickView: preset,
      lastPreset: preset,
      ...presetState,
      teamsMode: 'followed' as TeamsMode, // presets reset to followed mode
      selectedTeams: [],
      excludedTeams: [],
      ownedServices: ownedServiceCodes,
      followedSports: [],
    };
    setWorkingState(newState);
    
    // Auto-save to store
    setFiltersV2({
      quickView: preset,
      lastPreset: preset,
      showElsewhereBadges: presetState.showElsewhereBadges,
      showNationalBadges: presetState.showNationalBadges,
      customSelections: undefined, // Presets don't have custom selections
    });
  };

  // Helper to auto-save current state to store
  const autoSave = (newState: typeof workingState) => {
    setFiltersV2({
      quickView: newState.quickView,
      lastPreset: newState.lastPreset,
      showElsewhereBadges: newState.showElsewhereBadges,
      showNationalBadges: newState.showNationalBadges,
      customSelections: newState.quickView === 'custom' ? {
        teamsMode: newState.teamsMode,
        sports: newState.selectedSports,
        teams: newState.selectedTeams,
        excludedTeams: newState.excludedTeams,
        services: newState.selectedServices,
      } : undefined,
    });
  };

  // Mark as custom when user makes manual changes
  const markAsCustom = () => {
    if (workingState.quickView !== 'custom') {
      setWorkingState(prev => ({
        ...prev,
        quickView: 'custom',
      }));
    }
  };

  // Sports handlers
  const handleToggleSportFollow = (sportId: Sport) => {
    markAsCustom();
    setWorkingState(prev => {
      const newState = {
        ...prev,
        quickView: 'custom' as QuickView,
        followedSports: prev.followedSports.includes(sportId)
          ? prev.followedSports.filter(s => s !== sportId)
          : [...prev.followedSports, sportId],
      };
      autoSave(newState);
      return newState;
    });
  };

  const handleToggleSportInclude = (sportId: Sport) => {
    markAsCustom();
    setWorkingState(prev => {
      const newState = {
        ...prev,
        quickView: 'custom' as QuickView,
        selectedSports: prev.selectedSports.includes(sportId)
          ? prev.selectedSports.filter(s => s !== sportId)
          : [...prev.selectedSports, sportId],
      };
      autoSave(newState);
      return newState;
    });
  };

  // Teams handlers
  const handleToggleTeamsMode = (mode: TeamsMode) => {
    markAsCustom();
    setWorkingState(prev => ({
      ...prev,
      teamsMode: mode,
      selectedTeams: [], // Clear selections when switching modes
      excludedTeams: [],
    }));
  };

  const handleToggleFollow = (teamId: string) => {
    // Follow changes persist immediately to profile via store
    const { addFollow, removeFollow, follows: currentFollows } = useAppStore.getState();
    const isFollowed = currentFollows.some(f => f.team_id === teamId);
    
    if (isFollowed) {
      removeFollow(teamId);
    } else {
      // Add follow (TODO: Get proper league from team data)
      addFollow({
        user_id: 'current_user', // TODO: Get from auth
        team_id: teamId,
        league: 'NHL', // TODO: Get from team data
        created_at: new Date().toISOString(),
      });
    }
    // Note: This updates the global follows array, which will trigger a re-render
  };

  const handleToggleInclude = (teamId: string) => {
    markAsCustom();
    setWorkingState(prev => {
      const newState = {
        ...prev,
        quickView: 'custom' as QuickView,
        selectedTeams: prev.selectedTeams.includes(teamId)
          ? prev.selectedTeams.filter(t => t !== teamId)
          : [...prev.selectedTeams, teamId],
      };
      autoSave(newState);
      return newState;
    });
  };

  const handleToggleExclude = (teamId: string) => {
    markAsCustom();
    setWorkingState(prev => {
      const newState = {
        ...prev,
        quickView: 'custom' as QuickView,
        excludedTeams: prev.excludedTeams.includes(teamId)
          ? prev.excludedTeams.filter(t => t !== teamId)
          : [...prev.excludedTeams, teamId],
      };
      autoSave(newState);
      return newState;
    });
  };

  // Services handlers
  const handleToggleServiceOwned = (serviceCode: string) => {
    markAsCustom();
    setWorkingState(prev => {
      const newState = {
        ...prev,
        quickView: 'custom' as QuickView,
        ownedServices: prev.ownedServices.includes(serviceCode)
          ? prev.ownedServices.filter(s => s !== serviceCode)
          : [...prev.ownedServices, serviceCode],
      };
      autoSave(newState);
      return newState;
    });
  };

  const handleToggleServiceInclude = (serviceCode: string) => {
    markAsCustom();
    setWorkingState(prev => {
      const newState = {
        ...prev,
        quickView: 'custom' as QuickView,
        selectedServices: prev.selectedServices.includes(serviceCode)
          ? prev.selectedServices.filter(s => s !== serviceCode)
          : [...prev.selectedServices, serviceCode],
      };
      autoSave(newState);
      return newState;
    });
  };

  // Badge handlers (independent - do NOT mark as custom)
  const handleToggleElsewhereBadges = () => {
    setWorkingState(prev => {
      const newState = {
        ...prev,
        showElsewhereBadges: !prev.showElsewhereBadges,
      };
      autoSave(newState);
      return newState;
    });
  };

  const handleToggleNationalBadges = () => {
    setWorkingState(prev => {
      const newState = {
        ...prev,
        showNationalBadges: !prev.showNationalBadges,
      };
      autoSave(newState);
      return newState;
    });
  };

  // Apply changes
  const handleApply = () => {
    setFiltersV2({
      quickView: workingState.quickView,
      lastPreset: workingState.lastPreset,
      showElsewhereBadges: workingState.showElsewhereBadges,
      showNationalBadges: workingState.showNationalBadges,
      customSelections: workingState.quickView === 'custom' ? {
        teamsMode: workingState.teamsMode,
        sports: workingState.selectedSports,
        teams: workingState.selectedTeams,
        excludedTeams: workingState.excludedTeams,
        services: workingState.selectedServices,
      } : undefined,
    });
    onClose();
  };

  // Check if state has changed (dirty state)
  const isDirty = () => {
    if (filtersV2.quickView !== workingState.quickView) return true;
    if (filtersV2.showElsewhereBadges !== workingState.showElsewhereBadges) return true;
    if (filtersV2.showNationalBadges !== workingState.showNationalBadges) return true;
    
    // Check custom selections if in custom mode
    if (workingState.quickView === 'custom' && filtersV2.customSelections) {
      if (filtersV2.customSelections.teamsMode !== workingState.teamsMode) return true;
      
      const currentSports = filtersV2.customSelections.sports || [];
      const currentTeams = filtersV2.customSelections.teams || [];
      const currentExcluded = filtersV2.customSelections.excludedTeams || [];
      const currentServices = filtersV2.customSelections.services || [];
      
      if (JSON.stringify(currentSports.sort()) !== JSON.stringify(workingState.selectedSports.sort())) return true;
      if (JSON.stringify(currentTeams.sort()) !== JSON.stringify(workingState.selectedTeams.sort())) return true;
      if (JSON.stringify(currentExcluded.sort()) !== JSON.stringify(workingState.excludedTeams.sort())) return true;
      if (JSON.stringify(currentServices.sort()) !== JSON.stringify(workingState.selectedServices.sort())) return true;
    }
    
    return false;
  };

  // Cancel (discard changes)
  const handleCancel = () => {
    if (isDirty()) {
      // TODO: Show confirmation dialog
      // For now, just close
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.sheet, { backgroundColor: colors.bg }]}
          keyboardVerticalOffset={0}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary + '40' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Filters
            </Text>
            {workingState.quickView === 'custom' && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>Custom</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* 1. Quick Views (2x2 grid) */}
            <QuickViewsRadio
              selected={workingState.quickView}
              onSelect={handlePresetSelect}
              lastPreset={workingState.lastPreset}
            />

            {/* 2. Sports (grid with search) */}
            <SportsSectionV3
              selectedSports={workingState.selectedSports}
              followedSportIds={workingState.followedSports}
              onToggleFollow={handleToggleSportFollow}
              onToggleInclude={handleToggleSportInclude}
              isExpanded={expandedSection === 'sports'}
              onToggleExpanded={() => setExpandedSection(expandedSection === 'sports' ? null : 'sports')}
            />

            {/* 3. Teams (new grid design) */}
            <TeamsSectionV3
              selectedTeams={workingState.selectedTeams}
              followedTeamIds={follows.map(f => f.team_id)}
              selectedSports={workingState.selectedSports}
              onToggleFollow={handleToggleFollow}
              onToggleInclude={handleToggleInclude}
              isExpanded={expandedSection === 'teams'}
              onToggleExpanded={() => setExpandedSection(expandedSection === 'teams' ? null : 'teams')}
            />

            {/* 4. Services (grid with owned toggles) */}
            <ServicesSectionV3
              selectedServices={workingState.selectedServices}
              ownedServices={workingState.ownedServices}
              onToggleOwned={handleToggleServiceOwned}
              onToggleInclude={handleToggleServiceInclude}
              isExpanded={expandedSection === 'services'}
              onToggleExpanded={() => setExpandedSection(expandedSection === 'services' ? null : 'services')}
            />

            {/* 5. Badges & Labels (bottom, independent) */}
            <BadgesLabelsSection
              showElsewhereBadges={workingState.showElsewhereBadges}
              showNationalBadges={workingState.showNationalBadges}
              onToggleElsewhere={handleToggleElsewhereBadges}
              onToggleNational={handleToggleNationalBadges}
            />
          </ScrollView>

        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#00E5FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  content: {
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
