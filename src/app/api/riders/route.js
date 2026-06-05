import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('riders')
    .select('id, full_name, email, phone_number, status, vehicle_type, vehicle_brand, vehicle_model, vehicle_plate, payout_bank, payout_account_number, payout_bvn, created_at, license_path, license_front_path, license_back_path, selfie_path, selfie_with_license_path')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
