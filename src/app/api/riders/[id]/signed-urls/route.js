import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET = 'rider-documents';
const TTL = 3600;

export async function GET(request, { params }) {
  const { id } = await params;

  const { data: rider, error } = await supabaseAdmin
    .from('riders')
    .select('license_path, license_front_path, license_back_path, selfie_path, selfie_with_license_path')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pathMap = {
    license_front: rider.license_front_path,
    license_back: rider.license_back_path,
    selfie: rider.selfie_path,
    selfie_with_license: rider.selfie_with_license_path,
    license: rider.license_path,
  };

  const urls = {};
  await Promise.all(
    Object.entries(pathMap).map(async ([key, path]) => {
      if (!path) return;
      const { data, error: urlErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(path, TTL);
      if (!urlErr && data?.signedUrl) urls[key] = data.signedUrl;
    })
  );

  return NextResponse.json(urls);
}
