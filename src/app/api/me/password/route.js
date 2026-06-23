import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { currentPassword, newPassword } = await request.json().catch(() => ({}));

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  // Verify the current password by re-authenticating.
  const { data: auth, error: authError } = await supabaseAdmin.rpc('admin_login', {
    p_email: session.email,
    p_password: currentPassword,
  });
  if (authError) {
    return NextResponse.json({ error: 'Could not verify current password' }, { status: 500 });
  }
  const matched = Array.isArray(auth) ? auth[0] : auth;
  if (!matched) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc('set_admin_password', {
    p_admin_id: session.sub,
    p_new_password: newPassword,
  });
  if (error) {
    return NextResponse.json({ error: 'Could not update password' }, { status: 500 });
  }

  await logAudit({
    actor: session,
    action: 'admin.password_changed',
    targetType: 'admin',
    targetId: session.sub,
    targetLabel: session.email,
  });

  return NextResponse.json({ ok: true });
}
