import { VARSAYILAN_CERCEVE } from './cerceveler';
import type { Profil } from './types';

/**
 * YEREL PROFIL.
 *
 * Hesap DEGIL ve oyle anilmiyor: e-posta yok, sifre yok, "giris yap" yok,
 * sunucu yok. Isim ve avatar cihazda duruyor, yedek dosyasiyla birlikte
 * tasiniyor. Uygulama icinde her yerde "profil" denir — "hesap" kelimesi
 * kullanilirsa insanlar verilerinin bulutta oldugunu sanip yedek almayi
 * birakir ve veri kaybi ARTAR.
 *
 * Kullanici hicbir sey yapmadan bir profili olur: ad ve avatar ilk
 * acilista uretilir. Istemeyen hic dokunmaz, isteyen degistirir.
 */

/**
 * `id` NEDEN VAR — tek gorunmeyen alan ve ileriye donuk tek onemli olan.
 *
 * Isim kimlik degildir: iki kisi de "Meraklı Tilki" olabilir, kullanici
 * adini her gun degistirebilir. Kalici, rastgele bir kimlik olmadan
 * ileride bulut senkronu geldiginde "bu ayni kisinin yeniden kurulumu mu,
 * yoksa baska biri mi" sorusu CEVAPSIZ kalir ve herkes sifirdan baslar.
 *
 * Uretildigi an disinda hic degismez, kullaniciya hic gosterilmez,
 * hicbir yere gonderilmez. Yedege giriyor, yani cihaz degistiren kisi
 * kimligini de tasiyor.
 */
export const yeniKimlik = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  // Eski WebView'larda randomUUID yok; benzersizlik icin yeterli.
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Otomatik ad: sifat + hayvan.
 *
 * Hayvanlar setteki kartlardan secildi (yılan, tilki, fil, keçi, balık…),
 * yani kullanicinin zaten gordugu dunyadan. Kisisel veri iceren hicbir
 * sey uretilmiyor.
 */
export const SIFATLAR = [
  'Meraklı', 'Çevik', 'Neşeli', 'Sakin', 'Cesur', 'Zeki',
  'Şen', 'Hızlı', 'Uyanık', 'Kıvrak', 'Titiz', 'Atak',
] as const;

/**
 * Ad ile YUZ ayni yerden geliyor.
 *
 * Her hayvanin cizilmis bir avatari var (bkz. tools/make-avatars.mjs) ve
 * `dosya` o cizimin adi. Otomatik uretilen ad "Meraklı Tilki" ise avatar
 * da tilki olarak basliyor — kullanici hicbir sey yapmadan kendine ait
 * bir seye bakiyor.
 *
 * Bu liste ile avatar klasoru AYRISIRSA profil adsiz bir yuze duser:
 * `profil.test.ts` ikisini karsilastiriyor.
 */
export const HAYVANLAR = [
  { ad: 'Tilki', dosya: 'tilki' },
  { ad: 'Baykuş', dosya: 'baykus' },
  { ad: 'Fil', dosya: 'fil' },
  { ad: 'Ayı', dosya: 'ayi' },
  { ad: 'Kedi', dosya: 'kedi' },
  { ad: 'Ördek', dosya: 'ordek' },
  { ad: 'Balık', dosya: 'balik' },
  { ad: 'Arı', dosya: 'ari' },
  { ad: 'Yılan', dosya: 'yilan' },
] as const;

const sec = <T,>(xs: readonly T[], rastgele: () => number) =>
  xs[Math.floor(rastgele() * xs.length)];

export const rastgeleAd = (rastgele: () => number = Math.random): string =>
  `${sec(SIFATLAR, rastgele)} ${sec(HAYVANLAR, rastgele).ad}`;

/**
 * Ilk acilista bir kez uretilir ve kaydedilir (bkz. db.ts `profilSagla`).
 *
 * Ad ve avatar AYNI hayvandan: "Meraklı Tilki" adiyla acilan profilde
 * tilki resmi duruyor. Cerceve herkeste olan sade halka — digerleri
 * kazanilir (bkz. cerceveler.ts).
 */
export function yeniProfil(rastgele: () => number = Math.random): Profil {
  const hayvan = sec(HAYVANLAR, rastgele);
  return {
    id: yeniKimlik(),
    ad: `${sec(SIFATLAR, rastgele)} ${hayvan.ad}`,
    avatar: { tip: 'hayvan', ad: hayvan.dosya },
    cerceve: VARSAYILAN_CERCEVE,
    olusturuldu: new Date().toISOString(),
  };
}

/** Ad kutusunun siniri — bos birakilirsa yenisi uretilir, bos ad kalmaz. */
export const AD_SINIR = 24;

export function adDuzelt(girdi: string, rastgele: () => number = Math.random): string {
  const temiz = girdi.replace(/\s+/g, ' ').trim().slice(0, AD_SINIR);
  return temiz.length > 0 ? temiz : rastgeleAd(rastgele);
}

/**
 * Okunan profili gecerli hale getirir.
 *
 * Bir sure avatar olarak marka IKONU da secilebiliyordu; secenek kalkti
 * (hayvan portrelerinin yaninda sonuk duruyordu). Eski bir kayitta oyle
 * bir avatar kalmis olabilir — cizilemeyecek bir sekle birakmak yerine
 * hayvana cevriliyor. Ad zaten bir hayvanla bitiyorsa O hayvan secilir,
 * yoksa rastgele biri.
 */
export function profilDuzelt(profil: Profil): Profil {
  if (profil.avatar.tip === 'hayvan' || profil.avatar.tip === 'foto') return profil;
  const eslesen = HAYVANLAR.find((h) => profil.ad.endsWith(h.ad)) ?? HAYVANLAR[0];
  return { ...profil, avatar: { tip: 'hayvan', ad: eslesen.dosya } };
}
