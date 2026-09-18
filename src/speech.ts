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

export const telaffuzVar = () => sentez() !== null;

function enIyiSes(): SpeechSynthesisVoice | null {
  if (sesler.length === 0) seslerYenile();
  return pickVoice(sesler);
}

/**
 * Kelimeyi seslendirir. Onceki seslendirme iptal edilir — arka arkaya
 * basildiginda sesler ust uste binmesin.
 *
 * Ogrenme icin hafif yavas: 0.9. Tam hizda kisa kelimeler (`cut`, `bad`)
 * duyulmadan bitiyor.
 */
export function seslendir(kelime: string) {
  const s = sentez();
  if (!s) return;

  s.cancel();
  const u = new SpeechSynthesisUtterance(kelime);
  u.lang = AKSAN;
  u.rate = 0.9;
  const ses = enIyiSes();
  if (ses) u.voice = ses;
  s.speak(u);
}

export function seslendirmeyiDurdur() {
  sentez()?.cancel();
}
