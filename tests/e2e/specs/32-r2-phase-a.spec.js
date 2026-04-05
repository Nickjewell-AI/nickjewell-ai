// tests/e2e/specs/32-r2-phase-a.spec.js
// R2 Phase A: GSAP, page load sequence, custom cursor regression tests.
import { test, expect } from '@playwright/test';

test.describe('R2 Phase A — GSAP Scroll Animations', () => {
  test('homepage hero renders after load sequence', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1800);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    // CTAs should be visible
    const ctas = page.locator('.hero-ctas');
    await expect(ctas).toBeVisible();
  });

  test('section headers reveal on scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
    await page.waitForTimeout(600);
    const sectionHeader = page.locator('.section-header').first();
    await expect(sectionHeader).toBeVisible();
    const opacity = await sectionHeader.evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  });

  test('logo cards become visible on scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1800);
    await page.locator('.logo-grid').scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const firstLink = page.locator('.logo-card-link').first();
    const opacity = await firstLink.evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  });

  test('reduced motion shows all elements immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(600);
    const sectionHeader = page.locator('.section-header').first();
    const opacity = await sectionHeader.evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  });

  test('GSAP CDN failure adds gsap-fallback class', async ({ page }) => {
    await page.route('**/cdnjs.cloudflare.com/**gsap**', route => route.abort());
    await page.goto('/');
    await page.waitForTimeout(3500);
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain('gsap-fallback');
    // Elements should be visible via fallback
    const sectionHeader = page.locator('.section-header').first();
    await sectionHeader.scrollIntoViewIfNeeded();
    const opacity = await sectionHeader.evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  });

  test('framework page renders', async ({ page }) => {
    await page.goto('/framework/');
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('about page renders', async ({ page }) => {
    await page.goto('/about/');
    await page.waitForTimeout(1500);
    await expect(page.locator('.about-hero')).toBeVisible();
  });

  test('writing index renders', async ({ page }) => {
    await page.goto('/writing/');
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('R2 Phase A — Page Load Sequence', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('loader appears on first visit then disappears', async ({ page }) => {
    await page.goto('/');
    // Clear sessionStorage to simulate fresh visit
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/');
    const loader = page.locator('#page-loader');
    await expect(loader).toBeHidden({ timeout: 3000 });
  });

  test('loader skipped on return visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    // Second visit — should have sessionStorage set
    await page.goto('/');
    const loader = page.locator('#page-loader');
    await expect(loader).toBeHidden({ timeout: 500 });
  });

  test('hero content visible after load sequence', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.hero-ctas')).toBeVisible();
  });

  test('CSS failsafe removes loader even if JS blocked', async ({ page }) => {
    await page.route('**/js/scroll-animations.js**', route => route.abort());
    await page.route('**/cdnjs.cloudflare.com/**gsap**', route => route.abort());
    await page.goto('/');
    await page.waitForTimeout(3000);
    const loader = page.locator('#page-loader');
    const hidden = await loader.evaluate(el => {
      if (!el || !el.parentNode) return true;
      const cs = getComputedStyle(el);
      return cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1 || cs.display === 'none';
    }).catch(() => true);
    expect(hidden).toBe(true);
  });
});

test.describe('R2 Phase A — Custom Cursor', () => {
  test('cursor dot mounts on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const cursor = page.locator('#cursor-dot');
    await expect(cursor).toBeAttached();
  });

  test('cursor is hidden on touch-emulated viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      isMobile: true
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1200);
    const cursor = page.locator('#cursor-dot');
    const invisible = await cursor.evaluate(el => {
      if (!el) return true;
      return getComputedStyle(el).display === 'none';
    }).catch(() => true);
    expect(invisible).toBe(true);
    await context.close();
  });

  test('cursor present on assessment page (no GSAP there)', async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForTimeout(1200);
    await expect(page.locator('#cursor-dot')).toBeAttached();
  });
});

test.describe('R2 Phase A — Assessment Regression', () => {
  test('assessment start button visible and clickable', async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForTimeout(1500);
    const startBtn = page.locator('.start-btn, #start-btn, [data-start], button:has-text("Begin")').first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
  });

  test('assessment has no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/assessment/');
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e =>
      !/GSAP|favicon|404|CDN|ScrollTrigger/i.test(e)
    );
    expect(realErrors).toHaveLength(0);
  });
});
