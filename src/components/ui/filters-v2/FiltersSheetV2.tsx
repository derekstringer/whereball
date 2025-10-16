/**
 * FiltersSheetV2 - New adaptive filter system with Quick Views
 * Phase 2: Core components (QuickViews, GlobalToggles, Sports)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { useAppStore } from '../../../store/appStore';
import { FiltersWorkingState, QuickView, Sport } from './types';
import { buildStateFromPreset, detectPresetFromState } from './presets';
import { QuickViewsRadio } from './QuickViewsRadio';
import { GlobalToggles } from './GlobalToggles';
import { SportsChips } from './SportsChips';
import { ServicesSection } from './ServicesSection';
import { TeamsSearch } from './TeamsSearch';
import { TeamsGrid } from './TeamsGrid';

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

  // Team search state
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Working state (changes only on Apply)
  const [workingState, setWorkingState] = useState<FiltersWorkingState>({
    quickView: filtersV2.quickView,
    lastPreset: filtersV2.lastPreset,
    selectedSports: [],
    selectedTeams: [],
    selectedServices: [],
    includeElsewhereInListings: filtersV2.includeElsewhereInListings,
    showElsewhereBadges: filtersV2.showElsewhereBadges,
    showNationalBadges: filtersV2.showNationalBadges,
  });

  // Initialize working state on open
  useEffect(() => {
    if (visible) {
      // Load current preset or custom state
      if (filtersV2.quickView !== 'custom') {
        const presetState = buildStateFromPreset(filtersV2.quickView, follows, subscriptions);
        setWorkingState({
          quickView: filtersV2.quickView,
          lastPreset: filtersV2.lastPreset,
          ...presetState,
        });
      } else {
        // Load custom selections
        setWorkingState({
          quickView: 'custom',
          lastPreset: filtersV2.lastPreset,
          selectedSports: filtersV2.customSelections?.sports || [],
          selectedTeams: filtersV2.customSelections?.teams || [],
          selectedServices: filtersV2.customSelections?.services || [],
          includeElsewhereInListings: filtersV2.includeElsewhereInListings,
          showElsewhereBadges: filtersV2.showElsewhereBadges,
          showNationalBadges: filtersV2.showNationalBadges,
        });
      }
    }
  }, [visible, filtersV2, follows, subscriptions]);

  // Handle preset selection
  const handlePresetSelect = (preset: Exclude<QuickView, 'custom'>) => {
    const presetState = buildStateFromPreset(preset, follows, subscriptions);
    setWorkingState({
      quickView: preset,
      lastPreset: preset,
      ...presetState,
    });
  };

  // Handle manual changes (sets to custom)
  const markAsCustom = () => {
    if (workingState.quickView !== 'custom') {
      setWorkingState(prev => ({
        ...prev,
        quickView: 'custom',
      }));
    }
  };

  // Toggle handlers
  const handleToggleSport = (sport: Sport) => {
    markAsCustom();
    setWorkingState(prev => ({
      ...prev,
      selectedSports: prev.selectedSports.includes(sport)
        ? prev.selectedSports.filter(s => s !== sport)
        : [...prev.selectedSports, sport],
    }));
  };

  const handleToggleElsewhere = () => {
    markAsCustom();
    setWorkingState(prev => ({
      ...prev,
      includeElsewhereInListings: !prev.includeElsewhereInListings,
    }));
  };

  const handleToggleNational = () => {
    markAsCustom();
    setWorkingState(prev => ({
      ...prev,
      showNationalBadges: !prev.showNationalBadges,
    }));
  };

  const handleToggleService = (serviceCode: string) => {
    markAsCustom();
    setWorkingState(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceCode)
        ? prev.selectedServices.filter(s => s !== serviceCode)
        : [...prev.selectedServices, serviceCode],
    }));
  };

  const handleToggleTeam = (teamId: string) => {
    markAsCustom();
    setWorkingState(prev => ({
      ...prev,
      selectedTeams: prev.selectedTeams.includes(teamId)
        ? prev.selectedTeams.filter(t => t !== teamId)
        : [...prev.selectedTeams, teamId],
    }));
  };

  // Apply changes
  const handleApply = () => {
    setFiltersV2({
      quickView: workingState.quickView,
      lastPreset: workingState.lastPreset,
      includeElsewhereInListings: workingState.includeElsewhereInListings,
      showElsewhereBadges: workingState.showElsewhereBadges,
      showNationalBadges: workingState.showNationalBadges,
      customSelections: workingState.quickView === 'custom' ? {
        sports: workingState.selectedSports,
        teams: workingState.selectedTeams,
        services: workingState.selectedServices,
      } : undefined,
    });
    onClose();
  };

  // Clear all selections (reset to preset1)
  const handleClear = () => {
    const presetState = buildStateFromPreset('preset1', follows, subscriptions);
    setWorkingState({
      quickView: 'preset1',
      lastPreset: 'preset1',
      ...presetState,
    });
  };

  // Check if state has changed (dirty state)
  const isDirty = () => {
    if (filtersV2.quickView !== workingState.quickView) return true;
    if (filtersV2.includeElsewhereInListings !== workingState.includeElsewhereInListings) return true;
    if (filtersV2.showElsewhereBadges !== workingState.showElsewhereBadges) return true;
    if (filtersV2.showNationalBadges !== workingState.showNationalBadges) return true;
    
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

  // Cancel (discard changes with confirmation if dirty)
  const handleCancel = () => {
    if (isDirty()) {
      // TODO: Show confirmation dialog in Phase 5
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
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary + '40' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>
                Filters
              </Text>
              {workingState.quickView !== 'preset1' && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>
                    {workingState.quickView === 'custom' ? 'Custom' : '✓'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Views */}
            <QuickViewsRadio
              selected={workingState.quickView}
              onSelect={handlePresetSelect}
              lastPreset={workingState.lastPreset}
            />

            {/* Global Toggles */}
            <GlobalToggles
              showElsewhereBadges={workingState.showElsewhereBadges}
              showNationalBadges={workingState.showNationalBadges}
              onToggleElsewhere={handleToggleElsewhere}
              onToggleNational={handleToggleNational}
            />

            {/* Sports */}
            <SportsChips
              selectedSports={workingState.selectedSports}
              onToggleSport={handleToggleSport}
            />

            {/* Services */}
            <ServicesSection
              selectedServices={workingState.selectedServices}
              ownedServices={subscriptions.map(s => s.service_code)}
              onToggleService={handleToggleService}
            />

            {/* Teams */}
            <TeamsSearch
              value={teamSearchQuery}
              onChangeText={setTeamSearchQuery}
            />
            <TeamsGrid
              selectedTeams={workingState.selectedTeams}
              followedTeams={follows.map(f => f.team_id)}
              searchQuery={teamSearchQuery}
              onToggleTeam={handleToggleTeam}
            />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {/* Clear button (shown if not on preset1) */}
            {workingState.quickView !== 'preset1' && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                  Clear all filters
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    maxHeight: '95%', // Increased from 85% for better content visibility
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
  placeholder: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
