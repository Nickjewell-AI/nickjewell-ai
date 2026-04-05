import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('Capture Gate — Results Gating', () => {
  test('all results sections are visible after capture form is submitted', async ({ page }) => {
    // runAssessment auto-fills and submits the capture gate — after that,
    // showAllResults() reveals every results section.
    await runAssessment(page, profiles.sophistication);

    await expect(page.locator('#verdict-label')).toBeVisible();
    await expect(page.locator('#layer-bars')).toBeVisible();
    await expect(page.locator('#taste-signature')).toBeVisible();
    await expect(page.locator('#actions-list')).toBeVisible();
  });

  test('all capture-form fields have the required HTML attribute', async ({ page }) => {
    // Run the assessment but stop at the capture gate — do not submit it.
    await runAssessment(page, profiles.sophistication, { skipCapture: true });

    for (const id of ['#capture-name', '#capture-email', '#capture-company', '#capture-role']) {
      const required = await page.getAttribute(id, 'required');
      expect(required, `${id} must have required attribute`).not.toBeNull();
    }
  });

  test('empty submit leaves results hidden; valid submit reveals them', async ({ page }) => {
    await runAssessment(page, profiles.sophistication, { skipCapture: true });

    // Capture screen is visible, downstream results sections are still hidden.
    await expect(page.locator('#email-capture-screen')).toBeVisible();
    await expect(page.locator('.results-header')).toBeHidden();
    await expect(page.locator('#detailed-results')).toBeHidden();
    await expect(page.locator('#executive-brief-section')).toBeHidden();

    // Empty submit: required attributes prevent the submit handler from
    // advancing — capture screen still showing, results sections still hidden.
    await page.click('#capture-form button[type="submit"]');
    await page.waitForTimeout(500);
    await expect(page.locator('#email-capture-screen')).toBeVisible();
    await expect(page.locator('.results-header')).toBeHidden();
    await expect(page.locator('#detailed-results')).toBeHidden();

    // Fill all four fields and submit.
    await page.fill('#capture-name', 'Gate Test');
    await page.fill('#capture-email', 'gate@playwright.dev');
    await page.fill('#capture-company', 'Gate Corp');
    await page.fill('#capture-role', 'Tester');
    await page.click('#capture-form button[type="submit"]');

    // Capture screen hides, results sections reveal.
    await expect(page.locator('#email-capture-screen')).toBeHidden();
    await expect(page.locator('.results-header')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#detailed-results')).toBeVisible();
    await expect(page.locator('#executive-brief-section')).toBeVisible();
  });
});
