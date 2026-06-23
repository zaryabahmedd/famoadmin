import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const status = new URL(request.url).searchParams.get('status') || 'pending';

  const { data, error } = await supabaseAdmin
    .from('profile_change_requests')
    .select(`
      id, user_id, full_name, phone_number, avatar_url,
      status, rejection_reason, requested_at, reviewed_at, reviewed_by,
      users:user_id ( id, full_name, phone_number, avatar_url, email )
    `)
    .eq('status', status)
    .order('requested_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
