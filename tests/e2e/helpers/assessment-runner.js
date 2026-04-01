import { SEL } from './selectors.js';
import { waitForQuestionCard, waitForResults, waitForProgressUpdate } from './wait-utils.js';

/**
 * Build a flat label→answer lookup from a profile.
 * Uses question labels as they appear in the DOM (from assessment-engine.js).
 */
function buildAnswerMap(profile) {
  const map = {};

  // Pulse questions — label text → answer key
  const pulseLabels = {
    P1: 'Role Context',
    P2: 'AI Maturity Stage',
    P3: 'Industry Context',
    P4: 'Biggest Concern',
    P7: 'Organization Size',
  };
  for (const [id, label] of Object.entries(pulseLabels)) {
    if (profile.pulse[id]) {
      map[label] = profile.pulse[id];
    }
  }

  // Diagnostic questions — label text → answer key
  // Labels must match assessment-engine.js EXACTLY
  const diagLabels = {
    F1: 'Data Accessibility',
    F2: 'Governance Reality',
    F3: 'Data Quality Pain',
    A1: 'Process Mapping',
    A2: 'The Redesign Question',
    A3: 'The Kevin Test',
    AC1: 'Named Owner',
    AC2: 'Kill History',
    AC3: 'Pre-Defined Failure Criteria',
    CU1: 'Workflow Redesign',
    CU2: 'Honest Failure',
    CU3: 'Safety to Dissent',
  };
  for (const [id, label] of Object.entries(diagLabels)) {
    if (profile.diagnostic[id]) {
      map[label] = profile.diagnostic[id];
    }
  }

  // Taste scenarios — label text → { answer, reasoning }
  const tasteLabels = {
    T1: 'The Pilot Dilemma',
    T2: 'The Shiny Object Test',
    T3: 'The Kill Decision',
    T4: 'The Agent Question',
    T5: 'The Free Trial Trap',
    T6: "The Intern's Dashboard",
    T7: 'The Vendor Demo',
    T8: 'The Compliance Cliff',
    T9: 'The Platform Sunset',
  };
  for (const [id, label] of Object.entries(tasteLabels)) {
    if (profile.taste[id]) {
      map[label] = profile.taste[id].answer || 'A';
    }
  }

  return map;
}

/**
 * Run a complete assessment from start to results using a predefined answer profile.
 * Uses DOM observation (question labels) instead of question counting.
 * @param {Page} page - Playwright page object
 * @param {Object} profile - Answer profile from fixtures
 * @param {Object} opts - Options: { fillBrief: bool, briefData: {}, skipPostTaste: bool }
 */
export async function runAssessment(page, profile, opts = {}) {
  const answerMap = buildAnswerMap(profile);

  // Navigate to assessment
  await page.goto('/assessment/');
  await page.waitForLoadState('networkidle');

  // Click start
  await page.click(SEL.startBtn);
  await waitForQuestionCard(page);

  let iterations = 0;
  const maxIterations = 60; // safety valve (includes waits)

  while (iterations < maxIterations) {
    iterations++;

    // 1. Check if results are showing
    const resultsVisible = await page.$('#assessment-results:not(.hidden)');
    if (resultsVisible) break;

    // 2. Check for skip links (post-taste prompt, CU2 free-text, adaptive micro-prompt)
    const handled = await handleSkipLink(page);
    if (handled) continue;

    // 3. Check for reasoning buttons (taste follow-ups — no .option-key, just .option-text)
    const reasoningHandled = await handleReasoningButtons(page);
    if (reasoningHandled) continue;

    // 4. Handle diagnostic follow-up questions (Y/N options, not in profile)
    const followUpHandled = await handleFollowUpButtons(page);
    if (followUpHandled) continue;

    // 5. Check for regular option buttons with .option-key
    const hasOptions = await page.evaluate(() => {
      const lists = document.querySelectorAll('.options-list');
      for (const list of lists) {
        const enabled = list.querySelectorAll('.option-button:not([disabled])');
        for (const btn of enabled) {
          if (btn.querySelector('.option-key')) return true;
        }
      }
      return false;
    });

    if (!hasOptions) {
      // No actionable elements yet — wait and retry
      await page.waitForTimeout(500);
      continue;
    }

    // 5. Read the current question label from the DOM
    const currentLabel = await page.evaluate(() => {
      // Get all question labels, find the last one that has enabled sibling options
      const labels = document.querySelectorAll('.question-label');
      // Walk backwards to find the label associated with the current (enabled) options
      for (let i = labels.length - 1; i >= 0; i--) {
        const label = labels[i];
        const parent = label.closest('.question-card') || label.closest('.module-question');
        if (parent) {
          const optsList = parent.querySelector('.options-list');
          if (optsList && optsList.querySelector('.option-button:not([disabled])')) {
            return label.textContent.trim();
          }
        }
      }
      // Fallback: return last label
      if (labels.length > 0) return labels[labels.length - 1].textContent.trim();
      return '';
    });

    // 6. Look up the answer key from the profile
    let answerKey = 'A'; // safe default
    if (currentLabel && answerMap[currentLabel]) {
      answerKey = answerMap[currentLabel];
    }

    // 7. Click the option
    await selectOption(page, answerKey);
    await page.waitForTimeout(400);
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
 * Handle skip links for post-taste prompt, CU2 free-text, adaptive micro-prompt.
 * Returns true if a skip link was found and clicked.
 */
async function handleSkipLink(page) {
  const skipBtn = await page.$('.cu2-skip-link');
  if (!skipBtn) return false;

  const box = await skipBtn.boundingBox();
  if (!box) return false;

  await skipBtn.click();
  await page.waitForTimeout(500);
  return true;
}

/**
 * Handle taste reasoning follow-up buttons.
 * These have class .reasoning-option and NO .option-key span.
 * Returns true if reasoning buttons were found and one was clicked.
 */
async function handleReasoningButtons(page) {
  const clicked = await page.evaluate(() => {
    const reasoningBtns = document.querySelectorAll('.reasoning-option:not([disabled])');
    if (reasoningBtns.length > 0) {
      reasoningBtns[0].click();
      return true;
    }
    return false;
  });

  if (clicked) {
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

async function handleFollowUpButtons(page) {
  const clicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('.follow-up-option:not([disabled]):not(.reasoning-option)');
    if (btns.length > 0) {
      btns[0].click();
      return true;
    }
    return false;
  });
  if (clicked) {
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

/**
 * Select an option by its key letter (A, B, C, D, E).
 * Uses page.evaluate for atomic DOM interaction.
 * Only matches buttons that have a .option-key span.
 */
async function selectOption(page, key) {
  // Wait for enabled option buttons with keys to be present
  await page.waitForFunction(
    () => {
      const lists = document.querySelectorAll('.options-list');
      for (const list of lists) {
        const enabled = list.querySelectorAll('.option-button:not([disabled])');
        for (const btn of enabled) {
          if (btn.querySelector('.option-key')) return true;
        }
      }
      return false;
    },
    { timeout: 5000 }
  ).catch(() => null);

  const clicked = await page.evaluate((targetKey) => {
    // Get all options-lists on the page
    const lists = document.querySelectorAll('.options-list');
    // Find the last list that has enabled buttons WITH .option-key
    let targetList = null;
    for (const list of lists) {
      const enabled = list.querySelectorAll('.option-button:not([disabled])');
      const hasKeys = Array.from(enabled).some(btn => btn.querySelector('.option-key'));
      if (enabled.length > 0 && hasKeys) targetList = list;
    }
    if (!targetList) return { found: false, reason: 'no list with enabled keyed buttons' };

    // Find the button with matching key in this list
    const buttons = targetList.querySelectorAll('.option-button:not([disabled])');
    for (const btn of buttons) {
      const keyEl = btn.querySelector('.option-key');
      if (keyEl && keyEl.textContent.trim() === targetKey) {
        btn.click();
        return { found: true, label: targetKey };
      }
    }

    // Debug: return what we found
    const foundKeys = Array.from(buttons).map(b => {
      const k = b.querySelector('.option-key');
      return k ? k.textContent.trim() : '(reasoning)';
    });
    return { found: false, reason: `key "${targetKey}" not in [${foundKeys.join(', ')}]` };
  }, key);

  if (!clicked.found) {
    throw new Error(`selectOption failed: ${clicked.reason}`);
  }

  await page.waitForTimeout(400);
}

/**
 * Extract results from the results page DOM
 */
export async function extractResults(page) {
  await waitForResults(page);

  const rawVerdict = await page.$eval('#verdict-label', el => el.textContent.trim());
  const verdict = rawVerdict.charAt(0).toUpperCase() + rawVerdict.slice(1).toLowerCase();
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
