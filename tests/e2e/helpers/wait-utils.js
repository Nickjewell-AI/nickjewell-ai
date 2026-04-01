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
  // Brief streams progressively — wait for container to appear and have content
  await page.waitForSelector('.brief-text-container:not(.hidden)', { timeout: 30000 });
  // Wait for streaming to finish (check for content length stabilization)
  let lastLength = 0;
  let stableCount = 0;
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(1000);
    const currentLength = await page.$eval('.brief-text-container', el => el.textContent.length).catch(() => 0);
    if (currentLength > 0 && currentLength === lastLength) {
      stableCount++;
      if (stableCount >= 3) break;
    } else {
      stableCount = 0;
    }
    lastLength = currentLength;
  }
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
