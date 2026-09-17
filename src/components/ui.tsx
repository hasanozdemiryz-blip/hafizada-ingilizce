import type { ReactNode } from 'react';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex justify-center">
      <div className="w-full max-w-md px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))] flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function TopBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between h-10 shrink-0 text-sm text-ink-soft">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="-ml-2 px-2 py-1 rounded-lg hover:bg-paper-2">
      ← Ana ekran
    </button>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
}: ButtonProps) {
  const base =
    'w-full rounded-2xl px-5 py-4 font-medium transition active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100';
  const styles = {
    primary: 'bg-ink text-paper',
    secondary: 'bg-paper-2 text-ink border border-line',
    ghost: 'text-ink-soft hover:bg-paper-2',
  }[variant];

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

/** Seans ilerlemesi */
export function Progressbar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="h-1 w-full rounded-full bg-line overflow-hidden">
      <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
