/**
 * Avatar ve cerceve gorselleri — ad -> URL.
 *
 * `icons.ts` ile ayni desen: klasor glob'lanir, elle liste tutulmaz.
 * Uretilen dosya kendiliginden gelir (bkz. tools/make-avatars.mjs,
 * tools/make-frames.mjs).
 */
import olcu from './assets/cerceveler/olcu.json';

const url = (kayit: Record<string, string>) =>
  new Map(
    Object.entries(kayit).map(([yol, u]) => [yol.split('/').pop()!.replace(/\.[^.]+$/, ''), u]),
  );

const HAYVAN_URL = url(
  import.meta.glob('./assets/avatarlar/*.webp', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
);

const CERCEVE_URL = url(
  import.meta.glob('./assets/cerceveler/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
);

/**
 * Cercevenin ICINDEKI deligin capi, tuvale oranla.
 *
 * ELLE YAZILMIYOR: uretim her cerceveyi olcup en genisine gore
 * hesapliyor ve `olcu.json`'a yaziyor. Sayiyi iki yerde tutmak, bir gun
 * cerceve seti degisince avatarin sessizce kaymasi demekti.
 */
export const IC_ORAN: number = olcu.icOran;

export function hayvanUrl(ad: string): string {
  const u = HAYVAN_URL.get(ad);
  if (!u) throw new Error(`Avatar yok: ${ad} — 'npm run avatars' calistirildi mi?`);
  return u;
}

export function cerceveUrl(ad: string): string {
  const u = CERCEVE_URL.get(ad);
  if (!u) throw new Error(`Cerceve yok: ${ad} — 'npm run frames' calistirildi mi?`);
  return u;
}

/** Testler ve butunluk kontrolu icin. */
export const HAYVAN_ADLARI = [...HAYVAN_URL.keys()].sort();
export const CERCEVE_ADLARI = [...CERCEVE_URL.keys()].filter((a) => a !== 'olcu').sort();
