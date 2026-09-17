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

export async function shareResult(deck: number, score: number, total: number): Promise<void> {
  const blob = await renderResultCard(deck, score, total);
  const file = new File([blob], `deste-${deck}.png`, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Deste ${deck}: ${score}/${total}` });
      return;
    } catch (err) {
      // kullanici vazgectiyse sessizce gec
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}
