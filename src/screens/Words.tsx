import { useMemo, useState } from 'react';
import { Button, Card, Screen } from '../components/ui';
import { TAB_SPACE } from '../components/TabBar';
import { CARDS, deckOf } from '../content';
import { shareHookBoard } from '../share';
import type { Progress } from '../types';

const norm = (s: string) => s.toLocaleLowerCase('tr');

/**
 * Kelimelerim.
 * Kullanici icin gurur tablosu; urun icin paylasilabilir icerik.
 * Kancalar listesi tek basina baskasinin kopyalayamayacagi seydir.
 */
export function Words({ progress }: { progress: Progress[] }) {
  const [q, setQ] = useState('');
  const [sadeceOgrenilen, setSadece] = useState(true);

  const byId = useMemo(() => new Map(progress.map((p) => [p.cardId, p])), [progress]);
  const ogrenilenler = CARDS.filter((c) => byId.get(c.id)?.introduced);

  const liste = useMemo(() => {
    const taban = sadeceOgrenilen ? ogrenilenler : CARDS;
    if (!q.trim()) return taban;
    const s = norm(q.trim());
    return taban.filter(
      (c) => norm(c.en).includes(s) || norm(c.tr).includes(s) || norm(c.hook).includes(s),
    );
  }, [q, sadeceOgrenilen, ogrenilenler]);

  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        <span className="word text-lg font-semibold">Kelimelerim</span>
        <span className="text-sm text-ink-soft tabular-nums">
          {ogrenilenler.length} / {CARDS.length}
        </span>
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kelime, anlam veya kanca ara…"
          className="w-full rounded-full bg-white px-5 py-3.5 text-sm shadow-[var(--shadow-soft)] outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-brand"
        />

        <div className="flex gap-2">
          {[
            { id: true, ad: 'Öğrendiklerim' },
            { id: false, ad: 'Tüm havuz' },
          ].map((f) => (
            <button
              key={String(f.id)}
              onClick={() => setSadece(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
                sadeceOgrenilen === f.id
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink-soft shadow-[var(--shadow-soft)]'
              }`}
            >
              {f.ad}
            </button>
          ))}
        </div>

        {ogrenilenler.length > 0 && sadeceOgrenilen && (
          <Button variant="brand" onClick={() => void shareHookBoard(ogrenilenler)}>
            Kanca panosunu paylaş
          </Button>
        )}

        {liste.length === 0 ? (
          <Card className="rise text-center py-10">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-bold">
              {q ? 'Eşleşen kelime yok' : 'Henüz kelime öğrenmedin'}
            </p>
            <p className="text-sm text-ink-soft mt-1">
              {q ? 'Başka bir şey dene.' : 'Öğren sekmesinden başla.'}
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
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

                  {ogrenildi ? (
                    <span
                      title={`Destek seviyesi L${p!.support}`}
                      className="shrink-0 text-[10px] font-bold text-ink-faint tabular-nums"
                    >
                      L{p!.support}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-bold text-ink-faint tabular-nums">
                      D{deckOf(c.order)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
