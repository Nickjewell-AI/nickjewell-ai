import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

const ADMIN_KEY = process.env.ADMIN_KEY;

test.describe('Scoring — D1 API Validation', () => {
  test.skip(!ADMIN_KEY, 'Requires ADMIN_KEY env var');

  test('assessment results are correctly stored in D1', async ({ page, request }) => {
    const testEmail = `playwright-${Date.now()}@test.dev`;

    await runAssessment(page, profiles.sophistication, {
      fillBrief: true,
      briefData: {
        name: 'Playwright Test',
        email: testEmail,
        company: 'Playwright Corp',
        role: 'Test Automator',
      },
    });

    // Wait for D1 write to propagate
    await page.waitForTimeout(3000);

    // Query API for latest assessment
    const baseURL = process.env.TEST_URL || 'https://www.nickjewell.ai';
    const response = await request.get(`${baseURL}/api/v1/assessments`, {
      headers: { 'Authorization': `Bearer ${ADMIN_KEY}` },
      params: { limit: 1, sort: 'desc' },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();

    // Verify the latest record matches what we submitted
    const latest = body.data[0];
    expect(latest.email).toBe(testEmail);
    expect(latest.name).toBe('Playwright Test');
    expect(latest.composite_score).toBeGreaterThan(0);
    expect(latest.taste_signature).toBe('Sophistication');
    expect(latest.verdict).toBe('Green');

    // Verify all_responses JSON contains expected structure
    const responses = JSON.parse(latest.all_responses);
    expect(responses).toBeTruthy();
  });
});
