import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import { waitForBriefStream } from '../helpers/wait-utils.js';
import profiles from '../fixtures/profiles.json';

// Two of the three tests hit real Opus with mockApi:false. Concurrent real
// streaming from multiple workers can cause Anthropic to truncate streams,
// so run this file serially.
test.describe.configure({ mode: 'serial' });

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

  test('brief auto-triggers after capture submit — brief-text-container becomes visible', async ({ page }) => {
    // Default mocks (cost guard) return a canned SSE stream for type:brief.
    // After runAssessment submits the capture form, showAllResults() auto-
    // triggers triggerBriefGeneration() after ~1s, which un-hides
    // .brief-text-container and starts streaming.
    await runAssessment(page, profiles.sophistication);

    const briefContainer = page.locator('.brief-text-container');
    await expect(briefContainer).toBeVisible({ timeout: 15000 });

    // Mock stream populates content within a second or two.
    await page.waitForTimeout(2000);
    const text = await briefContainer.textContent();
    expect(text.length).toBeGreaterThan(10);
  });
});
