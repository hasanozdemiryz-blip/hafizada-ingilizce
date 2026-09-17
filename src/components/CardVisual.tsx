import type { Card } from '../types';

/**
 * Kart gorseli.
 *
 * Gorsel uretimi (Faz 2) henuz kilitli — gorsel yokken brief'in kendisi
 * gosterilir. Boylece mnemonik bag calisir durumda kalir ve akis
 * gorseller gelmeden test edilebilir.
 */
export function CardVisual({ card, size = 'full' }: { card: Card; size?: 'full' | 'compact' }) {
  const height = size === 'full' ? 'aspect-[4/3]' : 'aspect-[16/9]';

  if (card.image) {
    return (
      <img
        src={card.image}
        alt=""
        className={`w-full ${height} rounded-2xl object-cover bg-paper-2`}
      />
    );
  }

  return (
    <div
      className={`w-full ${height} rounded-2xl border border-dashed border-line bg-paper-2 px-5 flex flex-col items-center justify-center text-center gap-2`}
    >
      <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">görsel gelecek</span>
      <p className="text-sm leading-snug text-ink-soft italic max-w-[28ch]">{card.imageNote}</p>
    </div>
  );
}
