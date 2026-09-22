/**
 * Deste testi sonucunu paylasilabilir bir goresele cevirir.
 * Gelir modeli kitle uzerinden oldugu icin paylasim bir ozellik degil,
 * dagitim kanali. (Kart paylasimi gorseller gelince — Faz 2/4.)
 */
import { dosyayiVer } from './dosya';

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
 * Panoya sigan kanca sayisi.
 *
 * Kural: seti bitiren kullanicinin paylastigi sey EKSIKSIZ olsun.
 *
 * BU SINIR DORT KEZ GERIDE KALDI. Once 24'tu ve baslik `pairs.length`
 * yaziyordu (26 diyen bir panoda 24 satir); 26'ya cekildi, set 51 oldu;
 * 60'a cekildi, set 100 oldu. Her seferinde kullanici ekranda bir sayi
 * okuyup baska bir sayi yazan gorseli paylasti — hem de urunun tek
 * dagitim kanalinda.
 *
 * Sayiyi buyutmek tek basina yetmiyor, cunku hata sayinin kendisinde
 * degil: set buyudugunde hicbir sey uyarmiyordu. `share.test.ts` artik
 * `PANO_MAX >= CARDS.length` diye tutuyor — sinir geride kalirsa test
 * duser, kullanici degil.
 *
 * 104 = 4 sutun x 26 satir, duzenin cizebildigi en buyuk pano.
 */
export const PANO_MAX = 104;

/**
 * Kanca sayisina gore sutun ve punto.
 * 1350 piksel yukseklikte 26 satir 33 puntoyla rahat duruyor; uzeri
 * sikisiyor, o yuzden sutun sayisi artiyor ve yazi kuculuyor.
 *
 * Dort sutunda bir hucre 235 piksel; setin en uzun cifti
 * (`speed -> spidometre`, 15 harf) 20 puntoda ~180 piksel tutuyor, yani
 * sigiyor. Daha kucuk punto denenmedi — telefonda okunmayan bir pano
 * paylasilmaz.
 */
function duzen(adet: number) {
  if (adet <= 26) return { sut: 2, kelime: 33, ok: 28, yukseklik: 38, ust: 28 };
  if (adet <= 40) return { sut: 3, kelime: 28, ok: 23, yukseklik: 33, ust: 24 };
  if (adet <= 60) return { sut: 3, kelime: 24, ok: 20, yukseklik: 29, ust: 21 };
  return { sut: 4, kelime: 20, ok: 17, yukseklik: 25, ust: 18 };
}

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

  const d = duzen(goster.length);
  const sut = d.sut;
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
    ctx.font = `700 ${d.kelime}px ${YAZI}`;
    ctx.fillStyle = '#16233a';
    const enW = ctx.measureText(p.en).width;
    ctx.fillText(p.en, x, y);

    ctx.fillStyle = '#9fadc2';
    ctx.font = `400 ${d.ok}px ${YAZI}`;
    ctx.fillText(' ≈ ', x + enW + 6, y);
    const okW = ctx.measureText(' ≈ ').width;

    // kanca: fosforlu kalem izi
    ctx.font = `700 ${d.kelime}px ${YAZI}`;
    const hx = x + enW + 12 + okW;
    const hw = ctx.measureText(p.hook).width;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.roundRect(hx - 8, y - d.ust, hw + 16, d.yukseklik, 10);
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
  await dosyayiVer(await renderHookBoard(pairs), 'kanca-panosu.png', `${sayi} kelime, ${sayi} kanca`);
}


