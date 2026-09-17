import { CardVisual } from './CardVisual';
import { Card as CardShell, HookChip } from './ui';
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
    <CardShell className="w-full">
      {level >= 2 && <CardVisual card={card} />}

      <div className={`flex flex-col items-center gap-3 ${level >= 2 ? 'pt-5' : 'py-6'}`}>
        <p className="word text-[2.75rem] leading-none font-semibold">{card.en}</p>

        {level >= 1 && (
          <span className={hookRevealed ? 'pop' : ''}>
            <HookChip>{card.hook}</HookChip>
          </span>
        )}

        {level >= 3 && (
          <p className="rise text-center text-ink-soft leading-relaxed max-w-[30ch]">
            “{card.sentence}”
          </p>
        )}
      </div>
    </CardShell>
  );
}

export function AnswerFace({ card }: { card: Card }) {
  return (
    <CardShell className="w-full rise">
      <CardVisual card={card} size="compact" />

      <div className="flex flex-col items-center gap-3 pt-5">
        <p className="word text-xl leading-none text-ink-faint">{card.en}</p>
        <p className="word text-[2.5rem] leading-none font-semibold text-center">{card.tr}</p>

        <HookChip>
          {card.en} ≈ {card.hook}
        </HookChip>

        <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">“{card.sentence}”</p>
      </div>
    </CardShell>
  );
}
