import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(_request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const { data, error } = await supabaseAdmin.rpc('decide_cashout', {
    p_request_id: id,
    p_approve: true,
    p_decided_by: session.name || session.email || 'admin',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: rider } = await supabaseAdmin
    .from('riders')
    .select('full_name, email')
    .eq('id', data.rider_id)
    .single();

  await logAudit({
    actor: session,
    action: 'cashout.approved',
    targetType: 'rider',
    targetId: data.rider_id,
    targetLabel: rider?.full_name || rider?.email || null,
    details: { requestId: id, amount: data.amount },
  });

  return NextResponse.json(data);
}
