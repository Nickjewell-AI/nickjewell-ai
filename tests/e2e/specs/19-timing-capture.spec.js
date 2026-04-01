import { test } from '@playwright/test';

// Build 7: Response timing capture — will be enabled after Build 7 ships
test.describe('Timing Capture', () => {
  test.fixme('captures per-question response timestamps', async ({ page }) => {
    // Will verify hidden timestamp fields are populated for each question
  });

  test.fixme('timing data is included in D1 write', async ({ page }) => {
    // Will verify timing array is present in all_responses JSON
  });

  test.fixme('timing does not affect displayed results', async ({ page }) => {
    // Will verify timing capture is invisible to the user
  });
});
