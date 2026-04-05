// Smart waits for dynamic assessment behavior
export async function waitForQuestionCard(page, opts = {}) {
  const timeout = opts.timeout || 10000;
  await page.waitForSelector('.question-card.visible, .module-question.visible', { timeout });
  // Extra buffer for animation
  await page.waitForTimeout(300);
}

export async function waitForResults(page) {
  await page.waitForSelector('#verdict-label', { timeout: 15000 });
  await page.waitForTimeout(500);

  // Force-reveal any hidden sections within results
  await page.evaluate(() => {
    document.querySelectorAll('#assessment-results .hidden').forEach(el => {
      el.classList.remove('hidden');
    });
  });
  await page.waitForTimeout(500);
}

export async function waitForBriefStream(page) {
  // Brief streams progressively — wait for container to appear, then wait
  // for the loading indicator (.brief-loading) to be removed, which is the
  // real completion signal emitted by generateBrief() in assessment-ui.js.
  // Content-length stabilization is unreliable because real Opus streams
  // can pause >3s between token bursts and exit the stability check early.
  await page.waitForSelector('.brief-text-container:not(.hidden)', { timeout: 30000 });
  await page.waitForSelector('.brief-loading', { state: 'detached', timeout: 120000 }).catch(() => {});
}

export async function waitForProgressUpdate(page) {
  await page.waitForTimeout(350);
}

export async function getProgressPercent(page) {
  return page.$eval('#progress-fill', el => {
    const width = el.style.width;
    return parseInt(width, 10);
  });
}
