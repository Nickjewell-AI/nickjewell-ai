// Central selector registry — change here, fixes everywhere
export const SEL = {
  // Intro
  startBtn: '#start-btn',
  introSection: '#assessment-intro',

  // Active assessment
  activeSection: '#assessment-active',
  assessmentFlow: '#assessment-flow',
  progressFill: '#progress-fill',
  tierLabel: '#tier-label',

  // Question elements (dynamically created)
  questionCard: '.question-card',
  moduleCard: '.module-card',
  moduleQuestion: '.module-question',
  questionLabel: '.question-label',
  questionText: '.question-text',
  optionButton: '.option-button',
  optionKey: '.option-key',
  optionText: '.option-text',
  optionsSelected: '.option-button.selected',

  // Taste
  tasteReasoningOptions: '.taste-reasoning-options',
  tasteReasoningBtn: '.taste-reasoning-btn',
  postTastePrompt: '.post-taste-prompt',
  postTasteTextarea: '.post-taste-textarea',
  postTasteSkip: '.post-taste-skip',
  postTasteSubmit: '.post-taste-submit',

  // CU2 free text
  cu2FreeText: '.cu2-freetext',
  cu2Skip: '.cu2-skip',

  // Results
  resultsSection: '#assessment-results',
  verdictBadge: '#verdict-badge',
  verdictLabel: '#verdict-label',
  verdictScore: '#verdict-score',
  verdictSummary: '#verdict-summary',
  layerBars: '#layer-bars',
  tasteName: '#taste-name',
  tasteScore: '#taste-score',
  tasteDescription: '#taste-description',
  tasteCharacterization: '#taste-characterization',
  dimFrameVal: '#dim-frame-val',
  dimKillVal: '#dim-kill-val',
  dimEdgeVal: '#dim-edge-val',
  constraintTitle: '#constraint-title',
  constraintText: '#constraint-text',
  actionsList: '#actions-list',

  // Brief
  briefSection: '#executive-brief-section',
  briefForm: '#brief-contact-form',
  briefName: '#brief-name',
  briefEmail: '#brief-email',
  briefCompany: '#brief-company',
  briefRole: '#brief-role',
  briefFocus: '#brief-focus',
  briefSubmit: '.brief-contact-submit',
  briefStatus: '.brief-status',
  briefTextContainer: '.brief-text-container',
  briefStickyCta: '#brief-sticky-cta',

  // Feedback widget (class names match #feedback-card in assessment/index.html)
  feedbackSentiment: '.feedback-card-btn',
  feedbackText: '.feedback-card-textarea',
  feedbackSubmit: '.feedback-card-submit',

  // Substack CTA
  substackCta: '.substack-cta',

  // Retake
  retakeBtn: '#retake-btn',

  // Nav
  footerNav: '.footer-nav',
  navLinks: '.nav-links',
  navHamburger: '.nav-hamburger',
};
