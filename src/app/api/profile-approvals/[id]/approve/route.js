import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';

export async function POST(_request, { params }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const { error } = await supabaseAdmin.rpc('approve_profile_change', {
    p_request_id: id,
    p_reviewer: session.name || session.email || 'admin',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
