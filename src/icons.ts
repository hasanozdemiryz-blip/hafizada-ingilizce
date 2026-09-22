/**
 * Arayuz ikonlari — tek kayit.
 *
 * Once her ekran kendi emojisini yaziyordu ('🌱', '🎯', '📊', '⚙️'…).
 * Emoji marka degil: cihazin yazi karakteri ciziyor, yani ayni ekran
 * Android'de, iOS'ta ve masaustunde uc ayri stilde goruluyordu — ve
 * hicbiri logonun iki rengini tasimiyordu. Artik hepsi tek bir cizim
 * setinden geliyor (bkz. tools/make-ui-icons.mjs).
 *
 * Bu dosya SAF: React yok, sadece ad -> URL. Boylece `exercise.ts` gibi
 * arayuzden bagimsiz modullerde de ikon ADI tasinabiliyor; o adin hangi
 * resme dustugunu yalnizca burasi bilir. Cizen bilesen `Ikon`, bkz.
 * components/ui.tsx.
 */

/**
 * `src/assets/ikonlar/` glob'lanir — `content.ts`'in kart gorsellerinde
 * yaptiginin aynisi. Elle liste yok: uretilen dosya kendiliginden gelir.
 */
const DOSYALAR = import.meta.glob('./assets/ikonlar/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const URLLER = new Map(
  Object.entries(DOSYALAR).map(([yol, url]) => [yol.split('/').pop()!.replace('.png', ''), url]),
);

/**
 * Setteki ikonlar.
 *
 * Adlar NE GOSTERDIGI degil NEREDE KULLANILDIGI ile anilir: `ses` bir
 * hoparlor cizimi ama uygulamada telaffuzun adi. Yeni bir yere ikon
 * lazim olursa once buradan uygun olani ara — ayni kavrami iki ayri
 * ikonla anlatmak setin isini bozar.
 *
 * Bunun tersi de gecerli: `kartlar` IKI yerde duruyor (Egzersiz'deki
 * "Kartlar" kutusu ve Ilerleme'deki "Kelimeler" listesi). Zorlama degil,
 * ikisi de ayni seyi gosteriyor — ogrendigin kartlar.
 *
 * Bir sure listede ayri bir "kelime karolari" cizimi vardi. Sonradan
 * anlasildi ki o cizim `harf` ikonunun SAG YARISIYDI: kaynak sayfadan
 * kirpilirken bes karo genisligindeki ikon ortadan ikiye bolunmus, iki
 * yarisi iki ayri ikon sanilmisti (bkz. tools/make-ui-icons.mjs).
 *
 * `seri`, `koruma` ve `kutlama` bir sure emoji olarak kaldi cunku ilk
 * sayfada yoklardi; ikinci sayfayla geldiler ve son emojiler de kalkti.
 */
export const IKONLAR = [
  'ara', // buyutec         — kelime arama kutulari
  'ayarlar', // disli       — Ayarlar sekmesi
  'bekleyen', // calar saat — vadesi gelmis tekrarlar
  'bugun', // gunes         — bugunun / son dersin kelimeleri
  'ders', // mezuniyet kepi — dersi bastan tekrar et
  'egzersiz', // hedef tahtasi — Egzersiz sekmesi
  'eski', // kum saati      — uzun sure once ogrenilenler
  'eslestirme', // zincir   — 1. basamak
  'harf', // harf karolari  — 4. basamak
  'ilerleme', // cubuk grafik — Ilerleme sekmesi
  'karisik', // zar         — her kelime kendi basamaginda
  'koruma', // kar tanesi     — seri koruma hakki
  'kartlar', // kart destesi — kartlari gozden gecir VE kelime listesi
  'ogren', // filiz         — Ogren sekmesi, bos ekranlar
  'onceki', // hilal        — bir onceki ders
  'kutlama', // konfeti     — set finali
  'sec', // dokunan el      — elle kelime secimi
  'secmeli', // kutu + tik  — 2. basamak
  'seri', // alev            — gunluk seri
  'ses', // hoparlor        — telaffuz ve 6. basamak (dinleme)
  'ters', // donen oklar    — 3. basamak (ters secmeli)
  'yazma', // kalem         — 5. basamak
  'zor', // yara bandi      — zorlanilan kelimeler
] as const;

export type IkonAd = (typeof IKONLAR)[number];

/**
 * Ikonun adresi.
 *
 * `ters` KOYU ZEMIN demek, "secili" demek degil: secili bir kutu beyaz
 * kalirsa duz varyant dogru olani. Ters varyantta lacivert murekkep
 * logonun kremine doner, kanca sarisi yerinde kalir.
 */
export function ikonUrl(ad: IkonAd, ters = false): string {
  const url = URLLER.get(ters ? `${ad}-ters` : ad);
  if (!url) throw new Error(`Ikon yok: ${ad}${ters ? ' (ters)' : ''} — 'npm run icons:ui' calistirildi mi?`);
  return url;
}
