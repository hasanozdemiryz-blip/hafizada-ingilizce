/**
 * mnemonik-aday-havuzu.xlsx -> content/cards.json
 *
 * Tablo icerigin tek kaynagi. Bu script onu uygulamanin okudugu
 * normalize JSON'a cevirir ve veriyi dogrular.
 *
 * Kullanim: npm run import:cards
 */
import ExcelJS from 'exceljs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'mnemonik-aday-havuzu.xlsx');
const OUT = resolve(ROOT, 'content/cards.json');

const COL = { no: 1, en: 2, tr: 3, hook: 4, sentence: 5, klass: 6, imageNote: 7, decision: 8 };

const text = (cell) => String(cell?.text ?? cell?.value ?? '').trim();

/** "Tutan" -> "tutan", "Kurtarılabilir" -> "kurtarilabilir" */
function normalizeKlass(raw) {
  const s = raw.toLocaleLowerCase('tr');
  if (s.startsWith('tutan')) return 'tutan';
  if (s.startsWith('kurtar')) return 'kurtarilabilir';
  return null;
}

/** Ingilizce kelimeden URL/dosya guvenli id. Cakisma olursa -2, -3 eklenir. */
function makeId(en, taken) {
  const base = en.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kart';
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SRC);

const sheet = wb.getWorksheet('Aday Havuzu');
if (!sheet) throw new Error("'Aday Havuzu' sayfasi bulunamadi");

const cards = [];
const problems = [];
const decisions = new Map();
const taken = new Set();

sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return; // baslik satiri

  const en = text(row.getCell(COL.en));
  if (!en) return; // bos satir

  const tr = text(row.getCell(COL.tr));
  const hook = text(row.getCell(COL.hook));
  const sentence = text(row.getCell(COL.sentence));
  const klassRaw = text(row.getCell(COL.klass));
  const imageNote = text(row.getCell(COL.imageNote));
  const decision = text(row.getCell(COL.decision));

  const klass = normalizeKlass(klassRaw);
  const where = `satir ${rowNumber} (${en})`;

  if (!tr) problems.push(`${where}: Anlam (TR) bos`);
  if (!hook) problems.push(`${where}: Ses Kancasi bos`);
  if (!sentence) problems.push(`${where}: Mnemonik Cumle bos`);
  if (!imageNote) problems.push(`${where}: Kart Gorseli Notu bos`);
  if (!klass) problems.push(`${where}: Sinif taninmadi ("${klassRaw}")`);

  decisions.set(decision || '(bos)', (decisions.get(decision || '(bos)') ?? 0) + 1);

  cards.push({
    id: makeId(en, taken),
    order: cards.length + 1, // siklik sirasi: tablodaki sira korunur
    en,
    tr,
    hook,
    sentence,
    imageNote,
    klass: klass ?? 'kurtarilabilir',
    decision: decision || null,
    image: null, // Faz 2'de doldurulacak
  });
});

// --- Dogrulama raporu ---
const tutan = cards.filter((c) => c.klass === 'tutan');
const kurtarilabilir = cards.filter((c) => c.klass === 'kurtarilabilir');

const dupeEn = [...cards.reduce((m, c) => m.set(c.en, (m.get(c.en) ?? 0) + 1), new Map())]
  .filter(([, n]) => n > 1)
  .map(([en, n]) => `${en} x${n}`);

console.log('--- ICE AKTARIM ---');
console.log(`Toplam aday       : ${cards.length}`);
console.log(`  Tutan           : ${tutan.length}`);
console.log(`  Kurtarilabilir  : ${kurtarilabilir.length}`);
console.log(`Siklik sirasi     : 1..${cards.length} (tablo sirasi korundu)`);
console.log(`Tekrar eden kelime: ${dupeEn.length ? dupeEn.join(', ') : 'yok'}`);
console.log('"Senin Kararin" dagilimi:');
for (const [k, n] of decisions) console.log(`  ${k}: ${n}`);

if (problems.length) {
  console.log(`\n!! ${problems.length} eksik alan:`);
  for (const p of problems.slice(0, 30)) console.log(`   ${p}`);
  if (problems.length > 30) console.log(`   ... ve ${problems.length - 30} tane daha`);
} else {
  console.log('\nEksik alan yok.');
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(cards, null, 2) + '\n', 'utf8');
console.log(`\nYazildi -> content/cards.json (${cards.length} kart)`);
