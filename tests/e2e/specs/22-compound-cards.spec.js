import { test, expect } from '@playwright/test';
import { SEL } from '../helpers/selectors.js';
import { waitForQuestionCard } from '../helpers/wait-utils.js';

test.describe('Compound Module Cards', () => {
  test('diagnostic questions reveal progressively within module card', async ({ page }) => {
    await page.goto('/assessment/');
    await page.click(SEL.startBtn);

    // Answer all 5 Pulse questions to get to Diagnostic
    for (let i = 0; i < 5; i++) {
      await waitForQuestionCard(page);
      const btns = await page.$$('.option-button:not([disabled])');
      if (btns.length > 0) {
        await btns[0].click();
        await page.waitForTimeout(500); // wait for handleAnswer's 250ms setTimeout + render
      }
    }

    await waitForQuestionCard(page);

    // Should now be on first diagnostic module card
    const moduleCards = await page.$$(SEL.moduleCard);
    expect(moduleCards.length).toBeGreaterThanOrEqual(1);

    // First module card should have 1 question initially
    const firstCard = moduleCards[0];
    let questionsInCard = await firstCard.$$(SEL.moduleQuestion);
    expect(questionsInCard.length).toBe(1);

    // Answer the first question
    const btns = await page.$$('.option-button:not([disabled])');
    if (btns.length > 0) {
      await btns[0].click();
      await page.waitForTimeout(500);
    }
    await waitForQuestionCard(page);

    // Same card should now have 2 questions (first answered + second revealed)
    questionsInCard = await firstCard.$$(SEL.moduleQuestion);
    expect(questionsInCard.length).toBe(2);

    // First question should be disabled
    const firstQOptions = await questionsInCard[0].$$('.option-button[disabled]');
    expect(firstQOptions.length).toBeGreaterThan(0);
  });
});
