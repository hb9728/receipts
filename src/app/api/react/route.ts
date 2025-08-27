import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseService } from '@/lib/supabase';
import { getDeviceHash } from '@/lib/cookies';

export const runtime = 'nodejs';

const schema = z.object({
  postId: z.string().uuid(),
  kind: z.enum(['fire','lol','wow','mad'])
});

export async function POST(req: NextRequest) {
  try {
    const { postId, kind } = schema.parse(await req.json());
    const device_id = getDeviceHash();
    const svc = supabaseService();

    const { error: rxErr } = await svc.from('reactions').insert({ post_id: postId, device_id, kind });
    if (rxErr && !`${rxErr.message}`.includes('duplicate key')) throw rxErr;

    // increment via rpc
    const col = `reaction_${kind}`;
    const { error: upErr } = await svc.rpc('increment_reaction', { p_post_id: postId, p_col: col });
    if (upErr) throw upErr;

    const { data, error } = await svc.from('posts')
      .select('reaction_fire,reaction_lol,reaction_wow,reaction_mad')
      .eq('id', postId).single();
    if (error) throw error;

    await svc.from('events').insert({ event: 'reaction_added', device_id, meta: { postId, kind } });

    return NextResponse.json({ ok: true, counts: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'error' }, { status: 400 });
  }
}
