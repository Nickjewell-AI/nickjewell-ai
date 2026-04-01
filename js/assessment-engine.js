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
      { key: 'A', text: "I'm the one making AI decisions for us" },
      { key: 'B', text: "I'm figuring out whether AI makes sense for us" },
      { key: 'C', text: "I'm hands-on building or implementing AI projects" },
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
      { key: 'A', text: "One primary system, API-ready — someone could query it by end of day", score: 4 },
      { key: 'B', text: "A few systems that someone on the team knows how to join with a script or weekly export", score: 3 },
      { key: 'C', text: "Spreadsheets, legacy systems, tribal knowledge — you'd spend weeks just finding it all", score: 1 },
      { key: 'D', text: "I genuinely wouldn't know where to start looking", score: 0 },
      { key: 'E', text: "Depends which part of the org — some teams are clean, others are a mess", score: 2 },
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
      { key: 'A', text: "Yes — specific people own it, and there are consequences when it's violated", score: 4 },
      { key: 'B', text: "There's a policy document somewhere, but I couldn't tell you who enforces it", score: 1 },
      { key: 'C', text: "It's in progress — someone's been assigned to it", score: 2 },
      { key: 'D', text: "No, or I've never seen one", score: 0 },
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
      { key: 'A', text: "Yes — we hit a wall, traced it to the source, and fixed the pipeline", score: 4 },
      { key: 'B', text: "Yes — it keeps coming up and we keep working around it", score: 2 },
      { key: 'C', text: "Not yet, but mostly because we haven't pushed far enough to find out", score: 1 },
      { key: 'D', text: "No — our data consistently passes quality checks", score: 3 },
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
      { key: 'A', text: "Yes — we have current documentation that matches how work actually flows", score: 4 },
      { key: 'B', text: "I could draw the main path, but there are handoffs and workarounds I'd have to ask around about", score: 3 },
      { key: 'C', text: "Rough sketch at best — half of it runs on informal agreements and someone's Slack messages", score: 1 },
      { key: 'D', text: "No — I'd be guessing at most of it", score: 0 },
      { key: 'E', text: "Some workflows are well-mapped, others are black boxes depending on the team", score: 2 },
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
      { key: 'A', text: "Within the last year — we rethought how it works, not just tweaked it", score: 4 },
      { key: 'B', text: "1–3 years ago", score: 3 },
      { key: 'C', text: "Longer ago, or never — we patch what we have", score: 1 },
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
      { key: 'A', text: "No — if someone quit tomorrow, the critical stuff keeps running", score: 4 },
      { key: 'B', text: "One or two, but they're not the important stuff", score: 3 },
      { key: 'C', text: "Yes — there's at least one person whose vacation makes everyone nervous", score: 1 },
      { key: 'D', text: "I'm not sure, which probably means yes", score: 0 },
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
      { key: 'A', text: "I can name the person — they have authority to act and they'd answer the phone", score: 4 },
      { key: 'B', text: "There's an on-call rotation with clear escalation paths", score: 4 },
      { key: 'C', text: "I'd have to make some calls to figure out who owns it", score: 1 },
      { key: 'D', text: "It would wait for the next governance meeting", score: 0 },
      { key: 'E', text: "The org has a process for this, but I personally couldn't tell you who gets called", score: 2 },
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
      { key: 'A', text: "Yes — someone pulled the plug and was backed, not blamed", score: 4 },
      { key: 'B', text: "Yes — but it took too long and there were political casualties", score: 2 },
      { key: 'C', text: "No — things tend to run until the budget runs out or the sponsor moves on", score: 0 },
      { key: 'D', text: "Not that I know of", score: 0 },
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
      { key: 'A', text: "Yes — written kill criteria before anything launches", score: 4 },
      { key: 'B', text: "Not formally, but the team would recognize failure when they saw it", score: 2 },
      { key: 'C', text: "No — we figure it out as we go and adjust", score: 1 },
      { key: 'D', text: "I don't think that conversation happens", score: 0 },
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
      { key: 'A', text: "Yes — people's actual jobs look different now, not just their toolbars", score: 4 },
      { key: 'B', text: "We've added AI tools, but everyone's still doing the same work the same way", score: 1 },
      { key: 'C', text: "We're planning to, but it hasn't happened yet", score: 2 },
      { key: 'D', text: "No", score: 0 },
      { key: 'E', text: "In some pockets yes, but most of the org hasn't felt it yet", score: 2 },
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
      { key: 'A', text: "Yes — I can name the project, what went wrong, and what we changed because of it", score: 4 },
      { key: 'B', text: "Everything we've tried has worked", score: 0 },
      { key: 'C', text: "We haven't tried enough to have a real failure yet", score: 2 },
      { key: 'D', text: "Failures have happened, but they got quietly shelved — nobody talks about them", score: 1 },
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
      { key: 'A', text: "They'd be heard — someone would ask 'tell me more' regardless of their title", score: 4 },
      { key: 'B', text: "Depends who says it — a VP gets listened to, a manager gets steamrolled", score: 2 },
      { key: 'C', text: "It would be unwelcome — the room would move past it quickly", score: 1 },
      { key: 'D', text: "Nobody's going to be the person who slows this down", score: 0 },
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

// ─── Industry-Specific Option Variants ───────────────────
// Maps P3 industry key to question-level option overrides.
// Scores are identical to generic options — only text changes.
// CU2 excluded (special free-text handling).

const INDUSTRY_OPTIONS = {
  // P3 key 'B' = Healthcare
  B: {
    F1: [
      { key: 'A', text: "One EMR system, API-ready — our clinical data team could query it by end of day", score: 4 },
      { key: 'B', text: "Patient records in the EMR, billing in a separate system, referrals tracked in someone's Outlook inbox", score: 3 },
      { key: 'C', text: "Paper charts still being scanned, three different EMR instances from past acquisitions, and a billing system from 2011", score: 1 },
      { key: 'D', text: "I genuinely wouldn't know where to start — clinical, billing, and operational data are all different worlds here", score: 0 },
      { key: 'E', text: "Depends on the department — radiology is clean, but primary care is a mess and behavioral health is basically paper", score: 2 },
    ],
    F2: [
      { key: 'A', text: "Yes — our compliance officer owns it, and there are consequences when it's violated", score: 4 },
      { key: 'B', text: "We have HIPAA policies, but data governance beyond compliance? I couldn't tell you who owns that", score: 1 },
      { key: 'C', text: "Our CMIO is building one — it's in progress", score: 2 },
      { key: 'D', text: "We have HIPAA basics but nothing about how data flows between clinical and operational systems", score: 0 },
    ],
    F3: [
      { key: 'A', text: "We have ongoing data quality dashboards — our clinical informatics team reviews them weekly", score: 4 },
      { key: 'B', text: "We did a data audit when we migrated EMR systems, but that was years ago", score: 2 },
      { key: 'C', text: "We know there are quality issues — duplicate patient records, missing fields, inconsistent coding — but nobody's done a formal audit", score: 1 },
      { key: 'D', text: "I don't think anyone has ever looked at it from an AI-readiness perspective", score: 0 },
    ],
    A1: [
      { key: 'A', text: "We have standard interfaces and an integration engine — new connections take days, not months", score: 4 },
      { key: 'B', text: "Our IT team has done integrations before, but each one is a custom project — usually takes a quarter", score: 3 },
      { key: 'C', text: "We'd probably need to build a manual export process — our systems don't talk to each other easily", score: 1 },
      { key: 'D', text: "We've never connected an external tool to our clinical systems — I'm not sure it's even allowed", score: 0 },
      { key: 'E', text: "Some departments have modern connections, others are running systems that predate our current leadership", score: 2 },
    ],
    A2: [
      { key: 'A', text: "Cloud-hosted EMR, modern data warehouse, our infrastructure team would welcome it", score: 4 },
      { key: 'B', text: "Mostly stable, but we're still running some legacy clinical systems that require workarounds", score: 2 },
      { key: 'C', text: "We're mid-migration — half the org is on the new system, half is still on the old one", score: 1 },
      { key: 'D', text: "We're on systems that were implemented before meaningful use — everything is a workaround", score: 0 },
    ],
    A3: [
      { key: 'A', text: "Our clinical informatics team and IT could start scoping within a week", score: 4 },
      { key: 'B', text: "We'd need to hire or contract — we have clinical domain experts but no AI/ML talent", score: 2 },
      { key: 'C', text: "We'd start vendor shopping — building internally isn't realistic", score: 1 },
      { key: 'D', text: "We'd form a committee to figure out what to do", score: 0 },
    ],
    AC1: [
      { key: 'A', text: "A specific clinical leader with budget authority and performance metrics tied to it", score: 4 },
      { key: 'B', text: "Probably the practice manager or department head, but it hasn't been formally decided", score: 2 },
      { key: 'C', text: "It would likely be shared between clinical leadership and IT — which means nobody owns it", score: 1 },
      { key: 'D', text: "Whoever the vendor assigns as our account manager, realistically", score: 0 },
      { key: 'E', text: "Depends on the department — some have strong clinical informatics leads, others have nobody", score: 2 },
    ],
    AC2: [
      { key: 'A', text: "Our clinical governance framework has a defined process for adverse events — AI errors would follow the same path", score: 4 },
      { key: 'B', text: "Someone would escalate it, but there's no formal protocol for AI-specific errors", score: 2 },
      { key: 'C', text: "It would probably get handled informally — the physician would override it and move on", score: 1 },
      { key: 'D', text: "I'm not sure anyone has thought about that scenario", score: 0 },
    ],
    AC3: [
      { key: 'A', text: "Defined clinical outcomes, patient satisfaction scores, and operational efficiency metrics with baselines already in place", score: 4 },
      { key: 'B', text: "We'd track usage and adoption, but tying it to clinical outcomes would be harder", score: 2 },
      { key: 'C', text: "Leadership would ask 'is it working?' and someone would put together a slide deck", score: 1 },
      { key: 'D', text: "We'd probably know it's working if nobody complains", score: 0 },
    ],
    CU1: [
      { key: 'A', text: "We've already piloted tools with willing departments — adoption varied but the process exists", score: 4 },
      { key: 'B', text: "Some physicians are excited, nursing staff is skeptical, administration just wants efficiency", score: 2 },
      { key: 'C', text: "The last time IT changed a clinical workflow, it took two years of fighting — this would be worse", score: 1 },
      { key: 'D', text: "AI is a buzzword leadership uses in board meetings — the floor staff hasn't heard a real plan", score: 0 },
      { key: 'E', text: "Larger departments or specialty groups would embrace it — smaller teams would resist", score: 2 },
    ],
    CU3: [
      { key: 'A', text: "Their concerns would be heard and taken seriously — patient safety always wins", score: 4 },
      { key: 'B', text: "Depends on who said it — an attending would be heard, a resident might not be", score: 2 },
      { key: 'C', text: "It probably wouldn't be welcome — leadership has committed to the AI initiative publicly", score: 1 },
      { key: 'D', text: "Nobody would push back — 'innovation' is seen as inevitable here", score: 0 },
    ],
  },
  // P3 key 'A' = Financial Services
  A: {
    F1: [
      { key: 'A', text: "One core banking or CRM system, API-ready — our data team could query it by end of day", score: 4 },
      { key: 'B', text: "Client records in the CRM, transaction data in the core system, compliance docs in a shared drive nobody trusts", score: 3 },
      { key: 'C', text: "Spreadsheets, legacy mainframe reports, and relationship data that lives in bankers' heads", score: 1 },
      { key: 'D', text: "I genuinely wouldn't know where to start — client, transaction, and risk data are all different systems owned by different teams", score: 0 },
      { key: 'E', text: "Depends on the business line — wealth management is clean, lending is a mess, compliance is somewhere in between", score: 2 },
    ],
    F2: [
      { key: 'A', text: "Yes — our risk and compliance team owns it, and regulatory exams keep it enforced", score: 4 },
      { key: 'B', text: "We have regulatory compliance policies, but data governance beyond what the regulators require? That's murky", score: 1 },
      { key: 'C', text: "Our Chief Data Officer is building one — it's in progress", score: 2 },
      { key: 'D', text: "We meet regulatory minimums but nobody owns how data actually flows between front office and back office", score: 0 },
    ],
    F3: [
      { key: 'A', text: "We have ongoing reconciliation processes — our operations team catches mismatches daily", score: 4 },
      { key: 'B', text: "We did a data cleanup when we switched core platforms, but that was years ago", score: 2 },
      { key: 'C', text: "We know there are issues — duplicate accounts, inconsistent coding, fields that advisors skip — but nobody's audited it holistically", score: 1 },
      { key: 'D', text: "I don't think anyone has ever looked at it from an AI-readiness perspective", score: 0 },
    ],
    A1: [
      { key: 'A', text: "Our systems already connect — adding a new tool is a matter of weeks, not months", score: 4 },
      { key: 'B', text: "We've connected systems before, but each one is a project that involves compliance review and takes a quarter", score: 3 },
      { key: 'C', text: "Our systems don't really talk to each other — connecting anything new means manual exports and workarounds", score: 1 },
      { key: 'D', text: "We've never connected an outside tool to our client systems — between security and compliance, I don't know where we'd start", score: 0 },
      { key: 'E', text: "Online banking and client-facing tools are modern, but the back office runs on systems nobody wants to touch", score: 2 },
    ],
    A2: [
      { key: 'A', text: "Modern systems, regularly updated — our technology team keeps things current", score: 4 },
      { key: 'B', text: "Core systems work, but we're carrying older platforms that require daily workarounds", score: 2 },
      { key: 'C', text: "We're mid-upgrade — half the firm is on the new platform, half is still on the old one", score: 1 },
      { key: 'D', text: "Our systems haven't been rethought in over a decade — everything runs on habit and workarounds", score: 0 },
    ],
    A3: [
      { key: 'A', text: "We have a technology team that could start scoping and prototyping within weeks", score: 4 },
      { key: 'B', text: "We'd need to hire or partner — we have people who understand the business but nobody with AI experience", score: 2 },
      { key: 'C', text: "We'd look for a vendor — building anything custom isn't realistic for us", score: 1 },
      { key: 'D', text: "We'd talk about it for a quarter and then probably table it", score: 0 },
    ],
    AC1: [
      { key: 'A', text: "A specific business line leader with P&L responsibility and metrics tied to outcomes", score: 4 },
      { key: 'B', text: "Probably the COO or head of operations, but it hasn't been formally decided", score: 2 },
      { key: 'C', text: "It would be shared between the business line and technology — which means nobody really owns it", score: 1 },
      { key: 'D', text: "Whoever the vendor assigns as our account manager, realistically", score: 0 },
      { key: 'E', text: "Depends on the business line — some have strong analytics leads, others have nobody thinking about this", score: 2 },
    ],
    AC2: [
      { key: 'A', text: "Our operational risk framework has a defined process — AI errors would follow the same escalation path", score: 4 },
      { key: 'B', text: "Someone would escalate it, but there's no formal protocol for AI-specific errors versus normal operational errors", score: 2 },
      { key: 'C', text: "It would get handled case by case — whoever notices fixes it and moves on", score: 1 },
      { key: 'D', text: "I'm not sure anyone has thought about that scenario", score: 0 },
    ],
    AC3: [
      { key: 'A', text: "Defined KPIs — revenue impact, processing time reduction, error rate — with baselines already measured", score: 4 },
      { key: 'B', text: "We'd track adoption and usage, but tying it to revenue or risk reduction would be harder to isolate", score: 2 },
      { key: 'C', text: "Someone would put together a quarterly deck showing 'progress' without clear attribution", score: 1 },
      { key: 'D', text: "We'd probably know it's working if the regulators don't flag it", score: 0 },
    ],
    CU1: [
      { key: 'A', text: "We've already piloted tools with willing teams — adoption varied but the process exists", score: 4 },
      { key: 'B', text: "Front-line staff are excited, compliance is nervous, operations just wants fewer manual processes", score: 2 },
      { key: 'C', text: "The last time we changed a core workflow, it took 18 months of change management — this would be worse", score: 1 },
      { key: 'D', text: "AI is something leadership mentions in earnings calls — the people doing the work haven't seen a real plan", score: 0 },
      { key: 'E', text: "Client-facing teams would embrace it, back-office teams would resist — two different cultures in one firm", score: 2 },
    ],
    CU3: [
      { key: 'A', text: "Their concerns would be heard and acted on — client trust isn't something we gamble with", score: 4 },
      { key: 'B', text: "Depends on who said it — a managing director would be heard, a junior analyst might not be", score: 2 },
      { key: 'C', text: "It probably wouldn't be welcome — leadership has committed to the initiative publicly", score: 1 },
      { key: 'D', text: "Nobody would push back — 'digital transformation' is treated as inevitable here", score: 0 },
    ],
  },
  // P3 key 'C' = Technology/SaaS
  C: {
    F1: [
      { key: 'A', text: "Centralized data warehouse or lakehouse, fully instrumented — our data eng team queries it daily", score: 4 },
      { key: 'B', text: "Product analytics in one tool, customer data in CRM, engineering metrics in Jira — three teams, three truths", score: 3 },
      { key: 'C', text: "Half our data is in logs nobody parses, the other half is in dashboards nobody trusts", score: 1 },
      { key: 'D', text: "Every team has their own data stack and nobody's mapped how they connect", score: 0 },
      { key: 'E', text: "Product data is pristine, but sales and customer success data is a mess — engineering built for themselves, not the company", score: 2 },
    ],
    F2: [
      { key: 'A', text: "Yes — we have data owners per domain with SLAs on freshness and accuracy", score: 4 },
      { key: 'B', text: "We have a data team, but governance is 'whoever built the pipeline owns it' — and some of those people left", score: 1 },
      { key: 'C', text: "Our new head of data is building governance — it's in progress", score: 2 },
      { key: 'D', text: "Move fast and break things is still the operating philosophy — governance feels like overhead", score: 0 },
    ],
    F3: [
      { key: 'A', text: "We have automated data quality checks in our pipelines — alerts fire when something drifts", score: 4 },
      { key: 'B', text: "We did a big cleanup when we migrated to the new stack, but drift has crept back in", score: 2 },
      { key: 'C', text: "We know there are quality issues — stale records, inconsistent naming, orphaned tables — but nobody owns the fix", score: 1 },
      { key: 'D', text: "I don't think anyone has looked at our data from an AI-readiness lens", score: 0 },
    ],
    A1: [
      { key: 'A', text: "REST APIs everywhere, event-driven architecture — connecting a new tool is a sprint task", score: 4 },
      { key: 'B', text: "We have APIs for our product, but internal systems are patchwork — connecting them takes real engineering time", score: 3 },
      { key: 'C', text: "We'd need to build custom integrations — our internal tools weren't designed with extensibility in mind", score: 1 },
      { key: 'D', text: "Our stack has grown organically — integrating anything new means untangling years of tech debt first", score: 0 },
      { key: 'E', text: "Customer-facing APIs are solid, internal tooling is held together with scripts and cron jobs", score: 2 },
    ],
    A2: [
      { key: 'A', text: "Modern cloud-native stack, CI/CD, infrastructure as code — we'd welcome AI tooling", score: 4 },
      { key: 'B', text: "Core product is solid, but internal tools and dev infrastructure have accumulated debt", score: 2 },
      { key: 'C', text: "We're mid-replatforming — some services are on the new architecture, some are legacy monolith", score: 1 },
      { key: 'D', text: "Our architecture hasn't been rethought since the Series A — everything is duct tape and heroics", score: 0 },
    ],
    A3: [
      { key: 'A', text: "Our engineering team has ML experience and could prototype within a sprint", score: 4 },
      { key: 'B', text: "We'd need to hire ML engineers — our team is strong on product but hasn't done AI/ML work", score: 2 },
      { key: 'C', text: "We'd evaluate vendor APIs — building from scratch isn't realistic at our stage", score: 1 },
      { key: 'D', text: "We'd debate build vs. buy for a quarter and then probably do nothing", score: 0 },
    ],
    AC1: [
      { key: 'A', text: "A specific product or engineering leader with clear ownership and success metrics", score: 4 },
      { key: 'B', text: "Probably the CTO or VP of Engineering, but nobody's been formally assigned", score: 2 },
      { key: 'C', text: "It would be a cross-functional initiative — which means it lives in everyone's backlog and nobody's roadmap", score: 1 },
      { key: 'D', text: "Whoever's most excited about AI would probably volunteer and run with it", score: 0 },
      { key: 'E', text: "Some teams have strong technical leads who'd own it, others would need direction from above", score: 2 },
    ],
    AC2: [
      { key: 'A', text: "We have incident response processes — an AI failure would go through the same on-call and postmortem pipeline", score: 4 },
      { key: 'B', text: "Someone would file a bug, but there's no formal process for AI-specific failures vs. regular product bugs", score: 2 },
      { key: 'C', text: "The engineer who built it would debug it — it's all tribal knowledge", score: 1 },
      { key: 'D', text: "I'm not sure anyone has thought about what happens when an AI feature breaks in production", score: 0 },
    ],
    AC3: [
      { key: 'A', text: "Defined product metrics — engagement lift, churn reduction, efficiency gain — with A/B testing infrastructure", score: 4 },
      { key: 'B', text: "We'd track feature adoption, but isolating AI's impact from other changes would be hard", score: 2 },
      { key: 'C', text: "We'd launch it, watch Slack for complaints, and call it a success if nothing blows up", score: 1 },
      { key: 'D', text: "We'd know it's working if the CEO stops asking about AI in all-hands", score: 0 },
    ],
    CU1: [
      { key: 'A', text: "We've already shipped AI features — the team is comfortable iterating on them", score: 4 },
      { key: 'B', text: "Engineers are excited, PMs are cautious about scope, leadership wants it in everything", score: 2 },
      { key: 'C', text: "Last time we introduced a major new technology, half the team resisted and the other half over-engineered it", score: 1 },
      { key: 'D', text: "AI is a roadmap bullet point — nobody on the team has actually built with it", score: 0 },
      { key: 'E', text: "Backend and data teams are ready, front-end and design teams haven't been included in the conversation", score: 2 },
    ],
    CU3: [
      { key: 'A', text: "Their concerns would block the release — we don't ship what the team isn't confident in", score: 4 },
      { key: 'B', text: "Depends on the deadline and who's pushing for the feature", score: 2 },
      { key: 'C', text: "It probably wouldn't stop the launch — leadership has promised customers this feature", score: 1 },
      { key: 'D', text: "Nobody would push back — AI features are seen as competitive table stakes", score: 0 },
    ],
  },
  // P3 key 'F' = Professional Services
  F: {
    F1: [
      { key: 'A', text: "Centralized CRM and project management system — we can pull client and engagement data same day", score: 4 },
      { key: 'B', text: "Client data in CRM, project hours in a different system, actual deliverables in email threads and shared drives", score: 3 },
      { key: 'C', text: "Partner relationships live in people's heads, engagement data lives in custom spreadsheets per team, billing is its own world", score: 1 },
      { key: 'D', text: "Every practice area has their own way of tracking everything — there's no single source of truth for anything", score: 0 },
      { key: 'E', text: "Some practice areas are disciplined about CRM, others haven't logged a client interaction in months", score: 2 },
    ],
    F2: [
      { key: 'A', text: "Yes — our COO owns it, and there are firm-wide standards for how client data is handled", score: 4 },
      { key: 'B', text: "We have client confidentiality policies, but governance on internal data? Nobody owns that", score: 1 },
      { key: 'C', text: "A new operations leader is building data standards — it's in progress", score: 2 },
      { key: 'D', text: "Each partner runs their practice their way — firm-wide data governance would be seen as overhead", score: 0 },
    ],
    F3: [
      { key: 'A', text: "We have regular reviews of client data quality — our operations team flags issues proactively", score: 4 },
      { key: 'B', text: "We cleaned up the CRM during our last platform migration, but it's degraded since", score: 2 },
      { key: 'C', text: "We know CRM data is unreliable — stale contacts, duplicates, missing fields — but nobody's assigned to fix it", score: 1 },
      { key: 'D', text: "I don't think anyone has ever looked at our data quality beyond whether invoices go out correctly", score: 0 },
    ],
    A1: [
      { key: 'A', text: "Our systems connect through standard integrations — adding a new tool fits into our existing workflow", score: 4 },
      { key: 'B', text: "We've connected tools before, but it's always a custom project that takes longer than expected", score: 3 },
      { key: 'C', text: "We'd need to manually export data — our systems were purchased independently and don't connect", score: 1 },
      { key: 'D', text: "We're running on email, spreadsheets, and willpower — 'integration' isn't in our vocabulary", score: 0 },
      { key: 'E', text: "Client-facing tools are integrated, but internal operations run on disconnected systems bought by different partners", score: 2 },
    ],
    A2: [
      { key: 'A', text: "Modern cloud platforms, our technology team keeps things current", score: 4 },
      { key: 'B', text: "Our core systems work, but we're carrying legacy platforms from a merger that never got fully integrated", score: 2 },
      { key: 'C', text: "We're mid-transition — half the firm is on new tools, half is still on old ones", score: 1 },
      { key: 'D', text: "We're running on platforms that were set up when the firm was a third of its current size", score: 0 },
    ],
    A3: [
      { key: 'A', text: "Our technology and innovation team could prototype within weeks", score: 4 },
      { key: 'B', text: "We'd need to hire or partner — we have domain expertise but no internal AI capability", score: 2 },
      { key: 'C', text: "We'd look for a vendor solution — building isn't realistic for a firm our size", score: 1 },
      { key: 'D', text: "We'd talk about it at the next partners' meeting and table it for Q3", score: 0 },
    ],
    AC1: [
      { key: 'A', text: "A specific practice leader or managing director with clear ownership and success metrics", score: 4 },
      { key: 'B', text: "Probably the managing partner or COO, but nobody's been formally assigned", score: 2 },
      { key: 'C', text: "It would need buy-in from multiple partners — which means nobody moves until everyone agrees", score: 1 },
      { key: 'D', text: "Whoever's most interested in AI would probably volunteer and do it on the side", score: 0 },
      { key: 'E', text: "Some practice areas have innovation-minded leaders, others would need to be convinced", score: 2 },
    ],
    AC2: [
      { key: 'A', text: "We have a defined process for engagement issues — technology failures would follow the same escalation", score: 4 },
      { key: 'B', text: "Someone would raise it with the practice leader, but there's no formal process for AI-specific issues", score: 2 },
      { key: 'C', text: "The consultant who set it up would troubleshoot — it's all individual knowledge", score: 1 },
      { key: 'D', text: "I'm not sure anyone has considered what happens when an AI tool gives a client bad output", score: 0 },
    ],
    AC3: [
      { key: 'A', text: "Defined metrics — utilization lift, time-to-deliverable, client satisfaction — with baselines already measured", score: 4 },
      { key: 'B', text: "We'd track whether consultants use it, but measuring impact on client outcomes would be hard", score: 2 },
      { key: 'C', text: "A partner would present results at the quarterly meeting based on anecdotes", score: 1 },
      { key: 'D', text: "We'd probably know it's working if the team complains less", score: 0 },
    ],
    CU1: [
      { key: 'A', text: "We've already piloted AI tools with willing teams — some adopted, some didn't, but the process exists", score: 4 },
      { key: 'B', text: "Junior staff would embrace it, senior partners are skeptical, middle management is waiting to see what leadership does", score: 2 },
      { key: 'C', text: "The last time we introduced new methodology or tools, it took years of convincing and half the firm still doesn't use it", score: 1 },
      { key: 'D', text: "AI is something we advise clients on — we haven't seriously considered it for ourselves", score: 0 },
      { key: 'E', text: "Innovation-focused practice areas would adopt quickly, traditional practices wouldn't touch it", score: 2 },
    ],
    CU3: [
      { key: 'A', text: "Their concerns would be taken seriously — client quality is non-negotiable", score: 4 },
      { key: 'B', text: "Depends on the partner running the engagement and how close to deadline they are", score: 2 },
      { key: 'C', text: "It probably wouldn't be welcome — the firm has marketed AI capability to this client", score: 1 },
      { key: 'D', text: "Nobody would push back — 'leveraging AI' is expected now", score: 0 },
    ],
  },
  // P3 key 'D' = Manufacturing/Industrial
  D: {
    F1: [
      { key: 'A', text: "Centralized ERP with production, quality, and supply chain data — our operations team queries it regularly", score: 4 },
      { key: 'B', text: "Production data on the floor, quality records in a separate system, supply chain in an ERP that's been customized into unrecognizability", score: 3 },
      { key: 'C', text: "Paper logs, whiteboards, tribal knowledge from operators who've been here 20 years — you'd spend weeks finding anything", score: 1 },
      { key: 'D', text: "Every plant and shift has their own way of tracking things — there's no single version of what happened yesterday", score: 0 },
      { key: 'E', text: "Newer facilities are instrumented and digital, legacy plants are still running on clipboards and shift reports", score: 2 },
    ],
    F2: [
      { key: 'A', text: "Yes — our quality management system drives it, and ISO audits keep it enforced", score: 4 },
      { key: 'B', text: "We have quality and safety policies, but data governance beyond compliance? Nobody owns that", score: 1 },
      { key: 'C', text: "Our operations director is building standards — it's in progress", score: 2 },
      { key: 'D', text: "Each plant runs independently — corporate data standards would be seen as interference", score: 0 },
    ],
    F3: [
      { key: 'A', text: "We have automated quality monitoring dashboards — our operations team reviews them every shift", score: 4 },
      { key: 'B', text: "We did a data cleanup during our last ERP upgrade, but manual entry errors have crept back in", score: 2 },
      { key: 'C', text: "We know there are issues — missing readings, inconsistent units, operators skipping fields — but nobody's audited it", score: 1 },
      { key: 'D', text: "I don't think anyone has ever looked at our production data from an AI-readiness perspective", score: 0 },
    ],
    A1: [
      { key: 'A', text: "Our ERP and production systems connect through standard interfaces — adding a new tool is straightforward", score: 4 },
      { key: 'B', text: "We've integrated systems before, but it always involves custom work and more time than planned", score: 3 },
      { key: 'C', text: "We'd need to pull manual exports — our floor systems don't talk to anything above them", score: 1 },
      { key: 'D', text: "Our production equipment, ERP, and quality systems are three separate worlds — 'integration' means a person re-keying data", score: 0 },
      { key: 'E', text: "Corporate systems are modern, but plant-floor equipment runs on protocols from the 90s", score: 2 },
    ],
    A2: [
      { key: 'A', text: "Modern ERP, instrumented production lines, our technology team keeps infrastructure current", score: 4 },
      { key: 'B', text: "Core ERP works, but we're carrying legacy control systems that require daily workarounds", score: 2 },
      { key: 'C', text: "We're mid-migration — some lines are on the new system, others are running the old one until the next shutdown window", score: 1 },
      { key: 'D', text: "Our systems were implemented when the plant opened — some are older than most of our workforce", score: 0 },
    ],
    A3: [
      { key: 'A', text: "Our engineering and automation team has data science capability and could prototype quickly", score: 4 },
      { key: 'B', text: "We'd need to hire or partner — we have process engineers but no AI/ML experience", score: 2 },
      { key: 'C', text: "We'd ask our automation vendor what they offer — building custom isn't realistic", score: 1 },
      { key: 'D', text: "We'd bring it up at the next operations review and see if anyone wants to own it", score: 0 },
    ],
    AC1: [
      { key: 'A', text: "A specific plant manager or VP of Operations with clear ownership and metrics tied to outcomes", score: 4 },
      { key: 'B', text: "Probably the VP of Operations or plant manager, but nobody's been formally assigned to AI specifically", score: 2 },
      { key: 'C', text: "It would sit between operations, engineering, and IT — which means it sits nowhere", score: 1 },
      { key: 'D', text: "Whoever the vendor assigns as our account manager, realistically", score: 0 },
      { key: 'E', text: "Some plants have forward-thinking managers who'd own it, others would need corporate to mandate it", score: 2 },
    ],
    AC2: [
      { key: 'A', text: "Our quality management system handles non-conformances — an AI error would go through the same CAPA process", score: 4 },
      { key: 'B', text: "The shift lead would catch it and correct manually, but there's no formal process for AI-specific failures", score: 2 },
      { key: 'C', text: "Operators would override it and keep running — production doesn't stop for software glitches", score: 1 },
      { key: 'D', text: "I'm not sure anyone has considered what happens when an AI system makes a wrong production decision", score: 0 },
    ],
    AC3: [
      { key: 'A', text: "Defined OEE targets, scrap reduction, downtime metrics — with baselines already measured", score: 4 },
      { key: 'B', text: "We'd track whether the tool gets used, but isolating AI's impact from other process changes would be hard", score: 2 },
      { key: 'C', text: "The plant manager would report results at the quarterly review based on gut feel", score: 1 },
      { key: 'D', text: "We'd know it's working if the operators don't shut it off", score: 0 },
    ],
    CU1: [
      { key: 'A', text: "We've piloted automation and analytics tools before — some adopted, some didn't, but the process exists", score: 4 },
      { key: 'B', text: "Engineers are curious, floor operators are skeptical, management wants efficiency gains yesterday", score: 2 },
      { key: 'C', text: "The last time we changed a production workflow, it took a year of resistance and retraining — AI would be harder", score: 1 },
      { key: 'D', text: "AI is something we've seen at trade shows — nobody here has used it for real", score: 0 },
      { key: 'E', text: "Newer plants with younger teams would adopt it, legacy facilities would resist anything that changes their process", score: 2 },
    ],
    CU3: [
      { key: 'A', text: "Their concerns would halt the process — quality and safety always win", score: 4 },
      { key: 'B', text: "Depends on who said it — a senior operator would be heard, a newer hire might not", score: 2 },
      { key: 'C', text: "It probably wouldn't stop production — management has committed to the AI initiative", score: 1 },
      { key: 'D', text: "Nobody would push back — 'smart manufacturing' is treated as the direction here", score: 0 },
    ],
  },
};

// Returns industry-specific options if available, otherwise falls back to generic
function getQuestionOptions(question, industryKey) {
  if (industryKey && INDUSTRY_OPTIONS[industryKey] && INDUSTRY_OPTIONS[industryKey][question.id]) {
    return INDUSTRY_OPTIONS[industryKey][question.id];
  }
  // Use lowDepthVariant if applicable, otherwise default options
  return question.options;
}

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
  {
    id: 'T5',
    layer: 'taste',
    label: 'The Free Trial Trap',
    text: "Your marketing lead signed up for an AI tool on a free trial. Three weeks in, the team 'can\\'t go back.' $18K annual license. No AI budget. IT hasn\\'t reviewed it. Trial expires Friday.",
    options: [
      { key: 'A', text: "Approve it — $18K is small and she's proven the value with three weeks of daily use.", score: 1 },
      { key: 'B', text: 'Tell her you need IT to review it first, even if it means losing the trial.', score: 2 },
      { key: 'C', text: "Ask what happens to company data already in the tool if you don't renew.", score: 3 },
      { key: 'D', text: "Ask why the team 'can\\'t go back' — is the old way broken, or does the AI just feel faster?", score: 4 },
    ],
  },
  {
    id: 'T6',
    layer: 'taste',
    label: "The Intern's Dashboard",
    text: "A summer intern built a sales forecasting dashboard using ChatGPT. It's been more accurate than your existing process for six weeks. Three directors rely on it. The intern leaves in two weeks.",
    options: [
      { key: 'A', text: 'Have the intern document it and assign someone to maintain it.', score: 2 },
      { key: 'B', text: "Ask what happens when the forecast is wrong and a director makes a hiring decision based on it.", score: 2 },
      { key: 'C', text: 'Use this as the business case to propose a formal AI pilot — the intern proved demand.', score: 4 },
      { key: 'D', text: "Let it die — if nobody internal can build or maintain it, you have a dependency, not a capability.", score: 3 },
    ],
  },
  {
    id: 'T7',
    layer: 'taste',
    label: 'The Vendor Demo',
    text: "A vendor demos their AI platform using your actual data. CEO and CFO want to move forward. $95K contract. During the demo, you noticed the AI confidently got a known number wrong by 15%. Nobody else caught it.",
    options: [
      { key: 'A', text: "Flag the error — if it got a known number wrong, what's it getting wrong that you can't verify?", score: 3 },
      { key: 'B', text: "Move forward — one error in a live demo isn't a dealbreaker and leadership is aligned.", score: 1 },
      { key: 'C', text: 'Ask the vendor how the model handles uncertainty — does it flag low confidence or present everything the same?', score: 4 },
      { key: 'D', text: 'Ask your team what specific problem this solves that you can\'t solve with existing tools.', score: 2 },
    ],
  },
  {
    id: 'T8',
    layer: 'taste',
    label: 'The Compliance Cliff',
    text: "Your AI claims system handles 40% of volume and has been in production 14 months. New regulations would require human review of every AI decision. Compliance would require 35 new hires — eliminating the cost savings.",
    options: [
      { key: 'A', text: 'Start hiring — compliance isn\'t optional and waiting for final rules is gambling.', score: 1 },
      { key: 'B', text: "Submit a comment arguing your system's 99.2% accuracy record should qualify as meaningful review.", score: 3 },
      { key: 'C', text: 'Model the break-even — at what point does the system still save money even with reviewers?', score: 3 },
      { key: 'D', text: 'Build a hybrid where AI pre-processes and a smaller team reviews flagged cases only.', score: 4 },
    ],
  },
  {
    id: 'T9',
    layer: 'taste',
    label: 'The Platform Sunset',
    text: "The platform your 12 production AI models run on just announced deprecation in 18 months. Three vendors are pitching migrations. Your CTO wants open-source. Your CFO wants cheapest. Nobody's asked whether all 12 models should survive.",
    options: [
      { key: 'A', text: "Audit which models actually deliver value — this is the moment to kill the ones that don't.", score: 4 },
      { key: 'B', text: "Go open-source — you're forced to migrate anyway, invest the disruption in long-term flexibility.", score: 3 },
      { key: 'C', text: 'Pick the fastest migration — 18 months sounds generous but enterprise migrations always take longer.', score: 2 },
      { key: 'D', text: 'Map dependencies first — which customer-facing apps break during migration and in what order?', score: 2 },
    ],
  },
];

// ─── Taste Scenario Sets (Maturity-Routed) ────────────────
// Each set is balanced to identical dimensional ceilings: FR=6, KD=4, EC=5

const TASTE_SCENARIO_SETS = {
  exploring: ['T5', 'T6', 'T7'],   // P2=A: mid-market, first AI decisions
  scaling: ['T1', 'T2', 'T3'],     // P2=B or C: growth-stage, existing scenarios
  operating: ['T4', 'T8', 'T9'],   // P2=D: enterprise, optimization at scale
};

function getScenarioSet(maturityAnswer) {
  if (maturityAnswer === 'A') return TASTE_SCENARIO_SETS.exploring;
  if (maturityAnswer === 'D') return TASTE_SCENARIO_SETS.operating;
  return TASTE_SCENARIO_SETS.scaling; // B or C
}

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
    A: "Extending the runway is a gamble — 6 more months means 6 more months of unclear ROI. What's behind that instinct?",
    B: "Pivoting instead of killing keeps the team alive but changes the mission. What drove that over a clean break?",
    C: "Killing a project with an invested sponsor and a passionate team takes conviction. What drove that?",
    D: "Calling in an outside review means admitting the people closest to it can't make this call. What triggered that?",
  },
  T4: {
    A: "Focusing on the 4% error rate — what made that the primary concern?",
    B: "Thinking about how customers perceive AI handling their money — what drove that?",
    C: "Worrying about edge cases the agent wasn't trained on — what triggered that?",
    D: "Questioning whether the refund process should exist at all — what made you go there?",
  },
  T5: {
    A: "Approving without review — what made that feel right?",
    B: "Choosing governance over speed — what was behind that?",
    C: "Going straight to data exposure — what triggered that?",
    D: "Questioning whether they actually need it — what drove that?",
  },
  T6: {
    A: "Keeping it running — what made continuity the priority?",
    B: "Flagging the accountability gap — what triggered that?",
    C: "Turning a hack into a formal pilot — what drove that reframe?",
    D: "Letting it die takes discipline — what was behind that?",
  },
  T7: {
    A: "Flagging the error before leadership signs — what drove that?",
    B: "Moving forward despite the error — what made that feel right?",
    C: "Asking about the model's self-awareness — what triggered that?",
    D: "Stepping back from the solution entirely — what was behind that?",
  },
  T8: {
    A: "Hiring immediately for compliance — what drove that urgency?",
    B: "Pushing back on the regulation's frame — what was behind that?",
    C: "Modeling the financial exposure first — what triggered that?",
    D: "Rejecting the all-or-nothing framing — what drove that?",
  },
  T9: {
    A: "Using the deadline to audit value — what made you see the opportunity?",
    B: "Betting on open-source for the long game — what drove that?",
    C: "Prioritizing speed over architecture — what was behind that?",
    D: "Starting with blast radius — what triggered that instinct?",
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
  T5: {
    options: [
      { key: 'R1', text: "Company data is already in the tool — the risk exists whether we buy it or not", fr: 0, kd: 0, ec: 2 },
      { key: 'R2', text: "$18K is noise — the real question is whether this sets a precedent for ungoverned AI adoption", fr: 2, kd: 0, ec: 0 },
      { key: 'R3', text: "If IT kills it and the team loses three weeks of work, you've taught everyone not to experiment", fr: 0, kd: -1, ec: 1 },
      { key: 'R4', text: "The fact they 'can't go back' after three weeks is either a great sign or a dependency — I want to know which", fr: 1, kd: 1, ec: 0 },
    ],
  },
  T6: {
    options: [
      { key: 'R1', text: "Six weeks of accuracy doesn't mean week seven — what happens when the data pattern changes?", fr: 0, kd: 0, ec: 2 },
      { key: 'R2', text: "The intern proved demand for better forecasting — that's the insight, not the dashboard itself", fr: 2, kd: 0, ec: 0 },
      { key: 'R3', text: "Three directors making decisions on a tool nobody can explain is already a governance failure", fr: 0, kd: 1, ec: 1 },
      { key: 'R4', text: "Keeping something you can't maintain is worse than letting it go — that's how technical debt starts", fr: 0, kd: 2, ec: 0 },
    ],
  },
  T7: {
    options: [
      { key: 'R1', text: "A 15% error on known data means unknown errors on unknown data — that's the scary part", fr: 0, kd: 0, ec: 2 },
      { key: 'R2', text: "CEO and CFO aligned is rare — I don't want to kill that momentum over a demo glitch", fr: 0, kd: -1, ec: 0 },
      { key: 'R3', text: "The real question isn't whether the tool is accurate — it's whether it knows when it's not", fr: 2, kd: 0, ec: 0 },
      { key: 'R4', text: "Before spending $95K, I want one specific use case where we can measure impact in 90 days", fr: 0, kd: 1, ec: 0 },
    ],
  },
  T8: {
    options: [
      { key: 'R1', text: "Regulators don't care about accuracy records if you can't demonstrate compliance day one", fr: 0, kd: 1, ec: 1 },
      { key: 'R2', text: "14 months of data showing 99.2% match with humans is the strongest comment we could submit", fr: 1, kd: 0, ec: 0 },
      { key: 'R3', text: "The real risk is our competitor figures out a hybrid approach first while we're stuck overhiring", fr: 2, kd: 0, ec: 1 },
      { key: 'R4', text: "Before hiring, I want to know which claims the AI handles — if they're simple, human review is fast and cheap", fr: 0, kd: 0, ec: 2 },
    ],
  },
  T9: {
    options: [
      { key: 'R1', text: "Forced migrations are the only time organizations kill underperforming models — this is a gift disguised as crisis", fr: 2, kd: 1, ec: 0 },
      { key: 'R2', text: "Customer-facing apps breaking during migration is the nightmare — sequence matters more than speed", fr: 0, kd: 0, ec: 2 },
      { key: 'R3', text: "The CTO is right about open-source but wrong about timing — don't redesign under a deadline", fr: 1, kd: 1, ec: 0 },
      { key: 'R4', text: "18 months sounds generous until you account for evaluation, migration, retraining, and UAT", fr: 0, kd: 0, ec: 1 },
    ],
  },
};

function recordTasteReasoning(session, scenarioId, reasoningKey) {
  // Capture response timing
  const now = Date.now();
  if (!session._lastQuestionShown) session._lastQuestionShown = now;
  session.responseTimings[scenarioId + '_reasoning'] = now - session._lastQuestionShown;
  session._lastQuestionShown = now;

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
      T5: { A: 0, B: 0, C: 0, D: 2 },
      T6: { A: 0, B: 0, C: 2, D: 0 },
      T7: { A: 0, B: 0, C: 2, D: 0 },
      T8: { A: 0, B: 2, C: 0, D: 2 },
      T9: { A: 0, B: 2, C: 0, D: 0 },
    },
    killDiscipline: {
      T1: { A: 1, B: 0, C: 0, D: 0 },
      T2: { A: 0, B: 1, C: 0, D: 1 },
      T3: { A: 0, B: 1, C: 2, D: 1 },
      T4: { A: 1, B: 0, C: 0, D: 1 },
      T5: { A: 0, B: 1, C: 0, D: 0 },
      T6: { A: 0, B: 0, C: 0, D: 2 },
      T7: { A: 0, B: 0, C: 0, D: 1 },
      T8: { A: 0, B: 0, C: 0, D: 1 },
      T9: { A: 2, B: 0, C: 0, D: 0 },
    },
    edgeCaseInstinct: {
      T1: { A: 0, B: 1, C: 2, D: 0 },
      T2: { A: 0, B: 0, C: 2, D: 0 },
      T3: { A: 0, B: 0, C: 0, D: 1 },
      T4: { A: 1, B: 1, C: 2, D: 0 },
      T5: { A: 0, B: 0, C: 2, D: 0 },
      T6: { A: 0, B: 1, C: 0, D: 0 },
      T7: { A: 2, B: 0, C: 1, D: 0 },
      T8: { A: 0, B: 0, C: 2, D: 0 },
      T9: { A: 0, B: 0, C: 0, D: 1 },
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
    // Same letter 3/3 — gaming penalty: subtract 1 from highest dimension
    const highest = Object.keys(dims).reduce((a, b) => dims[a] >= dims[b] ? a : b);
    dims[highest] = Math.max(0, dims[highest] - 1);
  } else if (unique.size === 3) {
    // All different letters (3 of 3) — contextual thinking bonus
    dims.frameRecognition += 1;
  }
  return dims;
}

function getTasteSignature(dims) {
  const { frameRecognition, killDiscipline, edgeCaseInstinct } = dims;
  const total = frameRecognition + killDiscipline + edgeCaseInstinct;
  const allAbove2 = frameRecognition >= 2 && killDiscipline >= 2 && edgeCaseInstinct >= 2;
  const allBetween1and4 = [frameRecognition, killDiscipline, edgeCaseInstinct].every(d => d >= 1 && d <= 4);

  // Momentum: low total or zero frame recognition
  if (total <= 4 || frameRecognition === 0)
    return { name: 'Momentum', color: 'var(--taste-momentum)', description: 'Defaults to speed, hype, or inertia. Strength: fast execution when direction is right. Risk: expensive failures, automating the mess, hype-driven decisions.' };

  // Sophistication: high frame recognition, balanced
  if (frameRecognition >= 4 && allAbove2)
    return { name: 'Sophistication', color: 'var(--taste-sophistication)', description: 'Defaults to reframing, first-principles thinking, and second-order effects. Strength: sees what others miss. Risk: over-analysis, slow to ship.' };

  // Caution: edge-case instinct highest, frame recognition low
  if (edgeCaseInstinct > killDiscipline && edgeCaseInstinct > frameRecognition && frameRecognition <= 2)
    return { name: 'Caution', color: 'var(--taste-caution)', description: 'Defaults to safety, risk management, and proven approaches. Strength: avoids catastrophic failure. Risk: misses high-leverage opportunities, slow adoption.' };

  // Pragmatism: balanced, no extreme spikes or gaps
  if (allBetween1and4)
    return { name: 'Pragmatism', color: 'var(--taste-pragmatism)', description: 'Balances analysis with action. Tests assumptions empirically. Strength: gets things done well. Risk: may miss systemic issues.' };

  // Fallback
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
  if (total <= 4) return "Your instinct is toward action over analysis. That creates velocity when direction is right and expensive course corrections when it isn't.";

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
    knowledgeDepth: 'high',
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
    tasteFreeText: null,
    scenarioSet: null,
    responseTimings: {},
    _lastQuestionShown: null,
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
    // Store maturity-routed scenario set for Taste
    session.scenarioSet = getScenarioSet(session.pulseAnswers.P2);
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
        const industryKey = session.pulseAnswers.P3 || null;
        let q;
        if (useLowDepth) {
          q = { ...baseQ, text: baseQ.lowDepthVariant.text, options: baseQ.lowDepthVariant.options };
        } else {
          // Apply industry-specific options if available
          const opts = getQuestionOptions(baseQ, industryKey);
          q = opts !== baseQ.options ? { ...baseQ, options: opts } : baseQ;
        }
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
      // Cap: only probe the single lowest-scoring eligible layer
      if (pending.length > 1) {
        pending.sort((a, b) => {
          const sA = scoreLayer(session.layerResponses[a]);
          const sB = scoreLayer(session.layerResponses[b]);
          return (sA === null ? 999 : sA) - (sB === null ? 999 : sB);
        });
        session.adaptiveFollowUp.pending = [pending[0]];
      }
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
          const adaptiveIndustryKey = session.pulseAnswers.P3 || null;
          let q;
          if (useLowDepth) {
            q = { ...baseQ, text: baseQ.lowDepthVariant.text, options: baseQ.lowDepthVariant.options };
          } else {
            const opts = getQuestionOptions(baseQ, adaptiveIndustryKey);
            q = opts !== baseQ.options ? { ...baseQ, options: opts } : baseQ;
          }
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

  // Tier 3: Taste Test (maturity-routed — 3 scenarios per set)
  if (session.tier === 3) {
    const activeScenarios = TASTE_QUESTIONS.filter(q => session.scenarioSet.includes(q.id));
    if (session.currentQuestionIndex < activeScenarios.length) {
      return {
        tier: 3,
        tierLabel: 'The Taste Test',
        ...activeScenarios[session.currentQuestionIndex],
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
  // Capture response timing
  const now = Date.now();
  if (!session._lastQuestionShown) session._lastQuestionShown = now;
  const timingMs = now - session._lastQuestionShown;
  session.responseTimings[questionId] = timingMs;
  session._lastQuestionShown = now;

  if (session.tier === 1) {
    session.pulseAnswers[questionId] = optionKey;
    if (questionId === 'P3') {
      session.industry = optionKey;
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
  // Capture response timing
  const now = Date.now();
  if (!session._lastQuestionShown) session._lastQuestionShown = now;
  session.responseTimings[followUpId] = now - session._lastQuestionShown;
  session._lastQuestionShown = now;

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
  tasteDimensions.frameRecognition = Math.max(0, Math.min(6, tasteDimensions.frameRecognition));
  tasteDimensions.killDiscipline = Math.max(0, Math.min(4, tasteDimensions.killDiscipline));
  tasteDimensions.edgeCaseInstinct = Math.max(0, Math.min(5, tasteDimensions.edgeCaseInstinct));
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

  // Internal percentage normalization (stored in D1, never surfaced to user)
  const DIMENSION_MAXES = { frameRecognition: 6, killDiscipline: 4, edgeCaseInstinct: 5 };
  const tasteNormalized = {
    frameRecognition: Math.round((tasteDimensions.frameRecognition / DIMENSION_MAXES.frameRecognition) * 100),
    killDiscipline: Math.round((tasteDimensions.killDiscipline / DIMENSION_MAXES.killDiscipline) * 100),
    edgeCaseInstinct: Math.round((tasteDimensions.edgeCaseInstinct / DIMENSION_MAXES.edgeCaseInstinct) * 100),
  };

  // Response timing summary
  const timings = Object.values(session.responseTimings);
  const timingSummary = timings.length ? {
    total_ms: timings.reduce((a, b) => a + b, 0),
    avg_ms: Math.round(timings.reduce((a, b) => a + b, 0) / timings.length),
    slowest_ms: Math.max(...timings),
    fastest_ms: Math.min(...timings),
    count: timings.length,
  } : null;

  return {
    layerScores,
    tasteDimensions,
    tasteTotal,
    tasteSignature,
    tasteCharacterization,
    tasteNormalized,
    scenarioSet: session.scenarioSet || null,
    responseTimings: session.responseTimings,
    timingSummary,
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
  const tasteCount = session.scenarioSet ? session.scenarioSet.length : 3;
  let total = TIER1_QUESTIONS.length + tasteCount;
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
  const p7 = session.pulseAnswers.P7;
  const p1Q = questionMap.P1;
  const p2Q = questionMap.P2;
  const p3Q = questionMap.P3;
  const p4Q = questionMap.P4;
  const p7Q = questionMap.P7;

  lines.push('=== CONTEXT ===');
  lines.push('Industry: ' + (p3Q.options.find(o => o.key === p3)?.text || p3));
  lines.push('Role: ' + (p1Q.options.find(o => o.key === p1)?.text || p1));
  lines.push('Maturity Stage: ' + (p2Q.options.find(o => o.key === p2)?.text || p2));
  lines.push('Primary Concern: ' + (p4Q.options.find(o => o.key === p4)?.text || p4));
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

  // Tier 2 layer responses (use industry-specific options if applicable)
  const briefIndustryKey = session.pulseAnswers.P3 || null;
  for (const [layer, responses] of Object.entries(session.layerResponses)) {
    for (const r of responses) {
      const q = questionMap[r.questionId];
      if (!q) continue;
      const useLowDepth = session.knowledgeDepth === 'low' && q.lowDepthVariant;
      const qText = useLowDepth ? q.lowDepthVariant.text : q.text;
      const opts = useLowDepth ? q.lowDepthVariant.options : getQuestionOptions(q, briefIndustryKey);
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
  lines.push('Frame Recognition: ' + results.tasteDimensions.frameRecognition + '/6');
  lines.push('Kill Discipline: ' + results.tasteDimensions.killDiscipline + '/4');
  lines.push('Edge-Case Instinct: ' + results.tasteDimensions.edgeCaseInstinct + '/5');
  if (results.scenarioSet) {
    lines.push('Scenario Set: ' + results.scenarioSet.join(', '));
  }
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
    lines.push('=== BRIEF FOCUS REQUEST ===');
    lines.push('The user specifically asked the brief to address: ' + session.reflectionResponse);
  }

  // Taste reasoning selections
  if (session.tasteReasoningSelections || session.tasteReasoningDims) {
    lines.push('');
    lines.push('=== TASTE REASONING ===');
    if (session.tasteReasoningDims) {
      lines.push('Reasoning adjustments — FR: ' + session.tasteReasoningDims.frameRecognition + ', KD: ' + session.tasteReasoningDims.killDiscipline + ', EC: ' + session.tasteReasoningDims.edgeCaseInstinct);
    }
  }

  if (session.tasteFreeText) {
    lines.push('');
    lines.push('=== TASTE FREE-TEXT (Post-Scenarios) ===');
    lines.push('The user added: ' + session.tasteFreeText);
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
  getQuestionOptions,
  TIER1_LENGTH: TIER1_QUESTIONS.length,
  TASTE_LENGTH: 3, // Fixed — all maturity-routed sets have 3 scenarios
};
})();
