# TASTE — Proprietary Scoring Methodology
## The Jewell Assessment · Layer 5 IP Documentation
### Version 1.0 · March 2026 · Nick Jewell

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

**Maximum score:** 8 points across four scenarios

### Dimension 2: Kill Discipline
**Definition:** The ability to stop something that isn't working, even when the organization has invested time, money, political capital, and emotional energy into it.

**What it looks like in practice:**
- An 18-month, $400K AI project has mixed results — Kill Discipline pulls the plug
- A vendor relationship isn't delivering — Kill Discipline terminates it before renewal
- A pilot is technically working but strategically wrong — Kill Discipline redirects resources

**Why it's rare:** Sunk cost psychology is the strongest force in organizational decision-making. Killing a project means admitting it was wrong to start, which means someone was wrong, which means someone's reputation is at risk. Most organizations run failing projects until budget exhaustion rather than making a deliberate kill decision.

**Maximum score:** 6 points across four scenarios

### Dimension 3: Edge-Case Instinct
**Definition:** The instinct to think about what happens when things go wrong, not just when they go right. The habit of asking "what happens at the edges?" before optimizing for the center.

**What it looks like in practice:**
- AI customer service handles 80% of queries — Edge-Case Instinct asks "what happens to the agents who now handle ONLY the hardest 20%?"
- An AI agent is 96% accurate — Edge-Case Instinct asks "what does it do with the cases it wasn't trained on?"
- A pilot succeeds — Edge-Case Instinct asks "what breaks when we scale this 10x?"

**Why it's rare:** Optimism bias dominates AI strategy. Pitches focus on the 95% case. Budgets are built around the success scenario. The person who asks "what could go wrong?" is perceived as negative. But that person is the one who prevents the catastrophic failure that occurs 6-12 months into deployment.

**Maximum score:** 8 points across four scenarios

---

## The Four Scenarios

### Scenario T1: The Pilot Dilemma
**Setup:** "Your AI pilot shows 78% accuracy on a task that humans do at 85%. What's your move?"

| Option | Text | Frame Recognition | Kill Discipline | Edge-Case Instinct |
|--------|------|:-:|:-:|:-:|
| A | Kill it — it underperforms humans | 0 | 1 | 0 |
| B | Launch it alongside humans as an assist tool | 0 | 0 | 1 |
| C | Investigate what the 22% failure cases have in common | 0 | 0 | 2 |
| D | Redefine the success metric — maybe accuracy isn't what matters | 2 | 0 | 0 |

**What each answer reveals:**
- **A (Kill):** Binary thinking. Treats AI as pass/fail against human performance. Misses that 78% accuracy on a specific subset might be transformative. Shows Kill Discipline instinct but applied prematurely.
- **B (Launch alongside):** Safe, pragmatic, low-risk. Shows some Edge-Case awareness (humans as fallback) but no deeper investigation. This is the "middle manager" answer.
- **C (Investigate failures):** Analytical depth. Wants to understand the pattern before deciding. The 22% might cluster in one category — fix that and accuracy jumps to 95%. This is the strongest analytical signal.
- **D (Redefine metric):** Strategic sophistication. Questions the entire frame. Maybe accuracy isn't what matters — maybe speed, consistency, or cost is the real metric. This is the rarest and most valuable instinct.

### Scenario T2: The Shiny Object Test
**Setup:** "Your CEO returns from a conference excited about deploying an LLM for internal knowledge management. Your knowledge base is 60% outdated Confluence pages, SharePoint files, and tribal knowledge. First move?"

| Option | Text | Frame Recognition | Kill Discipline | Edge-Case Instinct |
|--------|------|:-:|:-:|:-:|
| A | Start evaluating LLM vendors | 0 | 0 | 0 |
| B | Audit and clean the knowledge base content first | 0 | 1 | 0 |
| C | Run a pilot with a small team using the messy data | 1 | 0 | 2 |
| D | Ask the CEO what specific problem they're trying to solve | 2 | 1 | 0 |

**What each answer reveals:**
- **A (Evaluate vendors):** Pure hype response. The CEO said "LLM" so they start shopping. Doesn't question the premise, the data, or the problem. This is the strongest negative signal in the assessment — it reveals someone who takes direction without applying judgment.
- **B (Audit first):** Disciplined. Recognizes the data problem. But assumes the LLM is the right solution — just that the data needs to be ready for it. Kill Discipline shows up as willingness to slow the CEO's timeline.
- **C (Pilot with messy data):** Empirical. Tests whether messy data is actually a blocker or an assumption. Shows Edge-Case instinct — willing to discover problems rather than assume them. Some Frame Recognition in questioning the "data must be clean first" orthodoxy.
- **D (Ask the CEO):** Reframes entirely. The CEO's excitement about an LLM might be masking a simpler problem with a simpler solution. Maybe the real issue is that onboarding takes too long, and a cleaned-up wiki solves it without AI. This is the highest-judgment answer.

### Scenario T3: The Kill Decision
**Setup:** "18 months and $400K in. Mixed results. Passionate team. Invested executive sponsor. Growing usage but unclear ROI. Your call?"

| Option | Text | Frame Recognition | Kill Discipline | Edge-Case Instinct |
|--------|------|:-:|:-:|:-:|
| A | Give it 6 more months with a clearer ROI framework | 0 | 0 | 0 |
| B | Pivot to a related but more measurable use case | 1 | 1 | 0 |
| C | Kill it and reallocate the budget | 0 | 2 | 0 |
| D | Commission an independent review before deciding | 2 | 1 | 1 |

**What each answer reveals:**
- **A (More time):** Sunk cost avoidance disguised as patience. "Clearer ROI framework" means the current one isn't working, but instead of acting on that signal, the response is to build a new measurement system. This is how projects run until budget exhaustion.
- **B (Pivot):** Creative pragmatism. Salvages the investment by redirecting it. Shows some Kill Discipline (willing to abandon the original vision) and Frame Recognition (the problem might be the use case, not the technology).
- **C (Kill):** Courage. Rare in organizations. Most people won't make this call because of the political cost. The person who picks this either has genuine Kill Discipline or is new enough to not be politically entangled.
- **D (Independent review):** Governance maturity. Seeks objectivity before making an irreversible decision. Shows Frame Recognition (acknowledges their own proximity bias), Kill Discipline (willing to accept a recommendation to kill), and Edge-Case awareness (the review might surface issues they can't see).

### Scenario T4: The Agent Question
**Setup:** "Your team proposes an AI agent that autonomously processes customer refunds up to $500. 96% accurate in testing. What's your primary concern?"

| Option | Text | Frame Recognition | Kill Discipline | Edge-Case Instinct |
|--------|------|:-:|:-:|:-:|
| A | The 4% error rate on financial transactions | 0 | 1 | 1 |
| B | Customer reaction to knowing AI handled their refund | 0 | 0 | 1 |
| C | What the agent does when it encounters a case it wasn't trained on | 0 | 0 | 2 |
| D | Whether the current refund process should exist at all | 2 | 1 | 0 |

**What each answer reveals:**
- **A (Error rate):** Risk management. Important but table stakes — any competent leader should worry about this. Shows some Kill Discipline (willing to stop over 4% errors) and Edge-Case awareness (financial impact of errors). But it's the expected answer, not the insightful one.
- **B (Customer reaction):** Brand awareness. Valid but surface-level. Focuses on perception rather than substance. An organization that worries about what customers think of AI before worrying about what AI actually does has its priorities inverted.
- **C (Unfamiliar cases):** Edge-Case mastery. The 96% accuracy was measured on test data. What happens with a case the model has never seen? Does it hallucinate a response? Does it escalate? Does it process a $500 refund based on guesswork? This is the implementation maturity hallmark.
- **D (Process existence):** First-principles thinking. Maybe the refund process generates so many requests because the product or policy is broken. Automating refunds faster might be solving a symptom while ignoring the disease. This is the highest-leverage question.

---

## Signature Determination

### Step 1: Calculate Dimensional Scores
Sum each dimension across all four scenarios:
```
Frame Recognition  = sum of FR scores from T1 + T2 + T3 + T4  (max 8)
Kill Discipline    = sum of KD scores from T1 + T2 + T3 + T4  (max 6)
Edge-Case Instinct = sum of EC scores from T1 + T2 + T3 + T4  (max 8)
```

### Step 2: Apply Consistency Modifier
Examine the pattern of letter choices across T1-T4:
- **4 identical letters (e.g., all D's):** Subtract 2 from the highest dimension. This indicates pattern-matching the "smart" answer rather than genuine situational judgment. Real taste adapts to context.
- **4 different letters (one of each):** Add 1 to Frame Recognition. This indicates contextual thinking — different situations genuinely warrant different approaches.
- **3 identical letters:** Flag in characterization text but no score modifier. "You showed a consistent preference for [pattern] — worth examining whether that instinct serves you across different contexts."

### Step 3: Determine Signature
Apply rules in this order (first match wins):

1. **Sophistication:** Frame Recognition ≥ 5 AND no single dimension below 2
   - *Profile:* Sees what others miss AND has the judgment to act on it across multiple dimensions
   - *Strength:* Systemic thinking, first-principles reasoning, reframes before optimizing
   - *Risk:* Over-analysis. May slow down decisions that should be straightforward.

2. **Caution:** Edge-Case Instinct is the highest dimension AND Frame Recognition ≤ 3
   - *Profile:* Sees risk everywhere, protects against catastrophic failure, thinks about what breaks
   - *Strength:* Prevents the expensive failures most organizations discover too late
   - *Risk:* May avoid high-leverage opportunities. "What could go wrong" becomes "let's not try."

3. **Momentum:** Total across all three dimensions ≤ 6 OR Frame Recognition = 0
   - *Profile:* Defaults to speed, action, or the most obvious interpretation
   - *Strength:* Fast execution when direction is right. Gets things moving.
   - *Risk:* Expensive course corrections when direction is wrong. Automates the mess.

4. **Pragmatism:** (Default if no other signature matches)
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

### All Low (total ≤ 6):
"Your instinct is toward action over analysis. That creates velocity when direction is right and expensive course corrections when it isn't. The highest-leverage investment you can make is pausing one beat longer at each decision point."

### Consistency Modifiers in Characterization:

**All same letter detected (after score adjustment):**
Append: "A note: you selected the same approach across all four scenarios. Real strategic judgment adapts to context — a framework that works in one situation may not work in another. Consider whether you're applying a pattern rather than reading the situation."

**All different letters detected (after score adjustment):**
Append: "Notably, you adapted your approach across all four scenarios rather than applying a single framework. That contextual flexibility is itself a form of sophistication."

---

## Visual Display

### In Results Page:
```
TASTE SIGNATURE
─────────────────────────────────

  Sophistication                    12/22

  [General description paragraph]

  [Personalized characterization sentence in italic]

  DIMENSIONS
  Frame Recognition    ████████░░  6/8
  Kill Discipline      ████░░░░░░  3/6
  Edge-Case Instinct   ███░░░░░░░  3/8
```

The dimension bars give the user a visual "shape" of their judgment. Two people with the same Taste signature will see different dimensional profiles, making the results feel unique and personally diagnostic.

### In Executive Brief (future):
One-line summary: "Taste: Sophistication — high frame recognition with balanced kill discipline and edge-case awareness."

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

Three design features make the Taste dimension resistant to gaming:

1. **No obvious "right" answer.** Unlike Foundation questions where "clean, accessible data" is obviously better than "scattered, messy data," the Taste scenarios present genuine trade-offs. A reasonable person could defend any option. The assessment doesn't reward one option — it reads the PATTERN.

2. **Consistency detection.** Someone who figures out that "D" sounds smartest and picks it four times gets penalized. The pattern of picking the same "smart" answer four times actually reveals less judgment than someone who reads each situation differently.

3. **Multi-dimensional scoring.** Even if someone games toward high Frame Recognition (always pick the reframe), they'll show low Kill Discipline and low Edge-Case Instinct. The dimensional profile exposes the gap. True sophistication requires breadth, not just one strong instinct.

4. **Characterization specificity.** The output sentences reference the specific pattern of choices, making it obvious to the user what was detected. Vague results invite rationalization. Specific results create recognition — "oh, that IS how I think."

---

## Future Enhancements (Milestone 3+)

### "Why?" Follow-Up (API-powered)
After each scenario, the assessment asks "Why did you choose that?" in free text. The Anthropic API analyzes the reasoning for:
- **Depth:** Surface-level justification vs. multi-factor reasoning
- **Self-awareness:** Does the person acknowledge trade-offs or present their choice as obviously correct?
- **Specificity:** Generic reasoning ("it seemed safest") vs. contextual reasoning ("given the 18-month investment and unclear ROI, an independent review prevents both sunk cost bias and premature termination")

This analysis refines the dimensional scores by ±1-2 points per dimension, making the signature even more precise.

### Scenario Expansion
Additional scenarios for specific contexts:
- **The Vendor Lock-In Dilemma** — tests judgment about dependency vs. speed
- **The Data Privacy Trade-Off** — tests judgment about capability vs. risk
- **The Build vs. Buy Decision** — tests judgment about control vs. time-to-market
- **The Scale Trigger** — tests judgment about when to expand from pilot to production

These would be administered adaptively based on industry and maturity stage.

### Organizational Taste (Team Assessment)
When multiple people from the same organization take the assessment, their individual Taste signatures combine into an "Organizational Taste Profile" that reveals:
- Diversity of judgment (all same signature = groupthink risk)
- Dimensional gaps (nobody on the leadership team has Kill Discipline)
- Seniority correlation (do senior leaders have different Taste than implementers?)

---

## Intellectual Property Notice

The Taste framework, including the three-dimensional scoring methodology (Frame Recognition, Kill Discipline, Edge-Case Instinct), the four assessment scenarios with weighted dimensional scoring, the consistency modifier system, the characterization sentence generation logic, and the Taste Signature classification system (Sophistication, Pragmatism, Caution, Momentum) are the proprietary intellectual property of Nick Jewell, first documented March 28, 2026.

This framework is published at nickjewell.ai as a public thought leadership asset. Commercial use, reproduction of the scoring methodology, or integration of the dimensional Taste framework into competing assessment products requires written permission.

---

*Document version: 1.0*
*Last updated: March 28, 2026*
*Author: Nick Jewell*
*Location: nickjewell.ai · github.com/Nickjewell-AI/nickjewell-ai*
