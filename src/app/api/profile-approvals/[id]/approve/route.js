import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(_request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const { data: req } = await supabaseAdmin
    .from('profile_change_requests')
    .select('user_id, full_name, phone_number, avatar_url, users:user_id ( full_name, email )')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin.rpc('approve_profile_change', {
    p_request_id: id,
    p_reviewer: session.name || session.email || 'admin',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const user = req?.users;
  const changes = [];
  if (req?.full_name) changes.push(`name → ${req.full_name}`);
  if (req?.phone_number) changes.push(`phone → ${req.phone_number}`);
  if (req?.avatar_url) changes.push('avatar updated');

  await logAudit({
    actor: session,
    action: 'profile.approved',
    targetType: 'user',
    targetId: req?.user_id,
    targetLabel: user?.full_name || user?.email || null,
    details: { changes },
  });

  return NextResponse.json({ ok: true });
}
