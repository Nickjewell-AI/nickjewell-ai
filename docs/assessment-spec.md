# Assessment Engine Specification
## The Jewell Assessment — Technical Spec
### Version 2.0 · April 2026

---

## Assessment Flow Architecture

### Overview
Three-tier adaptive assessment. Each tier increases depth based on user context. Total experience: 12-16 interactions, under 5 minutes.

```
TIER 1: THE PULSE (5 questions, ~1 min)
  P1 Role → P2 Maturity → P3 Industry → P4 Concern → P7 Company Size
  P1/P2/P4 drive routing. P3 drives industry-specific options + brief conditioning.
  P7 drives brief conditioning. P2 drives Taste scenario set selection.
  ↓
TIER 2: THE DIAGNOSTIC (all 4 layers, ~3 min)
  Deep modules (3 questions) or shallow (1-2 questions) based on routing.
  Compound module cards: each module = 1 card, questions reveal progressively.
  Industry-specific option text for 5 priority industries (240 variants).
  Adaptive follow-up: 1 lowest-scoring layer (≤33, <3 responses) gets 2 extra questions + micro-prompt.
  ↓
TIER 3: THE TASTE TEST (3 scenarios from pool of 9, maturity-routed, ~1 min)
  Each scenario + inline reasoning follow-up on same card.
  1 consolidated post-Taste free-text prompt ("One Last Thing").
  ↓
CAPTURE GATE — Email capture screen (name/email/company/role required)
  Gates ALL results. User sees nothing until form submitted.
  On submit: D1 PATCH saves contact info (keepalive: true).
  Fire-and-forget POST stores brief_request_payload + sets brief_email_status = 'pending'.
  Cron Worker generates brief via Opus + emails via Resend within 1-2 minutes.
  ↓
RESULTS — Everything renders at once after capture:
  Verdict + layers + taste + constraint + action plan + brief streams on-page via Opus 4.6
  User receives one email with full brief regardless of whether they stay on page.
```

### Response Timing
Hidden per-question timing_ms captured on every interaction. Stored in `all_responses` JSON alongside response data. Summary stats calculated: total_ms, avg_ms, slowest_ms, fastest_ms, count. No UI change — pure behavioral data collection.

### Progress Bar
Phase-based: Pulse 0-25%, Diagnostic 25-75%, Taste 75-100%. No "X of Y" counter. Eliminates the class of "lying counter" bugs permanently.

---

## Tier 1: The Pulse

### Purpose
Context-setting. NOT scored. Determines routing depth, Taste scenario set, industry option variants, and brief conditioning parameters.

### Questions

**P1: Role Context**
"What best describes your relationship to AI at your organization?"
- A) I'm the one making AI decisions for us
- B) I'm evaluating whether AI makes sense for us
- C) I'm building or implementing AI projects
- D) I'm trying to figure out where we actually stand

*Routing logic:*
- A/B → emphasize Accountability/Culture (they likely know foundation; test judgment)
- C → emphasize Foundation/Architecture (they're in the weeds; test infrastructure)
- D → balanced across all layers, simpler language (low-depth variants)

**P2: AI Maturity Stage**
"Where is your organization on the AI journey?"
- A) Exploring — haven't started any AI projects yet
- B) Piloting — running 1-3 AI experiments or proofs of concept
- C) Scaling — trying to move from pilots to production
- D) Operating — AI is in production workflows today

*Routing logic:*
- A → Foundation-heavy, lighter on Accountability/Culture
- B → Architecture + Accountability focus (pilot-to-production gap)
- C → Full depth across all layers (this is where most fail)
- D → Culture + Taste emphasis (operational orgs need judgment assessment)

*Taste routing:*
- A → Exploring scenario set (T5/T6/T7)
- B/C → Scaling scenario set (T1/T2/T3)
- D → Operating scenario set (T4/T8/T9)

**P3: Industry**
Dropdown selection. Used for industry-specific diagnostic option text and brief conditioning.
- A) Financial Services
- B) Healthcare
- C) Technology / SaaS
- D) Manufacturing / Industrial
- E) Retail & Consumer
- F) Professional Services (Consulting, Legal, Accounting)
- G) Other

*5 priority industries (A, B, C, D, F) get 240 custom option variants across 12 diagnostic questions. All others get generic options. Scores identical across all variants — only language changes.*

**P4: Biggest Concern**
"What's your biggest worry about AI implementation right now?"
- A) We don't have the right data or infrastructure
- B) Our processes aren't ready for AI
- C) Nobody owns AI outcomes — accountability is unclear
- D) Our people aren't ready or willing to change
- E) We're not sure we're choosing the right AI initiatives

*Routing logic:* Direct mapping to Layers 1-5. User's self-identified concern gets ADDITIONAL probing (they may be right or wrong about where the problem actually is — the assessment validates or redirects).

**P7: Company Size**
"How big is your organization?"
- A) Under 50
- B) 50-200
- C) 200-1,000
- D) 1,000-10,000
- E) 10,000+

*Not used for routing. Used for brief conditioning — actions calibrate from "export to Google Sheets this week" for a 20-person practice to "get your CTO and risk officer in the same room" for a 5,000-person enterprise.*

**Removed:** P5 (Knowledge Depth Check) and P6 removed in Session 6 optimization. Knowledge depth now inferred from P1 role selection.

---

## Tier 2: The Diagnostic

### Adaptive Branching
Based on Tier 1 responses, all 4 layers are assessed — each gets deep (3 questions) or shallow (1-2 questions) based on routing. Questions adapt based on inferred knowledge depth from P1.

### Compound Module Cards
Each layer module renders as a single card. Questions within a module reveal progressively (answer one, next appears on the same card). This reduces perceived question count and creates a more conversational feel.

### Industry-Specific Options
For the 5 priority industries, each of the 12 diagnostic questions has custom option text using industry-native language:
- **Healthcare (P3=B):** EMR, HIPAA, clinical informatics, CMIO, radiology
- **Financial Services (P3=A):** CRM, compliance, risk committee, audit, front-line staff
- **Technology/SaaS (P3=C):** APIs, CI/CD, feature flags, sprint cycles, eng teams
- **Professional Services (P3=F):** CRM, utilization, partner compensation, engagement teams
- **Manufacturing/Industrial (P3=D):** ERP, SCADA, shift reports, ISO audits, plant operators

CU2 excluded from industry variants (special free-text handling).

### Layer 1: Foundation Module

**F1: Data Accessibility**
*High-depth version:* "If an AI system needed to pull your last 12 months of customer interactions right now, what would it find?"
- A) Clean, structured data in one system with API access (score: 4)
- B) Data across 2-3 systems, mostly structured, some manual joining needed (score: 3)
- C) Data scattered across many systems, formats vary, significant gaps (score: 1)
- D) I honestly don't know what it would find (score: 0)
- E) Depends on the department — some are clean, others are a mess (score: 2)

*Low-depth version:* "How would you describe your organization's data situation?"
- A) Our data is well-organized and easy to access (score: 4)
- B) We have data but it takes effort to pull it together (score: 3)
- C) Data is scattered and messy (score: 1)
- D) I don't have visibility into our data (score: 0)

**F2: Governance Reality**
"Does your organization have a data governance policy?"
- A) Yes, and it's actively enforced with designated owners (score: 4)
- B) Yes, it exists as a document but I'm not sure how it's enforced (score: 1)
- C) We're working on one (score: 2)
- D) No / I don't know (score: 0)

*Follow-up if B:* "Can you name the person who enforces it?" (If no → confirms performative governance)

**F3: Data Quality Pain**
"Has data quality ever blocked or significantly slowed an AI or analytics project?"
- A) Yes, and we fixed the root cause (score: 4)
- B) Yes, and it's still a problem (score: 2)
- C) Not that I know of — but we haven't tried much yet (score: 1)
- D) No, our data is solid (score: 3)

### Layer 2: Architecture Module

**A1: Process Mapping**
"Could you draw your most critical business workflow end-to-end on a whiteboard right now — including every handoff between teams and systems?"
- A) Yes, it's well-documented and current (score: 4)
- B) Mostly — I know the main flow but there are handoffs I'd have to investigate (score: 3)
- C) It would be rough — a lot happens informally or through workarounds (score: 1)
- D) No — our processes are complex and not well-documented (score: 0)

**A2: The Redesign Question**
"When was the last time a major business process was fundamentally redesigned (not just patched or updated)?"
- A) Within the last year (score: 4)
- B) 1-3 years ago (score: 3)
- C) Longer ago / never (score: 1)
- D) I don't know (score: 0)

**A3: The Kevin Test**
"Are there any critical data flows or processes that depend on a specific person running something manually (a script, an export, a report)?"
- A) No — our critical flows are fully automated and documented (score: 4)
- B) Maybe one or two — but they're not mission-critical (score: 3)
- C) Yes — more than I'd like to admit (score: 1)
- D) I'm not sure (score: 0)

*Follow-up if C:* "What happens when that person is on vacation?"

### Layer 3: Accountability Module

**AC1: Named Owner**
"If your AI system produced a bad outcome at 2am on a Saturday, who specifically gets called?"
- A) A specific named individual with authority to act (score: 4)
- B) An on-call rotation with clear escalation paths (score: 4)
- C) It would depend / I'd have to figure out who to call (score: 1)
- D) Our AI governance committee would handle it at the next meeting (score: 0)

*D is the strongest negative signal in the entire assessment.*

**AC2: Kill History**
"Has your organization ever killed an AI or technology project mid-flight because it wasn't working?"
- A) Yes — and the person who made that call was supported (score: 4)
- B) Yes — but it was politically difficult (score: 2)
- C) No — projects generally run until budget is exhausted (score: 0)
- D) Not that I'm aware of (score: 0)

**AC3: Pre-Defined Failure Criteria**
"Before launching an AI initiative, do you define specific conditions under which you'd pause or stop it?"
- A) Yes — documented failure criteria before every launch (score: 4)
- B) Informally — we'd know it if we saw it (score: 2)
- C) No — we evaluate as we go (score: 1)
- D) I don't think so (score: 0)

### Layer 4: Culture Module

**CU1: Workflow Redesign**
"Has any job role or daily workflow at your organization been fundamentally changed because of AI (not just 'now you also have this AI tool')?"
- A) Yes — some roles look completely different now (score: 4)
- B) People have new AI tools, but their day-to-day is mostly the same (score: 1)
- C) Changes are planned but haven't happened yet (score: 2)
- D) No real change (score: 0)

**CU2: Honest Failure**
"Can you describe an AI initiative at your organization that didn't work, and what you learned from it?"
- A) Yes — I can name the project, what went wrong, and what we changed because of it (score: 4)
- B) Everything we've tried has worked (score: 0)
- C) We haven't tried enough to have a real failure yet (score: 2)
- D) Failures have happened, but they got quietly shelved — nobody talks about them (score: 1)

*Insight on B:* "In our experience, 'everything works' is either the result of not measuring or not being honest. Both are strong culture signals."

*API analysis (option A):* If user selects A, a free-text follow-up asks them to describe the failure. Claude Sonnet 4 analyzes the response for specificity, accountability, and learning depth → +0-16 bonus on Culture score.

*Low-depth version:* "Has any AI or tech initiative at your organization not worked out? What happened?"
- A) Yes — and we learned specific lessons from it (score: 4)
- B) Everything has gone well so far (score: 0)
- C) We haven't done enough to have failures yet (score: 2)

**CU3: Safety to Dissent**
"If someone in a meeting said 'I don't think we're ready for this AI initiative,' what would happen?"
- A) They'd be heard — someone would ask 'tell me more' regardless of their title (score: 4)
- B) Depends who says it — a VP gets listened to, a manager gets steamrolled (score: 2)
- C) It would be unwelcome — the room would move past it quickly (score: 1)
- D) Nobody's going to be the person who slows this down (score: 0)

### Adaptive Follow-Up
After all 4 layer modules complete, the engine checks for layers that scored ≤33% with fewer than 3 responses. The single lowest-scoring eligible layer gets 2 additional probing questions plus a micro-prompt encouraging deeper reflection. Capped at 1 layer to control assessment length.

---

## Tier 3: The Taste Test

### Purpose
Reveal strategic judgment through scenario-based choices. NOT self-reported. The user sees 3 maturity-routed scenarios that generate a three-dimensional Taste profile.

### Maturity-Routed Scenario Sets
P2 answer determines which 3 scenarios the user sees:

**Exploring (P2=A):** T5 (Free Trial Trap), T6 (Intern's Dashboard), T7 (Vendor Demo)
**Scaling (P2=B/C):** T1 (Pilot Dilemma), T2 (Shiny Object Test), T3 (Kill Decision)
**Operating (P2=D):** T4 (Agent Question), T8 (Compliance Cliff), T9 (Platform Sunset)

All sets balanced to identical dimensional ceilings: FR=6, KD=4, EC=5, total=15.

### Scenario Presentation
Each scenario is presented as a situation + 4 options on a single card. After choosing, an inline reasoning follow-up appears on the same card with a scenario-specific, choice-specific lead-in and 4 reasoning options. Each reasoning option carries FR/KD/EC modifiers (typically ±1).

An optional "Tell us more →" free-text field triggers Claude Sonnet 4 analysis for additional ±1 dimensional adjustments. If the API fails, only deterministic scores are used.

After all 3 scenarios, a consolidated "One Last Thing" free-text prompt captures any additional context for the executive brief.

### Scenarios
*Full scenario text, option scoring, and dimensional weights documented in taste-ip.md.*

### Taste Scoring
```
Frame Recognition  = sum of FR from 3 scenarios + reasoning adjustments  (max ~6)
Kill Discipline    = sum of KD from 3 scenarios + reasoning adjustments  (max ~4)
Edge-Case Instinct = sum of EC from 3 scenarios + reasoning adjustments  (max ~5)
```

### Consistency Modifier (3 responses)
- All 3 identical letters: -1 from highest dimension
- All 3 different letters: +1 to Frame Recognition
- 2 identical + 1 different: no modifier

### Taste Signature Rules (first match wins)
1. **Sophistication:** FR ≥ 4 AND all dimensions ≥ 2
2. **Caution:** EC > KD AND EC > FR AND FR ≤ 2
3. **Momentum:** Total ≤ 4 OR FR = 0
4. **Pragmatism:** All between 1-4 (default)

---

## Output Specification

### Verdict: Green / Amber / Red

**Calculation:** Equal-weighted average of Layer 1-4 scores, modified by Taste.

```
Foundation weight:     0.25
Architecture weight:   0.25
Accountability weight: 0.25
Culture weight:        0.25

Layer scores normalized to 0-100 scale.

Composite = weighted average of all 4 layers

Taste modifier:
- Sophistication/Pragmatism: no penalty
- Caution: -5
- Momentum: -15
```

**Verdict thresholds:**
- **Green (≥70):** Ready to deploy. Binding constraint identified. Action plan focuses on optimization.
- **Amber (40-69):** Conditionally ready. Can begin scoped initiatives while fixing the binding constraint.
- **Red (<40):** Not ready. Deploying now will produce expensive failure. Action plan focuses entirely on the binding constraint.

### Binding Constraint Identification
The layer with the lowest score is the binding constraint. Named explicitly in results and brief.

### Executive Brief
Two delivery paths, one email:

**On-page streaming:** Claude Opus 4.6 streams the brief directly on the results page for users who stay. Client-side Opus call via api-proxy chat handler.

**Email delivery:** Standalone Cloudflare Scheduled Worker (scheduled-brief-worker) runs every 1 minute. Picks up records where brief_email_status = 'pending', generates brief via Opus (non-streaming, max_tokens 4096), builds email via buildBriefEmail(), sends via Resend. Updates brief_email_status to 'sent' on success or 'failed:<error>' on failure. Fully decoupled from browser — user can close tab immediately.

The brief system prompt is conditioned by:
- **Industry (P3):** 5 distinct conditioning blocks with industry-specific action language
- **Company Size (P7):** 5 distinct conditioning blocks calibrating action specificity
- **All answer choices** with industry-specific option text
- **Taste dimensional profile** and signature
- **Assessment depth** (which layers were deep vs. shallow)
- **CU2 analysis** results if available
- **Taste reasoning** responses and free-text

Prompt source of truth: functions/lib/brief-prompts.js. Also duplicated in js/assessment-ui.js (client streaming) and workers/scheduled-brief/index.js (cron Worker) with sync comments.

Brief is gated behind capture form (name, email, company, role). Rate limiting currently disabled.

**Deterministic fallback:** If Opus fails on-page, results display without brief. If Opus fails in cron Worker, brief_email_status is set to 'failed' with error message. Assessment always completes.

---

## API Integration

### Where API is Used
1. **CU2 free-text analysis** — Sonnet analyzes failure descriptions for specificity/accountability/learning → Culture score bonus
2. **Taste reasoning free-text** — Sonnet analyzes "Tell us more" responses for dimensional adjustments
3. **Executive brief generation** — Opus 4.6 streams personalized narrative conditioned by all assessment data

### Cloudflare Worker Proxy
All API calls route through `/functions/api-proxy.js` — a thin router that delegates to modular handlers:
- `handlers/ai-proxy.js` — Sonnet/Opus streaming
- `handlers/email.js` — generate-and-email-brief (thin: stores payload, sets pending), send-brief-email
- `handlers/assessment.js` — submit-assessment POST + PATCH
- `handlers/feedback.js` — submit_feedback
- `middleware/rate-limit.js` — brief_ip_counter logic (currently disabled)
- `middleware/responses.js` — standardized response helpers

API key stored as Cloudflare Worker environment variable. Never exposed to client.

### Models
- **Claude Sonnet 4** (`claude-sonnet-4-20250514`): CU2 analysis + Taste reasoning follow-ups
- **Claude Opus 4.6**: Executive brief streaming

### Deterministic Fallback
Every API-powered feature has a deterministic fallback. If Sonnet fails, reasoning scores use only deterministic option selections. If Opus fails, results display without brief. The assessment always completes.

---

## D1 Schema

See D1_Schema_Reference.md for complete table definitions with all column names and types.

Key tables: assessment_results (26 columns), brief_ip_counter, email_log, assessment_feedback, webhook_registrations, signal_log, agent_drafts, agent_runs, rate_limits, intent_signals.

CRITICAL: Table is brief_ip_counter NOT brief_counter. Column is ip_date NOT date. Column is timestamp NOT created_at. There is NO brief_generated column. There is NO contact_info JSON column — name, email, company, role are top-level columns. All D1 queries must use exact names from D1_Schema_Reference.md.

---

*Document version: 3.0*
*Last updated: April 2, 2026*
*Author: Nick Jewell*
