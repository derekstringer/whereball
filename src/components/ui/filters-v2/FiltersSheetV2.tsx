/**
 * FiltersSheetV2 - Complete rebuild per SportStream spec
 * Features: 2x2 Quick Views, collapsible sections, mode switcher, badges
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { useAppStore } from '../../../store/appStore';
import { FiltersWorkingState, QuickView, Sport } from './types';
import { buildStateFromPreset } from './presets';
import { QuickViewsRadio } from './QuickViewsRadio';
import { SportsSectionV3 } from './SportsSectionV3';
import { TeamsSectionV3 } from './TeamsSectionV3';
import { ServicesSectionV3 } from './ServicesSectionV3';

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
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Working state (changes only on Apply)
  const [workingState, setWorkingState] = useState<FiltersWorkingState & { 
    ownedServices: string[];
    followedSports: Sport[];
  }>({
    quickView: 'my_teams_my_services',
    lastPreset: 'my_teams_my_services',
    selectedTeams: [],
    selectedSports: [],
    selectedServices: [],
    ownedServices: [], // Track owned services in working state
    followedSports: [], // Track followed sports in working state
  });

  // Accordion state: only one section open at a time
  const [expandedSection, setExpandedSection] = useState<'sports' | 'teams' | 'services' | null>(null);

  // Initialize working state on open (ONLY when sheet becomes visible)
  useEffect(() => {
    if (visible) {
      const ownedServiceCodes = subscriptions.map(s => s.service_code);
      // Derive followed sports from team follows (auto-star logic)
      const { getSportsFromFollows } = require('./presets');
      const followedSportsFromTeams = getSportsFromFollows(follows);
      
      // Load current state
      if (filtersV2.quickView !== 'custom') {
        const presetState = buildStateFromPreset(filtersV2.quickView, follows, subscriptions);
        setWorkingState({
          quickView: filtersV2.quickView,
          lastPreset: filtersV2.lastPreset || filtersV2.quickView,
          selectedTeams: presetState.selectedTeams, // Use teams from preset
          selectedSports: presetState.selectedSports,
          selectedServices: presetState.selectedServices,
          ownedServices: ownedServiceCodes,
          followedSports: followedSportsFromTeams, // Auto-starred from team follows
        });
      } else {
        // Load custom selections
        const customTeams = filtersV2.customSelections?.teams || [];
        
        setWorkingState({
          quickView: 'custom',
          lastPreset: filtersV2.lastPreset || 'my_teams_my_services',
          selectedTeams: customTeams,
          selectedSports: filtersV2.customSelections?.sports || [],
          selectedServices: filtersV2.customSelections?.services || [],
          ownedServices: ownedServiceCodes,
          followedSports: followedSportsFromTeams, // Auto-starred from team follows
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
    // Derive followed sports from team follows
    const { getSportsFromFollows } = require('./presets');
    const followedSportsFromTeams = getSportsFromFollows(follows);
    
    const newState = {
      quickView: preset,
      lastPreset: preset,
      ...presetState,
      ownedServices: ownedServiceCodes,
      followedSports: followedSportsFromTeams, // Auto-star sports from team follows
    };
    setWorkingState(newState);
    
    // Auto-save to store
    setFiltersV2({
      quickView: preset,
      lastPreset: preset,
      customSelections: undefined, // Presets don't have custom selections
    });
  };

  // Helper to auto-save current state to store
  const autoSave = (newState: typeof workingState) => {
    setFiltersV2({
      quickView: newState.quickView,
      lastPreset: newState.lastPreset,
      customSelections: newState.quickView === 'custom' ? {
        sports: newState.selectedSports,
        teams: newState.selectedTeams,
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
      setTimeout(() => autoSave(newState), 0);
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
      setTimeout(() => autoSave(newState), 0);
      return newState;
    });
  };

  // Teams handlers
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
      setTimeout(() => autoSave(newState), 0);
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
      setTimeout(() => autoSave(newState), 0);
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
      setTimeout(() => autoSave(newState), 0);
      return newState;
    });
  };

  // Apply changes
  // Apply changes
  const handleApply = () => {
    setFiltersV2({
      quickView: workingState.quickView,
      lastPreset: workingState.lastPreset,
      customSelections: workingState.quickView === 'custom' ? {
        sports: workingState.selectedSports,
        teams: workingState.selectedTeams,
        services: workingState.selectedServices,
      } : undefined,
    });
    onClose();
  };

  // Check if state has changed (dirty state)
  const isDirty = () => {
    if (filtersV2.quickView !== workingState.quickView) return true;
    
    // Check custom selections if in custom mode
    if (workingState.quickView === 'custom' && filtersV2.customSelections) {
      const currentSports = filtersV2.customSelections.sports || [];
      const currentTeams = filtersV2.customSelections.teams || [];
      const currentServices = filtersV2.customSelections.services || [];
      
      if (JSON.stringify(currentSports.sort()) !== JSON.stringify(workingState.selectedSports.sort())) return true;
      if (JSON.stringify(currentTeams.sort()) !== JSON.stringify(workingState.selectedTeams.sort())) return true;
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
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={0}
          >

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Filters
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {workingState.quickView === 'custom' && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>Custom</Text>
                </View>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.doneButton, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={true}
            contentInset={{ top: 1 }}
            contentOffset={{ x: 0, y: -1 }}
            automaticallyAdjustContentInsets={false}
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
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
    height: '68%', // Compact initial size - adjusted up per user feedback
    maxHeight: '90%', // Can grow to 90% when sections expand
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    width: '100%',
  },
  dragHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
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
  keyboardView: {
    flex: 1,
  },
});
