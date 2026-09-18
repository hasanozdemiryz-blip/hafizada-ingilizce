import { describe, expect, it } from 'vitest';
import { CARDS } from './content';
import { introduceCard } from './scheduler';
import {
  firstCheckRate,
  hardest,
  produceRate,
  stepSpread,
  unaidedRate,
  weakestHooks,
  weaknessScore,
} from './quality';
import type { Progress } from './types';

const NOW = new Date('2026-03-10T09:00:00');
const kayit = (i: number, patch: Partial<Progress> = {}): Progress => ({
  ...introduceCard(CARDS[i], NOW),
  ...patch,
});

describe('zayiflik skoru', () => {
  it('temiz kart 0 alir', () => {
    expect(weaknessScore(kayit(0))).toBe(0);
  });

  // Kanca ekrandan kalkinca dusmek en agir sinyal.
  it('kancasiz dusmek en agir sinyal', () => {
    expect(weaknessScore(kayit(0, { unaidedOk: false }))).toBeGreaterThan(
      weaknessScore(kayit(0, { firstCheckOk: false })),
    );
  });

  it('tekrarlanan sinyaller birikir', () => {
    expect(weaknessScore(kayit(0, { failCount: 3 }))).toBe(6);
    expect(weaknessScore(kayit(0, { hookRevealCount: 2 }))).toBe(2);
  });

  it('gecen kart o sinyalden puan almaz', () => {
    expect(weaknessScore(kayit(0, { unaidedOk: true, firstCheckOk: true }))).toBe(0);
  });
});

describe('zayif kanca listesi', () => {
  it('skoru 0 olanlari disarida birakir', () => {
    expect(weakestHooks([kayit(0), kayit(1)])).toEqual([]);
  });

  it('agirdan hafife siralar ve karti isimle verir', () => {
    const liste = weakestHooks([
      kayit(0, { hookRevealCount: 1 }),
      kayit(1, { unaidedOk: false, failCount: 2 }),
      kayit(2, { firstCheckOk: false }),
    ]);
    expect(liste.map((w) => w.card.id)).toEqual([CARDS[1].id, CARDS[2].id, CARDS[0].id]);
    expect(liste[0].reason).toBeTruthy();
  });

  it('limiti asmaz', () => {
    const cok = CARDS.slice(0, 20).map((_, i) => kayit(i, { unaidedOk: false }));
    expect(weakestHooks(cok, 8)).toHaveLength(8);
  });
});

describe('oranlar', () => {
  // Payda kucukken %100 hicbir sey soylemez.
  it('oran kac karta dayandigini birlikte verir', () => {
    expect(
      unaidedRate([
        kayit(0, { unaidedOk: true }),
        kayit(1, { unaidedOk: false }),
        kayit(2, { unaidedOk: null }),
      ]),
    ).toEqual({ percent: 50, of: 2 });
  });

  it('hic olculmemisse null — %0 ile karistirilmamali', () => {
    expect(unaidedRate([kayit(0)])).toBeNull();
    expect(firstCheckRate([kayit(0)])).toBeNull();
    expect(produceRate([kayit(0)])).toBeNull();
  });

  it('uc oran birbirinden bagimsiz okunur', () => {
    const rows = [kayit(0, { firstCheckOk: true, unaidedOk: false, produceOk: true })];
    expect(firstCheckRate(rows)).toEqual({ percent: 100, of: 1 });
    expect(unaidedRate(rows)).toEqual({ percent: 0, of: 1 });
    expect(produceRate(rows)).toEqual({ percent: 100, of: 1 });
  });
});

describe('merdiven dagilimi', () => {
  it('basamaklara gore sayar', () => {
    expect(
      stepSpread([kayit(0), kayit(1, { step: 3 }), kayit(2, { step: 6 }), kayit(3, { step: 6 })]),
    ).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 0, 6: 2 });
  });

  it('tanisilmamis kartlari saymaz', () => {
    expect(stepSpread([kayit(0), { ...kayit(1), introduced: false }])[1]).toBe(1);
  });

  it('bos girdide hepsi sifir', () => {
    expect(stepSpread([])).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  });
});

describe('en zorlandiklari', () => {
  it('agirdan hafife siralar', () => {
    const liste = hardest(
      [
        kayit(0, { hookRevealCount: 1 }),
        kayit(1, { unaidedOk: false, failCount: 2 }),
        kayit(2, { firstCheckOk: false }),
      ],
      10,
    );
    expect(liste.map((p) => p.cardId)).toEqual([CARDS[1].id, CARDS[2].id, CARDS[0].id]);
  });

  it('zorlanilmayanlari almaz', () => {
    expect(hardest([kayit(0), kayit(1)], 10)).toEqual([]);
  });

  it('istenen sayiyi asmaz', () => {
    const cok = CARDS.slice(0, 25).map((_, i) => kayit(i, { failCount: 1 }));
    expect(hardest(cok, 10)).toHaveLength(10);
  });

  it('tanisilmamis kart girmez', () => {
    expect(hardest([{ ...kayit(0, { failCount: 3 }), introduced: false }], 10)).toEqual([]);
  });
});
