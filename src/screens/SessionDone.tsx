import { Button, Screen, Streak } from '../components/ui';

/**
 * Seans bitisi.
 * Once seans sessizce ana ekrana dusuyordu — kapanis yoktu.
 * Serinin ve (gorseller gelince) paylasimin yasayacagi yer burasi.
 */
export function SessionDone({
  kind,
  count,
  streak,
  testDeck,
  onHome,
  onTest,
}: {
  kind: 'intro' | 'review';
  count: number;
  streak: number;
  testDeck?: number;
  onHome: () => void;
  onTest: (deck: number) => void;
}) {
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center items-center gap-5 text-center">
        <div className="pop text-6xl">{kind === 'intro' ? '🌱' : '✓'}</div>

        <div className="rise delay-1">
          <h1 className="word text-3xl font-semibold">
            {kind === 'intro' ? 'Tanıştınız' : 'Tekrar bitti'}
          </h1>
          <p className="text-ink-soft mt-2">
            {kind === 'intro'
              ? `${count} yeni kelime havuza girdi.`
              : `${count} kart tekrar edildi.`}
          </p>
        </div>

        {streak > 0 && (
          <div className="rise delay-2">
            <Streak count={streak} />
            <p className="text-sm text-ink-faint mt-2">
              {streak === 1 ? 'İlk günün' : `${streak} gündür üst üste`}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 rise delay-3">
        {testDeck !== undefined && (
          <Button variant="brand" onClick={() => onTest(testDeck)}>
            Deste {testDeck} testi hazır
          </Button>
        )}
        <Button variant={testDeck !== undefined ? 'soft' : 'primary'} onClick={onHome}>
          Ana ekran
        </Button>
      </div>
    </Screen>
  );
}
