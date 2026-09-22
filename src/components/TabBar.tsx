import { Ikon } from './ui';
import type { IkonAd } from '../icons';

export type Tab = 'ogren' | 'egzersiz' | 'ilerleme' | 'ayarlar';

/**
 * Her sekmenin kendi rengi var — dordu de ayni mavi pille isaretlenince
 * hangi sekmede oldugu ancak yazi okunarak anlasiliyordu. Renk sabit:
 * sekme nereye giderse gitsin ayni rengi tasiyor.
 *
 * Ikon adi sekme adiyla birebir ayni (bkz. icons.ts) — ayri bir alan
 * tutulmuyor, cunku ikisi ayrisirsa sessizce yanlis ikon cikar.
 */
const TABS: { id: Tab & IkonAd; ad: string; renk: string }[] = [
  { id: 'ogren', ad: 'Öğren', renk: 'bg-brand' },
  { id: 'egzersiz', ad: 'Egzersiz', renk: 'bg-grow' },
  { id: 'ilerleme', ad: 'İlerleme', renk: 'bg-ink' },
  { id: 'ayarlar', ad: 'Ayarlar', renk: 'bg-ink-soft' },
];

/** Alt menunun kaplayacagi yer — icerik altinda kalmasin diye. */
export const TAB_SPACE = 'pb-28';

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md gap-1 rounded-full bg-white/90 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur">
        {TABS.map((t) => {
          const secili = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex-1 rounded-full py-2 text-[11px] font-bold transition-all active:scale-95 ${
                secili ? `${t.renk} text-white` : 'text-ink-faint'
              }`}
            >
              {/*
                Secili sekmenin zemini dolu renk; lacivert ikon orada
                kayboluyor, o yuzden ters (krem) varyant cikiyor.
                Secili olmayan sekmenin YAZISI soluyor ama ikonu tam
                renginde duruyor: dort ikon her zaman okunur kalsin diye.
              */}
              <Ikon ad={t.id} ters={secili} className="mx-auto mb-0.5 h-6 w-6" />
              {t.ad}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
