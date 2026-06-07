import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('deliveries')
    .select(`
      id, status, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
      weight, price, created_at, updated_at, accepted_at,
      package_category, package_description, package_size,
      sender_name, sender_phone, recipient_name, recipient_phone,
      pickup_notes, dropoff_notes, special_instructions,
      user:users ( id, full_name, email, phone_number ),
      rider:riders ( id, full_name, phone_number, vehicle_type, vehicle_plate )
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.in('status', status.split(','));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
