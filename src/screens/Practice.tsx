import { useMemo, useRef, useState } from 'react';
import { LearnFace } from '../components/CardFace';
import { Runner } from '../components/Runner';
import { TAB_SPACE } from '../components/TabBar';
import { BackButton, Button, Card, Screen, TopBar } from '../components/ui';
import { CARD_BY_ID, ESKI_GUN } from '../content';
import { ADIM, ADIMLAR, type Gorev } from '../exercise';
import { hardest } from '../quality';
import { logSession } from '../db';
import { randomOld, todaysCards, yesterdaysCards } from '../scheduler';
import type { Progress, Step } from '../types';

/**
 * Otomatik kapsamlarda parti boyutu.
 *
 * Havuz buyudukce "hepsini calis" anlamsizlasiyor: 600 kelimeyi tek tusla
 * baslatmak kimsenin istedigi sey degil. Tek istisna elle secim — orada
 * kullanici ne kadar isterse o kadar.
 */
const PARTI = 10;

/** Tam satiri kaplayan birincil kapsam — gunun kelimeleri. */
const BUGUN = { id: 'bugun', ad: 'Bugün', emoji: '☀️', alt: 'bugün öğrendiklerim' } as const;

const KAPSAMLAR = [
  { id: 'dun', ad: 'Dün', emoji: '🌙', alt: 'dün öğrendiklerim' },
  { id: 'zor', ad: 'Zorlandıklarım', emoji: '🩹', alt: `en çok düştüğüm ${PARTI}` },
  { id: 'eski', ad: 'Eski kelimeler', emoji: '🕰️', alt: `${ESKI_GUN}+ günlük, rastgele ${PARTI}` },
  { id: 'sec', ad: 'Seç', emoji: '✋', alt: 'kendin işaretle, sınır yok' },
] as const;

type Kapsam = typeof BUGUN.id | (typeof KAPSAMLAR)[number]['id'];

const norm = (s: string) => s.toLocaleLowerCase('tr');

export function Practice({
  progress,
  sound,
  onRunning,
}: {
  progress: Progress[];
  sound: boolean;
  /** Egzersiz kosarken alt menu gizlenir — tam ekran odak. */
  onRunning: (calisiyor: boolean) => void;
}) {
  const [kapsam, setKapsam] = useState<Kapsam>('bugun');
  const [adim, setAdim] = useState<Step | 'kart' | 'karisik'>('karisik');
  const [calisiyor, setCalisiyorState] = useState(false);
  const [kartIndex, setKartIndex] = useState(0);
  const [secimEkrani, setSecimEkraniState] = useState(false);
  const [secilenIdler, setSecilenIdler] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [ozet, setOzet] = useState<{ dogru: number; toplam: number } | null>(null);

  /**
   * Egzersizin kendi sayaclari.
   *
   * Buradaki cevaplar merdiveni ve FSRS'i oynatmaz — o kural duruyor — ama
   * "cevaplarimin kaci dogru" sorusunun cevabi burada da gercek, o yuzden
   * gunluk basari kaydina girer.
   */
  const sayac = useRef({ dogru: 0, toplam: 0 });

  const setCalisiyor = (v: boolean) => {
    setCalisiyorState(v);
    onRunning(v);
  };

  /**
   * Secim ekraninda da alt menu gizlenir.
   * Hem tam ekran odak, hem de alttaki "Tamam" dugmesi menunun arkasinda
   * kalmasin diye — liste uzun oldugu icin dugme ekranin dibinde duruyor.
   */
  const setSecimEkrani = (v: boolean) => {
    setSecimEkraniState(v);
    onRunning(v);
  };

  const ogrenilenler = useMemo(() => progress.filter((p) => p.introduced), [progress]);

  /**
   * Bugun KISITLANMAZ: gun kac kelimeyse o kadar. Digerleri `PARTI` ile
   * sinirli, elle secim ise sinirsiz.
   */
  const secilenler = useMemo(() => {
    switch (kapsam) {
      case 'bugun':
        return todaysCards(ogrenilenler);
      case 'dun':
        return yesterdaysCards(ogrenilenler).slice(0, PARTI);
      case 'zor':
        return hardest(ogrenilenler, PARTI);
      case 'eski':
        return randomOld(ogrenilenler, PARTI);
      case 'sec':
        return ogrenilenler.filter((p) => secilenIdler.has(p.cardId));
    }
  }, [ogrenilenler, kapsam, secilenIdler]);

  const kartlar = useMemo(
    () =>
      secilenler
        .map((p) => CARD_BY_ID.get(p.cardId))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [secilenler],
  );

  const gorevler = useMemo<Gorev[]>(
    () =>
      secilenler
        .map((p) => {
          const card = CARD_BY_ID.get(p.cardId);
          return card && adim !== 'kart'
            ? { card, step: adim === 'karisik' ? p.step : adim }
            : null;
        })
        .filter((g): g is Gorev => g !== null),
    [secilenler, adim],
  );

  const partiSayisi = adim === 'kart' ? kartlar.length : gorevler.length;

  // --- Elle secim ekrani ---
  if (secimEkrani) {
    const liste = q.trim()
      ? ogrenilenler.filter((p) => {
          const c = CARD_BY_ID.get(p.cardId);
          if (!c) return false;
          const s = norm(q.trim());
          return norm(c.en).includes(s) || norm(c.tr).includes(s) || norm(c.hook).includes(s);
        })
      : ogrenilenler;

    return (
      <Screen>
        <TopBar
          left={<BackButton onClick={() => setSecimEkrani(false)} />}
          right={<span className="tabular-nums">{secilenIdler.size} seçili</span>}
        />
        <p className="word text-lg font-bold shrink-0 mb-3">Kelime seç</p>

        <div className="flex-1 flex flex-col gap-3 pb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kelime, anlam veya kanca ara…"
            className="w-full rounded-full bg-white px-5 py-3.5 text-sm shadow-[var(--shadow-soft)] outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-brand shrink-0"
          />

          <div className="flex gap-2 shrink-0">
            <Kucuk onClick={() => setSecilenIdler(new Set(liste.map((p) => p.cardId)))}>
              Görünenleri seç
            </Kucuk>
            <Kucuk onClick={() => setSecilenIdler(new Set())}>Temizle</Kucuk>
          </div>

          <div className="flex flex-col gap-1.5">
            {liste.map((p) => {
              const c = CARD_BY_ID.get(p.cardId);
              if (!c) return null;
              const secili = secilenIdler.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    const y = new Set(secilenIdler);
                    if (secili) y.delete(c.id);
                    else y.add(c.id);
                    setSecilenIdler(y);
                  }}
                  className={`rounded-2xl px-4 py-3 flex items-center gap-3 text-left transition-all active:scale-[0.98] ${
                    secili ? 'bg-brand text-white' : 'bg-white text-ink shadow-[var(--shadow-soft)]'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      secili ? 'bg-white text-brand' : 'bg-sunken text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className="word font-semibold">{c.en}</span>
                      <span className={secili ? 'text-white/60' : 'text-ink-faint'}>≈</span>
                      <span
                        className={`text-sm font-semibold rounded px-1 ${
                          secili ? 'bg-white/25' : 'bg-spark/55 text-ink'
                        }`}
                      >
                        {c.hook}
                      </span>
                    </span>
                    <span
                      className={`block text-sm mt-0.5 truncate ${secili ? 'text-white/75' : 'text-ink-soft'}`}
                    >
                      {c.tr}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {secilenIdler.size > 0 && (
          <div className="fixed inset-x-0 bottom-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-md">
              <Button variant="brand" onClick={() => setSecimEkrani(false)}>
                {secilenIdler.size} kelime seçildi · Tamam
              </Button>
            </div>
          </div>
        )}
      </Screen>
    );
  }

  // --- Kart gozden gecirme: soru yok, kartin kendisi ---
  if (calisiyor && adim === 'kart') {
    const card = kartlar[kartIndex];
    if (!card) {
      setCalisiyor(false);
      return null;
    }
    return (
      <Screen>
        <TopBar
          left={<BackButton onClick={() => setCalisiyor(false)} />}
          right={
            <span>
              {kartIndex + 1} / {kartlar.length}
            </span>
          }
        />
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
          Kartları gözden geçir
        </p>
        <div key={card.id} className="rise flex-1 flex flex-col justify-center py-6">
          <LearnFace card={card} />
        </div>
        <div className="shrink-0">
          <Button
            variant="brand"
            onClick={() => {
              if (kartIndex + 1 >= kartlar.length) setCalisiyor(false);
              else setKartIndex(kartIndex + 1);
            }}
          >
            Devam
          </Button>
        </div>
      </Screen>
    );
  }

  if (calisiyor && gorevler.length > 0) {
    return (
      <Screen>
        <TopBar left={<BackButton onClick={() => setCalisiyor(false)} />} />
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
          Egzersiz
        </p>
        <Runner
          gorevler={gorevler}
          sound={sound}
          onResult={(_id, ok) => {
            sayac.current.toplam++;
            if (ok) sayac.current.dogru++;
          }}
          onDone={() => {
            const { dogru, toplam } = sayac.current;
            void logSession(toplam, dogru, toplam - dogru);
            setOzet({ dogru, toplam });
            sayac.current = { dogru: 0, toplam: 0 };
            setCalisiyor(false);
          }}
        />
      </Screen>
    );
  }

  const sayilar: Record<Kapsam, number> = {
    bugun: todaysCards(ogrenilenler).length,
    dun: yesterdaysCards(ogrenilenler).length,
    zor: hardest(ogrenilenler, PARTI).length,
    eski: randomOld(ogrenilenler, PARTI).length,
    sec: secilenIdler.size,
  };

  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        <span className="word text-lg font-bold">Egzersiz</span>
        <span className="text-sm text-ink-soft tabular-nums">{ogrenilenler.length} kelime</span>
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        {/*
          Biten egzersizin ozeti. Yalnizca YUZDE var: buradaki cevaplar
          merdiveni oynatmadigi icin "ilerledi" satiri yaniltici olurdu.
        */}
        {ozet && ozet.toplam > 0 && (
          <Card className="rise text-center">
            <p className="text-sm text-ink-soft">Egzersiz bitti</p>
            <p className="word text-4xl font-extrabold tabular-nums leading-none mt-1">
              %{Math.round((ozet.dogru / ozet.toplam) * 100)}
            </p>
            <p className="text-sm text-ink-soft mt-1.5">
              {ozet.dogru} doğru · {ozet.toplam - ozet.dogru} yanlış
            </p>
            <button
              onClick={() => setOzet(null)}
              className="mt-3 rounded-full bg-sunken px-4 py-2 text-sm font-bold text-ink transition-all active:scale-95"
            >
              Kapat
            </button>
          </Card>
        )}

        {ogrenilenler.length === 0 ? (
          <Card className="rise text-center py-10">
            <p className="text-4xl mb-3">🌱</p>
            <p className="word text-lg font-bold">Henüz kelime yok</p>
            <p className="text-sm text-ink-soft mt-1.5">
              Önce birkaç kelime öğren, sonra burada istediğin kadar çalış.
            </p>
          </Card>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-semibold text-ink-soft mb-2">Hangi kelimeler</h2>

              {/* Bugun tam satir: gunluk dersin pekistirmesi en sik istenen sey */}
              <button
                onClick={() => setKapsam('bugun')}
                className={`w-full mb-2 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.98] ${
                  kapsam === 'bugun'
                    ? 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(79,146,246,0.85)]'
                    : 'bg-white text-ink shadow-[var(--shadow-soft)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{BUGUN.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{BUGUN.ad}</span>
                    <span
                      className={`block text-[11px] mt-0.5 ${kapsam === 'bugun' ? 'text-white/75' : 'text-ink-faint'}`}
                    >
                      {BUGUN.alt}
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums shrink-0">{sayilar.bugun}</span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {KAPSAMLAR.map((k) => {
                  const secili = kapsam === k.id;
                  return (
                    <button
                      key={k.id}
                      onClick={() => {
                        setKapsam(k.id);
                        if (k.id === 'sec') setSecimEkrani(true);
                      }}
                      className={`rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.97] ${
                        secili
                          ? 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(79,146,246,0.85)]'
                          : 'bg-white text-ink shadow-[var(--shadow-soft)]'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-lg leading-none">{k.emoji}</span>
                        <span className="text-sm font-bold tabular-nums">{sayilar[k.id]}</span>
                      </span>
                      <span className="block text-sm font-bold leading-tight mt-1">{k.ad}</span>
                      <span
                        className={`block text-[11px] mt-0.5 ${secili ? 'text-white/75' : 'text-ink-faint'}`}
                      >
                        {k.alt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {kapsam === 'sec' && (
                <button
                  onClick={() => setSecimEkrani(true)}
                  className="w-full mt-2 rounded-full bg-sunken px-4 py-2.5 text-sm font-bold text-ink transition-all active:scale-95"
                >
                  {secilenIdler.size > 0 ? 'Seçimi değiştir' : 'Kelime seç'}
                </button>
              )}
            </section>

            <section className="mt-1">
              <h2 className="text-sm font-semibold text-ink-soft mb-2">Hangi egzersiz</h2>
              <div className="grid grid-cols-2 gap-2">
                <EgzersizKare
                  emoji="🎲"
                  ad="Karışık"
                  alt="her kelime kendi basamağında"
                  secili={adim === 'karisik'}
                  onClick={() => setAdim('karisik')}
                />
                <EgzersizKare
                  emoji="🃏"
                  ad="Kartlar"
                  alt="görsel + kanca + cümle"
                  secili={adim === 'kart'}
                  onClick={() => {
                    setAdim('kart');
                    setKartIndex(0);
                  }}
                />
                {ADIMLAR.map((n) => (
                  <EgzersizKare
                    key={n}
                    emoji={ADIM[n].emoji}
                    ad={ADIM[n].ad}
                    alt={ADIM[n].alt}
                    secili={adim === n}
                    onClick={() => setAdim(n)}
                  />
                ))}
              </div>
            </section>

            <Button
              variant="brand"
              disabled={partiSayisi === 0}
              onClick={() => {
                setKartIndex(0);
                setCalisiyor(true);
              }}
            >
              {partiSayisi > 0
                ? `Başla (${partiSayisi} kelime)`
                : kapsam === 'sec'
                  ? 'Önce kelime seç'
                  : 'Bu seçimde kelime yok'}
            </Button>
          </>
        )}
      </div>
    </Screen>
  );
}

function Kucuk({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-sunken px-3.5 py-2 text-sm font-bold text-ink transition-all active:scale-95"
    >
      {children}
    </button>
  );
}

function EgzersizKare({
  emoji,
  ad,
  alt,
  secili,
  onClick,
}: {
  emoji: string;
  ad: string;
  alt: string;
  secili: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-3.5 py-4 text-left transition-all active:scale-[0.97] ${
        secili
          ? 'bg-ink text-white shadow-[var(--shadow-lift)]'
          : 'bg-white text-ink shadow-[var(--shadow-soft)]'
      }`}
    >
      <span className="block text-2xl leading-none mb-1.5">{emoji}</span>
      <span className="block text-sm font-bold leading-tight">{ad}</span>
      <span className={`block text-[11px] mt-0.5 ${secili ? 'text-white/70' : 'text-ink-faint'}`}>
        {alt}
      </span>
    </button>
  );
}
