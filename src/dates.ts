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

/**
 * Seri: odul var, ceza yok.
 * Bugun zaten sayildiysa degismez; dun varsa +1; bosluk varsa sessizce 1.
 */
export function nextStreak(
  prev: { streakCount: number; lastSessionDate: string | null },
  now = new Date(),
): { streakCount: number; lastSessionDate: string } {
  const today = todayKey(now);
  if (prev.lastSessionDate === today) {
    return { streakCount: prev.streakCount, lastSessionDate: today };
  }
  const streakCount =
    prev.lastSessionDate && isYesterday(prev.lastSessionDate, now) ? prev.streakCount + 1 : 1;
  return { streakCount, lastSessionDate: today };
}
