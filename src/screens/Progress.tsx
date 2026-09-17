import { useRef } from 'react';
import { Card, Screen, Streak } from '../components/ui';
import { TAB_SPACE } from '../components/TabBar';
import { CARDS, DECKS } from '../content';
import { FREEZE_MAX, lastNDays, todayKey } from '../dates';
import { exportProgress, importProgress, resetAll } from '../db';
import type { AppState, Progress as ProgressRow } from '../types';

const HAFTA = 12;
const GUN = HAFTA * 7;

/** Yogunluga gore dolgu — 0 hicbir sey yapilmadi. */
function tonOf(toplam: number): string {
  // Bos gun de GORUNUR olmali — beyaz kart ustunde beyaz kare kaybolur
  if (toplam === 0) return 'bg-line';
  if (toplam < 5) return 'bg-brand/25';
  if (toplam < 15) return 'bg-brand/50';
  if (toplam < 30) return 'bg-brand/75';
  return 'bg-brand';
}

const GUN_ADI = ['Pt', '', 'Ça', '', 'Cu', '', 'Pz'];

export function ProgressScreen({
  state,
  progress,
}: {
  state: AppState;
  progress: ProgressRow[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const gunler = lastNDays(GUN);
  const bugun = todayKey();

  const ogrenilen = progress.filter((p) => p.introduced).length;
  const aktifGun = gunler.filter((g) => {
    const d = state.days[g];
    return d && d.r + d.i > 0;
  }).length;

  const toplamTekrar = Object.values(state.days).reduce((a, d) => a + d.r, 0);
  const bitenDeste = DECKS.filter((d) => state.deckTests[d.n]?.passedAt).length;

  // Kanca kalite sinyalleri — icerigi veriyle duzeltmek icin
  const tutmadi = progress.filter((p) => p.introStuck).length;
  const kancaAcilan = progress.filter((p) => p.hookRevealCount > 0).length;
  const ilkHatirlama = progress.filter((p) => p.firstRecallOk !== null);
  const tuttuOran = ilkHatirlama.length
    ? Math.round((ilkHatirlama.filter((p) => p.firstRecallOk).length / ilkHatirlama.length) * 100)
    : null;

  // 12 sutun x 7 satir, sutun basina bir hafta
  const sutunlar = Array.from({ length: HAFTA }, (_, i) => gunler.slice(i * 7, i * 7 + 7));

  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        <span className="word text-lg font-semibold">İlerleme</span>
        {state.streakCount > 0 && <Streak count={state.streakCount} />}
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        <div className="grid grid-cols-2 gap-3">
          <Kutu buyuk={String(ogrenilen)} kucuk={`/ ${CARDS.length} kelime`} />
          <Kutu buyuk={String(state.streakCount)} kucuk="günlük seri" />
          <Kutu buyuk={String(toplamTekrar)} kucuk="toplam tekrar" />
          <Kutu buyuk={`${bitenDeste}/${DECKS.length}`} kucuk="deste tamam" />
        </div>

        <Card className="rise">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold text-ink-soft">Son 12 hafta</h2>
            <span className="text-xs text-ink-faint tabular-nums">{aktifGun} gün çalıştın</span>
          </div>

          <div className="flex gap-1.5">
            <div className="flex flex-col gap-[3px] pr-1">
              {GUN_ADI.map((g, i) => (
                <span
                  key={i}
                  className="h-3.5 text-[9px] leading-[0.875rem] text-ink-faint w-4 text-right"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px] overflow-x-auto">
              {sutunlar.map((hafta, i) => (
                <div key={i} className="flex flex-col gap-[3px]">
                  {hafta.map((g) => {
                    const d = state.days[g];
                    const toplam = d ? d.r + d.i : 0;
                    return (
                      <div
                        key={g}
                        title={`${g}: ${toplam} kart`}
                        className={`h-3.5 w-3.5 rounded-[4px] ${tonOf(toplam)} ${
                          g === bugun ? 'ring-2 ring-ink/40' : ''
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-ink-faint">
            <span>az</span>
            {['bg-line', 'bg-brand/25', 'bg-brand/50', 'bg-brand/75', 'bg-brand'].map((t) => (
              <div key={t} className={`h-2.5 w-2.5 rounded-[3px] ${t}`} />
            ))}
            <span>çok</span>
          </div>
        </Card>

        <Card className="rise delay-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Seri koruma</p>
              <p className="text-sm text-ink-soft mt-0.5">
                Bir gün kaçırırsan seriyi korur. 7 günde bir kazanılır.
              </p>
            </div>
            <div className="flex gap-1 shrink-0 ml-3">
              {Array.from({ length: FREEZE_MAX }, (_, i) => (
                <span
                  key={i}
                  className={`text-2xl ${i < state.freezes ? '' : 'grayscale opacity-25'}`}
                >
                  ❄️
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/*
          Kancalarin gercekte tutup tutmadigi — icerigi veriyle duzeltmek icin.
          "Tutmadi" sinyali daha tanisma aninda olusuyor, o yuzden panel
          tekrar beklemeden gorunur.
        */}
        {ogrenilen > 0 && (
          <Card className="rise delay-2">
            <h2 className="text-sm font-bold text-ink-soft mb-3">Kancalar nasıl gidiyor</h2>
            <Satir ad="İlk tekrarda hatırlanan" deger={tuttuOran === null ? '—' : `%${tuttuOran}`} />
            <Satir ad="“Tutmadı” dediklerin" deger={String(tutmadi)} />
            <Satir ad="Kancaya baktığın kartlar" deger={String(kancaAcilan)} />
          </Card>
        )}

        {/*
          Veri islemleri. Ana ekrandaydi ama alt menu ustunu kapatiyordu;
          zaten ayar olduklari icin yeri burasi.
        */}
        <Card className="rise delay-3">
          <h2 className="text-sm font-bold text-ink-soft mb-1">Verilerim</h2>
          <p className="text-sm text-ink-soft mb-3">
            İlerleme sadece bu cihazda tutuluyor. Taşımak veya korumak için yedek al.
          </p>
          <div className="flex flex-wrap gap-2">
            <Kucuk onClick={() => void disaAktar()}>Yedek al</Kucuk>
            <Kucuk onClick={() => fileRef.current?.click()}>Geri yükle</Kucuk>
            <Kucuk
              tehlike
              onClick={() => {
                if (confirm('Tüm ilerleme silinecek. Emin misin?')) void resetAll();
              }}
            >
              Sıfırla
            </Kucuk>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void iceAktar(f);
            }}
          />
        </Card>
      </div>
    </Screen>
  );
}

async function disaAktar() {
  const url = URL.createObjectURL(new Blob([await exportProgress()], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `hafizada-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function iceAktar(file: File) {
  try {
    await importProgress(await file.text());
  } catch {
    alert('Yedek dosyası okunamadı.');
  }
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

function Kutu({ buyuk, kucuk }: { buyuk: string; kucuk: string }) {
  return (
    <div className="rise rounded-card bg-white p-4 shadow-[var(--shadow-soft)]">
      <p className="word text-3xl font-semibold tabular-nums leading-none">{buyuk}</p>
      <p className="text-xs text-ink-soft mt-1.5">{kucuk}</p>
    </div>
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
