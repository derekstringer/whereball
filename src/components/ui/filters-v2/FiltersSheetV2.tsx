/**
 * FiltersSheetV2 - Complete rebuild per SportStream spec + SettingsScreen architecture
 * Features: 2x2 Quick Views, collapsible sections, fixed header, perfect scroll behavior
 * 
 * KEY FIX: Header outside FlatList (mirrors SettingsScreen pattern)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, PanResponder, Animated, Dimensions } from 'react-native';
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
  const flatListRef = React.useRef<FlatList>(null);

  // Drag gesture handling
  const panY = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (e, { dy }) => {
        // Close if dragged down more than 100px
        if (dy > 100) {
          onClose();
        } else {
          // Snap back to original position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

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

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Auto-scroll when section expands to show expanded content
  useEffect(() => {
    if (expandedSection && flatListRef.current) {
      // When a section expands, scroll up to expose it
      // Offset depends on which section was expanded
      const offsetMap = {
        'sports': 100,  // Scroll up a bit to show Sports content
        'teams': 250,   // Scroll more for Teams (lower down)
        'services': 400, // Scroll most for Services (lowest)
      };
      
      const offset = offsetMap[expandedSection];
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset, animated: true });
      }, 100);
    }
  }, [expandedSection]);

  // Reset drag position when sheet opens
  useEffect(() => {
    if (visible) {
      // Reset panY to 0 (top position)
      panY.setValue(0);
    }
  }, [visible, panY]);

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
    
    const NHL_TEAMS = require('../../../constants/teams').NHL_TEAMS;
    const team = NHL_TEAMS.find((t: any) => t.id === teamId);
    
    if (isFollowed) {
      removeFollow(teamId);
      showToastNotification(`${team?.market || 'Team'} removed from favorites`);
    } else {
      // Add follow (TODO: Get proper league from team data)
      addFollow({
        user_id: 'current_user', // TODO: Get from auth
        team_id: teamId,
        league: 'NHL', // TODO: Get from team data
        created_at: new Date().toISOString(),
      });
      showToastNotification(`${team?.market || 'Team'} added to favorites`);
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
      const isCurrentlyOwned = prev.ownedServices.includes(serviceCode);
      const newOwnedServices = isCurrentlyOwned
        ? prev.ownedServices.filter(s => s !== serviceCode)
        : [...prev.ownedServices, serviceCode];
      
      const newState = {
        ...prev,
        quickView: 'custom' as QuickView,
        ownedServices: newOwnedServices,
      };
      
      // CRITICAL: Also update subscriptions in global store
      // This ensures the ownership state persists
      const { setSubscriptions } = useAppStore.getState();
      const newSubscriptions = newOwnedServices.map(code => ({
        user_id: 'user-1', // TODO: Get from auth
        service_code: code,
        created_at: new Date().toISOString(),
      }));
      setSubscriptions(newSubscriptions);
      
      // Show feedback
      const STREAMING_SERVICES = require('../../../constants/services').STREAMING_SERVICES;
      const service = STREAMING_SERVICES.find((s: any) => s.code === serviceCode);
      const action = isCurrentlyOwned ? 'removed' : 'added';
      showToastNotification(`${service?.name || 'Service'} ${action}`);
      
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg },
            { transform: [{ translateY: panY }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={0}
          >
            {/* Header - DRAGGABLE for native iOS close gesture */}
            <View
              style={[
                styles.header,
                { backgroundColor: colors.bg, borderBottomColor: colors.border },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Drag Handle - visual indicator at top center */}
              <View style={styles.dragHandleContainer}>
                <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary }]} />
              </View>
              
              {/* Title - centered */}
              <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
              
              {/* Custom badge - right side */}
              {workingState.quickView === 'custom' && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>Custom</Text>
                </View>
              )}
            </View>

            {/* Toast Notification */}
            {showToast && (
              <View style={styles.toastContainer}>
                <View style={styles.toast}>
                  <Text style={styles.toastText}>{toastMessage}</Text>
                </View>
              </View>
            )}

            {/* Content - SCROLLABLE area (FlatList below header) */}
            <FlatList
              ref={flatListRef}
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              data={[]} // Empty data array - we use ListHeaderComponent for content
              renderItem={null}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={true}
              scrollToOverflowEnabled={true}
              ListHeaderComponent={() => (
                <View>
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
                </View>
              )}
            />
          </KeyboardAvoidingView>
        </Animated.View>
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
    paddingBottom: 40,
    height: '85%', // Increased from 68% to show all content without scrolling at rest
    maxHeight: '95%', // Can grow to 95% when sections expand
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  keyboardView: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    zIndex: 100,
    position: 'relative',
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
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
