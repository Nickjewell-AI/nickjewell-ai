import { test, expect } from '@playwright/test';
import { runAssessment, extractResults } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('Scoring — Signature Thresholds', () => {
  test('high-scoring profile produces Sophistication signature', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);
    const results = await extractResults(page);

    expect(results.tasteName).toContain('Sophistication');
  });

  test('low-scoring profile produces Momentum signature', async ({ page }) => {
    await runAssessment(page, profiles.momentum);
    const results = await extractResults(page);

    expect(results.tasteName).toContain('Momentum');
  });

  test('mid-scoring profile produces Pragmatism signature', async ({ page }) => {
    await runAssessment(page, profiles.pragmatism);
    const results = await extractResults(page);

    expect(results.tasteName).toContain('Pragmatism');
  });

  test('verdict colors match score ranges', async ({ page }) => {
    // Green >= 70
    await runAssessment(page, profiles.sophistication);
    let results = await extractResults(page);
    expect(results.verdict).toBe('Green');
    expect(parseInt(results.compositeScore)).toBeGreaterThanOrEqual(70);

    // Amber 40-69
    await runAssessment(page, profiles.pragmatism);
    results = await extractResults(page);
    expect(results.verdict).toBe('Amber');
    const amberScore = parseInt(results.compositeScore);
    expect(amberScore).toBeGreaterThanOrEqual(40);
    expect(amberScore).toBeLessThan(70);

    // Red < 40
    await runAssessment(page, profiles.momentum);
    results = await extractResults(page);
    expect(results.verdict).toBe('Red');
    expect(parseInt(results.compositeScore)).toBeLessThan(40);
  });
});
