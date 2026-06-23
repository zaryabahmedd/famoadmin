import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized, forbidden, isSuperAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';

export async function POST(_request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const { id } = await params;

  if (id === session.sub) {
    return NextResponse.json({ error: 'You are already a Super Admin' }, { status: 400 });
  }

  const { data: target, error: loadError } = await supabaseAdmin
    .from('admin_accounts')
    .select('id, email, name, role, is_active')
    .eq('id', id)
    .single();

  if (loadError || !target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  if (!target.is_active) {
    return NextResponse.json({ error: 'Cannot promote a deactivated admin' }, { status: 400 });
  }

  if (target.role === 'super_admin') {
    return NextResponse.json({ error: 'This admin is already a Super Admin' }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('admin_accounts')
    .update({ role: 'super_admin' })
    .eq('id', id)
    .select('id, email, name, role, is_active, must_change_password, last_login_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor: session,
    action: 'admin.promoted_to_super',
    targetType: 'admin',
    targetId: target.id,
    targetLabel: target.email,
    details: { from: 'admin', to: 'super_admin', name: target.name },
  });

  return NextResponse.json(updated);
}
