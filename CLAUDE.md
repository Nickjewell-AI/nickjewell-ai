# CLAUDE.md — Project Context for Claude Code
### Version 4.0 · April 5, 2026 · Current through Session 17

## Project
**The Jewell Assessment** at nickjewell.ai — AI readiness diagnostic across five layers (Foundation, Architecture, Accountability, Culture, Taste). "Taste" is proprietary IP measuring strategic judgment via scenario-based choices. Built by Nick Jewell, Senior Managing Consultant at IBM.

## Source-of-Truth Docs
This file is the operational reference. For depth, read these first and do not duplicate their content here:
- `docs/architecture.md` (v3, current through S16) — system architecture, bindings, deployment topology
- `docs/assessment-spec.md` (v3, current through S16) — full question bank, routing logic, scoring algorithm
- `docs/design-system v2.md` — R1 redesign (warm editorial, Newsreader + General Sans, claret on warm paper)
- `docs/voice-calibration.md` — voice corrections and samples not yet folded into Voice_Copy_Intelligence_v2.docx

## Architecture (summary — see architecture.md for full system diagram)
- **Frontend:** Vanilla HTML/CSS/JS, no build tools. Cloudflare Pages, auto-deploy from GitHub `main`.
- **API Proxy:** `functions/api-proxy.js` — thin router → modular handlers in `functions/lib/handlers/`.
- **REST API v1:** `functions/api/v1/` — `/assessments`, `/feedback`, `/signals`, `/drafts`, `/runs`, `/webhooks`. Bearer-token auth. `{data, meta, error}` envelope.
- **AI Models:** Claude Sonnet 4 (`claude-sonnet-4-20250514`) for CU2 analysis + Taste reasoning; Claude Opus 4.6 for brief streaming + cron brief generation.
- **Database:** Cloudflare D1 (`jewell-assessment-db`, ID: `97e104f4-6135-4b8e-a3fb-78f569b3a7c5`). Introspect at runtime.
- **Email:** Resend via `sendEmail()` in `functions/lib/handlers/email.js` — single point of control, honors TEST_MODE.
- **Domain:** Only `www.nickjewell.ai` resolves. Bare → 301. HTTPS + HSTS enforced.

## Workers (standalone, each has own wrangler.toml)
Discover: `ls workers/*/wrangler.toml`
- **`workers/scheduled-brief/`** — cron `* * * * *`. Picks up `brief_email_status='pending'`, generates brief via Opus, sends via Resend. Fully decoupled from browser.
- **`workers/daily-digest/`** — cron `0 12 * * *` (7 AM CT). 10 D1 queries → pipeline summary to nick@nickjewell.ai.

## Assessment Flow (summary — see assessment-spec.md for routing/scoring depth)
```
PULSE (P1-P7, ~1 min) → P1 Role, P2 Maturity, P3 Industry, P4 Concern, P7 Size (5 questions, P5/P6 retired S6)
  ↓
DIAGNOSTIC (4 layers, ~3 min) → deep (3q) or shallow (1-2q) by routing; adaptive follow-up on lowest layer
  ↓
TASTE TEST (3 of 9 scenarios, ~1 min) → P2-routed; scenario + inline reasoning same card; "One Last Thing" free-text
  ↓
CAPTURE GATE → name/email/company/role gates ALL results; fire-and-forget POST queues brief
  ↓
RESULTS → verdict + layers + Taste + constraint + action plan; brief streams on-page; cron emails brief
```

**Features layered on top:**
- **N/A escape valve** (S13) — contextual on diagnostic questions. `score: null`, excluded from denominator, `naCounts` tracked per layer.
- **Weighted relevance** (S13) — each question carries `relevance.role` and `relevance.size` weights (0.0-1.0). 3-tier hint system. `roleWeight`/`sizeWeight` stored per response.
- **Back button** (S13) — `_stateHistory` stack. `goBack()`/`canGoBack()` exported. Hidden on P1.
- **Share mechanic** (S13) — copy/email/text on results. `?ref={assessmentId}` tracking → `ref_source` column in D1.
- **Progress bar** — phase-based (Pulse 0-25%, Diagnostic 25-75%, Taste 75-100%). No "X of Y".
- **Response timing** — hidden per-question `timing_ms`, stored in `all_responses` JSON.
- **Industry personalization** — 5 priority industries get 240 custom option variants. Generic fallback otherwise. P3+P7 condition brief actions.
- **Interaction count:** 12-16 depending on path. Under 5 minutes.

## Design System (R1 Redesign, shipped S14-S16)
**Source of truth: `docs/design-system v2.md`**
- **Typography:** Newsreader (display/headings, Google Fonts) + General Sans (body/UI, self-hosted WOFF2)
- **Palette:** warm paper `#FAF8F5` · claret accent `#722F37` · navy text `#1a1a2e`
- **Aesthetic:** warm editorial — Pentagram meets McKinsey Digital meets FT. Typographic authorship, editorial restraint.
- **R2 Phase A (shipped S15-S16):** GSAP scroll orchestration (`js/scroll-animations.js`), page loader, custom cursor (`js/custom-cursor.js`), hero word-split animation.
- **Hero structure (S17):** H1 (Newsreader 300) → subtitle deck (Newsreader 300 italic) → body (General Sans).
- **BANNED** (anti-convergence): Fraunces, DM Sans, Inter, Roboto, Space Grotesk; dark backgrounds `#080808`-`#141414`; amber/gold accents; SVG noise/grain; fade-in translateY as primary reveal. If an element looks AI-generated, refactor until it doesn't.

## Voice & Copy
All external-facing copy (LinkedIn, Substack, DMs, assessment text, site copy) must follow **Voice_Copy_Intelligence_v2.docx** in project knowledge. Before writing copy, also check `docs/voice-calibration.md` for recent corrections.

**Three-tier evidence standard:** Cited Data · First-Party D1 · Explicitly Framed as Thesis. No ungrounded claims.

**First-touch copy rule:** Zero framework jargon ("binding constraint," "Taste signature," "five layers") in any copy a cold visitor sees before taking the assessment. Framework language belongs in the assessment flow, results, briefs, and deep content only.

**Locked hero tagline:** "Meet AI where you are — then take it further than you ever thought." Two-part structure: H1 = Part 1, subtitle deck = Part 2.

**Quality test:** "Would Nick say this out loud to a smart friend?"

## Build Workflow (ENFORCED)
1. Claude specs in chat → Nick pastes into Claude Code
2. Claude Code commits to `dev` branch
3. Nick runs `git push origin dev`
4. Verify on Cloudflare preview (`dev.nickjewell-ai.pages.dev`)
5. Fast-forward merge to `main` only after verification
6. **NEVER push directly to main**
7. Workers deployed separately: `npx wrangler deploy --config workers/<name>/wrangler.toml`

## Cost Guard (HIGHEST PRIORITY)
Every build that touches Opus/Sonnet, Resend, or cron Workers MUST include guards preventing real API spend from non-real-user traffic. Before committing:
1. Test records (email containing `@playwright.dev`, `@test.dev`, or `test@example.com`) cannot trigger real Anthropic or Resend calls
2. Admin/dev completions (`admin_key` present) route to mock paths
3. CI data written to shared D1 cannot be picked up by production Workers
4. `is_test` column in D1 filters test records from production queries

Unguarded API spend is a production bug. Block the build until resolved.

## Testing Rules
- `TEST_MODE` env variable on every Worker and Pages deployment: when `'true'`, AI handlers return canned responses and Resend calls are mocked. String comparison: `env.TEST_MODE === 'true'`.
- All Playwright tests mock by default. Cost guard sealed in S13 via `installCostGuardRoutes` in `tests/e2e/helpers/assessment-runner.js`.
- Only 1-2 real API calls per build (happy path validation). Error handling, dedup, admin bypass, CORS, D1 tests must never hit Anthropic or Resend.
- Shared `sendEmail()` in `handlers/email.js` is the single point of control for all Resend calls.
- **GitHub Actions CI** runs Playwright on every push to both `dev` (preview URL) and `main` (production URL). Secrets: ADMIN_KEY, CF_ACCOUNT_ID, CF_API_TOKEN.

## Brief Email Architecture
1. User submits capture gate
2. Client fires keepalive POST to `/api-proxy` with `type: 'generate-and-email-brief'`
3. Thin handler validates, dedup checks, stores `brief_request_payload` JSON in D1, sets `brief_email_status='pending'`, returns 202
4. Separately, client-side `triggerBriefGeneration()` streams brief on-page via Opus (independent of email)
5. Cron Worker (`scheduled-brief`) runs every 1 minute, queries `WHERE brief_email_status='pending' AND brief_request_payload IS NOT NULL LIMIT 1`
6. Worker generates brief via Opus (non-streaming, max_tokens 4096), builds email, sends via Resend
7. On success: `brief_email_status='sent'`, clears payload, writes to `email_log`
8. On failure: `brief_email_status='failed:<error>'`, writes to `email_log` with `status='error'`

**Prompt sync (three files):** `functions/lib/brief-prompts.js` (source of truth) · `js/assessment-ui.js` (client streaming) · `workers/scheduled-brief/index.js` (cron). All three must stay in sync — consolidates when client-side Opus call is removed.

## D1 Schema
Introspect the live schema before writing any queries:
- Tables: `SELECT name FROM sqlite_master WHERE type='table'`
- Columns: `PRAGMA table_info(<table_name>)`
- Run via: `npx wrangler d1 execute jewell-assessment-db --command "<query>"`

**Current tables:** `assessment_results` (30 cols) · `email_log` (10 cols) · `assessment_feedback` (12 cols) · `brief_ip_counter` · `webhook_registrations` · `signal_log` · `agent_drafts` · `agent_runs` · `rate_limits` · `intent_signals`

**Gotchas:** table is `brief_ip_counter` not `brief_counter`; column is `timestamp` not `created_at`; `name`/`email`/`company`/`role` are top-level columns (not nested JSON); `assessment_results` includes `ref_source` for share-link attribution (migrations/0005_ref_source.sql).

## Scoring Quick Reference (see assessment-spec.md §Scoring for full detail)
- **Layer scores:** 0-100 per layer (raw / max possible × 100). N/A excluded from denominator.
- **Taste dimensions:** Frame Recognition (max 6) · Kill Discipline (max 4) · Edge-Case Instinct (max 5). Total 15.
- **Signatures:** Sophistication (FR≥4, all≥2) · Pragmatism (all 1-4) · Caution (EC>KD, EC>FR, FR≤2) · Momentum (total≤4 or FR=0)
- **Consistency modifier (3 responses):** all-same = -1 FR; all-different = +1 FR
- **Verdict:** Green ≥70 · Amber 40-69 · Red <40 (composite with Taste modifier)
- **Taste modifiers:** Soph/Pragma = 0 · Caution = -5 · Momentum = -15
- **Binding constraint:** lowest-scoring layer
- **CU2 bonus:** Sonnet analyzes free-text → +0-16 on Culture

## Repo Structure
Do NOT rely on a static tree. Introspect the live repo:
```
ls -la                                           # top level
find . -type f | grep -v node_modules | grep -v '.git/' | sort   # full tree
ls workers/*/wrangler.toml                       # workers
ls tests/e2e/specs/                              # test specs
```

Key directories: `js/` (client JS) · `functions/` (Pages Functions) · `workers/` (Scheduled Workers) · `tests/` (Playwright E2E) · `assets/` · `docs/` · `migrations/` · `fonts/`

## Key Rules
- Node.js, npm, wrangler installed locally. Nick can run npx/wrangler.
- D1 ops via Cloudflare Console or wrangler CLI.
- Windows bash shell — use Unix syntax, forward slashes in paths.
- Cache bust JS files after changes (bump `?v=` param in HTML script tags).
- All API config via environment variables. No hardcoded keys, URLs, or secrets.
- **Admin bypass:** `?admin_key=VALUE` in URL skips capture gate, auto-reveals results, routes to mock paths.
- **Capture gate before results:** no verdict, scores, or brief visible until name/email/company/role submitted. Admin bypass only exception.
- **Deterministic fallback** on all AI features. If Sonnet/Opus fails, assessment still completes.
- **Never** add Co-authored-by trailers to commits.
- **Never** suggest quick fixes, stopgaps, or "good enough for now" solutions. Every build architecturally correct, scalable, elegant, production-grade from the start.
- **Read all relevant files** before making changes. Report what was found.
- **Before committing:** audit for regressions. Check route mappings, handler references, event listeners, POST endpoints. Verify no existing feature broke. Report what was checked.
- **Restate before building** (any deliverable >500 words).
- **Never silently drop a requirement.** If something in the spec can't be done or conflicts, flag it.
- **Grade fidelity, not completeness.** Build the 92/100, not the 61/100. No half measures.
- **Session start:** ground in these rules, proactively debug before presenting code.
