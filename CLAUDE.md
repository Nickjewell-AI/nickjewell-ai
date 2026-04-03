# CLAUDE.md — Project Context for Claude Code

## Project
**The Jewell Assessment** at nickjewell.ai — AI readiness diagnostic across five layers (Foundation, Architecture, Accountability, Culture, Taste). "Taste" is proprietary IP measuring strategic judgment via scenario-based choices. Built by Nick Jewell, Senior Managing Consultant at IBM.

## Architecture
- **Frontend:** Vanilla HTML/CSS/JS, no build tools
- **Hosting:** Cloudflare Pages, auto-deploy from GitHub `main`
- **API Proxy:** Cloudflare Pages Function at `/functions/api-proxy.js` — thin router delegating to modular handlers
- **AI Models:** Claude Sonnet 4 (`claude-sonnet-4-20250514`) for Taste reasoning follow-ups + CU2 culture analysis; Claude Opus 4.6 for on-page executive brief streaming + server-side brief generation
- **Database:** Cloudflare D1 (`jewell-assessment-db`, ID: `97e104f4-6135-4b8e-a3fb-78f569b3a7c5`). Schema introspected at runtime — see D1 Schema section below.
- **Email:** Resend API via handlers. Templates in `/functions/lib/email-templates.js`. Send-as: nick@nickjewell.ai
- **Brief Email Delivery:** Cloudflare Scheduled Worker (`scheduled-brief-worker`) runs every 1 minute. Picks up `brief_email_status = 'pending'` records from D1, generates brief via Opus (non-streaming), sends email via Resend. Fully decoupled from browser — user can close tab immediately and still receives brief.
- **Domain:** Only `www.nickjewell.ai` resolves. Bare domain 301 redirects via Cloudflare Page Rule. Always Use HTTPS + HSTS enabled.

## Assessment Flow (Post-Session 10)
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
  Free-text responses (CU2 follow-up, adaptive, Taste reasoning) saved in all_responses JSON as
  cu2FreeText, cu2Analysis, adaptiveFreeText, tasteFreeText.
  ↓
TIER 3: TASTE TEST — 3 scenarios per user (from pool of 9, maturity-routed)
  P2 answer determines scenario set:
    Exploring (P2=A) → T5/T6/T7 (mid-market, first AI decisions)
    Piloting/Scaling (P2=B/C) → T1/T2/T3 (growth-stage)
    Operating (P2=D) → T4/T8/T9 (enterprise optimization)
  Each scenario + inline reasoning follow-up on same card.
  1 consolidated post-Taste free-text prompt ("One Last Thing"). Submit advances regardless of text.
  ↓
CAPTURE GATE — Email capture screen with 6-item value teaser (name/email/company/role required)
  Gates ALL results. User sees nothing until form submitted. "See My Results" earned-language CTA.
  "Also delivered to your inbox" frames email as bonus. "No list. No spam. Just your results."
  Admin bypass: ?admin_key skips capture entirely.
  On submit: D1 PATCH saves contact info (keepalive: true). Fire-and-forget POST to
  generate-and-email-brief stores brief_request_payload + sets brief_email_status = 'pending'.
  Cron Worker picks up pending record within 1 minute, generates brief via Opus, emails via Resend.
  ↓
RESULTS — Everything renders at once after capture:
  Verdict badge + layer bars + taste signature + constraint explanation + 3-horizon action plan
  + Executive brief auto-streams via Opus 4.6 on-page (client-side, separate from cron email)
  Brief conditioned by P3 industry + P7 company size for action specificity.
  User gets one email with full brief regardless of whether they stay on page.
```

**Key UI functions:** `initCaptureForm()` handles gate submission + triggers server-side brief → `showAllResults()` reveals everything with staggered animations → `triggerBriefGeneration()` streams brief on-page (client-side Opus call, independent of email delivery).

**Progress bar:** Phase-based (Pulse 0-25%, Diagnostic 25-75%, Taste 75-100%). No "X of Y" counter.

**Interaction count:** 12-16 depending on path. Under 5 minutes.

## Industry Personalization (3 layers)
1. **Taste scenarios** routed by maturity stage (P2)
2. **Diagnostic options** branched by industry (P3) — 5 industries: Healthcare (B), Financial Services (A), Technology/SaaS (C), Professional Services (F), Manufacturing/Industrial (D). Generic fallback for all others. CU2 excluded (special free-text handling).
3. **Brief actions** calibrated by industry + company size (P3 + P7) via Opus system prompt conditioning

**Industry URL scaffolding:** `?industry=healthcare` (etc.) pre-populates P3 for industry-specific landing pages.

## Repo Structure
Do NOT rely on a static tree. Introspect the live repo:
```
# Full file tree (excludes node_modules, .git):
find . -type f | grep -v node_modules | grep -v '.git/' | sort

# Just top-level structure:
ls -la

# Workers (each has its own wrangler.toml):
ls workers/*/wrangler.toml

# Test specs:
ls tests/*.spec.js
```

Key directories:
- `js/` — Client-side JS (assessment-engine.js, assessment-ui.js, api.js)
- `functions/` — Cloudflare Pages Functions (api-proxy.js router + lib/ handlers/middleware)
- `workers/` — Standalone Cloudflare Scheduled Workers (each with own wrangler.toml)
- `tests/` — Playwright E2E specs + helpers + fixtures
- `assets/` — OG images, favicon, company logos
- `docs/` — Specs (assessment, architecture, design, taste-ip)

## Design System
Dark editorial. Fraunces (display) + DM Sans (body). Amber accent `#c8965a` on near-black `#080808`. Film grain overlay. Fade-in animations.

## Voice & Copy
All external-facing copy (LinkedIn, Substack, DMs, comments, assessment text) must follow Voice_Copy_Intelligence_v2.docx in project knowledge. Before generating copy, also check docs/voice-calibration.md for recent corrections or new samples not yet folded into the main doc. Three-tier evidence standard: Cited Data, First-Party D1, or Explicitly Framed as Thesis. No ungrounded claims. Quality test: "Would Nick say this out loud to a smart friend?"

## Build Workflow (ENFORCED)
1. Claude specs in chat → Nick pastes into Claude Code
2. Claude Code commits to `dev` branch
3. Nick runs `git push origin dev`
4. Verify on Cloudflare preview URL (`dev.nickjewell-ai.pages.dev`)
5. Merge to `main` only when verified
6. NEVER push directly to main
7. Workers deployed separately — see Worker Deployment section below

## Key Rules
- Node.js, npm, and wrangler installed locally. Check versions: `node -v` / `npm -v` / `npx wrangler --version`. Nick CAN run npx/wrangler now.
- D1 ops can be done via Cloudflare dashboard Console tab OR wrangler CLI.
- Windows PowerShell — no `&&` chaining. Commands run one at a time.
- Cache bust JS files after changes (bump `?v=` param in HTML script tags).
- All API config via environment variables. No hardcoded keys, URLs, or secrets.
- Admin bypass: `?admin_key=VALUE` in URL skips capture gate and auto-reveals results.
- Capture gate before results. No verdict, no scores, no brief visible until name/email/company/role submitted. Admin bypass only exception.
- Deterministic fallback on all API features. If Sonnet/Opus fails, assessment still works.
- Never add Co-authored-by trailers to commits.
- NEVER suggest quick fixes, stopgaps, or "good enough for now" solutions. Every build must be architecturally correct, scalable, elegant, and production-grade from the start.
- Before committing, audit the entire project for regressions. Check all route mappings, handler references, event listeners, and POST endpoints against the codebase. Verify no existing feature was broken by this change. Report what you checked and confirmed working.
## Cost Guard (HIGHEST PRIORITY)
Every build that touches Opus/Sonnet API calls, Resend emails, or cron Workers MUST include guards preventing real API spend from non-real-user traffic. Before committing:
1. Test records (email containing @playwright.dev, @test.dev, or test@example.com) cannot trigger real Anthropic or Resend calls
2. Admin/dev completions (admin_key present) route to mock paths, not paid APIs
3. CI data written to shared D1 cannot be picked up and processed by production Workers
Unguarded API spend is a production bug. Block the build until resolved.
## Testing Rules
- TEST_MODE env variable on Workers/Pages: when 'true', AI handlers return canned responses (never call Anthropic) and Resend calls are mocked (never send real email). Uses string comparison: `env.TEST_MODE === 'true'`.
- All tests mock by default. Only 1-2 real API calls per build (happy path validation).
- Error handling, dedup, admin bypass, CORS, D1 tests must never hit Anthropic or Resend.
- Shared `sendEmail()` function in email.js is the single point of control for all Resend calls — impossible to bypass TEST_MODE.

## Brief Email Architecture
1. User clicks "See My Results" on capture gate
2. Client fires keepalive POST to `/api-proxy` with `type: 'generate-and-email-brief'`
3. Thin handler validates, dedup checks (skip if already pending/sent), stores `brief_request_payload` JSON in D1, sets `brief_email_status = 'pending'`, returns 202
4. Separately, client-side `triggerBriefGeneration()` streams brief on-page via Opus (independent of email)
5. Cron Worker (`scheduled-brief-worker`) runs every 1 minute, queries `WHERE brief_email_status = 'pending' AND brief_request_payload IS NOT NULL LIMIT 1`
6. Worker generates brief via Opus (non-streaming, max_tokens 4096), builds email, sends via Resend
7. On success: sets `brief_email_status = 'sent'`, clears `brief_request_payload`, writes to email_log
8. On failure: sets `brief_email_status = 'failed:<error message>'`, writes to email_log with status='error'

**Prompt source of truth:** `functions/lib/brief-prompts.js`. Also duplicated in `js/assessment-ui.js` for client-side streaming and `workers/scheduled-brief/index.js` for cron Worker. Sync comments in all three files. Will consolidate when client-side Opus call is removed.

## D1 Schema
Before writing any D1 queries, introspect the live schema:
- Tables: `SELECT name FROM sqlite_master WHERE type='table'`
- Columns: `PRAGMA table_info(<table_name>)`
- Run via: `npx wrangler d1 execute jewell-assessment-db --command "<query>"`

Key gotchas: Table is `brief_ip_counter` not `brief_counter`. Column is `timestamp` not `created_at`. name/email/company/role are top-level columns, not nested JSON.
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

## Response Timing
Hidden per-question timing_ms captured on every interaction. Stored in all_responses JSON. Summary stats: total_ms, avg_ms, slowest_ms, fastest_ms, count. No UI change — pure behavioral data.

## Free-Text Response Storage
CU2 follow-up text → `cu2FreeText` in all_responses JSON
CU2 Sonnet analysis → `cu2Analysis` in all_responses JSON
Adaptive micro-prompt text → `adaptiveFreeText` in all_responses JSON (keyed by question ID)
Post-Taste "One Last Thing" → `tasteFreeText` in all_responses JSON

## E2E Test Suite (Playwright)
Test count changes frequently — run `ls tests/*.spec.js | wc -l` to see current specs. CI via GitHub Actions with secrets (ADMIN_KEY, CF_ACCOUNT_ID, CF_API_TOKEN). Fixture-driven with reusable helpers. Runner handles capture gate form before result extraction.

## Worker Deployment
Workers are standalone Cloudflare Scheduled Workers, each in their own directory under `workers/`. Discover all workers:
```
ls workers/*/wrangler.toml
```

Deploy any worker (from repo root):
```
npx wrangler deploy --config workers/<worker-name>/wrangler.toml
```

Add/update secrets for any worker:
```
npx wrangler secret put <SECRET_NAME> --config workers/<worker-name>/wrangler.toml
```

Common secrets: ANTHROPIC_API_KEY, RESEND_API_KEY. Set TEST_MODE via Cloudflare Dashboard > Workers > [worker-name] > Settings > Variables.

