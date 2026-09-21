import type { Card as FSRSCard } from 'ts-fsrs';

export type Klass = 'tutan' | 'kurtarilabilir';

/** Icerik. content/cards.json'dan gelir, degismez kaynak. */
export type Card = {
  id: string;
  order: number;
  en: string;
  tr: string;
  hook: string;
  sentence: string;
  imageNote: string;
  klass: Klass;
  decision: string | null;
  image: string | null;
};

/**
 * Egzersiz merdiveni — kelimenin tek ilerleme ekseni.
 *
 * Her basamak hem SORUNUN TIPINI hem EKRANDAKI YARDIMI belirler. Once iki
 * ayri eksen vardi (destek seviyesi + asama); tek merdiven hem kullanici
 * icin anlasilir hem kodda tek kavram.
 *
 *   1 Eslestirme      5 kelime <-> 5 karsilik      gorsel + kanca ekranda
 *   2 Coktan secmeli  `sell` -> 4 sik              gorsel + kanca ekranda
 *   3 Ters secmeli    `satmak` -> 4 sik            kanca yalnizca IPUCU
 *   4 Harf dizme      `satmak` -> l·e·s·l          kanca yalnizca IPUCU
 *   5 Yazma           `satmak` -> yaz              kanca yalnizca IPUCU
 *   6 Dinleme         🔊 -> yaz                    kanca yalnizca IPUCU
 *
 * 1-2 tanima, 3-4 gecis, 5-6 uretim. Kullanilabilir kelime hazinesi
 * uretim tarafinda olusur, o yuzden merdiven tanimada bitmez.
 */
export type Step = 1 | 2 | 3 | 4 | 5 | 6;

/** Kullanici ilerlemesi. IndexedDB'de, cihazda. */
export type Progress = {
  cardId: string;
  fsrs: FSRSCard;
  /** Merdivendeki basamak. Yardimsiz dogru cikarir, yanlis indirir. */
  step: Step;
  introduced: boolean;
  /** ISO tarih — gunluk sayim ve olcum icin */
  introducedAt: string | null;

  // --- Icerik kalite sinyalleri (bkz. quality.ts) ---
  /**
   * Ogrenme testinde (adim 1-2) ilk deneme tuttu mu.
   * Once kullaniciya "Kanca tuttu mu?" diye SORULUYORDU; bu bir beyandi.
   * Artik sorulmuyor, olculuyor.
   */
  firstCheckOk: boolean | null;
  /**
   * Kanca ekrandan kalktiktan SONRA (adim >= 3) ilk kez yardimsiz bilindi mi.
   * Kancanin gercek sinavi: anlami kendi basina geri getiriyor mu.
   */
  unaidedOk: boolean | null;
  /** Ilk yazma denemesi (adim 5) tuttu mu — tanima degil uretim sinyali */
  produceOk: boolean | null;
  /** Kanca ipucuna kac kez basildi (adim >= 3) */
  hookRevealCount: number;
  /** Adim >= 3'te kac kez dusuldu */
  failCount: number;

  /** fsrs.due aynasi — Dexie index'i icin */
  due: Date;
};

/**
 * Tek bir cevap.
 *
 * Basari yuzdesi once gun bazinda TOPLU sayaclardan hesaplaniyordu
 * (`AppState.days.d/y`). O sekille "kelimeyi yeniden calisinca onceki
 * yanlisi duzelsin" istegi karsilanamaz: hangi cevabin hangi kelimeye
 * ait oldugu bilgisi atilmis oluyor, geri getirilemiyor. Ham cevap
 * durdugu surece yuzdenin tanimi sonradan da degistirilebilir.
 */
export type Cevap = {
  id?: number;
  cardId: string;
  /** epoch ms — pencere hesabi buradan */
  ts: number;
  /** YYYY-MM-DD, yerel. Gun bazli sorgu ts aritmetigi istemesin. */
  gun: string;
  ok: boolean;
  /**
   * Hangi basamakta soruldu.
   *
   * Basarinin birimi bu yuzden var: yalnizca `cardId` ile sayilinca
   * ogrenme testinin ALTI sorusu tek hucreye dusuyor ve en sonuncusu
   * (dinleme) butun kelimenin sonucunu belirliyordu — 21/30 dogru yapan
   * bir ders %0 gorunuyordu. Karsilastirma ayni basamakla yapilmali.
   *
   * v6 oncesi kayitlarda `null`.
   */
  step: Step | null;
  /** Kanca ipucuna basilarak mi bulundu — "yardimsiz mi" sorusu */
  ipucu: boolean;
  /** Dersin mi egzersizin mi cevabi — ikisi de sayilir, ayrimi durur */
  kaynak: 'ders' | 'egzersiz';
};

export type AppState = {
  /** Karsilama ekrani goruldu mu */
  onboarded: boolean;
  /**
   * Telaffuz sesi. Cevap acilinca kendiliginden calar; otobuste/derste
   * aniden ses cikmasin diye kapatilabilir. Dugmeye basarak dinlemek
   * bu ayardan bagimsiz, her zaman calisir.
   */
  sound: boolean;
  /** Gunluk yeni kelime hedefi (5/10/15). LIMIT_MAX asilamaz. */
  dailyLimit: number;
  streakCount: number;
  /** Seri koruma hakki. 7 gunde bir kazanilir, en fazla 2 tutulur. */
  freezes: number;
  /**
   * Gunluk etkinlik: tarih -> { r: calisilan kart, i: yeni kelime,
   * d: dogru cevap, y: yanlis cevap }
   *
   * `d`/`y` basari yuzdesi icin. Once yalnizca KAC kart calisildigi
   * tutuluyordu; "ne kadari dogruydu" sorusunun cevabi hicbir yerde yoktu.
   */
  days: Record<string, { r: number; i: number; d?: number; y?: number }>;
  /** YYYY-MM-DD, yerel saat */
  lastSessionDate: string | null;
};
