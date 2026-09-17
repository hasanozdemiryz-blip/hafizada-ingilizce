import type { Card } from '../types';

/**
 * Kart gorseli — urunun kalbi.
 * Gorsel henuz uretilmediyse brief'in kendisi gosterilir; boylece
 * mnemonik bag calisir kalir ve akis gorseller olmadan da test edilebilir.
 */
export function CardVisual({ card, size = 'full' }: { card: Card; size?: 'full' | 'compact' }) {
  const ratio = size === 'full' ? 'aspect-[4/3]' : 'aspect-[16/9]';

  if (card.image) {
    return (
      <img
        src={card.image}
        alt=""
        className={`w-full ${ratio} rounded-2xl object-cover bg-sunken`}
      />
    );
  }

  return (
    <div
      className={`w-full ${ratio} rounded-2xl bg-sunken px-6 flex flex-col items-center justify-center text-center gap-2.5`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        görsel gelecek
      </span>
      <p className="text-sm leading-snug text-ink-soft max-w-[30ch]">{card.imageNote}</p>
    </div>
  );
}
