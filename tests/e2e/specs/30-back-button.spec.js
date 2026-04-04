import { test, expect } from '@playwright/test';
import { selectOption } from '../helpers/assessment-runner.js';

// Back button navigation — introduced in Session 13.
// Users can reverse any answered question, including across layer boundaries.
test.describe('Back Button Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
    await page.click('#start-btn');
    await page.waitForSelector('.question-card.visible', { timeout: 10000 });
  });

  test('no Back button on first question (P1)', async ({ page }) => {
    await expect(page.locator('.question-back-btn')).toHaveCount(0);
  });

  test('Back button appears on second question (P2)', async ({ page }) => {
    await selectOption(page, 'A');
    await expect(page.locator('.question-back-btn').last()).toBeVisible();
  });

  test('clicking Back returns user to the previous question', async ({ page }) => {
    await selectOption(page, 'A');
    // Click Back
    await page.locator('.question-back-btn').last().click();
    await page.waitForTimeout(500);
    const labels = await page.locator('.question-label').allTextContents();
    expect(labels).toContain('Role Context');
  });

  test('progress bar decrements after Back click', async ({ page }) => {
    await selectOption(page, 'A'); // P1
    await selectOption(page, 'A'); // P2
    // Wait for the 3rd question card to render — guarantees both answers settled
    await page.waitForFunction(() => document.querySelectorAll('.question-label').length >= 3, { timeout: 5000 });
    const progressBefore = await page.locator('#progress-fill').evaluate(el => parseInt(el.style.width, 10));
    expect(progressBefore).toBeGreaterThan(0);

    await page.locator('.question-back-btn').last().click();
    await page.waitForTimeout(500);

    const progressAfter = await page.locator('#progress-fill').evaluate(el => parseInt(el.style.width, 10));
    expect(progressAfter).toBeLessThan(progressBefore);
  });

  test('Back works across layer boundaries (from first layer question to last Pulse question)', async ({ page }) => {
    // Answer all 5 Pulse questions with key 'A'
    for (let i = 0; i < 5; i++) {
      await selectOption(page, 'A');
    }
    // Wait until the 6th question card (first tier-2) has rendered
    await page.waitForFunction(() => document.querySelectorAll('.question-label').length >= 6, { timeout: 8000 });
    const labelsText = (await page.locator('.question-label').allTextContents()).join(' ');
    // Should include at least one tier-2 diagnostic label
    expect(labelsText).toMatch(/Data Accessibility|Governance Reality|Process Mapping|Named Owner|Workflow Redesign|Safety to Dissent|Honest Failure|Data Quality Pain|The Redesign Question|The Kevin Test|Kill History|Pre-Defined Failure Criteria/);

    // Click Back — should pop to P7 (last Pulse)
    await page.locator('.question-back-btn').last().click();
    await page.waitForTimeout(500);

    const labelsAfter = await page.locator('.question-label').allTextContents();
    expect(labelsAfter.join(' ')).toContain('Organization Size');
  });

  test('session._stateHistory stack grows with each answer and shrinks on back', async ({ page }) => {
    const depth0 = await page.evaluate(() => {
      const s = window.AssessmentEngine.createSession();
      return s._stateHistory.length;
    });
    expect(depth0).toBe(0);

    const depthAfter3 = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'A', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      return s._stateHistory.length;
    });
    expect(depthAfter3).toBe(3);

    const depthAfterBack = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'A', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.goBack(s);
      return s._stateHistory.length;
    });
    expect(depthAfterBack).toBe(2);
  });

  test('goBack restores prior answers (removes the most recent)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'B', 0);
      const beforeBack = { ...s.pulseAnswers };
      eng.goBack(s);
      const afterBack = { ...s.pulseAnswers };
      return { beforeBack, afterBack };
    });
    expect(result.beforeBack).toEqual({ P1: 'A', P2: 'B' });
    expect(result.afterBack).toEqual({ P1: 'A' });
  });

  test('canGoBack returns false at start, true after an answer', async ({ page }) => {
    const { beforeAnswer, afterAnswer } = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      const beforeAnswer = eng.canGoBack(s);
      eng.recordAnswer(s, 'P1', 'A', 0);
      const afterAnswer = eng.canGoBack(s);
      return { beforeAnswer, afterAnswer };
    });
    expect(beforeAnswer).toBe(false);
    expect(afterAnswer).toBe(true);
  });
});
