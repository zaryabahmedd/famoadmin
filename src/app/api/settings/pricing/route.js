import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession, unauthorized, forbidden, isSuperAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// The four package sizes the user app offers. Pricing must exist for every one
// of these or that size becomes un-orderable (the user app blocks checkout when
// a size has no row), so PATCH requires all four.
const SIZES = [5, 10, 15, 20];

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('package_pricing')
    .select('size, base_price, per_km_price, updated_at')
    .order('size', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sizes: data });
}

export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!isSuperAdmin(session)) return forbidden();

  const body = await request.json();
  const incoming = Array.isArray(body?.sizes) ? body.sizes : null;
  if (!incoming) {
    return NextResponse.json({ error: 'sizes must be an array of { size, base_price, per_km_price }' }, { status: 400 });
  }

  // Validate: exactly the four known sizes, each with non-negative numbers.
  const bySize = new Map();
  for (const row of incoming) {
    const size = Number(row?.size);
    const base_price = Number(row?.base_price);
    const per_km_price = Number(row?.per_km_price);
    if (!SIZES.includes(size)) {
      return NextResponse.json({ error: `Unknown package size: ${row?.size}` }, { status: 400 });
    }
    if (!Number.isFinite(base_price) || base_price < 0 || !Number.isFinite(per_km_price) || per_km_price < 0) {
      return NextResponse.json({ error: `Invalid pricing for size ${size}: base and per-km must be non-negative numbers` }, { status: 400 });
    }
    bySize.set(size, { size, base_price, per_km_price });
  }
  if (bySize.size !== SIZES.length) {
    return NextResponse.json({ error: `All ${SIZES.length} package sizes (${SIZES.join(', ')}) must be priced.` }, { status: 400 });
  }

  // Snapshot the previous values for the audit trail.
  const { data: prevRows } = await supabaseAdmin
    .from('package_pricing')
    .select('size, base_price, per_km_price')
    .order('size', { ascending: true });

  const now = new Date().toISOString();
  const updates = SIZES.map((size) => ({ ...bySize.get(size), updated_at: now }));

  const { data, error } = await supabaseAdmin
    .from('package_pricing')
    .upsert(updates, { onConflict: 'size' })
    .select('size, base_price, per_km_price, updated_at')
    .order('size', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor: session,
    action: 'pricing.updated',
    targetType: 'pricing',
    details: {
      from: prevRows ? prevRows.map((r) => ({ size: r.size, base_price: r.base_price, per_km_price: r.per_km_price })) : null,
      to: updates.map((r) => ({ size: r.size, base_price: r.base_price, per_km_price: r.per_km_price })),
    },
  });

  return NextResponse.json({ sizes: data });
}
