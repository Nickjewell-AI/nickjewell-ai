// Standardized response envelope — { data, meta, error }

export function success(data, meta = {}, status = 200) {
  return new Response(JSON.stringify({ data, meta, error: null }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function created(data, meta = {}) {
  return success(data, meta, 201);
}

export function error(code, message, status = 400) {
  return new Response(JSON.stringify({ data: null, meta: null, error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function notFound(message = 'Resource not found') {
  return error('NOT_FOUND', message, 404);
}

export function unauthorized(message = 'Invalid or missing API key') {
  return error('UNAUTHORIZED', message, 401);
}

export function methodNotAllowed(allowed) {
  return error('METHOD_NOT_ALLOWED', `Allowed: ${allowed}`, 405);
}
