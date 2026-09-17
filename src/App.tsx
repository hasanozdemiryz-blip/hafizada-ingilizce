import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DAILY_REVIEW_CAP } from './content';
import { db, getState } from './db';
import { dueQueue, newCardsToday } from './scheduler';
import { DeckTest } from './screens/DeckTest';
import { Home } from './screens/Home';
import { IntroSession } from './screens/IntroSession';
import { ReviewSession } from './screens/ReviewSession';
import type { Card, Progress } from './types';

type Route =
  | { name: 'home' }
  | { name: 'intro'; cards: Card[] }
  | { name: 'review'; queue: Progress[] }
  | { name: 'test'; deck: number };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const data = useLiveQuery(async () => {
    const [progress, state] = await Promise.all([db.progress.toArray(), getState()]);
    return { progress, state };
  }, []);

  if (!data) return null;

  const { progress, state } = data;
  const home = () => setRoute({ name: 'home' });

  switch (route.name) {
    case 'intro':
      return <IntroSession cards={route.cards} onExit={home} />;
    case 'review':
      return <ReviewSession queue={route.queue} onExit={home} />;
    case 'test':
      return <DeckTest deck={route.deck} onExit={home} />;
    default: {
      // Seans basladiginda kuyruk dondurulur — seans ortasinda liste degismesin.
      const due = dueQueue(progress);
      const newCards = newCardsToday(progress);
      return (
        <Home
          progress={progress}
          state={state}
          dueCount={due.length}
          newCards={newCards}
          onReview={() => setRoute({ name: 'review', queue: due.slice(0, DAILY_REVIEW_CAP) })}
          onIntro={() => setRoute({ name: 'intro', cards: newCards })}
          onTest={(deck) => setRoute({ name: 'test', deck })}
        />
      );
    }
  }
}
