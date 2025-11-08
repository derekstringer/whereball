# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **fix: apply consistent opacity to all elements in past game expanded cards** (2025-11-08)
  - Applied 40% opacity to badge icons (available, elsewhere, national)
  - Applied 40% opacity to section titles (WATCH ON, ALSO STREAMING ON, NATIONALLY TELEVISED ON)
  - Applied 40% opacity to team abbreviations and scores
  - Applied 40% opacity to national network channel names
  - Unified historical appearance matching collapsed card style
  - Related commits: e537d19, b3b4808

- **fix: properly handle sport-level selections in Explore dropdown and search** (2025-11-08)
  - ViewDropdownPopover now displays sport selections as single rows (e.g., "🏒 Hockey (All 32 teams)")
  - Tapping green check removes entire sport from Explore
  - ExploreSearchOverlay now excludes teams whose sport is already selected
  - Also excludes sports that are already selected from results
  - No more duplicate/redundant results when sport or teams are selected
  - Related commit: 82088f1

- **fix: support sport-level selections in Explore (e.g. sport_NHL)** (2025-11-08)
  - DailyV3 now recognizes sport-level selections like `sport_NHL`
  - When sport selected, shows ALL games from that sport (e.g., all 32 NHL teams)
  - Properly splits exploreSelections into sport IDs vs team IDs
  - Supports mixing sport selections with individual team selections
  - Related commit: 2ce1596

### Added
- **feat: Score notifications, Explore UX fixes, and API improvements** (2025-11-03)
  - Bell icon reminders for score notifications (distinct from game start reminders)
  - NHL API caching to prevent repeated requests and errors
  - ErrorBoundary component for graceful error handling
  - Reminder type distinction in app store (score vs game start)
  - Empty state improvements with actionable buttons
  - Related commit: ef1a8f6

### Fixed
- **fix: Explore search double-tap after favoriting teams** (2025-11-03)
  - Resolved issue where users had to double-tap team after favoriting
  - Fixed keyboard dismissal and search state handling
  - Improved team selection flow in Explore search
  - Related commit: ef1a8f6

- **fix: Follow Teams button navigation and styling** (2025-11-03)
  - Fixed navigation to correct screen when tapping Follow Teams
  - Updated button text color for better visibility
  - Related commit: ef1a8f6

- **docs(ai): Record ADR-0005 and update AI/Voice stack across docs** (2025-10-25)
  - Created ADR-0005: AI and Voice Stack decision record
  - Added `docs/ai/overview.md` - comprehensive AI & Voice system overview
  - Added `docs/env.md` - environment variables documentation
  - Created `.env.example` - template for environment configuration
  - Updated `SPEC.md` with ADR reference in AI Concierge section
  - Updated `ARCHITECTURE.md` with AI Routing & TTS Pipeline section
  - Finalized hybrid AI stack: Groq Llama-3.1-8B (primary) + xAI Grok 4 Fast (fallback)
  - Finalized TTS stack: Google Cloud TTS (primary) + ElevenLabs (premium)
  - Documented cost projections: ~$1,190/month for 10K users (~$0.12/user/month)
  - Documented 8 voice personas with SSML prosody adjustments
  - Documented caching strategy targeting 65-70% cache hit rate
  - Related: [ADR-0005](/docs/adr/0005-ai-and-voice-stack.md), [AI Overview](/docs/ai/overview.md)

### Changed
- **feat: Set Reminder feature with outline button style** (2025-10-25)
  - Changed "Reminder Set" button to outline style (transparent bg, cyan border, cyan text/icon)
  - Maintained "Set Reminder" action button as filled cyan
  - Clear visual differentiation: outline = status, filled = action
  - Related commits: fa8823a, 7c14daf

### Fixed
- **fix: Time synchronization for reminder indicators** (2025-10-25)
  - Fixed premature shimmer effect on time pills
  - Synchronized reminder state between collapsed and expanded cards
  - Passed `currentTime` prop to expanded card component
  - Related commit: 48f3b5b

## [0.1.0] - 2025-10-25

### Added
- **feat: Complete Set Reminder system** (15 commits)
  - Dual-time picker with 2hr + 30min defaults
  - Cyan time pill indicators (layered with red urgency)
  - Cyan outline "Reminder Set" button (status indicator)
  - Confirmation dialog with personal UX copy
  - Alert management in appStore (add/remove/check reminders)
  - Only shows for upcoming games (hidden for live/finished)
  - Perfect layered urgency system (cyan border + red background)
  - Related commits: c753de3 through 7c14daf

- **UI/UX Design System Overhaul** (19 commits, 2025-10-25)
  - Migrated to Lucide React Native professional icon system
  - Converted Settings to native bottom sheet (85% height, drag handle)
  - Unified cyan design system (all buttons: cyan bg + black text)
  - Added visual hierarchy enhancements (venue centering, favorite dividers)
  - Implemented game state intelligence (muted buttons for finished games)
  - Related commits: a4a7510 through 5946cf8

- **FiltersV2 Complete Rebuild** (2025-10-16)
  - Modular component architecture with CollapsibleSection pattern
  - QuickViewsRadio: 2×2 grid with new preset IDs
  - SportsChipsV2: 50+ sports catalog with search
  - TeamsSectionV3: Simplified star + check pattern (removed teamsMode)
  - BadgesLabelsSection: Independent visual toggles
  - Proper state management with working copy pattern
  - Related: FILTERS_V2_MIGRATION.md

- **DailyV3 SectionList Implementation** (2025-10-13)
  - Rock-solid infinite scroll with zero jitter
  - Sticky date headers with proper SectionList usage
  - "Go To Today" button (works from any position, first tap)
  - Infinite scroll backward/forward (30 days at a time)
  - Expand/collapse cards maintaining scroll position
  - Scoreboard-style card layout (city codes + mascot names)
  - Related: ARCHITECTURE.md

### Changed
- **Simplified team selection** (2025-10-19)
  - Removed complex `teamsMode` system ('followed' vs 'pick_specific')
  - Replaced with direct team selection via `selectedTeams` array
  - Simplified filtering engine without mode concept
  - Updated TeamsSectionV3 with cleaner star + check pattern

### Documentation
- Added ARCHITECTURE.md with lessons learned
- Added FILTERS_V2_MIGRATION.md for filter system changes
- Added FILTERS_WIRING_PLAN.md for integration guidance
- Added FILTERS_DIALOGS_AND_CONFIRMATIONS.md for UX patterns
- Updated TODO.md with comprehensive task tracking

## [0.0.1] - 2025-10-01

### Added
- Initial project setup
- React Native + Expo boilerplate
- Supabase backend integration
- Basic authentication flow
- Initial team and service selection
- NHL game data integration
- Core UI components

---

## Commit Message Conventions

We follow conventional commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring without feature changes
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependency updates

Example: `feat: add set reminder with dual-time picker`

---

## Links

- [GitHub Repository](https://github.com/derekstringer/whereball)
- [Architecture Guidelines](/ARCHITECTURE.md)
- [Product Specifications](/SPEC.md)
- [Task Management](/TODO.md)
