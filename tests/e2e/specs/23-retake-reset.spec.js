import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import { SEL } from '../helpers/selectors.js';
import profiles from '../fixtures/profiles.json';

test.describe('Retake Reset', () => {
  test('retake clears all state and returns to intro', async ({ page }) => {
    await runAssessment(page, profiles.momentum);

    // Click retake
    await page.click(SEL.retakeBtn);

    // Should be back at intro
    await expect(page.locator(SEL.introSection)).toBeVisible();
    await expect(page.locator(SEL.resultsSection)).toBeHidden();

    // Sticky brief bar should be hidden
    const stickyVisible = await page.$eval(SEL.briefStickyCta, el => {
      return window.getComputedStyle(el).display !== 'none';
    }).catch(() => false);
    expect(stickyVisible).toBe(false);

    // Progress should be reset
    await page.click(SEL.startBtn);
    const pct = await page.$eval(SEL.progressFill, el => parseInt(el.style.width));
    expect(pct).toBe(0);
  });
});
