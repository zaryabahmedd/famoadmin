import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveApprovalType } from '@/lib/profileApprovals';

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const status = params.get('status') || 'pending';

  const type = resolveApprovalType(params.get('type'));
  if (!type) return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });

  // Aliased to `owner` so the client renders drivers and customers identically.
  const { data, error } = await supabaseAdmin
    .from(type.table)
    .select(`
      id, ${type.ownerColumn}, full_name, phone_number, avatar_url,
      status, rejection_reason, requested_at, reviewed_at, reviewed_by,
      owner:${type.ownerColumn} ( id, full_name, phone_number, avatar_url, email )
    `)
    .eq('status', status)
    .order('requested_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
