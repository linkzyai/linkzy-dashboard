const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

exports.corsHeaders = () => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-admin-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

exports.json = (status, body) => ({
  statusCode: status,
  headers: { ...exports.corsHeaders(), 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

exports.isAdmin = (event) => {
  const key = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
  return ADMIN_API_KEY && key && key === ADMIN_API_KEY;
};

exports.checkOrigin = (event) => {
  if (ALLOWED_ORIGIN === '*') return true;
  const origin = event.headers.origin || event.headers.Origin || '';
  return origin === ALLOWED_ORIGIN;
};

exports.isUUID = (v) => /^[0-9a-fA-F-]{36}$/.test(String(v || ''));

exports.safeJson = (s) => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } }; 