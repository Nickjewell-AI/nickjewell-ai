import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

test.describe('Company field optional for P7=A (Under 50)', () => {
  test('P7=A: capture form submits without company name', async ({ page }) => {
    // momentum profile has P7=A (Under 50)
    await runAssessment(page, profiles.momentum, { skipCapture: true });

    // Verify company field is NOT required and has optional placeholder
    const companyField = page.locator('#capture-company');
    await expect(companyField).toBeVisible();
    await expect(companyField).not.toHaveAttribute('required', '');
    await expect(companyField).toHaveAttribute('placeholder', 'Company (or independent)');

    // Submit without company — only name, email, role
    await page.fill('#capture-name', 'Test User');
    await page.fill('#capture-email', 'test@playwright.dev');
    await page.fill('#capture-role', 'Founder');
    await page.click('#capture-form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Results should render — verdict badge visible means capture gate passed
    await expect(page.locator('#verdict-badge')).toBeVisible();
  });

  test('P7=D: company field remains required', async ({ page }) => {
    // sophistication profile has P7=D (2,000-10,000)
    await runAssessment(page, profiles.sophistication, { skipCapture: true });

    // Verify company field IS required with standard placeholder
    const companyField = page.locator('#capture-company');
    await expect(companyField).toBeVisible();
    await expect(companyField).toHaveAttribute('required', '');
    await expect(companyField).toHaveAttribute('placeholder', 'Company');

    // Attempt submit without company — should NOT pass
    await page.fill('#capture-name', 'Test User');
    await page.fill('#capture-email', 'test@playwright.dev');
    await page.fill('#capture-role', 'CTO');
    await page.click('#capture-form button[type="submit"]');
    await page.waitForTimeout(1000);

    // Results should NOT render — capture gate blocks
    await expect(page.locator('#verdict-badge')).not.toBeVisible();
  });
});
