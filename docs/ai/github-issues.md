# GitHub Issues for AI & Voice Implementation

**Created:** 2025-10-25  
**Related:** [ADR-0005](/docs/adr/0005-ai-and-voice-stack.md)

These issues track the implementation of the AI & Voice stack as documented in ADR-0005.

---

## Issue #1: Implement AI Router

**Labels:** `ai`, `backend`, `enhancement`

**Title:** Implement AI Router (Groq primary → Grok fallback)

**Description:**

Implement the AI router that selects between Groq Llama-3.1-8B (primary) and xAI Grok 4 Fast Reasoning (fallback) based on request characteristics.

**Acceptance Criteria:**
- [ ] Router logic implemented with clear decision rules
- [ ] Groq API integration complete and tested
- [ ] Feature flag `ROUTER_ESCALATE` controls Grok availability
- [ ] Telemetry logging (model used, tokens, latency, cost)
- [ ] Unit tests for routing logic
- [ ] Integration tests with mock API responses
- [ ] Error handling and fallback logic
- [ ] Documentation updated in code comments

**Technical Requirements:**
- Default to Groq for all requests when `ROUTER_ESCALATE=false`
- Escalate to Grok when flag enabled and:
  - Context length >8K tokens
  - Multi-step explanations required
  - Tool failures needing reasoning
  - User explicitly requests detail

**Environment Variables:**
```bash
GROQ_API_KEY=...
GROQ_BASE_URL=...
GROQ_MODEL=llama-3.1-8b-instant
GROK_API_KEY=...
ROUTER_ESCALATE=false
```

**References:**
- [ADR-0005](/docs/adr/0005-ai-and-voice-stack.md)
- [ARCHITECTURE.md - AI Routing](/ARCHITECTURE.md#ai-routing--tts-pipeline)

---

## Issue #2: Add Google TTS Integration

**Labels:** `voice`, `tts`, `backend`, `enhancement`

**Title:** Add Google Cloud Text-to-Speech Integration

**Description:**

Integrate Google Cloud TTS with voice persona mapping, caching layer, and device TTS fallback.

**Acceptance Criteria:**
- [ ] Google Cloud TTS API integration
- [ ] 6-8 voice personas configured with SSML prosody
- [ ] Cache layer implemented (S3/GCS bucket)
- [ ] Cache key generation (hash of text + voice + SSML)
- [ ] Device TTS fallback (iOS AVSpeechSynthesizer, Android TTS)
- [ ] Settings UI for voice selection with preview samples
- [ ] API endpoint for TTS synthesis
- [ ] Error handling (fallback to device TTS on cloud failure)
- [ ] Documentation for voice persona customization

**Voice Personas to Implement:**
1. National Desk (en-US-Neural2-G) - Professional anchor
2. Midwest Play-by-Play (en-US-Neural2-D) - Warm, upbeat
3. New England Chalk (en-US-Neural2-B) - Crisp analyst
4. Tri-State Color (en-US-Neural2-F) - Lively commentary
5. Gulf Coast Sideline (en-US-Neural2-H) - Relaxed reporter
6. PNW Analyst (en-US-Neural2-C) - Calm, precise

**Environment Variables:**
```bash
GOOGLE_TTS_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=...
VOICE_CACHE_BUCKET=...
VOICE_CACHE_ENABLED=true
VOICE_DEFAULT_PERSONA=national_desk
```

**References:**
- [AI Overview - Voice Personas](/docs/ai/overview.md#voice-personas-by-tier)
- [SPEC.md - Voice/TTS System](/SPEC.md#xi-a-voicetts-system)

---

## Issue #3: Add ElevenLabs Premium Voices

**Labels:** `voice`, `tts`, `premium`, `enhancement`

**Title:** Add ElevenLabs Premium Voices (Feature-Flagged)

**Description:**

Add ElevenLabs TTS as a premium option with feature flag gating and usage metrics.

**Acceptance Criteria:**
- [ ] ElevenLabs API integration
- [ ] 2 premium personas configured ("The Insider", "Hype Squad")
- [ ] Feature flag `ELEVENLABS_ENABLED` controls availability
- [ ] Premium tier gating (verify user subscription)
- [ ] Settings UI shows premium voices as locked for free users
- [ ] Usage metrics tracked per user/tier
- [ ] Cost tracking and alerts
- [ ] Fallback to Google TTS if ElevenLabs fails
- [ ] Documentation for adding custom voices

**Premium Personas:**
- "The Insider" - Knowledgeable sports journalist
- "Hype Squad" - Ultra-excited superfan

**Environment Variables:**
```bash
ELEVENLABS_API_KEY=...
ELEVENLABS_ENABLED=false
ELEVENLABS_MODEL_ID=eleven_monolingual_v1
```

**References:**
- [ADR-0005 - Premium TTS](/docs/adr/0005-ai-and-voice-stack.md#premium-tts-elevenlabs)

---

## Issue #4: Concierge Usage Limits & Guardrails

**Labels:** `ai`, `backend`, `security`

**Title:** Implement Concierge Usage Limits & Cost Guardrails

**Description:**

Implement per-tier usage limits, daily budget caps, and cost protection mechanisms.

**Acceptance Criteria:**
- [ ] Per-tier token caps implemented and enforced
- [ ] Daily budget tracking (AI + TTS combined)
- [ ] Circuit breaker at $150/day (pause service, alert dev)
- [ ] Per-user rate limiting (10 requests/minute max)
- [ ] Nightly reset logic for daily limits
- [ ] User-friendly error messages when limits hit
- [ ] Admin dashboard for monitoring usage/costs
- [ ] Alert system for anomalies (Slack/email)
- [ ] Database table `concierge_usage` for tracking
- [ ] Graceful degradation (don't break core app)

**Tier Limits:**
- Free: 3 messages/day, 2,000 tokens/request, device TTS only
- Premium: 100 messages/month (soft), 30/day (soft), 8,000 tokens/request, cloud TTS

**Environment Variables:**
```bash
AI_MAX_TOKENS_PER_REQ=2000
AI_DAILY_BUDGET_USD=100
TTS_DAILY_BUDGET_USD=50
AI_FREE_TIER_DAILY_LIMIT=3
AI_PREMIUM_TIER_DAILY_LIMIT=30
AI_PREMIUM_TIER_MONTHLY_LIMIT=100
```

**References:**
- [AI Overview - Cost Guardrails](/docs/ai/overview.md#4-cost-guardrails)
- [ARCHITECTURE.md - Rate Limiting](/ARCHITECTURE.md#rate-limiting--guardrails)

---

## Issue #5: Docs - AI & Voice Overview + ADR

**Labels:** `documentation`

**Title:** Documentation: AI & Voice Overview + ADR

**Description:**

✅ **COMPLETED** (2025-10-25)

This issue tracks the documentation work, which has been completed in commit 564dec2.

**Completed:**
- ✅ Created `docs/adr/0005-ai-and-voice-stack.md`
- ✅ Created `docs/ai/overview.md`
- ✅ Created `docs/env.md`
- ✅ Created `.env.example`
- ✅ Updated `SPEC.md` with ADR reference
- ✅ Updated `ARCHITECTURE.md` with AI Routing section
- ✅ Created `CHANGELOG.md` with documentation entry
- ✅ Linked from README (if applicable)
- ✅ All titles consistent across docs

**Files Created/Updated:**
- `docs/adr/0005-ai-and-voice-stack.md`
- `docs/ai/overview.md`
- `docs/env.md`
- `.env.example`
- `SPEC.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`

**Commit:** 564dec2

---

## Issue #6: Privacy/Compliance Copy Updates

**Labels:** `compliance`, `legal`, `documentation`

**Title:** Privacy/Compliance Copy Updates for AI Concierge

**Description:**

Update app copy and legal documentation to ensure compliance with AI usage, VPN disclaimers, and anti-piracy policies.

**Acceptance Criteria:**
- [ ] App copy avoids piracy advice (system prompts updated)
- [ ] VPN information includes disclaimers
- [ ] AI usage disclosure in Privacy Policy
- [ ] Terms of Service updated for AI features
- [ ] Data retention policy for AI conversations (if any)
- [ ] GDPR/CCPA compliance for AI telemetry
- [ ] User consent flow for AI features (if required)
- [ ] Legal review completed
- [ ] Copy testing with QA scenarios

**Required Disclaimers:**

**VPN Information:**
> "For informational purposes only. SportStream does not endorse circumventing geo-restrictions. Please respect broadcaster rights and terms of service."

**AI System Prompt Rules:**
- Must refuse illegal streaming requests
- Must provide legal alternatives first
- Must not help bypass paywalls
- Must deflect when lacking data (no guessing)

**Privacy Policy Updates:**
- Disclose AI processing of user queries
- Explain data retention (if conversations logged)
- Detail telemetry data collected
- Opt-in for analytics (aggregate, no PII)

**References:**
- [SPEC.md - AI Concierge Scope & Guardrails](/SPEC.md#d-scope--guardrails)
- [AI Overview - Privacy & Compliance](/docs/ai/overview.md#privacy--compliance)

---

## Creating These Issues

To create these issues on GitHub:

1. Go to: https://github.com/derekstringer/whereball/issues/new
2. Copy/paste the title and description for each issue
3. Add the specified labels
4. Create the issue
5. Reference issue numbers in commit messages (e.g., "feat: implement AI router (#1)")

Or use GitHub CLI:

```bash
gh issue create --title "Implement AI Router (Groq primary → Grok fallback)" \
  --label "ai,backend,enhancement" \
  --body-file issue-1-description.md

# Repeat for issues 2-6
```

---

## Implementation Order

**Recommended sequence:**

1. **Issue #5** ✅ - Documentation (COMPLETED)
2. **Issue #4** - Usage limits & guardrails (foundation)
3. **Issue #1** - AI Router (Groq integration)
4. **Issue #2** - Google TTS (primary voice)
5. **Issue #3** - ElevenLabs (premium feature)
6. **Issue #6** - Compliance copy (final polish)

**Timeline:** ~4 weeks total (1 week per phase in ADR-0005)
