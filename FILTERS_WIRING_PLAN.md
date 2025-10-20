# FiltersV2 Wiring Plan - End-to-End Integration

**⚠️ IMPORTANT:** This document reflects the original design with `teamsMode`. See [FILTERS_V2_MIGRATION.md](./FILTERS_V2_MIGRATION.md) for current implementation without teamsMode.

**Status:** Specification Complete - Implementation Updated Oct 19, 2025  
**Last Updated:** October 16, 2025 (Original Spec)

---

## GOAL

Make the new FiltersSheetV2 actually drive what the user sees:
- One source of truth in our store for filters
- Quick Views set that state in one tap
- Sports/Teams/Services selections refine that state
- The game list re-renders from that state (watchability rules applied)

---

## A) STORE SHAPE (Single Source of Truth)

Create a "filters" slice in the Zustand store with this shape:

```typescript
interface FiltersState {
  // Quick View selection
  quickView: 'MY_TEAMS_MY_SERVICES' | 'MY_TEAMS_ANY_SERVICE' | 
             'ALL_GAMES_MY_SERVICES' | 'ALL_GAMES_ANY_SERVICE' | 'CUSTOM';
  
  // Refinements
  sportsSelected: Set<string>;          // sport IDs; empty = All Sports
  teamsMode: 'FOLLOWED' | 'SPECIFIC';   // how Teams works in this view
  includeTeamIds: Set<string>;          // SPECIFIC mode — ad-hoc include
  excludeFollowedTeamIds: Set<string>;  // FOLLOWED mode — temporarily exclude
  ownedServiceIds: Set<string>;         // user's saved services (profile truth)
  
  // Visual only
  showElsewhereBadges: boolean;         // default: true
  showNationalBadges: boolean;          // default: true
  
  // Optional
  dateRange?: { start: Date; end: Date }; // if/when we add explicit ranges
}
```

### Derived Helpers (Selectors):

```typescript
// Compute effective team IDs based on mode
effectiveTeamIds(): Set<string> {
  if (teamsMode === 'FOLLOWED') {
    return followedTeamIds - excludeFollowedTeamIds;
  } else {
    return includeTeamIds;
  }
}

// Determine team scope from quick view
teamScope(): 'MY' | 'ALL' {
  return quickView.startsWith('MY_TEAMS') ? 'MY' : 'ALL';
}

// Determine service scope from quick view
serviceScope(): 'MY' | 'ANY' {
  return quickView.endsWith('MY_SERVICES') ? 'MY' : 'ANY';
}
```

### Actions:

```typescript
- setQuickView(preset)
- setSportsSelected(add/remove/clear)
- setTeamsMode(mode)
- includeTeam(id) / excludeFollowedTeam(id) / clearTeamFilters()
- toggleOwnedService(id)   // persists immediately to profile
- setShowElsewhereBadges(bool)  // visual only
- setShowNationalBadges(bool)   // visual only
- applyFilters(payload)    // used by FiltersSheetV2 on Apply
- resetToPreset()          // when user taps "Reset to {Preset}"
- markCustom()             // if the user tweaks anything after picking a preset
```

---

## B) QUICK VIEWS → STATE (Exact Mapping)

When a user taps a Quick View block:

1. **Set quickView** to that preset
2. **DO NOT change badge toggles** (independent)
3. **Keep existing sports selection** as-is (independent)
4. **Teams behavior:**
   - If preset starts with `MY_TEAMS` → `teamsMode = FOLLOWED`
   - If preset starts with `ALL_GAMES` → `teamsMode = SPECIFIC` with `includeTeamIds = ∅` (all teams)
5. **Services scope:**
   - `MY_SERVICES` → results limited to `ownedServiceIds` AND pass blackout rules
   - `ANY_SERVICE` → show all legal options (ownership not required)

If user changes Sports/Teams/Services after preset chosen, call `markCustom()` so `quickView` becomes `CUSTOM` and show "Reset to {Last Preset}" affordance.

---

## C) FILTERS SHEET FLOW (Local vs Global State)

1. **On open:** Clone store's filters into local component state
2. **User edits locally:**
   - Quick view, sports chips, team scope, include/exclude, service ownership
   - Star/follow and ownedService toggles can persist immediately (identity-level)
   - Rest applies on "Apply"
3. **On Apply:** Call `applyFilters(localState)`. Close sheet.
4. **On Cancel:** Discard local changes (confirm "Discard changes?" if dirty)

---

## D) GAME LIST INTEGRATION (The Important Part)

Create a pure function that converts filter state into a match check:

```typescript
buildMatchPredicate(filters, userContext) → (game) => boolean
```

### Rules:

**Sports:**
- If `sportsSelected` is empty → treat as All Sports
- Else include games whose `sportId ∈ sportsSelected`

**Teams:**
- If `quickView` is `MY_TEAMS_*` (teamScope="MY"):
  ```
  effectiveTeams = effectiveTeamIds()
  Include if (homeTeamId ∈ effectiveTeams) OR (awayTeamId ∈ effectiveTeams)
  ```
- Else (`ALL_GAMES_*`):
  - No team constraint (or if SPECIFIC has includeTeamIds, use that)

**Services (Availability):**
- If `serviceScope="MY"`:
  ```
  isWatchable = any(ownedServiceIds intersects game.broadcastProviders 
                    that are NOT blacked out for user's location)
  Include only if isWatchable = true
  ```
- If `serviceScope="ANY"`:
  - Include all legal broadcasts (ownership not required)
  - Still compute blackouts for badges, but do NOT exclude

**Blackout Logic:**
- Use only to filter in `MY_SERVICES` case
- In `ANY_SERVICE` case, only for display badges

**Date:**
- List's date window (today ±N days) handled by screen
- Predicate assumes game is within window

### Apply in Data Pipeline:

1. After fetch and group games, filter each day's items with predicate
2. If a day becomes empty, skip that section
3. When filters change:
   - Re-run predicate and re-render
   - Do NOT auto-scroll unless:
     - User changed date window
     - User pressed "Go To Today"

---

## E) BADGES (Visual-Only)

### Elsewhere (Yellow) Badge:
- Show if game has additional providers beyond shown OR available on providers user doesn't own
- Controlled by `showElsewhereBadges` (default ON)

### National (Blue) Badge:
- Show if game is flagged as nationally televised
- Controlled by `showNationalBadges` (default ON)

**Important:** Neither badge affects predicate or results. Pure display.

---

## F) EMPTY STATES (Triggered in List)

### ALL GAMES ON MY SERVICES → 0 Results:
Show empty card: "No games on your services right now."

Actions:
- Turn On 'Any Service' → switch to `ALL_GAMES_ANY_SERVICE`
- Manage Services → open services section
- My Teams → switch to `MY_TEAMS_MY_SERVICES`
- Next Day → advance date window one day

### MY_TEAMS* but User Follows Nothing:
Offer to:
- Follow Teams
- See All Games (switch to `ALL_GAMES_*` with same service scope)

---

## G) TEST PLAN (Click to Prove It Works)

1. **MY TEAMS • ON • MY SERVICES**
   - List shows only games with followed teams
   - Only watchable on owned services (no blacked-out)

2. **MY TEAMS • ON • ANY SERVICE**
   - Same teams
   - All legal options (even if user doesn't own)

3. **ALL GAMES • ON • MY SERVICES**
   - Any team
   - Only watchable on owned services

4. **ALL GAMES • ON • ANY SERVICE**
   - The firehose
   - Everything legal within date window

5. **Exclude Followed Team**
   - In Teams, minus a followed team
   - Disappears from MY TEAMS results without unfollowing

6. **Pick Specific Teams**
   - Choose 2 non-followed teams
   - Appear in results
   - Star to follow is optional, persists if tapped

7. **Badge Toggles**
   - Turn off Elsewhere/National
   - Rows stop showing labels
   - Result sets don't change

8. **Sports Filter**
   - Select NHL only
   - List narrows instantly across all quick views

9. **Clear Sports**
   - All Sports
   - Widening works, performance smooth

10. **Owned Service Changes**
    - Toggle YouTube TV on/off
    - Immediately affects MY_SERVICES watchability

---

## H) PERFORMANCE + UX GUARDRAILS

- **Debounce searches:** ≈250 ms
- **Virtualize long lists:** Teams section
- **Smooth re-renders:** When filters change, avoid janky scroll resets
- **Apply button:** Disabled until something changed
- **Cancel:** Discards changes

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Store Update
- [ ] Update appStore with new FiltersState shape
- [ ] Implement derived selectors (effectiveTeamIds, teamScope, serviceScope)
- [ ] Implement all actions
- [ ] Add migration logic for old → new preset IDs
- [ ] Test store in isolation

### Phase 2: Predicate Function
- [ ] Create `buildMatchPredicate` in `lib/filters-v2-engine.ts`
- [ ] Implement sports filtering
- [ ] Implement teams filtering (MY vs ALL)
- [ ] Implement services filtering (MY vs ANY with blackout rules)
- [ ] Add unit tests for predicate logic

### Phase 3: List Integration
- [ ] Apply predicate in DailyV3
- [ ] Handle empty sections
- [ ] Smooth re-rendering on filter changes
- [ ] Prevent unwanted scroll resets

### Phase 4: Empty States
- [ ] Add empty state cards
- [ ] Wire up action buttons
- [ ] Test all scenarios

### Phase 5: E2E Testing
- [ ] Run through all 10 test scenarios
- [ ] Performance testing with large datasets
- [ ] Edge case handling

---

**If anything conflicts with previous guidance, treat this document as authoritative for the wiring.**
