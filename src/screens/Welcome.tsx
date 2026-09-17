import { CardVisual } from '../components/CardVisual';
import { Button, Card, HookChip, Screen } from '../components/ui';
import { SHOWCASE_CARD } from '../content';
import { setState } from '../db';

/**
 * Ilk karsilasma.
 *
 * Arastirma net: uygulamalar ilk hafta kullanicinin cogunu "aha" anina
 * hic varamadigi icin kaybediyor. Bu urunun "aha"si kontrol panelinde
 * degil, TEK BIR KARTTA. O yuzden uygulama dashboard'la degil kartla acilir.
 */
export function Welcome({ onDone }: { onDone: () => void }) {
  const card = SHOWCASE_CARD;

  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center gap-6 py-6">
        <div className="rise text-center">
          <h1 className="word text-3xl font-semibold leading-tight">Ezberlemeyeceksin.</h1>
          <p className="text-ink-soft mt-2 leading-relaxed max-w-[30ch] mx-auto">
            Her İngilizce kelimeyi benzer sesli bir Türkçe kelimeye ve tek bir görüntüye
            bağlayacaksın.
          </p>
        </div>

        <Card className="rise delay-1" tilt>
          <CardVisual card={card} />
          <div className="flex flex-col items-center gap-3 pt-5">
            <p className="word text-[2.5rem] leading-none font-semibold">{card.en}</p>
            <p className="word text-xl leading-none text-ink-soft">{card.tr}</p>
            <HookChip big>
              {card.en} ≈ {card.hook}
            </HookChip>
            <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">
              “{card.sentence}”
            </p>
          </div>
        </Card>

        <p className="rise delay-2 text-center text-sm text-ink-faint max-w-[32ch] mx-auto leading-relaxed">
          Bağ kurulduktan sonra destek yavaş yavaş kalkar. Sonunda geriye
          sadece kelime kalır.
        </p>
      </div>

      <div className="shrink-0 rise delay-3">
        <Button
          variant="brand"
          onClick={async () => {
            await setState({ onboarded: true });
            onDone();
          }}
        >
          Başlayalım
        </Button>
      </div>
    </Screen>
  );
}
