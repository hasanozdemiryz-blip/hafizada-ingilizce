/**
 * Profil avatarlari: tek kaynak sayfadan 9 hayvan.
 *
 *   brand/avatar-sayfasi.png -> src/assets/avatarlar/<hayvan>.webp
 *
 * Fotograf yuklemek istemeyen — ki cogunluk oyle — hazir bir avatar
 * secebilsin diye. Dokuz hayvan, `profil.ts` icindeki `HAYVANLAR`
 * listesiyle AYNI: otomatik uretilen ad "Meraklı Tilki" ise avatar da
 * tilki olarak baslıyor. Ad ile yuz ayni yerden geliyor.
 *
 * Ikon ve cerceve sayfalarindan farkli olarak burada zemin ANAHTARLANMIYOR:
 * her hayvanin kendi pastel zemini var ve o zemin cizimin parcasi. Tek
 * yapilan hucreleri kesip kucultmek.
 *
 * Kullanim: npm run avatars
 */
import sharp from 'sharp';
import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(fileURLToPath(import.meta.url), '../..');
const SAYFA = join(KOK, 'brand/avatar-sayfasi.png');
const HEDEF = join(KOK, 'src/assets/avatarlar');

/** Daire icinde gosteriliyor; 256 retinada 88px'e kadar net. */
const KENAR = 256;
const KALITE = 86;

/**
 * Izgara ELLE yazili, olculmuyor.
 *
 * Ikon sayfalarinda hucreler krem zemin uzerinde ayri ayri duruyordu ve
 * bolutleme olcumle yapiliyordu (bkz. tools/sayfa.mjs). Burada zeminler
 * kenardan kenara dolu ve BITISIK — olculecek bosluk yok, izgara duzgun
 * bir 3x3.
 */
const SUTUN = 3;
const SATIR = 3;

/** Okuma sirasi — uretim isteminde verilen sirayla ayni. */
const HAYVANLAR = [
  'tilki', 'baykus', 'fil',
  'ayi', 'kedi', 'ordek',
  'balik', 'ari', 'yilan',
];

const { width: W, height: H } = await sharp(SAYFA).metadata();
const hucreW = Math.floor(W / SUTUN);
const hucreH = Math.floor(H / SATIR);

await rm(HEDEF, { recursive: true, force: true });
await mkdir(HEDEF, { recursive: true });

for (let i = 0; i < HAYVANLAR.length; i++) {
  const ad = HAYVANLAR[i];
  const sutun = i % SUTUN;
  const satir = Math.floor(i / SUTUN);

  await sharp(SAYFA)
    .extract({ left: sutun * hucreW, top: satir * hucreH, width: hucreW, height: hucreH })
    .resize(KENAR, KENAR, { fit: 'cover' })
    .webp({ quality: KALITE })
    .toFile(join(HEDEF, `${ad}.webp`));

  console.log('✓', ad);
}

/** Kontak sayfasi — daire icinde, yani uygulamada gorunecekleri gibi. */
const CAP = 120;
const PAY = 10;
const maske = Buffer.from(
  `<svg width="${CAP}" height="${CAP}"><circle cx="${CAP / 2}" cy="${CAP / 2}" r="${CAP / 2}" fill="#fff"/></svg>`,
);

const parcalar = [];
for (let i = 0; i < HAYVANLAR.length; i++) {
  const yuvarlak = await sharp(join(HEDEF, `${HAYVANLAR[i]}.webp`))
    .resize(CAP, CAP)
    .composite([{ input: maske, blend: 'dest-in' }])
    .png()
    .toBuffer();
  parcalar.push({ input: yuvarlak, left: i * (CAP + PAY) + PAY, top: PAY });
}

await sharp({
  create: {
    width: HAYVANLAR.length * (CAP + PAY) + PAY,
    height: CAP + PAY * 2,
    channels: 4,
    background: '#eaf1fb',
  },
})
  .composite(parcalar)
  .png()
  .toFile(join(KOK, 'brand/avatar-seti.png'));

console.log(`\n${HAYVANLAR.length} avatar (${KENAR}px) -> src/assets/avatarlar/`);
console.log('Kontak sayfasi -> brand/avatar-seti.png');
console.log("Bu liste profil.ts icindeki HAYVANLAR ile AYNI sirada olmali.");
