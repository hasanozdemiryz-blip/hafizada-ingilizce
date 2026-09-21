import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TabBar, type Tab } from './components/TabBar';
import {
  AGIR_TEKRAR,
  AHEAD_BATCH,
  DAILY_REVIEW_CAP,
  ogrenilenKancalar,
  setBittiMi,
  setteOlanlar,
} from './content';
import { db, getState } from './db';
import {
  aheadQueue,
  dueQueue,
  introducedToday,
  nextBatch,
  remainingToday,
  todaysCards,
} from './scheduler';
import { Home } from './screens/Home';
import { Lesson } from './screens/Lesson';
import { Practice } from './screens/Practice';
import { ProgressScreen } from './screens/Progress';
import { SessionDone } from './screens/SessionDone';
import { Welcome } from './screens/Welcome';
import { Settings } from './screens/Settings';
import { Splash } from './screens/Splash';
import { useToday } from './today';
import { WordList } from './screens/WordList';
import type { Card, Progress } from './types';

/** Sekmeli ekranlarin disindaki akis — alt menu burada gizli. */
type Flow =
  | {
      name: 'ders';
      yeni: Card[];
      tekrar: Progress[];
      eslestirmesiz?: boolean;
      tekrarOnce?: boolean;
    }
  | {
      name: 'done';
      count: number;
      streak: number;
      dogru: number;
      toplam: number;
      ilerleyen: number;
      yeni: number;
    }
  | { name: 'kelimeler' }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>('ogren');
  const [flow, setFlow] = useState<Flow>(null);
  const [egzersizde, setEgzersizde] = useState(false);

  /*
    Gunun degistigini fark eden yer BURASI (bkz. today.ts). Onceden
    `new Date()` yalnizca render aninda okunuyordu ve render de ancak
    veritabani degisince oluyordu: uygulama acik dururken gece yarisi
    gecilince ekran dunun durumunda donuyordu. Anahtar sorgunun bagimliligi
    oldugu icin gun donunce kuyruklar da bastan hesaplanir.
  */
  const bugun = useToday();

  const data = useLiveQuery(async () => {
    const [hepsi, state] = await Promise.all([db.progress.toArray(), getState()]);
    // Setten cikmis kartlarin kaydi burada elenir; tek kapi (bkz. content.ts)
    return { progress: setteOlanlar(hepsi), state };
  }, [bugun]);

  if (!data) return <Splash />;

  const { progress, state } = data;
  const kapat = () => setFlow(null);

  // Sifirlama sonrasi da buraya dusulur — kullaniciyi kaldigi sekmede
  // degil, basa dondurmek gerek.
  if (!state.onboarded) {
    return (
      <Welcome
        onDone={() => {
          /*
            Bir sure DOGRUDAN ilk derse giriliyordu — bir karar eksiltmek
            icin. Kotu tarafi: kullanici hazir olup olmadigi sorulmadan
            derse dusuyordu ve geri cikmanin yolu "dersi yarida birak"
            uyarisiydi. Artik ana ekrana dusuyor; ilk ders orada kendi
            karti olarak bekliyor (bkz. Home, `ilkDers`), baslatan o.
          */
          setTab('ogren');
        }}
      />
    );
  }

  if (flow?.name === 'ders') {
    return (
      <Lesson
        yeniKartlar={flow.yeni}
        tekrarKuyrugu={flow.tekrar}
        sound={state.sound}
        eslestirmesiz={flow.eslestirmesiz}
        tekrarOnce={flow.tekrarOnce}
        onExit={kapat}
        onFinish={(ozet) => setFlow({ name: 'done', ...ozet })}
      />
    );
  }
  if (flow?.name === 'kelimeler') {
    return <WordList progress={progress} onExit={kapat} />;
  }
  if (flow?.name === 'done') {
    return (
      <SessionDone
        count={flow.count}
        streak={flow.streak}
        dogru={flow.dogru}
        toplam={flow.toplam}
        ilerleyen={flow.ilerleyen}
        /*
          Final YALNIZCA seti bitiren derste. Yeni kelime getirmeyen bir
          tekrar dersi de "set bitmis" durumda biter; her seferinde kutlarsa
          kutlama anlamini yitirir.
        */
        setBitti={flow.yeni > 0 && setBittiMi(progress)}
        kancalar={ogrenilenKancalar(progress)}
        onHome={kapat}
      />
    );
  }

  const due = dueQueue(progress);
  const newCards = nextBatch(progress, state.dailyLimit);
  const bugununKartlari = todaysCards(progress);
  const ahead = aheadQueue(progress, AHEAD_BATCH);

  return (
    <>
      {tab === 'ogren' && (
        <Home
          progress={progress}
          state={state}
          bugun={bugun}
          due={due}
          newCards={newCards}
          todayCount={introducedToday(progress)}
          remaining={remainingToday(progress, state.dailyLimit)}
          todaysCount={bugununKartlari.length}
          aheadCount={ahead.length}
          agirTekrar={AGIR_TEKRAR}
          onStart={() =>
            setFlow({ name: 'ders', yeni: newCards, tekrar: due.slice(0, DAILY_REVIEW_CAP) })
          }
          /* Ayni ders, yalnizca tekrar bolumu basta — bkz. AGIR_TEKRAR */
          onReviewFirst={() =>
            setFlow({
              name: 'ders',
              yeni: newCards,
              tekrar: due.slice(0, DAILY_REVIEW_CAP),
              tekrarOnce: true,
            })
          }
          onQuickReview={() =>
            setFlow({ name: 'ders', yeni: [], tekrar: bugununKartlari, eslestirmesiz: true })
          }
          onPractice={() => setFlow({ name: 'ders', yeni: [], tekrar: ahead })}
        />
      )}
      {tab === 'egzersiz' && (
        <Practice progress={progress} sound={state.sound} onRunning={setEgzersizde} />
      )}
      {tab === 'ilerleme' && (
        <ProgressScreen
          state={state}
          progress={progress}
          onWords={() => setFlow({ name: 'kelimeler' })}
        />
      )}
      {tab === 'ayarlar' && <Settings state={state} progress={progress} />}

      {/* Egzersiz kosarken menu gizlenir: tam ekran odak, ve dugmeler menunun altinda kalmaz */}
      {!egzersizde && <TabBar active={tab} onChange={setTab} />}
    </>
  );
}
