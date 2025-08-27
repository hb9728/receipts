'use client';

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { processImage } from '@/lib/image/processImage';

type Uploaded = {
  image_url: string; width: number; height: number; blurhash: string; hasFaces: boolean; nsfwScore: number;
};

export function NewPost({ onPosted }: { onPosted?: () => void }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    setFileName(f.name);
    try {
      setUploading(true);
      // client-side sanitize
      const res = await processImage(f);
      // send to server
      const q = new URLSearchParams({
        w: String(res.width),
        h: String(res.height),
        bh: res.blurhash,
        f: res.hasFaces ? '1' : '0',
        n: String(res.nsfwScore)
      });
      const up = await fetch(`/api/upload-image?${q.toString()}`, {
        method: 'POST',
        body: res.blob
      });
      const j = await up.json();
      if (!up.ok) throw new Error(j.error || 'upload failed');
      setUploaded(j);
    } catch (e: any) {
      setErr(e.message || 'could not process image');
      setUploaded(null);
      setFileName(null);
      (e as any).stack; // noop
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!body.trim() && !uploaded) {
      setErr('add a caption or an image');
      return;
    }
    setBusy(true); setErr(null);
    const res = await fetch('/api/post', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        body: body.trim(),
        image: uploaded ? {
          url: uploaded.image_url,
          w: uploaded.width,
          h: uploaded.height,
          blurhash: uploaded.blurhash,
          hasFaces: uploaded.hasFaces,
          nsfwScore: uploaded.nsfwScore
        } : undefined
      })
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setBody('');
      setUploaded(null);
      setFileName(null);
      onPosted?.();
    } else {
      setErr(j.error || 'failed to post');
    }
    setBusy(false);
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3">
      <Textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="add a caption (keep it safe: no names, no doxxing)."
        className="min-h-[90px] resize-none"
        maxLength={280}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-sm text-neutral-300 hover:text-white">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            attach image
          </label>
          {fileName && (
            <span className="text-xs text-neutral-400">
              {uploading ? 'processing…' : `attached: ${fileName}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>{280 - body.length} left</span>
          {err && <span className="text-red-400">{err}</span>}
          <Button disabled={busy || uploading} onClick={submit} size="sm">
            {busy ? 'posting…' : 'post'}
          </Button>
        </div>
      </div>
      {uploaded?.image_url && (
        <div className="mt-3">
          <img
            src={uploaded.image_url}
            alt=""
            className="w-full rounded-lg border border-neutral-800"
          />
          <div className="mt-1 text-[11px] text-neutral-500">
            faces auto-blurred. adult content blocked.
          </div>
        </div>
      )}
    </div>
  );
}
