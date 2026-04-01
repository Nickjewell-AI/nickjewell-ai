import { test, expect } from '@playwright/test';
import { SEL } from '../helpers/selectors.js';
import { waitForQuestionCard } from '../helpers/wait-utils.js';

test.describe('Scroll Behavior', () => {
  test('question text is not cut off by nav after answering', async ({ page }) => {
    await page.goto('/assessment/');
    await page.click(SEL.startBtn);
    await waitForQuestionCard(page);

    // Answer first 3 Pulse questions and check scroll position each time
    const pulseKeys = ['A', 'C', 'C'];
    for (const key of pulseKeys) {
      // Select option
      const btns = await page.$$('.option-button:not([disabled])');
      for (const btn of btns) {
        const keyText = await btn.$eval('.option-key', el => el.textContent.trim());
        if (keyText === key) {
          await btn.click();
          break;
        }
      }
      await waitForQuestionCard(page);

      // Verify the latest question text is not obscured by nav
      const navHeight = await page.$eval('.nav', el => el.offsetHeight);
      const latestQuestion = await page.$$('.question-text, .module-question .question-text');
      if (latestQuestion.length > 0) {
        const lastQ = latestQuestion[latestQuestion.length - 1];
        const box = await lastQ.boundingBox();
        if (box) {
          expect(box.y).toBeGreaterThanOrEqual(navHeight);
        }
      }
    }
  });
});
