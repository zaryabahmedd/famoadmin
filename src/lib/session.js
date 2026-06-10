const encoder = new TextEncoder();

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

export async function createSessionToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}`;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sig = toBase64Url(new Uint8Array(signature));
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return false;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const key = await getKey(secret);
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSig = toBase64Url(new Uint8Array(expectedSignature));

  return timingSafeEqual(sig, expectedSig);
}

export { SESSION_COOKIE, SESSION_TTL_MS };
