// CORS middleware — reads allowed origins from env

const DEFAULT_ORIGIN = 'https://www.nickjewell.ai';

function getAllowedOrigins(env) {
  if (env.CORS_ALLOWED_ORIGINS) {
    return env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim());
  }
  return [DEFAULT_ORIGIN];
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const allowed = getAllowedOrigins(env);
  if (allowed.includes(origin)) return true;
  // Allow localhost for dev
  if (origin.startsWith('http://localhost:') || origin === 'http://localhost') return true;
  if (origin.startsWith('http://127.0.0.1:') || origin === 'http://127.0.0.1') return true;
  return false;
}

function corsHeadersObj(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = isAllowedOrigin(origin, env);
  const safeOrigin = allowed ? origin : DEFAULT_ORIGIN;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeadersObj(safeOrigin),
    });
  }

  return { headers: corsHeadersObj(safeOrigin), allowed };
}
