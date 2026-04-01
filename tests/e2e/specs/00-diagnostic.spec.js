import { test, expect } from '@playwright/test';

test('diagnostic — screenshot each assessment step', async ({ page }) => {
  await page.goto('/assessment/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/e2e/reports/00-intro.png' });

  // Click start
  await page.click('#start-btn');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/e2e/reports/01-first-question.png' });

  // Log the DOM state of options
  const optionsHtml = await page.evaluate(() => {
    const lists = document.querySelectorAll('.options-list');
    return Array.from(lists).map((list, i) => ({
      index: i,
      buttonsCount: list.querySelectorAll('.option-button').length,
      enabledCount: list.querySelectorAll('.option-button:not([disabled])').length,
      disabledCount: list.querySelectorAll('.option-button[disabled]').length,
      selectedCount: list.querySelectorAll('.option-button.selected').length,
      html: list.innerHTML.substring(0, 500),
    }));
  });
  console.log('OPTIONS STATE:', JSON.stringify(optionsHtml, null, 2));

  // Try clicking first option manually
  const firstBtn = await page.$('.option-button');
  if (firstBtn) {
    const btnText = await firstBtn.textContent();
    console.log('FIRST BUTTON TEXT:', btnText);
    await firstBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/reports/02-after-first-click.png' });

    // Log DOM state after click
    const afterState = await page.evaluate(() => {
      const lists = document.querySelectorAll('.options-list');
      return Array.from(lists).map((list, i) => ({
        index: i,
        enabledCount: list.querySelectorAll('.option-button:not([disabled])').length,
        disabledCount: list.querySelectorAll('.option-button[disabled]').length,
        selectedCount: list.querySelectorAll('.option-button.selected').length,
      }));
    });
    console.log('AFTER CLICK STATE:', JSON.stringify(afterState, null, 2));
  }

  // Click through 4 more questions
  for (let i = 0; i < 4; i++) {
    const btns = await page.$$('.option-button:not([disabled]):not(.selected)');
    console.log(`STEP ${i + 3}: Found ${btns.length} clickable buttons`);
    if (btns.length > 0) {
      await btns[btns.length - 1].click(); // click last enabled non-selected
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `tests/e2e/reports/0${i + 3}-step.png` });
    } else {
      console.log(`STEP ${i + 3}: NO CLICKABLE BUTTONS FOUND`);
      // Try alternative selector
      const allBtns = await page.$$('.option-button');
      console.log(`STEP ${i + 3}: Total buttons on page: ${allBtns.length}`);
      for (const btn of allBtns) {
        const disabled = await btn.getAttribute('disabled');
        const classes = await btn.getAttribute('class');
        const text = await btn.textContent();
        console.log(`  Button: "${text.trim().substring(0, 40)}" disabled=${disabled} class="${classes}"`);
      }
      break;
    }
  }
});
