/**
 * public/icon.svg -> PWA ikonlari (PNG).
 * Vektor rasterlestirme; uretim degil, donusum.
 *
 * Logo tuvalinde bos kenar payi olabilir; ikon icin isaret tuvali
 * doldurmali. O yuzden once gercek sinirlar olculup viewBox daraltilir.
 *
 * Kullanim: npm run icons
 */
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '../public');

/** Maskable ikonun kenarlara tasan zemini — logonun mavisi */
const BLEED = '#3f92f5';
/** Maskable guvenli alan: isaret tuvalin %78'ini kaplar */
const SAFE = 0.78;

const svg = await readFile(resolve(PUBLIC, 'icon.svg'), 'utf8');

/** Kok <svg ...> etiketini ve ic icerigi ayir */
function parcala(s) {
  const m = s.match(/<svg\b[^>]*>/i);
  if (!m) throw new Error('svg kok etiketi bulunamadi');
  const ic = s.slice(m.index + m[0].length, s.lastIndexOf('</svg>'));
  const vb = m[0].match(/viewBox="([^"]+)"/i);
  if (!vb) throw new Error('viewBox yok');
  const [x, y, w, h] = vb[1].trim().split(/\s+/).map(Number);
  return { ic, kutu: { x, y, w, h } };
}

const { ic, kutu } = parcala(svg);

/** Isaretin gercek sinirlari (bos kenar payi atilir) */
const olcu = new Resvg(svg, { fitTo: { mode: 'width', value: kutu.w } });
const bb = olcu.getBBox();
const sinir = bb
  ? { x: bb.x, y: bb.y, w: bb.width, h: bb.height }
  : { x: kutu.x, y: kutu.y, w: kutu.w, h: kutu.h };

/** Kareye tamamla — ikonlar kare */
const kenar = Math.max(sinir.w, sinir.h);
const kare = {
  x: sinir.x - (kenar - sinir.w) / 2,
  y: sinir.y - (kenar - sinir.h) / 2,
  k: kenar,
};

const kirpilmis = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${kare.x} ${kare.y} ${kare.k} ${kare.k}">${ic}</svg>`;

/** Maskable: koseleri kirpilabilecegi icin zemin tasar, isaret kuculur */
const bosluk = (kare.k * (1 / SAFE - 1)) / 2;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${kare.k} ${kare.k}">
  <rect width="${kare.k}" height="${kare.k}" fill="${BLEED}"/>
  <svg x="${bosluk}" y="${bosluk}" width="${kare.k - bosluk * 2}" height="${kare.k - bosluk * 2}" viewBox="${kare.x} ${kare.y} ${kare.k} ${kare.k}">${ic}</svg>
</svg>`;

const hedefler = [
  { ad: 'icon-192.png', boy: 192, kaynak: kirpilmis },
  { ad: 'icon-512.png', boy: 512, kaynak: kirpilmis },
  { ad: 'icon-512-maskable.png', boy: 512, kaynak: maskable },
  { ad: 'apple-touch-icon.png', boy: 180, kaynak: maskable }, // iOS koseleri kendi yuvarlar
];

for (const { ad, boy, kaynak } of hedefler) {
  const png = new Resvg(kaynak, { fitTo: { mode: 'width', value: boy } }).render().asPng();
  await writeFile(resolve(PUBLIC, ad), png);
  console.log(`${ad}  ${boy}x${boy}  ${(png.length / 1024).toFixed(1)} KB`);
}
