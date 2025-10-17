# 🚀 WhereBall Development TODO

**Status:** DailyV3 Core Complete - October 13, 2025  
**Context:** Successfully rebuilt infinite scroll with SectionList - rock solid!

---

## ✅ **COMPLETED - Core Scroll Infrastructure (Oct 13, 2025)**

### **DailyV3 - SectionList Implementation**
- ✅ Opens on today every time
- ✅ Zero scroll jitter
- ✅ Sticky date headers
- ✅ Expand/collapse cards
- ✅ "Go To Today" button (works from any position, first tap)
- ✅ Infinite scroll backward (30 days at a time)
- ✅ Infinite scroll forward (30 days at a time)
- ✅ Smooth with thousands of dynamically loaded items

### **Card Layout - Scoreboard Style**
- ✅ City code (3-letter abbreviation) on top
- ✅ Team mascot name below
- ✅ Left-justified away team, right-justified home team
- ✅ Scores displayed with proper alignment

**Files:**
- `src/screens/home/DailyV3.tsx` - Main scroll implementation
- `src/screens/home/TonightScreen.tsx` - Re-exports DailyV3
- `src/components/daily-v2/VerticalGameCard.tsx` - Scoreboard-style collapsed card
- `src/components/daily-v2/VerticalGameCardExpanded.tsx` - Expanded card view
- `src/components/daily-v2/DateHeader.tsx` - Sticky date headers

---

## ✅ **COMPLETED - FiltersV2 Rebuild (Oct 16, 2025)**

### **Complete Rebuild per SportStream Spec**
- ✅ QuickViewsRadio - 2×2 grid with MY TEAMS/ALL GAMES × MY SERVICES/ANY SERVICE
- ✅ SportsChipsV2 - 50+ sports catalog with search functionality
- ✅ TeamsSectionV2 - Mode switcher (Followed vs Pick Specific) with star/plus/minus controls
- ✅ BadgesLabelsSection - Independent visual toggles (Elsewhere, National)
- ✅ CollapsibleSection - Reusable header component
- ✅ FiltersSheetV2 - Main integration with proper state management
- ✅ Updated types.ts with new QuickView IDs, TeamsMode, 50+ sports
- ✅ Updated presets.ts with sports catalog and new preset logic
- ✅ Bug fix: Safe preset access to handle old store data

**Files Created/Updated:**
- `src/components/ui/filters-v2/FiltersSheetV2.tsx`
- `src/components/ui/filters-v2/QuickViewsRadio.tsx`
- `src/components/ui/filters-v2/SportsChipsV2.tsx`
- `src/components/ui/filters-v2/TeamsSectionV2.tsx`
- `src/components/ui/filters-v2/BadgesLabelsSection.tsx`
- `src/components/ui/filters-v2/CollapsibleSection.tsx`
- `src/components/ui/filters-v2/types.ts`
- `src/components/ui/filters-v2/presets.ts`

---

## 📋 **UP NEXT - High Level Priorities**

### **Phase 1: FiltersV2 Wiring (See FILTERS_WIRING_PLAN.md)**

**Store Update:**
- [ ] Update appStore with new FiltersState shape (Sets, not arrays)
- [ ] Implement derived selectors (effectiveTeamIds, teamScope, serviceScope)
- [ ] Implement all actions (setQuickView, markCustom, applyFilters, etc.)
- [ ] Add migration logic for old preset IDs → new IDs
- [ ] Test store in isolation

**Predicate Function:**
- [ ] Create `buildMatchPredicate` in `lib/filters-v2-engine.ts`
- [ ] Implement sports filtering (empty = all sports)
- [ ] Implement teams filtering (MY vs ALL with effectiveTeamIds)
- [ ] Implement services filtering (MY_SERVICES with blackout rules vs ANY_SERVICE)
- [ ] Add unit tests for predicate logic

**List Integration:**
- [ ] Apply predicate in DailyV3 data pipeline
- [ ] Handle empty sections gracefully
- [ ] Smooth re-rendering on filter changes (no scroll resets)
- [ ] Wire team follow/unfollow to actual API
- [ ] Wire service ownership to actual API

**Empty States:**
- [ ] Add empty state cards for no results scenarios
- [ ] Wire up action buttons (Turn On Any Service, Manage Services, etc.)
- [ ] Test all empty state scenarios

**E2E Testing:**
- [ ] Run through all 10 test scenarios from wiring plan
- [ ] Performance testing with large datasets
- [ ] Edge case handling
- [ ] Test state persistence across app restarts

### **Phase 2: Card Refinements**
- [ ] Finalize expanded card layout (detail view)
- [ ] Review and adjust card spacing/sizing if needed
- [ ] Verify all broadcast/service indicators work correctly
- [ ] Polish animations and transitions

### **Phase 3: Menu/Settings**
- [ ] Review existing SettingsScreen
- [ ] Add any missing settings options
- [ ] Wire up all settings to global state
- [ ] Test settings persistence

### **Phase 4: AI Assistant Integration**
- [ ] Integrate AI concierge UI/UX
- [ ] Wire up to Groq/xAI backend
- [ ] Implement context-aware responses
- [ ] Add voice/TTS system (Google Neural2)
- [ ] Test fair-use limits and rate limiting

### **Phase 5: Onboarding Expansion**
- [ ] Update onboarding for 5 sports (NHL, NBA, MLB, NFL, NCAA)
- [ ] Integrate AI assistant from onboarding start
- [ ] Test multi-sport team selection
- [ ] Update onboarding breadcrumbs

### **Phase 6: Multi-Sport Support**
- [ ] Add NBA data integration
- [ ] Add MLB data integration  
- [ ] Add NFL data integration
- [ ] Add NCAA data integration
- [ ] Test league switching
- [ ] Maintain scroll stability across sports

---

## 🎯 **Current Session Focus**

**Just Completed:**
- DailyV3 complete rebuild with SectionList
- Card layout updated to scoreboard style
- "Go To Today" fixed for all edge cases
- Architecture documentation updated

**Next Steps (Your Choice):**
1. Expanded card layout refinements
2. Filter integration
3. Other priorities you identify

---

## 📝 **NOTES**

### **What We Learned**
- SectionList is the right tool for date-sectioned data
- Build incrementally and test each feature
- Use framework APIs instead of fighting them
- Document wins and losses in ARCHITECTURE.md

### **Technical Debt / Future Improvements**
- Consider adding pull-to-refresh
- Add loading skeletons for better UX during data loads
- Implement caching strategy for frequently accessed dates
- Add haptic feedback for key interactions

---

**Last Updated:** October 16, 2025 7:38 PM
**Commit:** FiltersV2 complete rebuild per SportStream spec
