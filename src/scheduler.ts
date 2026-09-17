/**
 * Zamanlama ve asamali iskele.
 *
 * Iki bagimsiz eksen var:
 *   1. FSRS  -> kart NE ZAMAN gelecek
 *   2. support -> kart geldiginde NE KADAR DESTEK gorecek
 * Bunlar birbirine bagli degil: bir kart uzun araliga cikmis ama hala L2'de olabilir.
 */
import {
  Rating,
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Grade,
  type Card as FSRSCard,
} from 'ts-fsrs';
import { CARDS, DECKS, NEW_PER_DAY, TEST_UNLOCK_REPS, deckOf } from './content';
import { todayKey } from './dates';
import type { Card, Progress, SupportLevel } from './types';

const f = fsrs(generatorParameters({ enable_fuzz: true }));

/**
 * Basarisiz cevaplanan kart seansi terk etmez: kullanici seansi
 * hatirlayamadigi bir kartla bitirmemeli. Pencere, FSRS'in
 * (re)learning adimlarini kapsayacak kadar genis — adim suresi
 * degisirse kural bozulmasin diye.
 */
const REQUEUE_WINDOW_MS = 30 * 60 * 1000;

const clampSupport = (n: number): SupportLevel =>
  Math.max(0, Math.min(3, n)) as SupportLevel;

const toProgress = (cardId: string, fsrsCard: FSRSCard, rest: Omit<Progress, 'cardId' | 'fsrs' | 'due' | 'deck'>): Progress => ({
  cardId,
  deck: deckOf(CARDS.find((c) => c.id === cardId)?.order ?? 1),
  fsrs: fsrsCard,
  due: fsrsCard.due,
  ...rest,
});

/**
 * Tanis akisi: kart havuza girer.
 * "Tutmadi" kartı cezalandirmaz — daha erken geri getirir ve
 * kancanin zayif oldugunu isaretler (icerik sinyali).
 */
export function introduceCard(card: Card, stuck: boolean, now = new Date()): Progress {
  const empty = createEmptyCard(now);
  const grade: Grade = stuck ? Rating.Again : Rating.Good;
  const { card: next } = f.next(empty, now, grade);

  return toProgress(card.id, next, {
    support: 3,
    introduced: true,
    introducedAt: now.toISOString(),
    introStuck: stuck,
    hookRevealCount: 0,
    firstRecallOk: null,
  });
}

/**
 * Tekrar akisi.
 * Destek: Iyi/Kolay -> bir basamak iner. Unuttum/Zor -> bir basamak cikar.
 * Kanca gosterildiyse o tekrar destek INDIRMEZ (yardimla gelen basari sayilmaz).
 */
export function reviewCard(
  prev: Progress,
  rating: Grade,
  hookRevealed: boolean,
  now = new Date(),
): { progress: Progress; requeue: boolean } {
  const { card: next } = f.next(prev.fsrs, now, rating);
  const ok = rating === Rating.Good || rating === Rating.Easy;

  let support = prev.support;
  if (!ok) support = clampSupport(support + 1);
  else if (!hookRevealed) support = clampSupport(support - 1);

  const progress: Progress = {
    ...prev,
    fsrs: next,
    due: next.due,
    support,
    hookRevealCount: prev.hookRevealCount + (hookRevealed ? 1 : 0),
    firstRecallOk: prev.firstRecallOk ?? (ok && !hookRevealed),
  };

  return {
    progress,
    requeue: !ok && next.due.getTime() - now.getTime() <= REQUEUE_WINDOW_MS,
  };
}

// --- Seans kurulumu ---

export const isDue = (p: Progress, now = new Date()) =>
  p.introduced && p.due.getTime() <= now.getTime();

export function dueQueue(all: Progress[], now = new Date()): Progress[] {
  return all.filter((p) => isDue(p, now)).sort((a, b) => a.due.getTime() - b.due.getTime());
}

/**
 * Tanisilacak sonraki deste. Kartlar sirayla tanisildigi icin
 * "tanisilmamis karti olan ilk deste" zaten dogru desteyi verir —
 * sira atlamak mumkun degil.
 */
export function currentIntroDeck(introduced: Set<string>): number | null {
  for (const d of DECKS) {
    if (d.cards.some((c) => !introduced.has(c.id))) return d.n;
  }
  return null;
}

export function newCardsToday(all: Progress[], now = new Date()): Card[] {
  const introduced = new Set(all.filter((p) => p.introduced).map((p) => p.cardId));
  const deck = currentIntroDeck(introduced);
  if (deck === null) return [];

  const today = todayKey(now);
  const doneToday = all.filter(
    (p) => p.introducedAt && todayKey(new Date(p.introducedAt)) === today,
  ).length;
  const budget = Math.max(0, NEW_PER_DAY - doneToday);
  if (budget === 0) return [];

  return DECKS[deck - 1].cards.filter((c) => !introduced.has(c.id)).slice(0, budget);
}

// --- Deste durumu ---

export type DeckStatus = 'locked' | 'active' | 'introduced' | 'done';

export function deckStatus(
  deck: number,
  byId: Map<string, Progress>,
  testPassed: boolean,
): DeckStatus {
  const cards = DECKS[deck - 1]?.cards ?? [];
  const introducedCount = cards.filter((c) => byId.get(c.id)?.introduced).length;

  if (testPassed) return 'done';
  if (introducedCount === cards.length && cards.length > 0) return 'introduced';
  if (introducedCount > 0) return 'active';

  // hic tanisilmamis: onceki desteler bittiyse sirada, degilse kilitli
  const prev = DECKS[deck - 2];
  if (!prev) return 'active';
  return prev.cards.every((c) => byId.get(c.id)?.introduced) ? 'active' : 'locked';
}

/** Test, destenin her karti en az TEST_UNLOCK_REPS kez tekrar edilince acilir. */
export function isTestUnlocked(deck: number, byId: Map<string, Progress>): boolean {
  const cards = DECKS[deck - 1]?.cards ?? [];
  if (cards.length === 0) return false;
  return cards.every((c) => (byId.get(c.id)?.fsrs.reps ?? 0) >= TEST_UNLOCK_REPS);
}

export { Rating };
