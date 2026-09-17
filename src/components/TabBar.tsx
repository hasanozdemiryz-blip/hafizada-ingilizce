export type Tab = 'ogren' | 'kelimeler' | 'ilerleme';

const TABS: { id: Tab; ad: string; ikon: string }[] = [
  { id: 'ogren', ad: 'Öğren', ikon: '◉' },
  { id: 'kelimeler', ad: 'Kelimelerim', ikon: '☰' },
  { id: 'ilerleme', ad: 'İlerleme', ikon: '▦' },
];

/** Alt menu yalnizca sekmeli ekranlarda; seans akislarinda gizli. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 flex justify-center pointer-events-none">
      <div className="w-full max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-auto">
        <div className="flex bg-white rounded-full p-1.5 shadow-[0_-2px_30px_-10px_rgba(22,35,58,0.35)]">
          {TABS.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                aria-current={on ? 'page' : undefined}
                className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  on ? 'bg-brand text-white' : 'text-ink-faint hover:text-ink-soft'
                }`}
              >
                <span className="block text-base leading-none mb-0.5">{t.ikon}</span>
                {t.ad}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/** Alt menunun kapattigi alan kadar bosluk */
export const TAB_SPACE = 'pb-28';
