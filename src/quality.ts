/**
 * Kanca kalitesi.
 *
 * Uygulama ayni zamanda bir icerik olcum araci: hangi kancanin revize
 * edilecegine tahminle degil veriyle karar verilsin diye. Burasi o verinin
 * okundugu yer — saf, IndexedDB'ye bagimsiz, test edilebilir.
 *
 * Olcumun NEREDE yapildigi onemli (bkz. exercise.ts):
 *   Adim 1-2 — kanca zaten ekranda, sorular tanima. Buradan gelen "dogru"
 *              kancanin ise yarayip yaramadigini SOYLEMEZ.
 *   Adim 3-6 — kanca yalnizca ipucu. Gercek sinav burada.
 *
 * Tek istisna `firstCheckOk`: o, tanismanin hemen ardindaki olcum. Kalici
 * hafizayi degil, kancanin ilk duyusta tutup tutmadigini soyler — ve
 * beyan degil, cevaptir.
 */
import { CARD_BY_ID } from './content';
import type { Card, Progress, Step } from './types';

export type WeakHook = {
  card: Card;
  score: number;
  /** Skora en cok katkiyi yapan sebep — listede tek satirda gosterilir. */
  reason: string;
};

/**
 * Zayiflik skoru.
 *
 * Agirliklar kasitli: kanca ekrandan kalkinca dusmek en agir sinyal,
 * cunku dogrudan "bu kanca anlami getirmiyor" demek. Ilk denemede
 * tutmamak ikinci sirada; sonradan oturmus olabilir. Ipucuna donmek ve
 * tekrar tekrar dusmek birikimli sinyaller.
 */
export function weaknessScore(p: Progress): number {
  return (
    (p.unaidedOk === false ? 3 : 0) +
    (p.firstCheckOk === false ? 2 : 0) +
    p.failCount * 2 +
    p.hookRevealCount
  );
}

function reasonOf(p: Progress): string {
  if (p.unaidedOk === false) return 'kanca tek başına anlamı getirmedi';
  if (p.failCount > 0) return `kancasız ${p.failCount} kez düştü`;
  if (p.firstCheckOk === false) return 'ilk denemede tutmadı';
  if (p.hookRevealCount > 0) return `${p.hookRevealCount} kez ipucuna dönüldü`;
  return '';
}

/** En zayif kancalar, agirdan hafife. Skoru 0 olanlar listeye girmez. */
export function weakestHooks(all: Progress[], limit = 8): WeakHook[] {
  return all
    .map((p) => ({ p, score: weaknessScore(p) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ p, score }) => {
      const card = CARD_BY_ID.get(p.cardId);
      return card ? { card, score, reason: reasonOf(p) } : null;
    })
    .filter((w): w is WeakHook => w !== null)
    .slice(0, limit);
}

/** Bir oran ve kac karta dayandigi. Payda kucukken sayiya guvenilmemeli. */
export type Rate = { percent: number; of: number };

const rateOf = (rows: (boolean | null)[]): Rate | null => {
  const olculen = rows.filter((v): v is boolean => v !== null);
  if (olculen.length === 0) return null;
  return {
    percent: Math.round((olculen.filter(Boolean).length / olculen.length) * 100),
    of: olculen.length,
  };
};

/** Ogrenme testinde ilk denemede tuttu mu — kancanin ilk izlenimi. */
export const firstCheckRate = (all: Progress[]) => rateOf(all.map((p) => p.firstCheckOk));

/** Kanca ekrandan kalkinca anlami getirdi mi — kancanin gercek sinavi. */
export const unaidedRate = (all: Progress[]) => rateOf(all.map((p) => p.unaidedOk));

/** Ilk yazma denemesi tuttu mu — beyan degil, yazildi. */
export const produceRate = (all: Progress[]) => rateOf(all.map((p) => p.produceOk));

/** Merdivendeki dagilim — kullaniciya "nerede duruyorsun" diye gosterilir. */
export function stepSpread(all: Progress[]): Record<Step, number> {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<Step, number>;
  for (const p of all) if (p.introduced) out[p.step]++;
  return out;
}

/**
 * En cok zorlanilan N kart.
 * Skoru 0 olanlar zaten "zorlanilan" degil, listeye girmez.
 */
export function hardest(all: Progress[], count: number): Progress[] {
  return all
    .filter((p) => p.introduced && weaknessScore(p) > 0)
    .sort((a, b) => weaknessScore(b) - weaknessScore(a))
    .slice(0, count);
}
