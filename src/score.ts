/**
 * Puanlama.
 *
 * Once "Nerede duruyorsun" diye alti satirlik bir DAGILIM vardi
 * (`1. Eslestirme: 7`, `2. Coktan secmeli: 2`...). Dagilim, degerlendirme
 * degil: "iyi gidiyor muyum?" sorusuna cevap vermiyordu.
 *
 * Yerine iki yuzde:
 *   Basari  — verdigin cevaplarin ne kadari dogru (donemsel)
 *   Ustalik — kelimelerin merdivende ne kadar yukari ciktigi (anlik)
 *
 * Saf: IndexedDB'ye ve DOM'a bagimsiz, test edilebilir.
 */
import { SON_ADIM, ILK_ADIM } from './exercise';
import { lastNDays } from './dates';
import type { AppState, Progress } from './types';

export type Pencere = 'gun' | 'hafta' | 'ay';

export const PENCERELER: { id: Pencere; ad: string; gun: number }[] = [
  { id: 'gun', ad: 'Gün', gun: 1 },
  { id: 'hafta', ad: 'Hafta', gun: 7 },
  { id: 'ay', ad: 'Ay', gun: 30 },
];

export const pencereGun = (p: Pencere) => PENCERELER.find((x) => x.id === p)!.gun;

export type Basari = { percent: number; dogru: number; toplam: number };

/**
 * Secili penceredeki dogru cevap orani.
 *
 * `null`: o donemde hic cevap yok. %0 ile karistirilmamali — biri
 * "denedim, tutturamadim", digeri "hic calismadim".
 */
export function successRate(
  days: AppState['days'],
  pencere: Pencere,
  now = new Date(),
): Basari | null {
  let dogru = 0;
  let yanlis = 0;
  for (const key of lastNDays(pencereGun(pencere), now)) {
    const g = days[key];
    if (!g) continue;
    dogru += g.d ?? 0;
    yanlis += g.y ?? 0;
  }
  const toplam = dogru + yanlis;
  if (toplam === 0) return null;
  return { percent: Math.round((dogru / toplam) * 100), dogru, toplam };
}

/** Penceredeki kac gunde calisildigi — duzenlilik, takvim olmadan. */
export function activeDays(
  days: AppState['days'],
  pencere: Pencere,
  now = new Date(),
): { calisilan: number; toplam: number } {
  const gunler = lastNDays(pencereGun(pencere), now);
  const calisilan = gunler.filter((k) => {
    const g = days[k];
    return g ? g.r + g.i > 0 : false;
  }).length;
  return { calisilan, toplam: gunler.length };
}

/**
 * Ustalik: kelimelerin merdivendeki ortalama yuksekligi.
 * 1. basamak %0, 6. basamak %100. "Kac kelime biliyorum" degil,
 * "ne kadar iyi biliyorum".
 */
export function masteryRate(all: Progress[]): number | null {
  const ogrenilen = all.filter((p) => p.introduced);
  if (ogrenilen.length === 0) return null;
  const aralik = SON_ADIM - ILK_ADIM;
  const toplam = ogrenilen.reduce((n, p) => n + (p.step - ILK_ADIM) / aralik, 0);
  return Math.round((toplam / ogrenilen.length) * 100);
}

export type Gruplar = { tanima: number; gecis: number; uretim: number };

/**
 * Merdivenin uc anlamli grubu.
 * Alti basamagi tek tek gostermek karmasik; tanima/gecis/uretim ayrimi
 * kullanicinin gercekten anladigi sey.
 */
export function stepGroups(all: Progress[]): Gruplar {
  const out: Gruplar = { tanima: 0, gecis: 0, uretim: 0 };
  for (const p of all) {
    if (!p.introduced) continue;
    if (p.step <= 2) out.tanima++;
    else if (p.step <= 4) out.gecis++;
    else out.uretim++;
  }
  return out;
}
