import { test, expect } from '@playwright/test';

// P3='B' (Healthcare) should swap in healthcare-specific option text on F1/A1/AC1 etc.
test.describe('Industry Branching — Healthcare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('healthcare P3 selection swaps F1 options to healthcare-specific text', async ({ page }) => {
    const { generic, healthcare } = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const f1 = eng.getModuleQuestions('foundation', null).find(q => q.id === 'F1');
      return {
        generic: eng.getQuestionOptions(f1, null).map(o => o.text).join(' '),
        healthcare: eng.getQuestionOptions(f1, 'B').map(o => o.text).join(' '),
      };
    });
    expect(healthcare).not.toBe(generic);
    expect(healthcare.toLowerCase()).toMatch(/emr|clinical|patient|hipaa/);
  });

  test('healthcare industry swaps accountability options (AC1)', async ({ page }) => {
    const text = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const ac1 = eng.getModuleQuestions('accountability', null).find(q => q.id === 'AC1');
      return eng.getQuestionOptions(ac1, 'B').map(o => o.text).join(' ').toLowerCase();
    });
    expect(text).toMatch(/clinical|informatics|physician|practice/);
  });
});
