import { useRef } from 'react';
import { Button, Card, Screen, Streak } from '../components/ui';
import { CARDS, CARD_BY_ID, DAILY_REVIEW_CAP, DECKS, TEST_PASS_SCORE } from '../content';
import { relativeDue } from '../dates';
import { exportProgress, importProgress, resetAll } from '../db';
import { deckStatus, isTestUnlocked } from '../scheduler';
import type { AppState, Card as CardType, Progress } from '../types';

type Props = {
  progress: Progress[];
  state: AppState;
  /** Vadesi gelmis TUM kartlar — ham sayi ekranda ASLA gosterilmez */
  due: Progress[];
  newCards: CardType[];
  onIntro: () => void;
  onReview: () => void;
  onTest: (deck: number) => void;
};

const TILE: Record<string, string> = {
  done: 'bg-grow text-white border-grow shadow-[0_2px_0_#25794f]',
  introduced: 'bg-brand text-white border-brand shadow-[0_2px_0_var(--color-brand-deep)]',
  active: 'bg-surface text-ink border-line shadow-[0_2px_0_var(--color-line)]',
  locked: 'bg-sunken text-ink-faint border-transparent',
};

export function Home({ progress, state, due, newCards, onIntro, onReview, onTest }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const byId = new Map(progress.map((p) => [p.cardId, p]));

  const learned = progress.filter((p) => p.introduced).length;

  /**
   * Birikme korumasi.
   * SRS'te insanlarin birakmasinin bir numarali sebebi "347 tekrar bekliyor"
   * yazisinin kaygi uretmesi. Gercek borc HIC gosterilmez; sadece bugunun
   * porsiyonu gosterilir.
   */
  const bugun = Math.min(due.length, DAILY_REVIEW_CAP);
  const birikmis = due.length > DAILY_REVIEW_CAP;

  const siradaki = progress
    .filter((p) => p.introduced)
    .map((p) => p.due)
    .sort((a, b) => a.getTime() - b.getTime())
    .find((d) => d.getTime() > Date.now());

  const testReady = DECKS.map((d) => d.n).find(
    (n) => isTestUnlocked(n, byId) && !state.deckTests[n]?.passedAt,
  );

  const introDeck = DECKS.find((d) => d.cards.some((c) => !byId.get(c.id)?.introduced))?.n;
  const bosGun = bugun === 0 && newCards.length === 0;

  /**
   * Son tanisilan kancalar. Ana ekranin bos alanini doldurur ve —
   * daha onemlisi — kancayi bedavadan bir kez daha gosterir.
   */
  const sonKancalar = progress
    .filter((p) => p.introduced && p.introducedAt)
    .sort((a, b) => (a.introducedAt! < b.introducedAt! ? 1 : -1))
    .slice(0, 8)
    .map((p) => CARD_BY_ID.get(p.cardId))
    .filter((c): c is CardType => Boolean(c));

  async function onExport() {
    const url = URL.createObjectURL(
      new Blob([await exportProgress()], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `hafizada-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        <span className="word text-lg font-semibold">Hafızada İngilizce</span>
        {state.streakCount > 0 && <Streak count={state.streakCount} />}
      </header>

      <div className="flex-1 flex flex-col gap-3 pb-4">
        {/* Bugunluk tamamsa: sakin bir durum, devre disi buton degil */}
        {bosGun ? (
          <Card className="rise text-center py-10">
            <div className="text-5xl mb-3">🌿</div>
            <p className="word text-2xl font-semibold">Bugünlük tamam</p>
            <p className="text-ink-soft mt-2 text-sm">
              {siradaki ? `Sıradaki tekrar ${relativeDue(siradaki)}.` : 'Yarın görüşürüz.'}
            </p>
          </Card>
        ) : (
          <>
            {bugun > 0 && (
              <Card className="rise">
                <p className="text-sm text-ink-soft">Bugünün tekrarı</p>
                <p className="word text-3xl font-semibold mt-0.5 mb-3">{bugun} kart</p>
                {birikmis && (
                  <p className="text-sm text-ink-faint -mt-2 mb-3">
                    Ara vermişsin — yavaştan başlayalım.
                  </p>
                )}
                <Button onClick={onReview}>Tekrarla</Button>
              </Card>
            )}

            {newCards.length > 0 && (
              <Card className="rise delay-1">
                <p className="text-sm text-ink-soft">Deste {introDeck}</p>
                <p className="word text-3xl font-semibold mt-0.5 mb-3">
                  {newCards.length} yeni kelime
                </p>
                <Button variant={bugun > 0 ? 'soft' : 'brand'} onClick={onIntro}>
                  Tanış
                </Button>
              </Card>
            )}
          </>
        )}

        {testReady !== undefined && (
          <button
            onClick={() => onTest(testReady)}
            className="rise delay-2 rounded-card bg-spark-soft border border-spark/40 p-5 text-left transition-all active:translate-y-[2px]"
          >
            <p className="font-semibold">Deste {testReady} testi hazır ✨</p>
            <p className="text-sm text-ink-soft mt-0.5">
              10 kelime, çıplak. {TEST_PASS_SCORE}/10 geçer.
            </p>
          </button>
        )}

        <section className="mt-2">
          <div className="flex items-baseline justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-ink-soft">Desteler</h2>
            <span className="text-sm text-ink-faint tabular-nums">
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
                  className={`aspect-square rounded-2xl border font-semibold tabular-nums transition-all ${TILE[status]} ${clickable ? 'active:translate-y-[2px] active:shadow-none' : ''}`}
                >
                  {status === 'locked' ? '' : status === 'done' ? '✓' : d.n}
                </button>
              );
            })}
          </div>
        </section>

        {sonKancalar.length > 0 && (
          <section className="mt-3">
            <h2 className="text-sm font-semibold text-ink-soft mb-2.5">Son tanıştıkların</h2>
            <div className="flex flex-wrap gap-1.5">
              {sonKancalar.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-surface border border-line px-3 py-1.5 text-sm"
                >
                  <span className="word font-semibold">{c.en}</span>
                  <span className="text-ink-faint"> ≈ </span>
                  <span className="text-brand font-medium">{c.hook}</span>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="shrink-0 flex items-center justify-center gap-3 text-xs text-ink-faint">
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
            e.target.value = '';
            if (f) void onImport(f);
          }}
        />
      </footer>
    </Screen>
  );
}

async function onImport(file: File) {
  try {
    await importProgress(await file.text());
  } catch {
    alert('Yedek dosyası okunamadı.');
  }
}
