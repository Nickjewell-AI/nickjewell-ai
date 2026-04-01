import { test, expect } from '@playwright/test';
import { runAssessment, extractResults } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

const profile = profiles.sophistication;

test.describe('Happy Path — Sophistication Profile', () => {
  test('completes full assessment and shows correct results', async ({ page }) => {
    await runAssessment(page, profile);
    const results = await extractResults(page);

    expect(results.verdict).toBe(profile.expected.verdict);
    expect(results.tasteName).toContain(profile.expected.signature);
    expect(results.hasActionPlan).toBe(true);

    // Verify all four layer bars are present
    expect(results.layerScores.length).toBe(4);

    // Verify dimension values are populated
    expect(results.dimFrame).toBeTruthy();
    expect(results.dimKill).toBeTruthy();
    expect(results.dimEdge).toBeTruthy();
  });

  test('results page shows all required sections', async ({ page }) => {
    await runAssessment(page, profile);

    // Verdict
    await expect(page.locator('#verdict-badge')).toBeVisible();
    await expect(page.locator('#verdict-summary')).toBeVisible();

    // Brief section
    await expect(page.locator('#executive-brief-section')).toBeVisible();

    // Taste signature
    await expect(page.locator('#taste-signature')).toBeVisible();

    // Constraint diagnosis
    await expect(page.locator('#constraint-title')).toBeVisible();

    // Action plan
    await expect(page.locator('#actions-list')).toBeVisible();

    // Substack CTA
    await expect(page.locator('.substack-cta')).toBeVisible();

    // Retake button
    await expect(page.locator('#retake-btn')).toBeVisible();
  });
});
