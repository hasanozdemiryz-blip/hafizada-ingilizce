import { Avatar } from '../components/Avatar';
import { Button, Card, Ikon, Screen, Streak } from '../components/ui';
import { SetFinale } from '../components/SetFinale';
import { TAB_SPACE } from '../components/TabBar';
import { CARD_BY_ID, CARDS, ogrenilenKancalar, setBittiMi } from '../content';
import { relativeDue } from '../dates';
import type { AppState, Card as CardType, Progress } from '../types';

type Props = {
  progress: Progress[];
  state: AppState;
  /** Bugunun anahtari — gun donunce ekran da doner (bkz. today.ts) */
  bugun: string;
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
  /** Tekrar yuku bunu gecince "Önce tekrar et" satiri gorunur */
  agirTekrar: number;
  onStart: () => void;
  onReviewFirst: () => void;
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
  bugun,
  due,
  newCards,
  todayCount,
  remaining,
  todaysCount,
  aheadCount,
  agirTekrar,
  onStart,
  onReviewFirst,
  onQuickReview,
  onPractice,
}: Props) {
  const ogrenilen = progress.filter((p) => p.introduced).length;
  const tekrar = due.length;
  const limitDoldu = remaining === 0;
  const bosGun = tekrar === 0 && newCards.length === 0;
  const setBitti = setBittiMi(progress);

  /*
    Kahraman kartin uc yuzu var ve ayrimi BURADA yapiliyor:

      ilkDers  — havuz bos, kullanici karsilamadan yeni geldi
      yeniGun  — bugun henuz hic calisilmadi; gunun ACILDIGI an
      normal   — gun icinde ikinci, ucuncu giris

    `yeniGun` ozellikle bir AN, surekli bir etiket degil: ilk ders
    bitince `lastSessionDate` bugune donuyor ve kart normale geciyor.
    Boylece "yeni gun" sozu gun icinde tekrarlanip anlamini yitirmiyor.
  */
  const ilkDers = ogrenilen === 0;
  const yeniGun = !ilkDers && state.lastSessionDate !== bugun;

  /** Gunun paketi: tek satirda ne bekliyor. */
  const paket = [newCards.length > 0 && `${newCards.length} yeni`, tekrar > 0 && `${tekrar} tekrar`]
    .filter(Boolean)
    .join(' · ');

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
      <header className="flex items-center justify-between h-[4.25rem] shrink-0">
        {/*
          Logo burada degil, acilis ekraninda (bkz. Splash). Yatay kilit bu
          boyutta okunmuyordu ve uygulamanin icindeyken hangi uygulamada
          oldugunu kimse merak etmiyor — o yuzden bu yuva uygulamanin adina
          degil KULLANICIYA ayrildi. Profil yoksa (eski kurulum, ilk
          milisaniyeler) uygulama adina duser.
        */}
        {state.profil ? (
          <span className="flex items-center gap-3 min-w-0">
            <Avatar avatar={state.profil.avatar} cerceve={state.profil.cerceve} boyut="sm" />
            <span className="word text-lg font-extrabold text-ink truncate">
              {state.profil.ad}
            </span>
          </span>
        ) : (
          <span className="word text-base font-extrabold text-ink-soft">Hafızada İngilizce</span>
        )}
        {state.streakCount > 0 && <Streak count={state.streakCount} />}
      </header>

      {/* Kahraman blok dikey ORTADA — ekran bos gorunmesin, karar tek olsun */}
      <div className={`flex-1 flex flex-col justify-center gap-4 ${TAB_SPACE}`}>
        {/*
          Set bitince gunluk hedef cubugu YALAN soyluyor: yeni kelime
          kalmadigi icin "0 / 10" her gun boyle kalacak ve kullanici
          yapmadigi bir sey icin eksik gorunecek. Yerine setin kendisi.
        */}
        {/*
          Hedef de bir KART. Once cubuk sayfanin zemininde, kartlarin
          arasinda yuzer halde duruyordu — ekrandaki her sey bir yuzeyin
          uzerindeyken tek basina duran o satir eksik gorunuyordu.
          Cubugun zemini de `sunken`: beyaz kartin uzerinde `white/70`
          kayboluyor.
        */}
        <Card className="rise !py-4">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="text-sm font-bold text-ink-soft">
              {setBitti ? 'Set tamamlandı' : 'Bugünün hedefi'}
            </span>
            <span className="word text-sm font-extrabold tabular-nums">
              {setBitti
                ? `${CARDS.length} / ${CARDS.length}`
                : `${todayCount} / ${state.dailyLimit}`}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-sunken overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                limitDoldu || setBitti ? 'bg-grow' : 'bg-gradient-to-r from-brand to-[#7db2ff]'
              }`}
              style={{ width: `${setBitti ? 100 : gunlukPct}%` }}
            />
          </div>
        </Card>

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
            <Ikon ad="ogren" className="h-14 w-14 mx-auto mb-3" />
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
            <p className="text-sm font-medium text-white/80">
              {ilkDers ? 'Hazır' : yeniGun ? 'Yeni gün' : 'Bugünün dersi'}
            </p>
            <p className="word text-3xl font-extrabold mt-0.5 mb-1">
              {ilkDers ? 'İlk dersin hazır' : yeniGun ? 'Yeni güne başla' : paket}
            </p>
            <p className="text-sm text-white/75 mb-4">
              {ilkDers
                ? `${newCards.length} kelime · önce tanış, sonra öğrenme testi.`
                : yeniGun
                  ? paket
                  : newCards.length > 0
                    ? 'Önce kelimeler, sonra öğrenme testi.'
                    : 'Bugün gelen kelimeler seni bekliyor.'}
            </p>
            <Button variant="soft" onClick={onStart}>
              Başla
            </Button>

            {/*
              Ikinci bir HEDEF degil, ayni dersin sirasi. Yalnizca tekrar
              yuku agirken cikiyor: uzun bir derse girmeden once "sunlari
              halledeyim" demek mesru, ama tekrari atlamak degil.
            */}
            {newCards.length > 0 && tekrar >= agirTekrar && (
              <button
                onClick={onReviewFirst}
                className="mt-3 w-full text-center text-sm font-semibold text-white/80 underline decoration-white/40 underline-offset-4 transition-opacity active:opacity-60"
              >
                Önce {tekrar} tekrarı yap
              </button>
            )}
          </div>
        )}

        {/*
          Kanca ciftleri de kartin icinde. Yanindaki "12 kelime" sayaci
          kaldirildi: bu bolum bir OLCUM degil, son ogrenilenlere bakma
          yeri — sayilar zaten hemen ustteki hedefte ve Ilerleme'de.

          Cipler `sunken`: beyaz kartin uzerinde beyaz cip gorunmuyor.
        */}
        {sonKancalar.length > 0 && (
          <Card className="rise delay-2 !py-4">
            <h2 className="text-sm font-bold text-ink-soft mb-2.5">Son tanıştıkların</h2>
            <div className="flex flex-wrap gap-1.5">
              {sonKancalar.map((c) => (
                <span key={c.id} className="rounded-full bg-sunken px-3 py-1.5 text-sm">
                  <span className="word font-semibold">{c.en}</span>
                  <span className="text-ink-faint"> ≈ </span>
                  <span className="font-semibold text-ink bg-spark/55 rounded px-1">{c.hook}</span>
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Screen>
  );
}
