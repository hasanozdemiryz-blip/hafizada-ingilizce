import raw from '../content/cards.json';
import type { Card } from './types';

export const DECK_SIZE = 10;
export const NEW_PER_DAY = 5;
/** Gunluk tavan. Birikmis borc kullaniciya HIC gosterilmez — bkz. Home. */
export const DAILY_REVIEW_CAP = 40;
/** Deste testinin acilmasi icin her kartin gormesi gereken tekrar sayisi */
export const TEST_UNLOCK_REPS = 2;
export const TEST_PASS_SCORE = 8;

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
 * v1 seti: 100 "Tutan" kart. "Kurtarilabilir" olanlar 2. set icin bekliyor.
 *
 * Siralama siklik sirasi — TEK istisna: Deste 1'e zayif kanca girmez.
 * Uygulamayi ilk acan insanin gordugu ilk on kart, yontemin ne yaptigini
 * anlatan kartlar olmali. Zayif kancalar Deste 1'in hemen arkasina kayar,
 * geri kalan her sey siklik sirasinda kalir.
 */
export const CARDS: Card[] = (() => {
  const guclu = frekansSirasi.filter((c) => !zayifKanca(c));
  const zayif = frekansSirasi.filter(zayifKanca);
  const deste1 = guclu.slice(0, DECK_SIZE);
  const kalan = [...guclu.slice(DECK_SIZE), ...zayif].sort((a, b) => a.order - b.order);
  return [...deste1, ...kalan].map((c, i) => ({
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
  CARDS.find((c) => c.id === 'snake' && c.order > DECK_SIZE) ?? CARDS[DECK_SIZE];

export const deckOf = (order: number) => Math.floor((order - 1) / DECK_SIZE) + 1;

export const DECK_COUNT = Math.ceil(CARDS.length / DECK_SIZE);

export const DECKS: { n: number; cards: Card[] }[] = Array.from(
  { length: DECK_COUNT },
  (_, i) => ({
    n: i + 1,
    cards: CARDS.filter((c) => deckOf(c.order) === i + 1),
  }),
);

export const cardsOfDeck = (n: number) => DECKS[n - 1]?.cards ?? [];
