/**
 * Deste testi sonucunu paylasilabilir bir goresele cevirir.
 * Gelir modeli kitle uzerinden oldugu icin paylasim bir ozellik degil,
 * dagitim kanali. (Kart paylasimi gorseller gelince — Faz 2/4.)
 */
const W = 1080;
const H = 1350; // 4:5

const YAZI = "'Nunito', system-ui, sans-serif";

/**
 * Canvas, CSS'in aksine fontun inmesini BEKLEMEZ: hazir degilse sessizce
 * yedek fontla cizer ve paylasilan gorsel markayi tasimaz. O yuzden once
 * yuklenmesi isteniyor.
 *
 * `load`'a metni de veriyoruz — Nunito latin/latin-ext diye ikiye bolunmus
 * durumda ve "Hafızada İngilizce"deki ğ, İ, ş yalnizca latin-ext'te. Metin
 * gecilmezse o dosya hic inmez ve Turkce harfler yedek fonta duser.
 */
const ORNEK = 'Hafızada İngilizce ezbersiz görüntüye bağlı kelime kanca DESTE ≈';

async function fontuHazirla() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(
    [400, 600, 700, 800].map((w) =>
      document.fonts.load(`${w} 100px ${YAZI}`, ORNEK).catch(() => undefined),
    ),
  );
}

/**
 * Panoya sigan kanca sayisi. v1 seti 26 kart oldugu icin tam set tek
 * panoya giriyor — seti bitiren kullanicinin paylastigi sey EKSIKSIZ olsun.
 * (Onceki sinir 24'tu ve baslik yine `pairs.length` yaziyordu: 26 kelime
 * diyen bir panoda 24 satir vardi.)
 */
export const PANO_MAX = 26;

/**
 * Kanca panosu — ogrenilen kelimelerin kancalari tek gorselde.
 * Bu, baskasinin kopyalayamayacagi icerik: kancalar bize ait.
 */
export async function renderHookBoard(pairs: { en: string; hook: string }[]): Promise<Blob> {
  await fontuHazirla();

  const goster = pairs.slice(0, PANO_MAX);
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
  ctx.font = `800 62px ${YAZI}`;
  // Baslik CIZILEN satiri sayar, verilen listeyi degil — pano eksik kalirsa yalan olmasin
  ctx.fillText(`${goster.length} kelime, ${goster.length} kanca`, W / 2, 150);

  ctx.fillStyle = '#5c6b85';
  ctx.font = `400 34px ${YAZI}`;
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
    ctx.font = `700 33px ${YAZI}`;
    ctx.fillStyle = '#16233a';
    const enW = ctx.measureText(p.en).width;
    ctx.fillText(p.en, x, y);

    ctx.fillStyle = '#9fadc2';
    ctx.font = `400 28px ${YAZI}`;
    ctx.fillText(' ≈ ', x + enW + 6, y);
    const okW = ctx.measureText(' ≈ ').width;

    // kanca: fosforlu kalem izi
    ctx.font = `700 33px ${YAZI}`;
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
  ctx.font = `700 44px ${YAZI}`;
  ctx.fillText('Hafızada İngilizce', W / 2, H - 130);
  ctx.fillStyle = '#9fadc2';
  ctx.font = `400 32px ${YAZI}`;
  ctx.fillText('her kelime bir görüntüye bağlı', W / 2, H - 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Görsel üretilemedi'))), 'image/png');
  });
}

export async function shareHookBoard(pairs: { en: string; hook: string }[]): Promise<void> {
  const sayi = Math.min(pairs.length, PANO_MAX);
  await paylas(await renderHookBoard(pairs), 'kanca-panosu.png', `${sayi} kelime, ${sayi} kanca`);
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

