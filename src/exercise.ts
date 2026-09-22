/**
 * Egzersiz merdiveni.
 *
 * Her basamagin NE sordugunu ve NE KADAR yardim gosterdigini burasi tanimlar.
 * Saf: DOM yok, rastgelelik disarida tohumlanabilir, test edilebilir.
 */
import type { IkonAd } from './icons';
import type { Card, Step } from './types';

export type Egzersiz = 'kart' | 'eslestirme' | 'secmeli' | 'ters-secmeli' | 'harf' | 'yazma' | 'dinleme';

export const ADIMLAR: Step[] = [1, 2, 3, 4, 5, 6];
export const ILK_ADIM: Step = 1;
export const SON_ADIM: Step = 6;

type AdimBilgisi = {
  egzersiz: Egzersiz;
  ad: string;
  /**
   * Marka setindeki ikonun ADI — resmin kendisi degil (bkz. icons.ts).
   * Bu modul saf kalsin diye: merdivenin kurallari test edilirken
   * arayuz varligi yuklenmemeli.
   */
  ikon: IkonAd;
  alt: string;
  /**
   * Kanca soru yuzunde DURUYOR mu?
   *
   * 1-2'de duruyor: kelime henuz yeni, kanca gosterilmeden sorulmasi
   * anlamsiz. 3'ten itibaren yalnizca ipucu dugmesi olarak var — asil
   * sinav orada basliyor, olcum de oradan itibaren anlamli (bkz. quality.ts).
   */
  kancaGorunur: boolean;
  /** Gorsel ve cumle ekranda mi */
  kartGorunur: boolean;
  /** Cevap hangi dilde veriliyor */
  cevapDili: 'en' | 'tr';
};

export const ADIM: Record<Step, AdimBilgisi> = {
  1: { egzersiz: 'eslestirme',   ad: 'Eşleştirme',     ikon: 'eslestirme', alt: 'kelime ↔ karşılık',   kancaGorunur: true,  kartGorunur: true,  cevapDili: 'tr' },
  2: { egzersiz: 'secmeli',      ad: 'Çoktan seçmeli', ikon: 'secmeli',    alt: 'İngilizceyi gör, seç', kancaGorunur: true,  kartGorunur: true,  cevapDili: 'tr' },
  3: { egzersiz: 'ters-secmeli', ad: 'Ters seçmeli',   ikon: 'ters',       alt: 'Türkçeyi gör, seç',    kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
  4: { egzersiz: 'harf',         ad: 'Harf dizme',     ikon: 'harf',       alt: 'harfleri sıraya diz',  kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
  5: { egzersiz: 'yazma',        ad: 'Yazma',          ikon: 'yazma',      alt: 'baştan yaz',           kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
  6: { egzersiz: 'dinleme',      ad: 'Dinleme',        ikon: 'ses',        alt: 'yazı yok, sadece ses', kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
};

/**
 * MERDIVENIN UC BOLGESI.
 *
 * Basamaklar tek tek degil ucer ucer anlamli: 1-2 kelimeyi TANIMA
 * (kanca ekranda), 3-4 kancasiz HATIRLAMA, 5-6 sifirdan URETME. Bu
 * gruplama zaten iki ekranda yasiyor — Egzersiz'de basamak kutularinin
 * rengi (mavi/sari/nane), Ilerleme'de "Neler yapabildin" cubuklari.
 * Burasi onu tek kaynaga cikariyor.
 *
 * `ad` GECMIS ZAMAN: bolge bittiginde gosteriliyor, yani kullanicinin
 * az once YAPTIGI sey. "Tanima" degil "Tanidin".
 */
export type Bolge = {
  adimlar: Step[];
  ad: string;
  /** Bolge bitince ne geliyor — bir sonraki bolgenin ne istedigi */
  sonraki: string;
  ikon: IkonAd;
  /**
   * Renk TOKENININ adi — sinif degil.
   * Tokenlar `index.css` `@theme` icinde tanimli; hangi tonun (soft/dolu)
   * kullanildigina cizen bilesen karar verir.
   */
  renk: 'brand' | 'spark' | 'grow';
};

export const BOLGELER: Bolge[] = [
  {
    adimlar: [1, 2],
    ad: 'Tanıdın',
    sonraki: 'Şimdi kanca ekrandan kalkıyor',
    ikon: 'secmeli',
    renk: 'brand',
  },
  {
    adimlar: [3, 4],
    ad: 'Hatırladın',
    sonraki: 'Şimdi kelimeyi baştan sen yazacaksın',
    ikon: 'harf',
    renk: 'spark',
  },
  {
    adimlar: [5, 6],
    ad: 'Ürettin',
    sonraki: 'Merdivenin tepesi',
    ikon: 'yazma',
    renk: 'grow',
  },
];

/**
 * Gorevleri bolgelere ayirir, SIRA korunur.
 *
 * Bos bolge donmez: bir derste yalnizca bazi basamaklar kosuluyorsa
 * (ornegin hizli tekrar) o bolgenin gecis ekrani da hic acilmaz.
 */
export function bolgelereBol(gorevler: readonly Gorev[]): { bolge: Bolge; gorevler: Gorev[] }[] {
  return BOLGELER.map((bolge) => ({
    bolge,
    gorevler: gorevler.filter((g) => bolge.adimlar.includes(g.step)),
  })).filter((b) => b.gorevler.length > 0);
}

/**
 * Bu basamak olcum uretir mi?
 *
 * 1-2'de kanca zaten ekranda ve sorular tanima; oradan gelen "dogru"
 * kancanin ise yarayip yaramadigini soylemez. Gercek sinav 3'te basliyor.
 */
export const olculebilir = (step: Step) => !ADIM[step].kancaGorunur;

export const clampStep = (n: number): Step =>
  Math.min(SON_ADIM, Math.max(ILK_ADIM, Math.round(n))) as Step;

/** Fisher-Yates. `rastgele` disaridan verilebilir ki testler belirli olsun. */
export function shuffle<T>(xs: readonly T[], rastgele: () => number = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Coktan secmeli siklar.
 *
 * Celdiriciler TUM havuzdan gelir, kartin komsularindan degil: ayni 5'li
 * gruptan secilseydi eleme yoluyla bilinebilirdi. Ayni metni tasiyan kart
 * (turn/spin = "dönmek") celdirici olarak ELENIR — iki sikkin da dogru
 * oldugu bir soru sorulamaz.
 */
export function secenekler(
  card: Card,
  havuz: readonly Card[],
  dil: 'en' | 'tr',
  sayi = 4,
  rastgele: () => number = Math.random,
): string[] {
  const dogru = dil === 'en' ? card.en : card.tr;
  const adaylar = havuz
    .filter((c) => c.id !== card.id)
    .map((c) => (dil === 'en' ? c.en : c.tr))
    .filter((m) => m !== dogru);

  const benzersiz = [...new Set(adaylar)];
  const celdiriciler = shuffle(benzersiz, rastgele).slice(0, sayi - 1);
  return shuffle([dogru, ...celdiriciler], rastgele);
}

/**
 * Harf dizme karolari.
 *
 * Harfler karistirilir ama ASLA dogru sirada birakilmaz — kullanici
 * hicbir sey yapmadan dogru cevabi gormemeli. Tek harfli kelime yok,
 * ayni harften olusan kelime de yok; yine de sonsuz donguye karsi
 * deneme sayisi sinirli.
 */
export function harfKarolari(word: string, rastgele: () => number = Math.random): string[] {
  const harfler = word.split('');
  if (harfler.length < 2) return harfler;

  for (let deneme = 0; deneme < 20; deneme++) {
    const karisik = shuffle(harfler, rastgele);
    if (karisik.join('') !== word) return karisik;
  }
  // Tum harfler ayniysa hicbir dizilim farkli olmaz; oldugu gibi birak.
  return harfler;
}

/** Bir soru: kart + hangi basamakta sorulacagi. */
export type Gorev = { card: Card; step: Step };

/**
 * Eslestirme bir GRUP egzersizi — tek kartla sorulamaz.
 *
 * 1. basamaktaki kartlar besli gruplara toplanir, kalanlar tek tek sorulur.
 * Gruptan artan TEK kart eslestirilemeyecegi icin bir ust basamaga, yani
 * coktan secmeliye kaydirilir; aksi halde ekranda tek satirlik anlamsiz
 * bir eslestirme cikardi.
 */
export type Blok =
  | { tip: 'eslestirme'; kartlar: Card[] }
  | { tip: 'tekli'; gorev: Gorev };

export function bloklaraBol(gorevler: readonly Gorev[], grup = 5): Blok[] {
  const eslestirilecek = gorevler.filter((g) => g.step === 1).map((g) => g.card);
  const digerleri = gorevler.filter((g) => g.step !== 1);

  const bloklar: Blok[] = [];
  const tekliler: Gorev[] = [...digerleri];

  for (let i = 0; i < eslestirilecek.length; i += grup) {
    const dilim = eslestirilecek.slice(i, i + grup);
    if (dilim.length < 2) tekliler.unshift({ card: dilim[0], step: 2 });
    else bloklar.push({ tip: 'eslestirme', kartlar: dilim });
  }
  for (const g of tekliler) bloklar.push({ tip: 'tekli', gorev: g });
  return bloklar;
}
