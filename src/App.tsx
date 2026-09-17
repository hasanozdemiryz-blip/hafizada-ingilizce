import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DAILY_REVIEW_CAP, DECKS } from './content';
import { db, getState } from './db';
import { dueQueue, isTestUnlocked, newCardsToday } from './scheduler';
import { DeckTest } from './screens/DeckTest';
import { Home } from './screens/Home';
import { IntroSession } from './screens/IntroSession';
import { ReviewSession } from './screens/ReviewSession';
import { SessionDone } from './screens/SessionDone';
import { Welcome } from './screens/Welcome';
import type { Card, Progress } from './types';

type Route =
  | { name: 'home' }
  | { name: 'intro'; cards: Card[] }
  | { name: 'review'; queue: Progress[] }
  | { name: 'test'; deck: number }
  | { name: 'done'; kind: 'intro' | 'review'; count: number; streak: number };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const data = useLiveQuery(async () => {
    const [progress, state] = await Promise.all([db.progress.toArray(), getState()]);
    return { progress, state };
  }, []);

  if (!data) return null;

  const { progress, state } = data;
  const home = () => setRoute({ name: 'home' });
  const test = (deck: number) => setRoute({ name: 'test', deck });

  if (!state.onboarded) return <Welcome onDone={home} />;

  switch (route.name) {
    case 'intro':
      return (
        <IntroSession
          cards={route.cards}
          onExit={home}
          onFinish={(count, streak) => setRoute({ name: 'done', kind: 'intro', count, streak })}
        />
      );

    case 'review':
      return (
        <ReviewSession
          queue={route.queue}
          onExit={home}
          onFinish={(count, streak) => setRoute({ name: 'done', kind: 'review', count, streak })}
        />
      );

    case 'test':
      return <DeckTest deck={route.deck} onExit={home} />;

    case 'done': {
      const byId = new Map(progress.map((p) => [p.cardId, p]));
      const testDeck = DECKS.map((d) => d.n).find(
        (n) => isTestUnlocked(n, byId) && !state.deckTests[n]?.passedAt,
      );
      return (
        <SessionDone
          kind={route.kind}
          count={route.count}
          streak={route.streak}
          testDeck={testDeck}
          onHome={home}
          onTest={test}
        />
      );
    }

    default: {
      // Seans basladiginda kuyruk dondurulur — seans ortasinda liste degismesin.
      const due = dueQueue(progress);
      const newCards = newCardsToday(progress);
      return (
        <Home
          progress={progress}
          state={state}
          due={due}
          newCards={newCards}
          onReview={() => setRoute({ name: 'review', queue: due.slice(0, DAILY_REVIEW_CAP) })}
          onIntro={() => setRoute({ name: 'intro', cards: newCards })}
          onTest={test}
        />
      );
    }
  }
}
