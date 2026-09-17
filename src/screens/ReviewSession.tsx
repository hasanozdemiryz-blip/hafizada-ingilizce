import { useMemo, useState } from 'react';
import { AnswerFace, QuestionFace } from '../components/CardFace';
import { BackButton, Progressbar, Screen, TopBar } from '../components/ui';
import { CARD_BY_ID } from '../content';
import { db, touchStreak } from '../db';
import { Rating, reviewCard } from '../scheduler';
import type { Progress } from '../types';
import type { Grade } from 'ts-fsrs';

const RATINGS: { grade: Grade; label: string; tone: string }[] = [
  { grade: Rating.Again, label: 'Unuttum', tone: 'bg-accent-soft text-accent' },
  { grade: Rating.Hard, label: 'Zor', tone: 'bg-paper-2 text-ink border border-line' },
  { grade: Rating.Good, label: 'İyi', tone: 'bg-paper-2 text-ink border border-line' },
  { grade: Rating.Easy, label: 'Kolay', tone: 'bg-good-soft text-good' },
];

/**
 * TEKRARLA — hatirlama ritmi.
 * Hizli, ritmik. Soru yuzu destek seviyesine gore kisilir; iskele sokulur.
 */
export function ReviewSession({
  queue: initial,
  onExit,
}: {
  queue: Progress[];
  onExit: () => void;
}) {
  const [pending, setPending] = useState<Progress[]>(initial);
  const [revealed, setRevealed] = useState(false);
  const [hookRevealed, setHookRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => new Set(initial.map((p) => p.cardId)).size, [initial]);
  const remaining = new Set(pending.map((p) => p.cardId)).size;

  const current = pending[0];
  const card = current ? CARD_BY_ID.get(current.cardId) : undefined;

  async function rate(grade: Grade) {
    if (busy || !current) return;
    setBusy(true);

    const { progress, requeue } = reviewCard(current, grade, hookRevealed);
    await db.progress.put(progress);

    const rest = pending.slice(1);
    const next = requeue ? [...rest, progress] : rest;

    if (next.length === 0) {
      await touchStreak();
      onExit();
      return;
    }

    setPending(next);
    setRevealed(false);
    setHookRevealed(false);
    setBusy(false);
  }

  if (!current || !card) return null;

  return (
    <Screen>
      <TopBar left={<BackButton onClick={onExit} />} right={<span>{remaining} kaldı</span>} />
      <Progressbar done={total - remaining} total={total} />

      <button
        key={`${current.cardId}-${revealed}`}
        onClick={() => !revealed && setRevealed(true)}
        className="flex-1 flex flex-col justify-center py-8 text-left cursor-pointer"
        aria-label={revealed ? 'Cevap' : 'Cevabı göster'}
      >
        {revealed ? (
          <AnswerFace card={card} />
        ) : (
          <QuestionFace card={card} support={current.support} hookRevealed={hookRevealed} />
        )}
      </button>

      <div className="shrink-0 space-y-3">
        {!revealed && (
          <>
            {current.support < 3 && !hookRevealed && (
              <button
                onClick={() => setHookRevealed(true)}
                className="w-full py-2 text-sm text-ink-soft rounded-xl hover:bg-paper-2"
              >
                Kancayı göster
              </button>
            )}
            <button
              onClick={() => setRevealed(true)}
              className="w-full rounded-2xl px-5 py-4 font-medium bg-ink text-paper active:scale-[0.985] transition"
            >
              Göster
            </button>
          </>
        )}

        {revealed && (
          <div className="grid grid-cols-2 gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.grade}
                onClick={() => rate(r.grade)}
                disabled={busy}
                className={`rounded-2xl px-4 py-4 font-medium transition active:scale-[0.985] disabled:opacity-40 ${r.tone}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
