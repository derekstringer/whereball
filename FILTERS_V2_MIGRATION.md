# FiltersV2 Migration - teamsMode Removal

## Date: October 19, 2025

## Summary
Removed the legacy `teamsMode` system ('followed' vs 'pick_specific') and replaced it with a simpler direct team selection model.

## Changes Made

### 1. Type System (`src/components/ui/filters-v2/types.ts`)

**REMOVED:**
```typescript
export type TeamsMode = 'followed' | 'pick_specific';

interface FiltersWorkingState {
  teamsMode: TeamsMode;
  selectedTeams: string[]; // Meaning varied by mode
  excludedTeams: string[]; // Only used in followed mode
}
```

**NEW:**
```typescript
interface FiltersWorkingState {
  selectedTeams: string[]; // Always means: team IDs to include in filter
  // No teamsMode, no excludedTeams
}
```

### 2. Presets Logic (`src/components/ui/filters-v2/presets.ts`)

**REMOVED:**
- `detectPresetFromState()` function (no longer needed)
- Mode-based logic in `buildStateFromPreset()`

**NEW:**
```typescript
// MY TEAMS presets → selectedTeams = followed team IDs
case 'my_teams_my_services':
  return {
    selectedTeams: followedTeamIds,
    selectedSports: defaultSports,
    selectedServices: ownedServiceCodes,
  };

// ALL GAMES presets → selectedTeams = ALL teams in sports
case 'all_games_my_services':
  return {
    selectedTeams: getAllTeamsForSports(defaultSports),
    selectedSports: defaultSports,
    selectedServices: ownedServiceCodes,
  };
```

**ADDED:**
- `getAllTeamsForSports(sports: Sport[]): string[]` - Returns all team IDs for given sports
- `getAllServiceCodes(): string[]` - Returns all service codes from STREAMING_SERVICES

### 3. Filter Sheet (`src/components/ui/filters-v2/FiltersSheetV2.tsx`)

**REMOVED:**
- `handleToggleTeamsMode()` - No longer needed
- `handleToggleExclude()` - No longer needed
- All `teamsMode` state management
- All `excludedTeams` state management

**SIMPLIFIED:**
- Working state now just tracks `selectedTeams` array
- No mode switching logic needed
- Cleaner state initialization

### 4. Filtering Engine (`src/lib/filters-v2-engine.ts`)

**UPDATED:**
```typescript
effectiveTeamIds(): Set<string> {
  const customSelections = this.filters.customSelections;
  
  if (!customSelections) {
    // Preset mode
    if (this.teamScope() === 'MY') {
      return new Set(this.context.follows.map(f => f.team_id));
    } else {
      return new Set(); // Empty = all teams
    }
  }

  // Custom mode - direct from selectedTeams
  return new Set(customSelections.teams || []);
}
```

**REMOVED:**
- Mode checking logic
- Exclude handling logic
- Complex state derivation

### 5. UI Component (`src/components/ui/filters-v2/TeamsSectionV3.tsx`)

**Current Behavior:**
- Star (⭐) = Follow team (saves to profile)
- Check (✓) = Include in current filter
- Auto-check on follow
- Auto-uncheck on unfollow
- Simple, direct team selection

**No Longer Has:**
- Mode toggle buttons
- Exclude/include mode switching
- Complex badge logic

## Migration Impact

### For Users:
✅ **Simpler UX** - Just star teams to follow, check to include in filter
✅ **More intuitive** - No confusing mode switches
✅ **Clearer** - What you see (checked) is what you get

### For Developers:
✅ **Simpler code** - Less conditional logic
✅ **Easier to understand** - Direct team selection
✅ **Fewer bugs** - Less complexity = fewer edge cases

## Quick View Behavior

### MY TEAMS Quick Views
- **selectedTeams** = Array of followed team IDs
- Filters show ONLY followed teams' games
- If no teams followed → Empty state

### ALL GAMES Quick Views  
- **selectedTeams** = Array of ALL team IDs in selected sports
- Filters show all games in those sports
- Respects sport selection

### Custom Mode
- **selectedTeams** = Whatever user manually checked
- Full flexibility
- No mode concept needed

## Breaking Changes

### State Structure
Old state with `teamsMode: 'followed'` will be migrated to new structure where:
- If followed mode → selectedTeams becomes followed team IDs
- If pick_specific mode → selectedTeams stays as-is
- excludedTeams are ignored (lost on migration)

### API Changes
Functions that took `teamsMode` parameter no longer exist:
- ❌ `handleToggleTeamsMode()`
- ❌ `handleToggleExclude()`
- ❌ `detectPresetFromState()`

## Files Modified

1. ✅ `src/components/ui/filters-v2/types.ts`
2. ✅ `src/components/ui/filters-v2/presets.ts`
3. ✅ `src/components/ui/filters-v2/FiltersSheetV2.tsx`
4. ✅ `src/lib/filters-v2-engine.ts`

## Files Deprecated

- ⚠️ `src/components/ui/filters-v2/TeamsSectionV2.tsx` - Old version, kept for reference
  - Uses old teamsMode system
  - NOT USED in production
  - Use TeamsSectionV3.tsx instead

## Testing Checklist

- [x] MY TEAMS on MY SERVICES - Shows only followed teams
- [x] MY TEAMS on ANY SERVICE - Shows only followed teams, all services
- [x] ALL GAMES on MY SERVICES - Shows all games on owned services
- [x] ALL GAMES on ANY SERVICE - Shows all games on all services
- [x] Custom mode - Manual team selection works
- [x] Filter engine correctly filters games
- [x] No TypeScript errors
- [x] Service codes fixed (11 total, not 10)

## Future Improvements

1. Add sport following feature (auto-star sports when following teams)
2. Implement proper team data import from constants/teams.ts
3. Add analytics tracking for filter usage
4. Consider adding "Recent teams" quick-add feature

## Rollback Plan

If needed to rollback:
1. Revert commits from this session
2. Restore TeamsMode type definition
3. Restore old effectiveTeamIds() logic in filters-v2-engine.ts
4. Switch back to TeamsSectionV2 component

## Questions?

Contact: @derekstringer
