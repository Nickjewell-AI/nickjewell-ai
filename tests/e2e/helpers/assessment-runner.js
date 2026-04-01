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

  // Answer all questions until results appear
  // Handles Pulse, Diagnostic, adaptive follow-ups, and Taste dynamically
  let questionCount = 0;
  const maxQuestions = 30; // safety valve

  while (questionCount < maxQuestions) {
    // Check if results are showing
    const resultsVisible = await page.$('#assessment-results:not(.hidden)');
    if (resultsVisible) break;

    // Check for post-taste prompt (skip or submit)
    const skipBtn = await page.$('.cu2-skip-link');
    if (skipBtn) {
      const isVisible = await skipBtn.boundingBox();
      if (isVisible) {
        await skipBtn.click();
        await page.waitForTimeout(500);
        continue;
      }
    }

    // Check if there are enabled option buttons
    const enabledBtns = await page.$$('.option-button:not([disabled])');
    if (enabledBtns.length === 0) {
      await page.waitForTimeout(500);
      continue;
    }

    // Check tier label to determine which answer set to use
    const tierText = await page.$eval('#tier-label', el => el.textContent).catch(() => '');

    // Determine which answer key to use
    let answerKey = 'A'; // default

    if (tierText.includes('Pulse') || tierText.includes('The Pulse')) {
      // Get the question label to identify which pulse question
      const labels = await page.$$('.question-label');
      const lastLabel = labels.length > 0 ? await labels[labels.length - 1].textContent() : '';

      if (lastLabel.includes('Role')) answerKey = profile.pulse.P1 || 'A';
      else if (lastLabel.includes('Maturity')) answerKey = profile.pulse.P2 || 'A';
      else if (lastLabel.includes('Industry')) answerKey = profile.pulse.P3 || 'A';
      else if (lastLabel.includes('Concern')) answerKey = profile.pulse.P4 || 'A';
      else if (lastLabel.includes('Size')) answerKey = profile.pulse.P7 || 'A';
      else answerKey = 'A';
    } else if (tierText.includes('Taste')) {
      // Find which taste scenario we're on
      const tasteKeys = Object.keys(profile.taste);
      const tasteIndex = Math.min(
        questionCount - Object.keys(profile.pulse).length - Object.keys(profile.diagnostic).length,
        tasteKeys.length - 1
      );
      if (tasteIndex >= 0 && tasteKeys[tasteIndex]) {
        const tasteData = profile.taste[tasteKeys[tasteIndex]];
        answerKey = tasteData.answer || 'A';
      }

      // Click taste answer, then handle reasoning follow-up
      await selectOption(page, answerKey);
      await page.waitForTimeout(500);

      // Look for reasoning buttons
      const reasoningBtns = await page.$$('.reasoning-option:not([disabled])');
      if (reasoningBtns.length > 0 && reasoningBtns[0]) {
        await reasoningBtns[0].click();
        await page.waitForTimeout(400);
      }
      questionCount++;
      continue;
    } else {
      // Diagnostic — use profile answers or default to A
      const diagKeys = Object.keys(profile.diagnostic);
      const diagIndex = questionCount - Object.keys(profile.pulse).length;
      if (diagIndex >= 0 && diagIndex < diagKeys.length) {
        answerKey = profile.diagnostic[diagKeys[diagIndex]] || 'A';
      }
    }

    await selectOption(page, answerKey);
    await page.waitForTimeout(400);
    questionCount++;
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
 * Targets the LAST options-list with enabled buttons (the current question).
 */
async function selectOption(page, key) {
  // Wait for enabled options to exist
  await page.waitForSelector('.option-button:not([disabled])', { timeout: 10000 });
  // Small delay for animation
  await page.waitForTimeout(300);

  // Get ALL options lists on the page
  const optionsLists = await page.$$('.options-list');
  // The last options-list with enabled buttons is the current question
  let targetButtons = [];
  for (const list of optionsLists) {
    const enabledBtns = await list.$$('.option-button:not([disabled])');
    if (enabledBtns.length > 0) {
      targetButtons = enabledBtns;
    }
  }

  for (const btn of targetButtons) {
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
