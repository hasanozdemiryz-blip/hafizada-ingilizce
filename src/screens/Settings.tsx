import { useRef, useState } from 'react';
import { TAB_SPACE } from '../components/TabBar';
import { Avatar } from '../components/Avatar';
import { Button, Card, Ikon, Screen } from '../components/ui';
import { CARDS, LIMIT_CHOICES, LIMIT_MAX } from '../content';
import { olcumHazirla, olcumVarMi, olcumuKapat } from '../analitik';
import { exportProgress, importProgress, resetAll, setState } from '../db';
import {
  HATIRLATMA_SAATLERI,
  hatirlatmayiKapat,
  hatirlatmayiKur,
  useHatirlatma,
} from '../reminder';
import { useTelaffuz } from '../speech';
import { DevPanel } from './DevPanel';
import type { AppState } from '../types';

/**
 * AYARLAR.
 *
 * Once ayarlar Ilerleme sekmesinin dibinde, istatistiklerin arasinda
 * duruyordu — bir seyi degistirmek icin once grafiklerden gecmek
 * gerekiyordu. Kendi sekmesine alindi; Ilerleme artik saf profil.
 */
export function Settings({
  state,
  progress,
  onProfil,
}: {
  state: AppState;
  progress: unknown[];
  onProfil: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sifirlaSoruluyor, setSifirlaSoruluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const sesVar = useTelaffuz();
  const hatirlatmaVarMi = useHatirlatma();

  /**
   * Ayari SONUCA gore yaziyoruz: izin verilmezse anahtar acik gorunup
   * hicbir sey yapmamali.
   */
  async function hatirlatmayiAyarla(saat: number | null) {
    if (saat === null) {
      await hatirlatmayiKapat();
      await setState({ reminderHour: null });
      return;
    }
    if (await hatirlatmayiKur(saat)) await setState({ reminderHour: saat });
  }

  return (
    <Screen>
      <header className="flex items-center h-14 shrink-0">
        <span className="word text-lg font-bold">Ayarlar</span>
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        {/*
          Gunluk hedef GERCEK bir sinir, oneri degil. Tavani asmak ertesi
          gun kaldirilamayan bir tekrar yigini demek — o yuzden 15'in
          ustunde secenek yok.
        */}
        {/*
          PROFIL — en ustte, cunku "benim" olan tek kart bu.
          "Hesap" DEMIYOR: e-posta, sifre, giris yok. Hesap dendiginde
          insanlar verilerinin bulutta oldugunu sanip yedek almayi birakir.
        */}
        {state.profil && (
          <button
            onClick={onProfil}
            className="rise rounded-card bg-surface p-5 shadow-[var(--shadow-soft)] text-left transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <Avatar avatar={state.profil.avatar} cerceve={state.profil.cerceve} boyut="md" />
              <span className="min-w-0 flex-1">
                <span className="word block text-lg font-extrabold truncate">
                  {state.profil.ad}
                </span>
                <span className="block text-sm text-ink-soft mt-0.5">
                  Adını ve avatarını değiştir
                </span>
              </span>
              <span className="text-xl text-ink-faint shrink-0">›</span>
            </div>
            <p className="text-xs text-ink-faint mt-3">
              Profil bu cihazda tutulur — hesap değil, giriş gerekmez.
            </p>
          </button>
        )}

        <Card className="rise delay-1">
          <h2 className="text-sm font-bold text-ink-soft mb-1">Günlük hedef</h2>
          <p className="text-sm text-ink-soft mb-3">
            Günde en fazla kaç yeni kelime. Dolduğunda gün kapanır; tekrarlar devam eder.
          </p>
          <div className="flex gap-2">
            {LIMIT_CHOICES.map((n) => {
              const secili = state.dailyLimit === n;
              return (
                <button
                  key={n}
                  onClick={() => void setState({ dailyLimit: n })}
                  className={`flex-1 rounded-2xl px-3 py-4 transition-all active:scale-95 ${
                    secili
                      ? 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(79,146,246,0.85)]'
                      : 'bg-sunken text-ink'
                  }`}
                >
                  <span className="word block text-2xl font-extrabold tabular-nums">{n}</span>
                  <span className="block text-xs mt-0.5 opacity-80">kelime</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-faint mt-3">En fazla {LIMIT_MAX} — üstü serbest değil.</p>
        </Card>

        {sesVar && (
          <Card className="rise delay-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">Telaffuz sesi</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  Cevap açılınca kendiliğinden çalsın. Kapalıyken{' '}
                  <Ikon ad="ses" className="inline-block h-4 w-4 align-text-bottom" /> ile
                  dinleyebilirsin.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={state.sound}
                aria-label="Telaffuz sesi"
                onClick={() => void setState({ sound: !state.sound })}
                className={`shrink-0 h-8 w-14 rounded-full p-1 transition-colors ${
                  state.sound ? 'bg-grow' : 'bg-line'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform ${
                    state.sound ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </Card>
        )}

        {/*
          Gunluk hatirlatma — yalnizca native kabukta (APK).
          Tarayicida bir PWA kapaliyken kendi kendine bildirim gonderemez;
          sunucu ister. Motor yoksa satir hic acilmiyor (bkz. reminder.ts).
        */}
        {hatirlatmaVarMi && (
          <Card className="rise delay-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">Günlük hatırlatma</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  Seçtiğin saatte kısa bir bildirim. Kaçırırsan bir şey olmaz.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={state.reminderHour !== null}
                aria-label="Günlük hatırlatma"
                onClick={() =>
                  void hatirlatmayiAyarla(
                    state.reminderHour === null ? HATIRLATMA_SAATLERI[2] : null,
                  )
                }
                className={`shrink-0 h-8 w-14 rounded-full p-1 transition-colors ${
                  state.reminderHour !== null ? 'bg-grow' : 'bg-line'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform ${
                    state.reminderHour !== null ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {state.reminderHour !== null && (
              <div className="mt-4 flex gap-2">
                {HATIRLATMA_SAATLERI.map((sa) => {
                  const secili = state.reminderHour === sa;
                  return (
                    <button
                      key={sa}
                      onClick={() => void hatirlatmayiAyarla(sa)}
                      className={`flex-1 rounded-2xl py-3 text-sm font-bold tabular-nums transition-all active:scale-95 ${
                        secili
                          ? 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(79,146,246,0.85)]'
                          : 'bg-sunken text-ink'
                      }`}
                    >
                      {String(sa).padStart(2, '0')}:00
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/*
          OLCUM ANAHTARI — yalnizca yapilandirilmissa gorunur.
          Yapilandirma yoksa (gelistirme, depoyu klonlayan) hicbir sey
          gonderilmiyor; olmayan bir seyi kapatan anahtar gostermek yanlis
          olurdu (telaffuz ve hatirlatma da ayni kurali izliyor).
        */}
        {olcumVarMi() && (
          <Card className="rise delay-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">Kullanım istatistikleri</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  Hangi ekranların kullanıldığını anonim olarak ölçeriz. Adın,
                  fotoğrafın ve cevapların <b>gönderilmez</b>.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={state.olcum !== false}
                aria-label="Kullanım istatistikleri"
                onClick={() => {
                  const yeni = state.olcum === false;
                  void setState({ olcum: yeni });
                  if (yeni) void olcumHazirla(true, state.profil?.id);
                  else void olcumuKapat();
                }}
                className={`shrink-0 h-8 w-14 rounded-full p-1 transition-colors ${
                  state.olcum !== false ? 'bg-grow' : 'bg-line'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform ${
                    state.olcum !== false ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </Card>
        )}

        <Card className="rise delay-2">
          <h2 className="text-sm font-bold text-ink-soft mb-1">Verilerim</h2>
          <p className="text-sm text-ink-soft mb-3">
            İlerleme, profilin ve fotoğrafın <b>yalnızca bu cihazda</b> tutuluyor.
            Taşımak veya korumak için yedek al.
          </p>
          <div className="flex flex-wrap gap-2">
            <Kucuk onClick={() => void disaAktar(state.profil?.ad)}>Yedek al</Kucuk>
            <Kucuk onClick={() => fileRef.current?.click()}>Geri yükle</Kucuk>
            <Kucuk tehlike onClick={() => setSifirlaSoruluyor(true)}>
              Sıfırla
            </Kucuk>
          </div>
          {hata && <p className="text-sm text-[#c2417f] mt-3">{hata}</p>}
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void iceAktar(f).catch(() => setHata('Yedek dosyası okunamadı.'));
            }}
          />
        </Card>

        <Card className="rise delay-3">
          <h2 className="text-sm font-bold text-ink-soft mb-2">Hakkında</h2>
          <Satir ad="Setteki kelime" deger={String(CARDS.length)} />
          <Satir ad="Öğrendiğin" deger={String(progress.length)} />
          <Satir ad="Sürüm" deger="0.1.0" />
        </Card>

        {import.meta.env.DEV && <DevPanel />}
      </div>

      {/*
        Silme onayi kart ici. Tarayicinin `confirm()` kutusu PWA'da
        bloklayan bir sistem diyalogu; akisi donduruyor ve uygulamanin
        diline hic benzemiyor.
      */}
      {sifirlaSoruluyor && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 px-5 pb-8 backdrop-blur-sm">
          <div className="rise w-full max-w-md rounded-card bg-white p-6 shadow-[var(--shadow-lift)]">
            <p className="word text-xl font-extrabold">Her şey silinecek</p>
            <p className="text-sm text-ink-soft mt-2">
              Öğrendiğin <b>{progress.length} kelime</b>, serin ve tüm geçmişin silinir.
              Bu geri alınamaz — önce yedek almak istersen şimdi iyi bir an.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="brand" onClick={() => setSifirlaSoruluyor(false)}>
                Vazgeç
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSifirlaSoruluyor(false);
                  void resetAll();
                }}
              >
                Evet, sıfırla
              </Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

/**
 * Dosya adinda profil adi da geciyor: birden fazla yedek yan yana
 * durunca hangisinin kime ait oldugu dosya adindan anlasilsin.
 * Turkce harfler ve bosluk dosya adinda sorun cikarabiliyor — sadelestirilir.
 */
const dosyaAdi = (ad?: string) => {
  const sade = (ad ?? '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const gun = new Date().toISOString().slice(0, 10);
  return sade ? `${sade}-yedek-${gun}.json` : `hafizada-yedek-${gun}.json`;
};

async function disaAktar(profilAdi?: string) {
  const url = URL.createObjectURL(new Blob([await exportProgress()], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = dosyaAdi(profilAdi);
  a.click();
  URL.revokeObjectURL(url);
}

async function iceAktar(file: File) {
  await importProgress(await file.text());
}

function Kucuk({
  children,
  onClick,
  tehlike,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tehlike?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
        tehlike ? 'bg-blush-soft text-[#c2417f]' : 'bg-sunken text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Satir({ ad, deger }: { ad: string; deger: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-ink-soft">{ad}</span>
      <span className="font-bold tabular-nums">{deger}</span>
    </div>
  );
}
