import { SEL } from './selectors.js';
import { waitForQuestionCard, waitForResults, waitForProgressUpdate } from './wait-utils.js';

/**
 * Run a complete assessment from start to results using a predefined answer profile.
 * @param {Page} page - Playwright page object
 * @param {Object} profile - Answer profile from fixtures
 * @param {Object} opts - Options: { fillBrief: bool, briefData: {}, skipPostTaste: bool }
 */
export async function runAssessment(page, profile, opts = {}) {
  // Navigate to assessment
  await page.goto('/assessment/');
  await page.waitForLoadState('networkidle');

  // Click start
  await page.click(SEL.startBtn);
  await waitForQuestionCard(page);

  // Answer Pulse questions (P1, P2, P3, P4, P7)
  const pulseAnswers = profile.pulse;
  for (const [questionId, answerKey] of Object.entries(pulseAnswers)) {
    await selectOption(page, answerKey);
    await waitForQuestionCard(page);
  }

  // Answer Diagnostic questions — compound cards
  // The engine determines which modules and how many questions per module
  // We answer based on profile.diagnostic which maps question IDs to answer keys
  const diagnosticAnswers = profile.diagnostic;
  const diagnosticKeys = Object.keys(diagnosticAnswers);

  for (let i = 0; i < diagnosticKeys.length; i++) {
    const answerKey = diagnosticAnswers[diagnosticKeys[i]];
    // Wait for the next answerable question to appear
    await page.waitForSelector('.option-button:not([disabled])', { timeout: 10000 });
    await selectOption(page, answerKey);
    await waitForQuestionCard(page);
  }

  // Answer Taste scenarios
  const tasteAnswers = profile.taste;
  for (const [scenarioId, data] of Object.entries(tasteAnswers)) {
    // Select scenario answer
    await selectOption(page, data.answer);
    await page.waitForTimeout(400);

    // Select reasoning follow-up (appears inline on same card)
    if (data.reasoning) {
      await page.waitForSelector('.taste-reasoning-btn', { timeout: 5000 });
      const reasoningBtns = await page.$$('.taste-reasoning-btn');
      for (const btn of reasoningBtns) {
        const text = await btn.getAttribute('data-key');
        if (text === data.reasoning) {
          await btn.click();
          break;
        }
      }
      await page.waitForTimeout(400);
    }
  }

  // Post-Taste free text prompt
  if (opts.skipPostTaste !== false) {
    // Look for skip button or submit empty
    const skipBtn = await page.$(SEL.postTasteSkip);
    if (skipBtn) {
      await skipBtn.click();
    }
    await page.waitForTimeout(500);
  }

  // Wait for results
  await waitForResults(page);

  // Optionally fill brief contact form
  if (opts.fillBrief && opts.briefData) {
    await page.fill(SEL.briefName, opts.briefData.name || 'Test User');
    await page.fill(SEL.briefEmail, opts.briefData.email || 'test@playwright.dev');
    await page.fill(SEL.briefCompany, opts.briefData.company || 'Test Corp');
    await page.fill(SEL.briefRole, opts.briefData.role || 'Test Role');
    if (opts.briefData.focus) {
      await page.fill(SEL.briefFocus, opts.briefData.focus);
    }
    await page.click(SEL.briefSubmit);
  }
}

/**
 * Select an option by its key letter (A, B, C, D, E)
 */
async function selectOption(page, key) {
  // Find the last visible, non-disabled options list
  const optionBtns = await page.$$('.option-button:not([disabled])');
  for (const btn of optionBtns) {
    const keyEl = await btn.$('.option-key');
    if (keyEl) {
      const keyText = await keyEl.textContent();
      if (keyText.trim() === key) {
        await btn.click();
        return;
      }
    }
  }
  throw new Error(`Could not find option with key "${key}" among enabled buttons`);
}

/**
 * Extract results from the results page DOM
 */
export async function extractResults(page) {
  await waitForResults(page);

  const verdict = await page.$eval('#verdict-label', el => el.textContent.trim());
  const compositeScore = await page.$eval('#verdict-score', el => el.textContent.trim());
  const tasteName = await page.$eval('#taste-name', el => el.textContent.trim());
  const dimFrame = await page.$eval('#dim-frame-val', el => el.textContent.trim());
  const dimKill = await page.$eval('#dim-kill-val', el => el.textContent.trim());
  const dimEdge = await page.$eval('#dim-edge-val', el => el.textContent.trim());
  const constraintTitle = await page.$eval('#constraint-title', el => el.textContent.trim());

  // Extract layer scores from the bars
  const layerScores = await page.$$eval('#layer-bars .layer-bar-row', rows =>
    rows.map(row => ({
      name: row.querySelector('.layer-bar-name')?.textContent?.trim(),
      score: row.querySelector('.layer-bar-score')?.textContent?.trim(),
    }))
  );

  // Check for action plan horizons
  const hasRightNow = await page.$('.horizon-group') !== null;

  return {
    verdict,
    compositeScore,
    tasteName,
    dimFrame,
    dimKill,
    dimEdge,
    constraintTitle,
    layerScores,
    hasActionPlan: hasRightNow,
  };
}

export { selectOption };
