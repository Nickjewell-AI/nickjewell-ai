// assessment-ui.js — Conversational assessment interface
(function() {
const {
  createSession,
  getNextQuestion,
  recordAnswer,
  recordFollowUp,
  recordTasteReasoning,
  computeResults,
  getTotalQuestions,
  getAnsweredCount,
  TASTE_REASONING,
} = window.AssessmentEngine;

const LAYER_NAMES = {
  foundation: 'Foundation',
  architecture: 'Architecture',
  accountability: 'Accountability',
  culture: 'Culture',
};

let session;
let container;
let progressBar;
let progressText;
let tierLabel;
let assessmentStartTime;
let lastResults;
let savedRowId = null;

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
  progressText.textContent = `${answered} of ${total}`;
}

function showNextQuestion() {
  const question = getNextQuestion(session);

  if (!question) {
    showResults();
    return;
  }

  // Update tier label
  let label = question.tierLabel;
  if (question.layerLabel) label += ' — ' + question.layerLabel;
  tierLabel.textContent = label;
  updateProgress();

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

  let selectedOption = null;
  let selectedBtn = null;
  let advanceTimer = null;
  let locked = false;

  question.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-button';
    btn.innerHTML = `<span class="option-key">${opt.key}</span><span class="option-text">${opt.text}</span>`;
    btn.addEventListener('click', () => {
      if (locked) return;
      // Double-click same option — advance immediately
      if (selectedBtn === btn) {
        if (advanceTimer) clearTimeout(advanceTimer);
        locked = true;
        handleAnswer(card, question, selectedOption, options);
        return;
      }
      selectedOption = opt;
      selectedBtn = btn;
      // Update highlight — clear all, then mark this one
      options.querySelectorAll('.option-button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      // Start 3-second advance timer; resets if a different option is clicked
      if (advanceTimer) clearTimeout(advanceTimer);
      advanceTimer = setTimeout(() => {
        locked = true;
        handleAnswer(card, question, selectedOption, options);
      }, 3000);
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

  let selectedFuOpt = null;
  let selectedFuBtn = null;
  let fuAdvanceTimer = null;
  let fuLocked = false;

  function commitFollowUp() {
    fuLocked = true;

    // Disable all follow-up buttons
    const fuButtons = fuOptions.querySelectorAll('.option-button');
    fuButtons.forEach((b) => { b.disabled = true; b.classList.add('disabled'); });

    // Record follow-up
    recordFollowUp(session, fu.id, selectedFuOpt.key, parentQuestion.id, selectedFuOpt.effect, selectedFuOpt.newScore);

    // Show follow-up insight if applicable
    const fuInsightKey = 'insightOn' + selectedFuOpt.key;
    if (fu[fuInsightKey]) {
      const insight = document.createElement('div');
      insight.className = 'question-insight fade-in';
      insight.textContent = fu[fuInsightKey];
      fuCard.appendChild(insight);
      requestAnimationFrame(() => insight.classList.add('visible'));
    }

    setTimeout(() => showNextQuestion(), 400);
  }

  fu.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-button follow-up-option';
    btn.innerHTML = `<span class="option-key">${opt.key}</span><span class="option-text">${opt.text}</span>`;
    btn.addEventListener('click', () => {
      if (fuLocked) return;
      // Double-click same option — advance immediately
      if (selectedFuBtn === btn) {
        if (fuAdvanceTimer) clearTimeout(fuAdvanceTimer);
        commitFollowUp();
        return;
      }
      selectedFuOpt = opt;
      selectedFuBtn = btn;
      fuOptions.querySelectorAll('.option-button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      // Start 3-second advance timer; resets if a different option is clicked
      if (fuAdvanceTimer) clearTimeout(fuAdvanceTimer);
      fuAdvanceTimer = setTimeout(() => {
        commitFollowUp();
      }, 3000);
    });
    fuOptions.appendChild(btn);
  });

  fuCard.appendChild(fuText);
  fuCard.appendChild(fuOptions);
  parentCard.appendChild(fuCard);
  requestAnimationFrame(() => fuCard.classList.add('visible'));
}

function showTasteReasoning(parentCard, parentQuestion, selectedOption) {
  const reasoning = TASTE_REASONING[parentQuestion.id];

  const fuCard = document.createElement('div');
  fuCard.className = 'follow-up-card fade-in';

  const fuText = document.createElement('div');
  fuText.className = 'follow-up-text';
  fuText.textContent = reasoning.prompt;

  const fuOptions = document.createElement('div');
  fuOptions.className = 'options-list';

  let selectedRBtn = null;
  let selectedROpt = null;
  let rAdvanceTimer = null;
  let rLocked = false;

  function commitReasoning() {
    rLocked = true;
    fuOptions.querySelectorAll('.option-button').forEach((b) => { b.disabled = true; b.classList.add('disabled'); });
    recordTasteReasoning(session, parentQuestion.id, selectedROpt.key);
    setTimeout(() => showNextQuestion(), 400);
  }

  reasoning.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-button follow-up-option';
    btn.innerHTML = `<span class="option-key">${opt.key}</span><span class="option-text">${opt.text}</span>`;
    btn.addEventListener('click', () => {
      if (rLocked) return;
      if (selectedRBtn === btn) {
        if (rAdvanceTimer) clearTimeout(rAdvanceTimer);
        commitReasoning();
        return;
      }
      selectedROpt = opt;
      selectedRBtn = btn;
      fuOptions.querySelectorAll('.option-button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (rAdvanceTimer) clearTimeout(rAdvanceTimer);
      rAdvanceTimer = setTimeout(() => commitReasoning(), 3000);
    });
    fuOptions.appendChild(btn);
  });

  fuCard.appendChild(fuText);
  fuCard.appendChild(fuOptions);

  // "Tell us more" free-text link
  const tellMore = document.createElement('a');
  tellMore.href = '#';
  tellMore.className = 'tell-us-more-link';
  tellMore.textContent = 'Tell us more \u2192';
  tellMore.addEventListener('click', (e) => {
    e.preventDefault();
    tellMore.style.display = 'none';
    freeTextWrap.classList.remove('hidden');
  });

  const freeTextWrap = document.createElement('div');
  freeTextWrap.className = 'taste-freetext-wrap hidden';

  const textarea = document.createElement('textarea');
  textarea.className = 'taste-freetext';
  textarea.placeholder = 'What else shaped your thinking? (optional)';
  textarea.rows = 3;

  const submitBtn = document.createElement('button');
  submitBtn.className = 'taste-freetext-submit';
  submitBtn.textContent = 'Submit';
  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing\u2026';
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

  // Not-assessed note
  const notAssessed = layers.filter((l) => results.layerScores[l] === null);
  const noteEl = document.getElementById('assessed-note');
  if (notAssessed.length > 0) {
    noteEl.textContent = `Layers not assessed in this session: ${notAssessed.map((l) => LAYER_NAMES[l]).join(', ')}. A full assessment would evaluate all layers for a complete picture.`;
    noteEl.classList.remove('hidden');
  }

  // Retake button
  document.getElementById('retake-btn').addEventListener('click', () => {
    resultsEl.classList.add('hidden');
    container.innerHTML = '';
    document.getElementById('assessment-intro').classList.remove('hidden');
    session = createSession();
  });

  // Auto-save anonymous results
  autoSaveResults();

  // Save & Share form — updates row with optional contact info
  const saveForm = document.getElementById('save-share-form');
  if (saveForm) {
    saveForm.addEventListener('submit', handleContactSubmit);
  }

  // Stagger fade-in of result sections
  const sections = resultsEl.querySelectorAll('.result-section');
  sections.forEach((sec, i) => {
    sec.classList.add('fade-in');
    setTimeout(() => sec.classList.add('visible'), 200 + i * 250);
  });
}

// ─── Auto-Save & Contact Update ─────────────────────────

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
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('save-btn');
  const status = document.getElementById('save-status');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  status.classList.add('hidden');

  const name = document.getElementById('save-name').value.trim() || null;
  const email = document.getElementById('save-email').value.trim() || null;
  const company = document.getElementById('save-company').value.trim() || null;

  if (!name && !email && !company) {
    status.textContent = 'Enter at least one field to save.';
    status.className = 'save-status error';
    status.classList.remove('hidden');
    btn.textContent = 'Submit';
    btn.disabled = false;
    return;
  }

  try {
    const res = await fetch('/api/submit-assessment', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: savedRowId, name, email, company }),
    });

    if (res.ok) {
      status.textContent = 'Thanks! Your info has been saved.';
      status.className = 'save-status success';
      btn.textContent = 'Submitted';
    } else {
      throw new Error('Update failed');
    }
  } catch (err) {
    status.textContent = 'Could not save. Your assessment results are already recorded.';
    status.className = 'save-status error';
    btn.textContent = 'Submit';
    btn.disabled = false;
  }
  status.classList.remove('hidden');
}

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
})();
