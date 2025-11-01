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
**Updated:** Simplified team selection by removing teamsMode system (October 19, 2025)

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

**Major Simplification (October 19, 2025):**
- Removed complex `teamsMode` system ('followed' vs 'pick_specific')
- Replaced with direct team selection via `selectedTeams` array
- Simplified filtering engine to work without mode concept
- Updated TeamsSectionV3 with simpler star + check pattern
- See `FILTERS_V2_MIGRATION.md` for full details

**Files:**
- `src/components/ui/filters-v2/FiltersSheetV2.tsx` - Main component
- `src/components/ui/filters-v2/QuickViewsRadio.tsx` - 2×2 grid
- `src/components/ui/filters-v2/SportsChipsV2.tsx` - Sports with search
- `src/components/ui/filters-v2/TeamsSectionV3.tsx` - Teams with star + check (V3 = current, V2 = deprecated)
- `src/components/ui/filters-v2/BadgesLabelsSection.tsx` - Independent badges
- `src/components/ui/filters-v2/CollapsibleSection.tsx` - Reusable header
- `src/components/ui/filters-v2/types.ts` - Comprehensive type definitions (teamsMode removed)
- `src/components/ui/filters-v2/presets.ts` - Sports catalog + preset logic (simplified)
- `src/lib/filters-v2-engine.ts` - Filtering logic (teamsMode removed)
- `FILTERS_V2_MIGRATION.md` - Migration documentation

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

## AI ROUTING & TTS PIPELINE

**Architecture Decision:** See [ADR-0005: AI and Voice Stack](/docs/adr/0005-ai-and-voice-stack.md) for full decision rationale.

### AI Router Flow

```
User Message
    ↓
┌───────────────────┐
│   AI Router       │
│   (Rule-based)    │
└───────────────────┘
    ↓
Decision: Groq (99%) or Grok (1%)
    ↓
┌───────────────────┐         ┌───────────────────┐
│  Groq Llama 3.1   │   OR    │  Grok 4 Fast      │
│  Primary (Fast)   │         │  Fallback (Complex)│
└───────────────────┘         └───────────────────┘
    ↓
Function Calls (Backend APIs)
    ↓
Response + Telemetry
```

### Router Decision Logic

**Primary Model (99% of requests):**
- **Model:** Groq Llama-3.1-8B Instruct
- **When:** All standard queries (default)
- **Cost:** ~$0.05-0.10 per 1M tokens
- **Latency:** <500ms

**Fallback Model (1% of requests):**
- **Model:** xAI Grok 4 Fast Reasoning
- **When:** Feature flag `ROUTER_ESCALATE=true` + complex scenarios
- **Triggers:**
  - Context length >8K tokens
  - Multi-step explanations required
  - Tool failures needing reasoning
  - User explicitly requests detailed breakdown
- **Cost:** ~$5-15 per 1M tokens
- **Latency:** ~1-2s

**Routing Rules:**
```typescript
function selectModel(request: ConciergRequest): ModelConfig {
  // Feature flag check (default: always use Groq)
  if (!process.env.ROUTER_ESCALATE) {
    return GROQ_CONFIG;
  }
  
  // Rare escalation conditions
  if (
    request.contextLength > 8000 ||
    request.requiresMultiStepReasoning ||
    request.hadToolFailure ||
    request.userRequestedDetail
  ) {
    return GROK_CONFIG;
  }
  
  return GROQ_CONFIG;
}
```

### Memory Pack Assembly

Each AI call assembles lightweight context (≤1,500 tokens total):

1. **USER_PROFILE** (≤400 tokens)
   - ZIP code, subscriptions, followed teams
   - Theme preferences, notification settings
   - Loaded from `users` + `concierge_memory` tables

2. **RUNNING_SUMMARY** (≤400 tokens)
   - Persistent patterns (border DMA issues, preferences)
   - Only updated when durable facts change
   - Stored in `concierge_memory.running_summary`

3. **RECENT_TURNS** (≤300 tokens)
   - Last 4-6 conversation exchanges
   - Short-term conversational context
   - Not persisted (session-only)

4. **FACT_PACK** (≤300 tokens)
   - Tonight's games for followed teams
   - Broadcast info, blackout status
   - Generated on-demand from `games` table

### Function Calling (Tool Use)

**Available Functions:**
- `get_user_games()` - Tonight's games for user's teams
- `check_blackout(game_id, zip)` - Blackout status
- `get_legal_alternatives(game_id, zip)` - Alternative viewing options
- `update_user_preferences(...)` - Modify user settings
- `send_watch_deeplink(service_code, game_id)` - Generate deep link

**Security:**
- All functions go through backend API (no direct DB access)
- Validate all inputs (game IDs, ZIP codes, etc.)
- Rate limit per user
- Log all function calls for audit

### Telemetry & Cost Tracking

**Per Request:**
```typescript
{
  timestamp: Date,
  user_id: UUID,
  model_used: 'groq' | 'grok',
  tokens_in: number,
  tokens_out: number,
  latency_ms: number,
  cost_estimate: number, // USD
  function_calls: string[], // Functions used
  error: string | null
}
```

**Stored in:** `concierge_usage` table (daily aggregates)

**Alerts:**
- Daily spend threshold: $100/day
- Circuit breaker: $150/day (pause service)
- Per-user anomalies: >100 tokens per message avg
- Model failures: >5% error rate

---

### TTS Pipeline

```
Text Response
    ↓
┌───────────────────┐
│  Cache Check      │
│  (Hash lookup)    │
└───────────────────┘
    ↓
Cache Hit? → Serve Cached Audio
    ↓ (Miss)
┌───────────────────┐         ┌───────────────────┐
│  Google TTS       │   OR    │  ElevenLabs       │
│  (Primary)        │         │  (Premium)        │
└───────────────────┘         └───────────────────┘
    ↓
Synthesize Audio (MP3/OGG)
    ↓
Store in Cache (S3/GCS)
    ↓
Serve to Client
```

### TTS Provider Selection

**Primary (All Tiers):**
- **Provider:** Google Cloud TTS (Neural2/WaveNet)
- **Voices:** 6-8 stock personas
- **Cost:** ~$16 per 1M characters
- **Quality:** Natural, professional

**Premium (Paid Tier):**
- **Provider:** ElevenLabs
- **Voices:** 2 sporty personalities + custom
- **Cost:** ~$60 per 1M characters
- **Quality:** Character-driven, expressive

**Fallback (Free Tier):**
- **Provider:** Device TTS (AVSpeechSynthesizer/Android TTS)
- **Cost:** $0
- **Quality:** Robotic but functional

### TTS Caching Strategy

**Cache Key Generation:**
```typescript
const cacheKey = hash({
  text: string,
  voice_id: string,
  ssml_prosody: string,
  language_code: string
});
```

**Cache TTL:**
- **Common phrases:** 30 days (e.g., "Good evening", "Let me check")
- **Dynamic content:** 7 days (team-specific, game-specific)
- **User-specific:** 7 days

**Cache Storage:**
- **Backend:** S3/GCS bucket or Supabase Storage
- **Format:** MP3 (iOS) + OGG (Android) both stored
- **Metadata:** duration, size, synthesis_timestamp

**Cache Hit Rate Target:**
- Month 1: 40% (common phrases)
- Month 3: 60% (ML-optimized)
- Steady State: 65-70%

### Voice Persona Mapping

**Personas use stock Google Neural2 voices with SSML adjustments:**

```typescript
const PERSONAS = {
  national_desk: {
    voice: 'en-US-Neural2-G',
    ssml: '<prosody rate="1.0" pitch="+0st"/>',
  },
  midwest_playbyplay: {
    voice: 'en-US-Neural2-D',
    ssml: '<prosody rate="1.08" pitch="+0st"/>',
  },
  new_england_chalk: {
    voice: 'en-US-Neural2-B',
    ssml: '<prosody rate="0.96" pitch="-1st"/>',
  },
  // ... 5 more personas
};
```

**Context-Aware Adjustments:**
- Alerts: `rate="1.06"` (slight excitement)
- Nightly rundown: `rate="1.0"` (neutral)
- Concierge replies: `rate="0.98-1.02"` (conversational)

### Rate Limiting & Guardrails

**Per-User Limits:**
- **Free Tier:**
  - AI: 3 messages/day, 2,000 tokens/request
  - TTS: Device voices only (no cloud cost)
- **Premium Tier:**
  - AI: 100 messages/month (soft), 30/day (soft)
  - TTS: Unlimited cloud voices

**Global Limits:**
- **Daily Budget:** $100/day AI + TTS combined
- **Circuit Breaker:** $150/day (pause service, alert dev)
- **Per-Minute:** 10 requests/user/minute max

**Error Handling:**
- Groq failure → Retry once, then error to user
- Grok failure → Fall back to Groq (if context allows)
- TTS failure → Fall back to device TTS
- Cache failure → Synthesize without cache, log error

### Feature Flags

**AI/Voice System:**
```typescript
AI_ROUTING_ENABLED=true           // Enable model router
ROUTER_ESCALATE=false             // Enable Grok fallback
ELEVENLABS_ENABLED=false          // Enable premium voices
VOICE_CACHE_ENABLED=true          // Enable TTS caching
AI_MAX_TOKENS_PER_REQ=2000       // Token ceiling
AI_DAILY_BUDGET_USD=100          // Daily spend cap
TTS_DAILY_BUDGET_USD=50          // TTS spend cap
```

### Client-Side Integration

**Mobile apps never call LLM/TTS directly:**
```
Mobile App
    ↓ (HTTPS)
Backend API (Supabase Edge Function)
    ↓
AI Router / TTS Provider
    ↓
Response to Mobile
```

**Security:**
- All API keys server-side only
- Client sends auth token + request
- Backend validates user tier, rate limits
- Backend assembles Memory Pack (never sent to client)

---

### Cost Projection (10K Users)

**Monthly Breakdown:**
```
Groq LLM:        $135   (2.7B tokens @ $0.05/1M)
Grok LLM:        $45    (300M tokens @ $0.15/1M)
Google TTS:      $560   (35M chars @ $16/1M, after 65% cache hit)
ElevenLabs:      $300   (5M chars @ $60/1M, premium only)
Cache Storage:   $50    (50GB S3/GCS)
Bandwidth:       $100   (API/CDN)
──────────────────────
TOTAL:           ~$1,190/month
Per User:        ~$0.12/month
```

**Scaling:**
- 50K users: ~$6K/month
- 100K users: ~$12K/month
- <10% of projected revenue at scale

---

### Implementation Checklist

**Phase 1: AI Router (Week 1)**
- [ ] Implement router logic (Groq primary)
- [ ] Add Groq API integration
- [ ] Function-call tools (backend APIs)
- [ ] Telemetry logging
- [ ] Cost tracking

**Phase 2: TTS System (Week 2)**
- [ ] Google TTS integration
- [ ] Voice persona mapping
- [ ] Cache layer (S3/GCS)
- [ ] Device TTS fallback
- [ ] Settings UI

**Phase 3: Grok Fallback (Week 3)**
- [ ] Add Grok API integration
- [ ] Implement escalation rules
- [ ] Test edge cases
- [ ] A/B test escalation value

**Phase 4: Premium Features (Week 4)**
- [ ] ElevenLabs integration
- [ ] Premium voice gating
- [ ] Usage analytics
- [ ] Upsell messaging

---

**Remember:** This document exists because we learned the hard way. Read it before major decisions.

---

## DEVELOPMENT WORKFLOW (Token-Safe)

### Commit & Push
- Commit working changes frequently; use concise messages (`fix:`, `feat:`, `refactor:`, `docs:`, `chore:`).
- Never commit secrets, `.env`, `node_modules`, or build artifacts.

### Reviews
- Share **links** to commits/PRs; do **not** paste large diffs or full files into chat.

### Editing Rules (avoid token blowups)
- **Never paste full files or `final_file_content` into chat.**
- Read files from disk; when proposing changes, show a **minimal unified diff** (only the edited lines with ≤5 lines of context).
- Logs/JSON > 40 lines → save to `docs/_artifacts/<slug>.txt` and link the path with a 1–2 sentence summary.

### Chat Guardrails
- Keep each assistant reply under ~10k tokens.
- If a reply would exceed that, stop and write a brief summary to `docs/PROJECT_SUMMARY.md` (≤800 words), then continue using that summary.

### Quick Commands
```bash
git add -A && git commit -m "feat: <what changed>" && git push
git log --oneline
git reset --hard <good-commit> && git push -f