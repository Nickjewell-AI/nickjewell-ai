import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

// The /api-proxy generate-and-email-brief handler does not enforce per-IP
// rate limiting (it uses assessmentId-based dedup instead — covered in spec
// 31-cost-guard). The client-side guard that keeps a single assessment from
// firing the streaming brief endpoint twice lives in assessment-ui.js as the
// briefStreamActive flag inside triggerBriefGeneration(). These specs verify
// that guard: after capture submit + auto-trigger, type:brief fires at most
// once, and the client POSTs generate-and-email-brief exactly once.

test.describe('Brief — Single-Fire Guards', () => {
  test('first brief request succeeds and content streams into the container', async ({ page }) => {
    await runAssessment(page, profiles.sophistication);

    await page.waitForSelector('.brief-text-container:not(.hidden)', { timeout: 30000 });
    const briefText = await page.$eval('.brief-text-container', el => el.textContent);
    expect(briefText.length).toBeGreaterThan(0);
  });

  test('auto-trigger fires type:brief at most once per assessment', async ({ page }) => {
    // Install our own routes so we can count requests by type. We mirror the
    // cost-guard stub response for type:brief so the client sees a well-formed
    // SSE stream.
    const counts = { brief: 0, generateAndEmail: 0, other: 0 };
    await page.route('**/api-proxy', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      let body = {};
      try { body = route.request().postDataJSON() || {}; } catch {}
      const type = body.type;
      if (type === 'brief') {
        counts.brief++;
        const chunks = [
          'event: content_block_delta\ndata: {"delta":{"type":"text_delta","text":"Mock brief content for single-fire test."}}\n\n',
        ];
        return route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
          body: chunks.join(''),
        });
      }
      if (type === 'generate-and-email-brief') {
        counts.generateAndEmail++;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { status: 'test-skipped' } }),
        });
      }
      counts.other++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { status: 'mocked' } }),
      });
    });
    await page.route('**/api/submit-assessment', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 999 }),
      })
    );

    // mockApi: false — we installed our own routes above.
    await runAssessment(page, profiles.sophistication, { mockApi: false });

    // Wait for auto-trigger (showAllResults schedules triggerBriefGeneration
    // at +1000ms) and the short mock stream to settle.
    await page.waitForTimeout(4000);

    // briefStreamActive guard: type:brief fires at most once per completed
    // assessment. The streaming brief may not fire at all if the endpoint
    // has already been hit — 0 or 1 are both correct. More than 1 indicates
    // the guard is broken.
    expect(counts.brief).toBeLessThanOrEqual(1);

    // generate-and-email-brief is fired once on capture-gate submit.
    expect(counts.generateAndEmail).toBe(1);
  });
});
