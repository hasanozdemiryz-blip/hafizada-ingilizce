/** Saf tarih mantigi — IndexedDB'ye bagimli degil, test edilebilir. */

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function isYesterday(dateKey: string, now = new Date()): boolean {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return dateKey === todayKey(y);
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
