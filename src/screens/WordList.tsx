import { useMemo, useState } from 'react';
import { BackButton, Card, Ikon, Screen, SpeakButton, TopBar } from '../components/ui';
import { CARDS, CARD_BY_ID } from '../content';
import { ADIM } from '../exercise';
import { bilinenGeriAl } from '../db';
import { shareHookBoard } from '../share';
import { Button } from '../components/ui';
import type { Progress } from '../types';

/**
 * Uc bolum, daha fazlasi degil.
 *
 * Bir sure merdiven bolgeleri de sekme olarak duruyordu — "Tanıma (1–2)",
 * "Geçiş (3–4)", "Üretim (5–6)". Ikisi birden sorun: basamak numarasi
 * kullaniciya HIC ogretilmiyor (jargon), ve ayni bilgiyi Ilerleme'deki
 * "Neler yapabildin" cubuklari zaten anlatiyor. Uc sekme kalkti.
 */
const FILTRELER = [
  { id: 'ogrenilen', ad: 'Öğrendiklerim' },
  { id: 'havuz', ad: 'Tüm set' },
  { id: 'bilinen', ad: 'Bildiklerim' },
] as const;
type Filtre = (typeof FILTRELER)[number]['id'];

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
    const secici = filtre === 'bilinen' ? (p: Progress) => p.bilinen : (p: Progress) => p.introduced;
    return progress
      .filter(secici)
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
        <div className="relative shrink-0">
          {/* Buyutec kutunun ICINDE: "burasi arama" demenin en kisa yolu */}
          <Ikon ad="ara" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kelime, anlam veya kanca ara…"
            className="w-full rounded-full bg-white pl-11 pr-5 py-3.5 text-sm shadow-[var(--shadow-soft)] outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-brand"
          />
        </div>

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

        {filtre === 'bilinen' && (
          <p className="text-sm text-ink-soft px-1">
            Derste “bunu biliyorum” dediğin kelimeler. Hiçbir sayıya girmiyorlar;
            istersen sisteme geri alabilirsin.
          </p>
        )}

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

                {/*
                  Geri alinca KAYIT SILINIYOR: kelime yeni kelime havuzuna
                  kendi siklik sirasindaki yerine doner ve ileride normal bir
                  yeni kelime olarak gelir (bkz. db.ts `bilinenGeriAl`).
                */}
                {p?.bilinen && (
                  <button
                    onClick={() => void bilinenGeriAl(c.id)}
                    className="shrink-0 rounded-full bg-sunken px-3 py-1.5 text-xs font-bold text-ink transition-all active:scale-95"
                  >
                    Geri ekle
                  </button>
                )}
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
