// Scheduled Brief Generation Worker
// Standalone Cloudflare Worker — runs on cron, picks up pending briefs from D1,
// generates via Opus, emails via Resend.
//
// D1 TABLES AND COLUMNS USED (from D1_Schema_Reference.md):
//   assessment_results: id, name, email, verdict, composite_score, binding_constraint,
//     foundation_score, architecture_score, accountability_score, culture_score,
//     taste_signature, industry, brief_email_status, brief_request_payload
//   email_log: assessment_id, recipient_email, recipient_name, email_type, subject,
//     resend_id, status, metadata
//
// CRITICAL: Table is brief_ip_counter NOT brief_counter.
//   Column is timestamp NOT created_at. There is NO brief_generated column.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// ─── BRIEF PROMPTS ──────────────────────────────────────
// SYNCED FROM: functions/lib/brief-prompts.js — update both

const BASE_SYSTEM_PROMPT = 'You are a senior AI implementation strategist writing a personalized executive brief for the Jewell Assessment. Write in first-person plural (\u201cwe\u201d) as if you are the assessment delivering findings. Be direct, specific, and constructive \u2014 like a $500/hour consultant who respects the reader\u2019s time.\n\nUse this exact structure with markdown headers:\n\n## Verdict Context\n2-3 sentences on what the overall verdict means for THIS specific organization given their industry, role, and maturity stage.\n\n## The Real Story\nOne paragraph on what the pattern of their answers reveals \u2014 not just the scores, but what their specific combination of strengths and gaps means in practice. Reference specific answers where they are revealing.\n\n## Taste Read\n2-3 sentences on what their Taste signature and dimensional profile says about how they make decisions. Be specific to their FR/KD/EC scores.\n\n## The Binding Constraint\nOne paragraph on why their weakest layer is the bottleneck, what failure mode it creates, and why fixing other things first is wasted effort.\n\n## What To Do Monday\nThree bullet points with ultra-specific actions for the next 30 days. Not generic advice \u2014 actions that connect to their actual answers, industry, and gaps. Each bullet should be one concrete sentence.\n\nNever reference internal question IDs like CU2, T1, F1, AC1, etc. Reference answers by describing what the user said or the topic, not which question number they answered.\n\nFor What To Do Monday bullets, use this format: a short directive phrase (under 15 words) bolded, then a long dash (\u2014), then the supporting context and rationale. Example: **Rewrite your failure post-mortem** \u2014 take the initiative you described and...\n\nWrite ~500-700 words total. The reader should feel like someone actually read their answers, not like they got a template.';

const INDUSTRY_CONDITIONING = {
  B: "The user works in healthcare. Reference clinical workflows, patient outcomes, EMR/EHR systems, and regulatory requirements. Use healthcare-specific examples: clinical decision support, patient intake automation, coding and billing optimization. Acknowledge that patient safety is the non-negotiable constraint. For small organizations, reference practice management tools and patient portals. For large organizations, reference health system governance structures and cross-department coordination.",
  A: "The user works in financial services. Reference client data, transaction processing, compliance and regulatory requirements. Use industry-specific examples: client onboarding automation, fraud detection, portfolio analytics, compliance monitoring. Acknowledge that regulatory compliance and client trust are non-negotiable constraints. For small organizations, reference CRM tools and automated reporting. For large organizations, reference enterprise risk frameworks and multi-business-line coordination.",
  C: "The user works in technology. Reference product development, engineering workflows, data infrastructure. Use industry-specific examples: AI-powered product features, developer productivity, automated testing, churn prediction. This audience likely has higher baseline AI literacy \u2014 focus on implementation specifics and architectural decisions rather than explaining concepts. For small organizations, reference API integrations and lean experimentation. For large organizations, reference platform teams and cross-team coordination.",
  F: "The user works in professional services. Reference client deliverables, utilization metrics, knowledge management, and partner autonomy. Use industry-specific examples: proposal automation, research synthesis, document review, engagement staffing optimization. Acknowledge the irony that many professional services firms advise on AI but haven't adopted it internally. For small firms, reference tools that augment individual consultants. For large firms, reference methodology standardization and cross-practice knowledge sharing.",
  D: "The user works in manufacturing. Reference production workflows, quality systems, supply chain, and operational stability. Use industry-specific examples: predictive maintenance, quality inspection automation, demand forecasting, production scheduling. Acknowledge that production uptime is the non-negotiable constraint. For small operations, reference tools that augment existing operators. For large operations, reference plant-level vs. corporate coordination and multi-site rollout.",
};

const SIZE_CONDITIONING = {
  A: "The user's organization has under 50 people. Actions must be executable by one person with no dedicated AI or IT staff. Reference specific free or low-cost tools by name (Google Sheets, ChatGPT, Notion AI, Zapier). Actions should sound like something one person could do this week. Assume no budget unless they create it. The decision-maker is also the implementer.",
  B: "The user's organization has 50-500 people. Assume a small technology or operations team that is stretched thin. Recommendations can include affordable SaaS tools but not enterprise platforms. The reader likely wears multiple hats. Frame actions as 'assign one person to own this' not 'build a team.'",
  C: "The user's organization has 500-2,000 people. Assume functional departments exist but may not have AI-specific roles. Recommendations can include vendor evaluations and pilot programs. The reader is likely a director or VP who needs to build a business case. Frame actions as initiatives with timelines and owners.",
  D: "The user's organization has 2,000-10,000 people. Actions should address organizational complexity \u2014 multiple stakeholders, change management, governance. Recommendations can include dedicated hires and platform investments. Frame actions as strategic moves with organizational implications.",
  E: "The user's organization has 10,000+ people. Actions should assume existing bureaucracy, procurement processes, and political dynamics. Address enterprise challenges: siloed data, competing AI initiatives, vendor management, regulatory compliance at scale. Frame actions as executive decisions.",
};

function buildSystemPrompt(industryKey, sizeKey) {
  let conditioning = '';
  if (SIZE_CONDITIONING[sizeKey]) conditioning += '\n\n' + SIZE_CONDITIONING[sizeKey];
  if (INDUSTRY_CONDITIONING[industryKey]) conditioning += '\n\n' + INDUSTRY_CONDITIONING[industryKey];
  return BASE_SYSTEM_PROMPT + conditioning;
}

const TEST_BRIEF_MARKDOWN = `## Verdict Context

Your organization scored in the Amber range, which means the building blocks for AI adoption exist but critical gaps remain. Given your industry and maturity stage, this is a common \u2014 and fixable \u2014 position.

## The Real Story

The pattern across your answers reveals an organization that understands the potential of AI but hasn't yet built the operational infrastructure to capture that potential reliably. Your strongest layers show genuine strategic thinking, but the gap in your binding constraint is creating a bottleneck that limits everything downstream.

## Taste Read

Your Taste signature reveals a decision-making style that balances pragmatism with analytical rigor. Your frame recognition and kill discipline scores suggest you can identify the right problems to solve \u2014 but edge case handling indicates you may underweight implementation risks when momentum is high.

## The Binding Constraint

Your weakest layer is acting as a structural bottleneck. Until this is addressed, investments in other layers will deliver diminishing returns. The failure mode here is predictable: initiatives launch with enthusiasm, hit the constraint wall, and stall \u2014 creating organizational scar tissue that makes the next attempt harder.

## What To Do Monday

- **Audit your constraint layer this week** \u2014 map every process that touches your binding constraint and identify the three highest-friction points. You likely already know what they are.
- **Assign a single owner for AI governance** \u2014 the gap between your strongest and weakest layers suggests distributed responsibility with no clear accountability. One person, one mandate, one quarterly review.
- **Kill one active initiative that isn't working** \u2014 your scores suggest you're spreading effort across too many fronts. Pick the one with the worst ratio of investment to outcome and redirect those resources to your constraint.`;

// ─── EMAIL TEMPLATE ─────────────────────────────────────
// SYNCED FROM: functions/lib/email-templates.js — update both

const LAYER_NAMES = {
  foundation: 'Foundation',
  architecture: 'Architecture',
  accountability: 'Accountability',
  culture: 'Culture',
};

const VERDICT_COLORS = {
  Green: '#2d8a4e',
  Amber: '#c8965a',
  Red: '#c44536',
};

function scoreBarColor(score) {
  if (score >= 70) return '#2d8a4e';
  if (score >= 40) return '#c8965a';
  return '#c44536';
}

function buildLayerBar(name, score, isConstraint) {
  const barColor = scoreBarColor(score != null ? score : 0);
  const filled = score != null ? score : 0;
  const constraintLabel = isConstraint
    ? ` <span style="color:#c8965a;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">&mdash; BINDING CONSTRAINT</span>`
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

function inlineStyleBriefHtml(html) {
  if (!html) return '';
  return html
    .replace(/<h2([^>]*)>/gi, '<h2$1 style="color:#c8965a;font-family:Georgia,\'Times New Roman\',serif;font-size:20px;font-weight:600;margin:28px 0 10px;">')
    .replace(/<h3([^>]*)>/gi, '<h3$1 style="color:#c8965a;font-family:Georgia,\'Times New Roman\',serif;font-size:17px;font-weight:600;margin:24px 0 8px;">')
    .replace(/<h4([^>]*)>/gi, '<h4$1 style="color:#c8965a;font-family:Georgia,\'Times New Roman\',serif;font-size:15px;font-weight:600;margin:20px 0 8px;">')
    .replace(/<p([^>]*)>/gi, '<p$1 style="color:#1a1a1a;font-size:15px;line-height:1.6;margin:0 0 12px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;">')
    .replace(/<li([^>]*)>/gi, '<li$1 style="color:#1a1a1a;font-size:15px;line-height:1.6;margin-bottom:8px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;">')
    .replace(/<strong([^>]*)>/gi, '<strong$1 style="color:#1a1a1a;font-weight:700;">')
    .replace(/<ul([^>]*)>/gi, '<ul$1 style="padding-left:20px;margin:0 0 12px;">')
    .replace(/<ol([^>]*)>/gi, '<ol$1 style="padding-left:20px;margin:0 0 12px;">');
}

function buildBriefEmail(data) {
  const {
    firstName, briefHtml, verdict, bindingConstraint,
    compositeScore, layerScores = {}, tasteSignature, benchmarkPercentile,
  } = data;

  const verdictColor = VERDICT_COLORS[verdict] || '#c8965a';
  const constraintName = LAYER_NAMES[bindingConstraint] || bindingConstraint || 'Unknown';
  const greeting = firstName
    ? `Here's your executive brief, ${firstName}.`
    : "Here's your executive brief.";

  const preheader = `Your binding constraint is ${constraintName}. Here's what to do about it.`;
  const preheaderPad = '&nbsp;'.repeat(80);

  const layerBars = Object.entries(LAYER_NAMES)
    .map(([key, name]) => buildLayerBar(name, layerScores[key], key === bindingConstraint))
    .join('');

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

  const shareCopy = `I just took an AI readiness diagnostic that was surprisingly sharp. It identified ${constraintName} as our biggest gap. Worth 5 minutes: nickjewell.ai/assessment`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}${preheaderPad}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf8;padding:0 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="padding:32px 0 24px;"><p style="color:#c8965a;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;margin:0;">Jewell Assessment</p></td></tr>
  <tr><td style="padding-bottom:24px;"><p style="color:#1a1a1a;font-size:16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;line-height:1.5;">${greeting}</p></td></tr>
  <tr><td style="padding-bottom:28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eeeb;border:1px solid #e0ddd8;border-radius:4px;">
      <tr><td style="padding:20px;">
        <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
          <td style="width:12px;height:12px;border-radius:50%;background:${verdictColor};"></td>
          <td style="padding-left:8px;color:${verdictColor};font-size:16px;font-weight:700;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:0.04em;">${(verdict || '').toUpperCase()}</td>
          <td style="padding-left:12px;color:#1a1a1a;font-size:16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">${compositeScore != null ? compositeScore + '/100' : ''}</td>
        </tr></table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">${layerBars}</table>
        <p style="color:#6b6560;font-size:13px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;">Taste Signature: <span style="color:#1a1a1a;font-weight:600;">${tasteSignature || 'N/A'}</span></p>
        ${benchmarkLine}
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 0;color:#1a1a1a;font-size:15px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.6;">${inlineStyleBriefHtml(briefHtml)}</td></tr>
  <tr><td style="padding-bottom:28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #c8965a;border-radius:4px;background:#faf8f5;">
      <tr><td style="padding:20px;">
        <p style="color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0 0 8px;line-height:1.4;">One question: What's the first thing you're going to do differently?</p>
        <p style="color:#6b6560;font-size:13px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;font-style:italic;">Just reply to this email &mdash; it comes directly to me.</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding-bottom:24px;">
    <p style="color:#1a1a1a;font-size:15px;font-weight:700;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0 0 12px;">Have your leadership team take the assessment</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eeeb;border-radius:4px;">
      <tr><td style="padding:16px;color:#1a1a1a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.5;font-style:italic;">&ldquo;${shareCopy}&rdquo;</td></tr>
    </table>
    <p style="margin:10px 0 0;"><a href="https://www.nickjewell.ai/assessment" style="color:#c8965a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-decoration:none;">Share the assessment &rarr; nickjewell.ai/assessment</a></p>
  </td></tr>
  <tr><td style="padding-bottom:28px;"><a href="https://www.nickjewell.ai/framework/#${bindingConstraint || ''}" style="color:#c8965a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-decoration:none;">Deep dive: Why ${constraintName} breaks AI initiatives &rarr;</a></td></tr>
  <tr><td style="border-top:1px solid #e0ddd8;padding-top:20px;">
    <p style="color:#1a1a1a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0 0 6px;">Each issue picks apart one constraint — and tells you what to do about it right now.</p>
    <p style="margin:0 0 16px;"><a href="https://nickjewellai.substack.com" style="color:#c8965a;font-size:14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;text-decoration:none;">The Binding Constr(ai)nt &rarr;</a></p>
    <p style="color:#6b6560;font-size:12px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;">nickjewell.ai</p>
  </td></tr>
  <tr><td style="height:40px;"></td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ─── HELPERS ────────────────────────────────────────────

function markdownToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      if (inList) { html += '</ul>'; inList = false; }
      const tag = headingMatch[1].length === 1 ? 'h2' : headingMatch[1].length === 2 ? 'h3' : 'h4';
      html += `<${tag}>${headingMatch[2]}</${tag}>`;
      continue;
    }
    if (/^\s*[-*]\s+/.test(trimmed)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${trimmed.replace(/^\s*[-*]\s+/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`;
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

async function sendEmail(env, payload) {
  if (env.TEST_MODE === 'true') {
    console.log('TEST_MODE: skipping Resend, mock email to', payload.to);
    return { ok: true, id: 'test_mock_' + Date.now(), testMock: true };
  }

  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, error: 'RESEND_API_KEY not set' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: `Resend API ${res.status}: ${errText}` };
  }

  let resendId = null;
  try { resendId = (await res.json()).id || null; } catch {}
  return { ok: true, id: resendId };
}

// ─── CORE LOGIC ─────────────────────────────────────────

async function processPendingBrief(env) {
  const db = env.DB;
  if (!db) return { processed: false, error: 'DB not bound' };

  // 1. Pick up one pending record
  const row = await db.prepare(`
    SELECT id, name, email, verdict, composite_score, binding_constraint,
      foundation_score, architecture_score, accountability_score, culture_score,
      taste_signature, industry, brief_email_status, brief_request_payload
    FROM assessment_results
    WHERE brief_email_status = 'pending' AND brief_request_payload IS NOT NULL
    ORDER BY id ASC LIMIT 1
  `).first();

  if (!row) return { processed: false, reason: 'no-pending' };

  const assessmentId = row.id;

  try {
    // 2. Parse payload
    const payload = JSON.parse(row.brief_request_payload);
    const {
      briefContext, industryKey, sizeKey, constraintExplanation,
      actionPlan, benchmarkPercentile, tasteSignature, tasteDimensions, layerScores,
    } = payload;

    // 3. Generate brief
    let briefMarkdown;
    if (env.TEST_MODE === 'true') {
      briefMarkdown = TEST_BRIEF_MARKDOWN;
    } else {
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

      const systemPrompt = buildSystemPrompt(industryKey, sizeKey);

      const anthropicRes = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: briefContext }],
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        throw new Error(`Anthropic API ${anthropicRes.status}: ${errText.slice(0, 150)}`);
      }

      const data = await anthropicRes.json();
      briefMarkdown = data.content?.[0]?.text;
      if (!briefMarkdown) throw new Error('Empty response from Anthropic');
    }

    // 4. Convert markdown to HTML
    const briefHtml = markdownToHtml(briefMarkdown);

    // 5. Compute benchmark percentile (best-effort)
    let computedPercentile = benchmarkPercentile;
    if (computedPercentile == null && layerScores) {
      try {
        let strongestKey = null;
        let maxScore = -1;
        for (const [key, score] of Object.entries(layerScores)) {
          if (score != null && score > maxScore) {
            maxScore = score;
            strongestKey = key;
          }
        }
        if (strongestKey && maxScore >= 0) {
          const col = strongestKey + '_score';
          const belowRow = await db.prepare(
            `SELECT COUNT(*) as below FROM assessment_results WHERE ${col} < ?`
          ).bind(maxScore).first();
          const totalRow = await db.prepare(
            'SELECT COUNT(*) as total FROM assessment_results'
          ).first();
          if (belowRow && totalRow && totalRow.total > 0) {
            computedPercentile = Math.round((belowRow.below / totalRow.total) * 100);
          }
        }
      } catch (err) {
        console.error('Benchmark percentile failed:', err.message);
      }
    }

    // 6. Build email
    const bindingConstraint = row.binding_constraint;
    const constraintName = LAYER_NAMES[bindingConstraint] || bindingConstraint || 'Unknown';
    const tasteSignatureName = tasteSignature && typeof tasteSignature === 'object'
      ? tasteSignature.name
      : (tasteSignature || row.taste_signature);
    const verdict = row.verdict;
    const compositeScore = row.composite_score;
    const subject = `Your AI Readiness: ${verdict || 'Assessment'} \u2014 ${constraintName} is your binding constraint`;

    const emailHtml = buildBriefEmail({
      firstName: row.name ? row.name.split(' ')[0] : '',
      briefHtml,
      verdict,
      bindingConstraint,
      compositeScore,
      layerScores: layerScores || {
        foundation: row.foundation_score,
        architecture: row.architecture_score,
        accountability: row.accountability_score,
        culture: row.culture_score,
      },
      tasteSignature: tasteSignatureName,
      benchmarkPercentile: computedPercentile,
    });

    // 7. Send email
    const emailResult = await sendEmail(env, {
      from: 'Jewell Assessment <nick@nickjewell.ai>',
      reply_to: 'nick@nickjewell.ai',
      to: [row.email],
      subject,
      html: emailHtml,
      tags: [{ name: 'type', value: 'executive-brief' }],
    });

    if (!emailResult.ok) throw new Error(emailResult.error);

    // 8. Success — update D1
    const finalStatus = emailResult.testMock ? 'test_mock' : 'sent';
    await db.prepare(
      'UPDATE assessment_results SET brief_email_status = ?, brief_request_payload = NULL WHERE id = ?'
    ).bind(finalStatus, assessmentId).run();

    // 9. Write email_log
    try {
      await db.prepare(
        'INSERT INTO email_log (assessment_id, recipient_email, recipient_name, email_type, subject, resend_id, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        assessmentId,
        row.email,
        row.name || null,
        'brief',
        subject,
        emailResult.id || null,
        finalStatus,
        JSON.stringify({ verdict, bindingConstraint, compositeScore, tasteSignature: tasteSignatureName, testMock: emailResult.testMock || false })
      ).run();
    } catch (err) {
      console.error('email_log write failed:', err.message);
    }

    return { processed: true, assessmentId, status: finalStatus };
  } catch (err) {
    // ANY error — mark as failed
    const failMsg = ('failed:' + (err.message || String(err))).slice(0, 200);
    console.error(`Brief generation failed for id=${assessmentId}:`, err.message);

    try {
      await db.prepare(
        'UPDATE assessment_results SET brief_email_status = ? WHERE id = ?'
      ).bind(failMsg, assessmentId).run();
    } catch (dbErr) {
      console.error('D1 failure update failed:', dbErr.message);
    }

    try {
      await db.prepare(
        'INSERT INTO email_log (assessment_id, recipient_email, recipient_name, email_type, subject, resend_id, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        assessmentId, row.email, row.name || null, 'brief', 'FAILED', null, 'error',
        JSON.stringify({ error: err.message })
      ).run();
    } catch (logErr) {
      console.error('email_log error write failed:', logErr.message);
    }

    return { processed: true, assessmentId, status: 'failed', error: err.message };
  }
}

// ─── WORKER ENTRY POINTS ────────────────────────────────

export default {
  // Cron trigger
  async scheduled(event, env, ctx) {
    const result = await processPendingBrief(env);
    console.log('Scheduled brief result:', JSON.stringify(result));
  },

  // HTTP handler — test trigger endpoint
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.searchParams.get('test-trigger') === 'true' && env.TEST_MODE === 'true') {
      const result = await processPendingBrief(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Scheduled Brief Worker', { status: 200 });
  },
};
