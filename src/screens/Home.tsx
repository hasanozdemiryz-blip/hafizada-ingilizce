import { Button, Card, Logo, Screen, Streak } from '../components/ui';
import { TAB_SPACE } from '../components/TabBar';
import {
  CARDS,
  CARD_BY_ID,
  DAILY_REVIEW_CAP,
  DECKS,
  NEW_PER_DAY,
  TEST_PASS_SCORE,
} from '../content';
import { relativeDue } from '../dates';
import { deckStatus, isTestUnlocked } from '../scheduler';
import type { AppState, Card as CardType, Progress } from '../types';

type Props = {
  progress: Progress[];
  state: AppState;
  /** Vadesi gelmis TUM kartlar — ham sayi ekranda ASLA gosterilmez */
  due: Progress[];
  newCards: CardType[];
  /** Havuzda hala tanisilmamis kart var mi */
  moreLeft: boolean;
  onIntro: () => void;
  onReview: () => void;
  onMoreNew: () => void;
  onTest: (deck: number) => void;
};

/**
 * Deste kareleri. Kilitli olanlar da GORUNUR olmali —
 * onceki surumde bej ustune bej kaliyor ve ekrandan siliniyorlardi.
 */
const TILE: Record<string, string> = {
  done: 'bg-grow text-white shadow-[0_8px_18px_-8px_rgba(43,196,138,0.8)]',
  introduced: 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(79,146,246,0.85)]',
  active: 'bg-white text-ink ring-2 ring-brand shadow-[var(--shadow-soft)]',
  locked: 'bg-white/55 text-ink-faint',
};

export function Home({
  progress,
  state,
  due,
  newCards,
  moreLeft,
  onIntro,
  onReview,
  onMoreNew,
  onTest,
}: Props) {
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


  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        <Logo className="h-7" />
        {state.streakCount > 0 && <Streak count={state.streakCount} />}
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        {/* Bugunluk tamamsa: sakin bir durum, devre disi buton degil */}
        {bosGun ? (
          <Card className="rise text-center py-10">
            <div className="text-5xl mb-3">🌿</div>
            <p className="word text-2xl font-semibold">Bugünlük tamam</p>
            <p className="text-ink-soft mt-2 text-sm">
              {siradaki ? `Sıradaki tekrar ${relativeDue(siradaki)}.` : 'Yarın görüşürüz.'}
            </p>
            {moreLeft && (
              <div className="mt-5">
                <Button variant="soft" onClick={onMoreNew}>
                  {NEW_PER_DAY} kelime daha öğren
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <>
            {/* Birincil eylem renkli blok, ikincil beyaz — hiyerarsi renkten okunur */}
            {bugun > 0 && (
              <div className="rise rounded-card p-5 bg-gradient-to-br from-brand to-[#7db2ff] text-white shadow-[0_16px_34px_-16px_rgba(79,146,246,0.95)]">
                <p className="text-sm font-medium text-white/80">Bugünün tekrarı</p>
                <p className="word text-3xl font-semibold mt-0.5 mb-3">{bugun} kart</p>
                {birikmis && (
                  <p className="text-sm text-white/75 -mt-2 mb-3">
                    Ara vermişsin — yavaştan başlayalım.
                  </p>
                )}
                <Button variant="soft" onClick={onReview}>
                  Tekrarla
                </Button>
              </div>
            )}

            {/*
              Tanis bolumu HER ZAMAN gorunur. Onceki surumde gunluk butce
              bitince blok tamamen kayboluyordu; kullanici Tanis'in nereye
              gittigini anlamiyordu.
            */}
            {newCards.length > 0 ? (
              bugun > 0 ? (
                <Card className="rise delay-1">
                  <p className="text-sm text-ink-soft">Deste {introDeck}</p>
                  <p className="word text-3xl font-semibold mt-0.5 mb-3">
                    {newCards.length} yeni kelime
                  </p>
                  <Button variant="brand" onClick={onIntro}>
                    Tanış
                  </Button>
                </Card>
              ) : (
                <div className="rise delay-1 rounded-card p-5 bg-gradient-to-br from-grow to-[#5fe0ad] text-white shadow-[0_16px_34px_-16px_rgba(43,196,138,0.95)]">
                  <p className="text-sm font-medium text-white/85">Deste {introDeck}</p>
                  <p className="word text-3xl font-semibold mt-0.5 mb-3">
                    {newCards.length} yeni kelime
                  </p>
                  <Button variant="soft" onClick={onIntro}>
                    Tanış
                  </Button>
                </div>
              )
            ) : moreLeft ? (
              <Card className="rise delay-1">
                <p className="word text-lg font-semibold">Bugünün yeni kelimeleri tamam</p>
                <p className="text-sm text-ink-soft mt-1 mb-3">
                  Günde {NEW_PER_DAY} kelime, tekrarlar birikmesin diye. İstersen devam et.
                </p>
                <Button variant="soft" onClick={onMoreNew}>
                  {NEW_PER_DAY} kelime daha
                </Button>
              </Card>
            ) : (
              <Card className="rise delay-1 text-center py-7">
                <p className="text-3xl mb-1">🏁</p>
                <p className="word text-lg font-semibold">Tüm kelimelerle tanıştın</p>
                <p className="text-sm text-ink-soft mt-1">Bundan sonrası tekrar.</p>
              </Card>
            )}
          </>
        )}

        {testReady !== undefined && (
          <button
            onClick={() => onTest(testReady)}
            className="rise delay-2 rounded-card bg-gradient-to-br from-spark to-[#ffbe1a] p-5 text-left shadow-[0_12px_26px_-12px_rgba(255,190,26,0.9)] transition-all active:scale-[0.98]"
          >
            <p className="word text-lg font-semibold">Deste {testReady} testi hazır ✨</p>
            <p className="text-sm font-medium text-ink/70 mt-0.5">
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
                  className={`aspect-square rounded-2xl word font-semibold text-lg tabular-nums transition-all ${TILE[status]} ${clickable ? 'active:scale-95' : ''}`}
                >
                  {status === 'done' ? '✓' : d.n}
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
                  className="rounded-full bg-white px-3 py-1.5 text-sm shadow-[var(--shadow-soft)]"
                >
                  <span className="word font-semibold">{c.en}</span>
                  <span className="text-ink-faint"> ≈ </span>
                  <span className="font-semibold text-ink bg-spark/55 rounded px-1">{c.hook}</span>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

    </Screen>
  );
}

