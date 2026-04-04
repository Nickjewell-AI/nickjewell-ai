import { test, expect } from '@playwright/test';

// COST GUARD: generate-and-email-brief intake handler must short-circuit for
// test emails BEFORE writing 'pending' to D1, and the scheduled-brief cron
// query must exclude test records. This spec covers the intake handler only —
// cron behavior is enforced by the D1 query filter and is tested by effect
// (via real run inspection, not E2E-testable without live D1 introspection).
test.describe('Cost Guard — generate-and-email-brief intake', () => {
  const endpoint = '/api-proxy';
  // isAllowedOrigin() rejects requests without an Origin matching the allowlist.
  // Browsers send this automatically; Playwright's request fixture does not.
  const ORIGIN = 'https://www.nickjewell.ai';

  async function callIntake(request, body) {
    return request.post(endpoint, {
      data: body,
      headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
      failOnStatusCode: false,
    });
  }

  test('test@playwright.dev email returns 200 with status=test-skipped', async ({ request }) => {
    const res = await callIntake(request, {
      type: 'generate-and-email-brief',
      assessmentId: 999991,
      email: 'test@playwright.dev',
      briefContext: 'test',
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.data?.status).toBe('test-skipped');
  });

  test('@playwright.dev domain emails return 200 with status=test-skipped', async ({ request }) => {
    const res = await callIntake(request, {
      type: 'generate-and-email-brief',
      assessmentId: 999992,
      email: 'ci-bot@playwright.dev',
      briefContext: 'test',
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.data?.status).toBe('test-skipped');
  });

  test('test@example.com returns 200 with status=test-skipped', async ({ request }) => {
    const res = await callIntake(request, {
      type: 'generate-and-email-brief',
      assessmentId: 999993,
      email: 'test@example.com',
      briefContext: 'test',
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.data?.status).toBe('test-skipped');
  });

  test('missing required fields returns 400', async ({ request }) => {
    const res = await callIntake(request, {
      type: 'generate-and-email-brief',
      email: 'someone@example.com',
      // missing assessmentId and briefContext
    });
    expect(res.status()).toBe(400);
  });

  test('missing type field returns 400', async ({ request }) => {
    const res = await request.post(endpoint, {
      data: { assessmentId: 1, email: 'test@playwright.dev', briefContext: 'x' },
      headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
  });
});
