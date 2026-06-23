import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized, forbidden, isSuperAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('id, email, name, role, is_active, must_change_password, last_login_at, created_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const { email, name, password, role } = await request.json().catch(() => ({}));

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  const newRole = role === 'super_admin' ? 'super_admin' : 'admin';

  const { data, error } = await supabaseAdmin.rpc('create_admin_account', {
    p_email: email,
    p_name: name.trim(),
    p_password: password,
    p_role: newRole,
    p_created_by: session.sub,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An admin with that email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const admin = Array.isArray(data) ? data[0] : data;

  await logAudit({
    actor: session,
    action: 'admin.created',
    targetType: 'admin',
    targetId: admin?.id,
    targetLabel: admin?.email,
    details: { role: newRole },
  });

  return NextResponse.json(admin, { status: 201 });
}
