import { CardVisual } from './CardVisual';
import type { Card, SupportLevel } from '../types';

/**
 * Asamali iskele.
 * Seviye SADECE soru yuzunu etkiler — cevap yuzu her zaman tam bilgiyi gosterir.
 */
export function QuestionFace({
  card,
  support,
  hookRevealed,
}: {
  card: Card;
  support: SupportLevel;
  hookRevealed: boolean;
}) {
  // Kanca gosterildiyse o an icin tam destek gorunur
  const level: SupportLevel = hookRevealed ? 3 : support;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {level >= 2 && <CardVisual card={card} />}

      <p className="text-4xl font-semibold tracking-tight">{card.en}</p>

      {level >= 1 && (
        <span className="rise rounded-full bg-accent-soft text-accent px-3 py-1 text-sm font-medium">
          {card.hook}
        </span>
      )}

      {level >= 3 && (
        <p className="rise text-center text-ink-soft leading-relaxed max-w-[30ch]">
          “{card.sentence}”
        </p>
      )}
    </div>
  );
}

export function AnswerFace({ card }: { card: Card }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full rise">
      <CardVisual card={card} size="compact" />

      <div className="text-center">
        <p className="text-2xl font-medium text-ink-soft">{card.en}</p>
        <p className="text-4xl font-semibold tracking-tight mt-1">{card.tr}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-accent-soft text-accent px-3 py-1 text-sm font-medium">
          {card.en} ≈ {card.hook}
        </span>
        <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">“{card.sentence}”</p>
      </div>
    </div>
  );
}
