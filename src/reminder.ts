/**
 * Gunluk hatirlatma.
 *
 * YALNIZCA native kabukta (APK) var. Tarayicida bir PWA, kapaliyken
 * kendi kendine bildirim gonderemez — bunun icin bir sunucunun push
 * servisine mesaj birakmasi gerekir ve "backend yok" sozunu bozar.
 * Cihazin kendi zamanlayicisi ise sunucu istemiyor: bildirimi telefon
 * tutuyor, uygulama kapaliyken de calisiyor.
 *
 * Bu yuzden arayuz motor bulunmadan ACILMIYOR (bkz. `useHatirlatma`):
 * web'de hicbir sey yapmayan bir anahtar gostermektense hic gostermemek
 * dogru — telaffuzda da ayni kural isliyor (bkz. speech.ts).
 *
 * Dil bilincli: seri "odul var, ceza yok" ilkesiyle kuruldu, hatirlatma
 * da oyle olmali. "Serin kirilacak" demiyoruz.
 */
import { useSyncExternalStore } from 'react';

type Eklenti = (typeof import('@capacitor/local-notifications'))['LocalNotifications'];

/** Tek bildirim, hep ayni kimlik: yeniden kurmak eskisinin uzerine yazar. */
const KIMLIK = 1;

/** Sunulan saatler. Serbest saat secici degil — az secenek, hizli karar. */
export const HATIRLATMA_SAATLERI = [9, 13, 19, 21] as const;
export type HatirlatmaSaati = (typeof HATIRLATMA_SAATLERI)[number];

let eklenti: Eklenti | null = null;
let motor: 'native' | 'yok' = 'yok';
const dinleyiciler = new Set<() => void>();

/** Capacitor native kabukta koprusunu `window.Capacitor` olarak enjekte eder. */
const nativeKabuk = () =>
  typeof window !== 'undefined' &&
  Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

/**
 * Motoru arar. Web'de hemen doner, hicbir sey geciktirmez; eklenti
 * dinamik `import` ile cagrildigi icin web paketine de girmez.
 */
export async function hatirlatmaHazirla(): Promise<void> {
  if (motor !== 'yok' || !nativeKabuk()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    eklenti = LocalNotifications;
    motor = 'native';
    for (const f of [...dinleyiciler]) f();
  } catch {
    // Eklenti yoksa sessizce kapali kalir; arayuz zaten acilmaz.
  }
}

const abone = (f: () => void) => {
  dinleyiciler.add(f);
  return () => void dinleyiciler.delete(f);
};

export const hatirlatmaVar = () => motor === 'native';

/** Bilesenler bunu kullanir: motor bulununca arayuz kendiliginden acilir. */
export const useHatirlatma = () => useSyncExternalStore(abone, hatirlatmaVar, () => false);

/**
 * Gunluk tekrarlanan bildirimi kurar.
 * Izin verilmezse `false` doner — cagiran yeri ayara yazmamali.
 */
export async function hatirlatmayiKur(saat: number): Promise<boolean> {
  if (!eklenti) return false;
  try {
    const izin = await eklenti.requestPermissions();
    if (izin.display !== 'granted') return false;

    await hatirlatmayiKapat();
    await eklenti.schedule({
      notifications: [
        {
          id: KIMLIK,
          title: 'Hafızada İngilizce',
          body: 'Bugünün kelimeleri hazır.',
          schedule: { on: { hour: saat, minute: 0 }, allowWhileIdle: true },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function hatirlatmayiKapat(): Promise<void> {
  if (!eklenti) return;
  try {
    await eklenti.cancel({ notifications: [{ id: KIMLIK }] });
  } catch {
    // Kurulu bildirim yoksa iptal hata verebilir; sonucu degistirmiyor.
  }
}
