import { Button, Card, Screen, Streak } from '../components/ui';
import { SetFinale } from '../components/SetFinale';
import { TAB_SPACE } from '../components/TabBar';
import { CARD_BY_ID, CARDS, ogrenilenKancalar, setBittiMi } from '../content';
import { relativeDue } from '../dates';
import type { AppState, Card as CardType, Progress } from '../types';

type Props = {
  progress: Progress[];
  state: AppState;
  /** Vadesi gelmis TUM kartlar — ham sayi ekranda ASLA gosterilmez */
  due: Progress[];
  newCards: CardType[];
  /** Bugun tanisilan kelime sayisi */
  todayCount: number;
  /** Bugun kac yeni kelime hakki kaldi */
  remaining: number;
  /** Gunluk hedef dolduysa tekrarlanacak, o gunun kartlari */
  todaysCount: number;
  aheadCount: number;
  onStart: () => void;
  onQuickReview: () => void;
  onPractice: () => void;
};

/**
 * ANA EKRAN — tek karar.
 *
 * Onceki surumde uc kart vardi (Tanis / Tekrarla / Deste testi) ve altinda
 * 20 numarali deste karesi; kullanici her acilista "hangisine basayim"
 * diye dusunuyordu. Artik tek dugme var ve ekranin ortasinda duruyor.
 *
 * "X / 100 kelime" cubugu kaldirildi: havuz buyudukce payda degisecek ve
 * yuzde bir sey ifade etmiyor. Yerine BUGUNUN hedefi gosteriliyor —
 * kullanicinin gercekten etkileyebildigi sayi bu.
 */
export function Home({
  progress,
  state,
  due,
  newCards,
  todayCount,
  remaining,
  todaysCount,
  aheadCount,
  onStart,
  onQuickReview,
  onPractice,
}: Props) {
  const ogrenilen = progress.filter((p) => p.introduced).length;
  const tekrar = due.length;
  const limitDoldu = remaining === 0;
  const bosGun = tekrar === 0 && newCards.length === 0;
  const setBitti = setBittiMi(progress);

  const siradaki = progress
    .filter((p) => p.introduced)
    .map((p) => p.due)
    .sort((a, b) => a.getTime() - b.getTime())
    .find((d) => d.getTime() > Date.now());

  const sonKancalar = progress
    .filter((p) => p.introduced && p.introducedAt)
    .sort((a, b) => (a.introducedAt! < b.introducedAt! ? 1 : -1))
    .slice(0, 6)
    .map((p) => CARD_BY_ID.get(p.cardId))
    .filter((c): c is CardType => Boolean(c));

  const gunlukPct = Math.min(100, Math.round((todayCount / state.dailyLimit) * 100));

  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        {/*
          Logo burada degil, acilis ekraninda (bkz. Splash).
          Yatay kilit bu boyutta okunmuyordu; uygulamanin icindeyken de
          hangi uygulamada oldugunu kimse merak etmiyor. Isim METIN olarak
          duruyor: her boyutta net, uygulamanin yazi karakterinde.
        */}
        <span className="word text-base font-extrabold text-ink-soft">Hafızada İngilizce</span>
        {state.streakCount > 0 && <Streak count={state.streakCount} />}
      </header>

      {/* Kahraman blok dikey ORTADA — ekran bos gorunmesin, karar tek olsun */}
      <div className={`flex-1 flex flex-col justify-center gap-4 ${TAB_SPACE}`}>
        {/*
          Set bitince gunluk hedef cubugu YALAN soyluyor: yeni kelime
          kalmadigi icin "0 / 10" her gun boyle kalacak ve kullanici
          yapmadigi bir sey icin eksik gorunecek. Yerine setin kendisi.
        */}
        <section>
          <div className="flex items-baseline justify-between mb-2 px-1">
            <span className="text-sm font-semibold text-ink-soft">
              {setBitti ? 'Set tamamlandı' : 'Bugünün hedefi'}
            </span>
            <span className="text-sm text-ink-faint tabular-nums">
              {setBitti
                ? `${CARDS.length} / ${CARDS.length} kelime`
                : `${todayCount} / ${state.dailyLimit} kelime`}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/70 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                limitDoldu || setBitti ? 'bg-grow' : 'bg-gradient-to-r from-brand to-[#7db2ff]'
              }`}
              style={{ width: `${setBitti ? 100 : gunlukPct}%` }}
            />
          </div>
        </section>

        {limitDoldu ? (
          /*
            Gunluk hedef doldu: gun boyunca ekran BU kalir.
            Once `bosGun` once kontrol ediliyordu; hizli tekrar bitince
            vadesi gelen kart kalmadigi icin ekran "Bugunluk tamam ·
            Siradaki tekrar 1 dakika sonra"ya duserdi. Oysa hedef dolmus
            bir gunde soylenecek tek sey var: istedigin kadar pekistir.
          */
          <div className="rise rounded-card p-6 bg-gradient-to-br from-grow to-[#5fe0ad] text-white shadow-[0_16px_34px_-16px_rgba(43,196,138,0.95)]">
            <p className="text-sm font-medium text-white/85">Günlük hedef tamam ✓</p>
            <p className="word text-3xl font-extrabold mt-0.5 mb-1">Hızlı tekrar</p>
            <p className="text-sm text-white/80 mb-4">
              {todaysCount > 0
                ? `Bugünün ${todaysCount} kelimesini istediğin kadar çalış.`
                : 'Bekleyen tekrarlarını çalışabilirsin.'}
            </p>
            <Button variant="soft" onClick={todaysCount > 0 ? onQuickReview : onStart}>
              Hızlı tekrar
            </Button>
          </div>
        ) : bosGun && setBitti ? (
          /*
            Havuzun sonu: "Bugunluk tamam 🌿" burada YETMEZ. Kullanici
            setin sonuna geldi ve bunu bir daha hic gormeyecek — bkz.
            SetFinale. "Yine de tekrar et" kapisi altta acik kaliyor.
          */
          <div className="flex flex-col gap-3">
            <SetFinale kancalar={ogrenilenKancalar(progress)} variant="kart" />
            {aheadCount > 0 && (
              <Button variant="soft" onClick={onPractice}>
                Yine de tekrar et
              </Button>
            )}
          </div>
        ) : bosGun ? (
          <Card className="rise text-center py-10">
            <div className="text-5xl mb-3">🌿</div>
            <p className="word text-2xl font-extrabold">Bugünlük tamam</p>
            <p className="text-ink-soft mt-2 text-sm">
              {siradaki ? `Sıradaki tekrar ${relativeDue(siradaki)}.` : 'Yarın görüşürüz.'}
            </p>
            {aheadCount > 0 && (
              <div className="mt-5">
                <Button variant="soft" onClick={onPractice}>
                  Yine de tekrar et
                </Button>
                <p className="text-xs text-ink-faint mt-2">
                  Sırada bekleyen {aheadCount} kartı öne alır.
                </p>
              </div>
            )}
          </Card>
        ) : (
          <div className="rise rounded-card p-6 bg-gradient-to-br from-brand to-[#7db2ff] text-white shadow-[0_16px_34px_-16px_rgba(79,146,246,0.95)]">
            <p className="text-sm font-medium text-white/80">Bugünün dersi</p>
            <p className="word text-3xl font-extrabold mt-0.5 mb-1">
              {[newCards.length > 0 && `${newCards.length} yeni`, tekrar > 0 && `${tekrar} tekrar`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="text-sm text-white/75 mb-4">
              {newCards.length > 0
                ? 'Önce kelimeler, sonra öğrenme testi.'
                : 'Bugün gelen kelimeler seni bekliyor.'}
            </p>
            <Button variant="soft" onClick={onStart}>
              Başla
            </Button>
          </div>
        )}

        {sonKancalar.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-ink-soft">Son tanıştıkların</h2>
              <span className="text-sm text-ink-faint tabular-nums">{ogrenilen} kelime</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sonKancalar.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-white px-3 py-1.5 text-sm shadow-[var(--shadow-soft)]"
                >
                  <span className="word font-semibold">{c.en}</span>
                  <span className="text-ink-faint"> ≈ </span>
                  <span className="font-semibold text-ink bg-spark/55 rounded px-1">{c.hook}</span>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </Screen>
  );
}
