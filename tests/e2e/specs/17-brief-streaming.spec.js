import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import { waitForBriefStream } from '../helpers/wait-utils.js';
import profiles from '../fixtures/profiles.json';

test.describe('Brief — Streaming UX', () => {
  test('brief text appears progressively', async ({ page }) => {
    await runAssessment(page, profiles.sophistication, {
      fillBrief: true, mockApi: false,
      briefData: {
        name: 'Stream Test',
        email: 'stream@test.dev',
        company: 'Stream Corp',
        role: 'Tester',
      },
    });

    // Wait for brief container to appear
    await page.waitForSelector('.brief-text-container:not(.hidden)', { timeout: 30000 });

    // Capture initial length
    const initialLength = await page.$eval('.brief-text-container', el => el.textContent.length);

    // Wait a moment and check that content has grown (streaming)
    await page.waitForTimeout(3000);
    const laterLength = await page.$eval('.brief-text-container', el => el.textContent.length);

    expect(laterLength).toBeGreaterThan(initialLength);
  });

  test('brief reaches substantial length when complete', async ({ page }) => {
    await runAssessment(page, profiles.pragmatism, {
      fillBrief: true, mockApi: false,
      briefData: {
        name: 'Length Test',
        email: 'length@test.dev',
        company: 'Length Corp',
        role: 'Tester',
      },
    });

    await waitForBriefStream(page);

    const briefText = await page.$eval('.brief-text-container', el => el.textContent);
    // Executive brief should be substantial — at least 500 characters
    expect(briefText.length).toBeGreaterThan(500);
  });

  test('brief status indicator shows during generation', async ({ page }) => {
    await runAssessment(page, profiles.sophistication, {
      fillBrief: true, mockApi: false,
      briefData: {
        name: 'Status Test',
        email: 'status@test.dev',
        company: 'Status Corp',
        role: 'Tester',
      },
    });

    // Brief status should appear during generation
    const statusEl = page.locator('.brief-status');
    await expect(statusEl).toBeVisible({ timeout: 15000 });
  });
});
