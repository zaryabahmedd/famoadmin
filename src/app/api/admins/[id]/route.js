import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized, forbidden, isSuperAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const wantsActive = typeof body.is_active === 'boolean' ? body.is_active : undefined;

  if (wantsActive === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data: target, error: loadError } = await supabaseAdmin
    .from('admin_accounts')
    .select('id, email, name, role, is_active')
    .eq('id', id)
    .single();

  if (loadError || !target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  if (target.role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot modify the Super Admin account' }, { status: 400 });
  }

  if (wantsActive === target.is_active) {
    return NextResponse.json({ error: 'No changes to apply' }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('admin_accounts')
    .update({ is_active: wantsActive })
    .eq('id', id)
    .select('id, email, name, role, is_active, must_change_password, last_login_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor: session,
    action: wantsActive ? 'admin.reactivated' : 'admin.deactivated',
    targetType: 'admin',
    targetId: target.id,
    targetLabel: target.email,
  });

  return NextResponse.json(updated);
}
