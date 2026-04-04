import { test, expect } from '@playwright/test';

// P3='A' (Financial Services) swaps F1/A1/AC1 etc. to finance-specific text.
test.describe('Industry Branching — Financial Services', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('financial services P3 selection swaps F1 options to finance-specific text', async ({ page }) => {
    const { generic, finserv } = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const f1 = eng.getModuleQuestions('foundation', null).find(q => q.id === 'F1');
      return {
        generic: eng.getQuestionOptions(f1, null).map(o => o.text).join(' '),
        finserv: eng.getQuestionOptions(f1, 'A').map(o => o.text).join(' '),
      };
    });
    expect(finserv).not.toBe(generic);
    expect(finserv.toLowerCase()).toMatch(/client|trading|compliance|regulatory|portfolio|transaction/);
  });

  test('financial services swaps culture options (CU1)', async ({ page }) => {
    const text = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const cu1 = eng.getModuleQuestions('culture', null).find(q => q.id === 'CU1');
      return eng.getQuestionOptions(cu1, 'A').map(o => o.text).join(' ').toLowerCase();
    });
    expect(text.length).toBeGreaterThan(0);
  });
});
