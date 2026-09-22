/**
 * Profil cerceveleri: tek kaynak sayfadan 6 cerceve.
 *
 *   brand/cerceve-sayfasi.png -> src/assets/cerceveler/<ad>.png
 *
 * Oyunlardaki "premium avatar cercevesi" fikri: profil fotografinin
 * etrafinda toplanan, kazanilan bir suslemeler seti.
 *
 * IC DELIK NEDEN OLCULUYOR — bu dosyanin butun isi.
 *
 * Altisi ayni sayfada cizildi ama cizimler birbirinin AYNI degil: defne
 * celenginin yapraklari disa tasiyor, dikenli tac daha genis, kraliyet
 * cercevesinin tepesinde tac var. Hepsini ayni dis kutuya oturtmak ise
 * yaramaz — o zaman IC delikleri farkli buyuklukte olur ve avatar kimi
 * cercevede tasar, kimisinde ortada kucucuk kalir.
 *
 * Bu yuzden hizalama disaridan degil ICERIDEN yapiliyor: her cerceve
 * icin merkezden disa yurunup delik yaricapi olculuyor, sonra cizim o
 * delik SABIT bir orana gelecek sekilde olcekleniyor. Boylece avatar
 * her cercevede ayni boyutta ve ayni yerde duruyor; bileseninin tek
 * bilmesi gereken sey `IC_ORAN`.
 *
 * Kullanim: npm run frames
 */
import sharp from 'sharp';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZEMIN, boya, hucreyiKes, kutu, sayfayiBol } from './sayfa.mjs';

const KOK = resolve(fileURLToPath(import.meta.url), '../..');
const HEDEF = join(KOK, 'src/assets/cerceveler');

const MUREKKEP = [0x16, 0x23, 0x3a]; // --color-ink
const KANCA = [0xff, 0xd2, 0x3f]; // --color-spark

/** Cikti tuvali. Cerceve avatardan buyuk cizilir, o yuzden ikonlardan genis. */
const TUVAL = 256;

/**
 * Delik capinin tuvale ISTENEN orani — tavan, sabit degil.
 *
 * Gercek oran uretimde HESAPLANIYOR: dikenli tac, halkaya gore cok daha
 * genis: deligi bu orana buyutunce dis cizim tuvali tasiyordu. Gercek
 * oran `src/assets/cerceveler/olcu.json` dosyasina yaziliyor ve Avatar
 * bileseni onu OKUYOR — iki yerde birden elle degistirilecek bir sayi
 * kalmasin diye.
 */
const IC_ORAN_TAVAN = 0.62;

/** Guvenlik payi: en genis cerceve tuvale tam dayanmasin. */
const PAY_ORANI = 0.97;

/**
 * Iki sayfa, iki ayri gorsel dil.
 *
 * Birinci sayfa markanin kendi dilinde: lacivert + kanca sarisi, duz
 * dolgu. Ilk iki cerceve oradan geliyor — baslangic cercevesinin
 * arayuzun geri kalaniyla ayni dilde olmasi dogru.
 *
 * Ikinci sayfa MADENI ve bilerek farkli: bakir → gumus → altin → platin.
 * Kademe bakinca anlasilsin diye; hangisinin "daha degerli" oldugunu
 * yazi okumadan soyleyen sey metal. Arayuzun duz dolgu kurali burada
 * bilerek delinmis — bunlar arayuz ikonu degil, kazanilan nesneler.
 */
const SAYFALAR = [
  {
    yol: 'brand/cerceve-sayfasi.png',
    marka: true,
    yerlesim: {
      '1,1': 'halka', // sade cift halka — herkeste var
      '2,2': 'halat', // halat orgusu
    },
  },
  {
    yol: 'brand/cerceve-sayfasi-2.png',
    marka: false,
    yerlesim: {
      '1,1': 'bronz', // perçinli
      '1,2': 'gumus', // defne celengi
      '2,1': 'altin', // dikenli gunes taci
      '2,2': 'elmas', // taçlı, mavi taşlı
    },
  },
];

/**
 * Renkli cizimlerde kremi alfaya cevirir, RENGE DOKUNMAZ.
 *
 * `boya()` iki renkli cizimler icin: her pikseli iki karisim dogrusundan
 * birine izdusuruyor. Madeni cerceveler onlarca ton tasiyor, o yontem
 * hepsini iki renge ezerdi.
 *
 * Burada alfa zeminden UZAKLIKLA veriliyor, renk ise karisimdan geri
 * cozuluyor: P = a·F + (1−a)·BG oldugundan F = (P − (1−a)·BG) / a.
 * Bu yapilmazsa yari saydam kenarlarda krem bir hale kaliyor.
 *
 * Alt esik yuksek tutuldu: modelin ekledigi soluk golge tamamen dussun.
 */
function renkliKes(ham, genislik, yukseklik, altEsik = 38, ustEsik = 78) {
  const cikti = Buffer.alloc(genislik * yukseklik * 4);
  for (let i = 0; i < ham.length; i += 4) {
    const d = Math.max(
      Math.abs(ham[i] - ZEMIN[0]),
      Math.abs(ham[i + 1] - ZEMIN[1]),
      Math.abs(ham[i + 2] - ZEMIN[2]),
    );
    const a = Math.max(0, Math.min(1, (d - altEsik) / (ustEsik - altEsik)));
    if (a <= 0) continue;
    for (let k = 0; k < 3; k++) {
      cikti[i + k] = Math.max(0, Math.min(255, Math.round((ham[i + k] - (1 - a) * ZEMIN[k]) / a)));
    }
    cikti[i + 3] = Math.round(a * 255);
  }
  return cikti;
}

/**
 * Cercevenin ICINDEKI delik: merkezi ve yaricapi.
 *
 * Kutu merkezinden basliyor ve seffaf pikseller uzerinde tasma yapiyor
 * (flood fill). Neden kutu merkezini dogrudan kullanmiyoruz: kraliyet
 * cercevesinin tepesinde tac, defnenin altinda dugum var — cizimin
 * kutusu simetrik degil, delik kutu merkezinde DURMUYOR. Avatar delige
 * oturacaksa delik nerede, onu bilmek gerek.
 *
 * Yaricap: delik merkezinden en yakin opak piksele olan uzaklik. Delik
 * tam daire olmayabilir (kivrimlar iceri sarkiyor), bu yuzden EN YAKIN
 * — avatar hicbir yone tasmasin.
 */
function delikBul(piks, w, h) {
  const seffaf = (x, y) => piks[(y * w + x) * 4 + 3] <= 40;
  const bas = [Math.floor(w / 2), Math.floor(h / 2)];
  if (!seffaf(bas[0], bas[1])) return null; // merkez doluysa cerceve degil

  const gorulen = new Uint8Array(w * h);
  const yigin = [bas];
  gorulen[bas[1] * w + bas[0]] = 1;
  let toplamX = 0;
  let toplamY = 0;
  let sayi = 0;
  const pikseller = [];

  while (yigin.length) {
    const [x, y] = yigin.pop();
    toplamX += x;
    toplamY += y;
    sayi++;
    pikseller.push(x, y);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = ny * w + nx;
      if (gorulen[k] || !seffaf(nx, ny)) continue;
      gorulen[k] = 1;
      yigin.push([nx, ny]);
    }
  }

  // Delik sayfanin disina tasmissa cerceve kapali degildir — kullanilamaz.
  for (let x = 0; x < w; x++) if (gorulen[x] || gorulen[(h - 1) * w + x]) return null;
  for (let y = 0; y < h; y++) if (gorulen[y * w] || gorulen[y * w + w - 1]) return null;

  const cx = toplamX / sayi;
  const cy = toplamY / sayi;

  /*
    Ic yaricap: delik ICINDEKI en uzak noktanin degil, merkezden
    cerceveye olan EN KISA mesafenin olcusu. Delik piksellerinin
    kenardakilerini tarayip minimumu aliyoruz.
  */
  let r = Infinity;
  for (let i = 0; i < pikseller.length; i += 2) {
    const x = pikseller[i];
    const y = pikseller[i + 1];
    let kenar = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || !seffaf(nx, ny)) kenar = true;
    }
    if (kenar) r = Math.min(r, Math.hypot(x - cx, y - cy));
  }

  return { cx, cy, r };
}

await rm(HEDEF, { recursive: true, force: true });
await mkdir(HEDEF, { recursive: true });

// --- 1. gecis: olc ---
const olculen = [];
for (const sayfa of SAYFALAR) {
  const { data, W, hucreler } = await sayfayiBol(join(KOK, sayfa.yol));
  const bulunan = new Set();

  for (const hucre of hucreler) {
    const ad = sayfa.yerlesim[hucre.anahtar];
    if (!ad) continue;
    bulunan.add(hucre.anahtar);

    const { ham, w, h } = hucreyiKes(data, W, hucre);
    const piks = sayfa.marka ? boya(ham, w, h, MUREKKEP, KANCA) : renkliKes(ham, w, h);
    const delik = delikBul(piks, w, h);
    if (!delik || delik.r < 10) {
      console.error(`${ad}: ic delik bulunamadi — cerceve kapali bir halka mi?`);
      process.exit(1);
    }
    olculen.push({ ad, piks, w, h, k: kutu(piks, w, h), delik });
  }

  const eksik = Object.keys(sayfa.yerlesim).filter((a) => !bulunan.has(a));
  if (eksik.length) {
    console.error(`\n${sayfa.yol} — HUCRE BULUNAMADI: ${eksik.join(', ')}`);
    console.error(`Bulunanlar: ${hucreler.map((h) => h.anahtar).join(' ')}`);
    process.exit(1);
  }
}

/* Cikti sirasi YERLESIM sirasi degil, kademe sirasi (bkz. cerceveler.ts). */
const SIRA = ['halka', 'halat', 'bronz', 'gumus', 'altin', 'elmas'];
olculen.sort((a, b) => SIRA.indexOf(a.ad) - SIRA.indexOf(b.ad));

/*
  Oran, EN GENIS cerceveye gore belirleniyor: bir cizimin dis kenari
  deligin kac kati ise, delik o kadar kucuk kalmali ki cizim tuvale
  sigsin. Altisinda ortak tek oran kullanilmasinin sebebi avatarin her
  cercevede AYNI boyutta durmasi.
*/
const enGenis = Math.max(
  ...olculen.map(({ k, delik }) => Math.max(k.width, k.height) / (2 * delik.r)),
);
const IC_ORAN = Math.min(IC_ORAN_TAVAN, PAY_ORANI / enGenis);
console.log(`En genis cerceve deligin ${enGenis.toFixed(2)} kati → ic oran ${IC_ORAN.toFixed(3)}\n`);

// --- 2. gecis: ciz ---
const uretilen = [];
for (const { ad, piks, w, h, delik } of olculen) {
  const olcek = (TUVAL * IC_ORAN) / (2 * delik.r);

  /*
    Hizalama DELIK merkezinden: kraliyet cercevesinin tepesinde tac,
    defnenin altinda dugum var, yani cizimin kutusu simetrik degil.
    Kutuya gore ortalanirsa avatar delikte kayik durur.

    Once tuval kadar her yone seffaf pay ekleniyor, sonra delik merkezi
    merkeze gelecek pencere kesiliyor — boylece pencere cizimin disina
    tassa bile sinir hatasi olmuyor.
  */
  const olcekliW = Math.round(w * olcek);
  const olcekliH = Math.round(h * olcek);
  const pay = TUVAL;

  const genisletilmis = await sharp(piks, { raw: { width: w, height: h, channels: 4 } })
    .resize(olcekliW, olcekliH)
    .extend({ top: pay, bottom: pay, left: pay, right: pay, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const dosya = await sharp(genisletilmis)
    .extract({
      left: Math.round(pay + delik.cx * olcek - TUVAL / 2),
      top: Math.round(pay + delik.cy * olcek - TUVAL / 2),
      width: TUVAL,
      height: TUVAL,
    })
    /* Madeni gecisler 32 renge sigmiyor; paletsiz birakiliyor. */
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(dosya).toFile(join(HEDEF, `${ad}.png`));
  uretilen.push({ ad, veri: dosya });
  console.log('✓', ad.padEnd(10), `delik r=${delik.r.toFixed(0)} → ölçek ${olcek.toFixed(2)}`);
}

/* Olcu TEK kaynakta: Avatar bileseni bu dosyayi okuyor. */
await writeFile(
  join(HEDEF, 'olcu.json'),
  `${JSON.stringify({ icOran: Number(IC_ORAN.toFixed(4)), tuval: TUVAL }, null, 2)}\n`,
);

/**
 * Kontak sayfasi — her cerceve, ortasinda sahte bir avatar diskiyle.
 *
 * Disk tam `IC_ORAN` capinda ciziliyor: hizalama bozulursa burada
 * hemen goruluyor, uygulamayi acmaya gerek kalmiyor.
 */
const KARE = Math.round(TUVAL * 1.15);
const PAY = Math.round((KARE - TUVAL) / 2);
const cap = Math.round(TUVAL * IC_ORAN);
const disk = await sharp({
  create: { width: cap, height: cap, channels: 4, background: { r: 0x4f, g: 0x92, b: 0xf6, alpha: 1 } },
})
  .composite([
    {
      input: Buffer.from(
        `<svg width="${cap}" height="${cap}"><circle cx="${cap / 2}" cy="${cap / 2}" r="${cap / 2}" fill="#fff"/></svg>`,
      ),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

const parcalar = [];
uretilen.forEach(({ veri }, i) => {
  const x = i * KARE;
  parcalar.push({ input: disk, left: x + Math.round((KARE - cap) / 2), top: Math.round((KARE - cap) / 2) });
  parcalar.push({ input: veri, left: x + PAY, top: PAY });
});

await sharp({
  create: { width: KARE * uretilen.length, height: KARE, channels: 4, background: '#eaf1fb' },
})
  .composite(parcalar)
  .png()
  .toFile(join(KOK, 'brand/cerceve-seti.png'));

console.log(`\n${uretilen.length} cerceve (${TUVAL}px, ic oran ${IC_ORAN}) -> src/assets/cerceveler/`);
console.log('Kontak sayfasi -> brand/cerceve-seti.png');
console.log(`Avatar.tsx icindeki IC_ORAN bu sayiyla AYNI olmali: ${IC_ORAN}`);
