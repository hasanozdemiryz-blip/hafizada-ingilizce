/**
 * DOSYAYI KULLANICIYA VERMENIN TEK KAPISI.
 *
 * Uygulamada uretilen iki dosya var ve ikisi de buradan cikiyor:
 * yedek (`Ayarlar > Yedekle`) ve kanca panosu (`SetFinale`). Once ikisi
 * ayri ayri `a.download` yaziyordu; ayni kusur iki yerde yasaniyordu.
 *
 * NEDEN UC YOL. `speech.ts` ile ayni sebep, ayni desen: Android System
 * WebView tarayici API'lerinin bir kismini UYGULAMIYOR. `navigator.share`
 * orada tanimsiz ve `a.download` da calismiyor — yani APK icinde "Yedekle"
 * dugmesi HICBIR SEY yapmayan bir dugme olurdu. Ayni kod Android Chrome'da
 * (PWA kurulumu) sorunsuz calisir. Sessiz kalite hatalarinin tam da
 * kacinilmak istenen turu.
 *
 *   native — Capacitor kabugu: dosya onbellege yazilir, sistem paylas
 *            menusune URI olarak verilir. Kullanici oradan Drive'i secer.
 *   web    — tarayicinin kendi `navigator.share`i (Android Chrome, iOS)
 *   indir  — klasik `a.download` (masaustu tarayici)
 *
 * NEDEN OAUTH YOK. Yedek kullanicinin KENDI Drive'ina gidiyor ve secimi
 * isletim sistemi yapiyor. Google'a tek bir yetkilendirme istegi gitmiyor:
 * dogrulama sureci yok, SHA-1 yok, release keystore bagimliligi yok ve
 * `public/gizlilik.html`in "veriler bize hic ulasmaz" cumlesi DOGRU kaliyor.
 * (Gercek Drive entegrasyonu — otomatik yedek — yayindan sonra; release
 * keystore'un SHA-1'ine bagli, ters sirada yapilirsa is iki kez yapilir.)
 */

/** Capacitor native kabukta koprusunu `window.Capacitor` olarak enjekte eder. */
const nativeKabuk = () =>
  typeof window !== 'undefined' &&
  (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    ?.isNativePlatform?.() === true;

export type Yol = 'native' | 'web' | 'indir';

/**
 * Hangi yolun kullanilacagi.
 *
 * Native ONCE soruluyor: APK icinde `navigator.share` zaten tanimsiz, ama
 * iOS'un WKWebView'inda DURUYOR — orada web yolu secilseydi paylasim
 * calisirdi da, dosya sistem menusune Capacitor'in FileProvider'i yerine
 * WebView uzerinden giderdi. Tek kabukta tek yol olsun.
 *
 * Disa aciliyor cunku arayuz metni buna gore degisiyor: paylas menusu
 * acilacaksa "Yedekle", dosya inecekse "Yedek al" demek dogru.
 */
export function yol(blob?: Blob, dosyaAdi?: string): Yol {
  if (nativeKabuk()) return 'native';
  if (blob && dosyaAdi) {
    const file = new File([blob], dosyaAdi, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) return 'web';
  }
  return 'indir';
}

/** Paylas menusu acilabiliyor mu — arayuz metni icin. Blob'suz, kaba tahmin. */
export const paylasilabilir = () =>
  nativeKabuk() || (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function');

/**
 * Blob -> base64 (veri onekI olmadan).
 * Capacitor'in Filesystem'i ikili veri kabul etmiyor, base64 istiyor.
 */
function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Dosya okunamadi'));
    r.onload = () => {
      const s = String(r.result);
      const i = s.indexOf(',');
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.readAsDataURL(blob);
  });
}

/**
 * Native kabukta: onbellege yaz, URI'sini paylas menusune ver.
 *
 * `Directory.Cache` bilerek — bu dosya bir CIKTI, saklanacak veri degil.
 * Kullanici Drive'a (ya da baska bir yere) kopyaladiktan sonra isletim
 * sistemi onbellegi kendi temizleyebilir. `Documents` secilseydi her
 * yedekleme cihazda kalici bir cop birakirdi.
 */
async function nativeVer(blob: Blob, dosyaAdi: string, baslik: string): Promise<void> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);

  await Filesystem.writeFile({
    path: dosyaAdi,
    data: await base64(blob),
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({ path: dosyaAdi, directory: Directory.Cache });

  // `files` bekleniyor: eklenti file:// yolunu FileProvider ile content:// ye cevirir.
  await Share.share({ title: baslik, files: [uri] });
}

/** Son care: klasik indirme. Masaustu tarayicida tek yol, digerlerinde yedek. */
function indir(blob: Blob, dosyaAdi: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Dosyayi kullaniciya ver. Cagiran taraf hangi yolun secildigini BILMEZ.
 *
 * Iptal sessizce yutuluyor: kullanici paylas menusunu kapattiysa bu bir
 * hata degil, bir karar. Ekrana hata basmak onu yanlis yaptigina
 * inandirirdi.
 *
 * HANGI YOLUN kullanildigini ve DOSYANIN GERCEKTEN VERILIP VERILMEDIGINI
 * donduruyor. Cagiran taraf davranisini buna gore degistirmiyor, ama olcume
 * yaziliyor:
 *
 *   `yol`     — "Android'de paylas menusu gercekten aciliyor mu" sorusunun
 *               cevabi. Cihazda denemek tek bir telefonu soyler, olcum
 *               hepsini.
 *   `verildi` — iptal eden kullanici YEDEK ALMAMISTIR. Ikisini ayirmazsak
 *               "yedek alan kisi" sayisi, menuyu acip vazgecenleri de
 *               sayar; bu urunun "beyan yerine olcum" kurali tam da bunu
 *               yasaklar.
 */
export async function dosyayiVer(
  blob: Blob,
  dosyaAdi: string,
  baslik: string,
): Promise<{ yol: Yol; verildi: boolean }> {
  const secim = yol(blob, dosyaAdi);

  if (secim === 'native') {
    try {
      await nativeVer(blob, dosyaAdi, baslik);
      return { yol: 'native', verildi: true };
    } catch (err) {
      if (iptal(err)) return { yol: 'native', verildi: false };
      // Eklenti yok ya da kopru cevap vermedi: asagiya, indirmeye dusuyoruz.
    }
  }

  if (secim === 'web') {
    try {
      await navigator.share({ files: [new File([blob], dosyaAdi, { type: blob.type })], title: baslik });
      return { yol: 'web', verildi: true };
    } catch (err) {
      if (iptal(err)) return { yol: 'web', verildi: false };
      // Paylasim reddedildi (izin, desteklenmeyen tur): indirmeye dusuyoruz.
    }
  }

  indir(blob, dosyaAdi);
  return { yol: 'indir', verildi: true };
}

/**
 * Kullanici vazgecti mi.
 *
 * Web tarafi `AbortError` atiyor. Capacitor'in Share eklentisi ise
 * PLATFORMA GORE farkli bir metin donduruyor ("Share canceled" / "Share
 * cancelled") — ikisi de yakalanmali, yoksa iptal eden kullanicinin
 * dosyasi ayrica bir de indirilir.
 */
function iptal(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  const mesaj = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return mesaj.includes('cancel');
}

/** Yedegin telefonda gidecegi klasor — Belgeler altinda, uygulamanin adiyla. */
export const TELEFON_KLASORU = 'Hafizada';

/**
 * Dosyayi dogrudan telefonun Belgeler klasorune yazar.
 *
 * NEDEN AYRI BIR YOL. Paylas menusu Android'in kendi listesi; icinde hangi
 * uygulamalarin gorunecegini SECEMIYORUZ (oyle bir API yok). Kullanici
 * "sadece Drive ve telefondaki klasor olsun" dedi — menuyu kisitlamak
 * mumkun olmadigi icin menuye alternatif kondu: tek dokunusla, menu hic
 * acilmadan, bilinen bir klasore.
 *
 * `Directory.Documents` bilerek: `Cache`in aksine kalici ve kullanici
 * telefonun dosya yoneticisinden gorebiliyor. Yedegin bulunabilir olmasi
 * onun tek isi.
 *
 * Yalnizca native kabukta calisir; tarayicide boyle bir klasor yok.
 */
export async function telefonaKaydet(blob: Blob, dosyaAdi: string): Promise<string> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const yol = `${TELEFON_KLASORU}/${dosyaAdi}`;
  await Filesystem.writeFile({
    path: yol,
    data: await base64(blob),
    directory: Directory.Documents,
    recursive: true,
  });
  return `Belgeler/${yol}`;
}

/**
 * Yedek dosyasinin adi.
 *
 * Profil adi da geciyor: birden fazla yedek yan yana durunca (esler,
 * cocuklar, eski cihaz) hangisinin kime ait oldugu dosya adindan
 * anlasilsin. Turkce harfler ve bosluk dosya adinda sorun cikarabiliyor —
 * ozellikle paylas menusu uzerinden baska bir uygulamaya giderken.
 */
export function yedekAdi(ad?: string, bugun = new Date()): string {
  const sade = (ad ?? '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const gun = bugun.toISOString().slice(0, 10);
  return sade ? `${sade}-yedek-${gun}.json` : `hafizada-yedek-${gun}.json`;
}
