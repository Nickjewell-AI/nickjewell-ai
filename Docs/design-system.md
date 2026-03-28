# Design System
## nickjewell.ai — Visual Language

---

## Aesthetic Direction
**Dark editorial.** Think: premium tech publication meets strategic consultancy. Authoritative without being cold, distinctive without being flashy. The site should feel like it was designed by someone with taste — because that's literally what it's measuring.

---

## Typography

### Fonts
- **Display / Headings:** Fraunces (Google Fonts) — variable, optical size 9-144
  - Hero: weight 300 (light, elegant)
  - Section titles: weight 400
  - Emphasis: weight 600 italic
- **Body / UI:** DM Sans (Google Fonts)
  - Body text: weight 400
  - Labels: weight 500
  - Buttons: weight 600

### Scale
```
Hero H1:        clamp(2.8rem, 6vw, 4.5rem)  | Fraunces 300 | line-height: 1.15
Section H2:     1.8rem                        | Fraunces 300 | line-height: 1.3
Card H3:        1.35rem                       | Fraunces 400 | line-height: 1.3
Body:           1rem (16px)                   | DM Sans 400  | line-height: 1.7
Body large:     1.15rem                       | DM Sans 400  | line-height: 1.8
Small/labels:   0.82rem                       | DM Sans 500  | letter-spacing: 0.06em
Tiny/tags:      0.72rem                       | DM Sans 500  | letter-spacing: 0.08em, uppercase
```

### Letter Spacing
- Headings: -0.02em to -0.03em (tighter)
- Body: 0 (default)
- Labels/tags: +0.06em to +0.14em (tracked out, uppercase)

---

## Color Palette

### CSS Custom Properties
```css
:root {
  /* Backgrounds */
  --bg-primary:     #080808;
  --bg-secondary:   #0f0f0f;
  --bg-card:        #141414;
  --bg-card-hover:  #1a1a1a;

  /* Text */
  --text-primary:   #f0ebe3;     /* warm white */
  --text-secondary: #8a8279;     /* warm gray */
  --text-muted:     #5a5550;     /* dim warm gray */

  /* Accent */
  --accent:         #c8965a;     /* warm amber */
  --accent-dim:     #c8965a33;   /* amber at 20% opacity */
  --accent-hover:   #daa76b;     /* lighter amber for hover */

  /* Borders */
  --border:         #222019;
  --border-light:   #2a2720;

  /* Verdict Colors */
  --verdict-green:  #4a9968;
  --verdict-amber:  #c8965a;     /* same as accent */
  --verdict-red:    #c45a5a;

  /* Taste Signature Colors */
  --taste-sophistication: #7a8ec8;
  --taste-pragmatism:     #4a9968;
  --taste-caution:        #c8965a;
  --taste-momentum:       #c45a5a;
}
```

### Usage Rules
- **Accent color (#c8965a)** is used sparingly — section numbers, emphasized words, hover states, interactive elements. Never for large blocks.
- **Text hierarchy** is handled through the three text colors, not through bold/size alone.
- **Backgrounds** create depth through subtle layering (#080808 → #0f0f0f → #141414), never through gradients.
- **Selection highlight:** accent color background with dark text.

---

## Spacing System

### Base Unit: 0.25rem (4px)
```
--space-1:   0.25rem    (4px)
--space-2:   0.5rem     (8px)
--space-3:   0.75rem    (12px)
--space-4:   1rem       (16px)
--space-6:   1.5rem     (24px)
--space-8:   2rem       (32px)
--space-12:  3rem       (48px)
--space-16:  4rem       (64px)
--space-24:  6rem       (96px)
```

### Section Spacing
- Section padding: `6rem 2rem` (desktop), `4rem 1.5rem` (mobile)
- Section max-width: `900px` centered
- Card padding: `2rem 2.2rem`
- Element gaps: `1.5rem` to `2rem`

---

## Components

### Section Headers
```
[Section number] [Section title]
─────────────────────────────────
  01              Writing
```
- Number: Fraunces 0.85rem, accent color
- Title: Fraunces 1.8rem, weight 300
- Bottom border: 1px solid --border
- Margin-bottom: 3.5rem

### Cards (Project / Assessment Result)
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 2rem 2.2rem;
  transition: all 0.35s ease;
  position: relative;
}

.card::before {
  /* Left accent bar — 0 height, grows on hover */
  width: 3px;
  background: var(--accent);
  height: 0;
  transition: height 0.4s ease;
}

.card:hover {
  border-color: var(--border-light);
  background: var(--bg-card-hover);
  transform: translateX(4px);
}

.card:hover::before { height: 100%; }
```

### Writing List Items
```css
.writing-item {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  /* Date | Title | Tag */
  border-bottom: 1px solid var(--border);
  padding: 1.5rem 0;
}
```

### Contact Links
```css
.contact-link {
  display: flex;
  justify-content: space-between;
  border: 1px solid var(--border);
  padding: 1rem 1.2rem;
  /* Label on left, arrow on right */
}

.contact-link:hover {
  border-color: var(--accent);
  padding-left: 1.5rem;  /* slides right on hover */
}
```

### Assessment UI Components

**Question Card:**
```css
.question-card {
  background: var(--bg-secondary);
  border-left: 3px solid var(--accent);
  padding: 2rem;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.4s ease;
}
```

**Option Buttons:**
```css
.option-button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 1rem 1.5rem;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s;
}

.option-button:hover {
  border-color: var(--accent);
  background: var(--bg-card-hover);
  padding-left: 2rem;
}

.option-button.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}
```

**Verdict Badge:**
```css
.verdict-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border: 2px solid;
}

.verdict-green  { color: var(--verdict-green); border-color: var(--verdict-green); }
.verdict-amber  { color: var(--verdict-amber); border-color: var(--verdict-amber); }
.verdict-red    { color: var(--verdict-red);   border-color: var(--verdict-red);   }
```

**Layer Profile Bar:**
```css
.layer-bar {
  height: 8px;
  background: var(--bg-card);
  border-radius: 0;  /* sharp edges match editorial aesthetic */
}

.layer-bar-fill {
  height: 100%;
  transition: width 1s ease;
  /* Color varies by score: accent for mid, green for high, red for low */
}
```

---

## Animations

### Scroll Reveal
```css
.fade-in {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

Triggered by IntersectionObserver at threshold 0.1 with staggered delays.

### Hover Effects
- Cards: translateX(4px) + accent bar grows
- Links: padding-left increases (slides right)
- Nav links: underline grows from left

### Assessment Flow
- Questions fade in sequentially
- Selected option briefly highlights then fades to confirmed state
- Next question appears with 300ms delay
- Results build incrementally (verdict first, then bars fill, then text appears)

---

## Film Grain Overlay
```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,..."); /* noise SVG */
  background-repeat: repeat;
  background-size: 256px 256px;
}
```

Subtle. Almost imperceptible. Creates texture that prevents the dark background from feeling flat/digital.

---

## Responsive Breakpoints

### Desktop (>768px)
- Max content width: 900px
- Full grid layouts
- Hover effects active

### Mobile (≤768px)
- Padding reduces to 1.2-1.5rem
- Writing grid collapses to single column
- Tags hidden on writing items
- Resume grid collapses to single column
- Contact grid collapses to single column
- Nav links: smaller text, tighter gaps
- Assessment: full-width option buttons, larger tap targets (min 48px height)

---

## Assets Needed

### OG Image (1200x630)
Dark background, Fraunces heading: "The Jewell Assessment"
Subline: "AI Implementation Readiness & Taste Framework"
5-layer diagram simplified
nickjewell.ai in corner

### Favicon
Simple geometric mark. Options:
- "J" in Fraunces italic, amber on dark
- Abstract 5-layer stack icon
- Minimal monogram

Both generated during build phase.
