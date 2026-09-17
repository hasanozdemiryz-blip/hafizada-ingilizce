/**
 * public/icon.svg -> PWA ikonlari (PNG).
 * Vektor rasterlestirme; uretim degil, donusum.
 *
 * Kullanim: npm run icons
 */
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const svg = await readFile(resolve(PUBLIC, 'icon.svg'), 'utf8');

/** Maskable ikonlar guvenli alan ister: mark %80'e kuculur, zemin tasar. */
const maskable = svg
  .replace('<rect width="512" height="512" rx="112" fill="#1c1917"/>', '<rect width="512" height="512" fill="#1c1917"/>')
  .replace('viewBox="0 0 512 512"', 'viewBox="-64 -64 640 640"');

const targets = [
  { name: 'icon-192.png', size: 192, source: svg },
  { name: 'icon-512.png', size: 512, source: svg },
  { name: 'icon-512-maskable.png', size: 512, source: maskable },
  { name: 'apple-touch-icon.png', size: 180, source: svg },
];

for (const { name, size, source } of targets) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(resolve(PUBLIC, name), png);
  console.log(`${name}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`);
}
