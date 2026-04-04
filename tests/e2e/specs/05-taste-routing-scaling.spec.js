import { test, expect } from '@playwright/test';

// Verifies that P2='B' or 'C' (Piloting/Scaling) maps to the T1/T2/T3 scenario set.
test.describe('Taste Routing — Scaling Stage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment/');
    await page.waitForLoadState('networkidle');
  });

  test('routes piloting-stage users (P2=B) to T1/T2/T3 scenario set', async ({ page }) => {
    const scenarioSet = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'B', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.recordAnswer(s, 'P4', 'A', 0);
      eng.recordAnswer(s, 'P7', 'C', 0);
      eng.getNextQuestion(s);
      return s.scenarioSet;
    });
    expect(scenarioSet).toEqual(['T1', 'T2', 'T3']);
  });

  test('routes scaling-stage users (P2=C) to T1/T2/T3 scenario set', async ({ page }) => {
    const scenarioSet = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'C', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.recordAnswer(s, 'P4', 'A', 0);
      eng.recordAnswer(s, 'P7', 'D', 0);
      eng.getNextQuestion(s);
      return s.scenarioSet;
    });
    expect(scenarioSet).toEqual(['T1', 'T2', 'T3']);
  });

  test('scaling scenarios surface growth-stage framing (Pilot Dilemma, Shiny Object, Kill Decision)', async ({ page }) => {
    const labels = await page.evaluate(() => {
      const eng = window.AssessmentEngine;
      const s = eng.createSession();
      eng.recordAnswer(s, 'P1', 'A', 0);
      eng.recordAnswer(s, 'P2', 'C', 0);
      eng.recordAnswer(s, 'P3', 'C', 0);
      eng.recordAnswer(s, 'P4', 'A', 0);
      eng.recordAnswer(s, 'P7', 'D', 0);
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
    expect(labels).toContain('The Pilot Dilemma');
    expect(labels).toContain('The Shiny Object Test');
    expect(labels).toContain('The Kill Decision');
  });
});
