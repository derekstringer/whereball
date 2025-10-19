/**
 * TeamsSectionV3 - Grid-based team selection with star + check
 * Simple 2-control system: Star = follow forever, Check = include in current filter
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { CollapsibleSection } from './CollapsibleSection';

interface TeamsSectionV3Props {
  selectedTeams: string[]; // Team IDs included in current filter
  followedTeamIds: string[]; // Team IDs user follows (saved to profile)
  selectedSports: string[]; // Filter teams by selected sports
  onToggleFollow: (teamId: string) => void; // Star - saves to profile
  onToggleInclude: (teamId: string) => void; // Check - this filter only
  isExpanded: boolean; // Accordion state from parent
  onToggleExpanded: () => void; // Accordion toggle from parent
}

interface Team {
  id: string;
  sport: string;
  name: string;
  market: string;
  abbr: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 4;
const SCROLLVIEW_PADDING = 48; // 24px on each side from FiltersSheetV2
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - SCROLLVIEW_PADDING - CARD_GAP * (COLUMNS - 1)) / COLUMNS;

export const TeamsSectionV3: React.FC<TeamsSectionV3Props> = ({
  selectedTeams,
  followedTeamIds,
  selectedSports,
  onToggleFollow,
  onToggleInclude,
  isExpanded,
  onToggleExpanded,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // All teams (in real app, import from constants/teams.ts)
  const allTeams: Team[] = useMemo(() => [
    // NHL - All 32 teams
    { id: 'nhl_ana', sport: 'nhl', name: 'Ducks', market: 'Anaheim', abbr: 'ANA' },
    { id: 'nhl_ari', sport: 'nhl', name: 'Coyotes', market: 'Arizona', abbr: 'ARI' },
    { id: 'nhl_bos', sport: 'nhl', name: 'Bruins', market: 'Boston', abbr: 'BOS' },
    { id: 'nhl_buf', sport: 'nhl', name: 'Sabres', market: 'Buffalo', abbr: 'BUF' },
    { id: 'nhl_cgy', sport: 'nhl', name: 'Flames', market: 'Calgary', abbr: 'CGY' },
    { id: 'nhl_car', sport: 'nhl', name: 'Hurricanes', market: 'Carolina', abbr: 'CAR' },
    { id: 'nhl_chi', sport: 'nhl', name: 'Blackhawks', market: 'Chicago', abbr: 'CHI' },
    { id: 'nhl_col', sport: 'nhl', name: 'Avalanche', market: 'Colorado', abbr: 'COL' },
    { id: 'nhl_cbj', sport: 'nhl', name: 'Blue Jackets', market: 'Columbus', abbr: 'CBJ' },
    { id: 'nhl_dal', sport: 'nhl', name: 'Stars', market: 'Dallas', abbr: 'DAL' },
    { id: 'nhl_det', sport: 'nhl', name: 'Red Wings', market: 'Detroit', abbr: 'DET' },
    { id: 'nhl_edm', sport: 'nhl', name: 'Oilers', market: 'Edmonton', abbr: 'EDM' },
    { id: 'nhl_fla', sport: 'nhl', name: 'Panthers', market: 'Florida', abbr: 'FLA' },
    { id: 'nhl_lak', sport: 'nhl', name: 'Kings', market: 'Los Angeles', abbr: 'LAK' },
    { id: 'nhl_min', sport: 'nhl', name: 'Wild', market: 'Minnesota', abbr: 'MIN' },
    { id: 'nhl_mtl', sport: 'nhl', name: 'Canadiens', market: 'Montreal', abbr: 'MTL' },
    { id: 'nhl_nsh', sport: 'nhl', name: 'Predators', market: 'Nashville', abbr: 'NSH' },
    { id: 'nhl_njd', sport: 'nhl', name: 'Devils', market: 'New Jersey', abbr: 'NJD' },
    { id: 'nhl_nyi', sport: 'nhl', name: 'Islanders', market: 'New York', abbr: 'NYI' },
    { id: 'nhl_nyr', sport: 'nhl', name: 'Rangers', market: 'New York', abbr: 'NYR' },
    { id: 'nhl_ott', sport: 'nhl', name: 'Senators', market: 'Ottawa', abbr: 'OTT' },
    { id: 'nhl_phi', sport: 'nhl', name: 'Flyers', market: 'Philadelphia', abbr: 'PHI' },
    { id: 'nhl_pit', sport: 'nhl', name: 'Penguins', market: 'Pittsburgh', abbr: 'PIT' },
    { id: 'nhl_sjs', sport: 'nhl', name: 'Sharks', market: 'San Jose', abbr: 'SJS' },
    { id: 'nhl_sea', sport: 'nhl', name: 'Kraken', market: 'Seattle', abbr: 'SEA' },
    { id: 'nhl_stl', sport: 'nhl', name: 'Blues', market: 'St. Louis', abbr: 'STL' },
    { id: 'nhl_tbl', sport: 'nhl', name: 'Lightning', market: 'Tampa Bay', abbr: 'TBL' },
    { id: 'nhl_tor', sport: 'nhl', name: 'Maple Leafs', market: 'Toronto', abbr: 'TOR' },
    { id: 'nhl_van', sport: 'nhl', name: 'Canucks', market: 'Vancouver', abbr: 'VAN' },
    { id: 'nhl_vgk', sport: 'nhl', name: 'Golden Knights', market: 'Vegas', abbr: 'VGK' },
    { id: 'nhl_wsh', sport: 'nhl', name: 'Capitals', market: 'Washington', abbr: 'WSH' },
    { id: 'nhl_wpg', sport: 'nhl', name: 'Jets', market: 'Winnipeg', abbr: 'WPG' },
    // NBA - Sample teams
    { id: 'nba_atl', sport: 'nba', name: 'Hawks', market: 'Atlanta', abbr: 'ATL' },
    { id: 'nba_bos', sport: 'nba', name: 'Celtics', market: 'Boston', abbr: 'BOS' },
    { id: 'nba_bkn', sport: 'nba', name: 'Nets', market: 'Brooklyn', abbr: 'BKN' },
    { id: 'nba_cha', sport: 'nba', name: 'Hornets', market: 'Charlotte', abbr: 'CHA' },
    { id: 'nba_chi', sport: 'nba', name: 'Bulls', market: 'Chicago', abbr: 'CHI' },
    { id: 'nba_cle', sport: 'nba', name: 'Cavaliers', market: 'Cleveland', abbr: 'CLE' },
    { id: 'nba_dal', sport: 'nba', name: 'Mavericks', market: 'Dallas', abbr: 'DAL' },
    { id: 'nba_den', sport: 'nba', name: 'Nuggets', market: 'Denver', abbr: 'DEN' },
    { id: 'nba_det', sport: 'nba', name: 'Pistons', market: 'Detroit', abbr: 'DET' },
    { id: 'nba_gsw', sport: 'nba', name: 'Warriors', market: 'Golden State', abbr: 'GSW' },
    { id: 'nba_hou', sport: 'nba', name: 'Rockets', market: 'Houston', abbr: 'HOU' },
    { id: 'nba_ind', sport: 'nba', name: 'Pacers', market: 'Indiana', abbr: 'IND' },
    { id: 'nba_lac', sport: 'nba', name: 'Clippers', market: 'LA', abbr: 'LAC' },
    { id: 'nba_lal', sport: 'nba', name: 'Lakers', market: 'Los Angeles', abbr: 'LAL' },
    { id: 'nba_mem', sport: 'nba', name: 'Grizzlies', market: 'Memphis', abbr: 'MEM' },
    { id: 'nba_mia', sport: 'nba', name: 'Heat', market: 'Miami', abbr: 'MIA' },
    { id: 'nba_mil', sport: 'nba', name: 'Bucks', market: 'Milwaukee', abbr: 'MIL' },
    { id: 'nba_min', sport: 'nba', name: 'Timberwolves', market: 'Minnesota', abbr: 'MIN' },
    { id: 'nba_nop', sport: 'nba', name: 'Pelicans', market: 'New Orleans', abbr: 'NOP' },
    { id: 'nba_nyk', sport: 'nba', name: 'Knicks', market: 'New York', abbr: 'NYK' },
    { id: 'nba_okc', sport: 'nba', name: 'Thunder', market: 'Oklahoma City', abbr: 'OKC' },
    { id: 'nba_orl', sport: 'nba', name: 'Magic', market: 'Orlando', abbr: 'ORL' },
    { id: 'nba_phi', sport: 'nba', name: '76ers', market: 'Philadelphia', abbr: 'PHI' },
    { id: 'nba_phx', sport: 'nba', name: 'Suns', market: 'Phoenix', abbr: 'PHX' },
    { id: 'nba_por', sport: 'nba', name: 'Trail Blazers', market: 'Portland', abbr: 'POR' },
    { id: 'nba_sac', sport: 'nba', name: 'Kings', market: 'Sacramento', abbr: 'SAC' },
    { id: 'nba_sas', sport: 'nba', name: 'Spurs', market: 'San Antonio', abbr: 'SAS' },
    { id: 'nba_tor', sport: 'nba', name: 'Raptors', market: 'Toronto', abbr: 'TOR' },
    { id: 'nba_uta', sport: 'nba', name: 'Jazz', market: 'Utah', abbr: 'UTA' },
    { id: 'nba_was', sport: 'nba', name: 'Wizards', market: 'Washington', abbr: 'WAS' },
  ], []);

  // Filter by selected sports
  const sportFilteredTeams = useMemo(() => {
    if (selectedSports.length === 0) {
      return allTeams; // No sports filter = show all
    }
    return allTeams.filter(team => selectedSports.includes(team.sport));
  }, [allTeams, selectedSports]);

  // Filter by search query
  const searchFilteredTeams = useMemo(() => {
    if (!searchQuery.trim()) {
      return sportFilteredTeams;
    }
    const query = searchQuery.toLowerCase();
    return sportFilteredTeams.filter(
      team =>
        team.name.toLowerCase().includes(query) ||
        team.market.toLowerCase().includes(query) ||
        team.abbr.toLowerCase().includes(query)
    );
  }, [sportFilteredTeams, searchQuery]);

  // Sort teams: ⭐ (all followed), ✓ (checked but not followed), rest
  const sortedTeams = useMemo(() => {
    return [...searchFilteredTeams].sort((a, b) => {
      const aFollowed = followedTeamIds.includes(a.id);
      const bFollowed = followedTeamIds.includes(b.id);
      const aIncluded = selectedTeams.includes(a.id);
      const bIncluded = selectedTeams.includes(b.id);

      // Priority 1: ALL ⭐ followed teams (regardless of check state)
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;

      // Priority 2: ✓ only (checked but not followed)
      const aCheckedOnly = !aFollowed && aIncluded;
      const bCheckedOnly = !bFollowed && bIncluded;
      if (aCheckedOnly && !bCheckedOnly) return -1;
      if (!aCheckedOnly && bCheckedOnly) return 1;

      // Alphabetical within same priority
      return a.abbr.localeCompare(b.abbr);
    });
  }, [searchFilteredTeams, followedTeamIds, selectedTeams]);

  // Show only 5 rows (20 teams) initially
  const INITIAL_ROWS = 5;
  const TEAMS_PER_ROW = COLUMNS;
  const INITIAL_COUNT = INITIAL_ROWS * TEAMS_PER_ROW;
  const visibleTeams = showAll ? sortedTeams : sortedTeams.slice(0, INITIAL_COUNT);
  const remainingCount = sortedTeams.length - INITIAL_COUNT;

  // Badge logic: Show counts with icons (★ for followed, ✓ for total selected)
  const badges = useMemo(() => {
    const followedCount = followedTeamIds.length;
    const totalSelectedCount = selectedTeams.length;
    
    // Case 1: Nothing selected
    if (totalSelectedCount === 0) {
      return [{ text: 'ALL' }];
    }
    
    // Case 2: No followed teams (only checked)
    if (followedCount === 0) {
      return [{ text: String(totalSelectedCount), icon: '✓' }];
    }
    
    // Case 3: Has followed teams
    return [
      { text: String(followedCount), icon: '★' },
      { text: String(totalSelectedCount), icon: '✓' },
    ];
  }, [selectedTeams, followedTeamIds]);

  // Handle follow toggle with auto-check behavior
  const handleFollowToggle = (teamId: string) => {
    const isFollowed = followedTeamIds.includes(teamId);
    const isIncluded = selectedTeams.includes(teamId);

    // Always toggle follow first
    onToggleFollow(teamId);
    
    if (isFollowed) {
      // Unfollowing → auto-uncheck if it's checked
      if (isIncluded) {
        onToggleInclude(teamId); // Remove from filter
      }
    } else {
      // Following → auto-check
      if (!isIncluded) {
        onToggleInclude(teamId); // Add to filter
      }
    }
  };

  return (
    <CollapsibleSection
      title="Teams"
      badges={badges}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      {/* Search bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search teams… (name, city, or abbr)"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Teams Grid */}
      <View style={styles.grid}>
        {visibleTeams.map((team) => {
          const isFollowed = followedTeamIds.includes(team.id);
          const isIncluded = selectedTeams.includes(team.id);

          return (
            <View
              key={team.id}
              style={[
                styles.teamCard,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Row 1: Abbreviation */}
              <Text style={[styles.abbr, { color: colors.text }]} numberOfLines={1}>
                {team.abbr}
              </Text>

              {/* Row 2: Team name */}
              <Text style={[styles.teamName, { color: colors.textSecondary }]} numberOfLines={1}>
                {team.name}
              </Text>

              {/* Row 3: Controls */}
              <View style={styles.controls}>
                {/* Star (Follow) */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { borderColor: isFollowed ? colors.primary : colors.border },
                  ]}
                  onPress={() => handleFollowToggle(team.id)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: isFollowed ? colors.primary : colors.textSecondary }}>
                    {isFollowed ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>

                {/* Check (Include in filter) */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { borderColor: isIncluded ? colors.primary : colors.border },
                  ]}
                  onPress={() => onToggleInclude(team.id)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: isIncluded ? colors.primary : colors.textSecondary }}>
                    {isIncluded ? '✓' : '+'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* "Show more" button */}
      {!showAll && remainingCount > 0 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.showMoreText, { color: colors.primary }]}>
            Show {remainingCount} more teams...
          </Text>
        </TouchableOpacity>
      )}

      {/* No results */}
      {visibleTeams.length === 0 && searchQuery && (
        <Text style={[styles.noResults, { color: colors.textSecondary }]}>
          No teams match "{searchQuery}"
        </Text>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 18,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  teamCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  abbr: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
