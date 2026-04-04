import { test, expect } from '@playwright/test';
import { runAssessment, extractResults } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('Scoring — Dimensional Validation', () => {
  test('sophistication profile produces expected dimension ranges', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);
    const results = await extractResults(page);

    // Parse dimension values (format: "X/6")
    const frameParts = results.dimFrame.split('/');
    const frameScore = parseInt(frameParts[0]);
    const frameMax = parseInt(frameParts[1]);

    // Engine: frameRecognition max = 6 (see assessment-engine.js scoreTaste clamping)
    expect(frameMax).toBe(6);
    // Sophistication signature requires FR >= 4 AND all dims >= 2 (see getTasteSignature)
    expect(frameScore).toBeGreaterThanOrEqual(4);
  });

  test('momentum profile produces low dimension totals', async ({ page }) => {
    await runAssessment(page, profiles.momentum);
    const results = await extractResults(page);

    const frame = parseInt(results.dimFrame.split('/')[0]);
    const kill = parseInt(results.dimKill.split('/')[0]);
    const edge = parseInt(results.dimEdge.split('/')[0]);
    const total = frame + kill + edge;

    // Momentum signature triggers on total <= 4 OR frameRecognition === 0 (see getTasteSignature)
    // All-A responses on T5/T6/T7 produce FR=0, so Momentum should fire and total should be low.
    expect(total).toBeLessThanOrEqual(6);
  });
});
