import { useMemo, useState } from 'react';
import { AnswerFace, QuestionFace } from '../components/CardFace';
import { BackButton, Button, Progressbar, Screen, TopBar } from '../components/ui';
import { CARD_BY_ID } from '../content';
import { db, touchStreak } from '../db';
import { Rating, reviewCard } from '../scheduler';
import type { Progress } from '../types';
import type { Grade } from 'ts-fsrs';

const RATINGS: { grade: Grade; label: string; tone: string }[] = [
  { grade: Rating.Again, label: 'Unuttum', tone: 'bg-blush-soft text-[#c2417f]' },
  { grade: Rating.Hard, label: 'Zor', tone: 'bg-spark-soft text-[#9a6f00]' },
  { grade: Rating.Good, label: 'İyi', tone: 'bg-brand-soft text-brand-deep' },
  { grade: Rating.Easy, label: 'Kolay', tone: 'bg-grow-soft text-[#128a5f]' },
];

/**
 * TEKRARLA — hatirlama ritmi.
 * Hizli, ritmik. Soru yuzu destek seviyesine gore kisilir; iskele sokulur.
 */
export function ReviewSession({
  queue: initial,
  onExit,
  onFinish,
}: {
  queue: Progress[];
  onExit: () => void;
  onFinish: (count: number, streak: number) => void;
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
      const state = await touchStreak();
      onFinish(total, state.streakCount);
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

      <div className="flex-1 flex flex-col justify-center py-6">
        <div
          key={`${current.cardId}-${revealed}`}
          onClick={() => !revealed && setRevealed(true)}
          className={revealed ? '' : 'cursor-pointer'}
        >
          {revealed ? (
            <AnswerFace card={card} />
          ) : (
            <QuestionFace card={card} support={current.support} hookRevealed={hookRevealed} />
          )}
        </div>
      </div>

      <div className="shrink-0 space-y-2">
        {!revealed && (
          <>
            <div className="h-10 flex items-center justify-center">
              {current.support < 3 && !hookRevealed && (
                <button
                  onClick={() => setHookRevealed(true)}
                  className="px-4 py-2 text-sm font-bold text-brand-deep rounded-full bg-white/70 shadow-[var(--shadow-soft)] hover:bg-white transition"
                >
                  Kancayı göster
                </button>
              )}
            </div>
            <Button onClick={() => setRevealed(true)}>Göster</Button>
          </>
        )}

        {revealed && (
          <div className="grid grid-cols-2 gap-2.5">
            {RATINGS.map((r) => (
              <button
                key={r.grade}
                onClick={() => rate(r.grade)}
                disabled={busy}
                className={`rounded-2xl px-4 py-4 font-bold transition-all active:scale-95 disabled:opacity-40 shadow-[var(--shadow-soft)] ${r.tone}`}
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
