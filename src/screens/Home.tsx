import { useRef } from 'react';
import { Button, Screen } from '../components/ui';
import { CARDS, DECKS, TEST_PASS_SCORE } from '../content';
import { exportProgress, importProgress, resetAll } from '../db';
import { deckStatus, isTestUnlocked } from '../scheduler';
import type { AppState, Card, Progress } from '../types';

type Props = {
  progress: Progress[];
  state: AppState;
  dueCount: number;
  newCards: Card[];
  onIntro: () => void;
  onReview: () => void;
  onTest: (deck: number) => void;
};

const TILE: Record<string, string> = {
  done: 'bg-good-soft text-good border-good',
  introduced: 'bg-accent-soft text-accent border-accent',
  active: 'bg-paper-2 text-ink border-line',
  locked: 'bg-paper text-ink-faint border-line border-dashed',
};

export function Home({ progress, state, dueCount, newCards, onIntro, onReview, onTest }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const byId = new Map(progress.map((p) => [p.cardId, p]));

  const learned = progress.filter((p) => p.introduced).length;

  const testReady = DECKS.map((d) => d.n).find(
    (n) => isTestUnlocked(n, byId) && !state.deckTests[n]?.passedAt,
  );

  const introDeck = DECKS.find((d) =>
    d.cards.some((c) => !byId.get(c.id)?.introduced),
  )?.n;

  async function onExport() {
    const json = await exportProgress();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `hafizada-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file: File) {
    try {
      await importProgress(await file.text());
    } catch {
      alert('Yedek dosyası okunamadı.');
    }
  }

  return (
    <Screen>
      <header className="flex items-center justify-between h-12 shrink-0">
        <span className="font-semibold tracking-tight">Hafızada İngilizce</span>
        {state.streakCount > 0 && (
          <span className="text-sm text-ink-soft">🔥 {state.streakCount} gün</span>
        )}
      </header>

      <div className="flex-1 flex flex-col gap-4 py-4">
        {/* Tekrarla */}
        <section className="rounded-3xl border border-line bg-paper-2 p-5">
          <p className="text-sm text-ink-soft">
            {dueCount > 0 ? `${dueCount} tekrar bekliyor` : 'Bugünlük tekrar bitti'}
          </p>
          <div className="mt-3">
            <Button onClick={onReview} disabled={dueCount === 0}>
              Tekrarla
            </Button>
          </div>
        </section>

        {/* Tanis */}
        <section className="rounded-3xl border border-line p-5">
          <p className="text-sm text-ink-soft">
            {newCards.length > 0
              ? `Deste ${introDeck} — ${newCards.length} yeni kelime`
              : introDeck
                ? 'Bugünün yeni kelimeleri bitti'
                : 'Tüm kelimelerle tanıştın'}
          </p>
          <div className="mt-3">
            <Button variant="secondary" onClick={onIntro} disabled={newCards.length === 0}>
              Tanış
            </Button>
          </div>
        </section>

        {/* Deste testi */}
        {testReady !== undefined && (
          <button
            onClick={() => onTest(testReady)}
            className="rise rounded-3xl border border-ink bg-ink text-paper p-5 text-left active:scale-[0.99] transition"
          >
            <p className="font-medium">Deste {testReady} testi hazır</p>
            <p className="text-sm opacity-70 mt-0.5">
              10 kelime, çıplak. {TEST_PASS_SCORE}/10 geçer.
            </p>
          </button>
        )}

        {/* Desteler */}
        <section className="mt-1">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm text-ink-soft">Desteler</h2>
            <span className="text-sm text-ink-faint">
              {learned} / {CARDS.length} kelime
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {DECKS.map((d) => {
              const test = state.deckTests[d.n];
              const status = deckStatus(d.n, byId, Boolean(test?.passedAt));
              const clickable = status !== 'locked' && isTestUnlocked(d.n, byId);
              return (
                <button
                  key={d.n}
                  disabled={!clickable}
                  onClick={() => onTest(d.n)}
                  className={`aspect-square rounded-2xl border flex flex-col items-center justify-center text-sm font-medium transition ${TILE[status]} ${clickable ? 'active:scale-95' : ''}`}
                >
                  {status === 'locked' ? '·' : d.n}
                  {status === 'done' && <span className="text-[10px] leading-none mt-0.5">✓</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="shrink-0 flex items-center justify-center gap-4 text-xs text-ink-faint">
        <button onClick={() => void onExport()} className="hover:text-ink-soft">
          Yedek al
        </button>
        <span>·</span>
        <button onClick={() => fileRef.current?.click()} className="hover:text-ink-soft">
          Geri yükle
        </button>
        <span>·</span>
        <button
          onClick={() => {
            if (confirm('Tüm ilerleme silinecek. Emin misin?')) void resetAll();
          }}
          className="hover:text-ink-soft"
        >
          Sıfırla
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
      </footer>
    </Screen>
  );
}
