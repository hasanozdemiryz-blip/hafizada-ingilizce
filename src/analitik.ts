/**
 * KULLANIM OLCUMU — Firebase Analytics.
 *
 * Bu dosya bir SINIR: uygulamanin geri kalani yalnizca `olay()` cagiriyor,
 * Firebase'i tanimiyor. Yarin vazgecilirse ya da baska bir araca
 * gecilirse degisen tek yer burasi.
 *
 * UC KURAL:
 *
 * 1. YAPILANDIRMA YOKSA SESSIZCE KAPALI. Anahtarlar ortam degiskeninden
 *    geliyor; yoksa `olay()` hicbir sey yapmiyor. Boylece gelistirme,
 *    testler ve depoyu klonlayan herkes analitik olmadan calisiyor —
 *    ve yanlislikla gelistirme verisi gercek olculere karismiyor.
 *
 * 2. KULLANICI KAPATABILIR. Ayarlar'daki anahtar `AppState.olcum`u
 *    cevirir; kapaliyken hicbir sey gonderilmez.
 *
 * 3. KISISEL VERI GONDERILMEZ. Profil ADI, avatar fotografi, yazilan
 *    cevaplar — hicbiri olaylara girmiyor. Gonderilen tek kimlik
 *    `Profil.id`: rastgele uretilmis, kullaniciyi disarida hicbir seye
 *    baglamayan bir sayi (bkz. profil.ts).
 *
 * NOT: Firebase kurulunca uygulama artik "hicbir veri toplamiyor"
 * demiyor. Play'deki Veri Guvenligi formu ve gizlilik metni buna gore
 * doldurulmali — beyan uyusmazligi politika ihlalidir (bkz. NOTLAR).
 */

/** Ortam degiskenleri — Firebase web yapilandirmasi gizli DEGILDIR. */
const AYAR = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** Yapilandirilmis mi — en az bu ikisi olmadan hicbir sey calismaz. */
export const olcumVarMi = (): boolean => Boolean(AYAR.apiKey && AYAR.appId);

/**
 * Olay adlari SABIT bir liste.
 *
 * Serbest metin olsaydi bir gun `ders_bitti`, baska gun `dersBitti`
 * yazilir ve panoda iki ayri olay gorunurdu — analitikte en sik yapilan
 * hata bu. Tip sistemi yazim hatasini derlemede yakaliyor.
 */
export type Olay =
  | 'uygulama_acildi'
  | 'karsilama_bitti'
  | 'ders_basladi'
  | 'ders_bitti'
  | 'biliyorum_dendi'
  | 'bilinen_geri_alindi'
  | 'egzersiz_basladi'
  | 'set_bitti'
  | 'profil_degisti'
  | 'hatirlatma_degisti'
  | 'yedek_alindi'
  | 'yedek_yuklendi';

type Veri = Record<string, string | number | boolean>;

/** Native kabukta Capacitor eklentisi, web'de Firebase JS — ikisi de tembel. */
type Gonderici = (ad: Olay, veri?: Veri) => void;
let gonderici: Gonderici | null = null;
let kapali = false;

const nativeKabuk = () =>
  typeof window !== 'undefined' &&
  Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform?.(),
  );

/**
 * Olcumu baslatir. Kapaliysa ya da yapilandirma yoksa hemen doner.
 *
 * Firebase paketi DINAMIK import ile geliyor: kapali oldugunda ya da
 * yapilandirilmadiginda ana pakete hic girmiyor, indirilmiyor bile.
 */
export async function olcumHazirla(acik: boolean, kullaniciId?: string): Promise<void> {
  kapali = !acik;
  if (!acik || !olcumVarMi() || gonderici) return;

  try {
    if (nativeKabuk()) {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setEnabled({ enabled: true });
      if (kullaniciId) await FirebaseAnalytics.setUserId({ userId: kullaniciId });
      gonderici = (ad, veri) => void FirebaseAnalytics.logEvent({ name: ad, params: veri });
    } else {
      const [{ initializeApp }, { getAnalytics, logEvent, setUserId }] = await Promise.all([
        import('firebase/app'),
        import('firebase/analytics'),
      ]);
      const analytics = getAnalytics(initializeApp(AYAR));
      if (kullaniciId) setUserId(analytics, kullaniciId);
      gonderici = (ad, veri) => logEvent(analytics, ad, veri);
    }
  } catch {
    // Olcum kurulamadi — uygulama etkilenmez. Sessiz kalmasi DOGRU:
    // istatistik icin kullaniciya hata gostermek olcunun bedeli olamaz.
    gonderici = null;
  }
}

/** Kullanici anahtari kapattiysa bundan sonrasi gonderilmez. */
export async function olcumuKapat(): Promise<void> {
  kapali = true;
  gonderici = null;
  if (!nativeKabuk() || !olcumVarMi()) return;
  try {
    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    await FirebaseAnalytics.setEnabled({ enabled: false });
  } catch {
    /* eklenti yoksa zaten gonderen bir sey yok */
  }
}

/**
 * Tek cagri noktasi.
 *
 * Hicbir yerde `await` istemiyor ve hicbir zaman hata firlatmiyor:
 * olcum, olctugu akisi bozmamali.
 */
export function olay(ad: Olay, veri?: Veri): void {
  if (kapali || !gonderici) return;
  try {
    gonderici(ad, veri);
  } catch {
    /* yut */
  }
}
