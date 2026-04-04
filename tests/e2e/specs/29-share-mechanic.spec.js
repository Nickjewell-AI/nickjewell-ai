import { test, expect } from '@playwright/test';
import { runAssessment } from '../helpers/assessment-runner.js';
import profiles from '../fixtures/profiles.json';

const profile = profiles.sophistication;

test.describe('Share Mechanic — Ref Tracking & Share Card', () => {
  test('?ref= URL param is sent as ref_source in submit-assessment POST body', async ({ page }) => {
    let captured = null;
    await page.route('**/api/submit-assessment', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        try { captured = req.postDataJSON(); } catch {}
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: 42 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/assessment/?ref=test-ref-123');
    await page.waitForLoadState('networkidle');
    await runAssessment(page, profile);

    expect(captured).toBeTruthy();
    expect(captured.ref_source).toBe('test-ref-123');
  });

  test('ref_source omitted when no ?ref= param present', async ({ page }) => {
    let captured = null;
    await page.route('**/api/submit-assessment', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        try { captured = req.postDataJSON(); } catch {}
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: 43 }),
        });
      } else {
        await route.continue();
      }
    });

    await runAssessment(page, profile);

    expect(captured).toBeTruthy();
    expect(captured.ref_source).toBeNull();
  });

  test('share card renders after capture gate with correct share URL', async ({ page }) => {
    // Mock submit-assessment so savedRowId is populated
    await page.route('**/api/submit-assessment', async (route) => {
      const req = route.request();
      if (req.method() === 'POST' || req.method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: 12345 }),
        });
      } else {
        await route.continue();
      }
    });
    // Mock api-proxy to avoid real brief generation
    await page.route('**/api-proxy', async (route) => {
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ data: { status: 'accepted' } }),
      });
    });

    await runAssessment(page, profile);

    const shareCard = page.locator('#share-card');
    await expect(shareCard).toBeVisible({ timeout: 5000 });
    await expect(shareCard.locator('.share-card-heading')).toContainText('Think your team would score higher');
  });

  test('Email button href contains mailto: with correct subject and ref URL', async ({ page }) => {
    await page.route('**/api/submit-assessment', async (route) => {
      if (['POST', 'PATCH'].includes(route.request().method())) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 77 }) });
      } else await route.continue();
    });
    await page.route('**/api-proxy', async (route) => {
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ data: { status: 'accepted' } }) });
    });

    await runAssessment(page, profile);
    await expect(page.locator('#share-card')).toBeVisible({ timeout: 5000 });

    const emailHref = await page.locator('.share-card-btn-email').getAttribute('href');
    expect(emailHref).toMatch(/^mailto:/);
    expect(emailHref).toContain('subject=');
    expect(emailHref).toContain('Worth%205%20minutes');
    expect(emailHref).toContain('ref%3D77');
  });

  test('Text button href contains sms: with ref URL', async ({ page }) => {
    await page.route('**/api/submit-assessment', async (route) => {
      if (['POST', 'PATCH'].includes(route.request().method())) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 88 }) });
      } else await route.continue();
    });
    await page.route('**/api-proxy', async (route) => {
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ data: { status: 'accepted' } }) });
    });

    await runAssessment(page, profile);
    await expect(page.locator('#share-card')).toBeVisible({ timeout: 5000 });

    const smsHref = await page.locator('.share-card-btn-sms').getAttribute('href');
    expect(smsHref).toMatch(/^sms:/);
    expect(smsHref).toContain('body=');
    expect(smsHref).toContain('ref%3D88');
  });

  test('Copy Link button changes text to "Copied!" on click', async ({ page }) => {
    await page.route('**/api/submit-assessment', async (route) => {
      if (['POST', 'PATCH'].includes(route.request().method())) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 99 }) });
      } else await route.continue();
    });
    await page.route('**/api-proxy', async (route) => {
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ data: { status: 'accepted' } }) });
    });

    // Grant clipboard write permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await runAssessment(page, profile);
    await expect(page.locator('#share-card')).toBeVisible({ timeout: 5000 });

    const copyBtn = page.locator('.share-card-btn-copy');
    await expect(copyBtn).toHaveText('Copy Link');
    await copyBtn.click();
    await expect(copyBtn).toHaveText('Copied!', { timeout: 2000 });
  });
});
