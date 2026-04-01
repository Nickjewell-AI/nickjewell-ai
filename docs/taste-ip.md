# TASTE — Proprietary Scoring Methodology
## The Jewell Assessment · Layer 5 IP Documentation
### Version 2.0 · April 2026 · Nick Jewell

---

## What Taste Is

Taste is the capstone layer of the Jewell Assessment framework. It measures strategic judgment — the ability to distinguish between a good AI decision and a merely popular one. It's the discernment to know when NOT to deploy AI. It's pattern recognition for implementation quality.

**Taste is not self-reportable.** Nobody says "my AI judgment is poor." So instead of asking, Taste is revealed through scenario-based choices where there's no obviously correct answer. The pattern across multiple scenarios generates a multi-dimensional profile of how someone makes decisions under uncertainty.

**The thesis:** Every organization has leaders who can evaluate a spreadsheet. Far fewer have leaders who can evaluate a decision. Taste is the difference between "this AI initiative has good metrics" and "this AI initiative is solving the right problem in the right way at the right time."

**Why it matters:** The 4% of organizations that achieve scaled AI deployment aren't separated from the 96% by capability, budget, or data quality. They're separated by the judgment of the people making deployment decisions. Taste is the only known framework that measures this.

---

## The Three Dimensions of Taste

Taste is not a single score. It is a three-dimensional profile that reveals HOW someone makes strategic decisions about AI. The three dimensions are:

### Dimension 1: Frame Recognition
**Definition:** The ability to see when the question itself is wrong. Instead of optimizing within a given frame, recognizing that the frame needs to change.

**What it looks like in practice:**
- A CEO says "we need an AI chatbot" — Frame Recognition asks "what problem are we actually solving?"
- A pilot shows 78% accuracy — Frame Recognition asks "is accuracy even the right metric?"
- A team proposes automating a workflow — Frame Recognition asks "should this workflow exist at all?"

**Why it's rare:** Organizations reward people who solve problems, not people who question whether the problem is correctly defined. Frame Recognition is often perceived as obstructionism rather than strategic thinking. The people who have it are frequently the most frustrated members of a leadership team.

**Maximum score:** 6 points across three scenarios (per maturity-routed set)

### Dimension 2: Kill Discipline
**Definition:** The ability to stop something that isn't working, even when the organization has invested time, money, political capital, and emotional energy into it.

**What it looks like in practice:**
- An 18-month, $400K AI project has mixed results — Kill Discipline pulls the plug
- A vendor relationship isn't delivering — Kill Discipline terminates it before renewal
- A pilot is technically working but strategically wrong — Kill Discipline redirects resources

**Why it's rare:** Sunk cost psychology is the strongest force in organizational decision-making. Killing a project means admitting it was wrong to start, which means someone was wrong, which means someone's reputation is at risk. Most organizations run failing projects until budget exhaustion rather than making a deliberate kill decision.

**Maximum score:** 4 points across three scenarios (per maturity-routed set)

### Dimension 3: Edge-Case Instinct
**Definition:** The instinct to think about what happens when things go wrong, not just when they go right. The habit of asking "what happens at the edges?" before optimizing for the center.

**What it looks like in practice:**
- AI customer service handles 80% of queries — Edge-Case Instinct asks "what happens to the agents who now handle ONLY the hardest 20%?"
- An AI agent is 96% accurate — Edge-Case Instinct asks "what does it do with the cases it wasn't trained on?"
- A pilot succeeds — Edge-Case Instinct asks "what breaks when we scale this 10x?"

**Why it's rare:** Optimism bias dominates AI strategy. Pitches focus on the 95% case. Budgets are built around the success scenario. The person who asks "what could go wrong?" is perceived as negative. But that person is the one who prevents the catastrophic failure that occurs 6-12 months into deployment.

**Maximum score:** 5 points across three scenarios (per maturity-routed set)

---

## Maturity-Routed Scenario Sets

Each user sees 3 scenarios from a pool of 9, selected by their P2 (AI Maturity Stage) answer. This ensures scenarios feel contextually relevant to the user's actual journey stage, not randomly assigned.

**All three sets are balanced to identical dimensional ceilings: FR=6, KD=4, EC=5 (total=15).**

### Exploring Set (P2=A: "Haven't started any AI projects")
Scenarios for mid-market leaders facing their first AI decisions.

| Scenario | Name | Context |
|----------|------|---------|
| T5 | The Free Trial Trap | Marketing lead wants $18K tool, trial expires Friday |
| T6 | The Intern's Dashboard | Intern built ChatGPT forecasting, leaves in 2 weeks |
| T7 | The Vendor Demo | $95K contract, 15% error rate nobody caught |

### Scaling Set (P2=B/C: "Piloting" or "Scaling")
Scenarios for growth-stage organizations with existing AI initiatives.

| Scenario | Name | Context |
|----------|------|---------|
| T1 | The Pilot Dilemma | AI pilot at 78% accuracy vs. humans at 85% |
| T2 | The Shiny Object Test | CEO excited about LLM, messy knowledge base |
| T3 | The Kill Decision | 18 months, $400K, unclear ROI |

### Operating Set (P2=D: "AI in production workflows")
Scenarios for enterprise leaders optimizing at scale.

| Scenario | Name | Context |
|----------|------|---------|
| T4 | The Agent Question | Autonomous refund agent, 96% accurate |
| T8 | The Compliance Cliff | Regulatory human review requirement, 35 new hires |
| T9 | The Platform Sunset | 12 models, 18-month deprecation, nobody asked if all should survive |

---

## Dimensional Scoring by Scenario

### Exploring Set

**T5: The Free Trial Trap**
"Your marketing lead wants to commit $18K/year to an AI content tool. They're excited. The free trial expires Friday. They haven't measured their current content workflow. Your call?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Let them buy it — $18K is a rounding error and the team is motivated | 0 | 0 | 0 |
| B | Ask for a 30-day extension to run a proper evaluation | 0 | 1 | 1 |
| C | Have them measure current output first — you can't evaluate a tool without a baseline | 1 | 0 | 1 |
| D | Ask what problem they're actually solving — is the constraint content production or content strategy? | 2 | 0 | 0 |

**T6: The Intern's Dashboard**
"An intern built a forecasting dashboard using ChatGPT and your company's sales data. The VP of Sales loves it. The intern leaves in two weeks. What's your priority?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Get the intern to document everything before they leave | 0 | 0 | 1 |
| B | Kill the dependency — if it can't survive the intern leaving, it's not ready for production | 1 | 2 | 0 |
| C | Have engineering evaluate what was built and whether it's maintainable | 0 | 0 | 2 |
| D | Ask whether the VP's excitement is about the forecasts being accurate or just about having any forecast at all | 2 | 1 | 0 |

**T7: The Vendor Demo**
"A vendor just demoed an AI tool to your leadership team. Everyone's impressed. You notice the demo dataset had a 15% error rate that nobody else caught. The vendor is pushing a $95K annual contract. Your move?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Flag the error rate and pause the deal until they explain it | 0 | 1 | 2 |
| B | Let it proceed — 85% accuracy might be good enough for the use case | 0 | 0 | 0 |
| C | Run your own data through the tool before any commitment | 1 | 0 | 1 |
| D | Ask whether this tool solves a problem you actually have or one the vendor convinced you that you have | 2 | 1 | 0 |

### Scaling Set

**T1: The Pilot Dilemma**
"Your AI pilot shows 78% accuracy on a task that humans do at 85%. What's your move?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Kill it — it underperforms humans | 0 | 1 | 0 |
| B | Launch it alongside humans as an assist tool | 0 | 0 | 1 |
| C | Investigate what the 22% failure cases have in common | 0 | 0 | 2 |
| D | Redefine the success metric — maybe accuracy isn't what matters | 2 | 0 | 0 |

**T2: The Shiny Object Test**
"Your CEO returns from a conference excited about deploying an LLM for internal knowledge management. Your knowledge base is 60% outdated Confluence pages, SharePoint files, and tribal knowledge. First move?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Start evaluating LLM vendors | 0 | 0 | 0 |
| B | Audit and clean the knowledge base content first | 0 | 1 | 0 |
| C | Run a pilot with a small team using the messy data | 1 | 0 | 2 |
| D | Ask the CEO what specific problem they're trying to solve | 2 | 1 | 0 |

**T3: The Kill Decision**
"18 months and $400K in. Mixed results. Passionate team. Invested executive sponsor. Growing usage but unclear ROI. Your call?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Give it 6 more months with a clearer ROI framework | 0 | 0 | 0 |
| B | Pivot to a related but more measurable use case | 1 | 1 | 0 |
| C | Kill it and reallocate the budget | 0 | 2 | 0 |
| D | Commission an independent review before deciding | 2 | 1 | 1 |

### Operating Set

**T4: The Agent Question**
"Your team proposes an AI agent that autonomously processes customer refunds up to $500. 96% accurate in testing. What's your primary concern?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | The 4% error rate on financial transactions | 0 | 1 | 1 |
| B | Customer reaction to knowing AI handled their refund | 0 | 0 | 1 |
| C | What the agent does when it encounters a case it wasn't trained on | 0 | 0 | 2 |
| D | Whether the current refund process should exist at all | 2 | 1 | 0 |

**T8: The Compliance Cliff**
"A new regulation requires human review of every AI-generated decision in your domain. Your AI processes 10,000 decisions/day. Compliance means hiring 35 reviewers or cutting AI volume by 80%. What's your move?"

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Hire the reviewers — compliance isn't optional | 0 | 0 | 1 |
| B | Cut volume to the highest-value 20% and have existing staff review those | 0 | 2 | 1 |
| C | Build a hybrid where AI pre-processes and a smaller team reviews flagged cases only | 1 | 0 | 1 |
| D | Challenge the regulation's definition of 'AI-generated decision' — not all outputs are decisions | 2 | 0 | 0 |

**T9: The Platform Sunset**
"The platform your 12 production AI models run on just announced deprecation in 18 months. Three vendors are pitching migrations. Your CTO wants open-source. Your CFO wants cheapest. Nobody's asked whether all 12 models should survive."

| Option | Text | FR | KD | EC |
|--------|------|:-:|:-:|:-:|
| A | Audit which models actually deliver value — this is the moment to kill the ones that don't | 1 | 2 | 0 |
| B | Go open-source — you're forced to migrate anyway, invest the disruption in long-term flexibility | 0 | 0 | 1 |
| C | Pick the fastest migration — 18 months sounds generous but enterprise migrations always take longer | 0 | 0 | 2 |
| D | Map dependencies first — which customer-facing apps break during migration and in what order? | 1 | 0 | 1 |

---

## Signature Determination

### Step 1: Calculate Dimensional Scores
Sum each dimension across the user's 3 maturity-routed scenarios:
```
Frame Recognition  = sum of FR scores from 3 scenarios  (max 6)
Kill Discipline    = sum of KD scores from 3 scenarios  (max 4)
Edge-Case Instinct = sum of EC scores from 3 scenarios  (max 5)
```

### Step 2: Apply Consistency Modifier
Examine the pattern of letter choices across 3 scenarios:
- **All 3 identical letters (e.g., all D's):** Subtract 1 from the highest dimension. This indicates pattern-matching the "smart" answer rather than genuine situational judgment. Real taste adapts to context.
- **All 3 different letters:** Add 1 to Frame Recognition. This indicates contextual thinking — different situations genuinely warrant different approaches.
- **2 identical + 1 different:** No modifier. Normal variation.

### Step 3: Apply Reasoning Follow-Up Adjustments
After each scenario choice, the user selects a reasoning option. Each reasoning option adjusts dimensions by ±1 (FR, KD, or EC). These are additive to the base choice scores. If the reasoning API fails, only deterministic choice scores are used.

### Step 4: Determine Signature
Apply rules in this order (first match wins):

1. **Sophistication:** Frame Recognition ≥ 4 AND all dimensions ≥ 2
   - *Profile:* Sees what others miss AND has the judgment to act on it across multiple dimensions
   - *Strength:* Systemic thinking, first-principles reasoning, reframes before optimizing
   - *Risk:* Over-analysis. May slow down decisions that should be straightforward.

2. **Caution:** Edge-Case Instinct > Kill Discipline AND Edge-Case Instinct > Frame Recognition AND Frame Recognition ≤ 2
   - *Profile:* Sees risk everywhere, protects against catastrophic failure, thinks about what breaks
   - *Strength:* Prevents the expensive failures most organizations discover too late
   - *Risk:* May avoid high-leverage opportunities. "What could go wrong" becomes "let's not try."

3. **Momentum:** Total across all three dimensions ≤ 4 OR Frame Recognition = 0
   - *Profile:* Defaults to speed, action, or the most obvious interpretation
   - *Strength:* Fast execution when direction is right. Gets things moving.
   - *Risk:* Expensive course corrections when direction is wrong. Automates the mess.

4. **Pragmatism:** All dimensions between 1 and 4 (default if no other signature matches)
   - *Profile:* Balanced across dimensions. Tests assumptions empirically. No extreme spikes or gaps.
   - *Strength:* Gets things done well. Reliable, effective, adaptable.
   - *Risk:* May miss systemic issues by optimizing locally. Balance can become indecision.

### Why This Order Matters
Sophistication requires clear evidence (high FR + no gaps). Caution and Momentum have specific patterns that should be caught before falling through to Pragmatism. Pragmatism is the "none of the above" — genuinely balanced, which is good, but should only be assigned when no stronger signal exists.

---

## Characterization Sentences

The characterization sentence is personalized based on the dimensional profile. It's constructed from the highest-scoring dimension(s):

### Single Highest Dimension:

**Frame Recognition highest:**
"You instinctively question whether the right problem is being solved before optimizing the solution — that's rare and invaluable when organizations are rushing to deploy AI."

**Kill Discipline highest:**
"You have uncommon discipline — the willingness to stop what isn't working even when momentum says continue. Most organizations lack this entirely."

**Edge-Case Instinct highest:**
"Your first instinct is to understand what breaks, not what works. That's the trait that prevents the expensive failures most organizations discover too late."

### Tied Dimensions:

**Frame Recognition + Kill Discipline tied:**
"You combine the rare ability to question whether the problem is right with the discipline to stop what isn't working. That's the profile of someone who prevents wasted investment at the strategic level."

**Frame Recognition + Edge-Case Instinct tied:**
"You see both the systemic issues others miss and the edge cases that break implementations. Your risk is over-analysis — knowing when your instinct has gathered enough signal to act."

**Kill Discipline + Edge-Case Instinct tied:**
"You think about what breaks AND you're willing to pull the plug when it does. That combination is what separates organizations that scale AI from those that accumulate expensive experiments."

### All Roughly Equal (within 1 point of each other):
"Your judgment is balanced across all dimensions — you see frames, risks, and stopping points with equal clarity. The risk is that balance can become indecision when the situation demands a strong lean in one direction."

### All Low (total ≤ 4):
"Your instinct is toward action over analysis. That creates velocity when direction is right and expensive course corrections when it isn't. The highest-leverage investment you can make is pausing one beat longer at each decision point."

### Consistency Modifiers in Characterization:

**All same letter detected (after score adjustment):**
Append: "A note: you selected the same approach across all three scenarios. Real strategic judgment adapts to context — a framework that works in one situation may not work in another. Consider whether you're applying a pattern rather than reading the situation."

**All different letters detected (after score adjustment):**
Append: "Notably, you adapted your approach across all three scenarios rather than applying a single framework. That contextual flexibility is itself a form of sophistication."

---

## Visual Display

### In Results Page:
```
TASTE SIGNATURE
─────────────────────────────────

  Sophistication                    12/15

  [General description paragraph]

  [Personalized characterization sentence in italic]

  DIMENSIONS
  Frame Recognition    ████████░░  5/6
  Kill Discipline      ████░░░░░░  2/4
  Edge-Case Instinct   ████████░░  4/5
```

The dimension bars give the user a visual "shape" of their judgment. Two people with the same Taste signature will see different dimensional profiles, making the results feel unique and personally diagnostic.

### In Executive Brief:
Taste signature and dimensional profile are included in the brief context. Opus generates a personalized narrative that references the user's specific Taste pattern, conditioned by their industry (P3) and company size (P7).

---

## Internal Normalization (Not User-Facing)

Behind the scenes, Taste dimensions are normalized to percentages and stored in D1 (`taste_normalized` column). This enables future cross-user analytics, team assessments, and The Signal series aggregate reporting — without changing the user-facing experience.

The scenario set served is also stored (`scenario_set` column: "exploring", "scaling", or "operating") to enable comparisons within maturity cohorts.

---

## Taste Reasoning Follow-Ups (Live)

After each scenario, the assessment asks a scenario-specific and choice-specific lead-in question with 4 reasoning options. Each reasoning option carries FR/KD/EC modifiers (typically ±1 on one dimension) that refine the dimensional scores.

**Example (T1, chose A "Kill it"):**
Lead-in: "Killing a pilot that underperforms humans — what drove that call?"
- Option R1: "If it can't beat humans, what's the point?" → [FR: 0, KD: 0, EC: 0]
- Option R2: "We need to protect our accuracy standards." → [FR: 0, KD: 0, EC: +1]
- Option R3: "Better to kill early than let a weak pilot become permanent." → [FR: 0, KD: +1, EC: 0]
- Option R4: "The team needs to see that we'll pull the plug when needed." → [FR: +1, KD: 0, EC: 0]

All 9 scenarios × 4 choices = 36 unique lead-ins with 144 reasoning options total. An optional "Tell us more →" free-text field triggers Sonnet API analysis for additional ±1 dimensional adjustments.

**Deterministic fallback:** If the API fails, only the deterministic choice + reasoning option scores are used. Assessment always completes.

---

## The Taste Modifier on Overall Verdict

Taste affects the composite score that determines the Green/Amber/Red verdict:

| Signature | Modifier | Rationale |
|-----------|----------|-----------|
| Sophistication | No modifier | Judgment supports whatever the capability scores indicate |
| Pragmatism | No modifier | Balanced judgment, neutral effect |
| Caution | -5 to composite | Conservative orgs tend to underestimate their own readiness because they over-weight risk |
| Momentum | -15 to composite | Hype-driven orgs overestimate their readiness because they under-weight risk. This is the most dangerous Taste signature — the organization believes it's ready when it isn't. The modifier corrects for this. |

---

## Why Taste Can't Be Gamed

Four design features make the Taste dimension resistant to gaming:

1. **No obvious "right" answer.** Unlike Foundation questions where "clean, accessible data" is obviously better than "scattered, messy data," the Taste scenarios present genuine trade-offs. A reasonable person could defend any option. The assessment doesn't reward one option — it reads the PATTERN.

2. **Consistency detection.** Someone who figures out that "D" sounds smartest and picks it three times gets penalized. The pattern of picking the same "smart" answer three times actually reveals less judgment than someone who reads each situation differently.

3. **Multi-dimensional scoring.** Even if someone games toward high Frame Recognition (always pick the reframe), they'll show low Kill Discipline and low Edge-Case Instinct. The dimensional profile exposes the gap. True sophistication requires breadth, not just one strong instinct.

4. **Characterization specificity.** The output sentences reference the specific pattern of choices, making it obvious to the user what was detected. Vague results invite rationalization. Specific results create recognition — "oh, that IS how I think."

5. **Maturity routing.** Users see scenarios matched to their journey stage, not the full pool. A "gaming" strategy learned from someone at a different maturity stage would encounter completely different scenarios.

---

## Future Enhancements

### Organizational Taste (Team Assessment)
When multiple people from the same organization take the assessment, their individual Taste signatures combine into an "Organizational Taste Profile" that reveals:
- Diversity of judgment (all same signature = groupthink risk)
- Dimensional gaps (nobody on the leadership team has Kill Discipline)
- Seniority correlation (do senior leaders have different Taste than implementers?)

### Longitudinal Taste Tracking
Re-assessment over time reveals whether judgment evolves with experience. The maturity-routed sets make this natural — as an organization moves from Exploring to Scaling to Operating, they see different scenarios that test progressively more advanced judgment.

---

## Intellectual Property Notice

The Taste framework, including the three-dimensional scoring methodology (Frame Recognition, Kill Discipline, Edge-Case Instinct), the nine assessment scenarios with weighted dimensional scoring across three maturity-routed sets, the consistency modifier system, the reasoning follow-up analysis, the characterization sentence generation logic, and the Taste Signature classification system (Sophistication, Pragmatism, Caution, Momentum) are the proprietary intellectual property of Nick Jewell, first documented March 28, 2026.

This framework is published at nickjewell.ai as a public thought leadership asset. Commercial use, reproduction of the scoring methodology, or integration of the dimensional Taste framework into competing assessment products requires written permission.

---

*Document version: 2.0*
*Last updated: April 1, 2026*
*Author: Nick Jewell*
*Location: nickjewell.ai · github.com/Nickjewell-AI/nickjewell-ai*
