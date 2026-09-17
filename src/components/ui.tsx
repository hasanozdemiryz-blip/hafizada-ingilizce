import type { ReactNode } from 'react';
import kilit from '../assets/brand/kilit.webp';

/**
 * Marka kilidi: isaret + isim.
 * brand/kilit-kaynak.png'den uretiliyor — uygulama simgesiyle ayni isaret.
 */
export function Logo({ className = 'h-7' }: { className?: string }) {
  return <img src={kilit} alt="Hafızada İngilizce" className={`${className} w-auto`} />;
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex justify-center">
      <div className="w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function TopBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between h-11 shrink-0 text-sm font-medium text-ink-soft">
      <div>{left}</div>
      <div className="tabular-nums">{right}</div>
    </div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="-ml-1 h-9 w-9 rounded-full bg-white/70 text-ink shadow-[var(--shadow-soft)] grid place-items-center hover:bg-white transition"
      aria-label="Geri"
    >
      ←
    </button>
  );
}

/** Kart: beyaz, yuvarlak, yumusak golgeli bir nesne. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-card bg-surface p-5 shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </article>
  );
}

type Variant = 'primary' | 'brand' | 'soft' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white shadow-[0_8px_20px_-8px_rgba(22,35,58,0.6)]',
  brand: 'bg-brand text-white shadow-[0_8px_20px_-8px_rgba(79,146,246,0.85)]',
  soft: 'bg-white text-ink shadow-[var(--shadow-soft)]',
  ghost: 'text-ink-soft hover:bg-white/60',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full px-5 py-4 font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Progressbar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="h-2.5 w-full rounded-full bg-white/70 overflow-hidden shrink-0">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand to-[#7db2ff] transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Ses kancasi — urunun imzasi.
 * Fosforlu kalem izi: kanca zaten "isaretlenmis" seydir.
 */
export function HookChip({ children, big = false }: { children: ReactNode; big?: boolean }) {
  return (
    <span
      className={`marker word font-semibold text-ink ${big ? 'text-xl' : 'text-base'}`}
    >
      {children}
    </span>
  );
}

export function Streak({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-[var(--shadow-soft)]">
      <span className="bob inline-block">🔥</span>
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
