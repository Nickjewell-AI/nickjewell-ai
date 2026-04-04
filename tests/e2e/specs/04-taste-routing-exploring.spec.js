import { test, expect } from '@playwright/test';

// Verifies that P2='A' (Exploring maturity) maps to the T5/T6/T7 scenario set.
test.describe('Taste Routing — Exploring Stage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('routes exploring-stage users (P2=A) to T5/T6/T7 scenario set', async ({ page }) => {
    const scenarioSet = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'A', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.recordAnswer(s, 'P4', 'A', 0);
      eng.recordAnswer(s, 'P7', 'A', 0);
      eng.getNextQuestion(s); // triggers tier 2 transition + scenarioSet population
      return s.scenarioSet;
    });
    expect(scenarioSet).toEqual(['T5', 'T6', 'T7']);
  });

  test('exploring scenarios surface mid-market framing (Free Trial Trap, Intern Dashboard, Vendor Demo)', async ({ page }) => {
    const labels = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'A', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.recordAnswer(s, 'P4', 'A', 0);
      eng.recordAnswer(s, 'P7', 'A', 0);
      let q = eng.getNextQuestion(s);
      const tasteLabels = [];
      let iters = 0;
      while (q && iters < 40) {
        iters++;
        if (q.tier === 3) { tasteLabels.push(q.label); eng.recordAnswer(s, q.id, 'A', 1); }
        else if (q.tier === 2) { eng.recordAnswer(s, q.id, 'A', 4); }
        else break;
        q = eng.getNextQuestion(s);
      }
      return tasteLabels;
    });
    expect(labels).toContain('The Free Trial Trap');
    expect(labels).toContain("The Intern's Dashboard");
    expect(labels).toContain('The Vendor Demo');
  });
});
