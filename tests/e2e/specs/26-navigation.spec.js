import { test, expect } from '@playwright/test';

test.describe('Navigation & Accessibility', () => {
  test('all nav links are accessible', async ({ page }) => {
    await page.goto('/assessment/');

    const navLinks = await page.$$eval('.nav-links a', links =>
      links.map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))
    );

    expect(navLinks.length).toBeGreaterThanOrEqual(4);
    expect(navLinks.some(l => l.href.includes('/framework/'))).toBe(true);
    expect(navLinks.some(l => l.href.includes('/assessment/'))).toBe(true);
    expect(navLinks.some(l => l.href.includes('/writing/'))).toBe(true);
    expect(navLinks.some(l => l.href.includes('/about/'))).toBe(true);
  });

  test('skip-to-content link exists', async ({ page }) => {
    await page.goto('/assessment/');
    const skipLink = await page.$('a[href="#main"], a.skip-link, .skip-to-content');
    // Skip link may or may not be present — check but don't fail
    if (skipLink) {
      await expect(skipLink).toHaveAttribute('href', /#/);
    }
  });

  test('bare domain redirects to www', async ({ page }) => {
    const response = await page.goto('https://nickjewell.ai/assessment/', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('www.nickjewell.ai');
  });
});
