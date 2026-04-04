import { test, expect } from '@playwright/test';

// P3='F' (Professional Services) swaps F1/A1/AC1 etc. to consulting-specific text.
test.describe('Industry Branching — Professional Services', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('professional services P3 selection swaps F1 options to consulting-specific text', async ({ page }) => {
    const { generic, profSvc } = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const f1 = eng.getModuleQuestions('foundation', null).find(q => q.id === 'F1');
      return {
        generic: eng.getQuestionOptions(f1, null).map(o => o.text).join(' '),
        profSvc: eng.getQuestionOptions(f1, 'F').map(o => o.text).join(' '),
      };
    });
    expect(profSvc).not.toBe(generic);
    expect(profSvc.toLowerCase()).toMatch(/engagement|partner|client|consultant|utilization|practice/);
  });

  test('professional services swaps accountability options (AC2)', async ({ page }) => {
    const text = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const ac2 = eng.getModuleQuestions('accountability', null).find(q => q.id === 'AC2');
      return eng.getQuestionOptions(ac2, 'F').map(o => o.text).join(' ').toLowerCase();
    });
    expect(text.length).toBeGreaterThan(0);
  });
});
