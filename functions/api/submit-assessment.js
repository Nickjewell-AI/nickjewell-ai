// Cloudflare Pages Function — /api/submit-assessment
// Thin wrapper — delegates to shared handler

import { handleAssessmentPost, handleAssessmentPatch } from '../lib/handlers/assessment.js';

export async function onRequestPost(context) {
  return handleAssessmentPost(context.request, context.env, context);
}

export async function onRequestPatch(context) {
  return handleAssessmentPatch(context.request, context.env, context);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://nickjewell.ai',
      'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
