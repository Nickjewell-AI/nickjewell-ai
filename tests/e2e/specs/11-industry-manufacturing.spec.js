import { test, expect } from '@playwright/test';

// P3='D' (Manufacturing/Industrial) swaps F1/A1/AC1 etc. to manufacturing-specific text.
test.describe('Industry Branching — Manufacturing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('manufacturing P3 selection swaps F1 options to manufacturing-specific text', async ({ page }) => {
    const { generic, manuf } = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const f1 = eng.getModuleQuestions('foundation', null).find(q => q.id === 'F1');
      return {
        generic: eng.getQuestionOptions(f1, null).map(o => o.text).join(' '),
        manuf: eng.getQuestionOptions(f1, 'D').map(o => o.text).join(' '),
      };
    });
    expect(manuf).not.toBe(generic);
    expect(manuf.toLowerCase()).toMatch(/plant|production|supply chain|quality|maintenance|operator|erp/);
  });

  test('manufacturing swaps architecture options (A2)', async ({ page }) => {
    const text = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const a2 = eng.getModuleQuestions('architecture', null).find(q => q.id === 'A2');
      return eng.getQuestionOptions(a2, 'D').map(o => o.text).join(' ').toLowerCase();
    });
    expect(text.length).toBeGreaterThan(0);
  });
});
