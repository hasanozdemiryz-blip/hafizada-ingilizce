/** Saf tarih mantigi — IndexedDB'ye bagimli degil, test edilebilir. */

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function isYesterday(dateKey: string, now = new Date()): boolean {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return dateKey === todayKey(y);
}

/**
 * "Siradaki tekrar ne zaman" — sayi degil, insan dili.
 * Birikmis borc yerine yaklasan seyi gostermek icin.
 */
export function relativeDue(due: Date, now = new Date()): string {
  const ms = due.getTime() - now.getTime();
  if (ms <= 0) return 'şimdi';

  const dk = Math.round(ms / 60_000);
  if (dk < 60) return `${dk} dakika sonra`;

  const saat = Math.round(dk / 60);
  if (saat < 24 && todayKey(due) === todayKey(now)) return `${saat} saat sonra`;

  const gun = Math.round((new Date(todayKey(due)).getTime() - new Date(todayKey(now)).getTime()) / 86_400_000);
  if (gun <= 1) return 'yarın';
  if (gun < 7) return `${gun} gün sonra`;
  if (gun < 30) return `${Math.round(gun / 7)} hafta sonra`;
  return `${Math.round(gun / 30)} ay sonra`;
}

/** YYYY-MM-DD anahtarini yerel ogleye sabitler — yaz saati kaymalarina dayanikli. */
const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

export const daysBetween = (a: string, b: string) =>
  Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);

/** Bugunden geriye n gunun anahtarlari, eskiden yeniye. */
export function lastNDays(n: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

export const FREEZE_EVERY = 7;
export const FREEZE_MAX = 2;

/**
 * Seri: odul var, ceza yok.
 *
 * Bugun zaten sayildiysa degismez; dun varsa +1.
 * TEK gun atlandiysa ve koruma hakki varsa hak harcanir, seri devam eder —
 * birakma ani genelde ilk kacirilan gunde geliyor.
 * Daha buyuk bosluklarda sessizce 1'e doner, suclayici bir sey olmaz.
 */
export function nextStreak(
  prev: { streakCount: number; lastSessionDate: string | null; freezes: number },
  now = new Date(),
): { streakCount: number; lastSessionDate: string; freezes: number; freezeUsed: boolean } {
  const today = todayKey(now);
  const { freezes } = prev;

  if (prev.lastSessionDate === today) {
    return { streakCount: prev.streakCount, lastSessionDate: today, freezes, freezeUsed: false };
  }
  if (!prev.lastSessionDate) {
    return { streakCount: 1, lastSessionDate: today, freezes, freezeUsed: false };
  }

  const gap = daysBetween(prev.lastSessionDate, today);
  const devam = (count: number, kalan: number, kullanildi: boolean) => ({
    streakCount: count,
    lastSessionDate: today,
    // her FREEZE_EVERY gunde bir koruma hakki kazanilir
    freezes:
      count % FREEZE_EVERY === 0 && !kullanildi ? Math.min(FREEZE_MAX, kalan + 1) : kalan,
    freezeUsed: kullanildi,
  });

  if (gap === 1) return devam(prev.streakCount + 1, freezes, false);
  if (gap === 2 && freezes > 0) return devam(prev.streakCount + 1, freezes - 1, true);

  return { streakCount: 1, lastSessionDate: today, freezes, freezeUsed: false };
}
