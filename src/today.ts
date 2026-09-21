/**
 * "Bugun" tek bir yerden okunur.
 *
 * Uygulamada gunun degistigini fark eden hicbir sey yoktu: `new Date()`
 * yalnizca render aninda okunuyor, render ise veritabani degisince ya da
 * sekme degisince oluyordu. Telefonda uygulama acik dururken gece yarisi
 * gecilince ekran dunun durumunda donuyordu — gunluk hedefin dolduran
 * gunun ertesinde ana ekran hala "Hizli tekrar" diyordu.
 *
 * Haber YALNIZCA gun gercekten degisince veriliyor. Her tik'ta vermek
 * butun ekrani dakika basi bosuna yeniden cizerdi.
 */
import { useSyncExternalStore } from 'react';
import { todayKey } from './dates';

/**
 * Gece yarisini bir dakika icinde yakalamak yeterli: ekrana o anda bakan
 * kullanici icin bir dakikalik gecikme gorunmez.
 */
const TICK_MS = 60_000;

let bugun = todayKey();
const dinleyiciler = new Set<() => void>();
let sayac: ReturnType<typeof setInterval> | null = null;

/**
 * Gun degistiyse degeri tazeler ve aboneleri uyarir.
 * Donen deger "gun degisti mi" — test bunu okuyor.
 */
export function gunuKontrolEt(now = new Date()): boolean {
  const yeni = todayKey(now);
  if (yeni === bugun) return false;
  bugun = yeni;
  for (const f of [...dinleyiciler]) f();
  return true;
}

/** Olay dinleyicisi olarak gecen argumani yutar — `Event` tarih sanilmasin. */
const kontrol = () => {
  gunuKontrolEt();
};

/**
 * Zamanlayici arka planda uyutulabiliyor, o yuzden tek basina yetmez:
 * telefonda guvenilir sinyal uygulamanin one gelmesi. Ikisi birlikte.
 */
function dinlemeyeBasla() {
  sayac = setInterval(kontrol, TICK_MS);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', kontrol);
  if (typeof window !== 'undefined') window.addEventListener('focus', kontrol);
}

function dinlemeyiBirak() {
  if (sayac !== null) clearInterval(sayac);
  sayac = null;
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', kontrol);
  if (typeof window !== 'undefined') window.removeEventListener('focus', kontrol);
}

/** Abone yokken zamanlayici da calismaz. */
export function guneAbone(f: () => void): () => void {
  dinleyiciler.add(f);
  if (dinleyiciler.size === 1) dinlemeyeBasla();
  return () => {
    dinleyiciler.delete(f);
    if (dinleyiciler.size === 0) dinlemeyiBirak();
  };
}

/** Bugunun YYYY-MM-DD anahtari. Gun degisince bilesen yeniden cizilir. */
export const useToday = () => useSyncExternalStore(guneAbone, () => bugun);
