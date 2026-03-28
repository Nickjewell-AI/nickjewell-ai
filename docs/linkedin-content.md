# LinkedIn Content Calendar
## The Jewell Assessment — Thought Leadership Series

---

## Sequencing Strategy
Posts alternate between framework insights (establishes IP) and build journey (establishes technical credibility). Each post is standalone but builds on the last. The series works whether someone sees one post or all eight.

**Publish cadence:** 2 per week. Adjust based on engagement.

---

## Post 1: The Thesis
**Publish:** When framework page is live at nickjewell.ai
**Layer:** Overview / All
**Hook type:** Contrarian claim

**Draft:**

AI implementation doesn't fail because organizations lack capability.

It fails because the people making decisions about AI lack the discernment to deploy it well.

I've been sitting with this idea for months. After years of consulting on AI and automation implementations, I kept seeing the same pattern:

Organizations with excellent data and terrible judgment fail.
Organizations with mediocre data and excellent judgment figure it out.

The difference isn't readiness. It's taste.

Not taste as in aesthetic preference — taste as in the strategic judgment to know:
→ When NOT to deploy AI
→ Which metric actually matters (not which one is easiest to measure)
→ What happens AFTER the AI works

I built a framework around this. Five layers. Foundation at the bottom, Taste at the top. Each builds on the one beneath it.

I'm calling it the Jewell Assessment. The full framework is live — link in comments.

The controversial part: I think the reason 85% of AI projects fail isn't because the technology isn't ready. It's because nobody is measuring the judgment of the people deploying it.

Agree? Disagree? I'd genuinely like to know.

**CTA:** Link to nickjewell.ai/framework

---

## Post 2: Foundation Layer
**Publish:** 3-4 days after Post 1
**Layer:** Layer 1 — Foundation
**Hook type:** Story / pattern recognition

**Draft:**

A mid-market insurance company launched an AI claims processing pilot.

Three months in, they made a discovery that killed the project: 40% of their claims data was trapped in scanned PDFs with no OCR pipeline.

The AI could read the structured database records perfectly. But it was blind to nearly half the actual claims history.

Cost: $200K+ in wasted implementation spend.

The frustrating part? When asked during planning if their data was "ready," the team said yes. Because the data DID exist. It just wasn't accessible.

This is what I call the "we have the data somewhere" failure mode. It's the most common pattern I see in Layer 1 (Foundation) of the Jewell Assessment framework.

The signal to watch for: Can someone describe where their critical business data lives WITHOUT saying "I'd have to check"?

If the answer requires checking, that's not a knowledge gap. That's a finding.

Full framework breakdown: nickjewell.ai/framework

**CTA:** Link to framework, Layer 1 section

---

## Post 3: Architecture Layer
**Publish:** 3-4 days after Post 2
**Layer:** Layer 2 — Architecture
**Hook type:** Counterintuitive insight

**Draft:**

A large bank automated their loan approval workflow with AI.

The existing process had 23 manual handoffs between departments. Six of those handoffs existed because of a regulatory requirement that was repealed in 2019.

Nobody had removed them.

The AI dutifully automated all 23 steps — including the six unnecessary ones.

Result: 40% faster. Still fundamentally wasteful. And now HARDER to change because the waste was embedded in code.

This is the most expensive mistake in enterprise AI: automating the mess.

The AI doesn't know your process is broken. It just runs it faster. Speed without redesign is expensive chaos.

The organizations that get the highest ROI from AI treat implementation as a trigger to redesign workflows FIRST. "If we were building this from scratch, what would it look like?" Then they automate the redesigned version.

This is Layer 2 (Architecture) of the Jewell Assessment. The question isn't whether you have the technology. It's whether your processes DESERVE to be automated.

**CTA:** nickjewell.ai/framework

---

## Post 4: Accountability Layer
**Publish:** 3-4 days after Post 3
**Layer:** Layer 3 — Accountability
**Hook type:** Dramatic scenario

**Draft:**

A retailer's AI pricing engine started recommending prices below cost on high-margin items during a holiday weekend.

The engineering team assumed the business team was monitoring.
The business team assumed engineering had guardrails.
The AI team assumed the pricing team had override authority.

Nobody acted for 72 hours.

Estimated impact: $2M+ in margin erosion.

It wasn't caught by a dashboard, an alert, or a governance process. It was caught by a customer service rep who noticed and escalated through five levels to reach someone who could turn it off.

This is what "everybody owns it, nobody owns it" looks like in practice.

The diagnostic question I use in the Jewell Assessment:

"If your AI system produced a bad outcome at 2am on a Saturday, who specifically gets called?"

If the answer is "our AI governance committee would handle it at the next meeting" — that tells me everything I need to know.

Committees don't pick up the phone at 2am.

**CTA:** nickjewell.ai/framework

---

## Post 5: Taste Layer
**Publish:** 3-4 days after Post 4
**Layer:** Layer 5 — Taste
**Hook type:** Philosophy / big idea

**Draft:**

John Deere didn't try to make AI do everything on a farm.

They picked one problem: identifying weeds and spraying only them — not the entire field.

Result: 77% reduction in herbicide use.

The taste wasn't in the technology. It was in the restraint.

I've been thinking a lot about what separates the 4% of organizations that achieve scaled AI deployment from the 96% that don't.

It's not capability. It's not budget. It's not data quality.

It's judgment. The ability to look at fifteen possible AI use cases and choose the three where AI creates disproportionate leverage — not the three that sound best in a press release.

I call this dimension "Taste" and it's the capstone layer of the Jewell Assessment framework.

Here's what makes it different from everything else in the assessment: you can't self-report taste. Nobody says "my AI judgment is poor." So instead, I test it through scenario-based choices where there's no obviously correct answer.

One example:

Your AI pilot shows 78% accuracy on a task humans do at 85%. What's your move?
A) Kill it — underperforms humans
B) Launch alongside humans as assist
C) Investigate the 22% failure cases
D) Redefine the success metric

Each answer reveals something different. There's no single right answer — but the PATTERN across multiple scenarios reveals whether you default to speed, safety, sophistication, or inertia.

The full Taste framework is at nickjewell.ai/framework

What would you choose? Drop your answer and I'll tell you what it reveals.

**CTA:** Interactive — ask for responses in comments. Link to framework.

---

## Post 6: Build Journey
**Publish:** When interactive assessment is functional
**Layer:** Meta / Build
**Hook type:** Personal narrative + technical credibility

**Draft:**

I built an interactive AI readiness assessment.

Not a survey. A conversational diagnostic powered by the Anthropic API that adapts its questions based on your role, your organization's AI maturity, and the depth of knowledge you bring.

It evaluates five layers of readiness — and the top layer, Taste, reveals your strategic judgment through scenario-based choices rather than self-reporting.

The output isn't a score. It's a constraint diagnosis: which specific layer will kill your next AI initiative if you don't address it, and three specific things to do about it in the next 90 days.

A few things I learned building this:

→ The hardest part wasn't the code. It was deciding what "good judgment" looks like mathematically.
→ "I don't know" is the most diagnostic answer someone can give. Scoring it was non-obvious.
→ Building with Claude Code changed how I think about the boundary between strategy and implementation. The gap is smaller than people think.

Take it free: nickjewell.ai/assessment

I'd love feedback — especially if the Taste scenarios surface real disagreement.

**CTA:** Direct link to assessment

---

## Post 7: Data From Real Usage
**Publish:** After ~50 assessment completions
**Layer:** Insights / All
**Hook type:** Data-driven insight

**Draft:**

[X] people have taken the Jewell Assessment so far.

Here's what I'm seeing:

The most common binding constraint isn't what I expected.

[Insight based on real aggregate data — which layer most organizations score lowest on, what the most common Taste signature is, where the biggest gap between self-perception and assessment results appears]

[2-3 specific patterns with commentary]

The finding that surprised me most: [genuine insight from data]

This is early data and the sample is biased toward people who self-select into AI readiness conversations. But even so, the patterns are striking.

Take the assessment: nickjewell.ai/assessment

**CTA:** Link to assessment

---

## Post 8: The Bigger Picture
**Publish:** After Post 7
**Layer:** Thesis / Career narrative
**Hook type:** Reflective, forward-looking

**Draft:**

A few months ago I decided to stop just recommending AI implementations and start building one.

Not because I wanted to become a developer. Because I wanted to understand the gap between "this is a good idea" and "this is a working system" at the mechanical level.

That gap is where most AI initiatives die. Not in strategy. Not in code. In the translation between them.

The Jewell Assessment is the result — a framework and an interactive tool that diagnoses where organizations are actually stuck, including a dimension (Taste) that nobody else measures.

Building it taught me something I couldn't have learned from consulting alone: the people who make AI work aren't pure strategists or pure engineers. They're translators. They speak both languages.

That's the role I'm building toward. If your organization is navigating AI implementation and could use someone who builds AND thinks — let's talk.

**CTA:** Open for conversations. DM or email.

---

## Content Rules
- No hashtag spam. Maximum 3 relevant hashtags, placed at the very end.
- No emoji in body text. Clean, editorial tone.
- Every post is standalone — someone should get value even if they never visit the site.
- Always end with a genuine invitation for engagement, not a demand.
- Link goes in first comment (LinkedIn algorithm penalizes links in post body).
