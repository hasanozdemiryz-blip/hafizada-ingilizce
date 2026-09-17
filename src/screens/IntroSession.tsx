import { useState } from 'react';
import { CardVisual } from '../components/CardVisual';
import { BackButton, Button, Card, HookChip, Progressbar, Screen, TopBar } from '../components/ui';
import { db, touchStreak } from '../db';
import { introduceCard } from '../scheduler';
import type { Card as CardType } from '../types';

/**
 * TANIS — kodlama ritmi.
 * Yavas, tek kart, tam ekran. Gizlenen bir sey yok: amac "haa" anini yasatmak.
 * Tek soru: kanca tuttu mu?
 */
export function IntroSession({
  cards,
  onExit,
  onFinish,
}: {
  cards: CardType[];
  onExit: () => void;
  onFinish: (count: number, streak: number) => void;
}) {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const card = cards[i];

  async function answer(stuck: boolean) {
    if (busy || !card) return;
    setBusy(true);
    await db.progress.put(introduceCard(card, stuck));

    if (i + 1 >= cards.length) {
      const state = await touchStreak();
      onFinish(cards.length, state.streakCount);
    } else {
      setI(i + 1);
      setBusy(false);
    }
  }

  if (!card) return null;

  return (
    <Screen>
      <TopBar
        left={<BackButton onClick={onExit} />}
        right={
          <span>
            {i + 1} / {cards.length}
          </span>
        }
      />
      <Progressbar done={i} total={cards.length} />

      <div key={card.id} className="rise flex-1 flex flex-col justify-center py-6">
        <Card tilt>
          <CardVisual card={card} />
          <div className="flex flex-col items-center gap-3 pt-5">
            <p className="word text-[2.75rem] leading-none font-semibold">{card.en}</p>
            <p className="word text-xl leading-none text-ink-soft">{card.tr}</p>
            <HookChip big>
              {card.en} ≈ {card.hook}
            </HookChip>
            <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">
              “{card.sentence}”
            </p>
          </div>
        </Card>
      </div>

      <div className="shrink-0 space-y-3">
        <p className="text-center text-sm text-ink-faint">Kanca tuttu mu?</p>
        <div className="flex gap-3">
          <Button variant="soft" onClick={() => answer(true)} disabled={busy}>
            Tutmadı
          </Button>
          <Button variant="brand" onClick={() => answer(false)} disabled={busy}>
            Tuttu
          </Button>
        </div>
      </div>
    </Screen>
  );
}
