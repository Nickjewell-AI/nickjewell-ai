import { test, expect } from '@playwright/test';

// Verifies that P2='D' (Operating maturity) maps to the T4/T8/T9 scenario set.
test.describe('Taste Routing — Optimizing Stage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('routes operating-stage users (P2=D) to T4/T8/T9 scenario set', async ({ page }) => {
    const scenarioSet = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'D', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.recordAnswer(s, 'P4', 'A', 0);
      eng.recordAnswer(s, 'P7', 'E', 0);
      eng.getNextQuestion(s);
      return s.scenarioSet;
    });
    expect(scenarioSet).toEqual(['T4', 'T8', 'T9']);
  });

  test('operating scenarios use enterprise framing (Agent Question, Compliance Cliff, Platform Sunset)', async ({ page }) => {
    const labels = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'D', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.recordAnswer(s, 'P4', 'A', 0);
      eng.recordAnswer(s, 'P7', 'E', 0);
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
    expect(labels).toContain('The Agent Question');
    expect(labels).toContain('The Compliance Cliff');
    expect(labels).toContain('The Platform Sunset');
  });
});
