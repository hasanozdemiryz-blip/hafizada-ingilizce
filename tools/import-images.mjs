/**
 * Kart gorsellerini iceri alir.
 *
 *   gorseller/<kart-id>.<png|jpg|webp|...>  ->  src/assets/cards/<kart-id>.webp
 *
 * Kod veya JSON duzenlemeye GEREK YOK: content.ts `src/assets/cards/` icini
 * glob'luyor, dosya adi kart id'si oldugu surece kart kendiliginde baglanir.
 *
 * Kullanim:
 *   npm run import:images              gorseller/ klasorunu isler
 *   npm run import:images -- --brief   gorseli olmayan kartlarin brief'ini dokar
 *   npm run import:images -- <klasor>  baska bir klasor
 */
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const HEDEF = join(ROOT, 'src/assets/cards');

/** Kartin gorsel yuvasi 4:3. Genislik 800: retina telefonda da net. */
const GENISLIK = 800;
const YUKSEKLIK = 600;
const KALITE = 82;

const KABUL = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tif', '.tiff']);

/**
 * KENDI CERCEVESIYLE gelen cizimler.
 *
 * Model bu gorselleri tuvalin ortasina, etrafinda genis bos pay birakan bir
 * yuvarlak dikdortgen icine cizdi. `cover` o payi oldugu gibi koruduğu icin
 * kart yuvasinda cizim kucuk ve dar goruluyordu — `dark` (dar sokak) yan
 * yana dizilince 100 kartin icinde tek basina ayriksi duruyordu.
 *
 * Burada once icerigin sinir kutusu bulunuyor, sonra kutu 4:3'e
 * GENISLETILIYOR — kirpilmiyor. Pay gercek piksellerden geliyor (kenarda
 * yeterli bosluk var), uydurma zemin eklenmiyor, cizimden de bir sey
 * kesilmiyor.
 *
 * Liste ELLE tutuluyor cunku kural her gorsele uygulanamaz: kartlarin
 * cogunda zemin duz bir renkle kenardan kenara doluyor ve orada "icerik
 * kutusu" cizimin KENDISI olur; kirpmak onlari yakinlastirip bozardi.
 */
const CERCEVELI = new Set(['dark']);

/** Kenar seridinin ortanca rengi — cercevenin zemini. */
function zeminRengi(data, W, H, C) {
  const ks = [];
  for (let x = 0; x < W; x += 5) {
    for (const y of [0, 1, 2, H - 3, H - 2, H - 1]) {
      const i = (y * W + x) * C;
      ks.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  return [0, 1, 2].map((k) => {
    const a = ks.map((c) => c[k]).sort((x, y) => x - y);
    return a[a.length >> 1];
  });
}

/**
 * Cerceveyi atip 4:3'e genisletilmis kirpma kutusunu dondurur.
 * Kutu tuvali tasarsa oldugu gibi birakilir — `cover` gerisini halleder.
 */
async function cerceveKutusu(yol) {
  const { data, info } = await sharp(yol).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const BG = zeminRengi(data, W, H, C);

  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const d = Math.max(
        Math.abs(data[i] - BG[0]),
        Math.abs(data[i + 1] - BG[1]),
        Math.abs(data[i + 2] - BG[2]),
      );
      if (d <= 12) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null; // bos gorsel — dokunma

  const bh = y1 - y0 + 1;
  const hedefEn = Math.round((bh * GENISLIK) / YUKSEKLIK);
  const merkez = (x0 + x1) / 2;
  const sol = Math.round(merkez - hedefEn / 2);

  if (sol < 0 || sol + hedefEn > W) return null; // pay yetmiyor — `cover` kalsin
  return { left: sol, top: y0, width: hedefEn, height: bh };
}

const kartlar = JSON.parse(
  await import('node:fs/promises').then((fs) => fs.readFile(join(ROOT, 'content/cards.json'), 'utf8')),
).filter((c) => c.klass === 'tutan');

const idler = new Map(kartlar.map((c) => [c.id, c]));

const args = process.argv.slice(2);
const briefModu = args.includes('--brief');
const kaynak = resolve(ROOT, args.find((a) => !a.startsWith('--')) ?? 'gorseller');

const mevcut = existsSync(HEDEF)
  ? new Set((await readdir(HEDEF)).filter((f) => f.endsWith('.webp')).map((f) => basename(f, '.webp')))
  : new Set();

// --- Brief modu: uretime verilecek liste ---
if (briefModu) {
  const eksik = kartlar.filter((c) => !mevcut.has(c.id));
  const satirlar = eksik.map((c) => `${c.id}\t${c.en} (${c.tr}) ≈ ${c.hook}\t${c.imageNote}`);
  const yol = join(ROOT, 'gorsel-brief.tsv');
  await writeFile(yol, `id\tkelime\tbrief\n${satirlar.join('\n')}\n`);
  console.log(`${eksik.length} kartin brief'i yazildi: ${yol}`);
  console.log('Uretilen dosyalari `gorseller/<id>.png` olarak kaydet, sonra:');
  console.log('  npm run import:images');
  process.exit(0);
}

if (!existsSync(kaynak)) {
  console.error(`Klasor yok: ${kaynak}`);
  console.error('Once `npm run import:images -- --brief` ile brief listesini al.');
  process.exit(1);
}

await mkdir(HEDEF, { recursive: true });

const dosyalar = (await readdir(kaynak)).filter((f) => KABUL.has(extname(f).toLowerCase()));
const eklenen = [];
const taninmayan = [];

for (const dosya of dosyalar) {
  const id = basename(dosya, extname(dosya));
  if (!idler.has(id)) {
    taninmayan.push(dosya);
    continue;
  }
  const yol = join(kaynak, dosya);
  const kutu = CERCEVELI.has(id) ? await cerceveKutusu(yol) : null;
  const is = sharp(yol);
  if (kutu) is.extract(kutu);
  await is
    .resize(GENISLIK, YUKSEKLIK, { fit: 'cover', position: 'attention' })
    .webp({ quality: KALITE })
    .toFile(join(HEDEF, `${id}.webp`));
  eklenen.push(id + (kutu ? ' [çerçeve atıldı]' : ''));
}

const toplam = new Set([...mevcut, ...eklenen]);
const eksik = kartlar.filter((c) => !toplam.has(c.id));

console.log(`Eklenen: ${eklenen.length}${eklenen.length ? ` (${eklenen.join(', ')})` : ''}`);
if (taninmayan.length) {
  console.log(`\nTANINMAYAN (dosya adi kart id'si olmali): ${taninmayan.join(', ')}`);
}
console.log(`\nDurum: ${toplam.size} / ${kartlar.length} kartin gorseli var.`);
if (eksik.length) {
  console.log(`Eksik: ${eksik.slice(0, 12).map((c) => c.id).join(', ')}${eksik.length > 12 ? ` … +${eksik.length - 12}` : ''}`);
}
