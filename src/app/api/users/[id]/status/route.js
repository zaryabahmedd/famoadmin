import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function syncAuthBan(userId, blocked) {
  // Call Supabase Auth Admin REST API directly — most reliable approach
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      ban_duration: blocked ? '876000h' : 'none',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth ban failed (${res.status}): ${body}`);
  }
}

async function killSessions(userId) {
  // Delete all active sessions so existing tokens stop working immediately
  await supabaseAdmin.rpc('admin_set_user_status', {
    target_user_id: userId,
    new_status: 'blocked', // status already set — this just runs the session cleanup
  }).then(() => {}); // best-effort; don't fail the request
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { status } = await request.json();

  if (!['active', 'blocked'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Step 1 — update public.users (this always works)
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .update({ status })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 });
  }

  // Step 2 — ban / unban in Supabase Auth via REST (reliable, direct HTTP)
  try {
    await syncAuthBan(id, status === 'blocked');
  } catch (authErr) {
    console.error('[block user] auth sync error:', authErr.message);
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  // Step 3 — if blocking, also wipe active sessions immediately via SQL function
  if (status === 'blocked') {
    const { error: sessionError } = await supabaseAdmin.rpc('kill_user_sessions', {
      target_user_id: id,
    });
    // Session kill is best-effort — don't fail the whole request if it errors
    if (sessionError) console.error('[block user] session kill error:', sessionError.message);
  }

  return NextResponse.json({ success: true });
}
