import { test, expect } from '@playwright/test';
import { runAssessment, installCostGuardRoutes } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

const profile = profiles.sophistication;

test.describe('Timing Capture', () => {
  test('captures per-question response timings in session state', async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');

    // Drive engine forward synthetically and verify timings populate
    const timings = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      s._lastQuestionShown = Date.now();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'C', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      return s.responseTimings;
    });
    expect(timings).toHaveProperty('P1');
    expect(timings).toHaveProperty('P2');
    expect(timings).toHaveProperty('P3');
    expect(typeof timings.P1).toBe('number');
    expect(timings.P1).toBeGreaterThanOrEqual(0);
  });

  test('timing data is included in submit-assessment POST payload', async ({ page }) => {
    // Default cost guard for /api-proxy + baseline /api/submit-assessment
    await installCostGuardRoutes(page);
    let captured = null;
    // Override the default /api/submit-assessment mock to capture the POST body
    await page.route('**/api/submit-assessment', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        try { captured = req.postDataJSON(); } catch {}
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: 99999 }),
        });
      } else {
        await route.continue();
      }
    });

    await runAssessment(page, profile, { mockApi: false });

    expect(captured).toBeTruthy();
    // all_responses is serialized to JSON string on submit; parse if needed
    const allResponses = typeof captured.all_responses === 'string'
      ? JSON.parse(captured.all_responses)
      : captured.all_responses;
    expect(allResponses).toHaveProperty('timings');
    expect(typeof allResponses.timings).toBe('object');
    expect(Object.keys(allResponses.timings).length).toBeGreaterThan(0);
  });

  test('timing capture does not add visible UI elements', async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
    await page.click('#start-btn');
    await page.waitForSelector('.question-card.visible', { timeout: 10000 });

    // No timing-related UI should be visible to the user
    const timerEls = await page.locator('[data-timer], .timer, .question-timer').count();
    expect(timerEls).toBe(0);
  });
});
