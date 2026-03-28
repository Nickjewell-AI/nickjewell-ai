# CLAUDE.md — Project Context for Claude Code

## Who Is Building This
Nick Jewell. AI and automation implementation consultant pursuing senior AI strategy and solutions roles (AI Strategy Director, AI Solutions Director, AI Implementation Lead). Core career goal: demonstrate both business strategy depth AND hands-on AI implementation capability. This project IS the job search — not a parallel effort.

## What This Project Is
**The Jewell Assessment** — an interactive, AI-powered diagnostic tool that evaluates organizational AI implementation readiness across five layers, culminating in a proprietary "Taste" dimension that measures strategic judgment through revealed choices rather than self-reporting.

**Hosted at:** nickjewell.ai (Cloudflare domain + Cloudflare Pages hosting)

**Core thesis:** AI implementation doesn't fail because organizations lack capability. It fails because the people making decisions about AI lack the discernment to deploy it well. Readiness is the table stakes. Taste is the multiplier.

**Tagline:** Other assessments tell you whether your organization *can* implement AI. This one tells you whether it *should* — and whether the people making that decision have the judgment to get it right.

## The Five-Layer Framework
Each layer builds on the one beneath it. Low scores on lower layers make higher-layer scores unreliable.

1. **FOUNDATION** — Data quality, accessibility, format consistency, governance docs
2. **ARCHITECTURE** — Process design, integration layers, workflow readiness
3. **ACCOUNTABILITY** — Human ownership, escalation paths, kill switches
4. **CULTURE** — Talent readiness, change capacity, organizational honesty
5. **TASTE** — Strategic judgment revealed through scenario-based choices (proprietary)

## Key Differentiators
- **Conversational, not form-based** — powered by Anthropic API for adaptive follow-up
- **"I don't know" is a diagnostic signal**, not a skip
- **Taste dimension is unique IP** — no other assessment measures decision quality through revealed choices
- **Output is a diagnosis, not a score** — layer profile, binding constraint, taste signature, three prioritized actions
- **Binary verdict is Green/Amber/Red** with constraint-specific reasoning, not pass/fail
- **Built by an independent practitioner**, not a vendor selling implementation

## Technical Architecture
- **Frontend:** Static HTML/CSS/JS site with interactive React assessment component
- **Hosting:** Cloudflare Pages (auto-deploy from GitHub)
- **API Proxy:** Cloudflare Worker at /functions/api-proxy.js (secures Anthropic API key)
- **API:** Anthropic Messages API (claude-sonnet-4-20250514) for conversational assessment
- **No backend/database for MVP** — assessment runs client-side with API calls, results generated in-session
- **Future:** Email capture for executive brief PDF, analytics, results aggregation

## Repo Structure
```
nickjewell-ai/
├── index.html                    # Homepage — thesis + framework overview + CTA
├── framework/
│   └── index.html                # Deep framework page (5 layers, failure/success patterns)
├── assessment/
│   └── index.html                # Interactive assessment tool
├── css/
│   └── style.css                 # Shared design system styles
├── js/
│   ├── assessment-engine.js      # Scoring logic, branching, state management
│   ├── assessment-ui.js          # Conversational UI rendering
│   └── api.js                    # Anthropic API communication via Worker proxy
├── functions/
│   └── api-proxy.js              # Cloudflare Worker — proxies Anthropic API calls
├── assets/
│   ├── og-image.png              # Social sharing preview image
│   └── favicon.svg               # Site favicon
├── docs/
│   ├── assessment-spec.md        # Full assessment engine specification
│   ├── architecture.md           # Technical architecture details
│   ├── design-system.md          # Design tokens and component patterns
│   ├── linkedin-content.md       # Content calendar and post drafts
│   └── jewell-framework.md       # Complete framework IP document
├── CLAUDE.md                     # This file
├── package.json
├── wrangler.toml                 # Cloudflare Pages/Workers config
└── README.md
```

## Design System Summary
**Aesthetic:** Dark editorial — authoritative without being cold, distinctive without being flashy.
- **Fonts:** Fraunces (display/headings), DM Sans (body)
- **Background:** #080808 primary, #0f0f0f secondary, #141414 cards
- **Text:** #f0ebe3 primary, #8a8279 secondary, #5a5550 muted
- **Accent:** #c8965a (warm amber)
- **Border:** #222019
- **Film grain overlay** for texture
- **Fade-in animations** on scroll via IntersectionObserver

Full design system: `docs/design-system.md`

## Build Sequence (No Timeframes — Milestone-Based)

### Milestone 1: Static Site Launch
Ship the homepage and framework page to nickjewell.ai. No interactivity yet — pure thought leadership content. This is immediately portfolio-ready and LinkedIn-publishable.
- Homepage with thesis, framework overview, assessment CTA (coming soon)
- Framework page with all 5 layers, failure/success patterns, assessment signals
- Contact section (LinkedIn, GitHub, Email)
- Deploy via Cloudflare Pages connected to GitHub

### Milestone 2: Assessment Engine
Build the scoring logic and conversational UI.
- Tier 1 (Pulse): Context-setting questions that determine branching
- Tier 2 (Diagnostic): Adaptive depth based on Tier 1 context
- Tier 3 (Deep Dive): Scenario-based Taste evaluation
- Deterministic scoring first (no API) — pure JS logic
- Green/Amber/Red verdict with constraint diagnosis

### Milestone 3: API Integration
Add Anthropic API for conversational assessment flow.
- Cloudflare Worker proxy for API key security
- Adaptive follow-up questions powered by Claude
- Natural language interpretation of open-ended responses
- Executive brief generation

### Milestone 4: Output & Polish
Build the results experience.
- Layer-by-layer maturity profile visualization
- Constraint diagnosis display
- Taste signature presentation
- Three prioritized actions
- Shareable executive brief (downloadable)
- OG image, favicon, mobile optimization

### Milestone 5: MCP Server (Secondary Project)
Build the Consulting Data Translation Server as a second portfolio piece.
- Demonstrates technical infrastructure depth alongside strategic depth
- Full spec in original curriculum document

### Milestone 6: Portfolio Narrative & Content
- LinkedIn post series (8 posts mapped to framework layers)
- Interview narrative development
- Open source contribution signal

## Key Reference Documents
- `docs/jewell-framework.md` — Complete framework IP (5 layers, failure/success, taste scenarios)
- `docs/assessment-spec.md` — Assessment engine specification (branching, scoring, outputs)
- `docs/architecture.md` — Technical architecture and deployment
- `docs/design-system.md` — Visual design tokens and patterns
- `docs/linkedin-content.md` — Content calendar and drafts

## Coding Conventions
- Vanilla HTML/CSS/JS for static pages (no build tools for MVP)
- ES6 modules for assessment engine JavaScript
- CSS custom properties for design tokens
- Semantic HTML with accessibility considerations
- Mobile-first responsive design
- Comments explaining business logic, not obvious code

## When Helping Nick Build
- Nick is learning Claude Code and terminal workflows — explain commands and concepts when they're new
- Prefer simple, readable code over clever abstractions
- Build incrementally — working state after every change
- Test in browser frequently
- Commit after each meaningful change with descriptive messages
- When in doubt, ask Nick rather than assuming
