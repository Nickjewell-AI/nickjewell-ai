# NickJewell.AI — Complete Project Status
## Reference Document · Last Updated March 29, 2026

---

## Infrastructure Map

### Domain & DNS
- **Domain:** nickjewell.ai (registered on Cloudflare)
- **Live URL:** https://www.nickjewell.ai (only www resolves)
- **Bare domain redirect:** Cloudflare Page Rule — `nickjewell.ai/*` → 301 → `https://www.nickjewell.ai/$1`
- **DNS:** A record for bare domain (192.0.2.1 dummy, proxied), CNAME for www pointing to Cloudflare Pages

### Hosting
- **Platform:** Cloudflare Pages (free tier)
- **Auto-deploy:** Connected to GitHub, deploys on every push to `main`
- **Build output:** `/` (root, no build step — static site)
- **CDN:** Cloudflare global CDN, automatic SSL

### GitHub
- **Repo:** https://github.com/Nickjewell-AI/nickjewell-ai
- **Branch:** `main` (single branch, direct push)
- **Username:** Nickjewell-AI

### Cloudflare Services in Use
- **Pages:** Static site hosting + auto-deploy
- **Workers/Functions:** API proxy at `/api-proxy` (Cloudflare Pages Functions)
- **D1 Database:** `jewell-assessment-db` (ID: `97e104f4-6135-4b8e-a3fb-78f569b3a7c5`)
- **Email Routing:** nick@nickjewell.ai → forwards to Gmail
- **Page Rules:** Bare domain redirect (301)
- **DNS:** Domain management + proxied records + Resend DKIM/SPF records

### D1 Database Tables
| Table | Purpose | Schema |
|-------|---------|--------|
| `assessment_results` | Auto-captures every completed assessment | id, timestamp, name, email, company, role, role_context, industry, maturity_stage, all layer scores, taste dimensions, verdict, composite_score, binding_constraint, all_responses (JSON), time_to_complete_seconds |
| `brief_ip_counter` | Per-IP daily rate limiting for brief generation | ip_date (TEXT PK, format "IP:YYYY-MM-DD"), count (INTEGER) |
| `_cf_KV` | Cloudflare internal KV store | System-managed |
| `sqlite_sequence` | Auto-increment tracking | System-managed |

**Note:** There is NO `brief_counter` table — global rate limiting is per-IP only.

### Cloudflare Environment Variables (Secrets)
| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key for assessment features |
| `ADMIN_KEY` | Admin bypass token for rate limiting — pass via `?admin_key=VALUE` URL param |
| `RESEND_API_KEY` | Resend API key for transactional email (Save Results) |
| `DB` | D1 database binding (points to jewell-assessment-db) |

### Email Infrastructure
- **Sending:** Resend (free tier, 3,000 emails/month) — sends styled HTML results from nick@nickjewell.ai
- **Receiving:** Cloudflare Email Routing → forwards to Gmail
- **Reply:** Gmail "Send as" configured for nick@nickjewell.ai
- **DNS:** Resend DKIM + SPF records verified on Cloudflare

### API Integration
- **Provider:** Anthropic Messages API
- **Models used:**
  - Claude Sonnet 4 (`claude-sonnet-4-20250514`) — Taste reasoning follow-ups, CU2 open-ended analysis
  - Claude Opus 4.6 — Executive brief generation
- **Proxy:** Cloudflare Pages Function at `/api-proxy` — adds API key server-side, validates origin, rate limits brief requests, handles Resend email delivery
- **Rate limits:** 3 briefs/IP/day, admin bypass via `?admin_key=` param
- **Cost:** ~$0.03-0.09 per full assessment with brief, $0/month infrastructure

---

## Development Environment

### Nick's Setup
- **OS:** Windows 11
- **Terminal:** PowerShell (no `&&` chaining — run commands one at a time)
- **Code editor:** Claude Code (primary build tool)
- **Node.js:** NOT installed in system PATH — `npx` and `wrangler` commands fail locally
- **D1 operations:** Must be done via Cloudflare dashboard Console tab (not CLI)
- **Git:** Installed, works in PowerShell
- **Claude subscription:** Claude Max (not Pro) — higher usage limits for Claude Code sessions

### Claude Code Best Practices (for Nick)
- `/clear` between tasks to prevent context pollution
- Use plan mode for complex builds
- Ask Claude to interview before big milestones
- Use subagents for investigation
- Don't correct the same mistake twice — clear and reprompt instead
- CLAUDE.md should stay under 3000 tokens — detailed specs live in /docs/

---

## Site Architecture

### Pages
| Page | Path | Status |
|------|------|--------|
| Homepage | `/index.html` | ✅ Live — thesis, pattern section, framework preview, logo section, writing, contact |
| Framework | `/framework/index.html` | ✅ Live — five-layer deep dive, company stories, transitions, sticky layer nav, assessment backlinks |
| Assessment | `/assessment/index.html` | ✅ Live — 3-tier adaptive assessment, API integration, Save Results email, executive brief |
| Writing Index | `/writing/index.html` | ✅ Live — lists all 5 articles with dates, summaries, layer tags |
| Taste Article | `/writing/taste-missing-dimension/index.html` | ✅ Live |
| Accountability Article | `/writing/committees-dont-call/index.html` | ✅ Live |
| Architecture Article | `/writing/automating-the-mess/index.html` | ✅ Live |
| Foundation Article | `/writing/data-somewhere/index.html` | ✅ Live |
| Culture Article | `/writing/training-without-transformation/index.html` | ✅ Live |
| About | `/about/index.html` | ❌ Not yet built — full reference doc + 9 UAT cases ready |

### Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks, no build tools)
- **Typography:** Fraunces (display/headings) + DM Sans (body) via Google Fonts
- **Design tokens:** CSS custom properties in `:root`
- **Aesthetic:** Dark editorial — #080808 backgrounds, #c8965a amber accent, #f0ebe3 warm white text
- **Text tokens (WCAG AA):** primary #f0ebe3, secondary #9a9189, muted #7a756f
- **Film grain overlay:** SVG noise texture at 2.5% opacity via `body::after`

### Repo Structure (Current)
```
nickjewell-ai/
├── index.html                     # Homepage
├── framework/
│   └── index.html                 # Framework deep-dive + sticky layer nav
├── assessment/
│   └── index.html                 # Interactive assessment + Save Results
├── writing/
│   ├── index.html                 # Writing index
│   ├── taste-missing-dimension/
│   │   └── index.html
│   ├── committees-dont-call/
│   │   └── index.html
│   ├── automating-the-mess/
│   │   └── index.html
│   ├── data-somewhere/
│   │   └── index.html
│   └── training-without-transformation/
│       └── index.html
├── css/
│   └── style.css                  # Shared design system
├── js/
│   ├── assessment-engine.js       # Scoring, branching, state management
│   ├── assessment-ui.js           # Conversational UI rendering + ARIA + Save Results handler
│   └── api.js                     # Anthropic API communication via Worker proxy
├── functions/
│   └── api-proxy.js               # Cloudflare Pages Function (API proxy + Resend email)
├── assets/
│   ├── og-image.png               # Homepage OG (1200x630)
│   ├── og-framework.png           # Framework page OG
│   ├── og-assessment.png          # Assessment page OG
│   ├── favicon.svg                # Fraunces "J" in amber
│   └── logos/                     # Company logos for Taste in Practice
│       ├── john-deere.png
│       ├── spotify.png
│       ├── stripe.png
│       ├── netflix.png
│       ├── airbnb.png
│       └── shopify.png
├── sitemap.xml
├── robots.txt
├── CLAUDE.md
├── package.json
├── wrangler.toml
└── .gitignore
```

---

## Milestone Tracker

### Milestone 1: Site Build ✅ (March 28, 2026)
- Full site designed and deployed (homepage, framework page, assessment page)
- Dark editorial aesthetic with Fraunces/DM Sans typography
- Assessment engine with 3-tier adaptive flow (Pulse → Diagnostic → Taste Test)
- 76 billion unique result combinations
- D1 database auto-capturing all completed assessments
- Cloudflare Pages deployment pipeline working

### Milestone 2: Assessment Engine ✅ (March 28, 2026)
- Deterministic scoring across all 4 layers + Taste
- Adaptive branching based on Tier 1 responses
- Taste dimension with 3 sub-dimensions (Frame Recognition, Kill Discipline, Edge-Case Instinct)
- 4 Taste signatures (Sophistication, Pragmatism, Caution, Momentum)
- Verdict system (Green/Amber/Red) with binding constraint identification
- 90-day priority action generation
- Single-click advancement (250ms flash)

### Milestone 3: API Integration ✅ (March 28-29, 2026)
- **Taste reasoning follow-ups:** 16 scenario-specific lead-ins, contextual reasoning options, optional free-text with Sonnet 4 analysis
- **CU2 open-ended analysis:** Free-text failure description scored via Sonnet 4
- **Executive brief:** Opus 4.6 streaming via SSE, gated behind contact form CTA (name/email/company/role)
- **Rate limiting:** Per-IP daily cap (3/day) via D1, admin bypass via URL param
- **Deterministic fallback:** All API features degrade gracefully
- 13 production commits in M3 session

### Milestone 4: Content Strategy + UX ✅ (March 29, 2026)
Executed from UX Audit SOW (scored site 52→85+) + Content Strategy (scored 95/100):

**Accessibility:** WCAG 2.1 AA contrast, :focus-visible, skip-to-content, prefers-reduced-motion, print stylesheet, assessment ARIA (radiogroup, radio, aria-checked, progressbar)

**Navigation:** Full nav (Framework, Assessment, Writing, Contact) + hamburger menu, footer nav, active states, aria-labels

**Homepage sections:** Persona line, 4% stat, "What We Keep Seeing" vignettes, "Taste in Practice" logo section (6 companies), framework preview with diagnostic questions, writing section, contact

**Framework enhancements:** Inter-layer transitions, assessment backlinks, company story anchors, sticky layer nav with scroll-aware highlighting

**SEO:** sitemap.xml, robots.txt, favicon.svg, JSON-LD structured data, per-page OG + Twitter Card meta, OG images for all 3 pages, meta theme-color

**Other:** www redirect, form dark theme + Chrome autofill override, admin bypass passthrough

### Milestone 5: Email Pipeline + Writing Pages ✅ (March 29, 2026)
- **Save Results email:** Styled HTML email via Resend matching site dark aesthetic (verdict badge, layer bars, taste signature, actions)
- **nick@nickjewell.ai:** Cloudflare Email Routing (receive) + Gmail Send As (reply)
- **Resend domain verification:** DKIM + SPF on Cloudflare DNS
- **5 standalone writing pages:** Individual URLs with unique OG tags, JSON-LD Article schema, inline assessment CTAs, related pieces
- **Writing index:** /writing/ with all articles listed
- **Enriched Pulse data:** Structured industry (P3), AI initiatives (P6), company size (P7) captured to D1
- **Framework + Assessment OG images:** Unique 1200x630 per page

---

## Open Work Items (per Roadmap v2)

Full details in NickJewellAI_Roadmap_v2.docx. Summary:

### Build (Claude Code)
| # | Item | Status |
|---|------|--------|
| B1 | /about/ page | OPEN — reference doc ready |
| B2 | Nav update (add About link on all pages) | BLOCKED on B1 |
| B3 | Homepage cross-link to /about/ | BLOCKED on B1 |
| B4 | Executive brief via email (Resend) | OPEN |
| B5 | D1 query endpoint (functions/d1-query.js) | OPEN |
| B6 | Analytics event tracking | OPEN |
| B7 | Substack CTAs on site | BLOCKED on Substack launch |

### Test
| # | Item | Status |
|---|------|--------|
| T1 | UAT v3 (33 test cases) | OPEN — HIGH PRIORITY |
| T2 | Fix Critical/High failures | BLOCKED on T1 |

### Publish
| # | Item | Status |
|---|------|--------|
| P1 | LinkedIn 8-post series | DRAFTED |
| P2 | Substack launch | OPEN |

### Documentation
| # | Item | Status |
|---|------|--------|
| D1 | Update Project Status (this doc) | ✅ DONE |
| D2 | Update CLAUDE.md | ✅ DONE |
| D3 | Submit sitemap to Google Search Console | OPEN |
| D4 | Signal log maintenance | STARTED (Kevin entry) |

---

## Key Documents in Claude Project

| Document | Purpose |
|----------|---------|
| jewell-assessment-framework.md / .pdf | Full 5-layer framework IP |
| assessment-spec.md | Question bank, scoring rubrics, branching logic |
| architecture.md | Site architecture, data flow, deployment pipeline |
| design-system.md | Typography, colors, spacing, components |
| taste-ip.md | Proprietary Taste scoring methodology |
| uniqueness-stats.md | 76 billion combinations analysis |
| linkedin-content.md | 8-post content calendar with drafts |
| CLAUDE.md | Claude Code context file |
| Milestone3_Build_Analysis.docx | Interview-ready M3 analysis |
| NickJewellAI_Project_Build_Report.docx | Full portfolio build report (91/100) |
| Jewell_Assessment_UAT_v3.docx | 33-case test plan (8 categories) |
| NickJewellAI_UX_Audit_SOW.docx | UX audit — 27 work items |
| NickJewellAI_Content_Strategy.docx | Content strategy (95/100) |
| NickJewellAI_About_Page_Reference.docx | About page copy + build spec (9.5/10) |
| NickJewellAI_Substack_Campaign.docx | Substack launch plan + 12-step checklist |
| NickJewellAI_Roadmap_v2.docx | Full project roadmap (17 open items) |
| JewellAssessment_D1_SQL_Queries.docx | D1 query reference |

---

## Quick Reference

| What | Where |
|------|-------|
| Live site | https://www.nickjewell.ai |
| Assessment | https://www.nickjewell.ai/assessment/ |
| Admin assessment | https://www.nickjewell.ai/assessment/?admin_key=[SECRET] |
| Framework | https://www.nickjewell.ai/framework/ |
| Writing | https://www.nickjewell.ai/writing/ |
| GitHub repo | https://github.com/Nickjewell-AI/nickjewell-ai |
| Cloudflare dashboard | dash.cloudflare.com |
| D1 Console | Cloudflare → Storage & Databases → D1 → jewell-assessment-db → Console |
| Resend dashboard | resend.com/emails |
| Anthropic console | console.anthropic.com |
| LinkedIn | linkedin.com/in/nickjewell-ai |
| Professional email | nick@nickjewell.ai |
| Deploy | `git add -A` → `git commit -m "msg"` → `git push origin main` (one at a time in PowerShell) |
