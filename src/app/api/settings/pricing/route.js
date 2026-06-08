import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('pricing_settings')
    .select('base_price, per_km_price, updated_at')
    .eq('id', 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const { base_price, per_km_price } = await request.json();

  if (!Number.isFinite(base_price) || base_price < 0 || !Number.isFinite(per_km_price) || per_km_price < 0) {
    return NextResponse.json({ error: 'base_price and per_km_price must be non-negative numbers' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('pricing_settings')
    .update({ base_price, per_km_price, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('base_price, per_km_price, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
