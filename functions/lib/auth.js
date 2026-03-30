// Auth middleware — Bearer token or admin_key query param

export async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && env.ADMIN_KEY && token === env.ADMIN_KEY) {
      return { authenticated: true, scope: 'admin' };
    }
  }

  // Fallback: query param for browser convenience
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('admin_key');
  if (adminKey && env.ADMIN_KEY && adminKey === env.ADMIN_KEY) {
    return { authenticated: true, scope: 'admin' };
  }

  throw new Error('UNAUTHORIZED');
}
