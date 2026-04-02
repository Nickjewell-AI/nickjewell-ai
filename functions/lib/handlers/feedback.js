// Handler for feedback submissions — submit_feedback type

import { jsonResponse } from '../middleware/responses.js';

export async function handleFeedback(request, env, ctx, body) {
  const { assessment_id, sentiment, feedback_text, page_context } = body;
  const db = env.DB;
  if (!db) {
    return jsonResponse({ error: 'Database not configured' }, 500);
  }

  const timestamp = new Date().toISOString();
  const userAgent = request.headers.get('User-Agent') || '';

  try {
    // If feedback_text provided and assessment_id exists, try to update existing row
    if (feedback_text && assessment_id) {
      const existing = await db.prepare(
        'SELECT id FROM assessment_feedback WHERE assessment_id = ? AND sentiment IS NOT NULL'
      ).bind(assessment_id).first();

      if (existing) {
        await db.prepare(
          'UPDATE assessment_feedback SET feedback_text = ?, page_context = ? WHERE id = ?'
        ).bind(feedback_text, page_context || null, existing.id).run();
        return jsonResponse({ success: true }, 200);
      }
    }

    // Insert new row
    await db.prepare(
      'INSERT INTO assessment_feedback (assessment_id, timestamp, sentiment, feedback_text, user_agent, page_context) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      assessment_id || null,
      timestamp,
      sentiment || null,
      feedback_text || null,
      userAgent,
      page_context || null
    ).run();

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error('Feedback write error:', err.message);
    return jsonResponse({ error: 'Failed to save feedback' }, 500);
  }
}
