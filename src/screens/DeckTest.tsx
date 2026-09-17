import { useMemo, useState } from 'react';
import { BackButton, Button, Progressbar, Screen, TopBar } from '../components/ui';
import { CARDS, TEST_PASS_SCORE, cardsOfDeck } from '../content';
import { recordDeckTest } from '../db';
import { shareResult } from '../share';
import type { Card } from '../types';

type Question = { card: Card; options: string[] };

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinav degil kilometre tasi.
 * Kelime CIPLAK sorulur (L0) — gorsel ve kanca yok. Gercekten ogrenildi mi,
 * yoksa gorsel mi hatirlandi, ayrimi burada cikar.
 */
function buildQuestions(deck: number): Question[] {
  const cards = cardsOfDeck(deck);
  return shuffle(cards).map((card) => {
    const pool = (cards.length >= 4 ? cards : CARDS).filter((c) => c.id !== card.id);
    const distractors = shuffle(pool).slice(0, 3).map((c) => c.tr);
    return { card, options: shuffle([card.tr, ...distractors]) };
  });
}

export function DeckTest({ deck, onExit }: { deck: number; onExit: () => void }) {
  const questions = useMemo(() => buildQuestions(deck), [deck]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[i];

  async function pick(option: string) {
    if (picked !== null) return;
    setPicked(option);
    const correct = option === q.card.tr;
    const nextScore = score + (correct ? 1 : 0);
    if (correct) setScore(nextScore);

    setTimeout(async () => {
      if (i + 1 >= questions.length) {
        const now = new Date().toISOString();
        await recordDeckTest(deck, {
          score: nextScore,
          total: questions.length,
          passedAt: nextScore >= TEST_PASS_SCORE ? now : null,
          lastAttemptAt: now,
        });
        setFinished(true);
      } else {
        setI(i + 1);
        setPicked(null);
      }
    }, 650);
  }

  if (finished) {
    const passed = score >= TEST_PASS_SCORE;
    return (
      <Screen>
        <TopBar left={<BackButton onClick={onExit} />} />
        <div className="flex-1 flex flex-col justify-center items-center gap-6 text-center rise">
          <span className="text-sm uppercase tracking-[0.14em] text-ink-faint">Deste {deck}</span>
          <p className="text-7xl font-bold tracking-tight">
            {score}/{questions.length}
          </p>
          <p className="text-lg text-ink-soft max-w-[26ch]">
            {passed
              ? `${deck * 10} kelime, ezbersiz. Deste tamam.`
              : 'Biraz daha tekrar iyi gelir. Deste açık kalıyor.'}
          </p>
        </div>
        <div className="shrink-0 space-y-3">
          <Button onClick={() => void shareResult(deck, score, questions.length)}>
            Sonucu paylaş
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Ana ekran
          </Button>
        </div>
      </Screen>
    );
  }

  if (!q) return null;

  return (
    <Screen>
      <TopBar
        left={<BackButton onClick={onExit} />}
        right={
          <span>
            {i + 1} / {questions.length}
          </span>
        }
      />
      <Progressbar done={i} total={questions.length} />

      <div key={q.card.id} className="rise flex-1 flex flex-col justify-center items-center gap-3">
        <span className="text-sm text-ink-faint">Türkçesi hangisi?</span>
        <p className="text-5xl font-semibold tracking-tight">{q.card.en}</p>
      </div>

      <div className="shrink-0 grid gap-2">
        {q.options.map((opt) => {
          const isCorrect = opt === q.card.tr;
          const state =
            picked === null
              ? 'bg-paper-2 border border-line text-ink'
              : isCorrect
                ? 'bg-good-soft border border-good text-good'
                : picked === opt
                  ? 'bg-accent-soft border border-accent text-accent'
                  : 'bg-paper-2 border border-line text-ink-faint';

          return (
            <button
              key={opt}
              onClick={() => void pick(opt)}
              disabled={picked !== null}
              className={`rounded-2xl px-5 py-4 font-medium text-left transition active:scale-[0.985] ${state}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
