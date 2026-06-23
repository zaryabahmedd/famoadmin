import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized, forbidden, isSuperAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';

async function countOtherActiveSuperAdmins(excludeId) {
  const { count } = await supabaseAdmin
    .from('admin_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'super_admin')
    .eq('is_active', true)
    .neq('id', excludeId);
  return count || 0;
}

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const wantsActive = typeof body.is_active === 'boolean' ? body.is_active : undefined;
  const wantsRole = body.role === 'admin' || body.role === 'super_admin' ? body.role : undefined;

  if (wantsActive === undefined && wantsRole === undefined) {
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

  const isSelf = id === session.sub;
  const update = {};
  const logs = [];

  // --- Deactivate / reactivate ---
  if (wantsActive !== undefined && wantsActive !== target.is_active) {
    if (!wantsActive && isSelf) {
      return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 });
    }
    if (!wantsActive && target.role === 'super_admin' && (await countOtherActiveSuperAdmins(id)) === 0) {
      return NextResponse.json({ error: 'Cannot deactivate the last active Super Admin' }, { status: 400 });
    }
    update.is_active = wantsActive;
    logs.push({ action: wantsActive ? 'admin.reactivated' : 'admin.deactivated' });
  }

  // --- Change role ---
  if (wantsRole !== undefined && wantsRole !== target.role) {
    if (isSelf) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }
    if (wantsRole === 'admin' && target.role === 'super_admin' && (await countOtherActiveSuperAdmins(id)) === 0) {
      return NextResponse.json({ error: 'Cannot demote the last active Super Admin' }, { status: 400 });
    }
    update.role = wantsRole;
    logs.push({ action: 'admin.role_changed', details: { from: target.role, to: wantsRole } });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No changes to apply' }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('admin_accounts')
    .update(update)
    .eq('id', id)
    .select('id, email, name, role, is_active, must_change_password, last_login_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const log of logs) {
    await logAudit({
      actor: session,
      action: log.action,
      targetType: 'admin',
      targetId: target.id,
      targetLabel: target.email,
      details: log.details,
    });
  }

  return NextResponse.json(updated);
}
