# 🚧 WhereBall UX Overhaul - TODO

**Status:** Phase 1 Complete (70% done) - Context preserved for continuation  
**Started:** 2025-10-08  
**Context:** Major redesign implementing global filters + new top bar across all views

---

## ✅ **COMPLETED (Committed)**

### **1. Global Filter State (Zustand)**
- ✅ Added `GameFilters` interface to `src/store/appStore.ts`
- ✅ Implemented `toggleFilter()` and `resetFilters()` methods
- ✅ Default: `myTeamsOnly: true`, others false

### **2. FilterBottomSheet Component**
- ✅ Created `src/components/ui/FilterBottomSheet.tsx`
- ✅ Professional bottom sheet with checkboxes
- ✅ "Clear All" and "Apply" buttons
- ✅ Badge showing active filter count
- ✅ `hideLiveFilter` prop for Weekly/Team views

### **3. TonightScreen - Partially Migrated**
- ✅ Added FilterBottomSheet import
- ✅ Connected to global filter state
- ✅ Updated `filteredGames` logic to use global filters
- ⚠️ **BROKEN** - Still has old filter UI code (see issues below)

---

## ⚠️ **CURRENT ISSUES (Must Fix)**

### **TonightScreen.tsx - TypeScript Errors**

**Line 265:** `setFiltersExpanded` - doesn't exist (was removed)  
**Line 265, 269, 274:** `filtersExpanded` - doesn't exist  
**Lines 278, 288, 298, 308, 318:** `toggleFilter` - not a local function anymore

**Root Cause:** Old inline filter UI code wasn't fully removed

---

## 🔧 **NEXT STEPS (Resume Here)**

### **STEP 1: Fix TonightScreen.tsx (30 min)**

#### **A. Remove Old Filter UI (Lines ~260-330)**
Delete this entire block:
```typescript
{/* Filter Button */}
<TouchableOpacity
  style={styles.filterButton}
  onPress={() => setFiltersExpanded(!filtersExpanded)}
  ...
</TouchableOpacity>

{/* Filter Options */}
{filtersExpanded && (
  <View style={styles.filtersContainer}>
    ... all the chips ...
  </View>
)}
```

#### **B. Update Top Bar (Lines ~390-410)**
Change from:
```typescript
<View style={styles.topBar}>
  <Text style={styles.topBarTitle}>🏒 WhereBall</Text>
  <TouchableOpacity ... onPress={handleSettingsPress}>
    <Text>⚙️</Text>
  </TouchableOpacity>
</View>
```

To:
```typescript
<View style={styles.topBar}>
  <TouchableOpacity onPress={handleSettingsPress}>
    <Text style={styles.hamburger}>☰</Text>
  </TouchableOpacity>
  <Text style={styles.topBarTitle}>🏒 WhereBall</Text>
  <TouchableOpacity onPress={() => setShowFilters(true)}>
    <View style={styles.filterIconWrapper}>
      <Text style={styles.filterIcon}>🎚️</Text>
      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
</View>
```

#### **C. Add FilterBottomSheet Before </SafeAreaView>**
```typescript
<FilterBottomSheet
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  hideLiveFilter={false}
/>
```

#### **D. Remove Emoji from Header (Line ~230)**
Delete: `<Text style={styles.emoji}>🏒</Text>`

#### **E. Update Arrows to Blue (Lines ~242-265)**
Change:
```typescript
dateArrow: {
  width: 40,    // smaller
  height: 40,
  backgroundColor: 'transparent',  // no grey circle
  alignItems: 'center',
  justifyContent: 'center',
},
dateArrowText: {
  fontSize: 24,   // larger
  color: '#0066CC',  // blue
  fontWeight: '600',
},
```

#### **F. Update Header Padding (Line ~502)**
Change: `paddingTop: 24` → `paddingTop: 20`

---

### **STEP 2: Update WeeklyView.tsx**

#### **A. Add Same Top Bar (Before Tab Bar)**
Insert after `<SafeAreaView>` (or reuse from TonightScreen parent)

#### **B. Add Filter State**
```typescript
const [showFilters, setShowFilters] = useState(false);
const { filters } = useAppStore();
```

#### **C. Apply Filters to Games**
Before rendering day sections, filter `gamesByDate`:
```typescript
const filteredGamesByDate = useMemo(() => {
  if (filters.showAll) return gamesByDate;
  
  const filtered: Record<string, NHLGame[]> = {};
  Object.keys(gamesByDate).forEach(dateKey => {
    const dayGames = filterGamesArray(gamesByDate[dateKey]);
    if (dayGames.length > 0) {
      filtered[dateKey] = dayGames;
    }
  });
  return filtered;
}, [gamesByDate, filters]);

// Helper function
const filterGamesArray = (games: NHLGame[]) => {
  let filtered = [...games];
  if (filters.myTeamsOnly) {
    filtered = filtered.filter(/* my teams logic */);
  }
  if (filters.nationalOnly) {
    filtered = filtered.filter(/* national logic */);
  }
  if (filters.availableOnly) {
    filtered = filtered.filter(/* services logic */);
  }
  return filtered;
};
```

#### **D. Add FilterBottomSheet**
```typescript
<FilterBottomSheet
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  hideLiveFilter={true}  // Weekly doesn't need "Live Only"
/>
```

---

### **STEP 3: Update TeamScheduleView.tsx**

#### **A. Replace Summary Card with Stats Bar**
Change from percentage card to Weekly-style bar:
```typescript
{totalMyTeamGames > 0 && (
  <View style={styles.statsBar}>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{availableGames}</Text>
      <Text style={styles.statLabel}>Available</Text>
    </View>
    {blackedOutGames > 0 && (
      <>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.statNumberWarning]}>
            {blackedOutGames}
          </Text>
          <Text style={styles.statLabel}>Blackouts</Text>
        </View>
      </>
    )}
  </View>
)}
```

#### **B. Add Filter Logic**
Same as WeeklyView - filter `games` array before rendering

#### **C. Add FilterBottomSheet**
```typescript
<FilterBottomSheet
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  hideLiveFilter={true}
/>
```

---

### **STEP 4: Visual Sync (Original Requirements)**

#### **ServiceBadge Integration**
**Files:** `TonightScreen.tsx` (GameCard.tsx), `TeamScheduleView.tsx`

Currently:
- Daily uses GameCard (may already have badges)
- Team uses plain text badges

Action: Ensure both use colored `ServiceBadge` component

#### **Arrow Styles** (Already in Step 1-E)
- All views: Blue (#0066CC), 24px, no background circles

#### **Spacing Harmony**
- All headers: `paddingTop: 20`
- Consistent gaps between elements

---

## 📋 **STYLE REFERENCE**

### **New Top Bar**
```typescript
topBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 24,
  paddingVertical: 12,
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
},
hamburger: {
  fontSize: 24,
  color: '#666666',
},
topBarTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#000000',
},
filterIconWrapper: {
  position: 'relative',
},
filterIcon: {
  fontSize: 24,
  color: '#666666',
},
filterBadge: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#0066CC',
  borderRadius: 10,
  paddingHorizontal: 6,
  paddingVertical: 2,
  minWidth: 20,
},
filterBadgeText: {
  color: '#FFFFFF',
  fontSize: 11,
  fontWeight: '700',
},
```

### **Stats Bar (Team View)**
```typescript
statsBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  backgroundColor: '#F8F9FA',
  borderRadius: 12,
  gap: 16,
  marginBottom: 16,
},
statItem: {
  alignItems: 'center',
},
statNumber: {
  fontSize: 24,
  fontWeight: '700',
  color: '#0066CC',
  lineHeight: 28,
},
statNumberWarning: {
  color: '#FF6B35',
},
statLabel: {
  fontSize: 12,
  color: '#666666',
  marginTop: 2,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
statDivider: {
  width: 1,
  height: 32,
  backgroundColor: '#E0E0E0',
},
```

---

## 🎯 **ACCEPTANCE CRITERIA**

When complete, verify:

### **All 3 Views (Daily, Weekly, Team)**
- [ ] Top bar: `[☰] WhereBall [🎚️]`
- [ ] Hamburger opens Settings
- [ ] Filter icon opens FilterBottomSheet
- [ ] Badge shows active filter count
- [ ] Blue arrows (not grey)
- [ ] No emoji in Daily header
- [ ] Consistent spacing (paddingTop: 20)

### **Filters Work Globally**
- [ ] Changing filter in Daily affects Weekly/Team
- [ ] "My Teams Only" default ON
- [ ] "Show All" overrides other filters
- [ ] "Live Only" hidden in Weekly/Team
- [ ] Badge updates correctly
- [ ] Games filter correctly in all views

### **Stats Display**
- [ ] Weekly: Clean stats bar (21 | 2 / GAMES | BLACKOUTS)
- [ ] Team: Matches Weekly style (no percentage card)
- [ ] Daily: Game count text (current)

### **Visual Consistency**
- [ ] ServiceBadge colored pills everywhere
- [ ] Legal disclaimers on all views
- [ ] Clean, professional look

---

## 🚀 **RESUME COMMAND**

To continue this work:
1. Read this TODO.md file
2. Start with STEP 1 (Fix TonightScreen)
3. Work through STEP 2, 3, 4 sequentially
4. Test each view after changes
5. Commit frequently
6. Mark checkboxes as you go

---

## 📝 **NOTES**

- This is ~2 hours of focused work remaining
- All foundations are solid - just UI wiring
- FilterBottomSheet is production-ready
- Global state management working
- No architectural changes needed

**Last Updated:** 2025-10-08 6:03 PM  
**Commit Hash:** 930dd66 (WIP: Major UX overhaul)
