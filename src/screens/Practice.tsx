import { useMemo, useRef, useState } from 'react';
import { LearnFace } from '../components/CardFace';
import { Runner } from '../components/Runner';
import { TAB_SPACE } from '../components/TabBar';
import { BackButton, Button, Card, Ikon, Screen, TopBar } from '../components/ui';
import type { IkonAd } from '../icons';
import { CARD_BY_ID, ESKI_GUN } from '../content';
import { ADIM, ADIMLAR, type Gorev } from '../exercise';
import { hardest } from '../quality';
import { logAnswer, logSession } from '../db';
import { todayKey } from '../dates';
import {
  dueQueue,
  latestLessonCards,
  lessonDays,
  previousLessonCards,
  randomOld,
  todaysCards,
} from '../scheduler';
import type { Progress, Step } from '../types';

/**
 * Otomatik kapsamlarda parti boyutu.
 *
 * Havuz buyudukce "hepsini calis" anlamsizlasiyor: 600 kelimeyi tek tusla
 * baslatmak kimsenin istedigi sey degil. Tek istisna elle secim — orada
 * kullanici ne kadar isterse o kadar.
 */
const PARTI = 10;

/**
 * Tam satiri kaplayan birincil kapsam — EN SON dersin kelimeleri.
 *
 * Basligi degisken: bugun yeni kelime geldiyse "Bugün", gelmediyse
 * "Son ders". Sabit "Bugün" olarak durdugunda set bitince kutu sonsuza
 * kadar bos kaliyordu, cunku artik hicbir gun yeni kelime gelmiyor.
 */
const SON_DERS = { id: 'son', ikon: 'bugun' } as const;

/**
 * Her kapsamin kendi rengi var. Renk sistemin bir parcasi:
 * KAPSAM renkli, EGZERSIZ TIPI lacivert — iki eksen birbirine karismasin.
 * Kanca sarisi (spark) burada KULLANILMIYOR; o renk yalnizca kancanin.
 */
const KAPSAMLAR = [
  {
    id: 'onceki',
    ad: 'Önceki ders',
    ikon: 'onceki',
    alt: 'bir önceki dersin kelimeleri',
    secili: 'bg-ink text-white shadow-[var(--shadow-lift)]',
    zemin: 'bg-sunken',
  },
  {
    id: 'bekleyen',
    ad: 'Bekleyen tekrarlar',
    ikon: 'bekleyen',
    alt: `vadesi gelmiş ${PARTI}`,
    secili: 'bg-grow text-white shadow-[0_8px_18px_-8px_rgba(43,196,138,0.85)]',
    zemin: 'bg-grow-soft',
  },
  {
    id: 'zor',
    ad: 'Zorlandıklarım',
    ikon: 'zor',
    alt: `en çok düştüğüm ${PARTI}`,
    secili: 'bg-blush text-white shadow-[0_8px_18px_-8px_rgba(247,154,201,0.95)]',
    zemin: 'bg-blush-soft',
  },
  {
    id: 'eski',
    ad: 'Eski kelimeler',
    ikon: 'eski',
    alt: `${ESKI_GUN}+ günlük, rastgele ${PARTI}`,
    secili: 'bg-brand-deep text-white shadow-[0_8px_18px_-8px_rgba(47,111,208,0.9)]',
    zemin: 'bg-brand-soft',
  },
] as const;

/**
 * Merdivenin uc bolgesi, uc renk — ve bunlar Ilerleme'deki "Neler
 * yapabiliyorsun" cubuklarinin AYNI renkleri: tanima mavi, gecis sari,
 * uretim nane. Iki ekran ayni seyi ayni renkle soyluyor.
 */
const ADIM_RENK: Record<Step, string> = {
  1: 'bg-brand-soft',
  2: 'bg-brand-soft',
  3: 'bg-spark-soft',
  4: 'bg-spark-soft',
  5: 'bg-grow-soft',
  6: 'bg-grow-soft',
};

/** Elle secim otomatik kapsamlarla ayni eksende degil; kendi satirinda. */
const SEC = { id: 'sec', ad: 'Seç', ikon: 'sec', alt: 'kendin işaretle, sınır yok' } as const;

type Kapsam = typeof SON_DERS.id | (typeof KAPSAMLAR)[number]['id'] | typeof SEC.id;

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
  const [kapsam, setKapsam] = useState<Kapsam>('son');
  const [adim, setAdim] = useState<Step | 'kart' | 'karisik' | 'ders'>('karisik');
  /** Ders tekrari iki fazli: once kartlar, sonra alti basamak sirayla. */
  const [dersFazi, setDersFazi] = useState<'kart' | 'gorev'>('kart');
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
   * Kosmayi bitir.
   *
   * Ders tekrari ayri bir eylem oldugu icin bittiginde secimde IZ BIRAKMAZ:
   * `adim` geri aliniyor, yoksa alttaki "Başla" dugmesi kullanicinin hic
   * secmedigi bir tipte duruyor.
   */
  const durdur = () => {
    setCalisiyor(false);
    if (adim === 'ders') setAdim('karisik');
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

  /** Bugun yeni kelime geldi mi — hero kutunun basligini bu belirliyor. */
  const bugunDers = lessonDays(ogrenilenler)[0] === todayKey();

  /**
   * DERS kapsamlari kisitlanmaz: bir ders kac kelimeyse o kadar. Zaman/zorluk
   * kapsamlari `PARTI` ile sinirli, elle secim ise sinirsiz.
   */
  /**
   * BUGUNUN dersi — "Dersi tekrar et" eyleminin kapsami.
   *
   * `latestLessonCards` degil: o, SON dersi veriyor ve gunlerce ders
   * yapilmamissa haftalar oncesini "bugunun dersi" diye sunardi.
   */
  const bugunDersKartlari = useMemo(() => todaysCards(ogrenilenler), [ogrenilenler]);

  const secilenler = useMemo(() => {
    /*
      Ders tekrari kapsam SECIMINE bakmaz. Bir egzersiz tipi degil, kendi
      basina bir eylem: "bugun ogrendiklerini bastan gec". Zorlandiklarimi
      ya da eski kelimeleri "ders gibi" tekrar etmek anlamli bir sey degil —
      ders bir GUNUN paketi.
    */
    if (adim === 'ders') return bugunDersKartlari;

    switch (kapsam) {
      case 'son':
        return latestLessonCards(ogrenilenler);
      case 'onceki':
        return previousLessonCards(ogrenilenler);
      case 'bekleyen':
        return dueQueue(ogrenilenler).slice(0, PARTI);
      case 'zor':
        return hardest(ogrenilenler, PARTI);
      case 'eski':
        return randomOld(ogrenilenler, PARTI);
      case 'sec':
        return ogrenilenler.filter((p) => secilenIdler.has(p.cardId));
    }
  }, [ogrenilenler, kapsam, secilenIdler, adim, bugunDersKartlari]);

  const kartlar = useMemo(
    () =>
      secilenler
        .map((p) => CARD_BY_ID.get(p.cardId))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [secilenler],
  );

  const gorevler = useMemo<Gorev[]>(() => {
    if (adim === 'kart') return [];
    /*
      Ders tekrari dersin ogrenme testiyle AYNI gorev listesini kuruyor:
      her kelime alti basamagin hepsinden bir kez geciyor (bkz. Lesson).
      Merdiveni ve FSRS'i oynatmiyor — Egzersiz'in kurali burada da gecerli.
    */
    if (adim === 'ders') {
      return ADIMLAR.flatMap((step) => kartlar.map((card): Gorev => ({ card, step })));
    }
    return secilenler
      .map((p) => {
        const card = CARD_BY_ID.get(p.cardId);
        return card ? { card, step: adim === 'karisik' ? p.step : adim } : null;
      })
      .filter((g): g is Gorev => g !== null);
  }, [secilenler, kartlar, adim]);

  /** Dugmede KELIME sayisi yazar; ders tekrarinda gorev sayisi bunun alti kati. */
  const partiSayisi = adim === 'kart' || adim === 'ders' ? kartlar.length : gorevler.length;

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
  // Ders tekrarinin BIRINCI fazi da burasi: dersteki gibi once kartlar.
  if (calisiyor && (adim === 'kart' || (adim === 'ders' && dersFazi === 'kart'))) {
    const card = kartlar[kartIndex];
    if (!card) {
      setCalisiyor(false);
      return null;
    }
    return (
      <Screen>
        <TopBar
          left={<BackButton onClick={() => durdur()} />}
          right={
            <span>
              {kartIndex + 1} / {kartlar.length}
            </span>
          }
        />
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
          {adim === 'ders' ? 'Ders tekrarı · kartlar' : 'Kartları gözden geçir'}
        </p>
        <div key={card.id} className="rise flex-1 flex flex-col justify-center py-6">
          <LearnFace card={card} />
        </div>
        <div className="shrink-0">
          <Button
            variant="brand"
            onClick={() => {
              if (kartIndex + 1 < kartlar.length) setKartIndex(kartIndex + 1);
              // Ders tekrarinda kartlar bitince gorevlere gecilir, cikilmaz
              else if (adim === 'ders') setDersFazi('gorev');
              else durdur();
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
        <TopBar left={<BackButton onClick={() => durdur()} />} />
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
          {adim === 'ders' ? 'Ders tekrarı · alıştırma' : 'Egzersiz'}
        </p>
        <Runner
          /*
            Ders tekrarinda gorevler VERILDIGI sirada kosuyor: merdiven
            eslestirmeden dinlemeye tirmaniyor, karistirmak o sirayi bozar.
          */
          sirali={adim === 'ders'}
          gorevler={gorevler}
          sound={sound}
          onResult={(id, ok, ipucu, step) => {
            sayac.current.toplam++;
            if (ok) sayac.current.dogru++;
            void logAnswer({ cardId: id, ok, step, ipucu, kaynak: 'egzersiz' });
          }}
          onDone={() => {
            const { dogru, toplam } = sayac.current;
            void logSession(toplam, dogru, toplam - dogru);
            setOzet({ dogru, toplam });
            sayac.current = { dogru: 0, toplam: 0 };
            durdur();
          }}
        />
      </Screen>
    );
  }

  const sayilar: Record<Kapsam, number> = {
    son: latestLessonCards(ogrenilenler).length,
    onceki: previousLessonCards(ogrenilenler).length,
    bekleyen: Math.min(PARTI, dueQueue(ogrenilenler).length),
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
            <div className="h-2.5 w-full rounded-full bg-sunken overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-grow to-[#5fe0ad] transition-[width] duration-700"
                style={{ width: `${Math.round((ozet.dogru / ozet.toplam) * 100)}%` }}
              />
            </div>
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
            <Ikon ad="ogren" className="h-14 w-14 mx-auto mb-3" />
            <p className="word text-lg font-bold">Henüz kelime yok</p>
            <p className="text-sm text-ink-soft mt-1.5">
              Önce birkaç kelime öğren, sonra burada istediğin kadar çalış.
            </p>
          </Card>
        ) : (
          <>
            {/*
              DERSI TEKRAR ET — kendi basina bir eylem, bir egzersiz tipi
              degil. Onceden "Hangi egzersiz" izgarasinin bir kutusuydu ve
              secili kapsamla birlestiriliyordu; "zorlandiklarimi ders gibi
              tekrar et" anlamli bir sey degil, cunku ders bir GUNUN paketi.
              O yuzden en ustte, kendi bolumunde ve tek dokunusla basliyor:
              kapsam ya da "Başla" secmeye gerek yok.
            */}
            <section className="mb-1">
              <button
                onClick={() => {
                  setAdim('ders');
                  setKartIndex(0);
                  setDersFazi('kart');
                  setCalisiyor(true);
                }}
                disabled={bugunDersKartlari.length === 0}
                className="w-full rounded-card px-5 py-4 text-left transition-all active:scale-[0.98] bg-ink text-white shadow-[var(--shadow-lift)] disabled:bg-white disabled:text-ink disabled:shadow-[var(--shadow-soft)] disabled:active:scale-100"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                      bugunDersKartlari.length > 0 ? 'bg-white/15' : 'bg-sunken'
                    }`}
                  >
                    <Ikon ad="ders" ters={bugunDersKartlari.length > 0} className="h-7 w-7" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="word block text-lg font-extrabold leading-tight">
                      Dersi tekrar et
                    </span>
                    <span
                      className={`block text-xs mt-1 ${
                        bugunDersKartlari.length > 0 ? 'text-white/70' : 'text-ink-faint'
                      }`}
                    >
                      {bugunDersKartlari.length > 0
                        ? `bugünün ${bugunDersKartlari.length} kelimesi · kartlar + 6 basamak`
                        : 'bugün henüz ders yapmadın'}
                    </span>
                  </span>
                  {bugunDersKartlari.length > 0 && (
                    <span className="text-xl text-white/50 shrink-0">›</span>
                  )}
                </div>
              </button>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-ink-soft mb-2">Hangi kelimeler</h2>

              {/* En son ders tam satir: gunluk dersin pekistirmesi en sik istenen sey */}
              <button
                onClick={() => setKapsam('son')}
                disabled={sayilar.son === 0}
                className={`w-full mb-2 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100 ${
                  kapsam === 'son'
                    ? 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(79,146,246,0.85)]'
                    : 'bg-white text-ink shadow-[var(--shadow-soft)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      kapsam === 'son' ? 'bg-white/20' : 'bg-brand-soft'
                    }`}
                  >
                    <Ikon ad={SON_DERS.ikon} ters={kapsam === 'son'} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      {bugunDers ? 'Bugün' : 'Son ders'}
                    </span>
                    <span
                      className={`block text-[11px] mt-0.5 ${kapsam === 'son' ? 'text-white/75' : 'text-ink-faint'}`}
                    >
                      {bugunDers ? 'bugün öğrendiklerim' : 'en son dersin kelimeleri'}
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums shrink-0">{sayilar.son}</span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {KAPSAMLAR.map((k) => {
                  const secili = kapsam === k.id;
                  const bos = sayilar[k.id] === 0;
                  return (
                    <button
                      key={k.id}
                      onClick={() => setKapsam(k.id)}
                      /* Bos kapsam basilabiliyordu ve hicbir sey olmuyordu */
                      disabled={bos}
                      className={`rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100 ${
                        secili ? k.secili : 'bg-white text-ink shadow-[var(--shadow-soft)]'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-lg ${
                            secili ? 'bg-white/20' : k.zemin
                          }`}
                        >
                          <Ikon ad={k.ikon} ters={secili} className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-bold tabular-nums">{sayilar[k.id]}</span>
                      </span>
                      <span className="block text-sm font-bold leading-tight mt-1.5">{k.ad}</span>
                      <span
                        className={`block text-[11px] mt-0.5 ${secili ? 'text-white/75' : 'text-ink-faint'}`}
                      >
                        {k.alt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Elle secim kendi satirinda: otomatik kapsamlarla ayni eksende degil */}
              <button
                onClick={() => {
                  setKapsam('sec');
                  setSecimEkrani(true);
                }}
                className={`w-full mt-2 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98] ${
                  kapsam === 'sec'
                    ? 'bg-ink text-white shadow-[var(--shadow-lift)]'
                    : 'bg-white text-ink shadow-[var(--shadow-soft)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      kapsam === 'sec' ? 'bg-white/20' : 'bg-sunken'
                    }`}
                  >
                    <Ikon ad={SEC.ikon} ters={kapsam === 'sec'} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{SEC.ad}</span>
                    <span
                      className={`block text-[11px] mt-0.5 ${kapsam === 'sec' ? 'text-white/75' : 'text-ink-faint'}`}
                    >
                      {kapsam === 'sec' && secilenIdler.size > 0
                        ? `${secilenIdler.size} kelime seçili · değiştir`
                        : SEC.alt}
                    </span>
                  </span>
                </div>
              </button>
            </section>

            <section className="mt-1">
              <h2 className="text-sm font-semibold text-ink-soft mb-2">Hangi egzersiz</h2>

              <div className="grid grid-cols-2 gap-2">
                <EgzersizKare
                  ikon="karisik"
                  ad="Karışık"
                  alt="her kelime kendi basamağında"
                  zemin="bg-sunken"
                  secili={adim === 'karisik'}
                  onClick={() => setAdim('karisik')}
                />
                <EgzersizKare
                  ikon="kartlar"
                  ad="Kartlar"
                  alt="görsel + kanca + cümle"
                  zemin="bg-sunken"
                  secili={adim === 'kart'}
                  onClick={() => {
                    setAdim('kart');
                    setKartIndex(0);
                  }}
                />
                {ADIMLAR.map((n) => (
                  <EgzersizKare
                    key={n}
                    ikon={ADIM[n].ikon}
                    ad={ADIM[n].ad}
                    alt={ADIM[n].alt}
                    zemin={ADIM_RENK[n]}
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
                setDersFazi('kart');
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
  ikon,
  ad,
  alt,
  zemin,
  secili,
  onClick,
}: {
  ikon: IkonAd;
  ad: string;
  alt: string;
  /** Ikon kutusunun rengi — merdiven bolgesini soyler, bkz. ADIM_RENK */
  zemin: string;
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
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl mb-1.5 ${
          secili ? 'bg-white/15' : zemin
        }`}
      >
        <Ikon ad={ikon} ters={secili} className="h-5 w-5" />
      </span>
      <span className="block text-sm font-bold leading-tight">{ad}</span>
      <span className={`block text-[11px] mt-0.5 ${secili ? 'text-white/70' : 'text-ink-faint'}`}>
        {alt}
      </span>
    </button>
  );
}
