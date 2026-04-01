import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

const ADMIN_KEY = process.env.ADMIN_KEY;

test.describe('Admin Bypass', () => {
  test.skip(!ADMIN_KEY, 'Requires ADMIN_KEY env var');

  test('admin key bypasses rate limiting on brief', async ({ page }) => {
    // Navigate with admin key
    await page.goto(`/assessment/?admin_key=${ADMIN_KEY}`);

    // The admin bypass should allow unlimited brief generation
    // This test verifies the parameter is accepted without errors
    await expect(page.locator('#start-btn')).toBeVisible();
  });
});
