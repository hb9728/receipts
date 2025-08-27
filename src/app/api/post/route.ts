import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseService } from '@/lib/supabase';
import { getDeviceHash, getIpHash } from '@/lib/cookies';
import { redactPII, isLikelyMinorDisclosure } from '@/lib/moderation';

export const runtime = 'nodejs';

const schema = z.object({
  body: z.string().max(280).optional().default(''),
  image: z.object({ url: z.string().url() }).optional()
});

async function checkCooldown(svc: ReturnType<typeof supabaseService>, device: string) {
  const { data } = await svc.from('ratelimits').select('*').eq('device_id', device).maybeSingle();
  if (!data) return false;
  const diff = Date.now() - new Date(data.last_post_at).getTime();
  return diff < 30_000;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { body, image } = schema.parse(json);

    if ((body?.trim().length ?? 0) === 0 && !image) {
      return NextResponse.json({ error: 'add a caption or an image' }, { status: 400 });
    }
    if (isLikelyMinorDisclosure(body ?? '')) {
      return NextResponse.json({ error: 'content may identify a minor. please reword.' }, { status: 400 });
    }

    const device_id = getDeviceHash();
    const ip_hash = getIpHash();
    const svc = supabaseService();

    if (await checkCooldown(svc, device_id)) {
      return NextResponse.json({ error: 'whoa there — try again in a few seconds.' }, { status: 429 });
    }

    const safeText = body ? redactPII(body) : '';

    const { error } = await svc.from('posts').insert({
      device_id, ip_hash,
      body: body ?? '',
      body_redacted: safeText,
      image_url: image?.url ?? null
    });
    if (error) throw error;

    await svc.from('ratelimits').upsert({ device_id, last_post_at: new Date().toISOString() });
    await svc.from('events').insert({ event: 'post_created', device_id, meta: { hasImage: !!image } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'error' }, { status: 400 });
  }
}
