/**
 * Deste testi sonucunu paylasilabilir bir goresele cevirir.
 * Gelir modeli kitle uzerinden oldugu icin paylasim bir ozellik degil,
 * dagitim kanali. (Kart paylasimi gorseller gelince — Faz 2/4.)
 */
const W = 1080;
const H = 1350; // 4:5

export function renderResultCard(deck: number, score: number, total: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#faf7f2';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#b4451f';
  ctx.fillRect(0, 0, W, 14);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#a8a29e';
  ctx.font = '600 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`DESTE ${deck}`, W / 2, 260);

  ctx.fillStyle = '#1c1917';
  ctx.font = '700 260px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${score}/${total}`, W / 2, 620);

  ctx.fillStyle = '#57534e';
  ctx.font = '400 46px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${deck * 10} kelime, ezbersiz.`, W / 2, 740);

  ctx.fillStyle = '#1c1917';
  ctx.font = '600 44px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Hafızada İngilizce', W / 2, H - 150);

  ctx.fillStyle = '#a8a29e';
  ctx.font = '400 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('her kelime bir görüntüye bağlı', W / 2, H - 92);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Görsel üretilemedi'))), 'image/png');
  });
}

/**
 * Kanca panosu — ogrenilen kelimelerin kancalari tek gorselde.
 * Bu, baskasinin kopyalayamayacagi icerik: kancalar bize ait.
 */
export function renderHookBoard(pairs: { en: string; hook: string }[]): Promise<Blob> {
  const goster = pairs.slice(0, 24);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const zemin = ctx.createLinearGradient(0, 0, 0, H);
  zemin.addColorStop(0, '#e3edfb');
  zemin.addColorStop(1, '#f3f7fd');
  ctx.fillStyle = zemin;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#16233a';
  ctx.font = '700 62px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${pairs.length} kelime, ${pairs.length} kanca`, W / 2, 150);

  ctx.fillStyle = '#5c6b85';
  ctx.font = '400 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('ezberlemedim — bağladım', W / 2, 205);

  const sut = 2;
  const satir = Math.ceil(goster.length / sut);
  const gx = 70;
  const gy = 280;
  const gw = (W - gx * 2) / sut;
  const gh = Math.min(74, (H - gy - 220) / Math.max(satir, 1));

  goster.forEach((p, i) => {
    const c = i % sut;
    const r = Math.floor(i / sut);
    const x = gx + c * gw;
    const y = gy + r * gh;

    ctx.textAlign = 'left';
    ctx.font = '700 33px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#16233a';
    const enW = ctx.measureText(p.en).width;
    ctx.fillText(p.en, x, y);

    ctx.fillStyle = '#9fadc2';
    ctx.font = '400 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(' ≈ ', x + enW + 6, y);
    const okW = ctx.measureText(' ≈ ').width;

    // kanca: fosforlu kalem izi
    ctx.font = '700 33px "Segoe UI", system-ui, sans-serif';
    const hx = x + enW + 12 + okW;
    const hw = ctx.measureText(p.hook).width;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.roundRect(hx - 8, y - 28, hw + 16, 38, 10);
    ctx.fill();
    ctx.fillStyle = '#16233a';
    ctx.fillText(p.hook, hx, y);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#16233a';
  ctx.font = '700 44px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Hafızada İngilizce', W / 2, H - 130);
  ctx.fillStyle = '#9fadc2';
  ctx.font = '400 32px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('her kelime bir görüntüye bağlı', W / 2, H - 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Görsel üretilemedi'))), 'image/png');
  });
}

export async function shareHookBoard(pairs: { en: string; hook: string }[]): Promise<void> {
  await paylas(await renderHookBoard(pairs), 'kanca-panosu.png', `${pairs.length} kelime, ${pairs.length} kanca`);
}

/** Paylasim sayfasini ac; desteklenmiyorsa dosyayi indir. */
async function paylas(blob: Blob, dosyaAdi: string, baslik: string): Promise<void> {
  const file = new File([blob], dosyaAdi, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: baslik });
      return;
    } catch (err) {
      // kullanici vazgectiyse sessizce gec
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareResult(deck: number, score: number, total: number): Promise<void> {
  await paylas(await renderResultCard(deck, score, total), `deste-${deck}.png`, `Deste ${deck}: ${score}/${total}`);
}
