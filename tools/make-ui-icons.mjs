/**
 * Arayuz ikonlari: iki kaynak sayfadan 23 ikon.
 *
 *   brand/ikon-sayfasi.png    (5x5 izgara)
 *   brand/ikon-sayfasi-2.png  (2x2 izgara)
 *       -> src/assets/ikonlar/<ad>.png ve <ad>-ters.png
 *
 * KAYNAK NEDEN SAYFA. Ikonlar tek tek uretilmedi; her sayfada hepsi ayni
 * firca ve ayni cizgi kalinligiyla bir arada cizildi. Set olmalarinin
 * sebebi bu — ayri ayri uretilselerdi kalinliklar tutmazdi.
 *
 * IKINCI SAYFA NEDEN VAR. Ilk sayfada `harf` BES karo genisligindeydi
 * (4:1 oran) ve egzersiz kutusundaki 20 pikselde koyu bir lekeye
 * donusuyordu. Ayrica seri/koruma/kutlama bir sure emoji kalmisti —
 * emoji marka degildir, cizen cihazin yazi karakteridir. Dordu birlikte
 * ikinci bir sayfada uretildi. Ilk denemesi DOLU siluet olarak geldi ve
 * setin cizgi diliyle ortusmedi; stil acikca tarif edilip bir kez
 * yeniden uretildi.
 *
 * Kullanim: npm run icons:ui
 */
import sharp from 'sharp';
import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boya, hucreyiKes, kutu, sayfayiBol } from './sayfa.mjs';

const KOK = resolve(fileURLToPath(import.meta.url), '../..');
const HEDEF = join(KOK, 'src/assets/ikonlar');

/** src/index.css `@theme` ile birebir ayni degerler. */
const MUREKKEP = [0x16, 0x23, 0x3a]; // --color-ink
const KANCA = [0xff, 0xd2, 0x3f]; // --color-spark
const KREM = [0xff, 0xf7, 0xe4]; // --color-cream (logonun zemini)

/**
 * Cikti tuvali ve isaretin o tuvaldeki "optik" boyutu.
 *
 * OPTIK bir KENAR degil, √alan: isaret kare olmayabilir. Uzun kenardan
 * sigdirmak genis cizimleri komsularindan kucuk gosteriyordu.
 */
const TUVAL = 128;
const OPTIK = 112;

/**
 * Hangi sayfanin hangi hucresi hangi ikon.
 *
 * Birinci sayfada 24 cizim var: model dort ikonu ikiser kez cizdi.
 * Ikizlerden SARI VURGUSU OLANI aliniyor — setin kurali "her ikonda bir
 * sari vurgu" ve vurgusuz olan o kurali bozuyor.
 *
 * Adlar NE GOSTERDIGI degil NEREDE KULLANILDIGI ile anilir (bkz. icons.ts).
 */
const SAYFALAR = [
  {
    yol: 'brand/ikon-sayfasi.png',
    yerlesim: {
      '1,1': 'ogren', // filiz
      '1,2': 'egzersiz', // hedef tahtasi
      '1,3': 'ilerleme', // cubuk grafik
      '1,5': 'ayarlar', // disli
      '2,1': 'bugun', // gunes
      '2,2': 'onceki', // hilal
      '2,4': 'bekleyen', // calar saat
      '2,5': 'zor', // yara bandi
      '3,1': 'eski', // kum saati
      '3,2': 'sec', // dokunan el
      '3,3': 'ders', // mezuniyet kepi
      '3,5': 'karisik', // zar
      '4,1': 'kartlar', // kart destesi
      '4,3': 'eslestirme', // zincir
      '4,4': 'secmeli', // kutu + tik
      '4,5': 'yazma', // kalem
      '5,1': 'ters', // donen oklar
      '5,3': 'ses', // hoparlor
      '5,4': 'ara', // buyutec
      // 5,2 = bes karolu eski `harf` — yerini ikinci sayfadaki uc karolu aldi
    },
  },
  {
    yol: 'brand/ikon-sayfasi-2.png',
    yerlesim: {
      '1,1': 'harf', // uc karo
      '1,2': 'seri', // alev
      '2,1': 'koruma', // kar tanesi
      '2,2': 'kutlama', // konfeti
    },
  },
];

async function uret(data, W, hucre, ikinciRenk) {
  const { ham, w, h } = hucreyiKes(data, W, hucre);
  const piks = boya(ham, w, h, ikinciRenk, KANCA);
  const k = kutu(piks, w, h);

  const olcek = Math.min(
    OPTIK / Math.sqrt(k.width * k.height), // optik boyut esitlensin
    TUVAL / Math.max(k.width, k.height), // ama tuvali tasmasin
  );

  const isaret = await sharp(piks, { raw: { width: w, height: h, channels: 4 } })
    .extract(k)
    .resize(Math.round(k.width * olcek), Math.round(k.height * olcek))
    .png()
    .toBuffer();

  return sharp({
    create: { width: TUVAL, height: TUVAL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: isaret, gravity: 'centre' }])
    /*
      Iki renk + alfa rampasi 16 girdilik palete rahat siginiyor: dosya
      10,3 KB'den 1,2 KB'ye duserken alfa sapmasi ortalama 4,6/255 kaliyor,
      yani gozle ayirt edilemiyor.
    */
    .png({ compressionLevel: 9, palette: true, colors: 16 })
    .toBuffer();
}

await rm(HEDEF, { recursive: true, force: true });
await mkdir(HEDEF, { recursive: true });

const duzler = [];
const tersler = [];

for (const sayfa of SAYFALAR) {
  const { data, W, hucreler } = await sayfayiBol(join(KOK, sayfa.yol));
  const bulunan = new Set();

  for (const hucre of hucreler) {
    const ad = sayfa.yerlesim[hucre.anahtar];
    if (!ad) continue; // ikiz cizim ya da kullanilmayan hucre
    bulunan.add(hucre.anahtar);
    const duz = await uret(data, W, hucre, MUREKKEP);
    const ters = await uret(data, W, hucre, KREM);
    await sharp(duz).toFile(join(HEDEF, `${ad}.png`));
    await sharp(ters).toFile(join(HEDEF, `${ad}-ters.png`));
    duzler.push(duz);
    tersler.push(ters);
    console.log('✓', hucre.anahtar.padEnd(4), ad);
  }

  // Bolutleme kaymissa sessizce eksik ikon uretmektense patla.
  const eksik = Object.keys(sayfa.yerlesim).filter((a) => !bulunan.has(a));
  if (eksik.length) {
    console.error(`\n${sayfa.yol} — HUCRE BULUNAMADI: ${eksik.join(', ')}`);
    console.error(`Bulunanlar: ${hucreler.map((h) => h.anahtar).join(' ')}`);
    process.exit(1);
  }
}

/** Kontak sayfasi — seti tek bakista gormek icin, uretim yazar. */
const KARE = Math.round(TUVAL * 1.4);
const SUTUN = 12;
const PAY = Math.round((KARE - TUVAL) / 2);
const satirSayisi = Math.ceil(duzler.length / SUTUN);
const kw = KARE * SUTUN;
const kh = KARE * satirSayisi * 2;
const yerlestir = (liste, ustBosluk) =>
  liste.map((veri, i) => ({
    input: veri,
    left: (i % SUTUN) * KARE + PAY,
    top: Math.floor(i / SUTUN) * KARE + PAY + ustBosluk,
  }));

const zemin = await sharp({ create: { width: kw, height: kh, channels: 4, background: '#eaf1fb' } })
  .composite([
    {
      input: { create: { width: kw, height: kh / 2, channels: 4, background: '#16233a' } },
      top: kh / 2,
      left: 0,
    },
  ])
  .png()
  .toBuffer();

await sharp(zemin)
  .composite([...yerlestir(duzler, 0), ...yerlestir(tersler, kh / 2)])
  .png()
  .toFile(join(KOK, 'brand/ikon-seti.png'));

console.log(`\n${duzler.length} ikon · ${duzler.length * 2} dosya (${TUVAL}px) -> src/assets/ikonlar/`);
console.log('Kontak sayfasi -> brand/ikon-seti.png');
