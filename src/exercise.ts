/**
 * Egzersiz merdiveni.
 *
 * Her basamagin NE sordugunu ve NE KADAR yardim gosterdigini burasi tanimlar.
 * Saf: DOM yok, rastgelelik disarida tohumlanabilir, test edilebilir.
 */
import type { Card, Step } from './types';

export type Egzersiz = 'kart' | 'eslestirme' | 'secmeli' | 'ters-secmeli' | 'harf' | 'yazma' | 'dinleme';

export const ADIMLAR: Step[] = [1, 2, 3, 4, 5, 6];
export const ILK_ADIM: Step = 1;
export const SON_ADIM: Step = 6;

type AdimBilgisi = {
  egzersiz: Egzersiz;
  ad: string;
  emoji: string;
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
  1: { egzersiz: 'eslestirme',   ad: 'Eşleştirme',     emoji: '🔗', alt: 'kelime ↔ karşılık',      kancaGorunur: true,  kartGorunur: true,  cevapDili: 'tr' },
  2: { egzersiz: 'secmeli',      ad: 'Çoktan seçmeli', emoji: '✅', alt: 'İngilizceyi gör, seç',   kancaGorunur: true,  kartGorunur: true,  cevapDili: 'tr' },
  3: { egzersiz: 'ters-secmeli', ad: 'Ters seçmeli',   emoji: '🔄', alt: 'Türkçeyi gör, seç',      kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
  4: { egzersiz: 'harf',         ad: 'Harf dizme',     emoji: '🔤', alt: 'harfleri sıraya diz',    kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
  5: { egzersiz: 'yazma',        ad: 'Yazma',          emoji: '✍️', alt: 'baştan yaz',             kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
  6: { egzersiz: 'dinleme',      ad: 'Dinleme',        emoji: '🔊', alt: 'yazı yok, sadece ses',   kancaGorunur: false, kartGorunur: false, cevapDili: 'en' },
};

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
