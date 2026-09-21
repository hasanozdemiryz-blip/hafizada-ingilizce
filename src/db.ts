import Dexie, { type Table } from 'dexie';
import { LIMIT_DEFAULT } from './content';
import { nextStreak, todayKey } from './dates';
import type { AppState, Cevap, Progress } from './types';

type MetaRow = { key: string; value: unknown };

class AppDB extends Dexie {
  progress!: Table<Progress, string>;
  meta!: Table<MetaRow, string>;
  answers!: Table<Cevap, number>;

  constructor() {
    super('hafizada-ingilizce');
    // IndexedDB boolean index'lemez — 'introduced' bilerek index disi.
    this.version(1).stores({
      progress: 'cardId, due, deck',
      meta: 'key',
    });

    /**
     * v2 — kalite sinyalleri degisti.
     *
     * Eski `firstRecallOk` ilk tekrarda, yani hala L3'te olculuyordu:
     * soru yuzunde gorsel, kanca VE cumle vardi, cumlelerin %80'inde de
     * Turkce karsilik geciyor. Yani neredeyse her zaman `true` doneceklerdi.
     * Olctugu sey "hatirladin mi" degil "okuyabildin mi"ydi; tasinmasinin
     * anlami yok, silinip yerine gercek sinyaller konuyor.
     *
     * Index semasi degismedi ama gecis kaydi burada durmali.
     */
    this.version(2)
      .stores({
        progress: 'cardId, due, deck',
        meta: 'key',
      })
      .upgrade((tx) =>
        tx
          .table('progress')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            delete p.firstRecallOk;
            p.hookRecallOk ??= null;
            p.bareRecallOk ??= null;
            p.bareFailCount ??= 0;
          }),
      );

    /**
     * v3 — alistirma merdiveni.
     * Mevcut kartlar `recall`'dan devam eder; hangi destek seviyesinde
     * kaldilarsa oradan. Ilerleme kaybi yok.
     */
    this.version(3)
      .stores({
        progress: 'cardId, due, deck',
        meta: 'key',
      })
      .upgrade((tx) =>
        tx
          .table('progress')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            p.stage ??= 'recall';
            p.firstProduceOk ??= null;
          }),
      );

    /**
     * v4 — iki eksen tek merdivene indi.
     *
     * Eski `support` (3..0) ve `stage` (recall/produce/listen) yerine tek
     * `step` (1..6). Esleme, kartin gordugu YARDIM miktarini korur:
     *   L3->1  L2->2  L1->3  L0->4  produce->5  listen->6
     * Boylece kimse merdivende geriye atilmaz.
     *
     * `deck` alani ve index'i de kalkiyor — deste kavrami bitti.
     */
    this.version(4)
      .stores({ progress: 'cardId, due', meta: 'key' })
      .upgrade((tx) =>
        tx
          .table('progress')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            const support = typeof p.support === 'number' ? p.support : 3;
            const stage = p.stage;
            p.step =
              stage === 'listen' ? 6 : stage === 'produce' ? 5 : ([1, 2, 3, 4][3 - support] ?? 1);

            p.firstCheckOk = p.introStuck === true ? false : null;
            p.unaidedOk = p.bareRecallOk ?? p.hookRecallOk ?? null;
            p.produceOk = p.firstProduceOk ?? null;
            p.failCount = p.bareFailCount ?? 0;
            p.hookRevealCount ??= 0;

            delete p.support;
            delete p.stage;
            delete p.deck;
            delete p.introStuck;
            delete p.hookRecallOk;
            delete p.bareRecallOk;
            delete p.bareFailCount;
            delete p.firstProduceOk;
          }),
      );

    /**
     * v5 — cevap gunlugu.
     *
     * Yeni tablo, veri tasima yok: basari gecmisi BILEREK sifirdan
     * basliyor. Eski `days.d/y` sayaclari kelime bazinda geri
     * uretilemiyor; onlari yeni yuzdeye karistirmak iki farkli seyi tek
     * rakamda toplamak olurdu. Kelime ilerlemesi (step/FSRS) etkilenmez.
     */
    this.version(5).stores({
      progress: 'cardId, due',
      meta: 'key',
      answers: '++id, ts, gun, cardId',
    });

    /**
     * v6 — cevaba BASAMAK ve IPUCU eklendi.
     *
     * Basari yalnizca `cardId` ile sayilinca ogrenme testinin alti sorusu
     * tek hucreye dusuyor, en zor olani (dinleme) en sonda sorulduğu icin
     * de butun kelimenin sonucunu o belirliyordu: 30 cevabin 21'i dogru
     * olan bir ders %0 gorunuyordu. `step` ile birim `kelime x basamak`
     * oluyor. `ipucu` ise "yardimsiz mi bildi" sorusunu tasiyor —
     * "neler yapabildin" paneli artik merdiven konumuna degil buna bakiyor.
     *
     * Index semasi degismiyor; eski satirlar `null`/`false` ile dolduruluyor.
     */
    this.version(6)
      .stores({ progress: 'cardId, due', meta: 'key', answers: '++id, ts, gun, cardId' })
      .upgrade((tx) =>
        tx
          .table('answers')
          .toCollection()
          .modify((c: Record<string, unknown>) => {
            c.step ??= null;
            c.ipucu ??= false;
          }),
      );
  }
}

/**
 * Disaridan gelen kaydi bugunku sekle getirir.
 * Yedek dosyasi v2 oncesinden olabilir — eksik alanlar `undefined` kalirsa
 * sayimlar ve `??` zincirleri sessizce yanlis calisir.
 */
function normalizeProgress(p: Progress): Progress {
  return {
    cardId: p.cardId,
    step: p.step ?? 1,
    introduced: p.introduced ?? false,
    introducedAt: p.introducedAt ?? null,
    firstCheckOk: p.firstCheckOk ?? null,
    unaidedOk: p.unaidedOk ?? null,
    produceOk: p.produceOk ?? null,
    hookRevealCount: p.hookRevealCount ?? 0,
    failCount: p.failCount ?? 0,
    due: new Date(p.due),
    fsrs: {
      ...p.fsrs,
      due: new Date(p.fsrs.due),
      last_review: p.fsrs.last_review ? new Date(p.fsrs.last_review) : undefined,
    },
  };
}

export const db = new AppDB();

const APP_KEY = 'app';

export const EMPTY_STATE: AppState = {
  onboarded: false,
  sound: true,
  dailyLimit: LIMIT_DEFAULT,
  streakCount: 0,
  freezes: 0,
  days: {},
  lastSessionDate: null,
};

export async function getState(): Promise<AppState> {
  const row = await db.meta.get(APP_KEY);
  return { ...EMPTY_STATE, ...((row?.value as Partial<AppState>) ?? {}) };
}

export async function setState(patch: Partial<AppState>): Promise<AppState> {
  const next = { ...(await getState()), ...patch };
  await db.meta.put({ key: APP_KEY, value: next });
  return next;
}

/**
 * Seans tamamlaninca cagrilir: gunluk etkinligi kaydeder ve seriyi isler.
 *
 * Artik tek tur seans var (ders), o yuzden tek sayi. `days` kaydi eski
 * {tekrar, yeni} ayrimini sekil olarak koruyor — isi haritasi ikisini
 * zaten topluyor ve eski kayitlar bozulmasin.
 */
export async function logSession(
  count: number,
  dogru = 0,
  yanlis = 0,
  now = new Date(),
): Promise<AppState & { freezeUsed: boolean }> {
  const state = await getState();
  const { freezeUsed, ...streak } = nextStreak(state, now);

  const key = todayKey(now);
  const gun = state.days[key] ?? { r: 0, i: 0 };
  const days = {
    ...state.days,
    [key]: {
      ...gun,
      r: gun.r + count,
      d: (gun.d ?? 0) + dogru,
      y: (gun.y ?? 0) + yanlis,
    },
  };

  const next = await setState({ ...streak, days });
  return { ...next, freezeUsed };
}

/**
 * Tek cevap kaydi.
 *
 * Seans sonunda toplu yazilmiyor bilerek: ders yarida birakildiginda da
 * verilen cevaplar verilmis sayilir. Yeni KELIMELER yarida kaydedilmiyor
 * (bkz. Lesson) ama bu ayri bir soru — cevap gercekten olup bitti.
 */
export function logAnswer(
  cevap: Pick<Cevap, 'cardId' | 'ok' | 'step' | 'ipucu' | 'kaynak'>,
  now = new Date(),
): Promise<number> {
  return db.answers.add({ ...cevap, ts: now.getTime(), gun: todayKey(now) });
}

export const getAnswers = (): Promise<Cevap[]> => db.answers.toArray();

/** Tum ilerlemeyi disa aktar — local-first veri kaybina karsi. */
export async function exportProgress(): Promise<string> {
  const [progress, state, answers] = await Promise.all([
    db.progress.toArray(),
    getState(),
    getAnswers(),
  ]);
  return JSON.stringify(
    // Semadaki sürümle AYNI kalmali: yedek hangi sekille yazildigini soyler
    { version: 6, exportedAt: new Date().toISOString(), state, progress, answers },
    null,
    2,
  );
}

export async function importProgress(json: string): Promise<void> {
  const parsed = JSON.parse(json) as {
    state?: AppState;
    progress?: Progress[];
    answers?: Cevap[];
  };
  if (!Array.isArray(parsed.progress)) throw new Error('Gecersiz yedek dosyasi');

  const progress = parsed.progress.map(normalizeProgress);
  // v5 oncesi yedekte cevap gunlugu yok; basari gecmisi bos gelir, gerisi durur.
  const answers = Array.isArray(parsed.answers) ? parsed.answers : [];

  await db.transaction('rw', db.progress, db.meta, db.answers, async () => {
    await db.progress.clear();
    await db.answers.clear();
    await db.progress.bulkPut(progress);
    if (answers.length > 0) await db.answers.bulkAdd(answers);
    if (parsed.state) await db.meta.put({ key: APP_KEY, value: parsed.state });
  });
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', db.progress, db.meta, db.answers, async () => {
    await db.progress.clear();
    await db.meta.clear();
    await db.answers.clear();
  });
}
