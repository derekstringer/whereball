# ADR-0005: AI and Voice Stack

**Status:** Accepted  
**Date:** 2025-10-25  
**Deciders:** Derek Stringer, ChatGPT (product consultation)  
**Context:** SportStream AI Concierge & Voice feature architecture

---

## Context and Problem Statement

SportStream needs an AI concierge to help users navigate sports viewing options, answer questions about game availability, explain blackout rules, and provide personalized viewing recommendations. The system must be:

- **Cost-effective** for our domain-specific use case
- **Fast** for real-time chat interactions
- **Scalable** across free and premium tiers
- **High-quality** voice/TTS for natural conversations

We need to decide on the LLM and TTS providers that balance performance, cost, and user experience.

---

## Decision Drivers

1. **Cost Optimization**: Sports viewing is a narrow domain; we don't need expensive general-purpose AI
2. **Speed**: Users expect instant responses in a chat interface
3. **Quality**: Voice must sound natural, not robotic
4. **Scalability**: Must support both free and premium user tiers
5. **Privacy**: No illegal streaming advice; VPN info must include disclaimers
6. **Reliability**: Fallback options for when primary services fail

---

## Considered Options

### LLM Options
- **Option A**: OpenAI GPT-4o (high quality, expensive, slower)
- **Option B**: Anthropic Claude (good reasoning, expensive)
- **Option C**: Groq Llama-3.1-8B (fast, cheap, domain-optimized)
- **Option D**: xAI Grok 4 Fast Reasoning (specialized reasoning, mid-cost)

### TTS Options
- **Option E**: Google Cloud TTS Neural2/WaveNet (high quality, cost-effective)
- **Option F**: ElevenLabs (premium voices, personality, higher cost)
- **Option G**: Device TTS (free, lower quality)

---

## Decision Outcome

### Chosen Option: Hybrid Stack

**Primary LLM: Llama-3.1-8B Instruct (Groq)**
- Default for standard Q&A and tool use
- Fast inference (sub-second responses)
- Cost-effective (~$0.05-0.10 per 1M tokens)
- Sufficient for domain-specific tasks

**Fallback LLM: Grok 4 Fast Reasoning (xAI)**
- Auto-elevate for:
  - Very long context (>8K tokens)
  - Multi-step explanations
  - Tool failures requiring reasoning
  - User explicitly requests detailed breakdown
- Mid-cost reasoning specialist
- Handles edge cases primary can't solve

**Primary TTS: Google Cloud Text-to-Speech**
- Neural2 and WaveNet voices
- 6-8 persona options (male/female, neutral + light personalities)
- Cost-effective (~$16 per 1M characters)
- High quality, natural-sounding

**Premium TTS: ElevenLabs**
- Reserved for paid tiers
- "Sporty personalities" with character
- Unlocked as premium feature
- Higher cost justified by subscription revenue

---

## Consequences

### Positive

✅ **Cost Efficiency**: Primary stack (Groq + Google TTS) ~70% cheaper than GPT-4 + premium TTS
✅ **Speed**: Groq provides sub-second responses for better UX
✅ **Scalability**: Tiered pricing aligns with user tiers (free vs premium)
✅ **Quality**: Both LLMs are production-grade; TTS is natural-sounding
✅ **Flexibility**: Can adjust routing rules as usage patterns emerge
✅ **Monetization**: Premium voices provide upgrade incentive

### Negative

⚠️ **Complexity**: Requires router logic to choose model
⚠️ **Monitoring**: Need telemetry for cost tracking and model performance
⚠️ **Maintenance**: Two LLM integrations to maintain
⚠️ **Testing**: Edge cases where elevation logic triggers incorrectly

### Mitigation Strategies

1. **Model Router**: Simple rules-based router with telemetry
2. **Guardrails**: Per-tier token caps, daily budgets, rate limits
3. **Caching**: Cache repeated TTS phrases (greetings, common replies)
4. **Fallbacks**: Device TTS if cloud TTS fails; Groq if Grok fails
5. **Privacy**: Function-call tools only (no direct DB access from models)
6. **Compliance**: Hard-coded rules against piracy advice; VPN info includes disclaimers

---

## Technical Requirements

### API Integration
- **Groq**: `GROQ_API_KEY`, model: `llama-3.1-8b-instruct`
- **xAI**: `GROK_API_KEY`, model: `grok-4-fast-reasoning`
- **Google TTS**: `GOOGLE_TTS_PROJECT_ID`, service account credentials
- **ElevenLabs**: `ELEVENLABS_API_KEY` (optional, premium-only)

### Cost Guardrails
- `AI_MAX_TOKENS_PER_REQ`: Per-request token ceiling
- `AI_DAILY_BUDGET_USD`: Daily spend cap for AI
- `TTS_DAILY_BUDGET_USD`: Daily spend cap for TTS
- Per-user per-day limits (free tier: 50 requests, premium: unlimited*)

### Feature Flags
- `AI_ROUTING_ENABLED`: Enable/disable model routing
- `ELEVENLABS_ENABLED`: Enable/disable premium voices
- `VOICE_CACHE_ENABLED`: Enable/disable TTS caching

### Caching Strategy
- TTS responses cached by: `hash(text + voice + language)`
- Cache TTL: 30 days for common phrases, 7 days for dynamic
- Storage: S3/GCS bucket or CDN
- Cache hit rate target: >60% for cost savings

---

## Implementation Tasks

1. Build AI Router with Groq → Grok elevation logic
2. Integrate Google TTS with voice selection
3. Add ElevenLabs as premium option (feature-flagged)
4. Implement usage limits and guardrails per tier
5. Create privacy/compliance copy (no piracy, VPN disclaimers)
6. Set up telemetry (model, tokens, latency, cost)
7. Add error handling and fallback flows

---

## References

- [Groq Documentation](https://console.groq.com/docs)
- [xAI Grok API](https://x.ai/api)
- [Google Cloud TTS](https://cloud.google.com/text-to-speech)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [SPEC.md](/SPEC.md) - Product specifications
- [ARCHITECTURE.md](/ARCHITECTURE.md) - System architecture

---

## Revision History

- **2025-10-25**: Initial decision recorded (Derek Stringer)
