import Dexie, { type Table } from 'dexie';
import { nextStreak, todayKey } from './dates';
import type { AppState, DeckTestResult, Progress } from './types';

type MetaRow = { key: string; value: unknown };

class AppDB extends Dexie {
  progress!: Table<Progress, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('hafizada-ingilizce');
    // IndexedDB boolean index'lemez — 'introduced' bilerek index disi.
    this.version(1).stores({
      progress: 'cardId, due, deck',
      meta: 'key',
    });
  }
}

export const db = new AppDB();

const APP_KEY = 'app';

export const EMPTY_STATE: AppState = {
  onboarded: false,
  extraNew: null,
  streakCount: 0,
  freezes: 0,
  days: {},
  lastSessionDate: null,
  deckTests: {},
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
 * Donen `freezeUsed`, koruma hakkinin harcandigini soyler — kullaniciya
 * bunu soylemek gerek, yoksa serinin nasil korundugu sihir gibi gorunur.
 */
export async function logSession(
  kind: 'intro' | 'review',
  count: number,
  now = new Date(),
): Promise<AppState & { freezeUsed: boolean }> {
  const state = await getState();
  const { freezeUsed, ...streak } = nextStreak(state, now);

  const key = todayKey(now);
  const gun = state.days[key] ?? { r: 0, i: 0 };
  const days = {
    ...state.days,
    [key]: kind === 'intro' ? { ...gun, i: gun.i + count } : { ...gun, r: gun.r + count },
  };

  const next = await setState({ ...streak, days });
  return { ...next, freezeUsed };
}

export async function recordDeckTest(deck: number, result: DeckTestResult): Promise<AppState> {
  const state = await getState();
  const prev = state.deckTests[deck];
  return setState({
    deckTests: {
      ...state.deckTests,
      // bir kez gecildiyse gecilmis kalir
      [deck]: { ...result, passedAt: prev?.passedAt ?? result.passedAt },
    },
  });
}

/** Tum ilerlemeyi disa aktar — local-first veri kaybina karsi. */
export async function exportProgress(): Promise<string> {
  const [progress, state] = await Promise.all([db.progress.toArray(), getState()]);
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state, progress }, null, 2);
}

export async function importProgress(json: string): Promise<void> {
  const parsed = JSON.parse(json) as { state?: AppState; progress?: Progress[] };
  if (!Array.isArray(parsed.progress)) throw new Error('Gecersiz yedek dosyasi');

  const progress = parsed.progress.map((p) => ({
    ...p,
    due: new Date(p.due),
    fsrs: {
      ...p.fsrs,
      due: new Date(p.fsrs.due),
      last_review: p.fsrs.last_review ? new Date(p.fsrs.last_review) : undefined,
    },
  }));

  await db.transaction('rw', db.progress, db.meta, async () => {
    await db.progress.clear();
    await db.progress.bulkPut(progress);
    if (parsed.state) await db.meta.put({ key: APP_KEY, value: parsed.state });
  });
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', db.progress, db.meta, async () => {
    await db.progress.clear();
    await db.meta.clear();
  });
}
