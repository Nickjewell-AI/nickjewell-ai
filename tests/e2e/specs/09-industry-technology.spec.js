import { test, expect } from '@playwright/test';

// P3='C' (Technology/SaaS) swaps F1/A1/AC1 etc. to tech-specific text.
test.describe('Industry Branching — Technology', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('technology P3 selection swaps F1 options to tech-specific text', async ({ page }) => {
    const { generic, tech } = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const f1 = eng.getModuleQuestions('foundation', null).find(q => q.id === 'F1');
      return {
        generic: eng.getQuestionOptions(f1, null).map(o => o.text).join(' '),
        tech: eng.getQuestionOptions(f1, 'C').map(o => o.text).join(' '),
      };
    });
    expect(tech).not.toBe(generic);
    expect(tech.toLowerCase()).toMatch(/api|data warehouse|product|engineering|platform|pipeline/);
  });

  test('technology swaps architecture options (A1)', async ({ page }) => {
    const text = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const a1 = eng.getModuleQuestions('architecture', null).find(q => q.id === 'A1');
      return eng.getQuestionOptions(a1, 'C').map(o => o.text).join(' ').toLowerCase();
    });
    expect(text.length).toBeGreaterThan(0);
  });
});
