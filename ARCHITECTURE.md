# WhereBall Architecture Guidelines

**Purpose:** Prevent costly architectural mistakes by following proven patterns FIRST.

**Last Updated:** October 13, 2025

---

## CORE PRINCIPLE: Research Standard Solutions First

Before implementing ANY major UI pattern, answer these questions:

### 1. What's the UI Pattern?
- Infinite scroll with sections? → **SectionList**
- Flat infinite scroll? → FlatList
- Tabs/navigation? → React Navigation tabs
- Form with validation? → React Hook Form

### 2. Is There a Built-In React Native Solution?
**Check React Native docs FIRST**
- React Native has built-in components for 90% of use cases
- They're maintained, documented, and proven
- Custom solutions should be last resort

### 3. Does the Pattern Match the Data?
- Sectioned data (dates → games) = **SectionList** NOT FlatList
- Flat list = FlatList
- Grid = FlatList with numColumns
- Don't force data into wrong component

### 4. What Are the Requirements?
- Sticky headers needed? → SectionList has this built-in
- Infinite scroll? → Both FlatList and SectionList support
- Variable item heights? → Both support (no getItemLayout needed)

---

## SPECIFIC TO THIS PROJECT

### Scrolling Lists with Dates/Games

**CORRECT:** SectionList
```typescript
<SectionList
  sections={[
    {title: "2025-10-12", data: [game1, game2]},
    {title: "2025-10-13", data: [game3]}
  ]}
  renderSectionHeader={({section}) => <DateHeader date={section.title} />}
  renderItem={({item}) => <GameCard game={item} />}
  stickySectionHeadersEnabled={true}
/>
```

**WRONG:** FlatList with mixed array
```typescript
// DON'T DO THIS
<FlatList
  data={[{type:'date'}, {type:'game'}, {type:'game'}, {type:'date'}]}
/>
```

**Why Wrong:**
- Indices shift when adding to beginning (causes jumps)
- Sticky headers don't work properly
- `maintainVisibleContentPosition` unreliable
- Fighting against the framework

---

## LESSONS FROM THIS PROJECT

### Mistake #1: DailyV2 - Used FlatList for Sectioned Data
**Cost:** 3+ hours, $20+ in API costs, user frustration

**What Went Wrong:**
1. Didn't check if SectionList existed
2. Implemented custom solution (flat array with type markers)
3. Fought React Native behavior for hours
4. Multiple failed "fixes" that broke other things

**What Should Have Happened:**
1. Identified requirement: "dates with games underneath"
2. Searched React Native docs: "sectioned list"
3. Found SectionList component
4. Implemented in 30 minutes
5. Sticky headers work automatically

### Success #1: DailyV3 - Complete Rebuild with SectionList
**Achievement:** Rock-solid infinite scroll with zero jitter (October 13, 2025)

**What We Did Right:**
1. Started from scratch with SectionList (learned from mistake above)
2. Built incrementally: core scroll → expand/collapse → "Go To Today" → infinite loading
3. Tested each feature before adding the next
4. Used proper SectionList APIs instead of fighting the framework

**Implementation Details:**
- `sections` array with `{title, dateObj, isToday, data}` structure
- Loads today -30 to +60 days initially (91 days)
- Dynamic loading: 30 days backward on scroll near top, 30 days forward via `onEndReached`
- Proper `initialScrollIndex` calculation for opening on today
- `isScrollingToToday` flag prevents load triggers during "Go To Today" scroll
- Card expand/collapse maintains scroll position perfectly

**Results:**
- ✅ Opens on today every time
- ✅ Zero scroll jitter
- ✅ Sticky headers work flawlessly
- ✅ "Go To Today" works from any position on first tap
- ✅ Infinite scroll in both directions
- ✅ Smooth with thousands of dynamically loaded items

**Files:**
- `src/screens/home/DailyV3.tsx` - Main scroll implementation
- `src/screens/home/TonightScreen.tsx` - Re-exports DailyV3
- `src/components/daily-v2/VerticalGameCard.tsx` - Scoreboard-style card layout
- `src/components/daily-v2/DateHeader.tsx` - Sticky date headers

### Success #2: FiltersV2 - Modular Component Architecture
**Achievement:** Complete rebuild of filters system following spec (October 16, 2025)

**What We Did Right:**
1. Built modular, reusable components (CollapsibleSection)
2. Separated concerns: QuickViews, Sports, Teams, Services, Badges
3. Used composition over monolithic components
4. Implemented proper state management (working copy pattern)
5. Made badges independent of filter selections (per spec)

**Implementation Details:**
- `QuickViewsRadio` - 2×2 grid with new preset IDs
- `SportsChipsV2` - 50+ sports with search and metadata
- `TeamsSectionV2` - Mode switcher (Followed vs Pick Specific) with star/plus/minus controls
- `BadgesLabelsSection` - Independent toggles that don't affect filtering
- `CollapsibleSection` - Reusable header pattern
- `FiltersSheetV2` - Main integration with proper dirty state detection

**Results:**
- ✅ Clean component separation
- ✅ Reusable patterns (CollapsibleSection)
- ✅ Type-safe with comprehensive TypeScript types
- ✅ Search functionality in Sports and Teams
- ✅ Independent badge toggles (visual only)
- ✅ Proper Apply/Cancel with dirty state tracking
- ✅ 50+ sports catalog with placeholder indicators

**Files:**
- `src/components/ui/filters-v2/FiltersSheetV2.tsx` - Main component
- `src/components/ui/filters-v2/QuickViewsRadio.tsx` - 2×2 grid
- `src/components/ui/filters-v2/SportsChipsV2.tsx` - Sports with search
- `src/components/ui/filters-v2/TeamsSectionV2.tsx` - Teams with mode switcher
- `src/components/ui/filters-v2/BadgesLabelsSection.tsx` - Independent badges
- `src/components/ui/filters-v2/CollapsibleSection.tsx` - Reusable header
- `src/components/ui/filters-v2/types.ts` - Comprehensive type definitions
- `src/components/ui/filters-v2/presets.ts` - Sports catalog + preset logic

### Key Insight
**The framework usually has the right tool already built. Use it first, fight it never.**

---

## DECISION CHECKLIST (Use Before Building)

```
[ ] What UI pattern am I building?
[ ] Does React Native have a built-in component for this?
[ ] Have I read the official docs for that component?
[ ] Does my data structure match the component's design?
[ ] Am I forcing a square peg into a round hole?
[ ] Would a different component be more natural?
```

**If uncertain:** Spend 15 minutes researching before coding.

**Better to delay 15 minutes than waste 3 hours.**

---

## REACT NATIVE COMPONENTS REFERENCE

### Lists
- **SectionList** - For grouped/sectioned data (dates, categories, etc.)
- **FlatList** - For flat homogeneous lists
- **VirtualizedList** - Low-level (rarely needed)

### Scrolling
- **ScrollView** - For short lists that fit in memory
- **SectionList/FlatList** - For infinite scroll

### Sticky Headers
- **SectionList** - Built-in with `stickySectionHeadersEnabled`
- **FlatList** - Has `stickyHeaderIndices` but limited

---

## WHEN TO GO CUSTOM

Only build custom when:
1. No built-in solution exists
2. Built-in solution has critical limitations
3. Performance requires it
4. After proving built-in won't work

**Document why built-in won't work BEFORE building custom**

---

## MAINTENANCE NOTES

Update this document when:
- A major architectural mistake is made
- A pattern is established as best practice
- New React Native versions change recommendations

---

**Remember:** This document exists because we learned the hard way. Read it before major decisions.
