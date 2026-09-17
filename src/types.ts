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
 * Destek seviyesi — asamali iskele.
 * 3: gorsel + kelime + kanca + cumle   (Tanis sonrasi)
 * 2: gorsel + kelime + kanca           (cumle dustu)
 * 1: kelime + kanca                    (gorsel dustu)
 * 0: sadece kelime                     (ciplak)
 */
export type SupportLevel = 0 | 1 | 2 | 3;

/** Kullanici ilerlemesi. IndexedDB'de, cihazda. */
export type Progress = {
  cardId: string;
  deck: number;
  fsrs: FSRSCard;
  support: SupportLevel;
  introduced: boolean;
  /** ISO tarih — gunluk yeni kart limiti ve olcum icin */
  introducedAt: string | null;
  /** Tanis'ta "Tutmadi" dendi -> kanca zayifligi sinyali */
  introStuck: boolean;
  /** "Kancayi goster"e kac kez basildi -> kanca zayifligi sinyali */
  hookRevealCount: number;
  /** Ilk gercek tekrarda hatirlandi mi -> "haa" oldu mu sinyali */
  firstRecallOk: boolean | null;
  /** fsrs.due aynasi — Dexie index'i icin */
  due: Date;
};

export type DeckTestResult = {
  score: number;
  total: number;
  passedAt: string | null;
  lastAttemptAt: string;
};

export type AppState = {
  /** Karsilama ekrani goruldu mu */
  onboarded: boolean;
  streakCount: number;
  /** YYYY-MM-DD, yerel saat */
  lastSessionDate: string | null;
  deckTests: Record<number, DeckTestResult>;
};
