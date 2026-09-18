import { describe, expect, it } from 'vitest';
import { FREEZE_MAX, isYesterday, lastNDays, nextStreak, relativeDue, todayKey } from './dates';

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
  const now = new Date(2026, 2, 10, 21, 0);
  const durum = (streakCount: number, lastSessionDate: string | null, freezes = 0) => ({
    streakCount,
    lastSessionDate,
    freezes,
  });

  it('ayni gun ikinci seans seriyi artirmaz', () => {
    expect(nextStreak(durum(4, '2026-03-10'), now).streakCount).toBe(4);
  });

  it('dun seans varsa seri artar', () => {
    const r = nextStreak(durum(4, '2026-03-09'), now);
    expect(r.streakCount).toBe(5);
    expect(r.lastSessionDate).toBe('2026-03-10');
  });

  it('ilk seans 1 ile baslar', () => {
    expect(nextStreak(durum(0, null), now).streakCount).toBe(1);
  });

  it('ay basinda gun geriye sarmasi dogru', () => {
    const martBir = new Date(2026, 2, 1, 9, 0);
    expect(isYesterday('2026-02-28', martBir)).toBe(true);
    expect(nextStreak(durum(3, '2026-02-28'), martBir).streakCount).toBe(4);
  });

  it('todayKey yerel saati kullanir, UTC kaymasi yok', () => {
    expect(todayKey(new Date(2026, 2, 1, 0, 30))).toBe('2026-03-01');
    expect(todayKey(new Date(2026, 2, 1, 23, 30))).toBe('2026-03-01');
  });
});

describe('seri korumasi (donma)', () => {
  const now = new Date(2026, 2, 10, 21, 0);
  const durum = (streakCount: number, lastSessionDate: string | null, freezes = 0) => ({
    streakCount,
    lastSessionDate,
    freezes,
  });

  it('koruma hakki yoksa bir gunluk bosluk seriyi sifirlar', () => {
    const r = nextStreak(durum(12, '2026-03-08', 0), now);
    expect(r.streakCount).toBe(1);
    expect(r.freezeUsed).toBe(false);
  });

  it('koruma hakki varsa bir gunluk bosluk seriyi bozmaz', () => {
    const r = nextStreak(durum(12, '2026-03-08', 1), now);
    expect(r.streakCount).toBe(13);
    expect(r.freezes).toBe(0);
    expect(r.freezeUsed).toBe(true);
  });

  it('iki gunden uzun bosluk koruma hakkiyla bile kurtarilmaz', () => {
    const r = nextStreak(durum(12, '2026-03-05', 2), now);
    expect(r.streakCount).toBe(1);
    expect(r.freezes).toBe(2); // hak bosa harcanmaz
  });

  it('7 gunde bir koruma hakki kazanilir', () => {
    const r = nextStreak(durum(6, '2026-03-09', 0), now);
    expect(r.streakCount).toBe(7);
    expect(r.freezes).toBe(1);
  });

  it('koruma hakki tavani asmaz', () => {
    const r = nextStreak(durum(13, '2026-03-09', FREEZE_MAX), now);
    expect(r.streakCount).toBe(14);
    expect(r.freezes).toBe(FREEZE_MAX);
  });
});

describe('gunluk takip', () => {
  it('son n gunun anahtarlari eskiden yeniye gelir', () => {
    const g = lastNDays(3, new Date(2026, 2, 10, 9, 0));
    expect(g).toEqual(['2026-03-08', '2026-03-09', '2026-03-10']);
  });

  it('84 gun = 12 hafta', () => {
    expect(lastNDays(84)).toHaveLength(84);
  });
});

