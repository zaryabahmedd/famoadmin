import { NextResponse } from 'next/server';
import { getAdminSession, unauthorized } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  // Read the live row so role/active/must-change reflect the current state,
  // not just what was signed into the cookie.
  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('id, name, email, role, is_active, must_change_password')
    .eq('id', session.sub)
    .single();

  if (error || !data || !data.is_active) return unauthorized();

  return NextResponse.json({
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    mustChangePassword: data.must_change_password,
  });
}
