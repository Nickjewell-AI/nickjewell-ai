import { test, expect } from '@playwright/test';
import { selectOption } from '../helpers/assessment-runner.js';

// ?industry=<slug> URL param should pre-select P3 and skip that card in the flow.
test.describe('Industry Entry Points', () => {
  test('?industry=healthcare pre-selects P3 (B) and skips the Industry Context card', async ({ page }) => {
    await page.goto('/assessment/?industry=healthcare');
    await page.waitForLoadState('networkidle');
    await page.click('#start-btn');
    await page.waitForSelector('.question-card.visible', { timeout: 10000 });

    await selectOption(page, 'A'); // P1
    await selectOption(page, 'C'); // P2
    // Wait for the 3rd question card to render (P4 if preset skipped P3)
    await page.waitForFunction(() => document.querySelectorAll('.question-label').length >= 3, { timeout: 5000 });

    // Next card should be P4 (Biggest Concern) — P3 was auto-answered
    const labels = await page.locator('.question-label').allTextContents();
    // P3 label is exactly "Industry" — its absence confirms the preset auto-answered it
    expect(labels).not.toContain('Industry');
    expect(labels).toContain('Biggest Concern');
  });

  test('?industry=invalidvalue falls back to normal flow (P3 still shown)', async ({ page }) => {
    await page.goto('/assessment/?industry=notarealindustry');
    await page.waitForLoadState('networkidle');
    await page.click('#start-btn');
    await page.waitForSelector('.question-card.visible', { timeout: 10000 });

    await selectOption(page, 'A'); // P1
    await selectOption(page, 'C'); // P2
    // Wait for the 3rd question card to render (either P3 normally, or P4 if preset skipped P3)
    await page.waitForFunction(() => document.querySelectorAll('.question-label').length >= 3, { timeout: 5000 });

    const labels = await page.locator('.question-label').allTextContents();
    expect(labels).toContain('Industry');
  });

  test('?industry=finserv maps to key A (Financial Services)', async ({ page }) => {
    await page.goto('/assessment/?industry=finserv');
    await page.waitForLoadState('networkidle');
    await page.click('#start-btn');
    await page.waitForSelector('.question-card.visible', { timeout: 10000 });

    await selectOption(page, 'A'); // P1
    await selectOption(page, 'C'); // P2
    // Wait for the 3rd question card to render (either P3 normally, or P4 if preset skipped P3)
    await page.waitForFunction(() => document.querySelectorAll('.question-label').length >= 3, { timeout: 5000 });

    const labels = await page.locator('.question-label').allTextContents();
    expect(labels).not.toContain('Industry');
    expect(labels).toContain('Biggest Concern');
  });
});
