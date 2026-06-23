import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized, forbidden, isSuperAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const { id } = await params;
  const { newPassword } = await request.json().catch(() => ({}));

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const { data: target, error: loadError } = await supabaseAdmin
    .from('admin_accounts')
    .select('id, email')
    .eq('id', id)
    .single();

  if (loadError || !target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  const { error } = await supabaseAdmin.rpc('set_admin_password', {
    p_admin_id: id,
    p_new_password: newPassword,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor: session,
    action: 'admin.password_reset',
    targetType: 'admin',
    targetId: target.id,
    targetLabel: target.email,
  });

  return NextResponse.json({ ok: true });
}
