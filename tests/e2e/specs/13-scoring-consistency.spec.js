import { test, expect } from '@playwright/test';
import { runAssessment, extractResults } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('Scoring — Consistency Modifier', () => {
  test('all-same-letter diagnostic answers apply consistency penalty', async ({ page }) => {
    // Use momentum profile which answers all-D in diagnostic
    await runAssessment(page, profiles.momentum);
    const results = await extractResults(page);

    // Composite score should reflect the consistency penalty
    const score = parseInt(results.compositeScore);
    expect(score).toBeDefined();
    // All-same answers should produce a lower score than varied answers at same average
    expect(score).toBeLessThan(40);
  });

  test('varied diagnostic answers avoid consistency penalty', async ({ page }) => {
    // Pragmatism profile has varied B/C answers
    await runAssessment(page, profiles.pragmatism);
    const results = await extractResults(page);

    const score = parseInt(results.compositeScore);
    expect(score).toBeDefined();
    // Varied mid-range answers should land in Amber range
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThan(70);
  });

  test('deterministic — same inputs produce same outputs', async ({ page }) => {
    // Run sophistication twice and compare
    await runAssessment(page, profiles.sophistication);
    const results1 = await extractResults(page);

    await runAssessment(page, profiles.sophistication);
    const results2 = await extractResults(page);

    expect(results1.verdict).toBe(results2.verdict);
    expect(results1.compositeScore).toBe(results2.compositeScore);
    expect(results1.tasteName).toBe(results2.tasteName);
    expect(results1.dimFrame).toBe(results2.dimFrame);
    expect(results1.dimKill).toBe(results2.dimKill);
    expect(results1.dimEdge).toBe(results2.dimEdge);
  });
});
