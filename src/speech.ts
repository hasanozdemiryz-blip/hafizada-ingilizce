/**
 * Telaffuz.
 *
 * Ses kancasi yontemin motoru ama ayni zamanda borcu: `sell ≈ sel` kancasi
 * kelimeyi hatirlatirken YANLIS telaffuzu da ogretiyor (gercekte /sɛl/).
 * Bu yuzden dogru ses, kanca ekrandan kalkarken devreye girer — L1 ve L0'da.
 * Daha erken verilirse kancayla kavga eder, daha gec verilirse yanlis
 * telaffuz cimentolasir. Devir teslim noktasi tam orasi (bkz. CardFace).
 *
 * Tarayicinin kendi ses sentezini kullaniyoruz: ses dosyasi uretmek,
 * barindirmak ve indirmek yok — "backend yok" sozu bozulmuyor. Sentez sesi
 * kayit kalitesinde degil; yeterli olmazsa ayni arayuz onceden uretilmis
 * dosyalara baglanabilir, cagri noktalari degismez.
 */

import { useSyncExternalStore } from 'react';

const AKSAN = 'en-US';

/**
 * Kaliteli ve anlasilir Amerikan sesleri, sirayla aranir.
 * macOS · Chrome · Windows · Android karsiliklari bir arada.
 */
const TERCIH = [
  'Samantha', 'Alex', 'Ava', 'Allison', 'Susan', 'Joelle', 'Tom', 'Evan',
  'Google US English',
  'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Zira', 'Microsoft David',
  'English United States',
];

/**
 * macOS'ta `en-US` listesinin yarisi SAKA sesi: Bahh koyun gibi meliyor,
 * Boing zipliyor, Cellos sarki soyluyor, Zarvox robot. Tercih listesindeki
 * sesler bulunamazsa alfabetik ilk yerel ses secilir ve o da "Albert"
 * oluyor — bogazdan konusan bir karikatur. Telaffuz ogreten bir uygulamada
 * bu sessiz ama agir bir kalite hatasi.
 *
 * Isimler yerellesebiliyor ("Good News" -> "İyi Haber"), o yuzden bilinen
 * cevirileri de listede. Bu yalnizca YEDEGIN yedegi; kacan olursa
 * uygulama calismaya devam eder, sadece ses kotu olur.
 */
const SAKA = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged',
  'good news', 'hysterical', 'jester', 'junior', 'organ', 'pipe organ', 'princess',
  'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox',
  'i̇yi haber', 'iyi haber', 'kötü haber', 'kotu haber',
];

const sakaMi = (ad: string) => {
  const a = ad.toLocaleLowerCase('tr');
  return SAKA.some((s) => a.includes(s));
};

/** Test edilebilirlik icin `SpeechSynthesisVoice`in ihtiyac duyulan kismi. */
export type SesAdayi = { name: string; lang: string; localService?: boolean };

/**
 * Konusacak sesi secer. Saf: tarayici API'sine dokunmaz, test edilebilir.
 *
 * Sira: tercih listesi -> saka olmayan yerel ses -> saka olmayan herhangi
 * bir ses -> (hepsi sakaysa) ilk ses. Son basamak bilincli: sesin hic
 * cikmamasi, kotu cikmasindan daha kotu.
 */
export function pickVoice<T extends SesAdayi>(sesler: readonly T[]): T | null {
  const amerikan = sesler.filter((v) => v.lang.replace('_', '-') === AKSAN);
  const havuz = amerikan.length > 0 ? amerikan : sesler.filter((v) => v.lang.startsWith('en'));
  if (havuz.length === 0) return null;

  for (const ad of TERCIH) {
    const bulunan = havuz.find((v) => v.name.includes(ad));
    if (bulunan) return bulunan;
  }

  const temiz = havuz.filter((v) => !sakaMi(v.name));
  return temiz.find((v) => v.localService) ?? temiz[0] ?? havuz[0];
}

/**
 * Hangi motor konusuyor.
 *
 *   web    — tarayicinin kendi `speechSynthesis`i
 *   native — cihazin TTS motoru, Capacitor eklentisi uzerinden
 *   yok    — telaffuz arayuzu hic gosterilmez
 *
 * Android System WebView, Web Speech API'nin SENTEZ tarafini uygulamiyor:
 * `speechSynthesis` orada tanimsiz. Ayni kod Android Chrome'da (PWA kurulumu)
 * konusuyor, APK icinde susuyordu — ve sustugu icin hoparlor dugmesi, Ayarlar
 * satiri ve dinleme egzersizi kendilerini gizliyordu. Hicbiri hata degildi,
 * hepsi "ses yok" halinin dogru davranisiydi; eksik olan motorun kendisi.
 *
 * iOS'un WKWebView'inda API duruyor, orada native kabukta da web yolu calisir.
 */
type Motor = 'web' | 'native' | 'yok';

type NativeTTS = (typeof import('@capacitor-community/text-to-speech'))['TextToSpeech'];

const sentez = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

let sesler: SpeechSynthesisVoice[] = [];

function seslerYenile() {
  sesler = sentez()?.getVoices() ?? [];
}

// Listeyi tarayici asenkron dolduruyor; ilk cagride bos donebilir.
if (sentez()) {
  seslerYenile();
  sentez()!.addEventListener?.('voiceschanged', seslerYenile);
}

let motor: Motor = sentez() ? 'web' : 'yok';
let native: NativeTTS | null = null;

const dinleyiciler = new Set<() => void>();
const abone = (f: () => void) => {
  dinleyiciler.add(f);
  return () => {
    dinleyiciler.delete(f);
  };
};

/** Capacitor native kabukta koprusunu `window.Capacitor` olarak enjekte eder. */
const nativeKabuk = () =>
  typeof window !== 'undefined' &&
  (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    ?.isNativePlatform?.() === true;

/** Motorda Ingilizce var mi. Iki yoldan sorulur; ikisi de patlarsa yok sayilir. */
async function ingilizceVar(tts: NativeTTS): Promise<boolean> {
  try {
    const { voices } = await tts.getSupportedVoices();
    if (voices.some((v) => v.lang?.replace('_', '-').startsWith('en'))) return true;
  } catch {
    // Bazi motorlar ses listesi vermiyor; asagidaki soru hala gecerli.
  }
  try {
    return (await tts.isLanguageSupported({ lang: AKSAN })).supported;
  } catch {
    return false;
  }
}

/**
 * Native motoru arar. Acilista BIR KEZ cagrilir (main.tsx).
 *
 * Asenkron, cunku cevap kopruden geliyor. Bu yuzden telaffuz acilista "yok"
 * sayilir ve motor bulununca abonelere haber verilir (`useTelaffuz`).
 * Iyimser davranip dugmeyi hemen gostermek, Ingilizce ses verisi kurulu
 * olmayan cihazda hicbir sey yapmayan bir dugme birakirdi — sessiz kalite
 * hatalarinin tam da kacinilmak istenen turu.
 */
export async function telaffuzHazirla(): Promise<void> {
  if (motor !== 'yok' || !nativeKabuk()) return;
  try {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    if (!(await ingilizceVar(TextToSpeech))) return;
    native = TextToSpeech;
    motor = 'native';
    dinleyiciler.forEach((f) => f());
  } catch {
    // Eklenti yok ya da kopru cevap vermedi: telaffuz kapali kalir.
  }
}

export const telaffuzVar = () => motor !== 'yok';

/**
 * Bilesenler bunu kullanir, `telaffuzVar`i degil.
 *
 * Native motor acilistan SONRA bulunabildigi icin duz cagri yetmiyor:
 * bulundugunda yeniden cizim gerekiyor.
 */
export const useTelaffuz = () => useSyncExternalStore(abone, telaffuzVar, () => false);

function enIyiSes(): SpeechSynthesisVoice | null {
  if (sesler.length === 0) seslerYenile();
  return pickVoice(sesler);
}

/** Ogrenme icin hafif yavas. Tam hizda kisa kelimeler (`cut`, `bad`) duyulmadan bitiyor. */
const HIZ = 0.9;

/**
 * Kelimeyi seslendirir. Onceki seslendirme kesilir — arka arkaya
 * basildiginda sesler ust uste binmesin.
 *
 * Native tarafta ses SECILMIYOR, yalnizca dil veriliyor: `pickVoice`in
 * cozdugu sorun (macOS'un saka sesleri) Android'de yok, oradaki varsayilan
 * motor sesi zaten dogru tercih. Test edilemeyen bir ses indeksi gondermek
 * iyilestirmez, bozabilir.
 */
export function seslendir(kelime: string) {
  if (motor === 'web') {
    const s = sentez();
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(kelime);
    u.lang = AKSAN;
    u.rate = HIZ;
    const ses = enIyiSes();
    if (ses) u.voice = ses;
    s.speak(u);
    return;
  }
  if (motor === 'native' && native) {
    // queueStrategy varsayilani Flush: yeni istek oncekini keser.
    void native.speak({ text: kelime, lang: AKSAN, rate: HIZ }).catch(() => {});
  }
}

export function seslendirmeyiDurdur() {
  if (motor === 'web') sentez()?.cancel();
  else if (motor === 'native') void native?.stop().catch(() => {});
}
