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
  await sharp(join(kaynak, dosya))
    .resize(GENISLIK, YUKSEKLIK, { fit: 'cover', position: 'attention' })
    .webp({ quality: KALITE })
    .toFile(join(HEDEF, `${id}.webp`));
  eklenen.push(id);
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
