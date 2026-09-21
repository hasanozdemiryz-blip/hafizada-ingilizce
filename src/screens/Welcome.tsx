import { useMemo, useState } from 'react';
import { CardVisual } from '../components/CardVisual';
import { Button, Card, HookChip, Screen } from '../components/ui';
import { CARDS, LIMIT_CHOICES, LIMIT_DEFAULT, SHOWCASE_CARD } from '../content';
import { setState } from '../db';
import { secenekler } from '../exercise';

type Adim = 'vaat' | 'dene' | 'hedef';

/**
 * ILK KARSILASMA — uc adim, ~30 saniye.
 *
 * Arastirma net: uygulamalar ilk hafta kullanicinin cogunu "aha" anina hic
 * varamadigi icin kaybediyor. Bu urunun "aha"si kontrol panelinde degil,
 * TEK BIR KARTTA.
 *
 * Onceki surumde kart yalnizca GOSTERILIYORDU. Kullanici "guzelmis" deyip
 * geciyor ama kancanin ise yaradigina INANMIYORDU, cunku kendi denemedi.
 * 2. adim tam olarak bunu duzeltiyor: anlatmiyoruz, yasatiyoruz.
 */
export function Welcome({ onDone }: { onDone: () => void }) {
  const [adim, setAdim] = useState<Adim>('vaat');
  const [secilen, setSecilen] = useState<string | null>(null);
  const [hedef, setHedef] = useState<number>(LIMIT_DEFAULT);

  const card = SHOWCASE_CARD;
  const siklar = useMemo(() => secenekler(card, CARDS, 'tr'), [card]);

  async function bitir() {
    await setState({ onboarded: true, dailyLimit: hedef });
    onDone();
  }

  // --- 1 · Vaat ---
  if (adim === 'vaat') {
    return (
      <Screen>
        <div className="flex-1 flex flex-col justify-center gap-6 py-6">
          <div className="rise text-center">
            <h1 className="word text-3xl font-extrabold leading-tight">Ezberlemeyeceksin.</h1>
            <p className="text-ink-soft mt-2 leading-relaxed max-w-[30ch] mx-auto">
              Her İngilizce kelimeyi benzer sesli bir Türkçe kelimeye bağlayacaksın.
            </p>
          </div>

          <Card className="rise delay-1">
            <CardVisual card={card} />
            <div className="flex flex-col items-center gap-3 pt-5">
              <p className="word text-[2.5rem] leading-none font-extrabold">{card.en}</p>
              <p className="word text-xl leading-none font-semibold text-ink-soft">{card.tr}</p>
              <HookChip big>
                {card.en} ≈ {card.hook}
              </HookChip>
              <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">
                “{card.sentence}”
              </p>
            </div>
          </Card>
        </div>

        <div className="shrink-0 rise delay-2">
          <Button variant="brand" onClick={() => setAdim('dene')}>
            Devam
          </Button>
        </div>
      </Screen>
    );
  }

  // --- 2 · Kendin dene: kart kayboldu, kanca kaldi mi? ---
  if (adim === 'dene') {
    const dogru = secilen === card.tr;

    return (
      <Screen>
        <div className="flex-1 flex flex-col justify-center gap-6 py-6">
          {secilen === null ? (
            <>
              <div className="rise text-center">
                <p className="text-sm text-ink-faint">Kart kayboldu. Sende ne kaldı?</p>
                <p className="word text-[3rem] leading-none font-extrabold mt-3">{card.en}</p>
                <p className="text-ink-soft mt-3">ne demekti?</p>
              </div>

              <div className="rise delay-1 grid gap-2.5">
                {siklar.map((o) => (
                  <button
                    key={o}
                    onClick={() => setSecilen(o)}
                    className="rounded-full bg-white px-5 py-4 font-bold text-ink shadow-[var(--shadow-soft)] transition-all active:scale-[0.98]"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rise text-center">
              <div className="pop text-6xl mb-4">{dogru ? '✓' : '🌱'}</div>
              <h1 className="word text-3xl font-extrabold leading-tight">
                {dogru ? 'Hiç ezberlemedin.' : 'Olsun.'}
              </h1>
              <p className="text-ink-soft mt-3 leading-relaxed max-w-[28ch] mx-auto">
                {dogru
                  ? `Kanca tuttu: ${card.en} ≈ ${card.hook}. Yöntem bu kadar.`
                  : `Kanca birkaç tekrarda oturuyor: ${card.en} ≈ ${card.hook}. Acelesi yok.`}
              </p>
              <div className="mt-6 inline-flex">
                <HookChip big>
                  {card.en} ≈ {card.hook}
                </HookChip>
              </div>
            </div>
          )}
        </div>

        {secilen !== null && (
          <div className="shrink-0 rise delay-1">
            <Button variant="brand" onClick={() => setAdim('hedef')}>
              Devam
            </Button>
          </div>
        )}
      </Screen>
    );
  }

  // --- 3 · Gunluk hedef ---
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center gap-6 py-6">
        <div className="rise text-center">
          <h1 className="word text-3xl font-extrabold leading-tight">Günde kaç kelime?</h1>
          <p className="text-ink-soft mt-2 leading-relaxed max-w-[30ch] mx-auto">
            Hedef dolunca gün kapanır, tekrarlar devam eder.
          </p>
        </div>

        <div className="rise delay-1 flex gap-2.5">
          {LIMIT_CHOICES.map((n) => {
            const secili = hedef === n;
            return (
              <button
                key={n}
                onClick={() => setHedef(n)}
                className={`flex-1 rounded-card py-6 transition-all active:scale-95 ${
                  secili
                    ? 'bg-brand text-white shadow-[0_12px_26px_-12px_rgba(79,146,246,0.9)]'
                    : 'bg-white text-ink shadow-[var(--shadow-soft)]'
                }`}
              >
                <span className="word block text-4xl font-extrabold tabular-nums">{n}</span>
                <span className="block text-xs mt-1 opacity-80">kelime</span>
                {n === LIMIT_DEFAULT && (
                  <span
                    className={`block text-[10px] font-bold mt-1.5 ${
                      secili ? 'text-white/85' : 'text-brand-deep'
                    }`}
                  >
                    önerilen
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="rise delay-2 text-center text-sm text-ink-faint">
          Sonra Ayarlar'dan değiştirebilirsin.
        </p>
      </div>

      <div className="shrink-0 rise delay-3">
        {/* "Baslayalim" ders hemen basliyor demekti; artik ana ekrana dusuyor */}
        <Button variant="brand" onClick={() => void bitir()}>
          Hazırım
        </Button>
      </div>
    </Screen>
  );
}
