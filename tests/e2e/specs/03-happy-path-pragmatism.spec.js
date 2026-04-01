import { test, expect } from '@playwright/test';
import { runAssessment, extractResults } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

const profile = profiles.pragmatism;

test.describe('Happy Path — Pragmatism Profile', () => {
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

    // Binding constraint should be accountability for mixed profile
    expect(results.constraintTitle.toLowerCase()).toContain(profile.expected.bindingConstraint);
  });

  test('results page shows all required sections', async ({ page }) => {
    await runAssessment(page, profile);

    await expect(page.locator('#verdict-badge')).toBeVisible();
    await expect(page.locator('#verdict-summary')).toBeVisible();
    await expect(page.locator('#executive-brief-section')).toBeVisible();
    await expect(page.locator('#taste-signature')).toBeVisible();
    await expect(page.locator('#constraint-title')).toBeVisible();
    await expect(page.locator('#actions-list')).toBeVisible();
    await expect(page.locator('.substack-cta')).toBeVisible();
    await expect(page.locator('#retake-btn')).toBeVisible();
  });
});
