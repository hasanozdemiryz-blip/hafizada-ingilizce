import { describe, expect, it } from 'vitest';
import { isYesterday, nextStreak, relativeDue, todayKey } from './dates';

describe('siradaki tekrar metni', () => {
  const now = new Date(2026, 2, 10, 9, 0);
  const sonra = (ms: number) => relativeDue(new Date(now.getTime() + ms), now);

  it('gecmisteki vade "simdi"', () => expect(sonra(-5000)).toBe('şimdi'));
  it('dakikalar', () => expect(sonra(25 * 60_000)).toBe('25 dakika sonra'));
  it('ayni gun saatler', () => expect(sonra(4 * 3_600_000)).toBe('4 saat sonra'));
  it('ertesi gun "yarin"', () => expect(sonra(24 * 3_600_000)).toBe('yarın'));
  it('birkac gun', () => expect(sonra(3 * 86_400_000)).toBe('3 gün sonra'));
  it('haftalar', () => expect(sonra(14 * 86_400_000)).toBe('2 hafta sonra'));
  it('aylar', () => expect(sonra(60 * 86_400_000)).toBe('2 ay sonra'));
});

describe('seri', () => {
  const now = new Date('2026-03-10T21:00:00');

  it('ayni gun ikinci seans seriyi artirmaz', () => {
    const r = nextStreak({ streakCount: 4, lastSessionDate: '2026-03-10' }, now);
    expect(r.streakCount).toBe(4);
  });

  it('dun seans varsa seri artar', () => {
    const r = nextStreak({ streakCount: 4, lastSessionDate: '2026-03-09' }, now);
    expect(r.streakCount).toBe(5);
    expect(r.lastSessionDate).toBe('2026-03-10');
  });

  it('bosluk varsa sessizce 1e doner', () => {
    const r = nextStreak({ streakCount: 12, lastSessionDate: '2026-03-07' }, now);
    expect(r.streakCount).toBe(1);
  });

  it('ilk seans 1 ile baslar', () => {
    const r = nextStreak({ streakCount: 0, lastSessionDate: null }, now);
    expect(r.streakCount).toBe(1);
  });

  it('ay basinda gun geriye sarmasi dogru', () => {
    const marchFirst = new Date('2026-03-01T09:00:00');
    expect(isYesterday('2026-02-28', marchFirst)).toBe(true);
    expect(nextStreak({ streakCount: 3, lastSessionDate: '2026-02-28' }, marchFirst).streakCount).toBe(4);
  });

  it('todayKey yerel saati kullanir, UTC kaymasi yok', () => {
    expect(todayKey(new Date(2026, 2, 1, 0, 30))).toBe('2026-03-01');
    expect(todayKey(new Date(2026, 2, 1, 23, 30))).toBe('2026-03-01');
  });
});
