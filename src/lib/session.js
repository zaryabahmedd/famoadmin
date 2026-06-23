const encoder = new TextEncoder();

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

async function getKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function signPayload(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

/**
 * Create a signed session token carrying the admin's identity and role.
 * @param {{ id: string, role: string, name?: string, email?: string }} admin
 */
export async function createSessionToken(admin) {
  const exp = Date.now() + SESSION_TTL_MS;
  const claims = {
    sub: admin.id,
    role: admin.role,
    name: admin.name || '',
    email: admin.email || '',
    exp,
  };
  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const sig = await signPayload(payload);
  return `${payload}.${sig}`;
}

/**
 * Verify a session token and return its decoded claims, or null if invalid/expired.
 * @returns {Promise<null | { sub: string, role: string, name: string, email: string, exp: number }>}
 */
export async function verifySessionToken(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return null;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expectedSig = await signPayload(payload);
  if (!timingSafeEqual(sig, expectedSig)) return null;

  let claims;
  try {
    claims = JSON.parse(fromBase64Url(payload));
  } catch {
    return null;
  }

  if (!claims || typeof claims.exp !== 'number' || Date.now() > claims.exp) return null;
  if (!claims.sub || !claims.role) return null;

  return claims;
}

export { SESSION_COOKIE, SESSION_TTL_MS };
