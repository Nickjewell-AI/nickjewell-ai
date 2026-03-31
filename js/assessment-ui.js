// assessment-ui.js — Conversational assessment interface
(function() {
const {
  createSession,
  getNextQuestion,
  recordAnswer,
  recordFollowUp,
  recordTasteReasoning,
  analyzeCU2Response,
  computeResults,
  getTotalQuestions,
  getAnsweredCount,
  TASTE_REASONING,
  TASTE_LEADINS,
  buildBriefContext,
  ADAPTIVE_MICRO_PROMPTS,
  getModuleQuestions,
} = window.AssessmentEngine;

const LAYER_NAMES = {
  foundation: 'Foundation',
  architecture: 'Architecture',
  accountability: 'Accountability',
  culture: 'Culture',
};

const TASTE_MICRO_PROMPTS = {
  T1: "What\u2019s the first thing you\u2019d actually check?",
  T2: "What\u2019s the real problem the CEO is trying to solve?",
  T3: "What would tip your decision?",
  T4: "What\u2019s the edge case that worries you most?",
};

let session;
let container;
let progressBar;
let progressText;
let tierLabel;
let assessmentStartTime;
let lastResults;
let savedRowId = null;
let briefStreamActive = false;
let freeTextConfirmationShown = false;

function init() {
  session = createSession();
  container = document.getElementById('assessment-flow');
  progressBar = document.getElementById('progress-fill');
  progressText = document.getElementById('progress-text');
  tierLabel = document.getElementById('tier-label');

  document.getElementById('start-btn').addEventListener('click', startAssessment);
}

function startAssessment() {
  assessmentStartTime = Date.now();
  document.getElementById('assessment-intro').classList.add('hidden');
  document.getElementById('assessment-active').classList.remove('hidden');
  showNextQuestion();
}

function updateProgress() {
  const answered = getAnsweredCount(session);
  const total = getTotalQuestions(session);
  const pct = Math.round((answered / total) * 100);
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', pct);
  progressText.textContent = `${answered} of ${total}`;
}

function showNextQuestion() {
  const question = getNextQuestion(session);

  if (!question) {
    showEmailCapture();
    return;
  }

  // Show adaptive transition screen for first question in each adaptive layer
  if (question.isAdaptive && question.isFirstAdaptiveForLayer) {
    showAdaptiveTransition(question.adaptiveLayer, () => {
      // Re-render this same question after transition
      renderAdaptiveQuestion(question);
    });
    return;
  }

  renderQuestion(question);
}

function renderAdaptiveQuestion(question) {
  // Update tier label and render normally
  let label = question.tierLabel;
  if (question.layerLabel) label += ' \u2014 ' + question.layerLabel;
  tierLabel.textContent = label;
  updateProgress();
  renderQuestionCard(question);
}

function renderQuestion(question) {
  // Update tier label
  let label = question.tierLabel;
  if (question.layerLabel) label += ' — ' + question.layerLabel;
  tierLabel.textContent = label;
  updateProgress();
  renderQuestionCard(question);
}

function renderQuestionCard(question) {
  // Build question card
  const card = document.createElement('div');
  card.className = 'question-card fade-in';

  const qLabel = document.createElement('div');
  qLabel.className = 'question-label';
  qLabel.textContent = question.label;

  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.textContent = question.text;

  const options = document.createElement('div');
  options.className = 'options-list';
  options.setAttribute('role', 'radiogroup');

  let locked = false;

  question.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.innerHTML = `<span class="option-key">${opt.key}</span><span class="option-text">${opt.text}</span>`;
    btn.addEventListener('click', () => {
      if (locked) return;
      locked = true;
      // Show selected state briefly before advancing
      options.querySelectorAll('.option-button').forEach((b) => { b.classList.remove('selected'); b.setAttribute('aria-checked', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
      setTimeout(() => handleAnswer(card, question, opt, options), 250);
    });
    options.appendChild(btn);
  });

  card.appendChild(qLabel);
  card.appendChild(qText);
  card.appendChild(options);
  container.appendChild(card);

  // Trigger animation
  requestAnimationFrame(() => card.classList.add('visible'));

  // Scroll to the new question card so it's visible at the top of the viewport
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleAnswer(card, question, selectedOption, optionsContainer) {
  // Disable all option buttons
  const buttons = optionsContainer.querySelectorAll('.option-button');
  buttons.forEach((btn) => {
    btn.disabled = true;
    btn.classList.add('disabled');
  });

  // Record the answer
  recordAnswer(session, question.id, selectedOption.key, selectedOption.score);

  // Show insight if applicable
  const insightKey = 'insightOn' + selectedOption.key;
  if (question[insightKey]) {
    const insight = document.createElement('div');
    insight.className = 'question-insight fade-in';
    insight.textContent = question[insightKey];
    card.appendChild(insight);
    requestAnimationFrame(() => insight.classList.add('visible'));
  }

  // Check if adaptive layer just completed — show micro-prompt
  if (question.isAdaptive && session.adaptiveFollowUp._layerJustCompleted) {
    const completedLayer = session.adaptiveFollowUp._layerJustCompleted;
    session.adaptiveFollowUp._layerJustCompleted = null;
    setTimeout(() => showAdaptiveMicroPrompt(card, completedLayer), 400);
    return;
  }

  // Check for CU2 free-text follow-up (option A = "Yes, we had a failure")
  if (question.id === 'CU2' && selectedOption.key === 'A') {
    setTimeout(() => showCU2FreeText(card, question), 400);
    return;
  }

  // Check for taste reasoning follow-up (Tier 3 taste questions)
  if (question.tier === 3 && TASTE_REASONING[question.id]) {
    setTimeout(() => showTasteReasoning(card, question, selectedOption), 400);
    return;
  }

  // Check for follow-up question
  const triggerKeys = question.followUp?.triggerKeys || (question.followUp?.triggerKey ? [question.followUp.triggerKey] : []);
  if (question.followUp && triggerKeys.includes(selectedOption.key)) {
    setTimeout(() => showFollowUp(card, question), 400);
  } else {
    setTimeout(() => showNextQuestion(), 400);
  }
}

function showFollowUp(parentCard, parentQuestion) {
  const fu = parentQuestion.followUp;

  const fuCard = document.createElement('div');
  fuCard.className = 'follow-up-card fade-in';

  const fuText = document.createElement('div');
  fuText.className = 'follow-up-text';
  fuText.textContent = fu.text;

  const fuOptions = document.createElement('div');
  fuOptions.className = 'options-list';

  let fuLocked = false;

  fu.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-button follow-up-option';
    btn.innerHTML = `<span class="option-key">${opt.key}</span><span class="option-text">${opt.text}</span>`;
    btn.addEventListener('click', () => {
      if (fuLocked) return;
      fuLocked = true;
      fuOptions.querySelectorAll('.option-button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');

      setTimeout(() => {
        // Disable all follow-up buttons
        const fuButtons = fuOptions.querySelectorAll('.option-button');
        fuButtons.forEach((b) => { b.disabled = true; b.classList.add('disabled'); });

        // Record follow-up
        recordFollowUp(session, fu.id, opt.key, parentQuestion.id, opt.effect, opt.newScore);

        // Show follow-up insight if applicable
        const fuInsightKey = 'insightOn' + opt.key;
        if (fu[fuInsightKey]) {
          const insight = document.createElement('div');
          insight.className = 'question-insight fade-in';
          insight.textContent = fu[fuInsightKey];
          fuCard.appendChild(insight);
          requestAnimationFrame(() => insight.classList.add('visible'));
        }

        setTimeout(() => showNextQuestion(), 400);
      }, 250);
    });
    fuOptions.appendChild(btn);
  });

  fuCard.appendChild(fuText);
  fuCard.appendChild(fuOptions);
  parentCard.appendChild(fuCard);
  requestAnimationFrame(() => fuCard.classList.add('visible'));
}

function showCU2FreeText(parentCard, parentQuestion) {
  const fuCard = document.createElement('div');
  fuCard.className = 'follow-up-card fade-in';

  const fuText = document.createElement('div');
  fuText.className = 'follow-up-text';
  fuText.textContent = 'Tell us what happened — it makes your results more precise.';

  const freeTextWrap = document.createElement('div');
  freeTextWrap.className = 'cu2-freetext-wrap';

  const textarea = document.createElement('textarea');
  textarea.className = 'taste-freetext';
  textarea.placeholder = 'Describe what happened and what you learned (optional — but it makes your results more precise)';
  textarea.rows = 4;

  const controls = document.createElement('div');
  controls.className = 'cu2-controls';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'taste-freetext-submit';
  submitBtn.textContent = 'Submit';

  const skipLink = document.createElement('a');
  skipLink.href = '#';
  skipLink.className = 'cu2-skip-link';
  skipLink.textContent = 'Skip →';

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    setTimeout(() => showNextQuestion(), 400);
  });

  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing…';
    textarea.disabled = true;
    skipLink.style.display = 'none';
    showFreeTextConfirmation(freeTextWrap);
    try {
      await analyzeCU2Response(session, text);
    } catch { /* silent */ }
    submitBtn.textContent = 'Thanks!';
    setTimeout(() => showNextQuestion(), 600);
  });

  controls.appendChild(submitBtn);
  controls.appendChild(skipLink);

  freeTextWrap.appendChild(textarea);
  freeTextWrap.appendChild(controls);

  fuCard.appendChild(fuText);
  fuCard.appendChild(freeTextWrap);

  parentCard.appendChild(fuCard);
  requestAnimationFrame(() => fuCard.classList.add('visible'));
  fuCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showTasteReasoning(parentCard, parentQuestion, selectedOption) {
  const reasoning = TASTE_REASONING[parentQuestion.id];

  const fuCard = document.createElement('div');
  fuCard.className = 'follow-up-card fade-in';

  const leadIn = TASTE_LEADINS[parentQuestion.id]?.[selectedOption.key] || 'What was the biggest factor in your thinking?';

  const fuText = document.createElement('div');
  fuText.className = 'follow-up-text';
  fuText.textContent = leadIn;

  const fuOptions = document.createElement('div');
  fuOptions.className = 'options-list';

  let rLocked = false;

  reasoning.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-button follow-up-option reasoning-option';
    btn.innerHTML = `<span class="option-text">${opt.text}</span>`;
    btn.addEventListener('click', () => {
      if (rLocked) return;
      rLocked = true;
      fuOptions.querySelectorAll('.option-button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(() => {
        fuOptions.querySelectorAll('.option-button').forEach((b) => { b.disabled = true; b.classList.add('disabled'); });
        recordTasteReasoning(session, parentQuestion.id, opt.key);
        setTimeout(() => showNextQuestion(), 400);
      }, 250);
    });
    fuOptions.appendChild(btn);
  });

  fuCard.appendChild(fuText);
  fuCard.appendChild(fuOptions);

  // Scenario-specific micro-prompt link
  const microPromptText = TASTE_MICRO_PROMPTS[parentQuestion.id] || 'Tell us more';
  const tellMore = document.createElement('a');
  tellMore.href = '#';
  tellMore.className = 'tell-us-more-link';
  tellMore.textContent = microPromptText + ' \u2192';
  tellMore.addEventListener('click', (e) => {
    e.preventDefault();
    tellMore.style.display = 'none';
    freeTextWrap.classList.remove('hidden');
  });

  const freeTextWrap = document.createElement('div');
  freeTextWrap.className = 'taste-freetext-wrap hidden';

  const textarea = document.createElement('textarea');
  textarea.className = 'taste-freetext';
  textarea.placeholder = 'One sentence is plenty.';
  textarea.rows = 3;

  const submitBtn = document.createElement('button');
  submitBtn.className = 'taste-freetext-submit';
  submitBtn.textContent = 'Submit';
  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing\u2026';
    showFreeTextConfirmation(freeTextWrap);
    try {
      if (window.AssessmentAPI && window.AssessmentAPI.callAssessmentAPI) {
        const systemPrompt = 'You are analyzing a free-text response from a strategic AI readiness assessment. The user was asked why they made a particular choice in a scenario about AI implementation. Analyze their reasoning for:\n- Frame Recognition: Do they question assumptions or reframe the problem? (adjust: -1, 0, or +1)\n- Kill Discipline: Do they show willingness to stop or redirect? (adjust: -1, 0, or +1)\n- Edge-Case Instinct: Do they think about what could go wrong? (adjust: -1, 0, or +1)\nRespond with ONLY a JSON object: {"fr": 0, "kd": 0, "ec": 0} with values of -1, 0, or +1.';
        const userMsg = `Scenario: ${parentQuestion.text}\nTheir answer: ${selectedOption.text}\nWhy they chose it: ${text}`;
        const result = await window.AssessmentAPI.callAssessmentAPI({
          system: systemPrompt,
          messages: [{ role: 'user', content: userMsg }],
          model: 'claude-sonnet-4-20250514',
        });
        if (result) {
          try {
            const jsonMatch = result.match(/\{[^}]+\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (!session.tasteReasoningDims) {
                session.tasteReasoningDims = { frameRecognition: 0, killDiscipline: 0, edgeCaseInstinct: 0 };
              }
              const clamp = (v) => Math.max(-1, Math.min(1, Math.round(v) || 0));
              session.tasteReasoningDims.frameRecognition += clamp(parsed.fr);
              session.tasteReasoningDims.killDiscipline += clamp(parsed.kd);
              session.tasteReasoningDims.edgeCaseInstinct += clamp(parsed.ec);
            }
          } catch { /* skip silently */ }
        }
      }
    } catch { /* skip silently */ }
    submitBtn.textContent = 'Thanks!';
  });

  freeTextWrap.appendChild(textarea);
  freeTextWrap.appendChild(submitBtn);

  fuCard.appendChild(tellMore);
  fuCard.appendChild(freeTextWrap);

  parentCard.appendChild(fuCard);
  requestAnimationFrame(() => fuCard.classList.add('visible'));
  fuCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Adaptive Follow-Up Transition & Micro-Prompt ────────

function showAdaptiveTransition(layerName, onComplete) {
  const displayName = LAYER_NAMES[layerName] || layerName;
  const transition = document.createElement('div');
  transition.className = 'question-card fade-in';
  transition.innerHTML = `<div class="question-label" style="color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.8rem;">Deeper Dive</div><div class="question-text" style="margin-top: 0.75rem;">We\u2019d like to go a little deeper on ${displayName}.</div>`;
  container.appendChild(transition);
  requestAnimationFrame(() => transition.classList.add('visible'));
  transition.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => {
    onComplete();
  }, 1500);
}

function showAdaptiveMicroPrompt(parentCard, layerName) {
  const prompts = ADAPTIVE_MICRO_PROMPTS[layerName];
  if (!prompts) { setTimeout(() => showNextQuestion(), 400); return; }

  const fuCard = document.createElement('div');
  fuCard.className = 'follow-up-card fade-in';

  const fuText = document.createElement('div');
  fuText.className = 'follow-up-text';
  fuText.textContent = prompts.prompt;

  const freeTextWrap = document.createElement('div');
  freeTextWrap.className = 'cu2-freetext-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'taste-freetext';
  input.placeholder = prompts.placeholder;
  input.style.cssText = 'width: 100%; padding: 0.75rem; font-size: 0.95rem;';

  const controls = document.createElement('div');
  controls.className = 'cu2-controls';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'taste-freetext-submit';
  submitBtn.textContent = 'Submit';

  const skipLink = document.createElement('a');
  skipLink.href = '#';
  skipLink.className = 'cu2-skip-link';
  skipLink.textContent = 'Skip \u2192';

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    setTimeout(() => showNextQuestion(), 400);
  });

  submitBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    session.adaptiveFreeText[layerName] = text;
    showFreeTextConfirmation(freeTextWrap);
    submitBtn.textContent = 'Thanks!';
    submitBtn.disabled = true;
    input.disabled = true;
    skipLink.style.display = 'none';
    setTimeout(() => showNextQuestion(), 600);
  });

  controls.appendChild(submitBtn);
  controls.appendChild(skipLink);
  freeTextWrap.appendChild(input);
  freeTextWrap.appendChild(controls);
  fuCard.appendChild(fuText);
  fuCard.appendChild(freeTextWrap);

  parentCard.appendChild(fuCard);
  requestAnimationFrame(() => fuCard.classList.add('visible'));
  fuCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Free-Text Value Confirmation (Part 6) ──────────────

function showFreeTextConfirmation(parentEl) {
  if (freeTextConfirmationShown) return;
  freeTextConfirmationShown = true;
  const msg = document.createElement('p');
  msg.className = 'freetext-confirmation';
  msg.textContent = 'This will shape your executive brief.';
  msg.style.cssText = 'color: var(--accent); font-style: italic; font-size: 0.85rem; margin-top: 0.5rem; opacity: 1; transition: opacity 0.5s;';
  parentEl.appendChild(msg);
  setTimeout(() => { msg.style.opacity = '0'; }, 2000);
  setTimeout(() => { msg.remove(); }, 2500);
}

// ─── Email Capture ───────────────────────────────────────

function showEmailCapture() {
  document.getElementById('assessment-active').classList.add('hidden');
  const captureEl = document.getElementById('email-capture');
  captureEl.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const input = document.getElementById('capture-email');
  const error = document.getElementById('capture-error');
  const submitBtn = document.getElementById('capture-submit');
  const skipBtn = document.getElementById('capture-skip');

  input.focus();

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Clear validation on input
  input.addEventListener('input', () => {
    input.classList.remove('invalid');
    error.classList.remove('visible');
  });

  submitBtn.addEventListener('click', () => {
    const email = input.value.trim();
    if (!email || !validateEmail(email)) {
      input.classList.add('invalid');
      error.classList.add('visible');
      return;
    }

    // Store captured email for use after results render
    session._capturedEmail = email;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading your results\u2026';
    skipBtn.style.display = 'none';

    captureEl.classList.add('hidden');
    showResults();
  });

  skipBtn.addEventListener('click', () => {
    captureEl.classList.add('hidden');
    showResults();
  });
}

// ─── Results ──────────────────────────────────────────────

function createHorizonGroup(label, subtitle, actions) {
  const group = document.createElement('div');
  group.className = 'horizon-group fade-in';

  const header = document.createElement('div');
  header.className = 'horizon-label';
  header.textContent = label;

  const sub = document.createElement('div');
  sub.className = 'horizon-subtitle';
  sub.textContent = subtitle;

  group.appendChild(header);
  group.appendChild(sub);

  actions.forEach((action) => {
    if (!action) return;
    const item = document.createElement('div');
    item.className = 'horizon-action';
    item.textContent = action;
    group.appendChild(item);
  });

  return group;
}

function showResults() {
  try {
  const results = computeResults(session);
  lastResults = results;

  document.getElementById('assessment-active').classList.add('hidden');
  const resultsEl = document.getElementById('assessment-results');
  resultsEl.classList.remove('hidden');

  // Scroll to top so user sees verdict badge first
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Verdict badge
  const verdictClass = 'verdict-' + results.verdict.toLowerCase();
  document.getElementById('verdict-badge').className = 'verdict-badge ' + verdictClass;
  document.getElementById('verdict-label').textContent = results.verdict.toUpperCase();
  document.getElementById('verdict-score').textContent = results.composite + '/100';
  document.getElementById('verdict-summary').textContent = results.verdictSummary;

  // Layer bars
  const barsContainer = document.getElementById('layer-bars');
  barsContainer.innerHTML = '';

  const layers = ['foundation', 'architecture', 'accountability', 'culture'];
  layers.forEach((layer) => {
    const score = results.layerScores[layer];
    const isConstraint = layer === results.bindingConstraint;
    const row = document.createElement('div');
    row.className = 'layer-row' + (isConstraint ? ' is-constraint' : '');

    const label = document.createElement('div');
    label.className = 'layer-label';
    label.innerHTML = `<span class="layer-name">${LAYER_NAMES[layer]}</span>`;

    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'layer-score-label';

    if (score !== null) {
      scoreLabel.textContent = score + '/100';
      if (isConstraint) {
        const tag = document.createElement('span');
        tag.className = 'constraint-tag';
        tag.textContent = 'BINDING CONSTRAINT';
        label.appendChild(tag);
      }
      // Show subtle note for shallow-assessed layers
      if (results.moduleDepths && results.moduleDepths[layer] === 'shallow') {
        const quickNote = document.createElement('span');
        quickNote.className = 'quick-assessment-note';
        quickNote.textContent = '(quick assessment)';
        label.appendChild(quickNote);
      }
    } else {
      scoreLabel.textContent = 'Not assessed';
      scoreLabel.classList.add('not-assessed');
    }

    label.appendChild(scoreLabel);

    const barOuter = document.createElement('div');
    barOuter.className = 'layer-bar';

    const barFill = document.createElement('div');
    barFill.className = 'layer-bar-fill';

    if (score !== null) {
      if (score >= 70) barFill.style.background = 'var(--verdict-green)';
      else if (score >= 40) barFill.style.background = 'var(--accent)';
      else barFill.style.background = 'var(--verdict-red)';
    }

    barOuter.appendChild(barFill);
    row.appendChild(label);
    row.appendChild(barOuter);
    barsContainer.appendChild(row);

    // Animate fill after render
    if (score !== null) {
      setTimeout(() => {
        barFill.style.width = score + '%';
      }, 300);
    }
  });

  // Verdict framing (Red only)
  const framingEl = document.getElementById('verdict-framing');
  if (results.verdictFraming && framingEl) {
    framingEl.textContent = results.verdictFraming;
    framingEl.classList.remove('hidden');
  } else if (framingEl) {
    framingEl.classList.add('hidden');
  }

  // Taste signature
  const tasteEl = document.getElementById('taste-signature');
  tasteEl.style.borderColor = results.tasteSignature.color;
  document.getElementById('taste-name').textContent = results.tasteSignature.name;
  document.getElementById('taste-name').style.color = results.tasteSignature.color;
  document.getElementById('taste-score').textContent = '';
  document.getElementById('taste-description').textContent = results.tasteSignature.description;

  // Taste characterization (personalized sentence)
  const tasteCharEl = document.getElementById('taste-characterization');
  if (tasteCharEl && results.tasteCharacterization) {
    tasteCharEl.textContent = results.tasteCharacterization;
    tasteCharEl.classList.remove('hidden');
  }

  // Taste dimension bars
  if (results.tasteDimensions) {
    const dims = results.tasteDimensions;
    const maxes = { frameRecognition: 8, killDiscipline: 6, edgeCaseInstinct: 8 };
    const els = {
      frameRecognition: { bar: 'dim-frame', val: 'dim-frame-val' },
      killDiscipline: { bar: 'dim-kill', val: 'dim-kill-val' },
      edgeCaseInstinct: { bar: 'dim-edge', val: 'dim-edge-val' },
    };
    for (const [dim, max] of Object.entries(maxes)) {
      const score = dims[dim] || 0;
      const barEl = document.getElementById(els[dim].bar);
      const valEl = document.getElementById(els[dim].val);
      if (barEl) barEl.style.width = Math.round((score / max) * 100) + '%';
      if (valEl) valEl.textContent = score + '/' + max;
    }
  }

  // Constraint explanation
  document.getElementById('constraint-title').textContent =
    results.bindingConstraint
      ? `Binding Constraint: ${LAYER_NAMES[results.bindingConstraint]}`
      : 'No clear binding constraint identified';
  document.getElementById('constraint-text').textContent = results.constraintExplanation;

  // Three-horizon action plan
  const actionsContainer = document.getElementById('actions-list');
  actionsContainer.innerHTML = '';
  const plan = results.actionPlan;
  let delay = 600;

  // Right Now
  const nowGroup = createHorizonGroup('Right Now', 'Take this action today.', [plan.rightNow]);
  actionsContainer.appendChild(nowGroup);
  setTimeout(() => nowGroup.classList.add('visible'), delay);
  delay += 250;

  // This Week
  const weekGroup = createHorizonGroup('This Week', 'Set the foundation.', plan.thisWeek);
  actionsContainer.appendChild(weekGroup);
  setTimeout(() => weekGroup.classList.add('visible'), delay);
  delay += 250;

  // This Month
  const monthGroup = createHorizonGroup('This Month', 'The structural change.', [plan.thisMonth]);
  actionsContainer.appendChild(monthGroup);
  setTimeout(() => monthGroup.classList.add('visible'), delay);

  // Assessment depth note — only list layers that remained quick-assessed
  // (fewer than 3 total questions, excluding layers that got adaptive follow-ups)
  const noteEl = document.getElementById('assessed-note');
  if (results.moduleDepths) {
    const shallowLayers = Object.entries(results.moduleDepths)
      .filter(([layer, d]) => {
        if (d !== 'shallow') return false;
        const totalResponses = (session.layerResponses[layer] || []).length;
        return totalResponses < 3;
      })
      .map(([l]) => LAYER_NAMES[l]);
    if (shallowLayers.length > 0) {
      noteEl.textContent = `${shallowLayers.join(' and ')} received a quick assessment based on core diagnostic questions. Deeply assessed layers used the full question set for higher confidence scoring.`;
      noteEl.classList.remove('hidden');
    } else {
      noteEl.classList.add('hidden');
    }
  } else {
    noteEl.classList.add('hidden');
  }

  // Post-results reflection prompt
  const briefSectionForReflection = document.getElementById('executive-brief-section');
  if (briefSectionForReflection && briefSectionForReflection.parentNode) {
    const reflectionDiv = document.createElement('div');
    reflectionDiv.className = 'result-section reflection-prompt fade-in';
    reflectionDiv.id = 'reflection-prompt';
    reflectionDiv.style.cssText = 'padding: 1.5rem 0; text-align: center;';

    const reflectionQ = document.createElement('p');
    reflectionQ.textContent = 'Did anything surprise you?';
    reflectionQ.style.cssText = 'color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.75rem;';

    const reflectionWrap = document.createElement('div');
    reflectionWrap.style.cssText = 'display: flex; gap: 0.5rem; justify-content: center; align-items: center; flex-wrap: wrap; max-width: 500px; margin: 0 auto;';

    const reflectionInput = document.createElement('input');
    reflectionInput.type = 'text';
    reflectionInput.className = 'reflection-input';
    reflectionInput.placeholder = 'One sentence \u2014 this shapes your executive brief.';
    reflectionInput.maxLength = 300;
    reflectionInput.style.cssText = 'flex: 1; min-width: 200px; padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-primary); font-family: var(--font-body); font-size: 0.9rem; border-radius: 4px;';

    const reflectionBtn = document.createElement('button');
    reflectionBtn.className = 'taste-freetext-submit';
    reflectionBtn.textContent = 'Submit';

    const reflectionSkip = document.createElement('a');
    reflectionSkip.href = '#';
    reflectionSkip.className = 'cu2-skip-link';
    reflectionSkip.textContent = 'Skip';
    reflectionSkip.style.cssText = 'font-size: 0.85rem; margin-left: 0.5rem;';

    reflectionBtn.addEventListener('click', () => {
      const text = reflectionInput.value.trim();
      if (!text) return;
      session.reflectionResponse = text;
      reflectionBtn.textContent = 'Thanks!';
      reflectionBtn.disabled = true;
      reflectionInput.disabled = true;
      reflectionSkip.style.display = 'none';
    });

    reflectionSkip.addEventListener('click', (e) => {
      e.preventDefault();
      reflectionDiv.style.display = 'none';
    });

    reflectionWrap.appendChild(reflectionInput);
    reflectionWrap.appendChild(reflectionBtn);
    reflectionWrap.appendChild(reflectionSkip);
    reflectionDiv.appendChild(reflectionQ);
    reflectionDiv.appendChild(reflectionWrap);

    briefSectionForReflection.parentNode.insertBefore(reflectionDiv, briefSectionForReflection);
  }

  // Retake button — replace to avoid stacking listeners on repeated retakes
  const retakeBtn = document.getElementById('retake-btn');
  const freshRetakeBtn = retakeBtn.cloneNode(true);
  retakeBtn.parentNode.replaceChild(freshRetakeBtn, retakeBtn);
  freshRetakeBtn.addEventListener('click', () => {
    resultsEl.classList.add('hidden');
    container.innerHTML = '';
    document.getElementById('assessment-intro').classList.remove('hidden');
    // Reset email capture screen
    const captureEl = document.getElementById('email-capture');
    captureEl.classList.add('hidden');
    const captureInput = document.getElementById('capture-email');
    captureInput.value = '';
    captureInput.classList.remove('invalid');
    document.getElementById('capture-error').classList.remove('visible');
    const captureSubmit = document.getElementById('capture-submit');
    captureSubmit.disabled = false;
    captureSubmit.textContent = 'Send & Show My Results';
    document.getElementById('capture-skip').style.display = '';
    session = createSession();
    lastResults = null;
    savedRowId = null;
    freeTextConfirmationShown = false;
    // Remove reflection element from previous run
    const oldReflection = document.getElementById('reflection-prompt');
    if (oldReflection) oldReflection.remove();
  });

  // Auto-save anonymous results
  autoSaveResults();


  // Executive Brief CTA
  initExecutiveBrief();

  // Stagger fade-in of result sections
  const sections = resultsEl.querySelectorAll('.result-section');
  sections.forEach((sec, i) => {
    sec.classList.add('fade-in');
    setTimeout(() => sec.classList.add('visible'), 200 + i * 250);
  });

  // Sticky brief CTA — show when verdict scrolled past, hide when brief section visible
  initStickyBriefCTA();

  } catch (err) {
    console.error('showResults error:', err);
    // Ensure results are visible even if something fails
    document.getElementById('assessment-results').classList.remove('hidden');
  }
}

// ─── Sticky Brief CTA ─────────────────────────────────

let stickyObservers = [];

function initStickyBriefCTA() {
  const stickyCta = document.getElementById('brief-sticky-cta');
  if (!stickyCta) return;

  // Clean up any previous observers (retake)
  stickyObservers.forEach(obs => obs.disconnect());
  stickyObservers = [];
  stickyCta.classList.remove('visible');

  const verdictSection = document.querySelector('.results-header');
  const briefSection = document.getElementById('executive-brief-section');
  if (!verdictSection || !briefSection) return;

  let pastVerdict = false;
  let briefVisible = false;

  function updateVisibility() {
    if (pastVerdict && !briefVisible) {
      stickyCta.classList.add('visible');
    } else {
      stickyCta.classList.remove('visible');
    }
  }

  // Show when verdict is scrolled past
  const verdictObs = new IntersectionObserver((entries) => {
    pastVerdict = !entries[0].isIntersecting;
    updateVisibility();
  }, { threshold: 0 });
  verdictObs.observe(verdictSection);
  stickyObservers.push(verdictObs);

  // Hide when brief section enters viewport
  const briefObs = new IntersectionObserver((entries) => {
    briefVisible = entries[0].isIntersecting;
    updateVisibility();
  }, { threshold: 0.1 });
  briefObs.observe(briefSection);
  stickyObservers.push(briefObs);
}

function hideStickyBriefCTA() {
  const stickyCta = document.getElementById('brief-sticky-cta');
  if (stickyCta) stickyCta.classList.remove('visible');
  stickyObservers.forEach(obs => obs.disconnect());
  stickyObservers = [];
}

// ─── Executive Brief ─────────────────────────────────────

function renderMondayActions(container, bulletLines, animDelay) {
  // Section label
  const label = document.createElement('div');
  label.className = 'monday-section-label';
  label.textContent = 'YOUR NEXT MOVES';
  label.style.animationDelay = animDelay + 'ms';
  container.appendChild(label);
  animDelay += 100;

  const wrapper = document.createElement('div');
  wrapper.className = 'monday-actions';
  container.appendChild(wrapper);

  bulletLines.forEach((raw, idx) => {
    const text = raw.replace(/^\s*[-*]\s+/, '');

    const card = document.createElement('div');
    card.className = 'monday-action-card fade-in';
    card.style.animationDelay = (animDelay + idx * 150) + 'ms';

    const number = document.createElement('div');
    number.className = 'monday-action-number';
    number.textContent = String(idx + 1).padStart(2, '0');

    const content = document.createElement('div');
    content.className = 'monday-action-content';

    const desc = document.createElement('div');
    desc.className = 'monday-action-desc';
    desc.innerHTML = parseBriefMarkdown(text);
    content.appendChild(desc);

    card.appendChild(number);
    card.appendChild(content);
    wrapper.appendChild(card);

    requestAnimationFrame(() => card.classList.add('visible'));
  });

  return animDelay + bulletLines.length * 150;
}

function parseBriefMarkdown(str) {
  // Escape HTML entities first to prevent injection
  str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // **bold** → <strong>
  str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return str;
}

function renderBrief(container, text) {
  const lines = text.split('\n');
  let i = 0;
  let animDelay = 0;
  let inMondaySection = false;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines
    if (!line.trim()) { i++; continue; }

    // Markdown headings: # → h2, ## → h3, ### → h4
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headerText = headingMatch[2];

      // Detect "What To Do Monday" section
      if (/what\s+to\s+do\s+monday/i.test(headerText)) {
        inMondaySection = true;
        // Skip the header — we render our own label
        i++;
        // Collect all bullet lines in this section
        const bullets = [];
        while (i < lines.length) {
          if (/^#{1,3}\s+/.test(lines[i])) break; // next section
          if (/^\s*[-*]\s+/.test(lines[i])) {
            bullets.push(lines[i]);
          }
          i++;
        }
        if (bullets.length > 0) {
          animDelay = renderMondayActions(container, bullets, animDelay);
        }
        inMondaySection = false;
        continue;
      }

      inMondaySection = false;
      const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      const h = document.createElement(tag);
      h.className = 'brief-section-header';
      h.textContent = headerText;
      h.style.animationDelay = animDelay + 'ms';
      container.appendChild(h);
      animDelay += 100;
      i++;
      continue;
    }

    // Bullet list: collect consecutive lines starting with - or *
    if (/^\s*[-*]\s+/.test(line)) {
      const ul = document.createElement('ul');
      ul.className = 'brief-list';
      ul.style.animationDelay = animDelay + 'ms';
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const li = document.createElement('li');
        li.className = 'brief-list-item';
        li.innerHTML = parseBriefMarkdown(lines[i].replace(/^\s*[-*]\s+/, ''));
        ul.appendChild(li);
        i++;
      }
      container.appendChild(ul);
      animDelay += 100;
      continue;
    }

    // Regular paragraph: collect consecutive non-blank, non-header, non-bullet lines
    let paraText = '';
    while (i < lines.length && lines[i].trim() && !/^#{1,3}\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
      paraText += (paraText ? ' ' : '') + lines[i].trim();
      i++;
    }
    if (paraText) {
      const p = document.createElement('p');
      p.className = 'brief-paragraph';
      p.innerHTML = parseBriefMarkdown(paraText);
      p.style.animationDelay = animDelay + 'ms';
      container.appendChild(p);
      animDelay += 100;
    }
  }
}

function initExecutiveBrief() {
  const section = document.getElementById('executive-brief-section');
  if (!section) return;

  const statusEl = section.querySelector('.brief-status');
  const briefContainer = section.querySelector('.brief-text-container');
  const contactForm = document.getElementById('brief-contact-form');
  const briefPreview = document.getElementById('brief-preview');

  // Reset brief UI state for retakes
  statusEl.classList.add('hidden');
  statusEl.textContent = '';
  briefContainer.innerHTML = '';
  briefContainer.classList.add('hidden');
  contactForm.classList.remove('hidden');
  if (briefPreview) briefPreview.classList.remove('hidden');

  // Replace form to remove any previous submit listeners
  const freshForm = contactForm.cloneNode(true);
  contactForm.parentNode.replaceChild(freshForm, contactForm);

  // Pre-fill if user already provided contact info this session
  if (session._contactName) {
    freshForm.querySelector('#brief-name').value = session._contactName;
    freshForm.querySelector('#brief-email').value = session._contactEmail;
    freshForm.querySelector('#brief-company').value = session._contactCompany;
    freshForm.querySelector('#brief-role').value = session._contactRole;
  }

  freshForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (briefStreamActive) return;

    const name = freshForm.querySelector('#brief-name').value.trim();
    const email = freshForm.querySelector('#brief-email').value.trim();
    const company = freshForm.querySelector('#brief-company').value.trim();
    const role = freshForm.querySelector('#brief-role').value.trim();

    if (!name || !email || !company || !role) return;

    // Disable submit button immediately to prevent double-clicks
    const submitBtn = freshForm.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="brief-spinner"></span>Generating your brief\u2026';
    }

    // Save contact info to session
    session._contactName = name;
    session._contactEmail = email;
    session._contactCompany = company;
    session._contactRole = role;

    // Update D1 record with contact info
    if (savedRowId) {
      try {
        await fetch('/api/submit-assessment', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedRowId, name, email, company, role }),
        });
      } catch (err) {
        // Silent fail — brief generation proceeds regardless
      }
    }

    // Hide form and preview, generate brief
    freshForm.classList.add('hidden');
    if (briefPreview) briefPreview.classList.add('hidden');
    generateBrief(statusEl, briefContainer).catch(() => {
      // On failure, restore the form so user can retry
      freshForm.classList.remove('hidden');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  });
}

async function generateBrief(statusEl, briefContainer) {
  if (briefStreamActive) return;
  briefStreamActive = true;

  hideStickyBriefCTA();
  const currentSession = session;
  const currentResults = lastResults;

  // Show loading state
  const loadingEl = document.createElement('div');
  loadingEl.className = 'brief-generate-btn brief-loading';
  loadingEl.style.display = 'inline-block';
  loadingEl.innerHTML = '<span class="brief-spinner"></span>Generating your brief\u2026';
  briefContainer.parentNode.insertBefore(loadingEl, briefContainer);
  briefContainer.classList.remove('hidden');

  const systemPrompt = 'You are a senior AI implementation strategist writing a personalized executive brief for the Jewell Assessment. Write in first-person plural (\u201cwe\u201d) as if you are the assessment delivering findings. Be direct, specific, and constructive \u2014 like a $500/hour consultant who respects the reader\u2019s time.\n\nUse this exact structure with markdown headers:\n\n## Verdict Context\n2-3 sentences on what the overall verdict means for THIS specific organization given their industry, role, and maturity stage.\n\n## The Real Story\nOne paragraph on what the pattern of their answers reveals \u2014 not just the scores, but what their specific combination of strengths and gaps means in practice. Reference specific answers where they are revealing.\n\n## Taste Read\n2-3 sentences on what their Taste signature and dimensional profile says about how they make decisions. Be specific to their FR/KD/EC scores.\n\n## The Binding Constraint\nOne paragraph on why their weakest layer is the bottleneck, what failure mode it creates, and why fixing other things first is wasted effort.\n\n## What To Do Monday\nThree bullet points with ultra-specific actions for the next 30 days. Not generic advice \u2014 actions that connect to their actual answers, industry, and gaps. Each bullet should be one concrete sentence.\n\nNever reference internal question IDs like CU2, T1, F1, AC1, etc. Reference answers by describing what the user said or the topic, not which question number they answered.\n\nFor What To Do Monday bullets, use this format: a short directive phrase (under 15 words) bolded, then a long dash (\u2014), then the supporting context and rationale. Example: **Rewrite your failure post-mortem** \u2014 take the initiative you described and...\n\nWrite ~500-700 words total. The reader should feel like someone actually read their answers, not like they got a template.';

  const contextStr = buildBriefContext(currentSession, currentResults);

  let streamBuffer = '';
  let currentStreamEl = null; // current text node or span for appending inline text

  function flushLine(line) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      const h = document.createElement(tag);
      h.className = 'brief-section-header';
      h.textContent = headingMatch[2];
      briefContainer.appendChild(h);
      currentStreamEl = null;
    } else if (line.trim()) {
      if (!currentStreamEl || currentStreamEl.tagName !== 'SPAN') {
        currentStreamEl = document.createElement('span');
        currentStreamEl.className = 'brief-chunk';
        briefContainer.appendChild(currentStreamEl);
      }
      currentStreamEl.textContent += line;
    } else {
      // Blank line — start a new text block
      currentStreamEl = null;
    }
  }

  const result = await window.AssessmentAPI.generateExecutiveBrief({
    system: systemPrompt,
    messages: [{ role: 'user', content: contextStr }],
    onChunk: (text) => {
      streamBuffer += text;
      // Process all complete lines (ending with newline)
      const parts = streamBuffer.split('\n');
      // Last element is the incomplete line — keep it in the buffer
      streamBuffer = parts.pop();
      for (const line of parts) {
        flushLine(line);
      }
    },
  });

  // Flush any remaining buffered text
  if (streamBuffer.trim()) {
    flushLine(streamBuffer);
  }

  // Remove loading indicator
  loadingEl.remove();

  // Handle result — re-render with full formatting (lists, bold, etc.)
  if (result && typeof result === 'string') {
    briefContainer.innerHTML = '';
    renderBrief(briefContainer, result);

    // Fire-and-forget: email the brief to the user
    if (session._contactEmail && lastResults) {
      fetch('/api-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'send-brief-email',
          name: session._contactName || '',
          email: session._contactEmail,
          briefHtml: briefContainer.innerHTML,
          verdict: lastResults.verdict,
          bindingConstraint: lastResults.bindingConstraint,
          compositeScore: lastResults.composite,
          layerScores: lastResults.layerScores,
          tasteSignature: lastResults.tasteSignature ? lastResults.tasteSignature.name : null,
          assessmentId: savedRowId || null,
        }),
      }).then(() => {
        const confirmEl = document.createElement('p');
        confirmEl.textContent = `Brief sent to ${session._contactEmail}`;
        confirmEl.style.cssText = 'color:#c8965a;font-size:14px;margin-top:16px;opacity:0;transition:opacity 0.6s ease;';
        briefContainer.parentNode.insertBefore(confirmEl, briefContainer.nextSibling);
        setTimeout(() => { confirmEl.style.opacity = '1'; }, 1000);
      }).catch((err) => {
        console.error('Brief email send failed:', err);
      });
    }
  } else if (result && result.error === 'ip_limit') {
    statusEl.textContent = "You\u2019ve reached the maximum briefs for today. Come back tomorrow.";
    statusEl.classList.remove('hidden');
    briefContainer.classList.add('hidden');
  } else if (result && result.error === 'briefs_at_capacity') {
    statusEl.textContent = 'Executive briefs are at capacity today. Try again tomorrow.';
    statusEl.classList.remove('hidden');
    briefContainer.classList.add('hidden');
  } else {
    statusEl.textContent = 'Brief generation is temporarily unavailable. Your deterministic results above are still fully accurate.';
    statusEl.classList.remove('hidden');
    briefContainer.classList.add('hidden');
  }
  briefStreamActive = false;
}

// ─── Auto-Save ─────────────────────────────────────────

async function autoSaveResults() {
  const timeToComplete = assessmentStartTime
    ? Math.round((Date.now() - assessmentStartTime) / 1000)
    : null;

  const allResponses = {
    pulse: session.pulseAnswers,
    layers: session.layerResponses,
    taste: session.tasteResponses,
    followUps: session.followUpResponses,
  };

  const payload = {
    role_context: session.pulseAnswers.P1 || null,
    industry: session.pulseAnswers.P3 || null,
    maturity_stage: session.pulseAnswers.P2 || null,
    foundation_score: lastResults.layerScores.foundation,
    architecture_score: lastResults.layerScores.architecture,
    accountability_score: lastResults.layerScores.accountability,
    culture_score: lastResults.layerScores.culture,
    taste_signature: lastResults.tasteSignature.name,
    taste_frame_recognition: lastResults.tasteDimensions.frameRecognition,
    taste_kill_discipline: lastResults.tasteDimensions.killDiscipline,
    taste_edge_case_instinct: lastResults.tasteDimensions.edgeCaseInstinct,
    verdict: lastResults.verdict,
    composite_score: lastResults.composite,
    binding_constraint: lastResults.bindingConstraint,
    all_responses: allResponses,
    time_to_complete_seconds: timeToComplete,
  };

  try {
    const res = await fetch('/api/submit-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      savedRowId = data.id || null;
    }
  } catch (err) {
    // Silent fail — anonymous save is best-effort
  }

  // If email was captured pre-results, update D1 row and send email
  if (session._capturedEmail) {
    const email = session._capturedEmail;

    // Update D1 row with email
    if (savedRowId) {
      try {
        await fetch('/api/submit-assessment', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedRowId, email }),
        });
      } catch { /* silent */ }
    }

    // Send results email via Resend
    const plan = lastResults.actionPlan;
    const actions = [
      plan.rightNow,
      ...(plan.thisWeek || []),
      plan.thisMonth,
    ].filter(Boolean);

    const resultsData = {
      verdict: lastResults.verdict,
      composite: lastResults.composite,
      bindingConstraint: lastResults.bindingConstraint,
      layerScores: lastResults.layerScores,
      tasteSignature: lastResults.tasteSignature ? lastResults.tasteSignature.name : null,
      actions,
    };

    try {
      await fetch('/api-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'send-results', email, results: resultsData }),
      });
    } catch { /* silent */ }
  }
}

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
})();
