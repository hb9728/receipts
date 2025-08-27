import { NextRequest, NextResponse } from 'next/server';
import { supabaseAnon } from '@/lib/supabase';

export const runtime = 'edge';
const PAGE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');

  let query = supabaseAnon.from('posts')
    .select('id,created_at,body_redacted,reaction_fire,reaction_lol,reaction_wow,reaction_mad,is_hidden,image_url,image_w,image_h,image_blurhash')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(PAGE + 1);

  if (cursor) {
    const [ts] = cursor.split('|');
    query = query.lt('created_at', ts);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).slice(0, PAGE);
  const nextCursor = (data ?? []).length > PAGE
    ? `${items[items.length - 1].created_at}|${items[items.length - 1].id}`
    : null;

  return NextResponse.json({ items, nextCursor });
}
