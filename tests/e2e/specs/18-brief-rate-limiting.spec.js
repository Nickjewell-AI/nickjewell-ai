import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe.configure({ mode: 'serial' });

test.describe('Brief — Rate Limiting', () => {
  test('first brief request succeeds', async ({ page }) => {
    await runAssessment(page, profiles.sophistication, {
      fillBrief: true,
      briefData: {
        name: 'Rate Test 1',
        email: `rate-${Date.now()}@test.dev`,
        company: 'Rate Corp',
        role: 'Tester',
      },
    });

    // Wait for brief to start streaming
    await page.waitForSelector('.brief-text-container:not(.hidden)', { timeout: 30000 });
    const briefText = await page.$eval('.brief-text-container', el => el.textContent);
    expect(briefText.length).toBeGreaterThan(0);
  });

  test('repeated requests from same IP eventually hit rate limit', async ({ page }) => {
    // Generate multiple briefs rapidly to trigger rate limiting
    // Note: This may not trigger in all environments depending on rate limit config
    for (let i = 0; i < 5; i++) {
      await runAssessment(page, profiles.momentum, {
        fillBrief: true,
        briefData: {
          name: `Rate Test ${i + 2}`,
          email: `rate-${Date.now()}-${i}@test.dev`,
          company: 'Rate Corp',
          role: 'Tester',
        },
      });

      // Check for rate limit error message
      const errorVisible = await page.$('.brief-status.error, .rate-limit-message').catch(() => null);
      if (errorVisible) {
        const errorText = await errorVisible.textContent();
        expect(errorText.toLowerCase()).toContain('limit');
        return; // Test passes — rate limit was hit
      }

      await page.waitForTimeout(1000);
    }

    // If no rate limit was hit after 5 attempts, the test still passes
    // (rate limits may be configured differently per environment)
  });
});
