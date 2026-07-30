import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { resolveApprovalType } from '@/lib/profileApprovals';

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { reason } = await request.json().catch(() => ({}));

  if (!reason) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  const type = resolveApprovalType(new URL(request.url).searchParams.get('type'));
  if (!type) return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });

  const { data: req, error: loadError } = await supabaseAdmin
    .from(type.table)
    .select(`${type.ownerColumn}, status, owner:${type.ownerColumn} ( full_name, email )`)
    .eq('id', id)
    .single();

  if (loadError || !req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (req.status !== 'pending') {
    return NextResponse.json({ error: `Request is already ${req.status}.` }, { status: 409 });
  }

  // A rejection leaves the live profile untouched and applies no edit lock.
  const { data: reviewed, error } = await supabaseAdmin
    .from(type.table)
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.name || session.email || 'admin',
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!reviewed?.length) {
    return NextResponse.json({ error: 'Request was already reviewed.' }, { status: 409 });
  }

  await logAudit({
    actor: session,
    action: 'profile.rejected',
    targetType: type.auditTargetType,
    targetId: req[type.ownerColumn],
    targetLabel: req.owner?.full_name || req.owner?.email || null,
    details: { reason },
  });

  return NextResponse.json({ ok: true });
}
