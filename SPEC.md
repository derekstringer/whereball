# WhereBall Product Specification v1.2
**Last Updated:** October 9, 2025  
**Status:** Active Development  
**Platform:** React Native + Expo (iOS/Android)  
**Backend:** Supabase  
**Version Control:** GitHub (private repository)

---

## Document Control
- **Version:** 1.2
- **Previous Versions:** 
  - 1.1 (Cline architectural review)
  - 1.0 (Initial ChatGPT/User collaboration)
- **Changes in v1.2:** 
  - **AI Model Switch:** Grok 4 Fast → Groq Llama 3.1 8B (default) with smart router
  - **Voice/TTS System:** Added comprehensive voice system with Google TTS Neural2, 8 personas, caching
  - **UI Redesign:** Dark-mode-first design system with electric cyan accents, design tokens, NativeWind
- **Next Review:** After MVP launch (Week 6)

---

## I. PRODUCT SUMMARY

**One-line:** WhereBall tells a fan exactly how to legally watch tonight's game based on their ZIP and their subscriptions, with blackout intelligence, a single Watch Now deep-link, and an optional AI concierge to explain the "why."

**Core Promise (MVP):** NHL first (US), then NBA. Personalized "Tonight" for followed teams, with: start time in local TZ, national vs local channel, blackout likelihood, which of THEIR services carry it, and a deep-link to start watching.

**Non-goals (MVP):** No illegal streams; no stats box; no social feed. We are an availability/blackout router, not a scoring app.

**Brand Tone:** Helpful, trustworthy, fast. Zero grey-market vibes.

---

## II. PRICING & PACKAGING

### Subscription Tiers
- **Free (Freemium):** 
  - 1 followed team
  - "Tonight" for that team
  - Basic blackout warning
  - Limited concierge (3 Q&A/day)
  - Ads + affiliate tiles

- **Premium Monthly:** $3.99/mo (15% store fee assumed)
  - Unlimited teams/leagues
  - Ad-free
  - Full blackout reasoning + legal alternatives
  - National-flip alerts
  - Unlimited concierge (fair-use cap: 100/month, 30/day)
  - Premium dynamic team theming

- **Premium Annual:** $34.99/yr (≈ 3.2 months free vs monthly)
  - Messaging: "Save 27% • 3+ months free"
  - Offer "Founders' rate" lock during first 60-90 days

- **Seasonal Pricing (future experiment):** Off-season $2.99, Regular $4.99, Playoffs $6.99 (behind feature flag)

### Paywall Framing
- **Primary:** Annual $34.99 — Best value (Save 27%)
- **Secondary:** Monthly $3.99
- **Trial:** 7-day trial on Monthly only (A/B later)

---

## III. MONETIZATION BEYOND SUBSCRIPTIONS

### A) Ads (Free Tier)
- **Stack:** AdMob / Google Ad Manager mediation
- **Frequency Cap:** 1-2 impressions/session
- **Rules:** No deceptive UI; clear "Sponsored" label
- **Vertical Focus:** Streaming bundles, RSN replacements, broadband/5G
- **Future (flagged):** Geo-gated sportsbooks (21+, disclaimers, state compliance)
- **GDPR/CCPA:** Implement consent flow before showing ads (see Section XV)

### B) Affiliate
- **Initial Partners:** 
  - Sling (CJ)
  - Paramount+ (FlexOffers)
  - Fubo (Impact)
  - ESPN+ (Disney partner)
  - YouTube TV (referral program)
- **Rules:** All links clearly labeled "Affiliate"; never distort organic results
- **Attribution Window:** 90-day cookie tracking; reconcile monthly

### C) Sponsored Placement (Later)
- Labeled "Featured" in separate rail
- Organic best route remains primary

### D) LTV-Aware Upsell
- If free user's 30-day ad+affiliate LTV < $1.50: bias to Premium upsells
- If > $2.00: soft-pedal upsells

---

## IV. LEAGUE SCOPE

- **MVP:** NHL (US) — high blackout confusion (ESPN+/RSNs/nationals)
- **Next (4-6 weeks):** NBA (US)
- **Future:** MLB, NCAA Football
- **Architecture:** League-agnostic design

---

## V. DATA & LOGIC

### A) Schedules & Broadcasters

**Data Sources (Adapter Pattern):**
1. **Primary:** The Sportsdb API (free NHL schedules)
2. **Fallback:** ESPN.com scraping for broadcast metadata
3. **Future:** Official league partnerships if scraping fails

**Data Flow:**
- Ingest league endpoints → normalize to `games` table
- Canonical `broadcasters` payload (national vs RSN)
- Refresh: Hourly standard; 5-minute cadence on game day
- **Staleness Prevention:** 
  - Weekly audit job flags missing/past games
  - Admin override dashboard for bad data
  - Alert on 3+ consecutive ingestion failures

### B) Blackout Heuristic v1 (Transparent)

**Inputs:**
- User ZIP → DMA/metro
- Team territories (seeded heuristic list)
- Broadcaster signals

**Rules:**
1. If user in team's home market + game on team's RSN → "League Pass/ESPN+ likely blacked out"
2. If national broadcast exists (ESPN/TNT/TBS/ABC/NHL Net) → prefer national over RSN
3. If none of user's services carry broadcaster → show legal alternatives (partner links labeled "Affiliate")

**Border DMA Handling:**
- ZIPs on territory boundaries get "Check your provider" message
- "Report Wrong Info" feature for user feedback (tracks accuracy)

**Accuracy Tracking:**
- `blackout_reports` table for user corrections
- KPI: Blackout prediction accuracy rate
- Monthly review of high-report ZIPs

**Copy Requirements:**
- Must include "why" (league rights)
- Link to league policy pages
- Mark as "Likely" where not guaranteed

### C) Channel → Service Matrix

**Data Structure:**
- `services` table with per-service channel carriage
- Nationals relatively stable
- RSNs variable → "Check in your area" provider lookup

**RSN Provider Lookup:**
- Start with generic "Check [RSN website]" links
- Future: Partner with Suppose.tv or JustWatch for API data
- Crowdsource corrections via user feedback

### D) Deep-Linking Strategy

**Supported App Schemes:**
- ESPN, Max, Prime Video, YouTube TV, Hulu Live, Fubo, DirecTV Stream, etc.

**Fallback UX (Graceful Degradation):**
```
[Watch Now] 
  ↓ attempts deep link 
  ↓ if no response after 2s
  ↓ shows fallback:
"Couldn't open [App] automatically. Here's how:
1. Open [App Name] app
2. Search for '[Team] vs [Team]'
3. Start watching
[Copy Game Name]"
```

**Implementation Notes:**
- App schemes tested on iOS + Android during Week 4 QA
- Fallback to app home if event-specific deep link unavailable
- Fallback to App/Play Store if app not installed

---

## VI. ARCHITECTURE & STACK

### Frontend
- **Framework:** React Native + Expo SDK ~54
- **Language:** TypeScript
- **Navigation:** React Navigation v7
- **State:** Zustand + React Query
- **Styling:** NativeWind (TailwindCSS) + design tokens
- **Forms:** React Hook Form

### Backend
- **Platform:** Supabase
  - Auth: Apple/Google/Email
  - Database: Postgres with RLS
  - Edge Functions: Deno for ingest workers
  - Storage: User uploads (future)

### Services
- **IAP:** RevenueCat (handles receipt validation, subscription syncing, webhooks)
- **Push:** Expo Push + FCM/APNs
- **Analytics:** PostHog (events + feature flags)
- **Ads:** Google Mobile Ads SDK (AdMob)
- **AI:** Grok-4 Fast Reasoning via API proxy

### Jobs
- **Schedule Ingest:** Deno worker (Supabase scheduled, hourly)
- **Blackout Calc:** Request-time + cached per ZIP/team/day
- **Data Audit:** Weekly staleness check

---

## VII. DATA MODEL (Postgres)

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  zip TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  marketing_opt_in BOOLEAN DEFAULT false,
  revenuecat_user_id TEXT UNIQUE,
  INDEX idx_users_email (email)
);

-- User Subscriptions (synced via RevenueCat webhook)
CREATE TABLE user_subscriptions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, service_code),
  INDEX idx_user_subscriptions_user_id (user_id)
);

-- Teams
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL,
  short_code TEXT NOT NULL,
  rsn_strings TEXT[],
  primary_colors JSONB, -- {light: '#xxx', dark: '#xxx'}
  secondary_colors JSONB, -- {light: '#xxx', dark: '#xxx'}
  logo_url TEXT,
  INDEX idx_teams_league (league)
);

-- Games
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  home_team_id TEXT REFERENCES teams(id),
  away_team_id TEXT REFERENCES teams(id),
  venue TEXT,
  broadcasters JSONB, -- {national: [...], rsn: [...]}
  national BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled',
  INDEX idx_games_start_ts (start_ts),
  INDEX idx_games_league (league),
  INDEX idx_games_home_team (home_team_id),
  INDEX idx_games_away_team (away_team_id)
);

-- Blackout Territories (heuristic)
CREATE TABLE blackout_territories (
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  territory JSONB, -- {zips: [...], dmas: [...], states: [...]}
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id)
);

-- Services
CREATE TABLE services (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('streaming', 'cable', 'satellite')),
  deep_link_scheme TEXT,
  channel_matrix JSONB, -- {channels: [...], notes: ''}
  provider_lookup_url TEXT
);

-- Follows
CREATE TABLE follows (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  league TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id),
  INDEX idx_follows_user_id (user_id)
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('game_start', 'national_flip')),
  scheduled_ts TIMESTAMPTZ NOT NULL,
  sent_ts TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  INDEX idx_alerts_user_id (user_id),
  INDEX idx_alerts_scheduled_ts (scheduled_ts)
);

-- Paywall Experiments
CREATE TABLE paywall_experiments (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  seen_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  plan TEXT,
  PRIMARY KEY (user_id)
);

-- Concierge Usage
CREATE TABLE concierge_usage (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_count INT DEFAULT 0,
  tokens_est INT DEFAULT 0,
  upsell_shown_count INT DEFAULT 0,
  PRIMARY KEY (user_id, date),
  INDEX idx_concierge_usage_user_date (user_id, date)
);

-- Concierge Memory (durable facts)
CREATE TABLE concierge_memory (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  running_summary TEXT,
  banter_tone_ok BOOLEAN DEFAULT true,
  last_successful_watch JSONB, -- {game_id, service_code, timestamp}
  theme_prefs JSONB, -- {auto_context_enabled, selections, custom_overrides}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Events
CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('impression', 'click')),
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  revenue_est DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_ad_events_user_id (user_id),
  INDEX idx_ad_events_session (session_id)
);

-- Affiliate Events
CREATE TABLE affiliate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner TEXT NOT NULL,
  click_ts TIMESTAMPTZ DEFAULT NOW(),
  conversion_ts TIMESTAMPTZ,
  amount_est DECIMAL(10,2),
  attribution_window INT DEFAULT 90, -- days
  INDEX idx_affiliate_events_user_id (user_id),
  INDEX idx_affiliate_events_partner (partner)
);

-- Blackout Reports (user feedback)
CREATE TABLE blackout_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  zip TEXT NOT NULL,
  reported_status TEXT CHECK (reported_status IN ('incorrect_blackout', 'incorrect_available', 'other')),
  user_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  INDEX idx_blackout_reports_game (game_id),
  INDEX idx_blackout_reports_zip (zip)
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_reports ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY user_subscriptions_own ON user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY follows_own ON follows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY alerts_own ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY concierge_usage_own ON concierge_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY concierge_memory_own ON concierge_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY ad_events_own ON ad_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY affiliate_events_own ON affiliate_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY blackout_reports_own ON blackout_reports FOR ALL USING (auth.uid() = user_id);

-- Public read for teams, games, services, blackout_territories
CREATE POLICY teams_public_read ON teams FOR SELECT USING (true);
CREATE POLICY games_public_read ON games FOR SELECT USING (true);
CREATE POLICY services_public_read ON services FOR SELECT USING (true);
CREATE POLICY blackout_territories_public_read ON blackout_territories FOR SELECT USING (true);
```

---

## VIII. UX / UI SPECIFICATION (MVP)

### A) Onboarding (≤60 seconds)

**Flow:**
1. Sign in (Apple/Google/Email)
2. ZIP entry (auto-detect or manual)
3. Pick services (checkboxes: YouTube TV, Hulu Live, ESPN+, etc.)
4. Pick teams (NHL first; show Free limit: 1 team)
5. Opt-in notifications

**Copy:**
- "We route you to the legal option for YOUR ZIP and services."
- "Pick your streaming services"
- "Follow your team (Free: 1 team)"
- Free users: "Want more teams? Upgrade to Premium" (non-blocking)

### B) Tonight (Home Screen)

**Layout:**
- Cards per followed team
- Example: "Stars @ Predators — 7:00 PM CDT"

**Badges:**
- "Watch: ESPN on YouTube TV" (green if user has service)
- "ESPN+ likely blacked out in 75201 (local rights)" (yellow warning)

**CTA:** 
- Large "Watch Now" button (deep-links to streaming app)

**Interactions:**
- Tap card → Game Details
- "Why?" drawer → plain explanation + alternative route

### C) Game Details

**Information Displayed:**
- Team logos, score (if live), start time
- National broadcasts: ESPN/TNT/TBS/ABC/NHL Net (highlight carried)
- Local/RSN: show RSN name + provider lookup link
- Blackout reasoning (expandable)

**Actions:**
- Alert toggles: Start reminder, National flip (Premium)
- "Report Wrong Info" (links to feedback form)

### D) Concierge (Chat Bubble)

**Access:**
- Floating chat bubble on Tonight/Game Details screens
- Settings toggle: "Concierge On/Off"

**Free Tier:**
- Onboarding help
- 3 Q&A/day
- Usage counter: "2 of 3 questions left today"
- On limit: "You've reached your daily limit. Upgrade to Premium for unlimited help."

**Premium Tier:**
- Unlimited Q&A (fair-use: 100/month, 30/day soft cap)
- Full blackout reasoning
- Cheapest legal add-on suggestions
- One-liner upsells (max 1/session, 3/week)

**Example Upsells:**
- "I can do the live blackout math and route you — that's a Premium perk. Want me to check?"
- "I can watch for last-minute network flips and ping you — in Premium."
- "Need the cheapest legit add-on for your ZIP? Premium can scan that."

### E) Paywall Sheet

**Trigger Points:**
- Attempting to add 2nd team (Free tier)
- Tapping "Why?" for full blackout explanation
- Exceeding concierge limit
- Settings → "Upgrade to Premium"

**Layout:**
- Title: "Unlock WhereBall Premium"
- Bullets:
  - Unlimited teams & leagues
  - Ad-free experience
  - Full blackout explanations + legal alternatives
  - National flip alerts
  - Unlimited concierge help
  - Team-color themes by sport & team (Premium)

**Plans:**
- **Annual $34.99** (Save 27%) [Pre-selected, larger button]
- Monthly $3.99

**Trial:**
- 7-day free trial (Monthly only)
- A/B test: trial vs. no trial

**Legal:**
- Restore purchases
- Manage subscription (links to App/Play Store)
- Privacy Policy
- Terms of Service

### F) Settings

**Sections:**
1. **Account:** Email, logout, delete account
2. **Location & Services:** 
   - Edit ZIP
   - Manage services (checkboxes)
3. **Teams:** 
   - Followed teams manager
   - Free: 1 team limit with upgrade prompt
4. **Notifications:** 
   - Game start reminders (toggle)
   - National flip alerts (Premium, toggle)
   - Quiet hours (time picker)
5. **Theme (Premium):**
   - Auto Theme by Context (ON/OFF)
   - Per-sport team selections
   - Custom color override (color picker)
6. **Concierge:**
   - Enable/Disable (toggle)
   - Usage stats (messages this month)
7. **Subscription:** 
   - Current plan
   - Manage subscription
   - Restore purchases
8. **Legal:** Privacy, Terms, Licenses

---

## IX. PREMIUM THEME: TEAM-COLOR DYNAMIC THEMING

### Goal
Stickiness via pride. Premium users set team-specific color themes that auto-apply based on context (sport/team).

### Behavior

**Context Switching:**
- Global default theme
- Per-sport team themes (NHL, NBA; future MLB/NCAA)
- Viewing game: home team primary + away team accent (contrast-safe)

**Examples:**
- Viewing Cowboys (NFL) → blue/silver theme
- Viewing Longhorns (NCAA) → burnt orange/white theme
- Game Details: home team colors dominate

**User Control:**
- Toggle "Auto Theme by Context (sport/team)" ON/OFF
- Pick from curated palettes per team
- Custom override (color picker)

**Accessibility:**
- Enforce WCAG AA contrast (4.5:1 for text)
- Fallback to neutral when contrast fails
- "Accessible Theme Mode" overrides team colors for high contrast

**Implementation:**

**Design Tokens:**
```typescript
{
  '--color-primary': string,
  '--color-accent': string,
  '--color-bg': string,
  '--color-surface': string,
  '--color-text': string,
  '--color-safe-accent': string // contrast-safe accent
}
```

**Database:**
- `teams.primary_colors`: `{light: '#hex', dark: '#hex'}`
- `teams.secondary_colors`: `{light: '#hex', dark: '#hex'}`
- `concierge_memory.theme_prefs`: `{auto_context_enabled, selections, custom_overrides}`

**Transitions:**
- Smooth CSS transitions (200-300ms) on context change
- Animate primary/accent color shifts

**Copy:**
- "Make WhereBall yours. Premium themes match your team colors automatically — per sport and per game."

---

## X. AI CONCIERGE — INTEGRATED CONTEXT, MEMORY & SCOPE

### A) LLM Router & Model Strategy

**Primary Model:** Groq Llama 3.1 8B Instant
- **Cost:** ~$0.05 per 1M input tokens, ~$0.08 per 1M output tokens (significantly cheaper)
- **Context Window:** 128K tokens
- **Latency:** <1 second for typical queries
- **Use Case:** 99% of all concierge interactions

**Fallback Model:** xAI Grok 4 Fast (rare escalations only)
- **Cost:** ~$5 per 1M input tokens, ~$15 per 1M output tokens
- **Context Window:** 128K tokens
- **Use Case:** Complex explanations, rare edge cases (when ROUTER_ESCALATE=true)

**Router Logic:**

```typescript
// Environment Variables
GROQ_API_KEY=...
XAI_API_KEY=...
MODEL_DEFAULT=llama-3.1-8b-instant
MODEL_FALLBACK=grok-4-fast
ROUTER_MAX_TOKENS_IN=1500
ROUTER_MAX_TOKENS_OUT=160
ROUTER_ESCALATE=false   // Feature flag for fallback

// Routing Decision
function selectModel(request) {
  // 99% of requests → Llama 3.1 8B
  if (!ROUTER_ESCALATE) return MODEL_DEFAULT;
  
  // Rare escalations (when flag enabled)
  if (request.isComplex || request.requiresDeepReasoning) {
    return MODEL_FALLBACK;
  }
  
  return MODEL_DEFAULT;
}
```

**Telemetry Per Call:**
- Provider (groq/xai)
- Tokens in/out
- Latency (ms)
- Cost estimate ($)
- Model used

**Cost Caps:**
- Per-user daily token cap (soft)
- Per-user monthly token cap (soft)
- Global kill-switch on monthly spend threshold
- Alert dev team on cost anomalies

**Context Strategy (Memory Pack):**

Each API call assembles a lightweight "Memory Pack":

1. **USER_PROFILE** (durable facts from DB) — ≤400 tokens
   - ZIP, subscriptions, followed teams, theme prefs, notification prefs

2. **RUNNING_SUMMARY** (evergreen synopsis) — ≤400 tokens
   - Persistent patterns (border DMA, special cases, preferences)
   - Only updated when durable facts change

3. **RECENT_TURNS** (last 4-6 exchanges) — ≤300 tokens
   - Short-term conversational context

4. **FACT_PACK** (tonight's games for user) — ≤300 tokens
   - Next games for followed teams
   - Broadcasters, blackout status

**Total Prompt Budget:** ~1,200-1,500 tokens  
**Default Reply Length:** ≤120 tokens unless detail requested

### B) Durable Memory (Stored in DB)

Stored in `concierge_memory` table:
- `favorite_teams_by_sport`
- `theme_prefs` (auto_context_enabled, selections, custom_overrides)
- `zip`, `subscriptions` (from `users` table)
- `notification_prefs`
- `banter_tone_ok` (default true)
- `last_successful_watch` (game_id + service_code)
- `affiliate_history` (partners clicked/converted)

Stored in `concierge_usage` table:
- Rolling 30-day message count
- Token estimates

### C) Running Summary Rules

- Maintain one editable paragraph (≤400 tokens)
- Captures persistent patterns (e.g., "User is in Dallas but has San Jose ZIP conflicts — prefers Dallas teams")
- Update only when durable facts change
- No secrets beyond stored PII

### D) Scope & Guardrails

**Primary Scope:**
- Watch routing
- Blackout explanations
- Legal alternatives
- Onboarding/settings help

**Allowed Off-Topic:**
- Brief, SFW team-centric banter/jokes (if `banter_tone_ok = true`)
- Max 1 quip per session unless user requests more

**Out-of-Scope (Deflect Kindly):**
- Recipes, general advice, unrelated tech support
- Medical/financial advice
- Illegal stream requests

**Deflection Pattern:**
"I'm your sports-watch concierge, so I stay laser-focused on games and blackouts. For [topic], a general assistant is better."

**Never:**
- Recommend illegal sources
- Guess when data is missing (say "I don't have that info yet")

### E) "Coy" Premium Upsell (Context-Aware)

**Rules:**
- Max 1 upsell line per session
- Max 3 per week per user
- "Not now" sets 7-day cooldown

**Trigger Conditions (when Premium obviously helps):**
- Live blackout math requested
- National flip monitoring mentioned
- Exceeded free Q&A limit
- Cheapest legal add-on scan

**Example One-Liners (rotate):**
- "I can do the live blackout math and route you — that's a Premium perk. Want me to check?"
- "I can watch for last-minute network flips and ping you — in Premium."
- "Need the cheapest legit add-on for your ZIP? Premium can scan that."

**After Upsell:**
- Continue helping regardless of user response
- No blocking or degraded experience

### F) Message Limits & Cost Caps

**Free Tier:**
- 3 messages/day
- Soft monthly cap: 60 messages
- On overage: helpful summary + upsell; never break core app

**Premium Tier:**
- "Unlimited" with fair-use soft cap
- 100 messages/month, 30 messages/day
- On overage: gently throttle responses

**Global:**
- Per-user token budget tracked
- Global kill-switch on monthly spend threshold
- Alert dev team if cost anomalies detected

### G) Humor/Banter Rules

**Conditions:**
- Only if `banter_tone_ok = true` (default)
- User explicitly asks OR natural conversation flow allows
- Max 1 quip per session unless requested

**Guidelines:**
- SFW, team-centric, never mean-spirited
- Examples:
  - "Cowboys fans call it cardio when we pace during 2-minute drills. Want me to check if this one's blacked out in your ZIP?"
  - "Rangers fans know pain. Let me check if MSG is carrying tonight's game."

### H) App Works Without AI

**Core Requirement:**
- All flows (Tonight, Game Details, Watch Now, alerts) functional with Concierge off
- Settings toggle: "Concierge On/Off"
- Hide chat UI when disabled

### I) Theme Tie-In (Premium Stickiness)

**Integration:**
- Use USER_PROFILE + context (sport/team) to drive theme tokens
- Trigger: Viewing team/game OR team mentioned in chat
- NLU tagging: "Can the Rangers beat the Devils?" → tag team_id for Rangers → theme switches

**Implementation:**
- `theme_prefs.auto_context_enabled = true` activates
- Enforce WCAG AA contrast
- Fallback to neutral if needed
- Allow overrides

### J) Runtime System Prompt (Use Verbatim)

```
You are WhereBall Concierge, a fast, trustworthy guide that tells fans exactly how to legally watch their games tonight. You:

- Ground every answer in the provided MEMORY PACK and FACT PACK (never guess).
- Prefer concise, actionable answers with a single 'Watch Now' instruction when possible.
- Explain blackouts plainly and offer legal alternatives.
- Stay within sports-watch scope; for unrelated requests, redirect kindly.
- Use one soft Premium nudge only when it obviously helps now, then keep helping.
- Keep humor SFW and team-centric when invited.
- Default reply length ≤2 sentences unless the user asks for detail.
```

### K) Telemetry Events

**Emit PostHog Events:**
- `concierge_msg` (token_estimate, league, team_id, in_market)
- `concierge_ooscope` (requested_topic)
- `upsell_shown` (context, variant)
- `upsell_dismissed` (cooldown_set)
- `limit_hit_free` (messages_today)
- `limit_hit_premium` (messages_month)
- `banter_used` (quip_type)
- `theme_autoswitch` (league, team_id, from_theme, to_theme)
- `concierge_feedback` (rating, comment)

---

## XI. NOTIFICATIONS

### Push Notification Types

1. **Game Start Reminders**
   - Per followed team
   - 3 hours before game (user-configurable)
   - Quiet hours aware (default 10 PM - 8 AM)
   - Title: "Stars vs Predators starts in 3 hours"
   - Body: "Watch on ESPN (YouTube TV)"

2. **National Flip Alerts (Premium)**
   - When game moves from RSN to national broadcast with <24hr notice
   - Title: "Game tonight moved to ESPN!"
   - Body: "Stars vs Predators now on ESPN instead of Bally Sports"

3. **Weekly Digest (Opt-In)**
   - Sent Monday mornings
   - "This week's watch routes for your teams"
   - Summary of upcoming games

### Implementation
- **Platform:** Expo Push + FCM/APNs
- **Scheduling:** Supabase Edge Function cron job
- **Timezone Handling:** User traveling → adjust alert times to local TZ
- **Permissions:** Request on onboarding; respect "Not Now" selection

---

## XI-A. VOICE/TTS SYSTEM

### Goal
Provide an optional voice layer for concierge responses and alerts, using cloud TTS with regional "sporty personas" while maintaining legal compliance.

### A) TTS Provider & Environment

**Default Provider:** Google Cloud Text-to-Speech (Neural2 voices)

```typescript
// Environment Variables
VOICE_PROVIDER=google          // Options: google|polly|azure
GOOGLE_TTS_KEY=...            // Required for Google
AWS_ACCESS_KEY_ID=...         // Required for Polly
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AZURE_TTS_KEY=...             // Required for Azure
AZURE_TTS_REGION=...
VOICE_CACHE_BUCKET=...        // Supabase Storage bucket
VOICE_DEFAULT_PERSONA=national_desk
VOICE_FREE_USES_CLOUD=false   // When true, allow cloud TTS on Free tier
VOICE_MAX_LEN_CHARS=600       // Hard cap per utterance
```

### B) Voice Personas (8 Regional Styles)

All personas map to **stock Google Neural2 voices** with SSML prosody adjustments. No celebrity impersonations or copyrighted character voices.

**Persona Mapping:**

```typescript
personas = {
  national_desk: {
    voice: 'en-US-Neural2-G',           // Neutral anchor (f)
    ssml: '<prosody rate="1.0" pitch="+0st"/>',
    bio: 'Professional desk anchor',
  },
  midwest_playbyplay: {
    voice: 'en-US-Neural2-D',           // Warm (m)
    ssml: '<prosody rate="1.08" pitch="+0st"/>',
    bio: 'Warm, upbeat play-by-play',
  },
  new_england_chalk: {
    voice: 'en-US-Neural2-B',           // Crisp (m)
    ssml: '<prosody rate="0.96" pitch="-1st"/>',
    bio: 'Brisk, matter-of-fact analyst',
  },
  tri_state_color: {
    voice: 'en-US-Neural2-F',           // Lively (f)
    ssml: '<prosody rate="1.06" pitch="+1st"/>',
    bio: 'Lively color commentary',
  },
  gulf_coast_sideline: {
    voice: 'en-US-Neural2-H',           // Relaxed (m)
    ssml: '<prosody rate="0.94" pitch="-0st"/>',
    bio: 'Relaxed sideline reporter',
  },
  pnw_analyst: {
    voice: 'en-US-Neural2-C',           // Calm (f)
    ssml: '<prosody rate="0.98" pitch="-0st"/>',
    bio: 'Calm, precise analyst',
  },
  studio_host_f: {
    voice: 'en-US-Neural2-F',
    ssml: '<prosody rate="1.0" pitch="+0st"/>',
    bio: 'Confident studio host',
  },
  sideline_reporter_f: {
    voice: 'en-US-Neural2-E',
    ssml: '<prosody rate="1.10" pitch="+1st"/>',
    bio: 'Energetic sideline reporter',
  },
}
```

### C) Context-Aware Styling

Adjust prosody rate based on context:

**Alerts (Game Start Reminders):**
- Use `rate="1.06"` for slight excitement
- Example: "Stars vs Predators starts in 3 hours!"

**Nightly Rundown:**
- Use `rate="1.0"` (desk anchor style)
- Example: "Here are tonight's games for your teams."

**Concierge Replies:**
- Use `rate="0.98-1.02"` (conversational)
- Example: "This game's on ESPN, available on your YouTube TV."

### D) Audio Caching Strategy

**Cache Key:** `Hash(text + persona + ssml + locale)`

**Process:**
1. Generate cache key
2. Check Supabase Storage bucket
3. If hit → serve cached MP3/OGG
4. If miss → synthesize, store, serve

**Benefits:**
- Drastically reduce TTS costs for repeated phrases
- Faster response times
- Example: "Game starts in 3 hours" with same voice → cache hit

### E) Free Tier Fallback (On-Device TTS)

When `VOICE_FREE_USES_CLOUD=false`:

**iOS:** AVSpeechSynthesizer
- Use system voices (Samantha, Fred, etc.)
- No cloud cost

**Android:** android.speech.tts.TextToSpeech
- Use system voices
- No cloud cost

**UX:**
- Settings toggle: "Use device voices (Free)" vs "Use cloud voices (Premium)"
- Seamless switch; same persona labels

### F) Compliance & Safety

**Legal Notice (in-app):**
> "Voices are generated using licensed stock neural voices. No affiliation or endorsement by leagues, teams, or broadcasters."

**Block-List:**
- Disallow prompts requesting celebrity impersonation
- Block illegal stream mentions
- Safe deflection: "I can't do that, but I can help you find the legal way to watch."

### G) Settings UI

**Voice Picker Screen:**

```
┌─────────────────────────────────┐
│ 🎙️ Voice Settings              │
├─────────────────────────────────┤
│                                 │
│ Voice Provider                  │
│ ⚪ Device Voices (Free)         │
│ ⚫ Cloud Voices (Premium)       │
│                                 │
│ Choose Your Voice:              │
│                                 │
│ 🎤 National Desk                │
│    Professional anchor          │
│    [▶️ Preview]                 │
│                                 │
│ 🎤 Midwest Play-by-Play         │
│    Warm, upbeat                 │
│    [▶️ Preview]                 │
│                                 │
│ ... (6 more personas)           │
│                                 │
│ Volume: [●--------] 40%         │
│ Voice Off: [Toggle]             │
│                                 │
└─────────────────────────────────┘
```

**Preview Sample:**
> "Stars vs Predators, 7 PM Central. Watch on ESPN via your YouTube TV."

### H) Cost Estimation

**Google Neural2 Pricing:**
- $16 per 1M characters

**Utterance Examples:**
- Alert: "Game starts in 3 hours" → 30 chars → $0.00048
- Concierge: "Available on ESPN via YouTube TV" → 40 chars → $0.00064

**With Caching:**
- Common phrases cached → 90% cost reduction
- Estimated: $0.02-$0.05 per active Premium user/month

### I) Telemetry Events

**Emit PostHog:**
- `tts_synthesize` (provider, chars, cached, cost_est)
- `tts_playback` (persona, context)
- `persona_selected` (persona_id)
- `voice_toggled` (enabled, provider)

---

## XII. ADS & AFFILIATES — UX RULES

### Ads (Free Tier Only)

**Rules:**
- Never replace or mask organic best route
- Live in "Sponsored" rail/tile with clear labels
- Frequency caps: 1-2 impressions/session
- No interstitial on cold open
- No fake "Watch Now" ads

**Sportsbook Placements (Future, Flagged):**
- Age-gate (21+)
- State geo-fence (legal states only)
- Copy: "21+ • Gamble Responsibly • 1-800-GAMBLER"

### Affiliates

**Rules:**
- All links clearly labeled "Affiliate Link"
- Never suppress organic route for affiliate revenue
- Display as separate "Legal Streaming Options" section
- Track 90-day attribution window

---

## XIII. ANALYTICS & KPIs

### Core Events (PostHog)

**Onboarding:**
- `onboarding_start`
- `onboarding_complete` (zip_present, services_count, teams_selected)
- `onboarding_abandoned` (step)

**Core Flows:**
- `game
