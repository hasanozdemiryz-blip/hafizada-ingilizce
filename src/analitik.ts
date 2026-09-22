/**
 * KULLANIM OLCUMU — kendi Supabase tablomuz.
 *
 * Bu dosya bir SINIR: uygulamanin geri kalani yalnizca `olay()` cagiriyor.
 * Vazgecilirse ya da baska bir araca gecilirse degisen tek yer burasi.
 *
 * NEDEN SDK YOK. Supabase'in PostgREST arayuzu duz bir HTTP ucu; tek
 * ihtiyacimiz olan sey bir INSERT. `@supabase/supabase-js` ~40 KB getirir
 * ve karsiliginda bize auth, realtime, storage verir — hicbirini
 * kullanmiyoruz. `fetch` ile pakete eklenen bayt sayisi SIFIR.
 *
 * NEDEN FIREBASE DEGIL. Bir sure Firebase Analytics kuruluydu. Supabase
 * zaten acilmisti ve ayni soruyu ("kac kisi kullaniyor, geri geliyorlar
 * mi") cevapliyor; ustelik veri bizim kontrolumuzde kaliyor, KVKK
 * metninde anlatilacak tek isleyen oluyor ve pakete hic yuk binmiyor.
 * Firebase'in fazlasi (hazir panolar, huni, A/B) bu asamada gerekmiyor.
 *
 * UC KURAL:
 *
 * 1. YAPILANDIRMA YOKSA SESSIZCE KAPALI. Adres ve anahtar ortam
 *    degiskeninden geliyor; yoksa `olay()` hicbir sey yapmiyor. Boylece
 *    gelistirme verisi gercek olculere karismiyor.
 *
 * 2. KULLANICI KAPATABILIR. Ayarlar'daki anahtar `AppState.olcum`u
 *    cevirir; kapaliyken kuyruk da temizlenir.
 *
 * 3. KISISEL VERI GONDERILMEZ. Profil ADI, avatar fotografi, yazilan
 *    cevaplar, hangi kelimeyi bildigi — hicbiri. Gonderilen tek kimlik
 *    `Profil.id`: rastgele uretilmis, kullaniciyi disarida hicbir seye
 *    baglamayan bir numara (bkz. profil.ts).
 */

const ADRES = import.meta.env.VITE_SUPABASE_URL;
const ANAHTAR = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * `anon` anahtari GIZLI DEGILDIR — istemciye zaten gonderilir, guvenligi
 * saglayan sey Postgres'in satir duzeyi guvenligi (RLS). Tablo yalnizca
 * INSERT'e acik; kimse yazilani geri okuyamaz (bkz. NOTLAR'daki SQL).
 */
export const olcumVarMi = (): boolean => Boolean(ADRES && ANAHTAR);

/**
 * Olay adlari SABIT bir liste.
 *
 * Serbest metin olsaydi bir gun `ders_bitti`, baska gun `dersBitti`
 * yazilir ve tabloda iki ayri olay birikirdi — olcumde en sik yapilan
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

type Kayit = {
  kimlik: string;
  ad: Olay;
  veri: Veri | null;
  surum: string;
  platform: string;
  olustu: string;
};

/** Cevrimdisi kuyrugu bu sinirdan sonra ESKIDEN atar — depo sismesin. */
const KUYRUK_SINIR = 200;
const KUYRUK_ANAHTARI = 'hafizada-olcum-kuyrugu';

/** Toplu gonderim: her olayda bir istek atmak hem yavas hem israf. */
const GONDERIM_GECIKMESI_MS = 5_000;

let kimlik: string | null = null;
let acik = false;
let kuyruk: Kayit[] = [];
let zamanlayici: ReturnType<typeof setTimeout> | null = null;

const platform = (): string => {
  const kabuk = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return kabuk?.getPlatform?.() ?? 'web';
};

/** Depo erisimleri her zaman korumali: gizli sekmede erisim hata firlatabiliyor. */
function kuyrukOku(): Kayit[] {
  try {
    const ham = localStorage.getItem(KUYRUK_ANAHTARI);
    return ham ? (JSON.parse(ham) as Kayit[]) : [];
  } catch {
    return [];
  }
}

function kuyrukYaz(k: Kayit[]): void {
  try {
    if (k.length === 0) localStorage.removeItem(KUYRUK_ANAHTARI);
    else localStorage.setItem(KUYRUK_ANAHTARI, JSON.stringify(k.slice(-KUYRUK_SINIR)));
  } catch {
    /* depo yoksa kuyruk yalnizca bellekte yasar */
  }
}

/**
 * Kuyrugu tek istekte gonderir.
 *
 * Basarisiz olursa kayitlar kuyrukta KALIR: uygulama cevrimdisi
 * calisabiliyor, o yuzden "gonderemedim, attim" olcumun yarisini yok
 * ederdi. Sunucu 4xx donerse (sema uyumsuzlugu gibi kalici hata) kuyruk
 * temizlenir — yoksa sonsuza kadar ayni hatayi tekrarlardi.
 */
async function bosalt(): Promise<void> {
  if (!acik || !olcumVarMi() || kuyruk.length === 0) return;

  const gonderilecek = kuyruk;
  kuyruk = [];
  kuyrukYaz([]);

  try {
    const yanit = await fetch(`${ADRES}/rest/v1/olaylar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANAHTAR,
        Authorization: `Bearer ${ANAHTAR}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(gonderilecek),
      keepalive: true,
    });
    // 4xx kalici hata: tekrar denemenin anlami yok, kayitlar dusurulur.
    if (!yanit.ok && yanit.status < 400) throw new Error(String(yanit.status));
  } catch {
    // Ag hatasi — kayitlari geri koy, sonraki turda yeniden denensin.
    kuyruk = [...gonderilecek, ...kuyruk];
    kuyrukYaz(kuyruk);
  }
}

function zamanla(): void {
  if (zamanlayici) return;
  zamanlayici = setTimeout(() => {
    zamanlayici = null;
    void bosalt();
  }, GONDERIM_GECIKMESI_MS);
}

/**
 * Olcumu baslatir. Kapaliysa ya da yapilandirma yoksa hemen doner.
 * Onceki oturumdan kalan kuyruk varsa onu da gonderir.
 */
export function olcumHazirla(istendi: boolean, kullaniciId?: string): void {
  acik = istendi && olcumVarMi();
  kimlik = kullaniciId ?? null;
  if (!acik) return;

  kuyruk = kuyrukOku();

  if (typeof document !== 'undefined') {
    // Uygulama arka plana alinirken bekleyenleri gonder — `keepalive`
    // istegin sekme kapansa bile tamamlanmasini sagliyor.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void bosalt();
    });
  }
  void bosalt();
}

/** Kullanici anahtari kapattiysa bundan sonrasi gonderilmez, kuyruk silinir. */
export function olcumuKapat(): void {
  acik = false;
  kuyruk = [];
  kuyrukYaz([]);
}

/**
 * Tek cagri noktasi.
 *
 * Hicbir zaman `await` istemiyor ve hicbir zaman hata firlatmiyor:
 * olcum, olctugu akisi bozmamali.
 */
export function olay(ad: Olay, veri?: Veri): void {
  if (!acik || !kimlik) return;
  try {
    kuyruk.push({
      kimlik,
      ad,
      veri: veri ?? null,
      surum: __APP_VERSION__,
      platform: platform(),
      olustu: new Date().toISOString(),
    });
    kuyrukYaz(kuyruk);
    zamanla();
  } catch {
    /* yut */
  }
}
