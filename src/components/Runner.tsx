import { useEffect, useMemo, useState } from 'react';
import { AnswerFace, ListenFace, WriteFace } from './CardFace';
import { Choice } from './Choice';
import { Match } from './Match';
import { Scramble } from './Scramble';
import { TypeAnswer } from './TypeAnswer';
import { Button } from './ui';
import { judge, type Judgement } from '../answer';
import { CARDS, EN_HAVUZ } from '../content';
import { ADIM, bloklaraBol, secenekler, shuffle, type Gorev } from '../exercise';
import type { Step } from '../types';
import { seslendir, seslendirmeyiDurdur, useTelaffuz } from '../speech';


const GERI_BILDIRIM: Record<Judgement, { baslik: string; tone: string }> = {
  dogru: { baslik: 'Doğru', tone: 'bg-grow text-white' },
  yakin: { baslik: 'Neredeyse', tone: 'bg-spark text-ink' },
  yanlis: { baslik: 'Yanlış', tone: 'bg-blush text-white' },
};

/**
 * Merdiveni kosturan motor.
 *
 * Hem gunluk ders hem serbest egzersiz bunu kullanir; fark yalnizca
 * sonucun nereye yazildiginda (`onResult`). Motor puanlama yapmaz,
 * "dogru muydu, kancaya bakildi mi" bilgisini yukari verir.
 */
export type { Gorev };

export function Runner({
  gorevler,
  sound,
  sirali = false,
  onResult,
  onDone,
}: {
  gorevler: Gorev[];
  sound: boolean;
  /**
   * true: gorevler VERILDIGI sirada kosulur.
   * Ogrenme testi merdiveni asama asama tirmaniyor (eslestirme -> ... ->
   * dinleme); karistirmak o sirayi bozar. Tekrar bolumunde ise karisik
   * dogru: kartlar birbirinden bagimsiz.
   */
  sirali?: boolean;
  /** `step`: cevabin HANGI basamakta verildigi — puanlamanin birimi (bkz. score.ts) */
  onResult: (
    cardId: string,
    ok: boolean,
    hookRevealed: boolean,
    step: Step,
  ) => void | Promise<void>;
  onDone: () => void;
}) {
  const bloklar = useMemo(
    () => bloklaraBol(sirali ? gorevler : shuffle(gorevler)),
    [gorevler, sirali],
  );
  const [i, setI] = useState(0);
  const [hookRevealed, setHookRevealed] = useState(false);
  const [verdict, setVerdict] = useState<{ judgement: Judgement; typed?: string } | null>(null);
  const [secilen, setSecilen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sesVar = useTelaffuz();

  const blok = bloklar[i];
  const tekliGorev = blok?.tip === 'tekli' ? blok.gorev : null;

  /**
   * Siklar soru basina BIR KEZ uretilir.
   *
   * Once dogrudan render icinde cagriliyordu: kanca ipucuna basmak gibi
   * her yeniden cizimde siklar yeniden karisiyor, kullanicinin parmagi
   * altinda yer degistiriyordu.
   */
  const siklar = useMemo(() => {
    if (!tekliGorev) return [];
    const ters = ADIM[tekliGorev.step].egzersiz === 'ters-secmeli';
    return secenekler(tekliGorev.card, CARDS, ters ? 'en' : 'tr');
  }, [tekliGorev?.card.id, tekliGorev?.step]);

  useEffect(() => {
    if (!blok) onDone();
  }, [blok, onDone]);

  if (!blok) return null;

  function ilerle() {
    seslendirmeyiDurdur();
    setHookRevealed(false);
    setVerdict(null);
    setSecilen(null);
    setBusy(false);
    setI((n) => n + 1);
  }

  // --- Eslestirme blogu ---
  if (blok.tip === 'eslestirme') {
    return (
      <Match
        key={i}
        cards={blok.kartlar}
        onDone={async (sonuc) => {
          if (busy) return;
          setBusy(true);
          // Eslestirme blogu yalnizca 1. basamak gorevlerinden kurulur
          for (const [cardId, ok] of sonuc) await onResult(cardId, ok, false, 1);
          ilerle();
        }}
      />
    );
  }

  const { card, step } = blok.gorev;
  const bilgi = ADIM[step];
  // Ses sentezi yoksa dinleme cevaplanamaz; kart kilitlenmesin diye yazma olarak sorulur
  const egzersiz = bilgi.egzersiz === 'dinleme' && !sesVar ? 'yazma' : bilgi.egzersiz;

  /**
   * `temiz=false`, cevabin dogru ama YARDIMLA bulundugunu soyler.
   * Harf dizmede yanlis harfe dokunmak boyle sayilir: dizilim dogru
   * cikar ama merdivende ilerletmez — aksi halde deneyerek bulmak
   * bilmekle ayni odulu alirdi.
   */
  function yaziliCevap(typed: string, temiz = true) {
    const j = judge(typed, card.en, { havuz: EN_HAVUZ });
    setVerdict({ judgement: j, typed });
    if (sound) seslendir(card.en);
    void onResult(card.id, j !== 'yanlis', hookRevealed || !temiz, step);
  }

  function sikSec(secim: string) {
    if (secilen !== null) return;
    const ters = egzersiz === 'ters-secmeli';
    const dogru = ters ? card.en : card.tr;
    const ok = judge(secim, dogru, { dil: ters ? 'en' : 'tr' }) === 'dogru';
    setSecilen(secim);
    setVerdict({ judgement: ok ? 'dogru' : 'yanlis' });
    if (sound && ters) seslendir(card.en);
    void onResult(card.id, ok, hookRevealed, step);
  }

  const soru = (() => {
    if (verdict) return <AnswerFace card={card} />;
    switch (egzersiz) {
      case 'secmeli':
      case 'ters-secmeli': {
        const ters = egzersiz === 'ters-secmeli';
        return (
          <Choice
            card={card}
            options={siklar}
            ters={ters}
            secilen={secilen}
            hookRevealed={hookRevealed}
            onPick={sikSec}
          />
        );
      }
      case 'harf':
        return <Scramble card={card} hookRevealed={hookRevealed} onSubmit={yaziliCevap} />;
      case 'dinleme':
        return <ListenFace card={card} hookRevealed={hookRevealed} />;
      default:
        return <WriteFace card={card} hookRevealed={hookRevealed} />;
    }
  })();

  const yaziliMi = egzersiz === 'yazma' || egzersiz === 'dinleme';

  return (
    <>
      <div className="flex-1 flex flex-col justify-center py-6">
        {soru}
        {verdict && (
          /*
            Karar cumlesi buyuk: ekranda o an OKUNMASI gereken tek sey bu.
            Kucukken soru metniyle ayni agirliktaydi ve goz once soruya
            gidiyordu — oysa soru bitmis, sira sonuca gelmisti.
            Yazilan yanlis cevap altinda ve KUCUK kaliyor: bilgi ama
            manset degil.
          */
          <div className="rise mt-4 flex flex-col items-center gap-1.5">
            <span
              className={`word rounded-full px-5 py-2 text-xl font-extrabold ${
                GERI_BILDIRIM[verdict.judgement].tone
              }`}
            >
              {GERI_BILDIRIM[verdict.judgement].baslik}
            </span>
            {verdict.typed && verdict.judgement !== 'dogru' && (
              <span className="text-sm text-ink-faint">
                yazdığın: <span className="line-through">{verdict.typed}</span>
              </span>
            )}

            {/*
              Kancaya basip dogru bilince merdiven YERINDE kalir — bu bir
              ceza degil, merdivenin tanimi: tek isi "artik kancasiz
              yapabiliyor musun" sorusuna cevap vermek.
              Ama ekranda hicbir sey olmuyordu: "Doğru" yaziyor, hicbir sey
              kimildamıyor, sebebi soylenmiyor. Ceza yoktu ama GERI BILDIRIM
              de yoktu ve bu cezalandirilmis gibi hissettiriyordu.
              Puanlamaya dokunulmadi; eksik olan tek sey bu satirdi.
            */}
            {verdict.judgement === 'dogru' && hookRevealed && (
              <span className="text-sm text-ink-faint">
                kancayla bildin · bir dahakine kancasız dene
              </span>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2">
        {!verdict && (
          <div className="h-10 flex items-center justify-center">
            {/* Kanca ipucu yalnizca kancanin ekranda OLMADIGI basamaklarda anlamli */}
            {!bilgi.kancaGorunur && !hookRevealed && (
              <button
                onClick={() => setHookRevealed(true)}
                className="px-4 py-2 text-sm font-bold text-brand-deep rounded-full bg-white/70 shadow-[var(--shadow-soft)] hover:bg-white transition"
              >
                Kancayı göster
              </button>
            )}
          </div>
        )}

        {!verdict && yaziliMi && <TypeAnswer key={card.id} onSubmit={yaziliCevap} disabled={busy} />}
        {verdict && (
          <Button variant="brand" onClick={ilerle}>
            Devam
          </Button>
        )}
      </div>
    </>
  );
}
