# Environment Variables

**Last Updated:** 2025-10-25  
**Related:** [ADR-0005: AI and Voice Stack](/docs/adr/0005-ai-and-voice-stack.md)

---

## Overview

SportStream uses environment variables for configuration across backend services, API integrations, and feature flags. **Mobile clients never access these variables directly** - all sensitive operations go through backend APIs.

---

## Core Services

### Supabase (Backend)
```bash
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ...  # Public anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, never expose
```

### RevenueCat (IAP/Subscriptions)
```bash
REVENUECAT_PUBLIC_KEY_IOS=appl_...  # iOS public key
REVENUECAT_PUBLIC_KEY_ANDROID=goog_...  # Android public key
REVENUECAT_SECRET_KEY=sk_...  # Server-side only for webhooks
```

---

## AI & Voice Stack

**See:** [ADR-0005](/docs/adr/0005-ai-and-voice-stack.md) for architecture rationale

### Groq (Primary LLM)
```bash
GROQ_API_KEY=gsk_...  # Server-side only
GROQ_BASE_URL=https://api.groq.com/openai/v1  # Optional, default
GROQ_MODEL=llama-3.1-8b-instant  # Model identifier
```

### xAI Grok (Fallback LLM)
```bash
GROK_API_KEY=xai-...  # Server-side only
GROK_BASE_URL=https://api.x.ai/v1  # Optional, default
GROK_MODEL=grok-4-fast-reasoning  # Model identifier
```

### Google Cloud TTS (Primary Voice)
```bash
GOOGLE_TTS_PROJECT_ID=sportstream-prod  # GCP project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json  # Server-side only
GOOGLE_TTS_DEFAULT_VOICE=en-US-Neural2-G  # Default voice ID
```

### ElevenLabs (Premium Voice - Optional)
```bash
ELEVENLABS_API_KEY=...  # Server-side only
ELEVENLABS_MODEL_ID=eleven_monolingual_v1  # Model for synthesis
```

---

## AI/Voice Configuration

### Feature Flags
```bash
# Core toggles
AI_ROUTING_ENABLED=true  # Enable/disable AI router
ROUTER_ESCALATE=false  # Enable Grok fallback (default: always Groq)
ELEVENLABS_ENABLED=false  # Enable premium voices (default: Google only)
VOICE_CACHE_ENABLED=true  # Enable TTS caching

# Cost guardrails
AI_MAX_TOKENS_PER_REQ=2000  # Per-request token ceiling
AI_DAILY_BUDGET_USD=100  # Daily spend cap for AI
TTS_DAILY_BUDGET_USD=50  # Daily spend cap for TTS

# Rate limits (per user)
AI_FREE_TIER_DAILY_LIMIT=3  # Free tier messages/day
AI_PREMIUM_TIER_DAILY_LIMIT=30  # Premium soft cap messages/day
AI_PREMIUM_TIER_MONTHLY_LIMIT=100  # Premium soft cap messages/month
```

### TTS/Voice Settings
```bash
VOICE_PROVIDER=google  # Options: google | elevenlabs | device
VOICE_CACHE_BUCKET=sportstream-tts-cache  # S3/GCS bucket name
VOICE_DEFAULT_PERSONA=national_desk  # Default voice persona
VOICE_FREE_USES_CLOUD=false  # Allow cloud TTS on free tier (cost consideration)
VOICE_MAX_LEN_CHARS=600  # Hard cap per TTS utterance
```

---

## Analytics & Monitoring

### PostHog (Events & Feature Flags)
```bash
POSTHOG_API_KEY=phc_...  # Public API key (safe for client)
POSTHOG_HOST=https://app.posthog.com  # Or self-hosted URL
```

### Sentry (Error Tracking - Optional)
```bash
SENTRY_DSN=https://...@sentry.io/...  # Public DSN (safe for client)
SENTRY_ORG=sportstream
SENTRY_PROJECT=whereball-mobile
SENTRY_AUTH_TOKEN=...  # For source map uploads (CI only)
```

---

## External APIs

### Sports Data
```bash
SPORTSDB_API_KEY=...  # TheSportsDB API key (if using paid tier)
ESPN_SCRAPER_USER_AGENT=SportStream/1.0  # User agent for scraping
```

### Ads (Free Tier)
```bash
ADMOB_APP_ID_IOS=ca-app-pub-...
ADMOB_APP_ID_ANDROID=ca-app-pub-...
ADMOB_BANNER_UNIT_ID=ca-app-pub-.../...
```

---

## Development vs Production

### Local Development
```bash
# .env.local (not committed)
NODE_ENV=development
API_BASE_URL=http://localhost:54321  # Local Supabase
DEBUG_MODE=true
SKIP_AUTH=true  # For testing without login
```

### Production
```bash
# Set via CI/CD or hosting platform
NODE_ENV=production
API_BASE_URL=https://api.sportstream.app
DEBUG_MODE=false
SKIP_AUTH=false
```

---

## Security Notes

### ⚠️ Never Commit to Git
- API keys, service accounts, secrets
- `.env.local`, `.env.production`
- `google-services.json` (Firebase Android)
- `GoogleService-Info.plist` (Firebase iOS)

### ✅ Safe for Client-Side
- Supabase anon key (has RLS protection)
- RevenueCat public keys
- PostHog API key
- Sentry DSN
- AdMob app IDs

### 🔒 Server-Side Only
- Supabase service role key
- RevenueCat secret key
- Groq/Grok API keys
- Google TTS credentials
- ElevenLabs API key

---

## Setting Up Locally

1. **Copy example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in required vars:**
   - Supabase URL + anon key (from dashboard)
   - RevenueCat public keys (from dashboard)
   - PostHog API key (optional for dev)

3. **Skip optional vars:**
   - AI/TTS keys (feature-flagged off by default)
   - Ad keys (not needed for dev builds)

4. **Run app:**
   ```bash
   npm run start
   ```

---

## CI/CD Configuration

### GitHub Actions Secrets
Set these in repo settings → Secrets:
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `GROK_API_KEY`
- `GOOGLE_TTS_CREDENTIALS` (base64-encoded JSON)
- `ELEVENLABS_API_KEY`
- `REVENUECAT_SECRET_KEY`
- `SENTRY_AUTH_TOKEN`

### Expo EAS Build Secrets
Set via `eas secret:create`:
```bash
eas secret:create --scope project --name SUPABASE_URL --value "..."
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "..."
eas secret:create --scope project --name REVENUECAT_PUBLIC_KEY_IOS --value "..."
```

---

## Validation

**Startup checks (backend):**
```typescript
// Example validation in backend startup
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required env var: ${varName}`);
  }
});
```

---

## References

- [ADR-0005: AI and Voice Stack](/docs/adr/0005-ai-and-voice-stack.md)
- [AI & Voice Overview](/docs/ai/overview.md)
- [ARCHITECTURE.md](/ARCHITECTURE.md)
- [Supabase Docs](https://supabase.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Google Cloud TTS](https://cloud.google.com/text-to-speech/docs)

---

## Troubleshooting

**"Missing API key" errors:**
- Check `.env.local` exists and has the var
- Restart dev server after adding vars
- Verify var name spelling (case-sensitive)

**"Unauthorized" errors:**
- Supabase anon key: Check RLS policies
- Service role key: Ensure it's the correct project
- API keys: Verify they're active in provider dashboard

**Cost alerts firing:**
- Check daily usage in provider dashboards
- Verify `AI_DAILY_BUDGET_USD` is set correctly
- Review telemetry logs for anomalies
