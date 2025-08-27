import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseService } from '@/lib/supabase';
import { getDeviceHash } from '@/lib/cookies';

export const runtime = 'nodejs';

const schema = z.object({
  postId: z.string().uuid(),
  reason: z.string().max(200).optional()
});

export async function POST(req: NextRequest) {
  try {
    const { postId, reason } = schema.parse(await req.json());
    const device_id = getDeviceHash();
    const svc = supabaseService();

    const { error } = await svc.from('reports').insert({ post_id: postId, device_id, reason: reason ?? null });
    if (error && !`${error.message}`.includes('duplicate key')) throw error;

    const { data: post } = await svc.from('posts').select('reports_count').eq('id', postId).single();
    const newCount = (post?.reports_count ?? 0) + 1;
    const hide = newCount >= 5;
    await svc.from('posts').update({ reports_count: newCount, is_hidden: hide }).eq('id', postId);

    await svc.from('events').insert({ event: 'report_submitted', device_id, meta: { postId } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'error' }, { status: 400 });
  }
}
