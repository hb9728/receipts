// client-only: resize to max 1600, strip exif via canvas, nsfw check, face blur, blurhash.
// heavy libs load on demand so the main bundle stays light.

export type ProcessResult = {
  blob: Blob;
  width: number;
  height: number;
  blurhash: string;
  hasFaces: boolean;
  nsfwScore: number;
  mime: string;
};

const MAX_DIM = 1600;

export async function processImage(file: File): Promise<ProcessResult> {
  const img = await fileToImage(file);
  const { canvas, ctx, scaleW, scaleH } = makeCanvas(img, MAX_DIM);
  ctx.drawImage(img, 0, 0, scaleW, scaleH);

  const [{ default: Human }, nsfw, blurhash] = await Promise.all([
    import('@vladmandic/human'),
    import('nsfwjs'),
    import('blurhash')
  ]);

  const tf = await import('@tensorflow/tfjs');
  // @ts-expect-error nsfwjs default export
  const nsfwModel = await nsfw.load();
  const nsfwPreds = await nsfwModel.classify(canvas as HTMLCanvasElement);
  const nsfwScore = scoreNSFW(nsfwPreds);
  if (nsfwScore >= 0.75) throw new Error('image appears to be adult content and isn’t allowed.');

  let hasFaces = false;
  try {
    const human = new Human({
      backend: 'wasm',
      modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
      face: { enabled: true, detector: { rotation: true }, mesh: false },
    } as any);
    await human.load();
    await human.warmup();
    const result = await human.detect(canvas as HTMLCanvasElement);
    const faces = result.face ?? [];
    if (faces.length > 0) {
      hasFaces = true;
      faces.forEach((f: any) => {
        const b = f.box;
        blurRect(ctx, b.x, b.y, b.width, b.height, 12);
      });
    }
  } catch {
    // best-effort
  }

  const hash = await canvasToBlurhash(canvas as HTMLCanvasElement, blurhash);

  const mime = 'image/webp';
  const blob: Blob = await new Promise((resolve) =>
    (canvas as HTMLCanvasElement).toBlob(b => resolve(b!), mime, 0.9)
  );

  return { blob, width: scaleW, height: scaleH, blurhash: hash, hasFaces, nsfwScore, mime };
}

function scoreNSFW(preds: Array<{className:string, probability:number}>) {
  let score = 0;
  for (const p of preds) {
    const name = p.className.toLowerCase();
    if (name.includes('porn')) score = Math.max(score, p.probability);
    if (name.includes('sexy')) score = Math.max(score, p.probability * 0.8);
    if (name.includes('hentai')) score = Math.max(score, p.probability * 0.7);
  }
  return score;
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

function makeCanvas(img: HTMLImageElement, limit: number) {
  const ratio = Math.min(1, limit / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx, scaleW: w, scaleH: h };
}

function blurRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d')!;
  cx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);
  ctx.save();
  ctx.filter = `blur(${r}px)`;
  ctx.drawImage(c, x, y);
  ctx.filter = 'none';
  ctx.restore();
}

async function canvasToBlurhash(canvas: HTMLCanvasElement, blurhashLib: any): Promise<string> {
  const w = 32, h = 32;
  const small = document.createElement('canvas');
  small.width = w; small.height = h;
  const sctx = small.getContext('2d')!;
  sctx.drawImage(canvas, 0, 0, w, h);
  const { data } = sctx.getImageData(0, 0, w, h);
  const pixels: number[] = [];
  for (let i = 0; i < data.length; i += 4) pixels.push(data[i], data[i+1], data[i+2]);
  return blurhashLib.encode(new Uint8ClampedArray(pixels), w, h, 4, 4);
}
