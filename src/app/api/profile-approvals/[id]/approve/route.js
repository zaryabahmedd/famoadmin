import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { resolveApprovalType, profileLockedUntil } from '@/lib/profileApprovals';

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const type = resolveApprovalType(new URL(request.url).searchParams.get('type'));
  if (!type) return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });

  const { data: req, error: loadError } = await supabaseAdmin
    .from(type.table)
    .select(`
      ${type.ownerColumn}, full_name, phone_number, avatar_url, status,
      owner:${type.ownerColumn} ( full_name, email )
    `)
    .eq('id', id)
    .single();

  if (loadError || !req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (req.status !== 'pending') {
    return NextResponse.json({ error: `Request is already ${req.status}.` }, { status: 409 });
  }

  // Only fields the driver actually submitted overwrite the live profile.
  const profile = {};
  if (req.full_name) profile.full_name = req.full_name;
  if (req.phone_number) profile.phone_number = req.phone_number;
  if (req.avatar_url) profile.avatar_url = req.avatar_url;

  const ownerId = req[type.ownerColumn];
  const reviewedAt = new Date();

  const { error: profileError } = await supabaseAdmin
    .from(type.ownerTable)
    .update({ ...profile, profile_locked_until: profileLockedUntil(reviewedAt) })
    .eq('id', ownerId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  // Guarded on `pending` so two admins approving at once can't double-review.
  const { data: reviewed, error: reviewError } = await supabaseAdmin
    .from(type.table)
    .update({
      status: 'approved',
      reviewed_at: reviewedAt.toISOString(),
      reviewed_by: session.name || session.email || 'admin',
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id');

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 400 });
  if (!reviewed?.length) {
    return NextResponse.json({ error: 'Request was already reviewed.' }, { status: 409 });
  }

  const changes = [];
  if (profile.full_name) changes.push(`name → ${profile.full_name}`);
  if (profile.phone_number) changes.push(`phone → ${profile.phone_number}`);
  if (profile.avatar_url) changes.push('avatar updated');

  await logAudit({
    actor: session,
    action: 'profile.approved',
    targetType: type.auditTargetType,
    targetId: ownerId,
    targetLabel: req.owner?.full_name || req.owner?.email || null,
    details: { changes, lockedUntil: profileLockedUntil(reviewedAt) },
  });

  return NextResponse.json({ ok: true });
}
