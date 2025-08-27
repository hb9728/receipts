import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const width = parseInt(url.searchParams.get('w') || '0', 10);
    const height = parseInt(url.searchParams.get('h') || '0', 10);
    const blurhash = url.searchParams.get('bh') || '';
    const faces = url.searchParams.get('f') === '1';
    const nsfw = Number(url.searchParams.get('n') || '0');

    if (!width || !height || !blurhash) {
      return NextResponse.json({ error: 'missing metadata' }, { status: 400 });
    }

    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length === 0 || buf.length > 3_000_000) {
      return NextResponse.json({ error: 'file too large (max 3MB after processing)' }, { status: 400 });
    }

    const svc = supabaseService();
    const ext = 'webp';
    const objectName = `u/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await svc.storage.from(process.env.SUPABASE_BUCKET!).upload(objectName, buf, {
      contentType: 'image/webp',
      upsert: false,
    });
    if (error) throw error;

    const { data: pub } = svc.storage.from(process.env.SUPABASE_BUCKET!).getPublicUrl(objectName);
    const image_url = pub.publicUrl;

    return NextResponse.json({
      image_url, width, height, blurhash, hasFaces: faces, nsfwScore: nsfw
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'upload failed' }, { status: 400 });
  }
}
