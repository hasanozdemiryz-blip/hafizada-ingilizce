import type { ReactNode } from 'react';

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
    <div className="flex items-center justify-between h-11 shrink-0 text-sm text-ink-soft">
      <div>{left}</div>
      <div className="tabular-nums">{right}</div>
    </div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="-ml-2 px-2 py-1 rounded-lg hover:bg-sunken transition-colors"
    >
      ← Ana ekran
    </button>
  );
}

/** Kart: sayfada duran ogeler degil, elle tutulur bir nesne. */
export function Card({
  children,
  className = '',
  tilt = false,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  return (
    <article
      className={`rounded-card bg-surface border border-line p-5 shadow-[0_1px_0_#fff_inset,0_14px_36px_-20px_rgba(31,27,24,0.35)] ${
        tilt ? '-rotate-[0.6deg]' : ''
      } ${className}`}
    >
      {children}
    </article>
  );
}

type Variant = 'primary' | 'brand' | 'soft' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper shadow-[0_3px_0_#0f0d0b]',
  brand: 'bg-brand text-white shadow-[0_3px_0_var(--color-brand-deep)]',
  soft: 'bg-surface text-ink border border-line shadow-[0_2px_0_var(--color-line)]',
  ghost: 'text-ink-soft hover:bg-sunken',
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
      className={`w-full rounded-2xl px-5 py-4 font-semibold transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-35 disabled:shadow-none disabled:active:translate-y-0 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Progressbar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-sunken overflow-hidden shrink-0">
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Ses kancasi rozeti — urunun imzasi. */
export function HookChip({ children, big = false }: { children: ReactNode; big?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-brand-soft text-brand font-semibold ${
        big ? 'px-4 py-2 text-lg' : 'px-3 py-1 text-sm'
      }`}
    >
      {children}
    </span>
  );
}

export function Streak({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-spark-soft px-3 py-1 text-sm font-semibold text-ink">
      <span className="sparkle">🔥</span>
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
