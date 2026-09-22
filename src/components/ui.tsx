import type { ReactNode } from 'react';
import { seslendir, useTelaffuz } from '../speech';
import { ikonUrl, type IkonAd } from '../icons';
import kilit from '../assets/brand/kilit.webp';
import isaret from '../assets/brand/isaret.webp';

/**
 * Arayuz ikonu — markanin cizim setinden (bkz. icons.ts).
 *
 * `alt=""`: ikonlar HER YERDE bir yazinin yaninda duruyor, tek baslarina
 * bilgi tasimiyorlar. Ekran okuyucuya iki kez "Ayarlar" dedirtmek yerine
 * susuyorlar; yazisiz tek kullanim (telaffuz dugmesi) kendi
 * `aria-label`'ini tasiyor.
 *
 * Kaynak 64 piksel: 32'ye kadar retinada net, ustunde yumusuyor. Bos
 * ekranlardaki buyuk kullanimlar bu yuzden 56'da duruyor.
 */
export function Ikon({
  ad,
  ters = false,
  className = 'h-6 w-6',
}: {
  ad: IkonAd;
  /** Koyu zeminde mi duruyor — murekkep kreme doner. */
  ters?: boolean;
  className?: string;
}) {
  return <img src={ikonUrl(ad, ters)} alt="" aria-hidden className={`${className} object-contain`} />;
}

/**
 * Marka kilidi: isaret + isim.
 * brand/kilit-kaynak.png'den uretiliyor — uygulama simgesiyle ayni isaret.
 */
/**
 * Marka.
 *
 * `mark` — yalnizca kare isaret. Uygulama ici baslik icin TEK dogru bicim:
 * yatay kilit (isaret + isim) 28px yuksekliğe sikistiginda yazi ~10px'e
 * duser ve telefonda okunmaz, isaret de ezilir. Kilitler ~40px altinda
 * calismaz. Uygulamanin icindeyken zaten hangi uygulamada oldugu belli.
 *
 * `full` — kilidin tamami. Yalnizca yer olan yerde (karsilama) ve buyuk.
 */
export function Logo({
  variant = 'mark',
  className,
}: {
  variant?: 'mark' | 'full';
  className?: string;
}) {
  const mark = variant === 'mark';
  return (
    <img
      src={mark ? isaret : kilit}
      alt="Hafızada İngilizce"
      className={`${className ?? (mark ? 'h-9' : 'h-12')} w-auto`}
    />
  );
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
      className={`marker word font-bold text-ink ${big ? 'text-xl' : 'text-base'}`}
    >
      {children}
    </span>
  );
}

/**
 * Telaffuz dugmesi.
 *
 * Kancanin ogretemedigi tek sey dogru telaffuz; bu dugme onu verir.
 * NEREDE gorunecegine cagiran karar verir — kart yuzlerinde yalnizca
 * kanca ekrandan kalkarken (L1/L0) cikar, bkz. speech.ts.
 */
export function SpeakButton({
  word,
  size = 'normal',
}: {
  word: string;
  size?: 'normal' | 'small';
}) {
  const sesVar = useTelaffuz();
  if (!sesVar) return null;
  const kucuk = size === 'small';
  return (
    <button
      type="button"
      aria-label={`${word} nasil okunur`}
      onClick={(e) => {
        e.stopPropagation(); // kart yuzunde "cevabi goster"i tetiklemesin
        seslendir(word);
      }}
      className={`shrink-0 inline-flex items-center justify-center rounded-full bg-sunken transition-all active:scale-90 hover:bg-brand-soft ${
        kucuk ? 'h-8 w-8' : 'h-11 w-11'
      }`}
    >
      <Ikon ad="ses" className={kucuk ? 'h-4 w-4' : 'h-6 w-6'} />
    </button>
  );
}

export function Streak({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-[var(--shadow-soft)]">
      <Ikon ad="seri" className="bob h-4 w-4" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
