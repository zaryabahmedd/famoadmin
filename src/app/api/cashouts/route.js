import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized } from '@/lib/auth';

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const { data, error } = await supabaseAdmin.rpc('admin_list_cashouts');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = status ? data.filter((r) => r.status === status) : data;
  return NextResponse.json(rows);
}
