# Filters Sheet - Dialogs & Confirmations

**Status:** Design decisions from chat (must be implemented)  
**Last Updated:** October 20, 2025  
**Priority:** CRITICAL - DO NOT LOSE THIS CONTEXT

---

## I. SPORT UNFOLLOW CONFIRMATION DIALOG

### Scenario
When user taps the star (unfollow) on a sport like **Tennis**, and they have followed teams within that sport (e.g., Borg, Lendl, Williams), show a graceful confirmation.

### Dialog Content

**Title:** "Unfollow Tennis?"

**Body:**
```
You're unfavoriting Tennis, but you follow:
• Borg
• Lendl  
• Williams

They will still be followed, but Tennis won't be starred.
```

**Buttons:**
- [Cancel] - Dismiss, don't unfavorite
- [OK] - Proceed with unfavoriting

### Logic

1. When user taps star to unfollow a sport
2. Check if any followed teams belong to that sport
3. If yes → Show dialog with list of teams
4. If no → Just unfollow immediately (no dialog)
5. On OK → Unfollow sport, leave teams followed

### Implementation Location
`src/components/ui/filters-v2/SportsSectionV3.tsx` - `handleToggleFollow` function

---

## II. ALL_GAMES PRESET AUTO-SELECTION LOGIC

### Scenario
When user selects the **ALL_GAMES_MY_SERVICES** or **ALL_GAMES_ANY_SERVICE** quick view preset:

### Behavior

**Auto-check all teams:**
- Iterate through all NHL/NBA/etc teams
- Automatically check (include) every team
- User sees all teams selected in the grid

**Auto-check all sports:**
- Iterate through available sports
- Automatically check (include) every sport
- Sports **will NOT get starred** (no favorite icon)
- Reason: User chose "all games" so we include all sports, but they're not favorites

### Implementation

```typescript
// In handlePresetSelect or when ALL_GAMES preset selected
if (preset.startsWith('ALL_GAMES')) {
  // Auto-select all teams
  const allTeamIds = NHL_TEAMS.map(t => t.id); // + NBA, MLB, etc when added
  newState.selectedTeams = allTeamIds;
  
  // Auto-select all sports
  const allSports = SPORTS_CATALOG.map(s => s.id);
  newState.selectedSports = allSports;
  
  // Do NOT star any sports (followedSports remains empty or unchanged)
  // newState.followedSports = [] or keep existing stars
}
```

### Why This Way

- User explicitly chose "see all games" → we show them all games
- Still respects their sport favorites (stars)
- Clear distinction: "included for filtering" vs "starred as favorite"

### Implementation Location
`src/components/ui/filters-v2/presets.ts` - `buildStateFromPreset` function

---

## III. EMPTY STATE DIALOGS

### When No Games Match Filters

**Scenario:** User has filtered so aggressively that no games appear.

**Show Alert/Dialog with:**
- Clear message about why (e.g., "No games on your teams/services")
- Suggested action button: "Expand to Any Service" or "Switch to All Games"
- Cancel/Dismiss button

**Implementation Location:**
`src/screens/home/DailyV3.tsx` - `renderEmptyState` or similar

---

## IV. SERVICE UNFOLLOW - NO CONFIRMATION NEEDED

Unlike sports, when unfavoriting a service:
- No dialog needed
- Just remove it immediately
- Show toast: "ESPN+ removed"
- Reason: No cascading impact (no teams belong to a service)

---

## V. TEAM UNFOLLOW - NO CONFIRMATION NEEDED

When unfavoriting a team:
- No dialog needed
- Just remove it immediately
- Show toast: "Dallas removed from favorites"
- Reason: Unfollowing one team is independent

---

## TESTING CHECKLIST

- [ ] Unfollow Tennis with Borg/Lendl/Williams followed → dialog appears
- [ ] Unfollow Tennis with no teams followed → no dialog, immediate action
- [ ] Select ALL_GAMES preset → all teams auto-selected
- [ ] Select ALL_GAMES preset → all sports auto-selected (no stars)
- [ ] Unfollow service → toast appears, no dialog
- [ ] Unfollow team → toast appears, no dialog
- [ ] Filter to no results → empty state dialog appears with action

---

## NOTES

- This was discussed in chat but never documented until now
- Critical for UX consistency
- Must be implemented before calling filters "complete"
- All dialogs should match platform conventions (iOS: Alert, Android: Dialog)
