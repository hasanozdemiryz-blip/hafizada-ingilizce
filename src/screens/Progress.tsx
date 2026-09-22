import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Ikon, Screen, Streak } from '../components/ui';
import { getAnswers } from '../db';
import { TAB_SPACE } from '../components/TabBar';
import { FREEZE_MAX } from '../dates';
import {
  PENCERELER,
  abilities,
  activeDays,
  masteryRate,
  successRate,
  type Pencere,
} from '../score';
import type { AppState, Cevap, Progress as ProgressRow } from '../types';

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

  /*
    Cevaplar burada okunuyor, App'te degil: gunluk buyuyen tek tablo bu ve
    ana ekranin her ciziminde bastan okunmasinin anlami yok.
  */
  const cevaplar = useLiveQuery(getAnswers, [], [] as Cevap[]);

  const ogrenilen = progress.filter((p) => p.introduced).length;
  const toplamTekrar = Object.values(state.days).reduce((a, d) => a + d.r, 0);

  const basari = successRate(cevaplar, pencere);
  const duzen = activeDays(state.days, pencere);
  const ustalik = masteryRate(progress);
  const yetenek = abilities(progress, cevaplar);



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
            <Ikon ad="kartlar" ters className="h-8 w-8 shrink-0" />
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
          <h2 className="text-sm font-bold text-ink-soft mb-2.5">Başarı</h2>
          {/* Dort pencere tek satira sigmiyordu; grid esit boler */}
          <div className="grid grid-cols-4 gap-1 rounded-full bg-sunken p-1 mb-4">
            {PENCERELER.map((p) => (
              <button
                key={p.id}
                onClick={() => setPencere(p.id)}
                className={`rounded-full py-1.5 text-xs font-bold transition-all ${
                  pencere === p.id ? 'bg-white text-ink shadow-[var(--shadow-soft)]' : 'text-ink-faint'
                }`}
              >
                {p.ad}
              </button>
            ))}
          </div>

          {basari ? (
            <>
              <p className="word text-center text-5xl font-extrabold tabular-nums leading-none">
                %{basari.percent}
              </p>
              {/*
                Birim `kelime x basamak`: ayni kelimenin eslestirmesi ile
                dinlemesi ayri hucreler (bkz. score.ts). Ham hacim hemen
                altinda duruyor — yoksa "%100" tek alistirmayla da yazilabilir.
              */}
              <p className="text-center text-sm text-ink-soft mt-2">
                {basari.dogru} / {basari.toplam} alıştırmayı en son doğru yaptın
              </p>
              <div className="h-2.5 w-full rounded-full bg-sunken overflow-hidden mt-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-[#7db2ff] transition-[width] duration-700"
                  style={{ width: `${basari.percent}%` }}
                />
              </div>
              <p className="text-center text-xs text-ink-faint mt-2.5">
                {basari.kelime} kelime · {basari.cevap} cevap · {basari.yanlisCevap} yanlış
              </p>
              <p className="text-center text-xs text-ink-faint mt-1.5 leading-relaxed">
                Her alıştırma bir kez sayılır: aynı kelimenin eşleştirmesi ve yazması
                ayrı. Yanlış yaptığını tekrar edip doğru yapınca bu oran yükselir.
              </p>
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
              : duzen.toplam === null
                ? `Toplam ${duzen.calisilan} gün çalıştın.`
                : `Son ${duzen.toplam} günde ${duzen.calisilan} gün çalıştın.`}
          </p>
        </Card>

        {/* --- Sayilar: ortalanmis --- */}
        {/*
          Dort kutu da beyazdi ve ayirt edilmiyordu. Her sayinin kendi rengi
          var; renkler uygulamanin geri kalaniyla ayni anlamda kullaniliyor
          (mavi birincil, sari kanca/ustalik, pembe seri, nane toplam).
        */}
        <div className="grid grid-cols-2 gap-3">
          <Kutu buyuk={String(ogrenilen)} kucuk="kelime öğrendin" renk="bg-brand-soft" />
          {/* "ustalık" kimseye bir sey soylemiyordu — ne oldugu soruldu */}
          <Kutu
            buyuk={ustalik === null ? '—' : `%${ustalik}`}
            kucuk="kalıcılık"
            renk="bg-spark-soft"
          />
          <Kutu buyuk={String(state.streakCount)} kucuk="günlük seri" renk="bg-blush-soft" />
          <Kutu buyuk={String(toplamTekrar)} kucuk="toplam çalışma" renk="bg-grow-soft" />
        </div>

        {/*
          Kalicilik tek basina anlasilmiyordu ("ustalık neydi?"). Kutunun
          icine sigmayan tanim hemen altinda, tek satirda.
        */}
        <p className="-mt-1 px-2 text-center text-xs text-ink-faint leading-relaxed">
          <b className="font-bold text-ink-soft">Kalıcılık</b>: kelimelerin merdivende ne
          kadar yukarı çıktığı. Tekrarlarla yükselir.
        </p>

        {/* --- Neler yapabiliyorsun: BIRIKIMLI --- */}
        {yetenek.toplam > 0 && (
          <Card className="rise delay-2">
            <h2 className="text-sm font-bold text-ink-soft mb-3">Neler yapabildin</h2>
            <div className="flex flex-col gap-3">
              <Yetenek
                ad="Tanıştım"
                sayi={yetenek.taniyor}
                toplam={yetenek.toplam}
                renk="bg-brand"
              />
              <Yetenek
                ad="Türkçesinden seçtim"
                sayi={yetenek.seciyor}
                toplam={yetenek.toplam}
                renk="bg-spark"
              />
              <Yetenek
                ad="Baştan yazdım"
                sayi={yetenek.yaziyor}
                toplam={yetenek.toplam}
                renk="bg-grow"
              />
            </div>
            {/*
              Panel artik MERDIVEN konumunu degil YAPILANI sayiyor (bkz.
              score.ts `abilities`): derste ters secmeli/yazma dogru
              yapildiginda ayni gun doluyor. Sayimin ne oldugu yaziyor,
              cunku "bir kez yaptim" ile "hala biliyorum" ayri seyler ve
              ikincisi hemen ustteki kalicilik yuzdesi.
            */}
            <p className="text-xs text-ink-faint mt-4 leading-relaxed">
              Bir kelimeyi o basamakta <b className="font-bold text-ink-soft">kancaya
              basmadan</b> en az bir kez doğru yaptıysan burada sayılır.
            </p>
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
                <Ikon
                  key={i}
                  ad="koruma"
                  className={`h-7 w-7 ${i < state.freezes ? '' : 'opacity-25 saturate-0'}`}
                />
              ))}
            </div>
          </div>
        </Card>

      </div>
    </Screen>
  );
}

/**
 * Birikimli beceri satiri. Ust basamaktaki kelime alttakileri de
 * yapabildigi icin cubuklar ic ice dolar — asagi indikce kisalir.
 */
function Yetenek({
  ad,
  sayi,
  toplam,
  renk,
}: {
  ad: string;
  sayi: number;
  toplam: number;
  renk: string;
}) {
  const pct = toplam > 0 ? Math.round((sayi / toplam) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-sm font-bold">{ad}</span>
        <span className="text-sm tabular-nums shrink-0">
          <span className="font-extrabold">{sayi}</span>
          <span className="text-ink-faint"> / {toplam}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-sunken overflow-hidden">
        <div
          className={`h-full rounded-full ${renk} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Sayilar ORTALI — once sola yaslidilar ve kutular dengesiz duruyordu. */
function Kutu({ buyuk, kucuk, renk }: { buyuk: string; kucuk: string; renk: string }) {
  return (
    <div className={`rise rounded-card ${renk} p-4 text-center shadow-[var(--shadow-soft)]`}>
      <p className="word text-3xl font-extrabold tabular-nums leading-none">{buyuk}</p>
      <p className="text-xs text-ink-soft mt-1.5">{kucuk}</p>
    </div>
  );
}

