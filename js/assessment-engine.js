// assessment-engine.js — Jewell Assessment scoring engine
// Deterministic scoring, no API calls. Pure client-side logic.
(function() {

// ─── Question Banks ───────────────────────────────────────

const TIER1_QUESTIONS = [
  {
    id: 'P1',
    label: 'Role Context',
    text: 'What best describes your role in AI decisions at your organization?',
    options: [
      { key: 'A', text: "I'm leading AI strategy (C-suite, VP, Director)" },
      { key: 'B', text: "I'm evaluating whether we should adopt AI" },
      { key: 'C', text: "I'm implementing AI projects (technical/project lead)" },
      { key: 'D', text: "I'm trying to understand where we stand" },
    ],
  },
  {
    id: 'P2',
    label: 'AI Maturity Stage',
    text: 'Where is your organization on the AI journey?',
    options: [
      { key: 'A', text: "Exploring — haven't started any AI projects yet" },
      { key: 'B', text: 'Piloting — running 1-3 AI experiments or proofs of concept' },
      { key: 'C', text: 'Scaling — trying to move from pilots to production' },
      { key: 'D', text: 'Operating — AI is in production workflows today' },
    ],
  },
  {
    id: 'P3',
    label: 'Industry',
    text: 'What industry are you in?',
    options: [
      { key: 'A', text: 'Financial Services & Insurance' },
      { key: 'B', text: 'Healthcare & Life Sciences' },
      { key: 'C', text: 'Technology & Software' },
      { key: 'D', text: 'Manufacturing & Industrial' },
      { key: 'E', text: 'Retail & Consumer' },
      { key: 'F', text: 'Professional Services & Consulting' },
      { key: 'G', text: 'Government & Public Sector' },
      { key: 'H', text: 'Other' },
    ],
  },
  {
    id: 'P4',
    label: 'Biggest Concern',
    text: "What's your biggest worry about AI implementation right now?",
    options: [
      { key: 'A', text: "We don't have the right data or infrastructure" },
      { key: 'B', text: "Our processes aren't ready for AI" },
      { key: 'C', text: "Nobody owns AI outcomes — accountability is unclear" },
      { key: 'D', text: "Our people aren't ready or willing to change" },
      { key: 'E', text: "We're not sure we're choosing the right AI initiatives" },
    ],
  },
  {
    id: 'P5',
    label: 'Knowledge Depth',
    text: "If I asked you to describe your organization's data infrastructure in detail, could you?",
    options: [
      { key: 'A', text: 'Yes — I know our systems, data flows, and gaps well' },
      { key: 'B', text: "Mostly — I know the high level but not all the details" },
      { key: 'C', text: "Not really — I'd need to ask other people" },
      { key: 'D', text: "No — that's not my area" },
    ],
  },
  {
    id: 'P6',
    label: 'AI Initiative Count',
    text: 'How many active AI or automation initiatives does your organization have right now?',
    options: [
      { key: 'A', text: "None — we're still evaluating" },
      { key: 'B', text: '1-3 pilots or experiments' },
      { key: 'C', text: '4-10 across different teams' },
      { key: 'D', text: '10+ embedded in operations' },
    ],
  },
  {
    id: 'P7',
    label: 'Organization Size',
    text: 'Roughly how many people are in your organization?',
    options: [
      { key: 'A', text: 'Under 50' },
      { key: 'B', text: '50-500' },
      { key: 'C', text: '500-2,000' },
      { key: 'D', text: '2,000-10,000' },
      { key: 'E', text: '10,000+' },
    ],
  },
];

const FOUNDATION_QUESTIONS = [
  {
    id: 'F1',
    layer: 'foundation',
    depth: 'core',
    label: 'Data Accessibility',
    text: 'If an AI system needed to pull your last 12 months of customer interactions right now, what would it find?',
    options: [
      { key: 'A', text: 'Clean, structured data in one system with API access', score: 4 },
      { key: 'B', text: 'Data across 2-3 systems, mostly structured, some manual joining needed', score: 3 },
      { key: 'C', text: 'Data scattered across many systems, formats vary, significant gaps', score: 1 },
      { key: 'D', text: "I honestly don't know what it would find", score: 0 },
    ],
    lowDepthVariant: {
      text: "How would you describe your organization's data situation?",
      options: [
        { key: 'A', text: 'Our data is well-organized and easy to access', score: 4 },
        { key: 'B', text: 'We have data but it takes effort to pull it together', score: 3 },
        { key: 'C', text: 'Data is scattered and messy', score: 1 },
        { key: 'D', text: "I don't have visibility into our data", score: 0 },
      ],
    },
    insightOnD: "That uncertainty is itself a finding. Organizations that can't answer this question typically discover significant data gaps once they try.",
  },
  {
    id: 'F2',
    layer: 'foundation',
    depth: 'full',
    label: 'Governance Reality',
    text: 'Does your organization have a data governance policy?',
    options: [
      { key: 'A', text: "Yes, and it's actively enforced with designated owners", score: 4 },
      { key: 'B', text: "Yes, it exists as a document but I'm not sure how it's enforced", score: 1 },
      { key: 'C', text: "We're working on one", score: 2 },
      { key: 'D', text: "No / I don't know", score: 0 },
    ],
    lowDepthVariant: {
      text: 'As far as you know, does your organization have rules about how data is managed and who owns it?',
      options: [
        { key: 'A', text: 'Yes — clear rules with people responsible for enforcing them', score: 4 },
        { key: 'B', text: "I think there's a policy document somewhere, but I'm not sure it's followed", score: 1 },
        { key: 'C', text: "It's being developed", score: 2 },
        { key: 'D', text: "Not that I know of", score: 0 },
      ],
    },
    insightOnD: "The fact that you don't know whether your organization has a governance policy tells us more than the policy itself. Governance you can't see isn't governance.",
    followUp: {
      triggerKeys: ['A', 'B'],
      text: 'Can you name the person who enforces it?',
      id: 'F2_FU',
      options: [
        { key: 'Y', text: 'Yes — I can name them', effect: 'none' },
        { key: 'N', text: "No, I can't", effect: 'adjustScore', newScore: 0 },
      ],
      insightOnN: "That confirms what we suspected. A governance policy without a named enforcer is a document, not governance.",
    },
  },
  {
    id: 'F3',
    layer: 'foundation',
    depth: 'full',
    label: 'Data Quality Pain',
    text: 'Has data quality ever blocked or significantly slowed an AI or analytics project?',
    options: [
      { key: 'A', text: 'Yes, and we fixed the root cause', score: 4 },
      { key: 'B', text: "Yes, and it's still a problem", score: 2 },
      { key: 'C', text: "Not that I know of — but we haven't tried much yet", score: 1 },
      { key: 'D', text: 'No, our data is solid', score: 3 },
    ],
    lowDepthVariant: {
      text: 'Has bad or missing data ever caused problems for a project or initiative at your organization?',
      options: [
        { key: 'A', text: 'Yes, and we addressed the root cause', score: 4 },
        { key: 'B', text: "Yes, and it's an ongoing issue", score: 2 },
        { key: 'C', text: "I'm not sure — we haven't done much data-heavy work", score: 1 },
        { key: 'D', text: "No, our data is in good shape", score: 3 },
      ],
    },
  },
];

const ARCHITECTURE_QUESTIONS = [
  {
    id: 'A1',
    layer: 'architecture',
    depth: 'core',
    label: 'Process Mapping',
    text: 'Could you draw your most critical business workflow end-to-end on a whiteboard right now — including every handoff between teams and systems?',
    options: [
      { key: 'A', text: "Yes, it's well-documented and current", score: 4 },
      { key: 'B', text: "Mostly — I know the main flow but there are handoffs I'd have to investigate", score: 3 },
      { key: 'C', text: 'It would be rough — a lot happens informally or through workarounds', score: 1 },
      { key: 'D', text: 'No — our processes are complex and not well-documented', score: 0 },
    ],
    lowDepthVariant: {
      text: 'How well do people in your organization understand your key business processes from start to finish?',
      options: [
        { key: 'A', text: "They're well-documented and everyone knows them", score: 4 },
        { key: 'B', text: "People know their own part, but not the full picture", score: 3 },
        { key: 'C', text: "A lot of it is informal — people just know what to do", score: 1 },
        { key: 'D', text: "I don't think anyone has the full picture", score: 0 },
      ],
    },
    insightOnD: "Not being able to map your own workflows is a red flag for AI integration. AI needs to plug into processes — if those processes are invisible, there's nothing to integrate with.",
  },
  {
    id: 'A2',
    layer: 'architecture',
    depth: 'full',
    label: 'The Redesign Question',
    text: 'When was the last time a major business process was fundamentally redesigned (not just patched or updated)?',
    options: [
      { key: 'A', text: 'Within the last year', score: 4 },
      { key: 'B', text: '1-3 years ago', score: 3 },
      { key: 'C', text: 'Longer ago / never', score: 1 },
      { key: 'D', text: "I don't know", score: 0 },
    ],
    lowDepthVariant: {
      text: 'Has your organization recently rethought how a major process works — not just tweaked it, but fundamentally changed it?',
      options: [
        { key: 'A', text: 'Yes, within the last year', score: 4 },
        { key: 'B', text: 'Something changed a few years back', score: 3 },
        { key: 'C', text: "Not that I can remember", score: 1 },
        { key: 'D', text: "I wouldn't know", score: 0 },
      ],
    },
    insightOnD: "Not knowing when processes were last redesigned usually means they haven't been. Legacy processes and AI are a costly combination.",
  },
  {
    id: 'A3',
    layer: 'architecture',
    depth: 'full',
    label: 'The Kevin Test',
    text: 'Are there any critical data flows or processes that depend on a specific person running something manually (a script, an export, a report)?',
    options: [
      { key: 'A', text: 'No — our critical flows are fully automated and documented', score: 4 },
      { key: 'B', text: "Maybe one or two — but they're not mission-critical", score: 3 },
      { key: 'C', text: "Yes — more than I'd like to admit", score: 1 },
      { key: 'D', text: "I'm not sure", score: 0 },
    ],
    lowDepthVariant: {
      text: 'Are there things that only work because one specific person knows how to do them?',
      options: [
        { key: 'A', text: "No — everything important is documented and automated", score: 4 },
        { key: 'B', text: "Maybe a couple of things, but nothing critical", score: 3 },
        { key: 'C', text: "Yes — definitely", score: 1 },
        { key: 'D', text: "I'm not sure", score: 0 },
      ],
    },
    insightOnD: "Not being sure whether your critical flows depend on specific people is itself the finding. The dependencies you can't see are the ones that break you.",
    followUp: {
      triggerKeys: ['A', 'C'],
      text: 'How do you know — when was this last verified?',
      id: 'A3_FU',
      options: [
        { key: 'A', text: 'Recently — we tested or audited this within the last quarter', effect: 'none' },
        { key: 'B', text: "It's been a while — I'm going off assumption more than evidence", effect: 'adjustScore', newScore: 2 },
        { key: 'C', text: "Honestly, I'm not sure it's been verified", effect: 'adjustScore', newScore: 1 },
      ],
      insightOnC: "Unverified automation claims are one of the most common blind spots. The processes you assume are automated may have manual dependencies nobody's documented.",
      insightOnB: "Assumptions about automation degrade over time. What was true last year may not be true today — teams change, workarounds accumulate, documentation goes stale.",
    },
  },
];

const ACCOUNTABILITY_QUESTIONS = [
  {
    id: 'AC1',
    layer: 'accountability',
    depth: 'core',
    label: 'Named Owner',
    text: 'If your AI system produced a bad outcome at 2am on a Saturday, who specifically gets called?',
    options: [
      { key: 'A', text: 'A specific named individual with authority to act', score: 4 },
      { key: 'B', text: 'An on-call rotation with clear escalation paths', score: 4 },
      { key: 'C', text: "It would depend / I'd have to figure out who to call", score: 1 },
      { key: 'D', text: 'Our AI governance committee would handle it at the next meeting', score: 0 },
    ],
    lowDepthVariant: {
      text: 'If something went wrong with an AI system at your company, is there a clear person or process to handle it?',
      options: [
        { key: 'A', text: 'Yes — a specific person who owns it', score: 4 },
        { key: 'B', text: 'Yes — a defined on-call or escalation process', score: 4 },
        { key: 'C', text: "We'd figure it out when it happened", score: 1 },
        { key: 'D', text: 'A committee would review it at their next meeting', score: 0 },
      ],
    },
    insightOnD: "The committee answer is one of the strongest negative signals in this assessment. Governance by committee means governance by nobody.",
  },
  {
    id: 'AC2',
    layer: 'accountability',
    depth: 'full',
    label: 'Kill History',
    text: 'Has your organization ever killed an AI or technology project mid-flight because it wasn\'t working?',
    options: [
      { key: 'A', text: 'Yes — and the person who made that call was supported', score: 4 },
      { key: 'B', text: 'Yes — but it was politically difficult', score: 2 },
      { key: 'C', text: 'No — projects generally run until budget is exhausted', score: 0 },
      { key: 'D', text: 'Not that I\'m aware of', score: 0 },
    ],
    lowDepthVariant: {
      text: 'Has your organization ever stopped a technology project because it wasn\'t delivering results?',
      options: [
        { key: 'A', text: 'Yes — and the decision was respected', score: 4 },
        { key: 'B', text: 'Yes — but it caused friction', score: 2 },
        { key: 'C', text: 'No — projects tend to keep going regardless', score: 0 },
        { key: 'D', text: "I honestly don't know", score: 0 },
      ],
    },
    insightOnD: "Not knowing whether your organization has ever killed a failing project is a signal. Organizations with healthy accountability know their kill stories.",
  },
  {
    id: 'AC3',
    layer: 'accountability',
    depth: 'full',
    label: 'Pre-Defined Failure Criteria',
    text: 'Before launching an AI initiative, do you define specific conditions under which you\'d pause or stop it?',
    options: [
      { key: 'A', text: 'Yes — documented failure criteria before every launch', score: 4 },
      { key: 'B', text: "Informally — we'd know it if we saw it", score: 2 },
      { key: 'C', text: 'No — we evaluate as we go', score: 1 },
      { key: 'D', text: "I don't think so", score: 0 },
    ],
    lowDepthVariant: {
      text: 'When your organization starts an AI or tech project, does anyone define upfront what would cause you to stop or change course?',
      options: [
        { key: 'A', text: 'Yes — there are clear criteria documented before launch', score: 4 },
        { key: 'B', text: "Not formally, but people would know if it was failing", score: 2 },
        { key: 'C', text: "No — we just see how it goes", score: 1 },
        { key: 'D', text: "I don't think that happens", score: 0 },
      ],
    },
    insightOnD: "Not knowing whether failure criteria exist means they effectively don't. Undefined stopping conditions mean projects run until budget or patience runs out.",
  },
];

const CULTURE_QUESTIONS = [
  {
    id: 'CU1',
    layer: 'culture',
    depth: 'full',
    label: 'Workflow Redesign',
    text: "Has any job role or daily workflow at your organization been fundamentally changed because of AI (not just 'now you also have this AI tool')?",
    options: [
      { key: 'A', text: 'Yes — roles have been redefined, not just augmented', score: 4 },
      { key: 'B', text: "We've added AI tools but the work itself hasn't changed much", score: 1 },
      { key: 'C', text: "We're planning to but haven't yet", score: 2 },
      { key: 'D', text: 'No', score: 0 },
    ],
    lowDepthVariant: {
      text: "Has AI actually changed how people do their jobs at your organization, or is it more of an add-on?",
      options: [
        { key: 'A', text: "Yes — some roles look completely different now", score: 4 },
        { key: 'B', text: "People have new AI tools, but their day-to-day is mostly the same", score: 1 },
        { key: 'C', text: "Changes are planned but haven't happened yet", score: 2 },
        { key: 'D', text: "No real change", score: 0 },
      ],
    },
  },
  {
    id: 'CU2',
    layer: 'culture',
    depth: 'full',
    label: 'Honest Failure',
    text: "Can you describe an AI initiative at your organization that didn't work, and what you learned from it?",
    options: [
      { key: 'A', text: "Yes — we had a specific failure and extracted real lessons from it", score: 4 },
      { key: 'B', text: "Everything we've tried has worked well", score: 0 },
      { key: 'C', text: "We haven't tried enough to fail yet", score: 2 },
    ],
    lowDepthVariant: {
      text: "Has any AI or tech initiative at your organization not worked out? What happened?",
      options: [
        { key: 'A', text: "Yes — and we learned specific lessons from it", score: 4 },
        { key: 'B', text: "Everything has gone well so far", score: 0 },
        { key: 'C', text: "We haven't done enough to have failures yet", score: 2 },
      ],
    },
    insightOnB: "In our experience, 'everything works' is either the result of not measuring or not being honest. Both are strong culture signals.",
  },
  {
    id: 'CU3',
    layer: 'culture',
    depth: 'core',
    label: 'Safety to Dissent',
    text: "If someone in a meeting said 'I don't think we're ready for this AI initiative,' what would happen?",
    options: [
      { key: 'A', text: "They'd be taken seriously and asked to explain their concerns", score: 4 },
      { key: 'B', text: 'It would depend on their seniority', score: 2 },
      { key: 'C', text: 'It would slow things down and probably be unwelcome', score: 1 },
      { key: 'D', text: "That wouldn't happen — there's too much momentum behind AI", score: 0 },
    ],
    lowDepthVariant: {
      text: "If someone pushed back on an AI initiative at your company, how would that go over?",
      options: [
        { key: 'A', text: "Their concerns would be heard and discussed", score: 4 },
        { key: 'B', text: "Depends on who said it", score: 2 },
        { key: 'C', text: "It probably wouldn't be welcome", score: 1 },
        { key: 'D', text: "Nobody would push back — AI is seen as inevitable", score: 0 },
      ],
    },
  },
];

const TASTE_QUESTIONS = [
  {
    id: 'T1',
    layer: 'taste',
    label: 'The Pilot Dilemma',
    text: 'Your AI pilot shows 78% accuracy on a task that humans do at 85%. What\'s your move?',
    options: [
      { key: 'A', text: 'Kill it — it underperforms humans.', score: 1 },
      { key: 'B', text: 'Launch it alongside humans as an assist tool.', score: 2 },
      { key: 'C', text: 'Investigate what the 22% failure cases have in common.', score: 3 },
      { key: 'D', text: "Redefine the success metric — maybe accuracy isn't what matters.", score: 4 },
    ],
  },
  {
    id: 'T2',
    layer: 'taste',
    label: 'The Shiny Object Test',
    text: "Your CEO returns from a conference excited about deploying an LLM for internal knowledge management. Your knowledge base is 60% outdated Confluence pages, SharePoint files, and tribal knowledge. First move?",
    options: [
      { key: 'A', text: 'Start evaluating LLM vendors', score: 0 },
      { key: 'B', text: 'Audit and clean the knowledge base content first', score: 2 },
      { key: 'C', text: 'Run a pilot with a small team using the messy data', score: 3 },
      { key: 'D', text: 'Ask the CEO what specific problem they\'re trying to solve', score: 4 },
    ],
  },
  {
    id: 'T3',
    layer: 'taste',
    label: 'The Kill Decision',
    text: '18 months and $400K in. Mixed results. Passionate team. Invested executive sponsor. Growing usage but unclear ROI. Your call?',
    options: [
      { key: 'A', text: 'Give it 6 more months with a clearer ROI framework', score: 1 },
      { key: 'B', text: 'Pivot to a related but more measurable use case', score: 3 },
      { key: 'C', text: 'Kill it and reallocate the budget', score: 3 },
      { key: 'D', text: 'Commission an independent review before deciding', score: 4 },
    ],
  },
  {
    id: 'T4',
    layer: 'taste',
    label: 'The Agent Question',
    text: 'Your team proposes an AI agent that autonomously processes customer refunds up to $500. 96% accurate in testing. What\'s your primary concern?',
    options: [
      { key: 'A', text: 'The 4% error rate on financial transactions', score: 2 },
      { key: 'B', text: 'Customer reaction to knowing AI handled their refund', score: 2 },
      { key: 'C', text: "What the agent does when it encounters a case it wasn't trained on", score: 3 },
      { key: 'D', text: 'Whether the current refund process should exist at all', score: 4 },
    ],
  },
];

// ─── Taste Reasoning Follow-Ups ──────────────────────────

const TASTE_LEADINS = {
  T1: {
    A: "Killing a pilot that underperforms humans — what drove that call?",
    B: "Running AI alongside humans as a safety net — what was behind that?",
    C: "Digging into the failure cases before deciding — what triggered that instinct?",
    D: "Questioning whether accuracy is even the right metric — what made you go there?",
  },
  T2: {
    A: "Going straight to vendor evaluation — what made that feel like the right first step?",
    B: "Cleaning the knowledge base before touching AI — what was behind that?",
    C: "Testing with messy data instead of waiting — what drove that instinct?",
    D: "Going straight to the CEO's underlying intent — what drove that instinct?",
  },
  T3: {
    A: "Giving it more time with clearer metrics — what was behind that?",
    B: "Pivoting to something more measurable rather than killing it — what drove that?",
    C: "Pulling the plug after 18 months and $400K — what made that feel right?",
    D: "Bringing in an outside review before deciding — what triggered that?",
  },
  T4: {
    A: "Focusing on the 4% error rate — what made that the primary concern?",
    B: "Thinking about how customers perceive AI handling their money — what drove that?",
    C: "Worrying about edge cases the agent wasn't trained on — what triggered that?",
    D: "Questioning whether the refund process should exist at all — what made you go there?",
  },
};

const TASTE_REASONING = {
  T1: {
    options: [
      { key: 'R1', text: '78% vs 85% — the accuracy gap told me what I needed to know', fr: 0, kd: 0, ec: 1 },
      { key: 'R2', text: 'I kept thinking about what types of cases the AI gets wrong and whether those failures are dangerous', fr: 1, kd: 0, ec: 1 },
      { key: 'R3', text: 'Accuracy might not be the real measure — maybe the AI catches things humans miss, or fails in ways that matter less', fr: 2, kd: 0, ec: 0 },
      { key: 'R4', text: 'Pilots stall when you overanalyze — better to make a call and learn from what happens', fr: 0, kd: 1, ec: 0 },
    ],
  },
  T2: {
    options: [
      { key: 'R1', text: 'An LLM on 60% outdated content will confidently give wrong answers — that felt dangerous', fr: 0, kd: 1, ec: 1 },
      { key: 'R2', text: "Conference excitement fades — I wanted to know what problem the CEO actually needs solved before picking a tool", fr: 2, kd: 0, ec: 0 },
      { key: 'R3', text: "You learn more from a quick pilot on messy data than months of cleanup you might not even need", fr: 1, kd: 0, ec: 1 },
      { key: 'R4', text: "The LLM space moves fast — getting vendor conversations started early gives us an advantage", fr: -1, kd: 0, ec: 0 },
    ],
  },
  T3: {
    options: [
      { key: 'R1', text: "$400K in and a passionate team — I worried we'd keep going just because stopping feels like failure", fr: 1, kd: 1, ec: 0 },
      { key: 'R2', text: 'I weighed what the team and budget could accomplish if redirected vs. what 6 more months of unclear ROI gets us', fr: 0, kd: 1, ec: 1 },
      { key: 'R3', text: 'The executive sponsor and the team are too close to it — someone outside the blast radius needs to make this call', fr: 2, kd: 0, ec: 1 },
      { key: 'R4', text: '18 months is still early for enterprise AI — growing usage is a signal worth protecting', fr: -1, kd: -1, ec: 0 },
    ],
  },
  T4: {
    options: [
      { key: 'R1', text: '96% sounds great until the agent hits a refund scenario nobody anticipated — that 4% could be the weird cases', fr: 0, kd: 0, ec: 2 },
      { key: 'R2', text: 'Before automating refunds, I wanted to ask why we process so many refunds in the first place', fr: 2, kd: 1, ec: 0 },
      { key: 'R3', text: '4% errors on money means real customers losing real dollars — that risk felt unacceptable at scale', fr: 0, kd: 1, ec: 1 },
      { key: 'R4', text: "Even if it's accurate, customers might not trust a machine with their money — perception matters", fr: 0, kd: 0, ec: 0 },
    ],
  },
};

function recordTasteReasoning(session, scenarioId, reasoningKey) {
  const scenario = TASTE_REASONING[scenarioId];
  if (!scenario) return;
  const option = scenario.options.find(o => o.key === reasoningKey);
  if (!option) return;

  // Initialize reasoning dimensions if needed
  if (!session.tasteReasoningDims) {
    session.tasteReasoningDims = { frameRecognition: 0, killDiscipline: 0, edgeCaseInstinct: 0 };
  }
  session.tasteReasoningDims.frameRecognition += option.fr;
  session.tasteReasoningDims.killDiscipline += option.kd;
  session.tasteReasoningDims.edgeCaseInstinct += option.ec;
}

// ─── Routing Logic ────────────────────────────────────────

// Determines which Tier 2 layer modules to assess deeply vs quickly based on Tier 1 answers
// Returns { deep: [...], shallow: [...] } — all 4 layers are always included
function determineModules(pulseAnswers) {
  const deepSet = new Set();
  const p1 = pulseAnswers.P1;
  const p2 = pulseAnswers.P2;
  const p4 = pulseAnswers.P4;

  // P1 role routing
  if (p1 === 'A' || p1 === 'B') {
    deepSet.add('accountability');
    deepSet.add('culture');
  } else if (p1 === 'C') {
    deepSet.add('foundation');
    deepSet.add('architecture');
  } else {
    // D — balanced across all layers
    deepSet.add('foundation');
    deepSet.add('architecture');
    deepSet.add('accountability');
    deepSet.add('culture');
  }

  // P2 maturity routing
  if (p2 === 'A') {
    deepSet.add('foundation');
  } else if (p2 === 'B') {
    deepSet.add('architecture');
    deepSet.add('accountability');
  } else if (p2 === 'C') {
    deepSet.add('foundation');
    deepSet.add('architecture');
    deepSet.add('accountability');
    deepSet.add('culture');
  } else if (p2 === 'D') {
    deepSet.add('culture');
  }

  // P4 concern mapping — the user's self-identified concern gets probed
  const concernMap = { A: 'foundation', B: 'architecture', C: 'accountability', D: 'culture' };
  if (concernMap[p4]) deepSet.add(concernMap[p4]);
  // P4=E taste emphasis — assess all layers so taste modifier has full context
  if (p4 === 'E') {
    deepSet.add('foundation');
    deepSet.add('architecture');
    deepSet.add('accountability');
    deepSet.add('culture');
  }

  // Always at least 2 deep modules, at most 4
  if (deepSet.size < 2) {
    if (!deepSet.has('foundation')) deepSet.add('foundation');
    if (deepSet.size < 2) deepSet.add('culture');
  }

  const allLayers = ['foundation', 'architecture', 'accountability', 'culture'];
  const deep = allLayers.filter(l => deepSet.has(l));
  const shallow = allLayers.filter(l => !deepSet.has(l));

  return { deep, shallow };
}

function getModuleQuestions(moduleName, depthFilter) {
  const map = {
    foundation: FOUNDATION_QUESTIONS,
    architecture: ARCHITECTURE_QUESTIONS,
    accountability: ACCOUNTABILITY_QUESTIONS,
    culture: CULTURE_QUESTIONS,
  };
  const questions = map[moduleName] || [];
  // For shallow modules, only return core questions
  if (depthFilter === 'shallow') {
    return questions.filter(q => q.depth === 'core');
  }
  return questions;
}

// ─── Scoring ──────────────────────────────────────────────

function scoreLayer(layerResponses) {
  if (!layerResponses.length) return null;
  const maxPossible = layerResponses.length * 4;
  const raw = layerResponses.reduce((sum, r) => sum + r.score, 0);
  return Math.round((raw / maxPossible) * 100);
}

function scoreTaste(tasteResponses) {
  const weights = {
    frameRecognition: {
      T1: { A: 0, B: 0, C: 0, D: 2 },
      T2: { A: 0, B: 0, C: 1, D: 2 },
      T3: { A: 0, B: 1, C: 0, D: 2 },
      T4: { A: 0, B: 0, C: 0, D: 2 },
    },
    killDiscipline: {
      T1: { A: 1, B: 0, C: 0, D: 0 },
      T2: { A: 0, B: 1, C: 0, D: 1 },
      T3: { A: 0, B: 1, C: 2, D: 1 },
      T4: { A: 1, B: 0, C: 0, D: 1 },
    },
    edgeCaseInstinct: {
      T1: { A: 0, B: 1, C: 2, D: 0 },
      T2: { A: 0, B: 0, C: 2, D: 0 },
      T3: { A: 0, B: 0, C: 0, D: 1 },
      T4: { A: 1, B: 1, C: 2, D: 0 },
    },
  };

  const dims = { frameRecognition: 0, killDiscipline: 0, edgeCaseInstinct: 0 };
  for (const r of tasteResponses) {
    for (const dim of Object.keys(dims)) {
      dims[dim] += weights[dim][r.questionId]?.[r.answer] || 0;
    }
  }
  return dims;
}

function applyConsistencyModifier(dims, tasteResponses) {
  const letters = tasteResponses.map(r => r.answer);
  const unique = new Set(letters);
  if (unique.size === 1) {
    // Same letter 4/4 — gaming penalty: subtract 2 from highest dimension
    const highest = Object.keys(dims).reduce((a, b) => dims[a] >= dims[b] ? a : b);
    dims[highest] = Math.max(0, dims[highest] - 2);
  } else if (unique.size === 4) {
    // All different letters — contextual thinking bonus
    dims.frameRecognition += 1;
  }
  return dims;
}

function getTasteSignature(dims) {
  const { frameRecognition, killDiscipline, edgeCaseInstinct } = dims;
  const total = frameRecognition + killDiscipline + edgeCaseInstinct;
  const allAbove2 = frameRecognition >= 2 && killDiscipline >= 2 && edgeCaseInstinct >= 2;
  const allBetween2and5 = [frameRecognition, killDiscipline, edgeCaseInstinct].every(d => d >= 2 && d <= 5);

  // Momentum: low total or zero frame recognition
  if (total <= 6 || frameRecognition === 0)
    return { name: 'Momentum', color: 'var(--taste-momentum)', description: 'Defaults to speed, hype, or inertia. Strength: fast execution when direction is right. Risk: expensive failures, automating the mess, hype-driven decisions.' };
  // Sophistication: high frame recognition, balanced across all dimensions
  if (frameRecognition >= 5 && allAbove2)
    return { name: 'Sophistication', color: 'var(--taste-sophistication)', description: 'Defaults to reframing, first-principles thinking, and second-order effects. Strength: sees what others miss. Risk: over-analysis, slow to ship.' };
  // Caution: edge-case instinct is highest and frame recognition is low
  if (edgeCaseInstinct > killDiscipline && edgeCaseInstinct > frameRecognition && frameRecognition <= 3)
    return { name: 'Caution', color: 'var(--taste-caution)', description: 'Defaults to safety, risk management, and proven approaches. Strength: avoids catastrophic failure. Risk: misses high-leverage opportunities, slow adoption.' };
  // Pragmatism: balanced dimensions, no extreme spikes or gaps
  if (allBetween2and5)
    return { name: 'Pragmatism', color: 'var(--taste-pragmatism)', description: 'Balances analysis with action. Tests assumptions empirically. Strength: gets things done well. Risk: may miss systemic issues.' };

  // Fallback: determine by highest dimension
  if (frameRecognition >= killDiscipline && frameRecognition >= edgeCaseInstinct)
    return { name: 'Sophistication', color: 'var(--taste-sophistication)', description: 'Defaults to reframing, first-principles thinking, and second-order effects. Strength: sees what others miss. Risk: over-analysis, slow to ship.' };
  if (edgeCaseInstinct >= killDiscipline)
    return { name: 'Caution', color: 'var(--taste-caution)', description: 'Defaults to safety, risk management, and proven approaches. Strength: avoids catastrophic failure. Risk: misses high-leverage opportunities, slow adoption.' };
  return { name: 'Pragmatism', color: 'var(--taste-pragmatism)', description: 'Balances analysis with action. Tests assumptions empirically. Strength: gets things done well. Risk: may miss systemic issues.' };
}

function calculateVerdict(layerScores, tasteSignature) {
  // Weighted average of assessed layers (equal weight per spec)
  const assessed = Object.entries(layerScores).filter(([, v]) => v !== null);
  if (!assessed.length) return { verdict: 'Red', composite: 0 };

  const avg = assessed.reduce((sum, [, v]) => sum + v, 0) / assessed.length;

  // Taste modifier
  let modifier = 0;
  if (tasteSignature.name === 'Caution') modifier = -10;
  if (tasteSignature.name === 'Momentum') modifier = -25;

  const composite = Math.max(0, Math.min(100, Math.round(avg + modifier)));

  let verdict;
  if (composite >= 70) verdict = 'Green';
  else if (composite >= 40) verdict = 'Amber';
  else verdict = 'Red';

  return { verdict, composite };
}

function findBindingConstraint(layerScores) {
  const assessed = Object.entries(layerScores).filter(([, v]) => v !== null);
  if (!assessed.length) return null;

  // If all assessed layer scores are within 10 points, no meaningful binding constraint
  const scores = assessed.map(([, v]) => v);
  const spread = Math.max(...scores) - Math.min(...scores);
  if (spread <= 10) return null;

  let lowest = Infinity;
  let constraint = null;
  for (const [layer, score] of assessed) {
    if (score < lowest) {
      lowest = score;
      constraint = layer;
    }
  }
  return constraint;
}

// ─── Three-Horizon Action Plans ──────────────────────────

// Actions keyed by bindingConstraint, each with rightNow/thisWeek/thisMonth
// rightNow has answer-specific overrides; thisWeek/thisMonth vary by verdict
const ACTION_PLANS = {
  foundation: {
    rightNow: {
      base: 'Open your calendar and schedule a 1-hour "data reality check" — sit with the person closest to your data systems and ask them to show you where customer data actually lives.',
      byAnswer: {
        F1_D: 'Schedule a 1-hour meeting with your data team this afternoon. Your single agenda item: "Show me where our customer data lives and how an AI system would access it." You don\'t know — that\'s the first thing to fix.',
        F2_D: 'Before the day ends, answer one question: does your organization have a data governance policy? If nobody can tell you, that\'s your starting point. Write down who you asked and what they said.',
        F2_0: 'Draft a one-page data governance charter today — not a policy, a charter. Name one person as data owner and define three rules they enforce. A named enforcer is worth more than a 50-page policy.',
        F3_B: 'Identify the specific data quality issue that\'s blocking your current work and document it. Name the source system, the problem, and who would need to fix it.',
      },
    },
    thisWeek: {
      Green: [
        'Audit your data access patterns — document which systems an AI model would need to query and test the API connections.',
        'Review your data governance policy with your designated owner. Confirm enforcement is active, not aspirational.',
      ],
      Amber: [
        'Map every data source an AI system would need — note gaps, formats, access methods, and who owns each one.',
        'Establish a weekly 30-minute data quality stand-up with whoever touches your most critical data.',
        'Identify your single most accessible, cleanest dataset — that\'s where your first AI use case should live.',
      ],
      Red: [
        'Conduct a full data inventory: what do you have, where does it live, what format is it in, who owns it.',
        'Identify your three most critical data gaps and assign an owner to each one.',
        'Set up a data quality baseline — you can\'t improve what you aren\'t measuring.',
      ],
    },
    thisMonth: {
      Green: 'Implement automated data quality monitoring on your primary AI data pipelines. Shift from reactive fixes to proactive detection.',
      Amber: 'Create a data governance policy with a named enforcer and weekly review cadence. Move from scattered data to consolidated, AI-accessible data for your top use case.',
      Red: 'Build a data foundation roadmap: consolidate your critical data sources, establish governance with a named owner, and create the data infrastructure one AI use case needs. Don\'t try to fix everything — fix the path to one working implementation.',
    },
  },
  architecture: {
    rightNow: {
      base: 'Pick your single most critical business process and sketch it end-to-end on paper right now — every step, every handoff, every system. Where you can\'t fill in the details is where AI integration will break.',
      byAnswer: {
        A1_D: 'Take 30 minutes today and try to draw your most critical workflow on paper. Every gap in that drawing — every step you can\'t describe — is a place where AI integration will fail. The drawing is the diagnostic.',
        A2_D: 'Ask one question in your next meeting: "When did we last fundamentally redesign a core process?" If nobody can answer, that tells you your processes are legacy — and AI layered on legacy processes produces legacy results faster.',
        A3_C: 'Write down the name of every person who is a single point of failure for a critical process. That list is your architecture risk register. Start there.',
        A3_D: 'Send one message to your team today: "What breaks if someone is unexpectedly out for a week?" The answers will reveal your single-person dependencies.',
      },
    },
    thisWeek: {
      Green: [
        'Identify the handoffs in your critical workflows that could be automated or streamlined for AI integration.',
        'Document your single-person dependencies and create cross-training plans for each one.',
      ],
      Amber: [
        'Document your top 3 business workflows end-to-end, including every handoff between teams and systems.',
        'Identify and begin eliminating single-person dependencies in critical data flows.',
        'Select one process closest to an AI use case and map it at the detail level AI would need.',
      ],
      Red: [
        'Map your critical workflows — even rough drafts reveal the handoffs and informal processes AI can\'t navigate.',
        'List every manual, person-dependent step in your core processes. This is your fragility inventory.',
        'Interview the 3 people who "keep things running" and document what they do that nobody else knows.',
      ],
    },
    thisMonth: {
      Green: 'Redesign one workflow specifically for AI integration — not bolting AI onto an existing process, but rearchitecting the process to leverage what AI can do.',
      Amber: 'Redesign one major process from scratch rather than patching. Choose the one closest to your highest-value AI use case. Eliminate single-person dependencies as you go.',
      Red: 'Complete a process architecture assessment: document your critical workflows, eliminate key single-person dependencies, and identify which process would benefit most from fundamental redesign before any AI touches it.',
    },
  },
  accountability: {
    rightNow: {
      base: 'Answer this question right now: if your AI system produced a bad outcome today, who specifically would you call? If you can\'t name one person in five seconds, you\'ve found your first action.',
      byAnswer: {
        AC1_D: 'Replace your AI governance committee with a named individual. Today. Find one person with authority to make decisions about AI outcomes and put their name on paper. Committees don\'t get called at 2am — people do.',
        AC1_C: 'Write down a one-page AI escalation path: what happens, who gets called, in what order, with what authority. If you have to "figure out who to call," you don\'t have accountability — you have improvisation.',
        AC2_C: 'Think of the AI or tech project that should have been killed but wasn\'t. Write down what it cost to let it run. That number is the cost of missing accountability.',
        AC2_D: 'Ask your leadership team one question today: "Have we ever stopped a project because it wasn\'t working?" Their answer — or their silence — tells you everything about your accountability culture.',
        AC3_D: 'Before your next initiative kicks off, write down three conditions under which you would stop it. Share them with the team. If defining failure criteria feels uncomfortable, that discomfort is the finding.',
      },
    },
    thisWeek: {
      Green: [
        'Review your AI escalation paths and run a tabletop exercise. Verify the named owner can actually act with authority.',
        'Audit your existing failure criteria — are they specific enough to trigger action, or vague enough to ignore?',
      ],
      Amber: [
        'Name a specific individual who owns AI outcomes — not a committee, a person with authority to act.',
        'Define written failure criteria for your current AI initiatives — the specific conditions under which you\'d pause.',
        'Review past projects that underperformed. Were they killed or did they just fade? Document the pattern.',
      ],
      Red: [
        'Assign one person as AI outcomes owner with explicit authority to pause or kill initiatives.',
        'Define written failure criteria before your next AI initiative launches.',
        'Run a "2am on Saturday" drill — verify your escalation path actually works for an AI-produced bad outcome.',
      ],
    },
    thisMonth: {
      Green: 'Formalize your AI accountability framework: documented ownership, tested escalation, and regular review of failure criteria. Move from working accountability to institutional accountability.',
      Amber: 'Build an accountability infrastructure: named owners, documented escalation paths, pre-defined failure criteria for every active initiative. The goal is to make killing a bad project as normal as launching a good one.',
      Red: 'Establish accountability from scratch: name an AI owner, create escalation paths, define failure criteria, and run your first kill-decision drill. Until someone specific owns AI outcomes, nobody does.',
    },
  },
  culture: {
    rightNow: {
      base: 'Ask one person on your team today: "What would you change about how we\'re approaching AI if you could change anything?" Then listen without defending. Their answer is data.',
      byAnswer: {
        CU1_D: 'Look at one role that touches AI-relevant work and ask: "If AI could handle 40% of this job, what would this person do with that time?" If the answer is "the same thing but less of it," you\'re thinking about AI wrong.',
        CU1_B: 'Pick the team that has AI tools and ask them: "Has this actually changed how you work, or is it just another tool in the stack?" Be honest about whether AI adoption is real transformation or just new software.',
        CU2_B: 'Challenge the "everything works" narrative today. Ask your team to name one thing that went wrong or underperformed with any AI initiative. If they can\'t, you\'re either not measuring or not asking.',
        CU3_D: 'Create one safe channel for dissent on AI initiatives today — even an anonymous form. If the AI momentum is so strong that nobody pushes back, the first failure will be catastrophic because nobody saw it coming.',
      },
    },
    thisWeek: {
      Green: [
        'Identify one role that should be fundamentally redesigned around AI capabilities, not just augmented.',
        'Conduct a "dissent audit" — are people comfortable raising concerns about AI initiatives? How do you know?',
      ],
      Amber: [
        'Redesign one role around AI capabilities rather than just adding AI tools to existing workflows.',
        'Hold a blameless post-mortem on an AI initiative — if you can\'t name a failure, that itself is the finding.',
        'Survey your team on AI readiness — not excitement, readiness. Do they know what\'s changing and how it affects their work?',
      ],
      Red: [
        'Have an honest conversation with your team about AI readiness. Not a pep talk — a real discussion about concerns, fears, and gaps.',
        'Identify who in your organization is quietly resisting AI adoption and understand why. Resistance often contains important information.',
        'Create a safe mechanism for dissent on AI initiatives — anonymous input if needed, but it must exist.',
      ],
    },
    thisMonth: {
      Green: 'Evolve from AI adoption to AI-native culture: redesign workflows, redefine success metrics, and build the organizational muscle to continuously adapt as AI capabilities change.',
      Amber: 'Build a culture of honest AI engagement: real transformation (not just tool adoption), blameless failure analysis, and genuine psychological safety for AI skeptics. Culture eats strategy — and it eats AI deployments too.',
      Red: 'Start a cultural foundation for AI: redesign one role (not just add tools), hold your first honest failure conversation, and create safe channels for dissent. You can\'t deploy AI successfully into a culture that isn\'t ready to change.',
    },
  },
};

// Finds the weakest specific answer within a layer to personalize the rightNow action
function findWeakestAnswer(session, layerName) {
  const responses = session.layerResponses[layerName] || [];
  let weakest = null;
  let lowestScore = Infinity;
  for (const r of responses) {
    if (r.score < lowestScore) {
      lowestScore = r.score;
      weakest = r;
    }
  }
  return weakest;
}

function generateActions(bindingConstraint, layerScores, verdict, session) {
  if (!bindingConstraint) {
    // Balanced scores — find the lowest-scoring assessed layer for general guidance
    const assessed = Object.entries(layerScores).filter(([, v]) => v !== null);
    const sorted = assessed.sort((a, b) => a[1] - b[1]);
    const fallbackLayer = sorted.length ? sorted[0][0] : null;
    const plan = fallbackLayer ? ACTION_PLANS[fallbackLayer] : null;
    if (!plan) return { rightNow: 'Review your assessment results with your leadership team and identify one area to improve first.', thisWeek: ['Share these results with stakeholders and align on priorities.'], thisMonth: 'Develop an AI readiness improvement roadmap that raises all layers together.' };
    return {
      rightNow: plan.rightNow.base,
      thisWeek: plan.thisWeek[verdict] || plan.thisWeek.Amber,
      thisMonth: plan.thisMonth[verdict] || plan.thisMonth.Amber,
    };
  }
  const plan = ACTION_PLANS[bindingConstraint];
  if (!plan) return { rightNow: '', thisWeek: [], thisMonth: '' };

  // Pick the most specific rightNow action based on weakest answer
  let rightNow = plan.rightNow.base;
  const weakest = findWeakestAnswer(session, bindingConstraint);
  if (weakest) {
    // Try answer-specific override: e.g., "F2_D" or "F2_0" (score-based)
    const answerKey = weakest.questionId + '_' + weakest.answer;
    const scoreKey = weakest.questionId + '_' + weakest.score;
    if (plan.rightNow.byAnswer[answerKey]) {
      rightNow = plan.rightNow.byAnswer[answerKey];
    } else if (plan.rightNow.byAnswer[scoreKey]) {
      rightNow = plan.rightNow.byAnswer[scoreKey];
    }
  }

  const thisWeek = plan.thisWeek[verdict] || plan.thisWeek.Amber;
  const thisMonth = plan.thisMonth[verdict] || plan.thisMonth.Amber;

  return { rightNow, thisWeek, thisMonth };
}

// ─── Constraint Explanations ──────────────────────────────

const CONSTRAINT_EXPLANATIONS = {
  foundation: 'Your Foundation layer is the binding constraint. Without reliable, accessible data, every AI initiative is built on sand. Your Architecture and Culture scores won\'t matter until the data underneath them is trustworthy.',
  architecture: 'Your Architecture layer is the binding constraint. Your processes aren\'t ready for AI integration. Undocumented workflows, manual dependencies, and stale process design mean AI has nowhere clean to plug in.',
  accountability: 'Your Accountability layer is the binding constraint. Your technical capability may exist, but without clear human ownership of AI outcomes, implementations will fail at the organizational level — not the technical one.',
  culture: 'Your Culture layer is the binding constraint. Your organization may have the infrastructure, but your people aren\'t positioned to absorb AI-driven change. Tools without transformation is training without impact.',
};

// ─── Verdict Summaries ────────────────────────────────────

function getVerdictSummary(verdict, bindingConstraint) {
  if (!bindingConstraint) {
    if (verdict === 'Green') return 'Your organization shows strong, balanced AI implementation readiness across all layers. No single layer is holding you back.';
    if (verdict === 'Amber') return 'Conditionally ready, with balanced but moderate scores across all layers. Raise all layers together rather than targeting one bottleneck.';
    return 'Not ready for production AI deployment. Scores are balanced but uniformly low — you need broad improvement across all layers.';
  }
  const layer = bindingConstraint.charAt(0).toUpperCase() + bindingConstraint.slice(1);
  if (verdict === 'Green') return `Your organization shows strong AI implementation readiness. Focus optimization efforts on ${layer} to unlock the next level of capability.`;
  if (verdict === 'Amber') return `Conditionally ready. You can begin scoped AI initiatives, but ${layer} needs attention before scaling. Sequence carefully.`;
  return `Not ready for production AI deployment. Deploying now risks expensive failure. Fix ${layer} first.`;
}

function getVerdictFraming(verdict) {
  if (verdict === 'Red') return "By identifying this now, you've avoided the costly failure that hits most organizations 6-12 months into implementation.";
  return null;
}

// ─── Taste Characterization ──────────────────────────────

function getTasteCharacterization(dims) {
  const { frameRecognition, killDiscipline, edgeCaseInstinct } = dims;
  const values = [frameRecognition, killDiscipline, edgeCaseInstinct];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const total = frameRecognition + killDiscipline + edgeCaseInstinct;

  const sentences = {
    frameRecognition: "You instinctively question whether the right problem is being solved before optimizing the solution — that's rare and invaluable when organizations are rushing to deploy AI.",
    killDiscipline: "You have uncommon discipline — the willingness to stop what isn't working even when momentum says continue. Most organizations lack this entirely.",
    edgeCaseInstinct: "Your first instinct is to understand what breaks, not what works. That's the trait that prevents the expensive failures most organizations discover too late.",
  };

  // All low
  if (total <= 6) return "Your instinct is toward action over analysis. That creates velocity when direction is right and expensive course corrections when it isn't.";

  // All roughly equal (spread of 2 or less)
  if (max - min <= 2 && min >= 2) return "Your judgment is balanced — you see frames, risks, and stopping points with equal clarity. The risk is that balance can become indecision.";

  // Find highest dimension(s)
  const highest = Object.keys(dims).filter(k => dims[k] === max);

  if (highest.length === 1) return sentences[highest[0]];

  // Two-way tie: combine both sentences
  return highest.map(k => sentences[k]).join(' ');
}

// ─── Adaptive Follow-Up Micro-Prompts ────────────────────

const ADAPTIVE_MICRO_PROMPTS = {
  foundation: { prompt: 'In one sentence \u2014 what\u2019s the biggest gap in your data?', placeholder: 'One sentence is plenty.' },
  architecture: { prompt: 'What breaks first when your team doubles?', placeholder: 'One sentence is plenty.' },
  accountability: { prompt: 'Who actually gets the call when something goes wrong?', placeholder: 'One sentence is plenty.' },
  culture: { prompt: 'What\u2019s the thing nobody says out loud about AI at your company?', placeholder: 'One sentence is plenty.' },
};

// ─── Session State ────────────────────────────────────────

function createSession() {
  return {
    tier: 1,
    currentQuestionIndex: 0,
    pulseAnswers: {},
    modules: [],           // all layer modules in assessment order (deep first, then shallow)
    moduleDepths: {},       // { foundation: 'deep'|'shallow', ... }
    currentModuleIndex: 0,
    knowledgeDepth: 'high', // set after P5: A/B = 'high', C/D = 'low'
    layerResponses: {
      foundation: [],
      architecture: [],
      accountability: [],
      culture: [],
    },
    tasteResponses: [],
    followUpResponses: {},
    industry: null,
    complete: false,
    adaptiveFollowUp: {
      pending: [],
      currentLayerIndex: 0,
      currentQuestionIndex: 0,
      _layerJustCompleted: null,
    },
    adaptiveFreeText: {},
  };
}

// ─── Flow Controller ──────────────────────────────────────

// Returns the next question or null if assessment is complete
function getNextQuestion(session) {
  if (session.complete) return null;

  // Tier 1: Pulse
  if (session.tier === 1) {
    if (session.currentQuestionIndex < TIER1_QUESTIONS.length) {
      return {
        tier: 1,
        tierLabel: 'The Pulse',
        ...TIER1_QUESTIONS[session.currentQuestionIndex],
      };
    }
    // Done with Tier 1 — determine modules, advance to Tier 2
    const routing = determineModules(session.pulseAnswers);
    // Serve deep modules first, then shallow
    session.modules = [...routing.deep, ...routing.shallow];
    session.moduleDepths = {};
    for (const m of routing.deep) session.moduleDepths[m] = 'deep';
    for (const m of routing.shallow) session.moduleDepths[m] = 'shallow';
    session.tier = 2;
    session.currentQuestionIndex = 0;
    session.currentModuleIndex = 0;
  }

  // Tier 2: Diagnostic
  if (session.tier === 2) {
    while (session.currentModuleIndex < session.modules.length) {
      const moduleName = session.modules[session.currentModuleIndex];
      const depthFilter = session.moduleDepths[moduleName] === 'shallow' ? 'shallow' : null;
      const questions = getModuleQuestions(moduleName, depthFilter);
      if (session.currentQuestionIndex < questions.length) {
        const baseQ = questions[session.currentQuestionIndex];
        // Apply low-depth variant if applicable
        const useLowDepth = session.knowledgeDepth === 'low' && baseQ.lowDepthVariant;
        const q = useLowDepth
          ? { ...baseQ, text: baseQ.lowDepthVariant.text, options: baseQ.lowDepthVariant.options }
          : baseQ;
        return {
          tier: 2,
          tierLabel: 'The Diagnostic',
          layerLabel: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
          ...q,
        };
      }
      // Move to next module
      session.currentModuleIndex++;
      session.currentQuestionIndex = 0;
    }
    // Check for adaptive follow-up before advancing to Tier 3
    if (!session._adaptiveChecked) {
      session._adaptiveChecked = true;
      const pending = [];
      for (const layer of ['foundation', 'architecture', 'accountability', 'culture']) {
        const responses = session.layerResponses[layer];
        if (responses.length > 0 && responses.length < 3) {
          const score = scoreLayer(responses);
          if (score !== null && score <= 33) {
            pending.push(layer);
          }
        }
      }
      session.adaptiveFollowUp.pending = pending;
      session.adaptiveFollowUp.currentLayerIndex = 0;
      session.adaptiveFollowUp.currentQuestionIndex = 0;
    }

    // Serve adaptive follow-up questions
    if (session.adaptiveFollowUp.pending.length > 0) {
      while (session.adaptiveFollowUp.currentLayerIndex < session.adaptiveFollowUp.pending.length) {
        const layerName = session.adaptiveFollowUp.pending[session.adaptiveFollowUp.currentLayerIndex];
        const allLayerQs = getModuleQuestions(layerName, null);
        const answeredIds = new Set(session.layerResponses[layerName].map(r => r.questionId));
        const unanswered = allLayerQs.filter(q => !answeredIds.has(q.id));
        const maxAdaptive = Math.min(2, unanswered.length);

        if (session.adaptiveFollowUp.currentQuestionIndex < maxAdaptive) {
          const baseQ = unanswered[session.adaptiveFollowUp.currentQuestionIndex];
          const useLowDepth = session.knowledgeDepth === 'low' && baseQ.lowDepthVariant;
          const q = useLowDepth
            ? { ...baseQ, text: baseQ.lowDepthVariant.text, options: baseQ.lowDepthVariant.options }
            : baseQ;
          session._currentAdaptiveLayer = layerName;
          return {
            tier: 2,
            tierLabel: 'Deeper Dive',
            layerLabel: layerName.charAt(0).toUpperCase() + layerName.slice(1),
            isAdaptive: true,
            adaptiveLayer: layerName,
            isFirstAdaptiveForLayer: session.adaptiveFollowUp.currentQuestionIndex === 0,
            ...q,
          };
        }
        // Done with this layer's adaptive questions
        session.adaptiveFollowUp.currentLayerIndex++;
        session.adaptiveFollowUp.currentQuestionIndex = 0;
      }
    }

    // Done with Tier 2 + adaptive — advance to Tier 3
    session.tier = 3;
    session.currentQuestionIndex = 0;
  }

  // Tier 3: Taste Test
  if (session.tier === 3) {
    if (session.currentQuestionIndex < TASTE_QUESTIONS.length) {
      return {
        tier: 3,
        tierLabel: 'The Taste Test',
        ...TASTE_QUESTIONS[session.currentQuestionIndex],
      };
    }
    // Done — calculate results
    session.complete = true;
    return null;
  }

  return null;
}

// Records an answer and advances state
function recordAnswer(session, questionId, optionKey, score) {
  if (session.tier === 1) {
    session.pulseAnswers[questionId] = optionKey;
    if (questionId === 'P3') {
      session.industry = optionKey;
    }
    // Set knowledge depth from P5
    if (questionId === 'P5') {
      session.knowledgeDepth = (optionKey === 'A' || optionKey === 'B') ? 'high' : 'low';
    }
    session.currentQuestionIndex++;
  } else if (session.tier === 2) {
    if (session._currentAdaptiveLayer) {
      const layerName = session._currentAdaptiveLayer;
      session.layerResponses[layerName].push({
        questionId,
        answer: optionKey,
        score: score ?? 0,
      });
      session.adaptiveFollowUp.currentQuestionIndex++;
      session._currentAdaptiveLayer = null;
      // Check if this layer's adaptive questions are exhausted
      const allLayerQs = getModuleQuestions(layerName, null);
      const answeredIds = new Set(session.layerResponses[layerName].map(r => r.questionId));
      const unanswered = allLayerQs.filter(q => !answeredIds.has(q.id));
      const maxAdaptive = Math.min(2, unanswered.length);
      if (session.adaptiveFollowUp.currentQuestionIndex >= maxAdaptive) {
        session.adaptiveFollowUp._layerJustCompleted = layerName;
      } else {
        session.adaptiveFollowUp._layerJustCompleted = null;
      }
    } else {
      const moduleName = session.modules[session.currentModuleIndex];
      session.layerResponses[moduleName].push({
        questionId,
        answer: optionKey,
        score: score ?? 0,
      });
      session.currentQuestionIndex++;
    }
  } else if (session.tier === 3) {
    session.tasteResponses.push({
      questionId,
      answer: optionKey,
      score: score ?? 0,
    });
    session.currentQuestionIndex++;
  }
}

// Records a follow-up answer (does not advance question index)
function recordFollowUp(session, followUpId, optionKey, parentQuestionId, effect, newScore) {
  session.followUpResponses[followUpId] = { answer: optionKey, parentQuestionId };
  // If the follow-up adjusts the parent question's score
  if (effect === 'adjustScore' && newScore !== undefined) {
    // Find the layer that contains this parent question
    let responses = null;
    for (const [, layerResponses] of Object.entries(session.layerResponses)) {
      if (layerResponses.find(r => r.questionId === parentQuestionId)) {
        responses = layerResponses;
        break;
      }
    }
    if (responses) {
      const parent = responses.find(r => r.questionId === parentQuestionId);
      if (parent) parent.score = newScore;
    }
  }
}

// Computes final results from a complete session
function computeResults(session) {
  const layerScores = {
    foundation: scoreLayer(session.layerResponses.foundation),
    architecture: scoreLayer(session.layerResponses.architecture),
    accountability: scoreLayer(session.layerResponses.accountability),
    culture: scoreLayer(session.layerResponses.culture),
  };

  // Apply CU2 free-text bonus (additive to culture score, max 100)
  if (session.cu2Bonus && layerScores.culture !== null) {
    // Bonus is 0-2 points; scale to match 0-100 layer score (each point ≈ 8.33 on 0-100)
    layerScores.culture = Math.min(100, layerScores.culture + session.cu2Bonus * 8);
  }

  const tasteDimensions = scoreTaste(session.tasteResponses);
  applyConsistencyModifier(tasteDimensions, session.tasteResponses);
  // Add reasoning follow-up adjustments (additive)
  if (session.tasteReasoningDims) {
    tasteDimensions.frameRecognition += session.tasteReasoningDims.frameRecognition;
    tasteDimensions.killDiscipline += session.tasteReasoningDims.killDiscipline;
    tasteDimensions.edgeCaseInstinct += session.tasteReasoningDims.edgeCaseInstinct;
  }
  tasteDimensions.frameRecognition = Math.max(0, Math.min(8, tasteDimensions.frameRecognition));
  tasteDimensions.killDiscipline = Math.max(0, Math.min(6, tasteDimensions.killDiscipline));
  tasteDimensions.edgeCaseInstinct = Math.max(0, Math.min(8, tasteDimensions.edgeCaseInstinct));
  const tasteSignature = getTasteSignature(tasteDimensions);
  const tasteTotal = tasteDimensions.frameRecognition + tasteDimensions.killDiscipline + tasteDimensions.edgeCaseInstinct;
  const { verdict, composite } = calculateVerdict(layerScores, tasteSignature);
  const bindingConstraint = findBindingConstraint(layerScores);
  const actionPlan = generateActions(bindingConstraint, layerScores, verdict, session);
  const constraintExplanation = bindingConstraint
    ? CONSTRAINT_EXPLANATIONS[bindingConstraint]
    : 'No binding constraint identified — your readiness is balanced across all layers. Focus on raising all layers together rather than fixing one bottleneck.';
  const verdictSummary = getVerdictSummary(verdict, bindingConstraint);
  const verdictFraming = getVerdictFraming(verdict);
  const tasteCharacterization = getTasteCharacterization(tasteDimensions);

  return {
    layerScores,
    tasteDimensions,
    tasteTotal,
    tasteSignature,
    tasteCharacterization,
    verdict,
    composite,
    bindingConstraint,
    constraintExplanation,
    verdictSummary,
    verdictFraming,
    actionPlan,
    modulesAssessed: session.modules,
    moduleDepths: session.moduleDepths,
  };
}

// Count total questions for progress tracking
function getTotalQuestions(session) {
  let total = TIER1_QUESTIONS.length + TASTE_QUESTIONS.length;
  for (const mod of session.modules) {
    const depthFilter = session.moduleDepths[mod] === 'shallow' ? 'shallow' : null;
    total += getModuleQuestions(mod, depthFilter).length;
  }
  // Include adaptive follow-up questions once determined
  if (session.adaptiveFollowUp && session.adaptiveFollowUp.pending.length) {
    for (const layer of session.adaptiveFollowUp.pending) {
      const allQs = getModuleQuestions(layer, null);
      const answeredIds = new Set(session.layerResponses[layer].map(r => r.questionId));
      const unanswered = allQs.filter(q => !answeredIds.has(q.id));
      total += Math.min(2, unanswered.length);
    }
  }
  return total;
}

function getAnsweredCount(session) {
  let count = Object.keys(session.pulseAnswers).length;
  for (const responses of Object.values(session.layerResponses)) {
    count += responses.length;
  }
  count += session.tasteResponses.length;
  return count;
}

// ─── CU2 Open-Ended Response Analysis ───────────────────

async function analyzeCU2Response(session, freeText) {
  session.cu2FreeText = freeText;
  session.cu2Bonus = 0;

  try {
    if (!window.AssessmentAPI || !window.AssessmentAPI.callAssessmentAPI) return 0;

    const systemPrompt = 'You are analyzing a free-text response from an AI readiness assessment. The user was asked to describe an AI initiative that didn\'t work and what they learned. Analyze their response for three signals:\n- Specificity: Do they name a real project with concrete details, or give a vague answer? (0-2 points)\n- Accountability: Do they own the failure or blame external factors? (0-2 points)\n- Learning signal: Do they describe what actually changed as a result? (0-2 points)\nRespond with ONLY a JSON object: {"specificity": 0, "accountability": 0, "learning": 0, "summary": "one sentence assessment"}';

    const result = await window.AssessmentAPI.callAssessmentAPI({
      system: systemPrompt,
      messages: [{ role: 'user', content: freeText }],
      model: 'claude-sonnet-4-20250514',
    });

    if (!result) return 0;

    const jsonMatch = result.match(/\{[^}]+\}/);
    if (!jsonMatch) return 0;

    const parsed = JSON.parse(jsonMatch[0]);
    const clamp = (v) => Math.max(0, Math.min(2, Math.round(v) || 0));
    const specificity = clamp(parsed.specificity);
    const accountability = clamp(parsed.accountability);
    const learning = clamp(parsed.learning);
    const total = specificity + accountability + learning;

    // Map total (0-6) to culture score bonus
    let bonus = 0;
    if (total >= 5) bonus = 2;
    else if (total >= 3) bonus = 1;

    session.cu2Bonus = bonus;
    session.cu2Analysis = { specificity, accountability, learning, summary: parsed.summary || '' };
    return bonus;
  } catch {
    return 0;
  }
}

// ─── Brief Context Builder ───────────────────────────────

function buildBriefContext(session, results) {
  const allQuestions = [
    ...TIER1_QUESTIONS,
    ...FOUNDATION_QUESTIONS,
    ...ARCHITECTURE_QUESTIONS,
    ...ACCOUNTABILITY_QUESTIONS,
    ...CULTURE_QUESTIONS,
    ...TASTE_QUESTIONS,
  ];
  const questionMap = {};
  for (const q of allQuestions) {
    questionMap[q.id] = q;
  }

  const lines = [];

  // Tier 1 context
  const p1 = session.pulseAnswers.P1;
  const p2 = session.pulseAnswers.P2;
  const p3 = session.pulseAnswers.P3;
  const p4 = session.pulseAnswers.P4;
  const p6 = session.pulseAnswers.P6;
  const p7 = session.pulseAnswers.P7;
  const p1Q = questionMap.P1;
  const p2Q = questionMap.P2;
  const p3Q = questionMap.P3;
  const p4Q = questionMap.P4;
  const p6Q = questionMap.P6;
  const p7Q = questionMap.P7;

  lines.push('=== CONTEXT ===');
  lines.push('Industry: ' + (p3Q.options.find(o => o.key === p3)?.text || p3));
  lines.push('Role: ' + (p1Q.options.find(o => o.key === p1)?.text || p1));
  lines.push('Maturity Stage: ' + (p2Q.options.find(o => o.key === p2)?.text || p2));
  lines.push('Primary Concern: ' + (p4Q.options.find(o => o.key === p4)?.text || p4));
  if (p6 && p6Q) lines.push('Active AI Initiatives: ' + (p6Q.options.find(o => o.key === p6)?.text || p6));
  if (p7 && p7Q) lines.push('Organization Size: ' + (p7Q.options.find(o => o.key === p7)?.text || p7));
  lines.push('');

  // All answered questions with selected options
  lines.push('=== ANSWERS ===');

  // Tier 1 pulse answers
  for (const [qId, answer] of Object.entries(session.pulseAnswers)) {
    const q = questionMap[qId];
    if (!q) continue;
    const useLowDepth = session.knowledgeDepth === 'low' && q.lowDepthVariant;
    const qText = useLowDepth ? q.lowDepthVariant.text : q.text;
    const opts = useLowDepth ? q.lowDepthVariant.options : q.options;
    const selected = opts.find(o => o.key === answer);
    lines.push(qId + ': ' + qText);
    lines.push('  → ' + (selected?.text || answer));
  }

  // Tier 2 layer responses
  for (const [layer, responses] of Object.entries(session.layerResponses)) {
    for (const r of responses) {
      const q = questionMap[r.questionId];
      if (!q) continue;
      const useLowDepth = session.knowledgeDepth === 'low' && q.lowDepthVariant;
      const qText = useLowDepth ? q.lowDepthVariant.text : q.text;
      const opts = useLowDepth ? q.lowDepthVariant.options : q.options;
      const selected = opts.find(o => o.key === r.answer);
      lines.push(r.questionId + ' (' + layer + '): ' + qText);
      lines.push('  → ' + (selected?.text || r.answer));
    }
  }

  // Tier 3 taste responses
  for (const r of session.tasteResponses) {
    const q = questionMap[r.questionId];
    if (!q) continue;
    const selected = q.options.find(o => o.key === r.answer);
    lines.push(r.questionId + ' (taste): ' + q.text);
    lines.push('  → ' + (selected?.text || r.answer));
  }

  // Follow-up responses
  for (const [fuId, fu] of Object.entries(session.followUpResponses)) {
    lines.push(fuId + ' (follow-up to ' + fu.parentQuestionId + '): → ' + fu.answer);
  }

  lines.push('');
  lines.push('=== ASSESSMENT DEPTH ===');
  const depths = results.moduleDepths || session.moduleDepths || {};
  const deepLayers = Object.entries(depths).filter(([, d]) => d === 'deep').map(([l]) => l);
  const shallowLayers = Object.entries(depths).filter(([, d]) => d === 'shallow').map(([l]) => l);
  lines.push('Deeply assessed layers (full question set): ' + (deepLayers.length ? deepLayers.join(', ') : 'none'));
  lines.push('Quickly assessed layers (core questions only, lower confidence): ' + (shallowLayers.length ? shallowLayers.join(', ') : 'none'));

  lines.push('');
  lines.push('=== SCORES ===');
  const allLayers = ['foundation', 'architecture', 'accountability', 'culture'];
  for (const layer of allLayers) {
    const score = results.layerScores[layer];
    const depthNote = depths[layer] === 'shallow' ? ' (quick assessment)' : '';
    lines.push(layer.charAt(0).toUpperCase() + layer.slice(1) + ': ' + (score !== null ? score + '/100' + depthNote : 'Not assessed'));
  }
  lines.push('Composite: ' + results.composite + '/100');
  lines.push('Verdict: ' + results.verdict);
  lines.push('Binding Constraint: ' + (results.bindingConstraint || 'None'));

  lines.push('');
  lines.push('=== TASTE PROFILE ===');
  lines.push('Taste Signature: ' + results.tasteSignature.name);
  lines.push('Frame Recognition: ' + results.tasteDimensions.frameRecognition + '/8');
  lines.push('Kill Discipline: ' + results.tasteDimensions.killDiscipline + '/6');
  lines.push('Edge-Case Instinct: ' + results.tasteDimensions.edgeCaseInstinct + '/8');
  if (results.tasteSignature.consistencyModifier) {
    lines.push('Consistency Modifier: ' + results.tasteSignature.consistencyModifier);
  }

  // CU2 free-text analysis
  if (session.cu2FreeText) {
    lines.push('');
    lines.push('=== CU2 FREE-TEXT RESPONSE ===');
    lines.push('Response: ' + session.cu2FreeText);
    if (session.cu2Analysis) {
      lines.push('Analysis — Specificity: ' + session.cu2Analysis.specificity + '/2, Accountability: ' + session.cu2Analysis.accountability + '/2, Learning: ' + session.cu2Analysis.learning + '/2');
      if (session.cu2Analysis.summary) lines.push('Summary: ' + session.cu2Analysis.summary);
    }
  }

  // Adaptive follow-up free-text
  if (session.adaptiveFreeText && Object.keys(session.adaptiveFreeText).length) {
    lines.push('');
    lines.push('=== ADAPTIVE FOLLOW-UP FREE-TEXT ===');
    for (const [layer, text] of Object.entries(session.adaptiveFreeText)) {
      lines.push(layer.charAt(0).toUpperCase() + layer.slice(1) + ': ' + text);
    }
  }

  // Post-results reflection
  if (session.reflectionResponse) {
    lines.push('');
    lines.push('=== POST-RESULTS REFLECTION ===');
    lines.push('What surprised them: ' + session.reflectionResponse);
  }

  // Taste reasoning selections
  if (session.tasteReasoningSelections || session.tasteReasoningDims) {
    lines.push('');
    lines.push('=== TASTE REASONING ===');
    if (session.tasteReasoningDims) {
      lines.push('Reasoning adjustments — FR: ' + session.tasteReasoningDims.frameRecognition + ', KD: ' + session.tasteReasoningDims.killDiscipline + ', EC: ' + session.tasteReasoningDims.edgeCaseInstinct);
    }
  }

  return lines.join('\n');
}

// Expose engine API on window for non-module usage
window.AssessmentEngine = {
  createSession,
  getNextQuestion,
  recordAnswer,
  recordFollowUp,
  recordTasteReasoning,
  analyzeCU2Response,
  computeResults,
  getTotalQuestions,
  getAnsweredCount,
  TASTE_REASONING,
  TASTE_LEADINS,
  buildBriefContext,
  ADAPTIVE_MICRO_PROMPTS,
  getModuleQuestions,
};
})();
