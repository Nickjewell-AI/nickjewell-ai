import { test, expect } from '@playwright/test';

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
    await page.locator('.option-button .option-key', { hasText: 'A' }).first().click();
    await page.waitForTimeout(600);
    await expect(page.locator('.question-back-btn').last()).toBeVisible();
  });

  test('clicking Back returns user to the previous question', async ({ page }) => {
    // Answer P1
    await page.locator('.option-button .option-key', { hasText: 'A' }).first().click();
    await page.waitForTimeout(600);
    // Confirm we're on a new question
    let labels = await page.locator('.question-label').allTextContents();
    const beforeBackCount = labels.length;
    expect(beforeBackCount).toBeGreaterThan(0);

    // Click Back
    await page.locator('.question-back-btn').last().click();
    await page.waitForTimeout(600);

    // Should see Role Context (P1) again
    labels = await page.locator('.question-label').allTextContents();
    expect(labels).toContain('Role Context');
  });

  test('progress bar decrements after Back click', async ({ page }) => {
    // Advance two questions
    await page.locator('.option-button .option-key', { hasText: 'A' }).first().click();
    await page.waitForTimeout(600);
    await page.locator('.option-button:not([disabled]) .option-key', { hasText: 'A' }).first().click();
    await page.waitForTimeout(600);

    const progressBefore = await page.locator('#progress-fill').evaluate(el => parseInt(el.style.width, 10));

    await page.locator('.question-back-btn').last().click();
    await page.waitForTimeout(600);

    const progressAfter = await page.locator('#progress-fill').evaluate(el => parseInt(el.style.width, 10));
    expect(progressAfter).toBeLessThan(progressBefore);
  });

  test('Back works across layer boundaries (from first layer question to last Pulse question)', async ({ page }) => {
    // Answer all 5 Pulse questions
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-button:not([disabled]) .option-key', { hasText: 'A' }).first().click();
      await page.waitForTimeout(500);
    }
    // Now on first diagnostic question (tier 2)
    let labels = await page.locator('.question-label').allTextContents();
    const atTier2 = labels.join(' ');
    expect(atTier2).not.toContain('Role Context');

    // Click Back — should return to last Pulse question
    await page.locator('.question-back-btn').last().click();
    await page.waitForTimeout(600);

    labels = await page.locator('.question-label').allTextContents();
    // Last Pulse question is P7 (Organization Size)
    expect(labels.join(' ')).toContain('Organization Size');
  });

  test('session._stateHistory stack grows with each answer and shrinks on back', async ({ page }) => {
    const depth0 = await page.evaluate(() => {
      // Access the UI module's session is not trivial; use the engine to verify recordAnswer behavior
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
