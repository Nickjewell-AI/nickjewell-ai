// Daily Digest Worker
// Standalone Cloudflare Worker — runs on cron (daily at noon UTC),
// queries D1 for last 24h assessment activity, emails a digest via Resend.
//
// D1 TABLES AND COLUMNS USED (introspect live schema via wrangler CLI):
//   assessment_results: id, timestamp, name, email, company, role, industry,
//     verdict, taste_signature, composite_score, brief_email_status, is_test
//   email_log: id, timestamp, recipient_email, status
//   assessment_feedback: id, timestamp, sentiment, feedback_text, source_name,
//     source_company

// ─── TEST RECORD FILTER ────────────────────────────────────
const TEST_FILTER = `
  AND (email IS NULL OR (
    email NOT LIKE '%@playwright.dev%'
    AND email NOT LIKE '%@test.dev%'
    AND email != 'test@example.com'
  ))
  AND is_test = 0
`;

const TEST_FILTER_LEADS = `
  AND email NOT LIKE '%@playwright.dev%'
  AND email NOT LIKE '%@test.dev%'
  AND email != 'test@example.com'
  AND is_test = 0
`;

// ─── D1 QUERIES ───────────��────────────────────────────────

async function safeQuery(db, label, sql, bindings = []) {
  try {
    const stmt = db.prepare(sql);
    const result = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();
    return { ok: true, results: result.results || [] };
  } catch (err) {
    console.error(`Query failed [${label}]:`, err.message);
    return { ok: false, error: err.message, results: [] };
  }
}

async function gatherDigestData(db) {
  const errors = [];

  // 1. Last 24h completions
  const completions = await safeQuery(db, 'completions', `
    SELECT COUNT(*) as count FROM assessment_results
    WHERE timestamp > datetime('now', '-24 hours') ${TEST_FILTER}
  `);
  if (!completions.ok) errors.push('completions');

  // 2. Last 24h capture gate conversions
  const conversions = await safeQuery(db, 'conversions', `
    SELECT COUNT(*) as count FROM assessment_results
    WHERE timestamp > datetime('now', '-24 hours')
    AND email IS NOT NULL ${TEST_FILTER_LEADS}
  `);
  if (!conversions.ok) errors.push('conversions');

  // 3. Verdict distribution
  const verdicts = await safeQuery(db, 'verdicts', `
    SELECT verdict, COUNT(*) as count FROM assessment_results
    WHERE timestamp > datetime('now', '-24 hours') ${TEST_FILTER}
    GROUP BY verdict
  `);
  if (!verdicts.ok) errors.push('verdicts');

  // 4. Taste signature distribution
  const taste = await safeQuery(db, 'taste', `
    SELECT taste_signature, COUNT(*) as count FROM assessment_results
    WHERE timestamp > datetime('now', '-24 hours') ${TEST_FILTER}
    GROUP BY taste_signature
  `);
  if (!taste.ok) errors.push('taste');

  // 5. Industry distribution
  const industry = await safeQuery(db, 'industry', `
    SELECT industry, COUNT(*) as count FROM assessment_results
    WHERE timestamp > datetime('now', '-24 hours') ${TEST_FILTER}
    GROUP BY industry
  `);
  if (!industry.ok) errors.push('industry');

  // 6. Brief status distribution
  const briefStatus = await safeQuery(db, 'briefStatus', `
    SELECT brief_email_status, COUNT(*) as count FROM assessment_results
    WHERE timestamp > datetime('now', '-24 hours') ${TEST_FILTER}
    GROUP BY brief_email_status
  `);
  if (!briefStatus.ok) errors.push('briefStatus');

  // 7. Emails sent (from email_log)
  const emailsSent = await safeQuery(db, 'emailsSent', `
    SELECT COUNT(*) as count FROM email_log
    WHERE timestamp > datetime('now', '-24 hours')
    AND recipient_email NOT LIKE '%@playwright.dev%'
    AND recipient_email NOT LIKE '%@test.dev%'
  `);
  if (!emailsSent.ok) errors.push('emailsSent');

  // 8. All-time totals
  const allTime = await safeQuery(db, 'allTime', `
    SELECT
      COUNT(*) as total_completions,
      COUNT(CASE WHEN email IS NOT NULL AND email NOT LIKE '%@playwright.dev%' AND email NOT LIKE '%@test.dev%' AND email != 'test@example.com' THEN 1 END) as total_leads,
      COUNT(DISTINCT CASE WHEN company IS NOT NULL AND email NOT LIKE '%@playwright.dev%' AND email NOT LIKE '%@test.dev%' AND email != 'test@example.com' THEN company END) as unique_companies,
      COUNT(CASE WHEN brief_email_status = 'sent' THEN 1 END) as total_briefs_sent
    FROM assessment_results
    WHERE is_test = 0
  `);
  if (!allTime.ok) errors.push('allTime');

  // 9. New leads (last 24h with email)
  const leads = await safeQuery(db, 'leads', `
    SELECT id, name, email, company, role, industry, verdict, taste_signature,
      composite_score, brief_email_status, timestamp
    FROM assessment_results
    WHERE timestamp > datetime('now', '-24 hours')
    AND email IS NOT NULL ${TEST_FILTER_LEADS}
    ORDER BY timestamp DESC
  `);
  if (!leads.ok) errors.push('leads');

  // 10. Last 24h feedback
  const feedback = await safeQuery(db, 'feedback', `
    SELECT sentiment, feedback_text, source_name, source_company, timestamp
    FROM assessment_feedback
    WHERE timestamp > datetime('now', '-24 hours')
    ORDER BY timestamp DESC
  `);
  if (!feedback.ok) errors.push('feedback');

  return {
    completions: completions.results[0]?.count || 0,
    conversions: conversions.results[0]?.count || 0,
    verdicts: verdicts.results,
    taste: taste.results,
    industry: industry.results,
    briefStatus: briefStatus.results,
    emailsSent: emailsSent.results[0]?.count || 0,
    allTime: allTime.results[0] || {},
    leads: leads.results,
    feedback: feedback.results,
    errors,
    allFailed: errors.length >= 10,
  };
}

// ─── EMAIL TEMPLATE ────────────────────────────────────────

const INDUSTRY_LABELS = {
  A: 'Financial Services',
  B: 'Healthcare',
  C: 'Technology/SaaS',
  D: 'Manufacturing',
  E: 'Retail/E-Commerce',
  F: 'Professional Services',
};

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildDigestHtml(data, dateStr) {
  const captureRate = data.completions > 0
    ? Math.round((data.conversions / data.completions) * 100) + '%'
    : 'N/A';

  const briefsSent24h = data.briefStatus.reduce((sum, r) => r.brief_email_status === 'sent' ? sum + r.count : sum, 0);
  const hasFailed = data.briefStatus.some(r => r.brief_email_status && String(r.brief_email_status).startsWith('failed'));

  // Verdict map
  const verdictMap = {};
  for (const r of data.verdicts) verdictMap[r.verdict] = r.count;

  // Taste map
  const tasteMap = {};
  for (const r of data.taste) tasteMap[r.taste_signature] = r.count;

  // Brief status map
  const briefMap = {};
  for (const r of data.briefStatus) briefMap[r.brief_email_status || 'null'] = r.count;

  const noActivity = data.completions === 0;

  // ── Helpers
  const statCell = (label, value) => `
    <td style="padding:12px 16px;text-align:center;width:25%;">
      <div style="font-size:24px;font-weight:700;color:#722F37;">${value}</div>
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px;">${label}</div>
    </td>`;

  const tableRow = (label, value) => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#555;">${label}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;">${value}</td>
    </tr>`;

  // ── Quick Stats
  const quickStats = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin-bottom:24px;">
      <tr>
        ${statCell('Completions (24h)', data.completions)}
        ${statCell('Capture Rate', captureRate)}
        ${statCell('Briefs Sent (24h)', briefsSent24h)}
        ${statCell('Emails Sent (24h)', data.emailsSent)}
      </tr>
    </table>`;

  // ── Verdict Distribution
  const verdictSection = noActivity ? '' : `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;">Verdict Distribution</td></tr>
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:4px;">
          ${tableRow('<span style="color:#2d8a4e;">Green</span>', verdictMap.Green || 0)}
          ${tableRow('<span style="color:#B8860B;">Amber</span>', verdictMap.Amber || 0)}
          ${tableRow('<span style="color:#c44536;">Red</span>', verdictMap.Red || 0)}
        </table>
      </td></tr>
    </table>`;

  // ── Taste Signatures
  const tasteSection = noActivity ? '' : `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;">Taste Signatures</td></tr>
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:4px;">
          ${tableRow('Sophistication', tasteMap.Sophistication || 0)}
          ${tableRow('Pragmatism', tasteMap.Pragmatism || 0)}
          ${tableRow('Caution', tasteMap.Caution || 0)}
          ${tableRow('Momentum', tasteMap.Momentum || 0)}
        </table>
      </td></tr>
    </table>`;

  // ── Industry Breakdown
  const industryRows = data.industry.map(r =>
    tableRow(esc(INDUSTRY_LABELS[r.industry] || r.industry || 'Unknown'), r.count)
  ).join('');
  const industrySection = noActivity || !industryRows ? '' : `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;">Industry Breakdown</td></tr>
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:4px;">
          ${industryRows}
        </table>
      </td></tr>
    </table>`;

  // ── Brief Pipeline
  const briefSection = noActivity ? '' : `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;">Brief Pipeline</td></tr>
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:4px;">
          ${tableRow('Sent', briefMap.sent || 0)}
          ${tableRow('Pending', briefMap.pending || 0)}
          ${tableRow('Failed', Object.entries(briefMap).filter(([k]) => k.startsWith('failed')).reduce((s, [, v]) => s + v, 0))}
          ${tableRow('Test Mock', briefMap.test_mock || 0)}
        </table>
      </td></tr>
    </table>`;

  // ── New Leads Table
  let leadsSection = '';
  if (data.leads.length > 0) {
    const leadRows = data.leads.map(r => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#1a1a1a;font-weight:600;">${esc(r.name)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">${esc(r.company)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">${esc(r.role)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">${esc(INDUSTRY_LABELS[r.industry] || r.industry || '-')}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:${r.verdict === 'Green' ? '#2d8a4e' : r.verdict === 'Red' ? '#c44536' : '#B8860B'};font-weight:600;">${esc(r.verdict)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">${esc(r.taste_signature)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">${esc(r.brief_email_status || '-')}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:11px;color:#999;">${r.timestamp ? r.timestamp.slice(11, 16) : ''}</td>
      </tr>`).join('');

    leadsSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;">New Leads (${data.leads.length})</td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <tr style="background:#fafafa;">
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Name</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Company</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Role</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Industry</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Verdict</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Taste</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Brief</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;border-bottom:2px solid #e5e5e5;">Time</th>
            </tr>
            ${leadRows}
          </table>
        </td></tr>
      </table>`;
  }

  // ── Feedback
  let feedbackSection = '';
  if (data.feedback.length > 0) {
    const feedbackRows = data.feedback.map(r => {
      const emoji = r.sentiment === 'positive' ? '+' : r.sentiment === 'negative' ? '-' : '?';
      const source = [r.source_name, r.source_company].filter(Boolean).join(' / ') || 'Anonymous';
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#555;width:30px;text-align:center;font-weight:700;">${emoji}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;">${esc(r.feedback_text || '(no text)')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#999;">${esc(source)}</td>
      </tr>`;
    }).join('');

    feedbackSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;">Feedback (${data.feedback.length})</td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:4px;">
            ${feedbackRows}
          </table>
        </td></tr>
      </table>`;
  }

  // ── Query errors
  const errorSection = data.errors.length > 0 ? `
    <div style="background:#fff3f3;border:1px solid #ffcccc;border-radius:4px;padding:12px;margin-bottom:24px;">
      <p style="font-size:12px;color:#c44536;margin:0;">Query failures: ${data.errors.join(', ')}</p>
    </div>` : '';

  // ── Empty state
  const emptyState = noActivity ? `
    <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="font-size:14px;color:#888;margin:0;">No assessment activity in the last 24 hours.</p>
    </div>` : '';

  // ── All-time totals
  const at = data.allTime;
  const allTimeSection = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin-bottom:24px;">
      <tr><td colspan="4" style="padding:12px 16px 4px;font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.05em;">All-Time Totals</td></tr>
      <tr>
        ${statCell('Completions', at.total_completions || 0)}
        ${statCell('Leads', at.total_leads || 0)}
        ${statCell('Companies', at.unique_companies || 0)}
        ${statCell('Briefs Sent', at.total_briefs_sent || 0)}
      </tr>
    </table>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
  <tr><td style="padding:28px 28px 20px;">
    <p style="color:#722F37;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Jewell Assessment</p>
    <p style="color:#1a1a1a;font-size:20px;font-weight:700;margin:0 0 4px;">Daily Digest</p>
    <p style="color:#999;font-size:13px;margin:0;">${esc(dateStr)}</p>
  </td></tr>
  <tr><td style="padding:0 28px 28px;">
    ${errorSection}
    ${quickStats}
    ${emptyState}
    ${verdictSection}
    ${tasteSection}
    ${industrySection}
    ${briefSection}
    ${leadsSection}
    ${feedbackSection}
    ${allTimeSection}
    <p style="color:#ccc;font-size:11px;text-align:center;margin:20px 0 0;">Jewell Assessment Digest &middot; nickjewell.ai</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ─── CORE LOGIC ───────────���────────────────────────────────

async function sendDigest(env) {
  console.log('Daily digest worker triggered at', new Date().toISOString());

  if (env.TEST_MODE === 'true') {
    console.log('TEST_MODE: skipping digest');
    return { sent: false, reason: 'test_mode' };
  }

  const db = env.DB;
  if (!db) {
    console.error('DB not bound');
    // Send critical alert
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Jewell Assessment <nick@nickjewell.ai>',
          to: [env.DIGEST_RECIPIENT],
          subject: '[CRITICAL] Daily Digest — DB Connection Failed',
          html: '<p>Daily digest worker could not connect to D1 database. Check wrangler.toml bindings.</p>',
        }),
      });
    } catch (e) {
      console.error('Critical alert email failed:', e.message);
    }
    return { sent: false, error: 'DB not bound' };
  }

  const data = await gatherDigestData(db);
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // If ALL queries failed, send critical alert
  if (data.allFailed) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Jewell Assessment <nick@nickjewell.ai>',
          to: [env.DIGEST_RECIPIENT],
          subject: `[CRITICAL] Daily Digest — DB Connection Failed — ${dateStr}`,
          html: `<p>All 10 digest queries failed. Errors: ${data.errors.join(', ')}</p>`,
        }),
      });
    } catch (e) {
      console.error('Critical alert email failed:', e.message);
    }
    return { sent: false, error: 'all queries failed' };
  }

  const hasFailed = data.briefStatus.some(r => r.brief_email_status && String(r.brief_email_status).startsWith('failed'));
  const subject = hasFailed
    ? `[ALERT] Jewell Assessment Daily Digest — ${dateStr}`
    : `Jewell Assessment Daily Digest — ${dateStr}`;

  const htmlContent = buildDigestHtml(data, dateStr);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Jewell Assessment <nick@nickjewell.ai>',
        to: [env.DIGEST_RECIPIENT],
        subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Resend API error ${res.status}:`, errText);
      return { sent: false, error: `Resend ${res.status}: ${errText}` };
    }

    let resendId = null;
    try { resendId = (await res.json()).id || null; } catch {}
    console.log(`Daily digest sent to ${env.DIGEST_RECIPIENT}, Resend ID: ${resendId}`);
    return { sent: true, resendId, completions: data.completions, leads: data.leads.length };
  } catch (err) {
    console.error('Digest send failed:', err.message);
    return { sent: false, error: err.message };
  }
}

// ─── WORKER ENTRY POINTS ──────��─────────────────────────────

export default {
  async scheduled(event, env, ctx) {
    const result = await sendDigest(env);
    console.log('Daily digest result:', JSON.stringify(result));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.searchParams.get('test-trigger') === 'true' && env.TEST_MODE === 'true') {
      const result = await sendDigest(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Daily Digest Worker', { status: 200 });
  },
};
