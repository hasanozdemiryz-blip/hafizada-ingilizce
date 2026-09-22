import { useRef, useState } from 'react';
import { TAB_SPACE } from '../components/TabBar';
import { Avatar } from '../components/Avatar';
import { Button, Card, Ikon, Screen } from '../components/ui';
import { CARDS, LIMIT_CHOICES, LIMIT_MAX } from '../content';
import { olay, olcumHazirla, olcumVarMi, olcumuKapat } from '../analitik';
import { exportProgress, importProgress, resetAll, setState } from '../db';
import {
  HATIRLATMA_VARSAYILAN,
  hatirlatmayiKapat,
  hatirlatmayiKur,
  useHatirlatma,
} from '../reminder';
import { useTelaffuz } from '../speech';
import { DevPanel } from './DevPanel';
import type { AppState } from '../types';
import { dosyayiVer, paylasilabilir, telefonaKaydet, yedekAdi, yol } from '../dosya';

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
  const [bilgi, setBilgi] = useState<string | null>(null);

  /**
   * Yedek paylas menusune verilebiliyor mu. Yalnizca METIN degistiriyor:
   * menu acilacaksa "Yedekle", dosya inecekse "Yedek al" demek dogru.
   * Kabuk render sirasinda degismedigi icin state'e gerek yok.
   */
  const paylasSecenegi = paylasilabilir();

  /**
   * Telefona dogrudan kaydetme yalnizca native kabukta var — tarayicide
   * "Belgeler" diye bir klasor yok. `yol()` blob'suz cagrilinca native
   * kabugu dogru soyluyor (bkz. dosya.ts).
   */
  const telefonSecenegi = yol() === 'native';
  const sesVar = useTelaffuz();
  const hatirlatmaVarMi = useHatirlatma();

  /**
   * Ayari SONUCA gore yaziyoruz: izin verilmezse anahtar acik gorunup
   * hicbir sey yapmamali.
   */
  async function hatirlatmayiAyarla(saat: number | null, dakika = 0) {
    /*
      Ayni deger iki kez gelirse hicbir sey yapma.

      Android'in saat secicisi `change`i IKI KEZ gonderiyor — uretimdeki
      olcumde goruldu: ayni saniyede iki `hatirlatma_degisti`, ayni veri.
      Zarar olcumle sinirli degil, bildirim de iki kez kuruluyordu.
    */
    const ayni = saat === state.reminderHour && (saat === null || dakika === (state.reminderMinute ?? 0));
    if (ayni) return;

    olay('hatirlatma_degisti', { saat: saat ?? 'kapali', dakika });
    if (saat === null) {
      await hatirlatmayiKapat();
      await setState({ reminderHour: null });
      return;
    }
    if (await hatirlatmayiKur(saat, dakika))
      await setState({ reminderHour: saat, reminderMinute: dakika });
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
                    state.reminderHour === null ? HATIRLATMA_VARSAYILAN.saat : null,
                    state.reminderHour === null ? HATIRLATMA_VARSAYILAN.dakika : 0,
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
              /*
                Dort sabit saat (9/13/19/21) yerine serbest secim.
                `type="time"` bilerek: Android WebView burada SISTEMIN kendi
                saat secicisini aciyor — kendi carkimizi cizmek hem daha
                kotu calisirdi hem cihazin 12/24 saat tercihini bilmezdi.
              */
              <label className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-ink-soft">Saat</span>
                <input
                  type="time"
                  value={`${String(state.reminderHour).padStart(2, '0')}:${String(
                    state.reminderMinute ?? 0,
                  ).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [sa, dk] = e.target.value.split(':').map(Number);
                    // Bos birakilirsa tarayici "" donduruyor; NaN ile kurmayalim.
                    if (Number.isInteger(sa) && Number.isInteger(dk)) {
                      void hatirlatmayiAyarla(sa, dk);
                    }
                  }}
                  className="bg-sunken text-ink rounded-2xl px-4 py-3 text-base font-bold tabular-nums"
                />
              </label>
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
                  if (yeni) olcumHazirla(true, state.profil?.id);
                  else olcumuKapat();
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
            Taşımak veya korumak için yedekle
            {paylasSecenegi && " — açılan menüden Drive'a, e-postaya ya da istediğin yere gönderebilirsin"}.
          </p>
          <div className="flex flex-wrap gap-2">
            {telefonSecenegi && (
              <Kucuk
                onClick={() => {
                  setHata(null);
                  void telefonaYedekle(state.profil?.ad)
                    .then((nereye) => setBilgi(`Kaydedildi: ${nereye}`))
                    .catch(() => setHata('Telefona kaydedilemedi.'));
                }}
              >
                Telefona kaydet
              </Kucuk>
            )}
            <Kucuk
              onClick={() => {
                setBilgi(null);
                void disaAktar(state.profil?.ad);
              }}
            >
              {telefonSecenegi ? 'Paylaş' : paylasSecenegi ? 'Yedekle' : 'Yedek al'}
            </Kucuk>
            <Kucuk onClick={() => fileRef.current?.click()}>Geri yükle</Kucuk>
            <Kucuk tehlike onClick={() => setSifirlaSoruluyor(true)}>
              Sıfırla
            </Kucuk>
          </div>
          {hata && <p className="text-sm text-[#c2417f] mt-3">{hata}</p>}
          {bilgi && <p className="text-sm text-ink-soft mt-3 break-all">{bilgi}</p>}
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
          <Satir ad="Sürüm" deger={__APP_VERSION__} />
        </Card>

        {/*
          YASAL — en altta, cunku aranan bir sey degil ama BULUNABILIR
          olmasi gerekiyor. Play ve App Store gizlilik metnine uygulama
          icinden erisilmesini bekliyor.

          Sayfalar React degil, `public/` icinde duz HTML: magazalar
          uygulama YUKLENMEDEN acilabilen bir gizlilik adresi istiyor,
          yani ayni metin hem uygulamada hem internette olmali. Tek
          kaynakta tutmanin yolu bu.
        */}
        <Card className="rise delay-3">
          <h2 className="text-sm font-bold text-ink-soft mb-2">Yasal</h2>
          <div className="flex flex-col">
            {[
              ['gizlilik.html', 'Gizlilik Politikası'],
              ['kullanim-kosullari.html', 'Kullanım Koşulları'],
              ['kvkk-aydinlatma.html', 'KVKK Aydınlatma Metni'],
            ].map(([dosya, ad]) => (
              <a
                key={dosya}
                href={`${import.meta.env.BASE_URL}${dosya}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 text-sm transition-opacity active:opacity-60"
              >
                <span className="font-semibold">{ad}</span>
                <span className="text-ink-faint">↗</span>
              </a>
            ))}
          </div>
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


async function disaAktar(profilAdi?: string) {
  const blob = new Blob([await exportProgress()], { type: 'application/json' });
  const { yol, verildi } = await dosyayiVer(blob, yedekAdi(profilAdi), 'Hafızada İngilizce yedeği');
  // Iptal eden kullanici yedek ALMAMISTIR; olay yalnizca dosya gercekten
  // verildiginde yaziliyor. `yol` ise "Android'de paylas menusu aciliyor mu"
  // sorusunu tek bir cihazdan degil, kullanimdan cevapliyor.
  if (verildi) olay('yedek_alindi', { yol });
}

async function telefonaYedekle(profilAdi?: string): Promise<string> {
  const blob = new Blob([await exportProgress()], { type: 'application/json' });
  const nereye = await telefonaKaydet(blob, yedekAdi(profilAdi));
  olay('yedek_alindi', { yol: 'telefon' });
  return nereye;
}

async function iceAktar(file: File) {
  await importProgress(await file.text());
  // Basarili olunca: hatali dosya `importProgress` icinde patliyor ve
  // cagiran taraf hatayi yakaliyor, yani buraya ancak yuklenmis yedek gelir.
  olay('yedek_yuklendi');
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
