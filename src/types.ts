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
  /**
   * Kullanici "bunu zaten biliyorum" dedi.
   *
   * `introduced` BILEREK false: o kelime uygulamada ogrenilmedi, kanca hic
   * gosterilmedi, hicbir olcum yapilmadi. Boylece puanlama, set bitisi,
   * gunluk sayac ve butun kuyruklar onu KENDILIGINDEN disarida birakiyor —
   * `introduced` suzen her yer zaten eliyor.
   *
   * Tek gorundugu yer Kelimeler ekranindaki "Bildiklerim" bolumu; oradan
   * sisteme geri alinabiliyor (kayit silinir, kelime yeni kelime havuzuna
   * doner).
   */
  bilinen?: boolean;

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

/**
 * Avatar: ya SETTEN bir ikon + renk, ya kullanicinin kendi fotografi.
 *
 * Fotograf 256px kareye kucultulmus bir data URL — cihazda duruyor,
 * hicbir yere gitmiyor. Ayri tutulmasinin sebebi ileriye donuk: bulut
 * senkronu gelirse ikon+renk zararsizca tasinir, FOTOGRAF kisisel veridir
 * ve ayri bir onay ister (bkz. NOTLAR).
 */
/**
 * Bir sure ucuncu bir secenek daha vardi: marka ikonu + renkli zemin.
 * Kaldirildi — hayvan portrelerinin yaninda sonuk duruyordu ve ayni isi
 * onlar daha iyi yapiyor. Eski bir kayitta kalmis olabilir diye
 * `profilDuzelt` onu hayvana ceviriyor (bkz. profil.ts).
 */
export type Avatar =
  /** Hazir hayvan resmi — fotograf yuklemek istemeyen icin */
  | { tip: 'hayvan'; ad: string }
  /** Kullanicinin fotografi: 256px kareye kucultulmus data URL */
  | { tip: 'foto'; veri: string };

/** Yerel profil — hesap degil. Bkz. profil.ts */
export type Profil = {
  /**
   * Kalici, rastgele, GORUNMEZ kimlik. Ad kimlik degildir; bu alan
   * olmadan ileride bulut senkronu "ayni kisi mi" sorusunu cevaplayamaz.
   * Uretildikten sonra asla degismez.
   */
  id: string;
  ad: string;
  avatar: Avatar;
  /** Cerceve ADI (bkz. cerceveler.ts). Kazanilmamis cerceve secilemez. */
  cerceve: string;
  /** ISO — cihazlar birlesirse hangisinin eski oldugu buradan bilinir */
  olusturuldu: string;
};

export type AppState = {
  /** Karsilama ekrani goruldu mu */
  onboarded: boolean;
  /**
   * Yerel profil. Ilk acilista kendiliginden uretilir (bkz. db.ts
   * `profilSagla`); eski kurulumlarda bir sure yok olabilir, o yuzden
   * opsiyonel.
   */
  profil?: Profil;
  /**
   * Telaffuz sesi. Cevap acilinca kendiliginden calar; otobuste/derste
   * aniden ses cikmasin diye kapatilabilir. Dugmeye basarak dinlemek
   * bu ayardan bagimsiz, her zaman calisir.
   */
  sound: boolean;
  /** Gunluk yeni kelime hedefi (5/10/15). LIMIT_MAX asilamaz. */
  dailyLimit: number;
  streakCount: number;
  /**
   * SIMDIYE KADARKI en uzun seri — geriye gitmez.
   *
   * Cerceve kilitleri buna bakiyor, `streakCount`'a degil: seri kirilinca
   * kazanilmis bir cerceveyi geri almak CEZA olurdu ve bu urunun kurali
   * "odul var, ceza yok". Bir kez 7 gune ulasan, bir daha kaybetmez.
   *
   * v6 oncesi kayitlarda yok; `getState` onu mevcut seriyle dolduruyor.
   */
  bestStreak?: number;
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
  /**
   * Gunluk hatirlatma saati (0-23) — `null` kapali.
   * Yalnizca native kabukta anlamli (bkz. reminder.ts).
   */
  reminderHour: number | null;
  /**
   * Hatirlatma dakikasi. `reminderHour` null ise anlamsiz.
   * Sonradan eklendi: eski kayitlarda yok, `EMPTY_STATE` 0 veriyor —
   * yani eski kullanicinin 19:00'i 19:00 kalir.
   */
  reminderMinute: number;
  /** YYYY-MM-DD, yerel saat */
  lastSessionDate: string | null;
  /**
   * Anonim kullanim olcumu acik mi (bkz. analitik.ts).
   *
   * Varsayilan ACIK ama Ayarlar'dan kapatilabiliyor. Ilk acilista onay
   * kutusu SORULMUYOR: bu uygulamanin en korunan yeri karsilama akisi —
   * "haa" anindan once bir izin diyalogu koymak, olcumun kazandiracagindan
   * fazlasini kapida kaybettirir. Ayarlar'da acikca yaziyor ve tek
   * dokunusla kapaniyor.
   *
   * Eski kayitlarda alan yok; yoklugu ACIK sayilir.
   */
  olcum?: boolean;
};
