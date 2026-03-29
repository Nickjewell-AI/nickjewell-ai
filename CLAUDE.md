# CLAUDE.md — Project Context for Claude Code

## Who Is Building This
Nick Jewell. AI and automation implementation consultant pursuing senior AI strategy and solutions roles. Core career goal: demonstrate both business strategy depth AND hands-on AI implementation capability. This project IS the job search — not a parallel effort.

## What This Project Is
**The Jewell Assessment** — an interactive, AI-powered diagnostic tool that evaluates organizational AI implementation readiness across five layers, culminating in a proprietary "Taste" dimension that measures strategic judgment through revealed choices rather than self-reporting.

**Hosted at:** nickjewell.ai (Cloudflare domain + Cloudflare Pages hosting)

**Core thesis:** AI implementation doesn't fail because organizations lack capability. It fails because the people making decisions about AI lack the discernment to deploy it well. Readiness is the table stakes. Taste is the multiplier.

**Tagline:** Other assessments tell you whether your organization *can* implement AI. This one tells you whether it *should* — and whether the people making that decision have the judgment to get it right.

## The Five-Layer Framework
1. **FOUNDATION** — Data quality, accessibility, format consistency, governance docs
2. **ARCHITECTURE** — Process design, integration layers, workflow readiness
3. **ACCOUNTABILITY** — Human ownership, escalation paths, kill switches
4. **CULTURE** — Talent readiness, change capacity, organizational honesty
5. **TASTE** — Strategic judgment revealed through scenario-based choices (proprietary)

## Technical Architecture
- **Frontend:** Static HTML/CSS/JS site with interactive assessment component
- **Hosting:** Cloudflare Pages (auto-deploy from GitHub)
- **API Proxy:** Cloudflare Worker at /functions/api-proxy.js (secures Anthropic API key)
- **API:** Anthropic Messages API (claude-sonnet-4-20250514) for conversational assessment
- **No backend/database for MVP** — assessment runs client-side with API calls, results generated in-session

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
├── docs/                         # Detailed specs (assessment, architecture, design, content)
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

## Coding Conventions
- Vanilla HTML/CSS/JS for static pages (no build tools for MVP)
- ES6 modules for assessment engine JavaScript
- CSS custom properties for design tokens
- Semantic HTML with accessibility considerations
- Mobile-first responsive design
- Comments explaining business logic, not obvious code
- After creating or modifying any HTML or CSS files, verify there are no broken references or path issues.

## When Helping Nick Build
- Nick is learning Claude Code and terminal workflows — explain commands and concepts when they're new
- Prefer simple, readable code over clever abstractions
- Build incrementally — working state after every change
- Test in browser frequently
- Commit after each meaningful change with descriptive messages
- When in doubt, ask Nick rather than assuming
