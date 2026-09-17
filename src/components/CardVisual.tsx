import type { Card } from '../types';

/**
 * Kart gorseli — urunun kalbi.
 *
 * Gorsel henuz yokken yuvasi bos bir kutu degil: her kartin kendine ait,
 * sabit bir pastel zemini var. Boylece kartlar birbirinden ayirt edilir,
 * ekran canli durur ve gorseller geldiginde ayni yuvaya otururlar.
 */
const ZEMINLER = [
  'from-[#dbe9ff] to-[#c7dcff]', // mavi
  'from-[#fff1c9] to-[#ffe49c]', // sari
  'from-[#fde3f0] to-[#fbd0e6]', // pembe
  'from-[#d8f7ea] to-[#bdf0dc]', // nane
  'from-[#e8e3ff] to-[#d9d1ff]', // lavanta
  'from-[#ffe6d8] to-[#ffd4bd]', // seftali
];

/** Kart id'sinden sabit zemin secimi — ayni kart her zaman ayni renkte. */
function zeminOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ZEMINLER[h % ZEMINLER.length];
}

export function CardVisual({ card, size = 'full' }: { card: Card; size?: 'full' | 'compact' }) {
  const ratio = size === 'full' ? 'aspect-[4/3]' : 'aspect-[16/9]';

  if (card.image) {
    return (
      <img src={card.image} alt="" className={`w-full ${ratio} rounded-[1.4rem] object-cover`} />
    );
  }

  return (
    <div
      className={`w-full ${ratio} rounded-[1.4rem] bg-gradient-to-br ${zeminOf(card.id)} px-6 flex flex-col items-center justify-center text-center gap-2 overflow-hidden`}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/35">
        görsel gelecek
      </span>
      <p className="text-sm font-medium leading-snug text-ink/70 max-w-[30ch]">{card.imageNote}</p>
    </div>
  );
}
