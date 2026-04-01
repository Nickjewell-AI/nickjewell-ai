import { test, expect } from '@playwright/test';
import { runAssessment, extractResults } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('Scoring — Dimensional Validation', () => {
  test('sophistication profile produces expected dimension ranges', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);
    const results = await extractResults(page);

    // Parse dimension values (format: "6/8")
    const frameParts = results.dimFrame.split('/');
    const frameScore = parseInt(frameParts[0]);
    const frameMax = parseInt(frameParts[1]);

    expect(frameMax).toBe(8);
    expect(frameScore).toBeGreaterThanOrEqual(5); // Sophistication requires FR >= 5
  });

  test('momentum profile produces low dimension totals', async ({ page }) => {
    await runAssessment(page, profiles.momentum);
    const results = await extractResults(page);

    const frame = parseInt(results.dimFrame.split('/')[0]);
    const kill = parseInt(results.dimKill.split('/')[0]);
    const edge = parseInt(results.dimEdge.split('/')[0]);
    const total = frame + kill + edge;

    expect(total).toBeLessThanOrEqual(6); // Momentum threshold
  });
});
