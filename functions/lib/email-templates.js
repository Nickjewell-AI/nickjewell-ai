// functions/lib/email-templates.js — Email templates for the Jewell Assessment
// All email templates live here. Future email types (Day 3, Day 7) added as exports.

const LAYER_NAMES = {
  foundation: 'Foundation',
  architecture: 'Architecture',
  accountability: 'Accountability',
  culture: 'Culture',
};

const VERDICT_COLORS = {
  Green: '#2d8a4e',
  Amber: '#722F37',
  Red: '#c44536',
};

function scoreBarColor(score) {
  if (score >= 70) return '#2d8a4e';
  if (score >= 40) return '#722F37';
  return '#c44536';
}

function buildLayerBar(name, score, isConstraint) {
  const barColor = scoreBarColor(score != null ? score : 0);
  const filled = score != null ? score : 0;
  const constraintLabel = isConstraint
    ? ` <span style="color:#722F37;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">&mdash; BINDING CONSTRAINT</span>`
    : '';
  return `<tr>
    <td style="padding:5px 0;color:#1a1a1a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;width:140px;">${name}${constraintLabel}</td>
    <td style="padding:5px 8px;width:auto;">
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="background:${barColor};height:8px;border-radius:4px 0 0 4px;width:${filled}%;"></td>
          <td style="background:#e8e5e0;height:8px;border-radius:0 4px 4px 0;width:${100 - filled}%;"></td>
        </tr>
      </table>
    </td>
    <td style="padding:5px 0;color:#6b6560;font-size:13px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap;text-align:right;width:40px;">${score != null ? score : 'N/A'}</td>
  </tr>`;
}

/**
 * Build the executive brief email HTML.
 * @param {Object} data
 * @param {string} data.firstName
 * @param {string} data.email
 * @param {string} data.briefHtml - rendered brief content
 * @param {string} data.verdict - Green/Amber/Red
 * @param {string} data.bindingConstraint - layer key
 * @param {number} data.compositeScore
 * @param {Object} data.layerScores - { foundation, architecture, accountability, culture }
 * @param {string} data.tasteSignature
 * @param {number|null} data.benchmarkPercentile
 */
export function buildBriefEmail(data) {
  const {
    firstName,
    briefHtml,
    verdict,
    bindingConstraint,
    compositeScore,
    layerScores = {},
    tasteSignature,
    benchmarkPercentile,
    assessmentId,
  } = data;

  const shareUrl = assessmentId
    ? `https://www.nickjewell.ai/assessment?ref=${assessmentId}`
    : 'https://www.nickjewell.ai/assessment';
  const shareUrlDisplay = assessmentId
    ? `nickjewell.ai/assessment?ref=${assessmentId}`
    : 'nickjewell.ai/assessment';

  const verdictColor = VERDICT_COLORS[verdict] || '#722F37';
  const constraintName = LAYER_NAMES[bindingConstraint] || bindingConstraint || 'Unknown';
  const greeting = firstName
    ? `Here's your executive brief, ${firstName}.`
    : "Here's your executive brief.";

  // Preheader text
  const preheader = `Your binding constraint is ${constraintName}. Here's what to do about it.`;
  // Pad preheader so email clients don't pull body text into preview
  const preheaderPad = '&nbsp;'.repeat(80);

  // Layer bars
  const layerBars = Object.entries(LAYER_NAMES)
    .map(([key, name]) => buildLayerBar(name, layerScores[key], key === bindingConstraint))
    .join('');

  // Find strongest layer for benchmark line
  let strongestLayer = '';
  if (benchmarkPercentile != null) {
    let maxScore = -1;
    for (const [key, score] of Object.entries(layerScores)) {
      if (score != null && score > maxScore) {
        maxScore = score;
        strongestLayer = LAYER_NAMES[key] || key;
      }
    }
  }

  const benchmarkLine = benchmarkPercentile != null && strongestLayer
    ? `<p style="color:#6b6560;font-size:13px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:12px 0 0;font-style:italic;">You scored higher than ${benchmarkPercentile}% of respondents on ${strongestLayer}.</p>`
    : '';

  // Share copy for team distribution CTA
  const shareCopy = `I just took an AI readiness diagnostic that was surprisingly sharp. It identified ${constraintName} as our biggest gap. Worth 5 minutes: ${shareUrl}`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}${preheaderPad}</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf8;padding:0 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="padding:32px 0 24px;">
    <p style="color:#722F37;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;margin:0;">Jewell Assessment</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding-bottom:24px;">
    <p style="color:#1a1a1a;font-size:16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;line-height:1.5;">${greeting}</p>
  </td></tr>

  <!-- Score Snapshot Card -->
  <tr><td style="padding-bottom:28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eeeb;border:1px solid #e0ddd8;border-radius:4px;">
      <tr><td style="padding:20px;">

        <!-- Verdict Badge -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="width:12px;height:12px;border-radius:50%;background:${verdictColor};"></td>
            <td style="padding-left:8px;color:${verdictColor};font-size:16px;font-weight:700;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:0.04em;">${(verdict || '').toUpperCase()}</td>
            <td style="padding-left:12px;color:#1a1a1a;font-size:16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">${compositeScore != null ? compositeScore + '/100' : ''}</td>
          </tr>
        </table>

        <!-- Layer Bars -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">${layerBars}</table>

        <!-- Taste Signature -->
        <p style="color:#6b6560;font-size:13px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;">Taste Signature: <span style="color:#1a1a1a;font-weight:600;">${tasteSignature || 'N/A'}</span></p>

        ${benchmarkLine}

      </td></tr>
    </table>
  </td></tr>

  <!-- Brief Content -->
  <tr><td style="padding:24px 0;color:#1a1a1a;font-size:15px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.6;">
    ${inlineStyleBriefHtml(briefHtml)}
  </td></tr>

  <!-- Primary CTA: Micro-feedback -->
  <tr><td style="padding-bottom:28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #722F37;border-radius:4px;background:#faf8f5;">
      <tr><td style="padding:20px;">
        <p style="color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0 0 8px;line-height:1.4;">One question: What's the first thing you're going to do differently?</p>
        <p style="color:#6b6560;font-size:13px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;font-style:italic;">Just reply to this email &mdash; it comes directly to me.</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Secondary CTA: Team Distribution -->
  <tr><td style="padding-bottom:24px;">
    <p style="color:#1a1a1a;font-size:15px;font-weight:700;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0 0 12px;">Have your leadership team take the assessment</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eeeb;border-radius:4px;">
      <tr><td style="padding:16px;color:#1a1a1a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.5;font-style:italic;">
        &ldquo;${shareCopy}&rdquo;
      </td></tr>
    </table>
    <p style="margin:10px 0 0;"><a href="${shareUrl}" style="color:#722F37;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-decoration:none;">Share the assessment &rarr; ${shareUrlDisplay}</a></p>
  </td></tr>

  <!-- Tertiary CTA: Framework Deep Dive -->
  <tr><td style="padding-bottom:28px;">
    <a href="https://www.nickjewell.ai/framework/#${bindingConstraint || ''}" style="color:#722F37;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-decoration:none;">Deep dive: Why ${constraintName} breaks AI initiatives &rarr;</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid #e0ddd8;padding-top:20px;">
    <p style="color:#1a1a1a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0 0 6px;">Each issue picks apart one constraint — and tells you what to do about it right now.</p>
    <p style="margin:0 0 16px;"><a href="https://nickjewellai.substack.com" style="color:#722F37;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-decoration:none;">The Binding Constr(ai)nt &rarr;</a></p>
    <p style="color:#6b6560;font-size:12px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;">nickjewell.ai</p>
  </td></tr>

  <!-- Bottom padding -->
  <tr><td style="height:40px;"></td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/**
 * Apply inline styles to brief HTML headings and body text for email rendering.
 * Email clients strip <style> tags, so all styling must be inline.
 */
function inlineStyleBriefHtml(html) {
  if (!html) return '';
  return html
    .replace(/<h2([^>]*)>/gi, '<h2$1 style="color:#722F37;font-family:Georgia,\'Times New Roman\',serif;font-size:20px;font-weight:600;margin:28px 0 10px;">')
    .replace(/<h3([^>]*)>/gi, '<h3$1 style="color:#722F37;font-family:Georgia,\'Times New Roman\',serif;font-size:17px;font-weight:600;margin:24px 0 8px;">')
    .replace(/<h4([^>]*)>/gi, '<h4$1 style="color:#722F37;font-family:Georgia,\'Times New Roman\',serif;font-size:15px;font-weight:600;margin:20px 0 8px;">')
    .replace(/<p([^>]*)>/gi, '<p$1 style="color:#1a1a1a;font-size:15px;line-height:1.6;margin:0 0 12px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;">')
    .replace(/<li([^>]*)>/gi, '<li$1 style="color:#1a1a1a;font-size:15px;line-height:1.6;margin-bottom:8px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;">')
    .replace(/<strong([^>]*)>/gi, '<strong$1 style="color:#1a1a1a;font-weight:700;">')
    .replace(/<ul([^>]*)>/gi, '<ul$1 style="padding-left:20px;margin:0 0 12px;">')
    .replace(/<ol([^>]*)>/gi, '<ol$1 style="padding-left:20px;margin:0 0 12px;">');
}
