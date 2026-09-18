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

export type Yetenekler = {
  /** Gorunce anliyorum */
  taniyor: number;
  /** Turkcesinden Ingilizcesini secebiliyorum */
  seciyor: number;
  /** Bastan yazabiliyorum */
  yaziyor: number;
  toplam: number;
};

/**
 * Kullanicinin NE YAPABILDIGI — birikimli.
 *
 * Once basamaklar birbirini disliyan uc kutuya boluyordu (1-2 tanima,
 * 3-4 gecis, 5-6 uretim). Yaniltiyordu: "Tanima 2" yazinca "sadece 2
 * kelimeyi taniyorum" gibi okunuyor, oysa hepsini taniyor — ikisi o
 * basamakta DURUYOR.
 *
 * Beceri birikimli: 5. basamaktaki kelime 3. basamaktan gecerek geldi,
 * yani onu hem taniyor hem secebiliyor. Sayim da birikimli olmali.
 *
 * Geri dusen kart istisna degil: 5'ten 2'ye dusen kelime artik gercekten
 * secemiyor demektir, ve `step >= 3` onu dogru sekilde saymiyor.
 */
export function abilities(all: Progress[]): Yetenekler {
  const ogrenilen = all.filter((p) => p.introduced);
  return {
    taniyor: ogrenilen.length,
    seciyor: ogrenilen.filter((p) => p.step >= 3).length,
    yaziyor: ogrenilen.filter((p) => p.step >= 5).length,
    toplam: ogrenilen.length,
  };
}
