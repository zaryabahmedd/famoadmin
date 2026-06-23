import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const ACTION_BY_STATUS = {
  approved: 'rider.approved',
  rejected: 'rider.rejected',
  blocked: 'rider.blocked',
};

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { status, reason } = await request.json();

  const allowed = ['pending_verification', 'pending_approval', 'approved', 'rejected', 'blocked'];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Snapshot the rider for from/to attribution before updating.
  const { data: rider } = await supabaseAdmin
    .from('riders')
    .select('full_name, status')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin.from('riders').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor: session,
    action: ACTION_BY_STATUS[status] || 'rider.status_changed',
    targetType: 'rider',
    targetId: id,
    targetLabel: rider?.full_name || null,
    details: { from: rider?.status || null, to: status, ...(reason ? { reason } : {}) },
  });

  return NextResponse.json({ success: true });
}
