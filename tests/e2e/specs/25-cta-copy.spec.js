import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('CTA Copy Validation', () => {
  test('assessment results page shows correct CTA', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);

    const ctaText = await page.$eval('.substack-cta', el => el.textContent);
    expect(ctaText).toContain('playbook');
  });

  test('footer nav shows correct Substack link text', async ({ page }) => {
    await page.goto('/assessment/');

    const footerLinks = await page.$$eval('.footer-nav a', links =>
      links.map(a => ({ text: a.textContent.trim(), href: a.href }))
    );

    const substackLink = footerLinks.find(l => l.href.includes('substack'));
    expect(substackLink).toBeTruthy();
    expect(substackLink.text).toContain('Constr');
  });
});
