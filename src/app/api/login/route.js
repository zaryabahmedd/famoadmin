import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_TTL_MS, createSessionToken } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('admin_login', {
    p_email: email,
    p_password: password,
  });

  if (error) {
    return NextResponse.json({ error: 'Sign in failed. Try again.' }, { status: 500 });
  }

  const admin = Array.isArray(data) ? data[0] : data;
  if (!admin) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
  }

  // Best-effort: record the sign-in time.
  await supabaseAdmin
    .from('admin_accounts')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id);

  const token = await createSessionToken({
    id: admin.id,
    role: admin.role,
    name: admin.name,
    email: admin.email,
  });

  const response = NextResponse.json({
    ok: true,
    role: admin.role,
    name: admin.name,
    mustChangePassword: admin.must_change_password,
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  return response;
}
