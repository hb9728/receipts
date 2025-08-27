'use client';

import useSWRInfinite from 'swr/infinite';
import { useRef, useEffect } from 'react';
import { PostCard } from '@/components/PostCard';
import { NewPost } from '@/components/NewPost';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function HomePage() {
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(
    (index, prev) => {
      if (prev && !prev.nextCursor) return null;
      const cursor = prev?.nextCursor ? `?cursor=${prev.nextCursor}` : '';
      return `/api/feed${cursor}`;
    },
    fetcher,
    { revalidateOnFocus: false }
  );

  const posts = data?.flatMap((d: any) => d.items) ?? [];
  const isEnd = data && data[data.length - 1]?.nextCursor == null;

  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isValidating && !isEnd) setSize(s => s + 1);
    }, { threshold: 1 });
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, [isValidating, isEnd, setSize]);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">receipts</h1>
      <p className="text-sm text-neutral-400">anonymous image + caption. no names, no doxxing. faces auto-blurred.</p>

      <NewPost onPosted={() => { mutate(); }} />

      <div className="space-y-3">
        {posts.map((p: any) => <PostCard key={p.id} post={p} />)}
        {error && <div className="text-red-400 text-sm">failed to load feed.</div>}
      </div>

      <div ref={sentinel} className="py-6 text-center text-neutral-500">
        {isEnd ? 'no more posts' : 'loading…'}
      </div>
    </main>
  );
}
