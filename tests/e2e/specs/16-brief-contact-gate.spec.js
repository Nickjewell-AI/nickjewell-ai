import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('Brief — Contact Form Gate', () => {
  test('results visible without filling contact form', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);

    // Results should be visible
    await expect(page.locator('#verdict-label')).toBeVisible();
    await expect(page.locator('#layer-bars')).toBeVisible();
    await expect(page.locator('#taste-signature')).toBeVisible();
    await expect(page.locator('#actions-list')).toBeVisible();
  });

  test('brief does not generate without contact info', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);

    // Try to submit empty form
    await page.click('.brief-contact-submit');

    // Brief text should NOT appear
    await expect(page.locator('.brief-text-container')).toBeHidden();
  });

  test('brief generates after filling contact form', async ({ page }) => {
    await runAssessment(page, profiles.sophistication, {
      fillBrief: true,
      briefData: {
        name: 'Gate Test',
        email: 'gate@test.dev',
        company: 'Gate Corp',
        role: 'Tester',
      },
    });

    // Wait for brief to start streaming
    await page.waitForSelector('.brief-text-container:not(.hidden)', { timeout: 30000 });

    // Verify brief has content
    const briefText = await page.$eval('.brief-text-container', el => el.textContent);
    expect(briefText.length).toBeGreaterThan(100);
  });
});
