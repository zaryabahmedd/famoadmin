import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

/**
 * Read and verify the current admin session from the request cookies.
 * @returns {Promise<null | { sub: string, role: string, name: string, email: string, exp: number }>}
 */
export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
}

export function isSuperAdmin(session) {
  return session?.role === 'super_admin';
}
