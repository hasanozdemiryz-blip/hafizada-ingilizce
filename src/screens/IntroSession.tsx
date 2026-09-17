import { useState } from 'react';
import { CardVisual } from '../components/CardVisual';
import { BackButton, Button, Progressbar, Screen, TopBar } from '../components/ui';
import { db, touchStreak } from '../db';
import { introduceCard } from '../scheduler';
import type { Card } from '../types';

/**
 * TANIS — kodlama ritmi.
 * Yavas, tek kart, tam ekran. Gizlenen bir sey yok: amac "haa" anini yasatmak.
 * Tek soru: kanca tuttu mu?
 */
export function IntroSession({ cards, onExit }: { cards: Card[]; onExit: () => void }) {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const card = cards[i];

  async function answer(stuck: boolean) {
    if (busy || !card) return;
    setBusy(true);
    await db.progress.put(introduceCard(card, stuck));
    if (i + 1 >= cards.length) {
      await touchStreak();
      onExit();
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

      <div key={card.id} className="rise flex-1 flex flex-col justify-center gap-7 py-8">
        <CardVisual card={card} />

        <div className="text-center">
          <p className="text-4xl font-semibold tracking-tight">{card.en}</p>
          <p className="text-2xl text-ink-soft mt-1">{card.tr}</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="rounded-full bg-accent-soft text-accent px-4 py-1.5 font-medium">
            {card.en} ≈ {card.hook}
          </span>
          <p className="text-center text-lg text-ink-soft leading-relaxed max-w-[30ch]">
            “{card.sentence}”
          </p>
        </div>
      </div>

      <div className="shrink-0 space-y-3">
        <p className="text-center text-sm text-ink-faint">Kanca tuttu mu?</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => answer(true)} disabled={busy}>
            Tutmadı
          </Button>
          <Button onClick={() => answer(false)} disabled={busy}>
            Tuttu
          </Button>
        </div>
      </div>
    </Screen>
  );
}
