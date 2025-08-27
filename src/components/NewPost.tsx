'use client';

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Uploaded = { image_url: string };

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
    setUploading(true);
    try {
      // downscale to max 1600px side; export webp (strips exif). keeps size small.
      const blob = await simpleDownscaleToWebp(f, 1600, 0.85);
      const fd = new FormData();
      fd.append('file', new File([blob], 'upload.webp', { type: 'image/webp' }));
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'upload failed');
      setUploaded(j);
    } catch (e: any) {
      setErr(e.message || 'could not upload image');
      setUploaded(null);
      setFileName(null);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!body.trim() && !uploaded) { setErr('add a caption or an image'); return; }
    setBusy(true); setErr(null);
    const res = await fetch('/api/post', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        body: body.trim(),
        image: uploaded ? { url: uploaded.image_url } : undefined
      })
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setBody(''); setUploaded(null); setFileName(null);
      onPosted?.();
    } else { setErr(j.error || 'failed to post'); }
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
          <img src={uploaded.image_url} alt="" className="w-full rounded-lg border border-neutral-800" />
        </div>
      )}
    </div>
  );
}

/** downscale to maxSide px and return webp blob (no external deps). */
async function simpleDownscaleToWebp(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  const img = await fileToImage(file);
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('encode failed')), 'image/webp', quality)
  );
}
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
