import raw from '../content/cards.json';
import { normalize } from './answer';
import type { Card } from './types';

/**
 * Bir seferde tanisilan kelime sayisi.
 *
 * Gunluk TAVAN degil: paket bitince "5 kelime daha" ile devam edilebilir.
 * Birim 5 cunku bes kelime bir oturumda kodlanabilecek makul yuk;
 * fazlasi kancalari birbirine karistiriyor.
 */
export const BATCH = 5;

/**
 * Gunluk yeni kelime hedefi. Ayarlardan secilir, TAVAN asilamaz.
 *
 * Once tavan yoktu ve isteyen istedigi kadar ilerliyordu; sonucu tekrar
 * borcunun sessizce sismesiydi. Gunde 15'in ustu, ertesi gun kaldirilamayan
 * bir tekrar yigini demek — sinir pedagojik, keyfi degil.
 */
export const LIMIT_CHOICES = [5, 10, 15] as const;
export const LIMIT_DEFAULT = 10;
export const LIMIT_MAX = 15;

/** "Eski kelimeler" kapsami: bu kadar gun once tanisilmis olanlar. */
export const ESKI_GUN = 7;

/** Gunluk tavan. Birikmis borc kullaniciya HIC gosterilmez — bkz. Home. */
export const DAILY_REVIEW_CAP = 40;

/**
 * "Simdi tekrarla" partisi. Vadesi gelmemis kartlardan kac tanesi one alinir.
 * Kucuk tutuluyor: amac butun havuzu ogutmek degil, calismak isteyen
 * kullaniciya bir kapi acmak.
 */
export const AHEAD_BATCH = 10;

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]/g, '');

/**
 * Kancasi kelimenin AYNISI olan kartlar (far ≈ far, put ≈ put).
 * Bunlar aslinda mnemonik degil, Turkceye gecmis kelimeler — yontemin
 * ne yaptigini GOSTERMIYORLAR. Kart olarak degerliler ama vitrin degiller.
 */
const zayifKanca = (c: Card) => norm(c.en) === norm(c.hook);

/**
 * Kart gorselleri.
 * `src/assets/cards/<kart-id>.webp` koyulunca o kartin gorseli olur —
 * elle liste tutmaya, cards.json'a dokunmaya gerek yok. 100 kart da
 * ayni sekilde eklenecek.
 */
const GORSEL_DOSYALARI = import.meta.glob('./assets/cards/*.{webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const GORSELLER = new Map(
  Object.entries(GORSEL_DOSYALARI).map(([yol, url]) => [
    yol.split('/').pop()!.replace(/\.[^.]+$/, ''),
    url,
  ]),
);

const frekansSirasi = (raw as Card[])
  .filter((c) => c.klass === 'tutan')
  .sort((a, b) => a.order - b.order);

/**
 * v1 seti: GORSELI HAZIR olan kartlar — su an 26.
 *
 * Kapsami gorsel belirliyor, cunku gorsel bu urunde susleme degil yontemin
 * kendisi: kancayi kelimeye baglayan sey o tek resim. Gorseli olmayan kartta
 * ekranda brief metni duruyordu; o kart yontemi HIC anlatmiyor, sadece bir
 * kelime listesi oluyor.
 *
 * Kalan 74 kart cards.json'da duruyor ve beklemede: gorseli uretilip
 * `src/assets/cards/<id>.webp` olarak konulan kart kendiliginden sete girer —
 * burada elle liste tutulmuyor. "Kurtarilabilir" sinifi hala 2. set icin bekliyor.
 *
 * Siralama siklik sirasi — TEK istisna: ilk bes karta zayif kanca girmez.
 * Uygulamayi ilk acan insanin gordugu ilk on kart, yontemin ne yaptigini
 * anlatan kartlar olmali. Zayif kancalar ilk besin hemen arkasina kayar,
 * geri kalan her sey siklik sirasinda kalir.
 */
const v1Seti = frekansSirasi.filter((c) => GORSELLER.has(c.id));

export const CARDS: Card[] = (() => {
  const guclu = v1Seti.filter((c) => !zayifKanca(c));
  const zayif = v1Seti.filter(zayifKanca);
  const ilkGrup = guclu.slice(0, BATCH);
  const kalan = [...guclu.slice(BATCH), ...zayif].sort((a, b) => a.order - b.order);
  return [...ilkGrup, ...kalan].map((c, i) => ({
    ...c,
    order: i + 1,
    image: GORSELLER.get(c.id) ?? null,
  }));
})();

export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

/**
 * Karsilama ekraninda gosterilen ornek kart.
 * Deste 1'in disindan secilir ki kullanici ayni karti iki kez "yeni" gormesin.
 */
export const SHOWCASE_CARD =
  CARDS.find((c) => c.id === 'snake' && c.order > BATCH) ?? CARDS[BATCH];

/**
 * Settekilerin ilerlemesi. Setten CIKMIS kartin kaydi elenir — SILINMEZ.
 *
 * v1 seti 100 karttan 26'ya indi; daha once kurulmus bir cihazda `turn`,
 * `put` gibi artik sette olmayan kartlarin ilerlemesi veritabaninda duruyor.
 * Elenmezse: tekrar kuyruguna girip derste sessizce atlaniyorlar (ana ekran
 * "5 tekrar" diyor, ders bos aciliyor), "26 kelimenin 40'i" gibi sayilar
 * cikiyor ve set daha ilk gun "bitmis" sayilabiliyor.
 *
 * Kayitlar duruyor cunku o kartlar 2. setle geri gelecek; FSRS gecmisleri ve
 * kanca kalite sinyalleri degerli. Yedege de tam haliyle giriyorlar.
 */
export function setteOlanlar<T extends { cardId: string }>(progress: readonly T[]): T[] {
  return progress.filter((p) => CARD_BY_ID.has(p.cardId));
}

/**
 * Setin tamami tanisildi mi. "Bitti" kelimesini tek yerde tanimliyoruz;
 * ana ekran ve ders bitisi ayni soruyu iki turlu cevaplamasin.
 */
export const setBittiMi = (progress: readonly { introduced: boolean }[]) =>
  progress.filter((p) => p.introduced).length >= CARDS.length;

/**
 * Tanisilan kartlarin kanca ciftleri, siklik sirasinda.
 * Paylasim panosunun icerigi bu — bkz. share.ts `renderHookBoard`.
 */
export function ogrenilenKancalar(progress: readonly { cardId: string; introduced: boolean }[]) {
  return progress
    .filter((p) => p.introduced)
    .map((p) => CARD_BY_ID.get(p.cardId))
    .filter((c): c is Card => Boolean(c))
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ en: c.en, hook: c.hook }));
}


/**
 * Setteki tum Ingilizce kelimeler, normalize halde.
 * Yazilan cevabin "yazim hatasi mi, baska bir kelime mi" ayrimi icin —
 * bkz. answer.ts `judge`.
 */
export const EN_HAVUZ: ReadonlySet<string> = new Set(CARDS.map((c) => normalize(c.en, 'en')));

/** Ayni is, Turkce yonu icin — EN -> TR sorularinda kullanilir. */
export const TR_HAVUZ: ReadonlySet<string> = new Set(CARDS.map((c) => normalize(c.tr, 'tr')));
