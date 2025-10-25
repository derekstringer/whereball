# AI & Voice Overview

**Last Updated:** 2025-10-25  
**Status:** Architecture Defined, Implementation Pending

---

## What We Use

SportStream uses a **hybrid AI stack** optimized for cost, speed, and quality in our specific domain (sports viewing assistance).

### Language Models

**Primary: Llama-3.1-8B Instruct (Groq)**
- **When:** Default for all standard queries
- **What:** "Can I watch tonight?", team info, service recommendations, simple explanations
- **Why:** Sub-second responses, cost-effective (~$0.05-0.10 per 1M tokens)
- **Speed:** Typically <500ms response time

**Fallback: Grok 4 Fast Reasoning (xAI)**
- **When:** Auto-elevated for complex scenarios
- **Triggers:**
  - Very long context (>8K tokens)
  - Multi-step explanations required
  - Tool failures needing reasoning
  - User explicitly asks for detailed breakdown
- **Why:** Specialized reasoning for edge cases
- **Speed:** ~1-2s response time

### Voice / Text-to-Speech

**Primary: Google Cloud TTS (Neural2/WaveNet)**
- **Voices Available:**
  - **Neutral Male** (en-US-Neural2-D): Professional, clear
  - **Neutral Female** (en-US-Neural2-F): Warm, friendly
  - **Sportscaster Male** (en-US-Neural2-J): Energetic, enthusiastic
  - **Analyst Female** (en-US-Neural2-H): Knowledgeable, calm
  - **Fan Excited** (en-US-WaveNet-A): High energy, animated
  - **Coach Authoritative** (en-US-WaveNet-B): Direct, confident
- **Cost:** ~$16 per 1M characters
- **Quality:** Natural-sounding, production-grade

**Premium: ElevenLabs (Paid Tiers Only)**
- **Voices Available:**
  - **"The Insider"**: Knowledgeable sports journalist personality
  - **"Hype Squad"**: Ultra-excited superfan energy
  - **Custom voices**: Upload your own voice or choose from library
- **Cost:** ~$60 per 1M characters (offset by subscription revenue)
- **Quality:** Character-driven, highly expressive

---

## How We Keep Costs Low

### 1. Smart Model Routing
- **90% of requests** → Groq (cheap, fast)
- **10% of requests** → Grok (only when needed)
- **Routing Rules:** Simple, rule-based (no ML overhead)

### 2. Aggressive Caching
- **TTS Responses:**
  - Common phrases cached 30 days (e.g., "Good evening!", "Let me check...")
  - Dynamic responses cached 7 days
  - **Target:** >60% cache hit rate
  - **Savings:** ~$0.15 per cached user-month
- **API Responses:**
  - Game data cached per date
  - Team/service lookups cached
  - **Savings:** ~$0.05 per active user-month

### 3. Usage Limits

**Free Tier:**
- 50 AI requests/day
- 2,000 tokens max per request
- Google TTS voices only
- Daily reset at midnight local time

**Premium Tier:**
- Unlimited* AI requests (*fair use: 500/day soft cap)
- 8,000 tokens max per request
- All voices (Google + ElevenLabs)
- Priority routing during peak times

### 4. Cost Guardrails
- **Daily Budget Cap:** $100/day total AI spend
- **Circuit Breaker:** Pause service at $150/day (emergency)
- **Per-User Rate Limiting:** Max 10 requests/minute
- **Token Ceiling:** Hard stop at configured max tokens

---

## Expected Monthly Costs

**Assumptions:**
- 10,000 active users
- 70% on free tier, 30% on premium
- Average: 10 AI requests/user/day
- Average: 5 TTS responses/user/day
- Cache hit rate: 65%

### Breakdown

| Component | Volume | Unit Cost | Monthly Total |
|-----------|--------|-----------|---------------|
| **Groq (LLM)** | 2.7B tokens | $0.05/1M | $135 |
| **Grok (LLM)** | 300M tokens | $0.15/1M | $45 |
| **Google TTS** | 35M chars (after cache) | $16/1M | $560 |
| **ElevenLabs** | 5M chars (premium only) | $60/1M | $300 |
| **Cache Storage** | 50GB S3/GCS | ~$1/GB | $50 |
| **API/Bandwidth** | Typical usage | Est. | $100 |
| **TOTAL** | | | **~$1,190/mo** |

**Per User:** ~$0.12/mo (well under premium subscription revenue)

**Scale Projection:**
- 50K users → ~$6K/mo
- 100K users → ~$12K/mo (still <10% of projected revenue)

---

## Voice Personas by Tier

### Free Tier (Google TTS)

1. **Neutral Male** - Default, professional
2. **Neutral Female** - Warm, approachable
3. **Sportscaster** - Enthusiastic play-by-play
4. **Analyst** - Knowledgeable expert
5. **Fan** - Excited supporter
6. **Coach** - Authoritative guide

### Premium Tier (Adds ElevenLabs)

7. **The Insider** - Sports journalist personality
8. **Hype Squad** - Ultra-excited superfan

*(Custom voices available for Enterprise tier - future)*

---

## Caching Strategy

### What We Cache

**TTS Audio:**
```
cache_key = hash(text + voice_id + language_code)
ttl = 30 days (common) | 7 days (dynamic)
storage = S3/GCS bucket or CDN
```

**Common Phrases (Never Expire):**
- Greetings: "Good morning", "Hey there", etc.
- Transitions: "Let me check...", "Here's what I found..."
- Confirmations: "Got it", "Sure thing", etc.

**User-Specific (7 Days):**
- Team-specific responses
- Service availability answers
- Game-specific info

### Cache Hit Rate Target

- **Current:** 0% (not implemented)
- **Month 1:** 40% (common phrases cached)
- **Month 3:** 60% (ML-optimized caching)
- **Steady State:** 65-70%

---

## Privacy & Compliance

### What We DON'T Do

❌ **No Piracy Advice:** Models trained to refuse illegal streaming suggestions  
❌ **No Direct DB Access:** All data via function-call tools (backend APIs only)  
❌ **No User Data Storage:** Conversations not logged unless user opts in (analytics)  
❌ **No Cross-User Learning:** Each session is isolated

### What We DO

✅ **VPN Info with Disclaimers:** "For informational purposes only. SportStream does not endorse circumventing geo-restrictions. Please respect broadcaster rights and terms of service."  
✅ **Legal Alternatives:** Always suggest legitimate viewing options first  
✅ **Transparent Limits:** Users see their daily request count  
✅ **Opt-In Analytics:** Aggregate usage data (no PII) for improving responses

---

## Architecture References

- **ADR-0005:** [AI and Voice Stack Decision](/docs/adr/0005-ai-and-voice-stack.md)
- **SPEC.md:** [Product Specifications - AI Concierge](/SPEC.md#ai-concierge--voice)
- **ARCHITECTURE.md:** [System Architecture - AI Routing](/ARCHITECTURE.md#ai-routing--tts-pipeline)

---

## Implementation Status

| Component | Status | ETA |
|-----------|--------|-----|
| AI Router | 🔴 Not Started | Week 1 |
| Groq Integration | 🔴 Not Started | Week 1 |
| Grok Integration | 🔴 Not Started | Week 2 |
| Google TTS | 🔴 Not Started | Week 2 |
| ElevenLabs | 🔴 Not Started | Week 3 |
| TTS Caching | 🔴 Not Started | Week 3 |
| Usage Limits | 🔴 Not Started | Week 2 |
| Telemetry | 🔴 Not Started | Week 2 |

---

## Questions?

See the full technical decision rationale in [ADR-0005](/docs/adr/0005-ai-and-voice-stack.md).
