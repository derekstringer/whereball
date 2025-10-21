# Filters Sheet - Dialogs & Confirmations

**Status:** Design decisions from chat (must be implemented)  
**Last Updated:** October 20, 2025  
**Priority:** CRITICAL - DO NOT LOSE THIS CONTEXT

---

## I. SPORT UNFOLLOW CONFIRMATION DIALOG (HIERARCHICAL CASCADE)

### Scenario
When user taps the star (unfollow) on a sport like **Tennis**, and they have followed teams within that sport (e.g., Borg, Lendl, Williams), show a confirmation that explains the cascade.

### Dialog Content

**Title:** "Unfollow Tennis?"

**Body:**
```
This will also unfollow:
• Borg
• Lendl  
• Williams

Are you sure?
```

**Buttons:**
- [Cancel] - Keep everything
- [Unfollow All] - Remove sport + all teams/players

### Logic (Hierarchical Cascade)

1. When user taps star to unfollow a sport
2. Check if any followed teams belong to that sport
3. If yes → Show dialog with list of teams
4. If no → Just unfollow immediately (no dialog)
5. On "Unfollow All" → Unfollow sport AND cascade-unfollow all teams in that sport

### Why Cascade-Down?

**Hierarchical Consistency:**
- Sport contains Teams/Players
- "I'm done with Tennis" = "I'm done with tennis players"
- More intuitive than leaving orphaned follows

**Auto-Star Still Works:**
- Following Borg → Auto-stars Tennis ✓
- Unfollowing Tennis → Auto-unfollows Borg ✓
- Consistent bidirectional relationship

**Edge Case (Rare):**
If user wants to unfollow sport but keep specific players:
1. Unfollow sport (cascades down, removes all)
2. Immediately re-star desired players
3. Sport auto-stars again (because players starred)

This two-step is acceptable for rare edge case.

### Implementation Location
`src/components/ui/filters-v2/SportsSectionV3.tsx` - `handleToggleFollow` function
`src/components/ui/filters-v2/FiltersSheetV2.tsx` - `handleToggleSportFollow` function

---

## II. ALL_GAMES PRESET AUTO-SELECTION LOGIC

### Scenario
When user selects the **ALL_GAMES_MY_SERVICES** or **ALL_GAMES_ANY_SERVICE** quick view preset:

### Behavior

**CRITICAL CLARIFICATION:**
- ALL_GAMES does NOT show all sports from all the world
- ALL_GAMES shows all games from **ONLY the sports user has teams in**
- Example: User follows Dallas (NFL) + Yankees (MLB)
  - ALL_GAMES shows: ALL NFL games + ALL MLB games
  - ALL_GAMES does NOT show: Cricket, WNBA, Soccer, NCAA Softball (no teams followed)

**Auto-check all teams (in selected sports):**
- Get list of sports user has followed/selected teams in
- For each of those sports: check ALL teams
- User sees all teams selected in the grid (but only for sports they care about)

**Auto-check all sports (that have followed teams):**
- Auto-check only the sports with followed teams
- Do NOT check sports without followed teams
- Sports **will NOT get starred** (no favorite icon)

### Implementation

```typescript
// In handlePresetSelect or when ALL_GAMES preset selected
if (preset.startsWith('ALL_GAMES')) {
  // Get sports that have followed teams
  const sportsWithFollowedTeams = follows
    .map(f => getTeamSport(f.team_id)) // or derive from team object
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i); // unique
  
  // Auto-select only teams in those sports
  const teamIdsInFollowedSports = getAllTeamsInSports(sportsWithFollowedTeams);
  newState.selectedTeams = teamIdsInFollowedSports;
  
  // Auto-select only sports with followed teams
  newState.selectedSports = sportsWithFollowedTeams;
  
  // Do NOT star any sports
  newState.followedSports = []; // or keep existing stars
}
```

### Why This Way

- User explicitly chose "see all games" = "all games in sports I care about"
- No one wants to see Cricket if they only follow NFL
- Clear intent: "all games in my sports" not "all games on Earth"
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
