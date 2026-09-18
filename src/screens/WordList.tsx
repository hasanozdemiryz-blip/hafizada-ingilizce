import { useMemo, useState } from 'react';
import { BackButton, Card, Screen, SpeakButton, TopBar } from '../components/ui';
import { CARDS, CARD_BY_ID } from '../content';
import { ADIM } from '../exercise';
import { shareHookBoard } from '../share';
import { Button } from '../components/ui';
import type { Progress, Step } from '../types';

const FILTRELER = [
  { id: 'ogrenilen', ad: 'Öğrendiklerim' },
  { id: 'tanima', ad: 'Tanıma (1–2)' },
  { id: 'gecis', ad: 'Geçiş (3–4)' },
  { id: 'uretim', ad: 'Üretim (5–6)' },
  { id: 'havuz', ad: 'Tüm havuz' },
] as const;
type Filtre = (typeof FILTRELER)[number]['id'];

const ARALIK: Partial<Record<Filtre, [Step, Step]>> = {
  tanima: [1, 2],
  gecis: [3, 4],
  uretim: [5, 6],
};

const norm = (s: string) => s.toLocaleLowerCase('tr');

/**
 * KELIMELER.
 *
 * Bir ara Egzersiz ekraninin dibindeydi; orasi "ne calisayim" ekrani,
 * liste oraya ait degil — her acilista uzun bir listeyi kaydirmak
 * gerekiyordu. Artik Ilerleme'den acilan kendi ekrani.
 *
 * Kullanici icin gurur tablosu; urun icin paylasilabilir icerik.
 * Kancalar listesi tek basina baskasinin kopyalayamayacagi seydir.
 */
export function WordList({ progress, onExit }: { progress: Progress[]; onExit: () => void }) {
  const [filtre, setFiltre] = useState<Filtre>('ogrenilen');
  const [q, setQ] = useState('');

  const byId = useMemo(() => new Map(progress.map((p) => [p.cardId, p])), [progress]);

  const taban = useMemo(() => {
    if (filtre === 'havuz') return CARDS;
    const aralik = ARALIK[filtre];
    return progress
      .filter((p) => {
        if (!p.introduced) return false;
        return aralik ? p.step >= aralik[0] && p.step <= aralik[1] : true;
      })
      .map((p) => CARD_BY_ID.get(p.cardId))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [progress, filtre]);

  const liste = useMemo(() => {
    if (!q.trim()) return taban;
    const s = norm(q.trim());
    return taban.filter(
      (c) => norm(c.en).includes(s) || norm(c.tr).includes(s) || norm(c.hook).includes(s),
    );
  }, [taban, q]);

  const ogrenilenler = progress.filter((p) => p.introduced);

  return (
    <Screen>
      <TopBar
        left={<BackButton onClick={onExit} />}
        right={<span className="tabular-nums">{ogrenilenler.length} kelime</span>}
      />
      <p className="word text-lg font-bold shrink-0 mb-3">Kelimeler</p>

      <div className="flex-1 flex flex-col gap-3 pb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kelime, anlam veya kanca ara…"
          className="w-full rounded-full bg-white px-5 py-3.5 text-sm shadow-[var(--shadow-soft)] outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-brand shrink-0"
        />

        <div className="flex flex-wrap gap-2 shrink-0">
          {FILTRELER.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              className={`rounded-full px-3.5 py-2 text-sm font-bold transition-all active:scale-95 ${
                filtre === f.id ? 'bg-ink text-white' : 'bg-white text-ink-soft shadow-[var(--shadow-soft)]'
              }`}
            >
              {f.ad}
            </button>
          ))}
        </div>

        {ogrenilenler.length > 0 && filtre === 'ogrenilen' && (
          <Button
            variant="brand"
            onClick={() =>
              void shareHookBoard(
                taban.map((c) => ({ en: c.en, hook: c.hook })),
              )
            }
          >
            Kanca panosunu paylaş
          </Button>
        )}

        <div className="flex flex-col gap-1.5">
          {liste.map((c) => {
            const p = byId.get(c.id);
            const ogrenildi = Boolean(p?.introduced);
            return (
              <div
                key={c.id}
                className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
                  ogrenildi ? 'bg-white shadow-[var(--shadow-soft)]' : 'bg-white/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="word font-semibold">{c.en}</span>
                    <span className="text-ink-faint text-sm">≈</span>
                    <span
                      className={`text-sm font-semibold rounded px-1 ${
                        ogrenildi ? 'bg-spark/55 text-ink' : 'text-ink-faint'
                      }`}
                    >
                      {c.hook}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft mt-0.5 truncate">{c.tr}</p>
                </div>
                {ogrenildi && <SpeakButton word={c.en} size="small" />}
                <span
                  title={ogrenildi ? ADIM[p!.step].ad : 'Henüz öğrenilmedi'}
                  className="shrink-0 text-[10px] font-bold text-ink-faint tabular-nums"
                >
                  {ogrenildi ? `${p!.step}/6` : '—'}
                </span>
              </div>
            );
          })}
          {liste.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-sm text-ink-faint">Eşleşen kelime yok.</p>
            </Card>
          )}
        </div>
      </div>
    </Screen>
  );
}
