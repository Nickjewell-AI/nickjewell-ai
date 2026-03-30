# CLAUDE.md — Project Context for Claude Code

## Who Is Building This
Nick Jewell. AI implementation consultant pursuing senior AI strategy roles. This project IS the job search — not a parallel effort.

## What This Project Is
**The Jewell Assessment** — an interactive, AI-powered diagnostic that evaluates organizational AI readiness across five layers, culminating in a proprietary "Taste" dimension measuring strategic judgment through revealed choices.

**Live at:** https://www.nickjewell.ai (www only — bare domain 301 redirects)

**Core thesis:** AI implementation fails because the people making decisions lack the judgment to deploy it well. Readiness is table stakes. Taste is the multiplier.

## The Five-Layer Framework
1. **FOUNDATION** — Data quality, accessibility, governance
2. **ARCHITECTURE** — Process design, integration layers, workflow readiness
3. **ACCOUNTABILITY** — Human ownership, escalation paths, kill switches
4. **CULTURE** — Talent readiness, change capacity, organizational honesty
5. **TASTE** — Strategic judgment via scenario-based choices (proprietary)

## Technical Architecture
- **Frontend:** Vanilla HTML/CSS/JS — no frameworks, no build tools
- **Hosting:** Cloudflare Pages (free tier, auto-deploy from GitHub main)
- **API Proxy:** Cloudflare Pages Function at /functions/api-proxy.js
- **Models:** Sonnet 4 (Taste follow-ups, CU2 analysis) + Opus 4.6 (executive brief)
- **Database:** Cloudflare D1 (jewell-assessment-db) — auto-captures all assessments
- **Email:** Resend (transactional send from nick@nickjewell.ai), Cloudflare Email Routing (receive to Gmail)
- **Rate limiting:** 3 briefs/IP/day via D1, admin bypass via ?admin_key= URL param
- **Deterministic fallback:** All API features degrade gracefully

## Cloudflare Environment Variables

ANTHROPIC_API_KEY — Anthropic API for assessment features
ADMIN_KEY — Admin bypass for rate limiting
RESEND_API_KEY — Resend email delivery
DB — D1 database binding

## Repo Structure

nickjewell-ai/
  index.html                        (Homepage)
  framework/index.html              (Framework deep-dive + sticky layer nav)
  assessment/index.html             (Interactive assessment)
  writing/index.html                (Writing index)
  writing/taste-missing-dimension/index.html
  writing/committees-dont-call/index.html
  writing/automating-the-mess/index.html
  writing/data-somewhere/index.html
  writing/training-without-transformation/index.html
  css/style.css                     (Shared design system)
  js/assessment-engine.js           (Scoring, branching, state)
  js/assessment-ui.js               (UI rendering + ARIA + Save Results)
  js/api.js                         (Anthropic API via Worker proxy)
  functions/api-proxy.js            (Cloudflare Pages Function — API proxy + Resend email)
  assets/og-image.png               (Homepage OG 1200x630)
  assets/og-framework.png           (Framework OG)
  assets/og-assessment.png          (Assessment OG)
  assets/favicon.svg
  assets/logos/                     (Company logos for Taste in Practice)
  sitemap.xml
  robots.txt
  CLAUDE.md
  package.json
  wrangler.toml
  .gitignore

## Design System
- Aesthetic: Dark editorial — #080808 backgrounds, #c8965a amber accent, #f0ebe3 warm white
- Fonts: Fraunces (headings), DM Sans (body)
- Text tokens (WCAG AA): primary #f0ebe3, secondary #9a9189, muted #7a756f
- Film grain overlay: SVG noise at 2.5% opacity
- Full spec: docs/design-system.md

## Current State (March 29, 2026)
Live: Homepage, Framework (with sticky layer nav), Assessment (full API integration), 5 Writing pages, Save Results email pipeline, nick@nickjewell.ai, all OG images, full accessibility + SEO

Next build: /about/ page — full copy and build reference in project docs (NickJewellAI_About_Page_Reference.docx). Nav on ALL pages needs About link added after build.

## Development Environment
- OS: Windows 11, PowerShell (no && chaining — one command at a time)
- Node.js: NOT in system PATH — no npx/wrangler locally
- D1 ops: Cloudflare dashboard Console tab only
- Deploy: git add -A then git commit -m "msg" then git push origin main (separate commands)

## Coding Conventions
- Vanilla HTML/CSS/JS — no build tools
- CSS custom properties for design tokens
- Semantic HTML with ARIA roles on assessment
- Mobile-first responsive
- Build incrementally — working state after every change
- Commit after each meaningful change
