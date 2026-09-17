import raw from '../content/cards.json';
import type { Card } from './types';

export const DECK_SIZE = 10;
export const NEW_PER_DAY = 5;
export const DAILY_REVIEW_CAP = 60;
/** Deste testinin acilmasi icin her kartin gormesi gereken tekrar sayisi */
export const TEST_UNLOCK_REPS = 2;
export const TEST_PASS_SCORE = 8;

/**
 * v1 seti: sadece "Tutan" sinifi (100 kart).
 * "Kurtarilabilir" olanlar 2. set icin bekliyor — Faz 5.
 * Siklik sirasi tablodaki sira; yeniden numaralanir ki desteler 1..10 olsun.
 */
export const CARDS: Card[] = (raw as Card[])
  .filter((c) => c.klass === 'tutan')
  .sort((a, b) => a.order - b.order)
  .map((c, i) => ({ ...c, order: i + 1 }));

export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

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
