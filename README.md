# WhereBall

**Tell fans exactly how to legally watch tonight's game — for their ZIP and subscriptions.**

WhereBall is a React Native + Expo app that solves sports blackout confusion by providing personalized watch routes based on user location and streaming subscriptions.

## 🏒 MVP: NHL (US) → 🏀 Next: NBA

---

## 📋 Table of Contents

- [Project Status](#project-status)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Project Status

**Current Version:** 1.0.0 (MVP in Development)

- ✅ Project scaffolding complete
- ✅ Core infrastructure (TypeScript, Supabase, state management)
- ✅ Team & service seed data
- 🚧 Onboarding flow (in progress)
- 🚧 Tonight screen (in progress)
- 🚧 Blackout logic (in progress)
- ⏳ AI Concierge
- ⏳ Premium features & IAP
- ⏳ Push notifications

---

## ✨ Features

### Core Features (MVP)
- **Personalized "Tonight" Feed**: See games for your followed teams with start times in your timezone
- **Smart Blackout Detection**: Know if a game is blacked out in your ZIP before you try to watch
- **Watch Now Deep-Linking**: One-tap access to the streaming app carrying your game
- **Multi-Service Support**: Works with ESPN+, YouTube TV, Hulu, Fubo, Sling, and more
- **Blackout Reasoning**: Plain-English explanations of why a game is/isn't available

### Premium Features
- **Unlimited Teams**: Follow unlimited teams across leagues (Free: 1 team)
- **Ad-Free Experience**: No sponsored tiles or ad impressions
- **Full Blackout Explanations**: Detailed reasoning + legal alternatives
- **National Flip Alerts**: Get notified when games move to national broadcasts
- **AI Concierge**: Unlimited chat help with blackout routing (Free: 3 messages/day)
- **Dynamic Team Theming**: Auto-switching team colors by sport/game context

---

## 🛠 Tech Stack

### Frontend
- **React Native** 0.81.4 + **Expo** ~54.0
- **TypeScript** for type safety
- **React Navigation** v7 for routing
- **Zustand** for global state
- **React Query** (@tanstack/react-query) for server state
- **NativeWind** (TailwindCSS) for styling

### Backend & Services
- **Supabase**: Postgres database, Auth (Apple/Google/Email), RLS
- **RevenueCat**: In-app purchase management & receipt validation
- **PostHog**: Analytics & feature flags
- **Grok-4 Fast Reasoning**: AI concierge (via API)
- **Expo Push**: Push notifications (FCM/APNs)

### Data Sources
- **The Sportsdb API**: NHL schedule data (primary)
- **ESPN.com scraping**: Broadcast metadata (fallback)

---

## 📦 Prerequisites

Before you begin, ensure you have:

1. **Node.js** 18+ installed
2. **npm** or **yarn** package manager
3. **Expo CLI**: `npm install -g expo-cli`
4. **iOS Simulator** (Mac) or **Android Emulator**
5. **Accounts** for:
   - [Supabase](https://supabase.com) (free tier)
   - [RevenueCat](https://www.revenuecat.com) (free tier)
   - [PostHog](https://posthog.com) (free tier)
   - [x.AI Grok API](https://x.ai) (for AI concierge)

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/derekstringer/whereball.git
cd whereball
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Open `src/config/env.ts` and replace the placeholder values:

```typescript
export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: 'https://your-project.supabase.co', // ← Replace
  SUPABASE_ANON_KEY: 'your-supabase-anon-key',      // ← Replace
  
  // RevenueCat Configuration
  REVENUECAT_API_KEY: {
    ios: 'your-ios-api-key',                         // ← Replace
    android: 'your-android-api-key',                 // ← Replace
  },
  
  // PostHog Configuration
  POSTHOG_API_KEY: 'your-posthog-api-key',          // ← Replace
  
  // AI Configuration (Grok-4 Fast Reasoning)
  GROK_API_KEY: 'your-grok-api-key',                // ← Replace
  
  // ... rest of config
};
```

**Getting your keys:**

#### Supabase Setup
1. Create project at https://supabase.com
2. Go to Settings → API
3. Copy:
   - `URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
4. Run the schema SQL (see `supabase/migrations/001_initial_schema.sql` once created)

#### RevenueCat Setup
1. Create account at https://www.revenuecat.com
2. Create a new app
3. Go to API Keys
4. Copy platform-specific keys

#### PostHog Setup
1. Create account at https://posthog.com
2. Create a new project
3. Copy Project API Key

#### Grok API Setup
1. Get access at https://x.ai
2. Generate API key from dashboard

### 4. Run the Database Migrations

```bash
# Connect to your Supabase project
# Copy the SQL from supabase/migrations/001_initial_schema.sql
# Run it in the Supabase SQL Editor
```

### 5. Start the Development Server

```bash
npm start
```

Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- `w` for web (limited functionality)

---

## 📁 Project Structure

```
whereball/
├── src/
│   ├── screens/           # Screen components
│   │   ├── onboarding/    # Sign up, ZIP, services, teams
│   │   ├── home/          # Tonight feed
│   │   ├── game/          # Game details
│   │   ├── concierge/     # AI chat
│   │   ├── settings/      # User settings
│   │   └── paywall/       # Subscription purchase
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Buttons, inputs, cards
│   │   ├── game/          # Game cards, badges
│   │   └── team/          # Team logos, colors
│   ├── lib/               # Core libraries
│   │   ├── supabase.ts    # Supabase client
│   │   ├── blackout.ts    # Blackout detection logic
│   │   ├── deeplink.ts    # Deep-linking helpers
│   │   ├── analytics.ts   # PostHog wrapper
│   │   └── concierge.ts   # AI chat interface
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript type definitions
│   ├── config/            # App configuration
│   │   └── env.ts         # Environment variables
│   └── constants/         # Static data
│       ├── teams.ts       # NHL team data + colors
│       └── services.ts    # Streaming service data
├── supabase/
│   ├── functions/         # Edge Functions (schedule ingest)
│   └── migrations/        # Database migrations
├── assets/                # Images, fonts, icons
├── SPEC.md                # Full product specification
├── README.md              # This file
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

---

## ⚙️ Configuration

### Feature Flags

Feature flags can be controlled in `src/config/env.ts` or remotely via PostHog:

```typescript
FEATURES: {
  CONCIERGE_ENABLED: true,      // AI chat
  ADS_ENABLED: false,           // Free tier ads
  SPORTSBOOK_ENABLED: false,    // Gambling ads (21+)
  NBA_ENABLED: false,           // NBA support (post-MVP)
  THEME_AUTO_CONTEXT: true,     // Dynamic team theming
}
```

### Subscription Products

Set these in RevenueCat dashboard, then update IDs in `src/config/env.ts`:

```typescript
SUBSCRIPTION_PRODUCTS: {
  MONTHLY: 'whereball_premium_monthly',  // $3.99/month
  ANNUAL: 'whereball_premium_annual',    // $34.99/year (Save 27%)
}
```

---

## 🧪 Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (once implemented)
npm run test:e2e
```

### Code Quality

```bash
# TypeScript type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Development Workflow

1. **Check out the SPEC.md** for full product requirements
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Write code** following TypeScript best practices
4. **Test on iOS + Android simulators**
5. **Commit & push**: `git add . && git commit -m "feat: description" && git push`
6. **Create Pull Request** for review

---

## 🧩 Key Implementation Details

### Blackout Detection Logic

See `src/lib/blackout.ts` for the heuristic-based blackout detection:

1. Check user ZIP → DMA/metro
2. Check team territories (from `blackout_territories` table)
3. If user in team's home market + game on RSN → **likely blacked out**
4. If national broadcast exists → prefer national route
5. Return `BlackoutResult` with confidence level

### Deep-Linking Strategy

See `src/lib/deeplink.ts` for app scheme handling:

```typescript
// Example: YouTube TV
const link = buildDeepLink('youtube_tv', gameId);
// Returns: "https://tv.youtube.com/watch?v=game123"

// Fallback if app not installed:
Linking.openURL(link).catch(() => {
  // Show manual instructions
});
```

### AI Concierge Context

See `src/lib/concierge.ts` for Memory Pack assembly:

```typescript
const context = {
  userProfile: { zip, subscriptions, teams, isPremium },
  runningSummary: "User prefers Dallas teams...",
  recentTurns: [...last 4 messages],
  factPack: { todayGames: [...] }
};
```

---

## 📱 Testing on Device

### iOS (TestFlight)

1. Build: `eas build --platform ios`
2. Submit to TestFlight: `eas submit --platform ios`
3. Invite testers via App Store Connect

### Android (Play Internal Testing)

1. Build: `eas build --platform android`
2. Submit to Play Console: `eas submit --platform android`
3. Create internal testing track

---

## 🚢 Deployment

### Prerequisites
- EAS CLI: `npm install -g eas-cli`
- Expo account
- Apple Developer account ($99/year)
- Google Play Developer account ($25 one-time)

### Production Build

```bash
# Configure EAS
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform all
```

### Environment Variables (Production)

For production, use EAS Secrets instead of hardcoded values:

```bash
eas secret:create --name SUPABASE_URL --value "https://..."
eas secret:create --name SUPABASE_ANON_KEY --value "..."
# etc.
```

---

## 🗺 Roadmap

### Week 1-4: MVP (NHL)
- [x] Project setup & infrastructure
- [ ] Onboarding flow (ZIP, services, teams)
- [ ] Tonight feed with game cards
- [ ] Blackout detection v1
- [ ] Watch Now deep-linking
- [ ] Game details screen
- [ ] Settings & account management

### Week 5-6: Polish & Launch
- [ ] Premium paywall (RevenueCat)
- [ ] AI Concierge (basic)
- [ ] Push notifications (game start reminders)
- [ ] TestFlight/Play Internal Testing
- [ ] Bug fixes & QA
- [ ] App Store submission

### Post-Launch (Phase 2)
- [ ] NBA support
- [ ] National flip alerts (Premium)
- [ ] Dynamic team theming (Premium)
- [ ] Ad integration (Free tier)
- [ ] Affiliate tiles
- [ ] Advanced AI features

### Future
- [ ] MLB support
- [ ] NCAA Football
- [ ] Social features (share watch routes)
- [ ] Widgets (iOS/Android)
- [ ] Apple Watch companion

---

## 🤝 Contributing

This is a private commercial project. Contributions are currently limited to the core team.

---

## 📄 License

Proprietary - All Rights Reserved

Copyright (c) 2025 WhereBall

---

## 📞 Support

- **Issues**: GitHub Issues (private repo)
- **Email**: support@whereball.com (once live)
- **Documentation**: See `SPEC.md` for full product spec

---

## 🙏 Acknowledgments

- **The Sportsdb** for NHL schedule data
- **Supabase** for backend infrastructure
- **RevenueCat** for IAP simplification
- **Expo** for React Native tooling
- **All the cord-cutters** frustrated by blackout confusion

---

**Built with ❤️ for sports fans who just want to watch the game.**
