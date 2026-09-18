import { Button, Screen, Streak } from '../components/ui';

/**
 * Ders bitisi.
 *
 * Iki sayi gosterir ve ikincisi daha onemli:
 *   yuzde     — bu seans nasil gecti
 *   ilerleyen — bu seans ne KAZANDIRDI
 *
 * Dogru cevap vermek ilerlemek demek degil: merdivende yukari cikmak icin
 * YARDIMSIZ dogru gerekiyor (bkz. scheduler.ts). Kanca ipucuna basip dogru
 * bilen kullanici %100 alir ama hicbir kelime ilerlemez — bunu gormesi
 * lazim, yoksa yuzde yaniltir.
 */
export function SessionDone({
  count,
  streak,
  dogru,
  toplam,
  ilerleyen,
  onHome,
}: {
  count: number;
  streak: number;
  dogru: number;
  toplam: number;
  /** Bu seansta bir basamak yukari cikan kelime sayisi */
  ilerleyen: number;
  onHome: () => void;
}) {
  const yuzde = toplam > 0 ? Math.round((dogru / toplam) * 100) : null;

  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center items-center gap-5 text-center">
        <div className="pop text-6xl">🌿</div>

        <div className="rise delay-1">
          <h1 className="word text-3xl font-bold">Ders bitti</h1>
          <p className="text-ink-soft mt-2">{count} kelime çalıştın.</p>
        </div>

        {yuzde !== null && (
          <div className="rise delay-2 w-full max-w-[16rem]">
            <p className="word text-5xl font-extrabold tabular-nums leading-none">%{yuzde}</p>
            <p className="text-sm text-ink-soft mt-2">
              {dogru} doğru · {toplam - dogru} yanlış
            </p>
            <div className="h-2.5 w-full rounded-full bg-white/70 overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-[#7db2ff] transition-[width] duration-700"
                style={{ width: `${yuzde}%` }}
              />
            </div>
          </div>
        )}

        {/*
          Sifirsa hic gosterilmiyor: yeni kelimelerden olusan bir derste
          ogrenme testi merdiveni oynatmaz, "0 kelime ilerledi" yazmak
          dogru ama yaniltici olurdu.
        */}
        {ilerleyen > 0 && (
          <p className="rise delay-3 text-sm font-bold text-[#128a5f] bg-grow-soft rounded-full px-4 py-2">
            {ilerleyen} kelime bir basamak ilerledi
          </p>
        )}

        {streak > 0 && (
          <div className="rise delay-3">
            <Streak count={streak} />
            <p className="text-sm text-ink-faint mt-2">
              {streak === 1 ? 'İlk günün' : `${streak} gündür aralıksız`}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 rise delay-3">
        <Button onClick={onHome}>Ana ekran</Button>
      </div>
    </Screen>
  );
}
