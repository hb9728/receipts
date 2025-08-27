import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'no file' }, { status: 400 });
    }

    // limit ~3MB to stay under vercel body cap
    const ab = await file.arrayBuffer();
    if (ab.byteLength === 0 || ab.byteLength > 3_000_000) {
      return NextResponse.json({ error: 'file too large (max ~3MB)' }, { status: 400 });
    }

    const ext = (file.type === 'image/webp') ? 'webp'
            : (file.type === 'image/jpeg') ? 'jpg'
            : (file.type === 'image/png') ? 'png'
            : 'bin';

    const objectName = `u/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const svc = supabaseService();
    const { error } = await svc.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(objectName, Buffer.from(ab), { contentType: file.type || 'application/octet-stream', upsert: false });
    if (error) throw error;

    const { data: pub } = svc.storage.from(process.env.SUPABASE_BUCKET!).getPublicUrl(objectName);
    return NextResponse.json({ image_url: pub.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'upload failed' }, { status: 400 });
  }
}
