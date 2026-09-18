import { useState } from 'react';
import { Card, Screen, Streak } from '../components/ui';
import { TAB_SPACE } from '../components/TabBar';
import { FREEZE_MAX } from '../dates';
import { firstCheckRate, produceRate, unaidedRate, weakestHooks } from '../quality';
import {
  PENCERELER,
  activeDays,
  masteryRate,
  stepGroups,
  successRate,
  type Pencere,
} from '../score';
import type { AppState, Progress as ProgressRow } from '../types';

/**
 * ILERLEME — profil.
 *
 * Once burada 12 haftalik bir isi haritasi vardi. Kaldirildi:
 *   · Serinin zaten soyledigi seyi 84 kareyle tekrar ediyordu
 *   · "Seri: odul var, ceza yok" ilkesine aykiriydi — bos kareler bir
 *     kacirilan gunler defteriydi, yeni baslayan biri hiclik duvari goruyordu
 *   · Telefon genisligine sigmiyor, kenarlari kirpiliyordu
 *   · Ve en onemlisi: CALISTIGINI gosteriyordu, NE KADAR IYI calistigini degil
 *
 * Duzenlilik bilgisi Basari panelinde tek satira indi.
 */
export function ProgressScreen({
  state,
  progress,
  onWords,
}: {
  state: AppState;
  progress: ProgressRow[];
  onWords: () => void;
}) {
  const [pencere, setPencere] = useState<Pencere>('hafta');

  const ogrenilen = progress.filter((p) => p.introduced).length;
  const toplamTekrar = Object.values(state.days).reduce((a, d) => a + d.r, 0);

  const basari = successRate(state.days, pencere);
  const duzen = activeDays(state.days, pencere);
  const ustalik = masteryRate(progress);
  const gruplar = stepGroups(progress);

  const ilkOran = firstCheckRate(progress);
  const kancasizOran = unaidedRate(progress);
  const uretimOran = produceRate(progress);
  const zayiflar = weakestHooks(progress);

  const grupToplam = gruplar.tanima + gruplar.gecis + gruplar.uretim;
  const pay = (n: number) => (grupToplam > 0 ? (n / grupToplam) * 100 : 0);

  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        <span className="word text-lg font-bold">İlerleme</span>
        {state.streakCount > 0 && <Streak count={state.streakCount} />}
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        <button
          onClick={onWords}
          className="rise rounded-card bg-gradient-to-br from-ink to-[#2c3d5c] p-5 text-left text-white shadow-[var(--shadow-lift)] transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl leading-none">📖</span>
            <span className="min-w-0 flex-1">
              <span className="word block text-xl font-extrabold">Kelimeler</span>
              <span className="block text-sm text-white/70 mt-0.5">
                Öğrendiklerin, kancalarıyla · ara ve filtrele
              </span>
            </span>
            <span className="text-xl text-white/60">›</span>
          </div>
        </button>

        {/* --- Basari: donemsel yuzde --- */}
        <Card className="rise delay-1">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-ink-soft">Başarı</h2>
            <div className="flex gap-1 rounded-full bg-sunken p-1">
              {PENCERELER.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPencere(p.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    pencere === p.id ? 'bg-white text-ink shadow-[var(--shadow-soft)]' : 'text-ink-faint'
                  }`}
                >
                  {p.ad}
                </button>
              ))}
            </div>
          </div>

          {basari ? (
            <>
              <p className="word text-center text-5xl font-extrabold tabular-nums leading-none">
                %{basari.percent}
              </p>
              <p className="text-center text-sm text-ink-soft mt-2">
                {basari.dogru} doğru · {basari.toplam - basari.dogru} yanlış
              </p>
              <div className="h-2.5 w-full rounded-full bg-sunken overflow-hidden mt-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-[#7db2ff] transition-[width] duration-700"
                  style={{ width: `${basari.percent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-ink-faint py-6">
              Bu dönemde henüz cevap yok.
            </p>
          )}

          {/* Duzenlilik — takvimin yerine tek satir */}
          <p className="text-center text-xs text-ink-faint mt-4">
            {pencere === 'gun'
              ? duzen.calisilan > 0
                ? 'Bugün çalıştın.'
                : 'Bugün henüz çalışmadın.'
              : `Son ${duzen.toplam} günde ${duzen.calisilan} gün çalıştın.`}
          </p>
        </Card>

        {/* --- Sayilar: ortalanmis --- */}
        <div className="grid grid-cols-2 gap-3">
          <Kutu buyuk={String(ogrenilen)} kucuk="kelime öğrendin" />
          <Kutu buyuk={ustalik === null ? '—' : `%${ustalik}`} kucuk="ustalık" />
          <Kutu buyuk={String(state.streakCount)} kucuk="günlük seri" />
          <Kutu buyuk={String(toplamTekrar)} kucuk="toplam çalışma" />
        </div>

        {/* --- Ustalik dagilimi: uc anlamli grup --- */}
        {grupToplam > 0 && (
          <Card className="rise delay-2">
            <h2 className="text-sm font-bold text-ink-soft mb-3">Kelimelerin nerede</h2>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-sunken">
              <div className="bg-brand transition-all" style={{ width: `${pay(gruplar.tanima)}%` }} />
              <div className="bg-spark transition-all" style={{ width: `${pay(gruplar.gecis)}%` }} />
              <div className="bg-grow transition-all" style={{ width: `${pay(gruplar.uretim)}%` }} />
            </div>
            <div className="flex flex-wrap justify-between gap-2 mt-3 text-xs">
              <Efsane renk="bg-brand" ad="Tanıma" sayi={gruplar.tanima} alt="görünce anlıyorum" />
              <Efsane renk="bg-spark" ad="Geçiş" sayi={gruplar.gecis} alt="seçebiliyorum" />
              <Efsane renk="bg-grow" ad="Üretim" sayi={gruplar.uretim} alt="yazabiliyorum" />
            </div>
          </Card>
        )}

        <Card className="rise delay-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Seri koruma</p>
              <p className="text-sm text-ink-soft mt-0.5">
                Bir gün kaçırırsan seriyi korur. 7 günde bir kazanılır.
              </p>
            </div>
            <div className="flex gap-1 shrink-0 ml-3">
              {Array.from({ length: FREEZE_MAX }, (_, i) => (
                <span key={i} className={`text-2xl ${i < state.freezes ? '' : 'grayscale opacity-25'}`}>
                  ❄️
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/*
          Kancalarin gercekte tutup tutmadigi.
          Olcumun NEREDE yapildigi onemli — bkz. quality.ts.
        */}
        {ogrenilen > 0 && (
          <Card className="rise delay-3">
            <h2 className="text-sm font-bold text-ink-soft mb-3">Kancalar nasıl gidiyor</h2>
            <Satir
              ad="İlk denemede tuttu"
              deger={ilkOran ? `%${ilkOran.percent}` : '—'}
              alt={ilkOran ? `${ilkOran.of} kartta ölçüldü` : 'henüz öğrenme testi yapılmadı'}
            />
            <Satir
              ad="Kanca ekrandan kalkınca durdu"
              deger={kancasizOran ? `%${kancasizOran.percent}` : '—'}
              alt={
                kancasizOran
                  ? `${kancasizOran.of} kartta ölçüldü — kancanın gerçek sınavı`
                  : 'kartlar henüz 3. basamağa gelmedi'
              }
            />
            <Satir
              ad="İlk yazmada üretildi"
              deger={uretimOran ? `%${uretimOran.percent}` : '—'}
              alt={uretimOran ? `${uretimOran.of} kartta ölçüldü` : 'kartlar henüz yazma basamağına gelmedi'}
            />
          </Card>
        )}

        {zayiflar.length > 0 && (
          <Card className="rise delay-3">
            <h2 className="text-sm font-bold text-ink-soft mb-1">Gözden geçirilecek kancalar</h2>
            <p className="text-sm text-ink-soft mb-3">
              En çok zorlandıkların. Kanca zayıfsa kart değil kanca değişmeli.
            </p>
            <ul className="flex flex-col divide-y divide-line">
              {zayiflar.map(({ card, reason }) => (
                <li key={card.id} className="py-2.5 flex items-baseline justify-between gap-3">
                  <span className="shrink-0">
                    <span className="word font-semibold">{card.en}</span>
                    <span className="text-ink-faint"> ≈ </span>
                    <span className="font-semibold bg-spark/55 rounded px-1">{card.hook}</span>
                  </span>
                  <span className="text-xs text-ink-faint text-right">{reason}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </Screen>
  );
}

function Efsane({
  renk,
  ad,
  sayi,
  alt,
}: {
  renk: string;
  ad: string;
  sayi: number;
  alt: string;
}) {
  return (
    <span className="flex-1 min-w-[5.5rem]">
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${renk}`} />
        <span className="font-bold">{ad}</span>
        <span className="tabular-nums text-ink-soft">{sayi}</span>
      </span>
      <span className="block text-[10px] text-ink-faint mt-0.5 ml-3.5">{alt}</span>
    </span>
  );
}

/** Sayilar ORTALI — once sola yaslidilar ve kutular dengesiz duruyordu. */
function Kutu({ buyuk, kucuk }: { buyuk: string; kucuk: string }) {
  return (
    <div className="rise rounded-card bg-white p-4 text-center shadow-[var(--shadow-soft)]">
      <p className="word text-3xl font-extrabold tabular-nums leading-none">{buyuk}</p>
      <p className="text-xs text-ink-soft mt-1.5">{kucuk}</p>
    </div>
  );
}

/** `alt` paydayi soyler — %100'un 2 karta mi 40 karta mi dayandigi onemli. */
function Satir({ ad, deger, alt }: { ad: string; deger: string; alt?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span>
        <span className="text-ink-soft">{ad}</span>
        {alt && <span className="block text-xs text-ink-faint mt-0.5">{alt}</span>}
      </span>
      <span className="font-bold tabular-nums shrink-0">{deger}</span>
    </div>
  );
}
