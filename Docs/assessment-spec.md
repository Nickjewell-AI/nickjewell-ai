# Assessment Engine Specification
## The Jewell Assessment — Technical Spec

---

## Assessment Flow Architecture

### Overview
Three-tier adaptive assessment. Each tier increases depth based on user context. Total experience: 5-12 minutes depending on depth of knowledge.

```
TIER 1: THE PULSE (everyone, ~2 min)
  ↓ context determines branching
TIER 2: THE DIAGNOSTIC (adaptive, ~5 min)
  ↓ gaps determine deep dives
TIER 3: THE TASTE TEST (scenario-based, ~3 min)
  ↓
OUTPUT: Verdict + Profile + Diagnosis + Actions
```

---

## Tier 1: The Pulse

### Purpose
Context-setting. NOT scored. Determines which Layer 2 branches matter and calibrates question depth to the user's organizational knowledge level.

### Questions

**P1: Role Context**
"What best describes your role in AI decisions at your organization?"
- A) I'm leading AI strategy (C-suite, VP, Director)
- B) I'm evaluating whether we should adopt AI
- C) I'm implementing AI projects (technical/project lead)
- D) I'm trying to understand where we stand

*Routing logic:*
- A/B → emphasize Layers 3-5 (they likely know foundation; test judgment)
- C → emphasize Layers 1-2 (they're in the weeds; test infrastructure)
- D → balanced across all layers, simpler language

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

**P3: Industry**
"What industry are you in?"
Free text or dropdown. Used for contextualizing examples in output, not for scoring.

**P4: Biggest Concern**
"What's your biggest worry about AI implementation right now?"
- A) We don't have the right data or infrastructure
- B) Our processes aren't ready for AI
- C) Nobody owns AI outcomes — accountability is unclear
- D) Our people aren't ready or willing to change
- E) We're not sure we're choosing the right AI initiatives

*Routing logic:* Direct mapping to Layers 1-5. User's self-identified concern gets ADDITIONAL probing (they may be right or wrong about where the problem actually is — the assessment validates or redirects).

**P5: Knowledge Depth Check**
"If I asked you to describe your organization's data infrastructure in detail, could you?"
- A) Yes — I know our systems, data flows, and gaps well
- B) Mostly — I know the high level but not all the details
- C) Not really — I'd need to ask other people
- D) No — that's not my area

*Routing logic:*
- A → Full technical depth questions
- B → Moderate depth, some "do you know if..." framing
- C/D → Higher-level judgment questions, "I don't know" treated as valid signal

---

## Tier 2: The Diagnostic

### Adaptive Branching
Based on Tier 1 responses, the user gets 2-3 of the following layer modules (not all 5). Each module has 3-5 questions. Questions adapt based on knowledge depth from P5.

### Layer 1: Foundation Module

**F1: Data Accessibility**
*High-depth version:* "If an AI system needed to pull your last 12 months of customer interactions right now, what would it find?"
- A) Clean, structured data in one system with API access
- B) Data across 2-3 systems, mostly structured, some manual joining needed
- C) Data scattered across many systems, formats vary, significant gaps
- D) I honestly don't know what it would find

*Scoring:* A=4, B=3, C=1, D=0 (but D triggers: "That uncertainty is itself a finding. In our experience, organizations that can't answer this question discover significant data gaps once they try.")

*Low-depth version:* "How would you describe your organization's data situation?"
- A) Our data is well-organized and easy to access
- B) We have data but it takes effort to pull it together
- C) Data is scattered and messy
- D) I don't have visibility into our data

**F2: Governance Reality**
"Does your organization have a data governance policy?"
- A) Yes, and it's actively enforced with designated owners
- B) Yes, it exists as a document but I'm not sure how it's enforced
- C) We're working on one
- D) No / I don't know

*Scoring:* A=4, B=1 (governance docs without enforcement score almost as low as no governance), C=2, D=0

*Follow-up if B:* "Can you name the person who enforces it?" (If no → confirms performative governance)

**F3: Data Quality Pain**
"Has data quality ever blocked or significantly slowed an AI or analytics project?"
- A) Yes, and we fixed the root cause
- B) Yes, and it's still a problem
- C) Not that I know of — but we haven't tried much yet
- D) No, our data is solid

*Scoring:* A=4 (they've felt the pain AND responded), B=2, C=1 (untested ≠ good), D=3 (possible, but skepticism flag if other Foundation scores are low)

### Layer 2: Architecture Module

**A1: Process Mapping**
"Could you draw your most critical business workflow end-to-end on a whiteboard right now — including every handoff between teams and systems?"
- A) Yes, it's well-documented and current
- B) Mostly — I know the main flow but there are handoffs I'd have to investigate
- C) It would be rough — a lot happens informally or through workarounds
- D) No — our processes are complex and not well-documented

*Scoring:* A=4, B=3, C=1, D=0

**A2: The Redesign Question**
"When was the last time a major business process was fundamentally redesigned (not just patched or updated)?"
- A) Within the last year
- B) 1-3 years ago
- C) Longer ago / never
- D) I don't know

*Scoring:* A=4, B=3, C=1, D=0

**A3: The Kevin Test**
"Are there any critical data flows or processes that depend on a specific person running something manually (a script, an export, a report)?"
- A) No — our critical flows are fully automated and documented
- B) Maybe one or two — but they're not mission-critical
- C) Yes — more than I'd like to admit
- D) I'm not sure

*Scoring:* A=4, B=3, C=1, D=0

*Follow-up if C:* "What happens when that person is on vacation?" (Reveals single-point-of-failure awareness)

### Layer 3: Accountability Module

**AC1: Named Owner**
"If your AI system produced a bad outcome at 2am on a Saturday, who specifically gets called?"
- A) A specific named individual with authority to act
- B) An on-call rotation with clear escalation paths
- C) It would depend / I'd have to figure out who to call
- D) Our AI governance committee would handle it at the next meeting

*Scoring:* A=4, B=4, C=1, D=0 (committee answer is the strongest negative signal in the entire assessment)

**AC2: Kill History**
"Has your organization ever killed an AI or technology project mid-flight because it wasn't working?"
- A) Yes — and the person who made that call was supported
- B) Yes — but it was politically difficult
- C) No — projects generally run until budget is exhausted
- D) Not that I'm aware of

*Scoring:* A=4, B=2 (they did it but the culture punished it), C=0, D=0

**AC3: Pre-Defined Failure Criteria**
"Before launching an AI initiative, do you define specific conditions under which you'd pause or stop it?"
- A) Yes — documented failure criteria before every launch
- B) Informally — we'd know it if we saw it
- C) No — we evaluate as we go
- D) I don't think so

*Scoring:* A=4, B=2, C=1, D=0

### Layer 4: Culture Module

**CU1: Workflow Redesign**
"Has any job role or daily workflow at your organization been fundamentally changed because of AI (not just 'now you also have this AI tool')?"
- A) Yes — roles have been redefined, not just augmented
- B) We've added AI tools but the work itself hasn't changed much
- C) We're planning to but haven't yet
- D) No

*Scoring:* A=4, B=1 (this is the "training without transformation" signal), C=2, D=0

**CU2: Honest Failure**
"Can you describe an AI initiative at your organization that didn't work, and what you learned from it?"
- A) [Open-ended response] → scored by API for specificity and learning
- B) "Everything we've tried has worked well" → negative signal
- C) "We haven't tried enough to fail yet" → neutral

*Scoring:* Substantive failure story with learning = 4. "Everything works" = 0 (strongest culture red flag — either lying or not measuring). "Haven't tried" = 2.

*API-powered analysis:* If conversational mode is active, Claude analyzes the open-ended response for: specificity (vague vs. detailed), accountability (blame others vs. own it), learning (extracted insight vs. just described what happened).

**CU3: Safety to Dissent**
"If someone in a meeting said 'I don't think we're ready for this AI initiative,' what would happen?"
- A) They'd be taken seriously and asked to explain their concerns
- B) It would depend on their seniority
- C) It would slow things down and probably be unwelcome
- D) That wouldn't happen — there's too much momentum behind AI

*Scoring:* A=4, B=2, C=1, D=0

---

## Tier 3: The Taste Test

### Purpose
Reveal strategic judgment through scenario-based choices. NOT self-reported. The user's pattern across 3-4 scenarios generates a Taste Signature.

### Scenario Presentation
Each scenario is presented as a situation + 4 options. The user chooses, then is asked "Why?" in conversational follow-up (API-powered). The combination of choice + reasoning determines the score.

### Scenarios

**T1: The Pilot Dilemma**
"Your AI pilot shows 78% accuracy on a task that humans do at 85%. What's your move?"
- A) Kill it — it underperforms humans.
- B) Launch it alongside humans as an assist tool.
- C) Investigate what the 22% failure cases have in common.
- D) Redefine the success metric — maybe accuracy isn't what matters.

*Taste scoring:*
- A = 1 (premature, binary thinking)
- B = 2 (safe but incurious)
- C = 3 (analytical depth, pattern recognition)
- D = 4 (strategic sophistication, questions the frame)

**T2: The Shiny Object Test**
"Your CEO returns from a conference excited about deploying an LLM for internal knowledge management. Your knowledge base is 60% outdated Confluence pages, SharePoint files, and tribal knowledge. First move?"
- A) Start evaluating LLM vendors
- B) Audit and clean the knowledge base content first
- C) Run a pilot with a small team using the messy data
- D) Ask the CEO what specific problem they're trying to solve

*Taste scoring:*
- A = 0 (hype-driven, no diagnostic thinking)
- B = 2 (disciplined but assumes the solution)
- C = 3 (tests assumptions, empirical)
- D = 4 (reframes entirely, first-principles)

**T3: The Kill Decision**
"18 months and $400K in. Mixed results. Passionate team. Invested executive sponsor. Growing usage but unclear ROI. Your call?"
- A) Give it 6 more months with a clearer ROI framework
- B) Pivot to a related but more measurable use case
- C) Kill it and reallocate the budget
- D) Commission an independent review before deciding

*Taste scoring:*
- A = 1 (sunk cost avoidance disguised as patience)
- B = 3 (creative, pragmatic)
- C = 3 (courage, decisiveness)
- D = 4 (governance maturity, seeks objectivity)

**T4: The Agent Question**
"Your team proposes an AI agent that autonomously processes customer refunds up to $500. 96% accurate in testing. What's your primary concern?"
- A) The 4% error rate on financial transactions
- B) Customer reaction to knowing AI handled their refund
- C) What the agent does when it encounters a case it wasn't trained on
- D) Whether the current refund process should exist at all

*Taste scoring:*
- A = 2 (risk management — important but table stakes)
- B = 2 (brand awareness — valid but surface-level)
- C = 3 (edge-case thinking — implementation maturity hallmark)
- D = 4 (first-principles — questions the entire frame)

### Taste Signature Calculation
Sum of Taste scores across scenarios → maps to signature:

- **12-16: Sophistication** — Defaults to reframing, first-principles thinking, second-order effects. Strength: sees what others miss. Risk: over-analysis, slow to ship.
- **8-11: Pragmatism** — Balances analysis with action. Tests assumptions empirically. Strength: gets things done well. Risk: may miss systemic issues.
- **4-7: Caution** — Defaults to safety, risk management, proven approaches. Strength: avoids catastrophic failure. Risk: misses high-leverage opportunities, slow adoption.
- **0-3: Momentum** — Defaults to speed, hype, or inertia. Strength: fast execution when direction is right. Risk: expensive failures, automating the mess, hype-driven decisions.

---

## Output Specification

### Verdict: Green / Amber / Red

**Calculation:** Weighted average of Layer 1-4 scores, modified by Taste.

```
Foundation weight:     0.25
Architecture weight:   0.25
Accountability weight: 0.25
Culture weight:        0.25

Layer scores normalized to 0-100 scale.

Composite = weighted average of assessed layers
(Unassessed layers get industry-average estimate with uncertainty flag)

Taste acts as modifier:
- Sophistication/Pragmatism: no penalty
- Caution: -5 (conservative orgs underestimate their readiness)
- Momentum: -15 (hype-driven orgs overestimate their readiness)
```

**Verdict thresholds:**
- **Green (≥70):** Ready to deploy. Binding constraint identified. 90-day action plan focuses on optimization.
- **Amber (40-69):** Conditionally ready. Can begin scoped initiatives while fixing the binding constraint. 90-day plan sequences what to start vs. what to fix first.
- **Red (<40):** Not ready. Deploying now will produce expensive failure. 90-day plan focuses entirely on the binding constraint. Framing: "You just saved $200K+ by learning this now."

### Binding Constraint Identification
The layer with the lowest score is the binding constraint. Output names it explicitly:

"Your binding constraint is **Accountability**. Your Foundation and Architecture scores suggest you have the technical capability to deploy AI, but without clear human ownership of AI outcomes, your implementations will fail at the organizational level, not the technical level."

### Three Prioritized Actions
Generated based on binding constraint + specific question responses. Each action is:
- Specific (not "improve data quality" but "assign a data owner for your customer interaction data and establish a weekly quality check")
- Sequenced (do this first, then this, then this)
- Timeboxed (achievable in 90 days)

### Executive Brief Format
One-page shareable output:
```
THE JEWELL ASSESSMENT — EXECUTIVE BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERDICT: [GREEN/AMBER/RED]
[One-sentence summary of overall readiness]

LAYER PROFILE:
Foundation:     ████████░░ 78/100
Architecture:   ██████░░░░ 55/100
Accountability: ███░░░░░░░ 28/100  ← BINDING CONSTRAINT
Culture:        ██████░░░░ 62/100

TASTE SIGNATURE: [Sophistication/Pragmatism/Caution/Momentum]
[One-sentence characterization]

BINDING CONSTRAINT: ACCOUNTABILITY
[2-3 sentences explaining why this layer is the bottleneck
and what failure mode it creates]

90-DAY PRIORITIES:
1. [Specific action targeting binding constraint]
2. [Specific action targeting binding constraint]
3. [Specific action targeting second-weakest layer]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
nickjewell.ai | The Jewell Assessment
```

---

## API Integration Spec (Milestone 3)

### Where API is Used
1. **Adaptive follow-up questions** — When user gives open-ended response, Claude generates contextual follow-up
2. **Open-ended response analysis** — Scores specificity, accountability, learning depth in Culture module
3. **Taste reasoning analysis** — Analyzes "why" responses for depth of thinking
4. **Executive brief generation** — Personalized narrative based on all assessment data

### System Prompt for Assessment API
```
You are the assessment engine behind the Jewell Assessment, an AI implementation
readiness diagnostic. You are evaluating the user's organizational readiness across
five layers: Foundation, Architecture, Accountability, Culture, and Taste.

Your role is to:
1. Ask adaptive follow-up questions based on the user's responses
2. Analyze open-ended responses for specificity, depth, and honesty signals
3. Flag when "I don't know" answers are diagnostic (they usually are)
4. Generate a conversational but incisive assessment experience
5. Never be judgmental — be diagnostic. Your tone is "trusted consultant"

Key principles:
- "I don't know" is the most valuable answer. Treat it as a finding, not a gap.
- Specificity in answers correlates with organizational maturity. Vague answers are a signal.
- The assessment should feel like talking to a sharp consultant, not filling out a form.
- Never reveal the scoring rubric or framework mechanics during the assessment.
```

### API Call Pattern
```javascript
// Each assessment interaction is a single API call
// Full conversation history sent each time for context
const response = await fetch('/functions/api-proxy', {
  method: 'POST',
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: ASSESSMENT_SYSTEM_PROMPT,
    messages: conversationHistory
  })
});
```

### Cloudflare Worker Proxy
```javascript
// functions/api-proxy.js
// Adds API key server-side, rate limits, validates requests
// API key stored as Cloudflare Worker environment variable
// Never exposed to client
```
