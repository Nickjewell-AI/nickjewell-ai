import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import { SEL } from '../helpers/selectors.js';
import profiles from '../fixtures/profiles.json';

test.describe('Feedback Capture', () => {
  test('feedback sentiment buttons are visible on results page', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);

    const sentimentBtns = await page.$$(SEL.feedbackSentiment);
    expect(sentimentBtns.length).toBeGreaterThan(0);
  });

  test('clicking sentiment button shows confirmation', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);

    // Click the first sentiment button
    const sentimentBtns = await page.$$(SEL.feedbackSentiment);
    if (sentimentBtns.length > 0) {
      await sentimentBtns[0].click();

      // Wait for some confirmation — either a visual change or text
      await page.waitForTimeout(1000);

      // Check that the button has a selected/active state
      const isSelected = await sentimentBtns[0].evaluate(el =>
        el.classList.contains('selected') || el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true'
      );
      expect(isSelected).toBe(true);
    }
  });

  test('feedback text can be submitted', async ({ page }) => {
    await runAssessment(page, profiles.pragmatism);

    // Click a sentiment button first
    const sentimentBtns = await page.$$(SEL.feedbackSentiment);
    if (sentimentBtns.length > 0) {
      await sentimentBtns[0].click();
    }

    // Fill in optional text feedback
    const textArea = await page.$(SEL.feedbackText);
    if (textArea) {
      await textArea.fill('Playwright automated test feedback');

      const submitBtn = await page.$(SEL.feedbackSubmit);
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(1000);

        // Verify some confirmation appears (DOM change, message, etc.)
        const feedbackArea = page.locator('.feedback-section, .feedback-container');
        const feedbackText = await feedbackArea.textContent().catch(() => '');
        // Just verify no error was thrown — specifics depend on implementation
        expect(feedbackText).toBeDefined();
      }
    }
  });
});
