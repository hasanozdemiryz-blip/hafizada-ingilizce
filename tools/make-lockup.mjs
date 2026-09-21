/**
 * Yazili marka kilidi: isaret + "Hafızada" + sari bantta "İNGİLİZCE".
 *
 * Instagram profilindeki mevcut kimlik BU yapida (isim + sari bant) ve
 * 5.000'den fazla takipci onu taniyor; yeni isaret o yapiya EKLENIYOR,
 * yerine gecmiyor. Profil fotografi DAIRE kirpiliyor, o yuzden butun
 * icerik ic teget karenin degil, ic teget DAIRENIN icinde duruyor.
 *
 * Yazi tipi: Nunito 800. `public/fonts` altindakiler woff2 ve iki alt
 * kumeye bolunmus ('ı' latin'de, 'İ/ğ/ş' latin-ext'te); resvg woff2
 * okumuyor. `brand/fonts/Nunito-800.ttf` ikisinin 800 agirliginda
 * ornenmis ve birlestirilmis hali — fontTools ile uretildi.
 *
 * Kullanim: npm run lockup
 */
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const y = (...p) => resolve(KOK, ...p);
const FONT = [y('brand/fonts/Nunito-800.ttf')];

const LACI = '#16233A', SARI = '#FFD23F', KREM = '#FFF7E4', BEYAZ = '#FFFFFF';


/**
 * Isaretin iki varyanti.
 *
 * Acik zeminde lacivert + sari. KOYU zeminde lacivert yari kayboluyor ve
 * geriye yarim beyin kaliyor — o yuzden koyu zeminde lacivert yarinin
 * yerini krem aliyor. Sari her iki zeminde de ayni.
 */
const kaynakSvg = await readFile(y('brand/logo-isaret.svg'), 'utf8');

const cizim = (svg) =>
  sharp(Buffer.from(svg))
    .resize(2048, 2048, { fit: 'inside' })
    .png()
    .toBuffer()
    .then((b) => sharp(b).trim().png().toBuffer());

const isaret = await cizim(kaynakSvg);
const isaretTers = await cizim(kaynakSvg.replaceAll(LACI, KREM));

/** resvg ile metin katmani — seffaf zeminde. */
function metinKatmani(svg, w, h) {
  const r = new Resvg(svg, {
    font: { fontFiles: FONT, loadSystemFonts: false, defaultFontFamily: 'Nunito' },
    fitTo: { mode: 'width', value: w },
    background: 'rgba(0,0,0,0)',
  });
  return r.render().asPng();
}

/**
 * Profil fotografi (1080, daire kirpimina dayanikli).
 * koyu=true -> lacivert zemin, beyaz isim (mevcut siyah profille ayni his)
 */
async function profil({ koyu, cikti }) {
  const B = 1080;
  const zemin = koyu ? LACI : KREM;
  const isim = koyu ? KREM : LACI;

  const yazi = `<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${B}">
    <text x="540" y="726" font-family="Nunito" font-size="132" font-weight="800"
          fill="${isim}" text-anchor="middle" letter-spacing="-2">Hafızada</text>
    <rect x="290" y="772" width="500" height="104" rx="30" fill="${SARI}"/>
    <text x="540" y="843" font-family="Nunito" font-size="62" font-weight="800"
          fill="${LACI}" text-anchor="middle" letter-spacing="10">İNGİLİZCE</text>
  </svg>`;

  const mark = await sharp(koyu ? isaretTers : isaret)
    .resize(360, 360, { fit: 'inside' })
    .toBuffer();

  await sharp({ create: { width: B, height: B, channels: 4, background: zemin } })
    .composite([
      { input: mark, top: 176, left: Math.round((B - 360) / 2) },
      { input: metinKatmani(yazi, B, B), top: 0, left: 0 },
    ])
    .png()
    .toFile(y(cikti));
  return cikti;
}

/**
 * Yatay kilit: isaret solda, isim sagda. Baslik/afis icin.
 * Uygulama ICINDE kullanilmiyor (28px'te yazi okunmuyor, bkz. ui.tsx).
 */
async function yatay({ seffaf, cikti }) {
  const W = 1400, H = 420;
  const yazi = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <text x="430" y="206" font-family="Nunito" font-size="150" font-weight="800"
          fill="${LACI}" letter-spacing="-3">Hafızada</text>
    <rect x="430" y="248" width="478" height="104" rx="30" fill="${SARI}"/>
    <text x="669" y="319" font-family="Nunito" font-size="62" font-weight="800"
          fill="${LACI}" text-anchor="middle" letter-spacing="10">İNGİLİZCE</text>
  </svg>`;

  const mark = await sharp(isaret).resize(330, 330, { fit: 'inside' }).toBuffer();
  const tuval = sharp({
    create: {
      width: W, height: H, channels: 4,
      background: seffaf ? { r: 0, g: 0, b: 0, alpha: 0 } : KREM,
    },
  }).composite([
    { input: mark, top: 45, left: 60 },
    { input: metinKatmani(yazi, W, H), top: 0, left: 0 },
  ]);

  if (cikti.endsWith('.webp')) await tuval.webp({ quality: 92 }).toFile(y(cikti));
  else await tuval.png().toFile(y(cikti));
  return cikti;
}

const isler = [
  profil({ koyu: false, cikti: 'brand/instagram-profil-yazili.png' }),
  profil({ koyu: true, cikti: 'brand/instagram-profil-yazili-lacivert.png' }),
  yatay({ seffaf: false, cikti: 'brand/kilit.png' }),
  yatay({ seffaf: true, cikti: 'src/assets/brand/kilit.webp' }),
];
for (const c of await Promise.all(isler)) console.log('✓', c);
