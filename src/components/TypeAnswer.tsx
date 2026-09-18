import { useEffect, useRef, useState } from 'react';

/**
 * Yazarak cevap.
 *
 * Uretim ve dinleme asamalarinin ortak girdisi. Ikisi de Ingilizce kelimeyi
 * yazdirir; degisen sey yalnizca SORU (anlam mi, ses mi). Bu yuzden tek
 * bilesen.
 *
 * Otomatik buyuk harf, otomatik duzeltme ve yazim denetimi KAPALI: telefon
 * klavyesi `sell` yazarken "sel" onerip cevabi kendisi veriyor.
 */
export function TypeAnswer({
  onSubmit,
  disabled,
  placeholder = 'İngilizcesini yaz…',
}: {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  // Her yeni soruda alan bos ve odakli baslasin
  useEffect(() => {
    setValue('');
    ref.current?.focus();
  }, [onSubmit]);

  const gonder = () => {
    if (disabled || value.trim().length === 0) return;
    onSubmit(value);
  };

  return (
    <div className="flex gap-2.5">
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && gonder()}
        disabled={disabled}
        placeholder={placeholder}
        lang="en"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className="word flex-1 min-w-0 rounded-full bg-white px-5 py-4 text-lg font-bold text-center shadow-[var(--shadow-soft)] outline-none placeholder:font-normal placeholder:text-base placeholder:text-ink-faint focus:ring-2 focus:ring-brand disabled:opacity-50"
      />
      <button
        onClick={gonder}
        disabled={disabled || value.trim().length === 0}
        className="shrink-0 rounded-full bg-brand px-6 py-4 font-bold text-white shadow-[var(--shadow-soft)] transition-all active:scale-95 disabled:opacity-30"
      >
        Bak
      </button>
    </div>
  );
}
