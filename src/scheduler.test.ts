import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { CARDS, DECKS, DECK_SIZE, NEW_PER_DAY, TEST_UNLOCK_REPS } from './content';
import {
  currentIntroDeck,
  deckStatus,
  dueQueue,
  introduceCard,
  isTestUnlocked,
  newCardsToday,
  reviewCard,
} from './scheduler';
import type { Progress } from './types';

const NOW = new Date('2026-03-10T09:00:00');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const byId = (ps: Progress[]) => new Map(ps.map((p) => [p.cardId, p]));

/** Kartlari sirayla tanistir. */
const introduceMany = (count: number, when = NOW) =>
  CARDS.slice(0, count).map((c) => introduceCard(c, false, when));

describe('icerik', () => {
  it('v1 seti 100 "Tutan" karttan olusur', () => {
    expect(CARDS).toHaveLength(100);
    expect(CARDS.every((c) => c.klass === 'tutan')).toBe(true);
  });

  it('siklik sirasi 1..100, bosluksuz', () => {
    expect(CARDS.map((c) => c.order)).toEqual(CARDS.map((_, i) => i + 1));
  });

  it('10arli 10 deste', () => {
    expect(DECKS).toHaveLength(10);
    expect(DECKS.every((d) => d.cards.length === DECK_SIZE)).toBe(true);
  });

  it('kart idleri benzersiz', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });
});

describe('Tanis', () => {
  it('kart tam destekle (L3) havuza girer', () => {
    const p = introduceCard(CARDS[0], false, NOW);
    expect(p.introduced).toBe(true);
    expect(p.support).toBe(3);
    expect(p.introStuck).toBe(false);
    expect(p.firstRecallOk).toBeNull();
  });

  it('"Tutmadi" kanca sinyali birakir ve karti daha erken geri getirir', () => {
    const tuttu = introduceCard(CARDS[0], false, NOW);
    const tutmadi = introduceCard(CARDS[0], true, NOW);

    expect(tutmadi.introStuck).toBe(true);
    expect(tutmadi.support).toBe(3); // ceza degil
    expect(tutmadi.due.getTime()).toBeLessThan(tuttu.due.getTime());
  });
});

describe('asamali iskele', () => {
  it('Kolay -> destek bir basamak iner', () => {
    const p = introduceCard(CARDS[0], false, NOW);
    const { progress } = reviewCard(p, Rating.Easy, false, day(1));
    expect(progress.support).toBe(2);
  });

  it('art arda basari L0a kadar iner ve orada kalir', () => {
    let p = introduceCard(CARDS[0], false, NOW);
    for (let i = 1; i <= 5; i++) p = reviewCard(p, Rating.Good, false, day(i)).progress;
    expect(p.support).toBe(0);
  });

  it('Unuttum -> destek bir basamak cikar', () => {
    let p = introduceCard(CARDS[0], false, NOW);
    p = reviewCard(p, Rating.Good, false, day(1)).progress; // L2
    p = reviewCard(p, Rating.Again, false, day(2)).progress;
    expect(p.support).toBe(3);
  });

  it('destek L3un uzerine cikmaz', () => {
    let p = introduceCard(CARDS[0], false, NOW);
    p = reviewCard(p, Rating.Again, false, day(1)).progress;
    p = reviewCard(p, Rating.Again, false, day(2)).progress;
    expect(p.support).toBe(3);
  });

  it('Zor da destegi yukseltir', () => {
    let p = introduceCard(CARDS[0], false, NOW);
    p = reviewCard(p, Rating.Good, false, day(1)).progress; // L2
    p = reviewCard(p, Rating.Hard, false, day(2)).progress;
    expect(p.support).toBe(3);
  });

  it('kanca gosterildiyse basari destegi INDIRMEZ', () => {
    let p = introduceCard(CARDS[0], false, NOW);
    p = reviewCard(p, Rating.Good, false, day(1)).progress; // L2
    const before = p.support;

    const { progress } = reviewCard(p, Rating.Easy, true, day(2));
    expect(progress.support).toBe(before);
    expect(progress.hookRevealCount).toBe(1);
  });
});

describe('icerik kalite sinyalleri', () => {
  it('ilk tekrarda hatirlandiysa firstRecallOk true', () => {
    const p = introduceCard(CARDS[0], false, NOW);
    expect(reviewCard(p, Rating.Good, false, day(1)).progress.firstRecallOk).toBe(true);
  });

  it('kanca yardimiyla bilindiyse "haa" sayilmaz', () => {
    const p = introduceCard(CARDS[0], false, NOW);
    expect(reviewCard(p, Rating.Good, true, day(1)).progress.firstRecallOk).toBe(false);
  });

  it('firstRecallOk sonraki tekrarlarda degismez', () => {
    let p = introduceCard(CARDS[0], false, NOW);
    p = reviewCard(p, Rating.Again, false, day(1)).progress; // ilk tekrar: false
    p = reviewCard(p, Rating.Easy, false, day(2)).progress;
    expect(p.firstRecallOk).toBe(false);
  });
});

describe('seans kuyrugu', () => {
  it('Unuttum karti ayni seansa geri koyar', () => {
    const p = introduceCard(CARDS[0], false, NOW);
    expect(reviewCard(p, Rating.Again, false, day(1)).requeue).toBe(true);
  });

  it('Kolay karti seanstan cikarir', () => {
    const p = introduceCard(CARDS[0], false, NOW);
    expect(reviewCard(p, Rating.Easy, false, day(1)).requeue).toBe(false);
  });

  it('kuyruk vadesi gecmis kartlari erken olandan siralar', () => {
    const ps = introduceMany(3);
    const q = dueQueue(ps, day(30));
    expect(q).toHaveLength(3);
    expect(q.map((p) => p.due.getTime())).toEqual([...q.map((p) => p.due.getTime())].sort((a, b) => a - b));
  });

  it('vadesi gelmemis kart kuyruga girmez', () => {
    const p = introduceCard(CARDS[0], false, NOW);
    expect(dueQueue([p], NOW)).toHaveLength(0);
  });
});

describe('desteler', () => {
  it('ilk deste acik, sonrakiler kilitli', () => {
    const m = byId([]);
    expect(deckStatus(1, m, false)).toBe('active');
    expect(deckStatus(2, m, false)).toBe('locked');
  });

  it('deste 1 tamamen tanisilinca deste 2 acilir', () => {
    const m = byId(introduceMany(DECK_SIZE));
    expect(deckStatus(1, m, false)).toBe('introduced');
    expect(deckStatus(2, m, false)).toBe('active');
    expect(deckStatus(3, m, false)).toBe('locked');
  });

  it('kismen tanisilmis deste sonrakini acmaz', () => {
    const m = byId(introduceMany(DECK_SIZE - 1));
    expect(deckStatus(1, m, false)).toBe('active');
    expect(deckStatus(2, m, false)).toBe('locked');
  });

  it('testi gecilen deste "done"', () => {
    const m = byId(introduceMany(DECK_SIZE));
    expect(deckStatus(1, m, true)).toBe('done');
  });

  it('yeni kartlar deste sirasiyla gelir', () => {
    expect(currentIntroDeck(new Set())).toBe(1);
    expect(currentIntroDeck(new Set(CARDS.slice(0, DECK_SIZE).map((c) => c.id)))).toBe(2);
    expect(currentIntroDeck(new Set(CARDS.map((c) => c.id)))).toBeNull();
  });
});

describe('gunluk yeni kart butcesi', () => {
  it('gunde NEW_PER_DAY kadar verir', () => {
    expect(newCardsToday([], NOW)).toHaveLength(NEW_PER_DAY);
  });

  it('bugun tanisilanlar butceden duser', () => {
    const ps = introduceMany(3, NOW);
    expect(newCardsToday(ps, NOW)).toHaveLength(NEW_PER_DAY - 3);
  });

  it('butce bitince bos doner', () => {
    const ps = introduceMany(NEW_PER_DAY, NOW);
    expect(newCardsToday(ps, NOW)).toHaveLength(0);
  });

  it('ertesi gun butce yenilenir', () => {
    const ps = introduceMany(NEW_PER_DAY, NOW);
    expect(newCardsToday(ps, day(1))).toHaveLength(NEW_PER_DAY);
  });

  it('deste 1 bitince deste 2den devam eder', () => {
    const ps = introduceMany(DECK_SIZE, NOW);
    const next = newCardsToday(ps, day(1));
    expect(next[0].id).toBe(DECKS[1].cards[0].id);
  });

  it('tum kartlar tanisilinca bos doner', () => {
    const ps = CARDS.map((c) => introduceCard(c, false, NOW));
    expect(newCardsToday(ps, day(1))).toHaveLength(0);
  });
});

describe('deste testi kilidi', () => {
  it('tanisma tek basina testi acmaz', () => {
    expect(isTestUnlocked(1, byId(introduceMany(DECK_SIZE)))).toBe(false);
  });

  it('her kart TEST_UNLOCK_REPS kez tekrar edilince acilir', () => {
    let ps = introduceMany(DECK_SIZE);
    for (let r = 1; r <= TEST_UNLOCK_REPS; r++) {
      ps = ps.map((p) => reviewCard(p, Rating.Good, false, day(r)).progress);
    }
    expect(isTestUnlocked(1, byId(ps))).toBe(true);
  });

  it('tek kart geride kalirsa test acilmaz', () => {
    let ps = introduceMany(DECK_SIZE);
    for (let r = 1; r <= TEST_UNLOCK_REPS; r++) {
      ps = ps.map((p, i) => (i === 4 ? p : reviewCard(p, Rating.Good, false, day(r)).progress));
    }
    expect(isTestUnlocked(1, byId(ps))).toBe(false);
  });
});
