import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TabBar, type Tab } from './components/TabBar';
import { CARDS, DAILY_REVIEW_CAP, DECKS, NEW_PER_DAY } from './content';
import { db, getState, setState } from './db';
import { todayKey } from './dates';
import { dueQueue, isTestUnlocked, newCardsToday } from './scheduler';
import { DeckTest } from './screens/DeckTest';
import { Home } from './screens/Home';
import { IntroSession } from './screens/IntroSession';
import { ProgressScreen } from './screens/Progress';
import { ReviewSession } from './screens/ReviewSession';
import { SessionDone } from './screens/SessionDone';
import { Welcome } from './screens/Welcome';
import { Words } from './screens/Words';
import type { Card, Progress } from './types';

/** Sekmeli ekranlarin disindaki akislar — alt menu bunlarda gizli. */
type Flow =
  | { name: 'intro'; cards: Card[] }
  | { name: 'review'; queue: Progress[] }
  | { name: 'test'; deck: number }
  | { name: 'done'; kind: 'intro' | 'review'; count: number; streak: number }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>('ogren');
  const [flow, setFlow] = useState<Flow>(null);

  const data = useLiveQuery(async () => {
    const [progress, state] = await Promise.all([db.progress.toArray(), getState()]);
    return { progress, state };
  }, []);

  if (!data) return null;

  const { progress, state } = data;
  const kapat = () => setFlow(null);
  const test = (deck: number) => setFlow({ name: 'test', deck });

  // Sifirlama sonrasi da buraya dusulur — kullaniciyi kaldigi sekmede
  // degil, basa dondurmek gerek.
  if (!state.onboarded) {
    return (
      <Welcome
        onDone={() => {
          setTab('ogren');
          kapat();
        }}
      />
    );
  }

  // --- Akislar: tam ekran, alt menu yok ---
  if (flow?.name === 'intro') {
    return (
      <IntroSession
        cards={flow.cards}
        onExit={kapat}
        onFinish={(count, streak) => setFlow({ name: 'done', kind: 'intro', count, streak })}
      />
    );
  }
  if (flow?.name === 'review') {
    return (
      <ReviewSession
        queue={flow.queue}
        onExit={kapat}
        onFinish={(count, streak) => setFlow({ name: 'done', kind: 'review', count, streak })}
      />
    );
  }
  if (flow?.name === 'test') {
    return <DeckTest deck={flow.deck} onExit={kapat} />;
  }
  if (flow?.name === 'done') {
    const byId = new Map(progress.map((p) => [p.cardId, p]));
    const testDeck = DECKS.map((d) => d.n).find(
      (n) => isTestUnlocked(n, byId) && !state.deckTests[n]?.passedAt,
    );
    return (
      <SessionDone
        kind={flow.kind}
        count={flow.count}
        streak={flow.streak}
        testDeck={testDeck}
        onHome={kapat}
        onTest={test}
      />
    );
  }

  // --- Sekmeler ---
  const due = dueQueue(progress);
  const newCards = newCardsToday(progress, new Date(), state.extraNew);
  const introducedCount = progress.filter((p) => p.introduced).length;

  return (
    <>
      {tab === 'ogren' && (
        <Home
          progress={progress}
          state={state}
          due={due}
          newCards={newCards}
          moreLeft={introducedCount < CARDS.length}
          onReview={() => setFlow({ name: 'review', queue: due.slice(0, DAILY_REVIEW_CAP) })}
          onIntro={() => setFlow({ name: 'intro', cards: newCards })}
          onMoreNew={() => {
            const today = todayKey();
            const had = state.extraNew?.date === today ? state.extraNew.count : 0;
            void setState({ extraNew: { date: today, count: had + NEW_PER_DAY } });
          }}
          onTest={test}
        />
      )}
      {tab === 'kelimeler' && <Words progress={progress} />}
      {tab === 'ilerleme' && <ProgressScreen state={state} progress={progress} />}

      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
