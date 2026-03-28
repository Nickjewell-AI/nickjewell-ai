# Technical Architecture
## nickjewell.ai — The Jewell Assessment

---

## Infrastructure Overview

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   GitHub     │────▶│  Cloudflare Pages   │────▶│  nickjewell.ai   │
│   Repo       │     │  (auto-deploy)       │     │  (CDN-served)    │
└──────────────┘     └─────────────────────┘     └──────────────────┘
                              │
                     ┌────────┴────────┐
                     │ Cloudflare      │
                     │ Worker          │
                     │ /functions/     │
                     │ api-proxy.js    │
                     └────────┬────────┘
                              │
                     ┌────────┴────────┐
                     │ Anthropic API   │
                     │ Messages        │
                     │ Endpoint        │
                     └─────────────────┘
```

## Why Cloudflare Pages (Not GitHub Pages)

1. **Domain is already on Cloudflare** — zero DNS configuration
2. **Cloudflare Workers** — serverless functions for API proxy (GitHub Pages has no server-side capability)
3. **Auto-deploy from GitHub** — push to main = live site
4. **Built-in analytics** — no third-party scripts needed
5. **Global CDN** — fast everywhere
6. **Free tier** — more than sufficient for this project

## Deployment Pipeline

```
Local development (Claude Code)
  → git push to GitHub (main branch)
    → Cloudflare Pages auto-build triggered
      → Static files served at nickjewell.ai
      → Worker functions deployed at nickjewell.ai/functions/*
```

### Setup Steps (One-Time)
1. Create GitHub repo: `nickjewell-ai`
2. In Cloudflare dashboard: Pages → Create project → Connect to GitHub repo
3. Set build output directory: `/` (root, since no build step for MVP)
4. Add custom domain: `nickjewell.ai`
5. Add Worker environment variable: `ANTHROPIC_API_KEY`

## Repo Structure

```
nickjewell-ai/
│
├── index.html                      # Homepage
│   ├── Hero: Thesis + tagline
│   ├── Framework preview: 5 layers (visual)
│   ├── Assessment CTA
│   ├── Writing section (thought pieces)
│   ├── Project card (Jewell Assessment)
│   └── Contact (LinkedIn, GitHub, Email)
│
├── framework/
│   └── index.html                  # Full framework deep-dive
│       ├── Layer 1: Foundation (failure/success patterns)
│       ├── Layer 2: Architecture
│       ├── Layer 3: Accountability
│       ├── Layer 4: Culture
│       └── Layer 5: Taste (scenarios + philosophy)
│
├── assessment/
│   └── index.html                  # Interactive assessment
│       ├── Conversational UI
│       ├── Tier 1 → Tier 2 → Tier 3 flow
│       └── Results display
│
├── css/
│   └── style.css                   # Design system + all component styles
│
├── js/
│   ├── assessment-engine.js        # Core logic
│   │   ├── State management (current tier, responses, scores)
│   │   ├── Branching logic (Tier 1 → which Tier 2 modules)
│   │   ├── Scoring algorithms (per-layer, composite, taste)
│   │   ├── Verdict calculation (Green/Amber/Red)
│   │   ├── Constraint identification
│   │   └── Action generation
│   │
│   ├── assessment-ui.js            # UI rendering
│   │   ├── Question rendering (multiple choice, open-ended)
│   │   ├── Conversational flow animation
│   │   ├── Progress indication
│   │   ├── Results visualization
│   │   └── Executive brief rendering
│   │
│   └── api.js                      # API communication
│       ├── Proxy call wrapper
│       ├── Conversation history management
│       ├── Error handling + fallback to deterministic mode
│       └── Response parsing
│
├── functions/
│   └── api-proxy.js                # Cloudflare Worker
│       ├── Validates request origin
│       ├── Rate limiting (basic)
│       ├── Adds ANTHROPIC_API_KEY from env
│       ├── Forwards to Anthropic Messages API
│       └── Returns response to client
│
├── assets/
│   ├── og-image.png                # 1200x630 social preview
│   └── favicon.svg                 # Simple "J" or abstract mark
│
├── docs/                           # Not served to web — reference only
│   ├── assessment-spec.md
│   ├── architecture.md             # This file
│   ├── design-system.md
│   ├── linkedin-content.md
│   └── jewell-framework.md
│
├── CLAUDE.md
├── package.json
├── wrangler.toml
├── .gitignore
└── README.md
```

## Page Architecture

### Homepage (index.html)
**Purpose:** First impression. Establish thesis. Drive to assessment or framework.

```
[Nav]
  Logo: "NJ" or "N." | Links: Framework, Assessment, Writing, Contact

[Hero Section]
  Eyebrow: "The Jewell Assessment"
  H1: "AI implementation fails because of judgment, not capability."
  Subtext: 2-3 sentences expanding thesis
  CTA: "Take the Assessment" (primary) | "Read the Framework" (secondary)

[Framework Preview]
  Visual: 5-layer stack diagram
  Brief description of each layer (1 sentence each)
  "Explore the full framework →"

[Writing Section]
  3-5 linked thought pieces (LinkedIn posts / future blog content)
  Editorial list layout (date, title, tag)

[Project Card]
  The Jewell Assessment as a featured project
  Description + tech used + status

[Contact]
  LinkedIn | GitHub | Email
  "Open to AI strategy roles and consulting engagements"

[Footer]
  © 2026 Nick Jewell | nickjewell.ai
```

### Framework Page (framework/index.html)
**Purpose:** Thought leadership anchor. Publishable, shareable, demonstrates deep expertise.

```
[Nav]

[Framework Hero]
  Title: "The Jewell Assessment Framework"
  Thesis paragraph
  Visual: 5-layer architecture diagram

[Layer 1: Foundation]
  What it measures
  Where companies fail (2 failure modes, each with real pattern)
  Where companies succeed (2 success patterns, each with real pattern)
  Assessment signals

[Layer 2: Architecture]
  Same structure

[Layer 3: Accountability]
  Same structure

[Layer 4: Culture]
  Same structure

[Layer 5: Taste]
  What it measures
  The thesis behind taste
  Where companies fail (3 failure modes with patterns)
  Where companies succeed (3 success patterns with patterns)
  How Taste is assessed (scenario examples)

[Differentiator Table]
  Traditional Assessment vs. Jewell Assessment comparison

[CTA]
  "Take the Assessment →"

[Footer]
```

### Assessment Page (assessment/index.html)
**Purpose:** Interactive diagnostic tool.

```
[Minimal Nav — assessment-focused]

[Assessment Container]
  Conversational UI: Messages appear sequentially
  User responses via clickable options or text input
  Typing indicator for AI follow-ups
  Progress: "Layer 2 of 5" or similar subtle indicator

[Results View — replaces assessment when complete]
  Verdict badge (Green/Amber/Red)
  Layer profile visualization (horizontal bar chart)
  Taste signature badge
  Binding constraint explanation
  Three prioritized actions
  "Download Executive Brief" button
  "Share on LinkedIn" button
```

## Data Flow

### Assessment Session (No Database)

```
1. User starts assessment
2. JavaScript creates session state object in memory:
   {
     tier1: { role, stage, industry, concern, depth },
     modules: [],      // which Tier 2 modules to show
     responses: {},     // all answers keyed by question ID
     scores: {
       foundation: null,
       architecture: null,
       accountability: null,
       culture: null,
       taste: null
     },
     verdict: null,
     constraint: null,
     tasteSignature: null,
     actions: []
   }

3. Tier 1 responses populate tier1 + determine modules[]
4. Tier 2 questions served based on modules[]
5. Each response updates scores in real-time
6. Tier 3 taste scenarios scored
7. Final calculation: verdict, constraint, signature, actions
8. Results rendered client-side
9. Executive brief generated (optionally via API for personalized narrative)
10. Session state exists only in browser memory — nothing stored
```

### API Integration (Milestone 3)

```
Client                    Worker                  Anthropic
  │                         │                        │
  │  POST /functions/       │                        │
  │  api-proxy              │                        │
  │  {messages, system}     │                        │
  │────────────────────────▶│                        │
  │                         │  POST /v1/messages     │
  │                         │  + API key from env    │
  │                         │───────────────────────▶│
  │                         │                        │
  │                         │  Response              │
  │                         │◀───────────────────────│
  │  Response               │                        │
  │◀────────────────────────│                        │
  │                         │                        │
```

## Security Considerations

- **API key never in client code** — stored as Cloudflare Worker environment variable
- **Worker validates request origin** — only accepts requests from nickjewell.ai
- **Rate limiting** — basic per-IP rate limiting to prevent abuse
- **No PII stored** — assessment runs entirely in-session, nothing persisted
- **HTTPS enforced** — Cloudflare handles SSL automatically

## Performance Targets

- **First paint:** < 1 second (static HTML, no framework overhead)
- **Assessment load:** < 2 seconds (JS modules loaded on assessment page only)
- **API response:** < 3 seconds per follow-up question
- **Total assessment:** 5-12 minutes depending on depth
- **Lighthouse score:** 90+ across all categories

## Future Extensions (Post-MVP)

- **Email capture** for executive brief PDF delivery
- **Analytics** tracking assessment completions, drop-off points, common binding constraints
- **Aggregate insights** — "Here's what we're seeing across all assessments" (content fuel)
- **Industry benchmarking** — "Organizations in your industry typically score X on Foundation"
- **Team assessments** — Multiple people from same org take it, results compared
