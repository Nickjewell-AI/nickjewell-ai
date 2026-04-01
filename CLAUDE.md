# CLAUDE.md — Project Context for Claude Code

## Project
**The Jewell Assessment** at nickjewell.ai — AI readiness diagnostic across five layers (Foundation, Architecture, Accountability, Culture, Taste). "Taste" is proprietary IP measuring strategic judgment via scenario-based choices. Built by Nick Jewell, Senior Managing Consultant at IBM.

## Architecture
- **Frontend:** Vanilla HTML/CSS/JS, no build tools
- **Hosting:** Cloudflare Pages, auto-deploy from GitHub `main`
- **API Proxy:** Cloudflare Pages Function at `/functions/api-proxy.js`
- **AI Models:** Claude Sonnet 4 (`claude-sonnet-4-20250514`) for Taste reasoning follow-ups + CU2 culture analysis; Claude Opus 4.6 for executive brief streaming
- **Database:** Cloudflare D1 (`jewell-assessment-db`). Tables: `assessment_results`, `brief_ip_counter`, `email_log`, `assessment_feedback`
- **Email:** Resend API via api-proxy. Templates in `/functions/lib/email-templates.js`. Send-as: nick@nickjewell.ai
- **Domain:** Only `www.nickjewell.ai` resolves. Bare domain 301 redirects via Cloudflare Page Rule.

## Assessment Flow (Post-Session 7)
```
TIER 1: PULSE — 5 questions (P1 Role, P2 Maturity, P3 Industry, P4 Concern, P7 Company Size)
  P1/P2/P4 drive routing. P3 drives industry-specific options + brief conditioning.
  P7 drives brief conditioning (company size). P5/P6 removed Session 6.
  ↓
TIER 2: DIAGNOSTIC — All 4 layers assessed (deep or shallow based on routing)
  Deep modules: 3 questions. Shallow modules: 1-2 questions.
  Compound module cards: each module = 1 card, questions reveal progressively.
  Industry-specific option text for 5 industries (240 variants). Scores identical to generic.
  Adaptive follow-up: 1 lowest-scoring layer (≤33, <3 responses) gets 2 extra questions + micro-prompt.
  ↓
TIER 3: TASTE TEST — 3 scenarios per user (from pool of 9, maturity-routed)
  P2 answer determines scenario set:
    Exploring (P2=A) → T5/T6/T7 (mid-market, first AI decisions)
    Piloting/Scaling (P2=B/C) → T1/T2/T3 (growth-stage)
    Operating (P2=D) → T4/T8/T9 (enterprise optimization)
  Each scenario + inline reasoning follow-up on same card.
  1 consolidated post-Taste free-text prompt ("One Last Thing").
  ↓
RESULTS → Contact form (name/email/company/role) → Executive brief streams via Opus 4.6
  Brief conditioned by P3 industry + P7 company size for action specificity.
```

**Progress bar:** Phase-based (Pulse 0-25%, Diagnostic 25-75%, Taste 75-100%). No "X of Y" counter.

**Interaction count:** 12-16 depending on path. Under 5 minutes.

## Industry Personalization (3 layers)
1. **Taste scenarios** routed by maturity stage (P2)
2. **Diagnostic options** branched by industry (P3) — 5 industries: Healthcare (B), Financial Services (A), Technology/SaaS (C), Professional Services (F), Manufacturing/Industrial (D). Generic fallback for all others. CU2 excluded (special free-text handling).
3. **Brief actions** calibrated by industry + company size (P3 + P7) via Opus system prompt conditioning

**Industry URL scaffolding:** `?industry=healthcare` (etc.) pre-populates P3 for industry-specific landing pages.

## Repo Structure
```
nickjewell-ai/
├── index.html                     # Homepage
├── framework/index.html           # 5-layer framework deep dive
├── assessment/index.html          # Assessment tool (assessment-specific CSS inline)
├── about/index.html               # About page
├── contact/index.html             # Contact page
├── writing/                       # 5 standalone articles + index
├── css/style.css                  # Shared design system
├── js/
│   ├── assessment-engine.js       # Scoring, branching, state, industry options, brief context builder
│   ├── assessment-ui.js           # UI rendering, compound cards, inline reasoning, brief streaming, brief conditioning
│   └── api.js                     # Anthropic API communication via proxy
├── functions/
│   ├── api-proxy.js               # Cloudflare Pages Function (API proxy + Resend + D1 + rate limiting)
│   ├── lib/email-templates.js     # HTML email template builder
│   └── api/v1/                    # REST API endpoints (assessments, feedback, signals, drafts, runs, webhooks)
├── tests/
│   ├── *.spec.js                  # 28 Playwright E2E test specs
│   ├── helpers/                   # assessment-runner.js, selectors.js, wait-utils.js
│   └── fixtures/                  # profiles.json, cta-expectations.json
├── .github/workflows/
│   ├── test-preview.yml           # CI on push to dev (tests against preview URL)
│   └── test-production.yml        # CI on push to main (tests against www.nickjewell.ai)
├── assets/                        # OG images, favicon, company logos
├── docs/                          # Specs (assessment, architecture, design, taste-ip)
├── CLAUDE.md                      # This file
├── package.json
├── playwright.config.js
└── wrangler.toml
```

## Design System
Dark editorial. Fraunces (display) + DM Sans (body). Amber accent `#c8965a` on near-black `#080808`. Film grain overlay. Fade-in animations.

## Build Workflow (ENFORCED)
1. Claude specs in chat → Nick pastes into Claude Code
2. Claude Code commits to `dev` branch
3. Nick runs `git push origin dev`
4. Verify on Cloudflare preview URL (`dev.nickjewell-ai.pages.dev`)
5. Merge to `main` only when verified
6. NEVER push directly to main

## Key Rules
- Nick cannot run npx/wrangler locally (no Node in PATH). D1 ops via Cloudflare dashboard Console tab.
- Windows PowerShell — no `&&` chaining. Commands run one at a time.
- Cache bust JS files after changes (bump `?v=` param in HTML script tags).
- All API config via environment variables. No hardcoded keys, URLs, or secrets.
- Admin bypass: `?admin_key=VALUE` in URL skips rate limiting and auto-reveals results.
- Deterministic fallback on all API features. If Sonnet/Opus fails, assessment still works.
- Never add Co-authored-by trailers to commits.

## Scoring Quick Reference
- **Layer scores:** 0-100 per layer (raw score / max possible × 100)
- **Taste:** 3 sub-dimensions — Frame Recognition (max 6), Kill Discipline (max 4), Edge-Case Instinct (max 5). Total max = 15.
- **Taste signatures:** Sophistication (FR ≥ 4, all ≥ 2), Pragmatism (all between 1-4), Caution (EC > KD and EC > FR, FR ≤ 2), Momentum (total ≤ 4 or FR = 0)
- **Consistency modifier (3 responses):** All-same penalty = -1, all-different bonus = +1 FR
- **Verdict:** Green (≥70), Amber (40-69), Red (<40) composite with Taste modifier
- **Taste modifiers:** Sophistication/Pragmatism = no modifier, Caution = -5, Momentum = -15
- **Binding constraint:** Lowest-scoring layer
- **CU2 bonus:** Sonnet analyzes free-text for specificity/accountability/learning → +0-16 on Culture

## Taste Scenario Pool (9 total, serve 3 per user)
- T1: The Pilot Dilemma — 78% vs 85% accuracy
- T2: The Shiny Object Test — CEO excited about LLM, messy knowledge base
- T3: The Kill Decision — 18 months, $400K, unclear ROI
- T4: The Agent Question — autonomous refund agent, 96% accurate
- T5: The Free Trial Trap — $18K tool, trial expires Friday
- T6: The Intern's Dashboard — ChatGPT forecasting, intern leaves in 2 weeks
- T7: The Vendor Demo — $95K contract, 15% error nobody caught
- T8: The Compliance Cliff — regulatory human review, 35 new hires
- T9: The Platform Sunset — 12 models, 18-month deprecation

**Sets (balanced to FR=6, KD=4, EC=5):**
- Exploring (P2=A): T5, T6, T7
- Scaling (P2=B/C): T1, T2, T3
- Operating (P2=D): T4, T8, T9

## D1 Schema
- **assessment_results:** id, created_at, all_responses (JSON), scores (JSON), taste_signature, verdict, binding_constraint, contact_info (JSON), brief_generated, is_test, taste_normalized (JSON), scenario_set (TEXT)
- **brief_ip_counter:** ip, date, count (rate limiting: 3/IP/day, 100 global/day)
- **email_log:** id, created_at, to_email, template_type, status, error
- **assessment_feedback:** id, assessment_id, created_at, sentiment, feedback_text, source_name, source_company, source_channel, source_role, signal_type

## Response Timing
Hidden per-question timing_ms captured on every interaction. Stored in all_responses JSON. Summary stats: total_ms, avg_ms, slowest_ms, fastest_ms, count. No UI change — pure behavioral data.

## E2E Test Suite (Playwright)
28 specs covering: happy paths (3 profiles), taste routing (3 maturity sets), industry branching (5 industries), scoring validation, brief generation, UX mechanics, infrastructure. CI via GitHub Actions with secrets (ADMIN_KEY, CF_ACCOUNT_ID, CF_API_TOKEN). Fixture-driven with reusable helpers.
