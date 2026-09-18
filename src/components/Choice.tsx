import { CardVisual } from './CardVisual';
import { Card as CardShell, HookChip } from './ui';
import type { Card } from '../types';

/**
 * COKTAN SECMELI — merdivenin 2. ve 3. basamagi.
 *
 * 2'de `sell` sorulur, Turkce sik secilir; kanca ve gorsel ekranda durur.
 * 3'te yon doner (`satmak` -> Ingilizce sik) ve kanca ekrandan kalkar,
 * yalnizca ipucu olarak kalir. Yon degisimi tanimadan uretime gecisin ilk
 * adimi: bir kelimeyi gorup taniyabilmek, onu uretebilmek demek degil.
 */
export function Choice({
  card,
  options,
  ters,
  secilen,
  hookRevealed,
  onPick,
}: {
  card: Card;
  options: string[];
  /** true: TR sorulur, EN secilir (adim 3) */
  ters: boolean;
  secilen: string | null;
  hookRevealed: boolean;
  onPick: (secim: string) => void;
}) {
  const sorulan = ters ? card.tr : card.en;
  const dogru = ters ? card.en : card.tr;

  return (
    <div className="flex flex-col gap-3">
      <CardShell className="w-full">
        {!ters && <CardVisual card={card} size="compact" />}
        <div className={`flex flex-col items-center gap-3 ${ters ? 'py-6' : 'pt-5'}`}>
          <span className="text-sm text-ink-faint">
            {ters ? 'İngilizcesi hangisi?' : 'Türkçesi hangisi?'}
          </span>
          <p className={`text-[2.25rem] leading-none font-extrabold ${ters ? '' : 'word'}`}>
            {sorulan}
          </p>
          {(!ters || hookRevealed) && (
            <span className={hookRevealed ? 'pop' : ''}>
              <HookChip>{card.hook}</HookChip>
            </span>
          )}
        </div>
      </CardShell>

      <div className="grid gap-2.5">
        {options.map((o) => {
          const ton =
            secilen === null
              ? 'bg-white text-ink shadow-[var(--shadow-soft)]'
              : o === dogru
                ? 'bg-grow text-white shadow-[var(--shadow-soft)]'
                : secilen === o
                  ? 'bg-blush text-white shadow-[var(--shadow-soft)]'
                  : 'bg-white/50 text-ink-faint';
          return (
            <button
              key={o}
              onClick={() => onPick(o)}
              disabled={secilen !== null}
              className={`rounded-full px-5 py-4 font-bold transition-all active:scale-[0.98] ${
                ters ? 'word' : ''
              } ${ton}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
