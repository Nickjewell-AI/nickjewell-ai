import { test, expect } from '@playwright/test';
import { SEL } from '../helpers/selectors.js';
import { waitForQuestionCard, getProgressPercent } from '../helpers/wait-utils.js';

test.describe('Progress Bar — Phase Accuracy', () => {
  test('progress stays within correct phase ranges', async ({ page }) => {
    await page.goto('/assessment/');
    await page.click(SEL.startBtn);
    await waitForQuestionCard(page);

    let previousPct = 0;

    // Track progress through Pulse (should be 0-25%)
    for (let i = 0; i < 5; i++) {
      const pct = await getProgressPercent(page);
      expect(pct).toBeLessThanOrEqual(25);
      expect(pct).toBeGreaterThanOrEqual(previousPct); // Never jumps backward
      previousPct = pct;

      // Answer with first available option
      const btns = await page.$$('.option-button:not([disabled])');
      if (btns.length > 0) {
        await btns[0].click();
        await page.waitForTimeout(500);
        await waitForQuestionCard(page);
      }
    }

    // After Pulse, should be at 25% — now in Diagnostic phase
    const postPulse = await getProgressPercent(page);
    expect(postPulse).toBeGreaterThanOrEqual(25);

    // Continue answering Diagnostic — should stay 25-75%
    let diagnosticCount = 0;
    while (diagnosticCount < 20) {
      const tierText = await page.$eval(SEL.tierLabel, el => el.textContent);
      if (tierText.includes('Taste')) break;

      const pct = await getProgressPercent(page);
      expect(pct).toBeGreaterThanOrEqual(25);
      expect(pct).toBeLessThanOrEqual(75);
      expect(pct).toBeGreaterThanOrEqual(previousPct);
      previousPct = pct;

      const btns = await page.$$('.option-button:not([disabled])');
      if (btns.length === 0) break;
      await btns[0].click();
      await page.waitForTimeout(500);
      await waitForQuestionCard(page);
      diagnosticCount++;
    }
  });
});
