import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { reason } = await request.json().catch(() => ({}));

  if (!reason) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  const { data: req } = await supabaseAdmin
    .from('profile_change_requests')
    .select('user_id, users:user_id ( full_name, email )')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin.rpc('reject_profile_change', {
    p_request_id: id,
    p_reviewer: session.name || session.email || 'admin',
    p_reason: reason,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const user = req?.users;
  await logAudit({
    actor: session,
    action: 'profile.rejected',
    targetType: 'user',
    targetId: req?.user_id,
    targetLabel: user?.full_name || user?.email || null,
    details: { reason },
  });

  return NextResponse.json({ ok: true });
}
