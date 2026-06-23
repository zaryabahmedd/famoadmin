import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized, forbidden, isSuperAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Maps the UI filter to the action prefix it covers.
const FILTER_PREFIX = {
  rider: 'rider.',
  user: 'user.',
  profile: 'profile.',
  pricing: 'pricing.',
  admin: 'admin.',
};

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');
  const limit = Math.min(Number(searchParams.get('limit')) || 200, 500);

  let query = supabaseAdmin
    .from('admin_audit_logs')
    .select('id, actor_name, actor_email, action, target_type, target_id, target_label, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  const prefix = FILTER_PREFIX[filter];
  if (prefix) {
    query = query.like('action', `${prefix}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
