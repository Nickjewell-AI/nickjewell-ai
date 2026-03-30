// Webhook dispatch — HMAC-signed payloads to registered endpoints

async function sign(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${hex}`;
}

export async function dispatchWebhooks(env, eventType, payload) {
  const db = env.DB;
  if (!db) return;

  let webhooks;
  try {
    const result = await db.prepare(
      'SELECT url, secret, events FROM webhook_registrations WHERE active = 1'
    ).all();
    webhooks = result.results || [];
  } catch (err) {
    console.error('Webhook query error:', err.message);
    return;
  }

  const body = JSON.stringify(payload);

  for (const hook of webhooks) {
    // Check if this webhook subscribes to the event
    const events = (hook.events || '').split(',').map(e => e.trim());
    if (!events.includes(eventType) && !events.includes('*')) continue;

    try {
      const signature = await sign(body, hook.secret);
      fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body,
      }).catch(err => console.error(`Webhook delivery failed (${hook.url}):`, err.message));
    } catch (err) {
      console.error(`Webhook signing failed (${hook.url}):`, err.message);
    }
  }
}
