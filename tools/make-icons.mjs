/**
 * brand/kilit-kaynak.png (isaret + isim, seffaf) -> markanin tum turevleri.
 *
 * Tek kaynak dosyadan uretilir ki uygulama simgesi ile sosyal medyadaki
 * kilit ayni isareti tasisin. Uretim degil, kirpma/olcekleme.
 *
 * Uretilenler:
 *   public/icon-192.png, icon-512.png, icon-512-maskable.png,
 *   public/apple-touch-icon.png      -> PWA / cihaz simgeleri
 *   brand/logo-isaret.png            -> kare isaret (profil foto, filigran)
 *   brand/kilit.png                  -> kirpilmis kilit (sosyal medya)
 *   src/assets/brand/kilit.webp      -> uygulama basligi
 *
 * Kullanim: npm run icons
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const y = (...p) => resolve(KOK, ...p);

/** Maskable ikonun kenarlara tasan zemini — rozetin mavisi */
const ZEMIN = { r: 0x3f, g: 0x92, b: 0xf5, alpha: 1 };
/** Maskable guvenli alan: isaret tuvalin %78'ini kaplar */
const GUVENLI = 0.78;

const kaynak = sharp(y('brand/kilit-kaynak.png'));
const { width: W, height: H } = await kaynak.metadata();

/** Alfa kanalindan dolu sutunlari cikar */
const alfa = await kaynak.clone().ensureAlpha().extractChannel('alpha').raw().toBuffer();
const doluSutun = new Array(W).fill(false);
const doluSatir = new Array(H).fill(false);
for (let satir = 0; satir < H; satir++) {
  for (let sutun = 0; sutun < W; sutun++) {
    if (alfa[satir * W + sutun] > 12) {
      doluSutun[sutun] = true;
      doluSatir[satir] = true;
    }
  }
}

const ilk = (a) => a.indexOf(true);
const son = (a) => a.lastIndexOf(true);

/**
 * Rozet, soldaki ilk kesintisiz dolu sutun bloku.
 * Onunla yazi arasinda tamamen bos bir seritten yararlaniyoruz.
 */
const solKenar = ilk(doluSutun);
let sagKenar = solKenar;
while (sagKenar + 1 < W && doluSutun[sagKenar + 1]) sagKenar++;

const ustKenar = ilk(doluSatir);
const altKenar = son(doluSatir);

// Rozeti kareye tamamla
const gen = sagKenar - solKenar + 1;
const yuk = altKenar - ustKenar + 1;
const kenar = Math.max(gen, yuk);
const isaret = {
  left: Math.max(0, Math.round(solKenar - (kenar - gen) / 2)),
  top: Math.max(0, Math.round(ustKenar - (kenar - yuk) / 2)),
  width: kenar,
  height: kenar,
};

console.log(`kaynak ${W}x${H} · isaret ${isaret.width}x${isaret.height} @ ${isaret.left},${isaret.top}`);

await mkdir(y('src/assets/brand'), { recursive: true });

const isaretPng = await sharp(y('brand/kilit-kaynak.png')).extract(isaret).png().toBuffer();
await sharp(isaretPng).toFile(y('brand/logo-isaret.png'));

/** Duz ikon: isaret tuvali doldurur */
async function duz(ad, boy) {
  await sharp(isaretPng).resize(boy, boy, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(y('public', ad));
  console.log(`  ${ad}  ${boy}x${boy}`);
}

/** Maskable: koseler kirpilabilir, zemin tasar ve isaret kuculur */
async function maskable(ad, boy) {
  const ic = Math.round(boy * GUVENLI);
  const kucuk = await sharp(isaretPng).resize(ic, ic).png().toBuffer();
  await sharp({ create: { width: boy, height: boy, channels: 4, background: ZEMIN } })
    .composite([{ input: kucuk, left: Math.round((boy - ic) / 2), top: Math.round((boy - ic) / 2) }])
    .png()
    .toFile(y('public', ad));
  console.log(`  ${ad}  ${boy}x${boy}  (zemin tasan)`);
}

await duz('icon-192.png', 192);
await duz('icon-512.png', 512);
await maskable('icon-512-maskable.png', 512);
await maskable('apple-touch-icon.png', 180);

/** Kilit: seffaf kenar paylari atilmis hali */
const kilit = { left: solKenar, top: ustKenar, width: son(doluSutun) - solKenar + 1, height: yuk };
await sharp(y('brand/kilit-kaynak.png')).extract(kilit).png().toFile(y('brand/kilit.png'));
await sharp(y('brand/kilit-kaynak.png')).extract(kilit).resize({ width: 720 }).webp({ quality: 92 }).toFile(y('src/assets/brand/kilit.webp'));
console.log(`  brand/logo-isaret.png · brand/kilit.png · src/assets/brand/kilit.webp`);
