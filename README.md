# PawFinder

**Find adoptable pets near you — all in one place.**

PawFinder consolidates pet adoption listings from shelters and rescues into a clean, modern mobile app. Powered by the Petfinder API, it stays synced with the latest available animals in real-time.

## Features

- **Browse pets** — Dogs, cats, rabbits, birds, and more
- **Detailed filtering** — Species, breed, age, size, gender, coat, color, compatibility, distance
- **Location search** — Search by ZIP code or city anywhere in the US
- **Adjustable radius** — 10 to 500 miles
- **Auto-sync** — Refreshes every 60 seconds to show the latest listings
- **Pull-to-refresh** — Manual refresh anytime
- **Favorites** — Save pets you love
- **Shelter directory** — Find shelters near you with contact info
- **Dark/Light/System themes** — Modern dark-first design
- **Cross-platform** — Web, iOS, and Android via Expo

## Tech Stack

- **React Native + Expo** (cross-platform)
- **TypeScript** (strict mode)
- **Zustand** (state management)
- **React Query** (data fetching + auto-refresh)
- **Supabase** (auth + user data)
- **Petfinder API v2** (pet listings)
- **Lucide Icons** (UI icons)

## Quick Start

```bash
# Install dependencies
npm install

# Add your Petfinder API keys
cp .env.example .env.local
# Edit .env.local with your keys from https://www.petfinder.com/developers/

# Start the app
npx expo start --web    # Web
npx expo start --ios    # iOS
npx expo start --android # Android
```

## Getting Petfinder API Keys

1. Go to [petfinder.com/developers](https://www.petfinder.com/developers/)
2. Create a free account
3. Get your API Key and Secret
4. Add them to `.env.local`

## Default Location

The app defaults to Wichita Falls, TX (76301). Change the default in `src/types/index.ts` or use the location filter in the app.
