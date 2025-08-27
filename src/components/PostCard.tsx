'use client';

import { useState } from 'react';

type Post = {
  id: string;
  created_at: string;
  body_redacted: string;
  reaction_fire: number;
  reaction_lol: number;
  reaction_wow: number;
  reaction_mad: number;
  image_url?: string | null;
  image_w?: number | null;
  image_h?: number | null;
};

export function PostCard({ post }: { post: Post }) {
  const [local, setLocal] = useState(post);

  async function react(kind: 'fire'|'lol'|'wow'|'mad') {
    const res = await fetch('/api/react', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postId: post.id, kind })
    });
    if (res.ok) {
      const j = await res.json();
      setLocal({ ...local, ...j.counts });
    }
  }

  async function report() {
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postId: post.id })
    });
    if (res.ok) alert('thanks — our mods will review this.');
  }

  const ratio = local.image_w && local.image_h ? (local.image_h / local.image_w) : 0;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      {local.image_url && (
        <div className="mb-3">
          <div className="w-full overflow-hidden rounded-lg border border-neutral-800" style={{ aspectRatio: ratio ? `${local.image_w}/${local.image_h}` : undefined }}>
            <img src={local.image_url} alt="receipt image" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
      {local.body_redacted && <p className="whitespace-pre-wrap leading-relaxed">{local.body_redacted}</p>}

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex gap-3">
          <button onClick={() => react('fire')} className="opacity-80 hover:opacity-100">🔥 {local.reaction_fire}</button>
          <button onClick={() => react('lol')}  className="opacity-80 hover:opacity-100">😂 {local.reaction_lol}</button>
          <button onClick={() => react('wow')}  className="opacity-80 hover:opacity-100">😮 {local.reaction_wow}</button>
          <button onClick={() => react('mad')}  className="opacity-80 hover:opacity-100">😡 {local.reaction_mad}</button>
        </div>
        <button onClick={report} className="text-xs text-neutral-400 hover:text-red-400">report</button>
      </div>
    </div>
  );
}
