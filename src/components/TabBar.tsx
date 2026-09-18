export type Tab = 'ogren' | 'egzersiz' | 'ilerleme' | 'ayarlar';

const TABS: { id: Tab; ad: string; ikon: string }[] = [
  { id: 'ogren', ad: 'Öğren', ikon: '🌱' },
  { id: 'egzersiz', ad: 'Egzersiz', ikon: '🎯' },
  { id: 'ilerleme', ad: 'İlerleme', ikon: '📊' },
  { id: 'ayarlar', ad: 'Ayarlar', ikon: '⚙️' },
];

/** Alt menunun kaplayacagi yer — icerik altinda kalmasin diye. */
export const TAB_SPACE = 'pb-28';

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md gap-1 rounded-full bg-white/90 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex-1 rounded-full py-2 text-[11px] font-bold transition-all active:scale-95 ${
              active === t.id ? 'bg-brand text-white' : 'text-ink-faint'
            }`}
          >
            <span className="block text-base leading-none mb-0.5">{t.ikon}</span>
            {t.ad}
          </button>
        ))}
      </div>
    </nav>
  );
}
