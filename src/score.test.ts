import { describe, expect, it } from 'vitest';
import { CARDS } from './content';
import { introduceCard } from './scheduler';
import { activeDays, masteryRate, stepGroups, successRate } from './score';
import type { AppState, Progress, Step } from './types';

const NOW = new Date('2026-03-10T09:00:00');
/** n gun once */
const key = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const gunler = (kayit: Record<number, { r?: number; i?: number; d?: number; y?: number }>) =>
  Object.fromEntries(
    Object.entries(kayit).map(([n, v]) => [key(Number(n)), { r: 0, i: 0, ...v }]),
  ) as AppState['days'];

const kart = (i: number, step: Step): Progress => ({ ...introduceCard(CARDS[i], NOW), step });

describe('basari orani', () => {
  it('secili penceredeki dogru oranini verir', () => {
    const d = gunler({ 0: { d: 8, y: 2 } });
    expect(successRate(d, 'gun', NOW)).toEqual({ percent: 80, dogru: 8, toplam: 10 });
  });

  it('hafta penceresi son 7 gunu toplar', () => {
    const d = gunler({ 0: { d: 5, y: 5 }, 3: { d: 10, y: 0 }, 6: { d: 5, y: 0 } });
    expect(successRate(d, 'hafta', NOW)).toEqual({ percent: 80, dogru: 20, toplam: 25 });
  });

  it('pencere disindaki gunleri saymaz', () => {
    const d = gunler({ 0: { d: 1, y: 0 }, 10: { d: 100, y: 0 } });
    expect(successRate(d, 'hafta', NOW)?.toplam).toBe(1);
    expect(successRate(d, 'ay', NOW)?.toplam).toBe(101);
  });

  /*
   * "Hic cevap yok" ile "hepsi yanlis" ayri seyler; ikisi de %0 gorunmemeli.
   */
  it('hic cevap yoksa null doner', () => {
    expect(successRate({}, 'gun', NOW)).toBeNull();
    expect(successRate(gunler({ 0: { r: 5 } }), 'gun', NOW)).toBeNull();
  });

  it('hepsi yanlissa %0 doner, null degil', () => {
    expect(successRate(gunler({ 0: { d: 0, y: 4 } }), 'gun', NOW)).toEqual({
      percent: 0,
      dogru: 0,
      toplam: 4,
    });
  });

  it('eski kayitlarda d/y yoksa cokmez', () => {
    expect(successRate(gunler({ 0: { r: 12, i: 5 } }), 'hafta', NOW)).toBeNull();
  });
});

describe('duzenlilik', () => {
  it('penceredeki calisilan gun sayisini verir', () => {
    const d = gunler({ 0: { r: 3 }, 2: { i: 5 }, 5: { r: 1 } });
    expect(activeDays(d, 'hafta', NOW)).toEqual({ calisilan: 3, toplam: 7 });
  });

  it('bos gun sayilmaz', () => {
    expect(activeDays(gunler({ 0: { r: 0, i: 0 } }), 'hafta', NOW).calisilan).toBe(0);
  });

  it('ay penceresi 30 gun', () => {
    expect(activeDays({}, 'ay', NOW).toplam).toBe(30);
  });
});

describe('ustalik', () => {
  // 1. basamak %0, 6. basamak %100.
  it('en alt %0, en ust %100', () => {
    expect(masteryRate([kart(0, 1)])).toBe(0);
    expect(masteryRate([kart(0, 6)])).toBe(100);
  });

  it('ortalamayi alir', () => {
    expect(masteryRate([kart(0, 1), kart(1, 6)])).toBe(50);
  });

  it('tanisilmamis kart sayilmaz', () => {
    const ps = [kart(0, 6), { ...kart(1, 1), introduced: false }];
    expect(masteryRate(ps)).toBe(100);
  });

  it('hic kelime yoksa null', () => {
    expect(masteryRate([])).toBeNull();
    expect(masteryRate([{ ...kart(0, 1), introduced: false }])).toBeNull();
  });
});

describe('merdiven gruplari', () => {
  it('alti basamagi uc anlamli gruba toplar', () => {
    expect(
      stepGroups([kart(0, 1), kart(1, 2), kart(2, 3), kart(3, 4), kart(4, 5), kart(5, 6)]),
    ).toEqual({ tanima: 2, gecis: 2, uretim: 2 });
  });

  it('tanisilmamis kart girmez', () => {
    expect(stepGroups([{ ...kart(0, 6), introduced: false }])).toEqual({
      tanima: 0,
      gecis: 0,
      uretim: 0,
    });
  });
});
