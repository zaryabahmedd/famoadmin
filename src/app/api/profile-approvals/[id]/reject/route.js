import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { reason } = await request.json().catch(() => ({}));

  if (!reason) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc('reject_profile_change', {
    p_request_id: id,
    p_reviewer: session.name || session.email || 'admin',
    p_reason: reason,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
