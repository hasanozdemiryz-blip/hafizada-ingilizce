import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { olay } from './analitik';
import { TabBar, type Tab } from './components/TabBar';
import {
  AGIR_TEKRAR,
  AHEAD_BATCH,
  DAILY_REVIEW_CAP,
  ogrenilenKancalar,
  setBittiMi,
  setteOlanlar,
} from './content';
import { db, getState, setState } from './db';
import {
  aheadQueue,
  dueQueue,
  introducedToday,
  nextBatch,
  spareCards,
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
import { ProfilDuzenle } from './screens/ProfilDuzenle';
import { gecerliCerceve, type Kazanim } from './cerceveler';
import { uygulamadanCik, useGeri } from './geri';
// `Card` adi types.ts'teki KART tipiyle cakisiyor; arayuz bileseni takma adla.
import { Button, Card as Kutu } from './components/ui';
import { profilDuzelt } from './profil';
import { Splash } from './screens/Splash';
import { useToday } from './today';
import { WordList } from './screens/WordList';
import type { Card, Progress } from './types';

/** Sekmeli ekranlarin disindaki akis — alt menu burada gizli. */
type Flow =
  | {
      name: 'ders';
      yeni: Card[];
      /** "Biliyorum" denince yerine kayacak kartlar */
      yedek: Card[];
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
  | { name: 'profil' }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>('ogren');
  const [flow, setFlow] = useState<Flow>(null);
  const [egzersizde, setEgzersizde] = useState(false);
  const [cikisSoruluyor, setCikisSoruluyor] = useState(false);

  /*
    Gunun degistigini fark eden yer BURASI (bkz. today.ts). Onceden
    `new Date()` yalnizca render aninda okunuyordu ve render de ancak
    veritabani degisince oluyordu: uygulama acik dururken gece yarisi
    gecilince ekran dunun durumunda donuyordu. Anahtar sorgunun bagimliligi
    oldugu icin gun donunce kuyruklar da bastan hesaplanir.
  */
  const bugun = useToday();

  /**
   * DONANIM GERI TUSU — en dis katman (oncelik 0).
   *
   * Ic ekranlar (ders, egzersiz) kendi isleyicilerini daha yuksek oncelikle
   * kaydediyor ve once onlar soruluyor; buraya ancak onlar "ele almadim"
   * dediginde dusuluyor.
   *
   * Sira: acik bir akis varsa kapat -> sekme ana sekme degilse oraya don ->
   * ana ekranda cikis onayi. Yani geri tusu tek tek geriye yuruyor,
   * uygulamayi bir anda kapatmiyor.
   *
   * Kanca KOSULSUZ cagrilmali; asagidaki `if (!data)` erken donusunden
   * once duruyor.
   */
  useGeri(() => {
    if (cikisSoruluyor) {
      setCikisSoruluyor(false);
      return true;
    }
    if (flow) {
      setFlow(null);
      return true;
    }
    if (tab !== 'ogren') {
      setTab('ogren');
      return true;
    }
    // Ana ekranda: yanlislikla basip disari dusmek en sik sikayet.
    setCikisSoruluyor(true);
    return true;
  }, 0);

  const data = useLiveQuery(async () => {
    const [hepsi, state] = await Promise.all([db.progress.toArray(), getState()]);
    // Setten cikmis kartlarin kaydi burada elenir; tek kapi (bkz. content.ts)
    return { progress: setteOlanlar(hepsi), state };
  }, [bugun]);

  if (!data) return <Splash />;

  const { progress, state: kayitliState } = data;
  const kapat = () => setFlow(null);

  /**
   * Cerceve kilitlerini acan uc sayi (bkz. cerceveler.ts).
   * Ilerleme sekmesindeki sayilarla AYNI kaynaktan okunuyor.
   */
  const kazanim: Kazanim = {
    ogrenilen: progress.filter((p) => p.introduced).length,
    // Kirilan seri kazanilmis cerceveyi geri almasin (bkz. types.ts)
    seri: kayitliState.bestStreak ?? kayitliState.streakCount,
    setBitti: setBittiMi(progress),
  };

  /**
   * Hak edilmemis cerceve OKURKEN duzeltilir.
   *
   * Yedek baska bir cihazdan geri yuklenebilir ya da ilerleme sifirlanmis
   * olabilir; o zaman profilde hala "Kraliyet" yazar ama kosul saglanmaz.
   * Kayda dokunulmuyor — kosul yeniden saglanirsa cerceve geri gelsin.
   */
  const state = kayitliState.profil
    ? {
        ...kayitliState,
        profil: {
          ...profilDuzelt(kayitliState.profil),
          cerceve: gecerliCerceve(kayitliState.profil, kazanim),
        },
      }
    : kayitliState;

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
        yedekKartlar={flow.yedek}
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
  if (flow?.name === 'profil' && state.profil) {
    return (
      <ProfilDuzenle
        profil={state.profil}
        kazanim={kazanim}
        onKapat={kapat}
        onKaydet={(profil) => {
          void setState({ profil });
          // Adin kendisi GONDERILMIYOR — yalnizca neyin degistigi.
          olay('profil_degisti', { avatar: profil.avatar.tip, cerceve: profil.cerceve });
          kapat();
        }}
      />
    );
  }
  if (flow?.name === 'done') {
    if (flow.yeni > 0 && setBittiMi(progress)) olay('set_bitti', { kelime: progress.length });
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
  /* "Bunu biliyorum" denince yerine kayacak kartlar (bkz. Lesson) */
  const yedekKartlar = spareCards(progress, newCards);
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
            setFlow({ name: 'ders', yeni: newCards, yedek: yedekKartlar, tekrar: due.slice(0, DAILY_REVIEW_CAP) })
          }
          /* Ayni ders, yalnizca tekrar bolumu basta — bkz. AGIR_TEKRAR */
          onReviewFirst={() =>
            setFlow({
              name: 'ders',
              yeni: newCards,
              yedek: yedekKartlar,
              tekrar: due.slice(0, DAILY_REVIEW_CAP),
              tekrarOnce: true,
            })
          }
          onQuickReview={() =>
            setFlow({ name: 'ders', yeni: [], yedek: [], tekrar: bugununKartlari, eslestirmesiz: true })
          }
          onPractice={() => setFlow({ name: 'ders', yeni: [], yedek: [], tekrar: ahead })}
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
      {tab === 'ayarlar' && (
        <Settings
          state={state}
          progress={progress}
          onProfil={() => setFlow({ name: 'profil' })}
        />
      )}

      {/* Egzersiz kosarken menu gizlenir: tam ekran odak, ve dugmeler menunun altinda kalmaz */}
      {!egzersizde && <TabBar active={tab} onChange={setTab} />}

      {/*
        Cikis onayi. Ana ekranda geri tusuna basilinca cikiyor — kullanici
        "genelde yanlislikla basiyorum" dedi. Varsayilan secenek KALMAK:
        birincil dugme "Vazgec", cikis ikincil. (Ayarlar'daki sifirlama
        onayiyla ayni duzen.)
      */}
      {cikisSoruluyor && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 px-5 pb-8 backdrop-blur-sm">
          <Kutu className="rise w-full max-w-md p-6">
            <p className="word text-xl font-extrabold">Çıkmak istiyor musun?</p>
            <p className="text-sm text-ink-soft mt-2">
              İlerlemen kayıtlı, kaldığın yerden devam edebilirsin.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="brand" onClick={() => setCikisSoruluyor(false)}>
                Vazgeç
              </Button>
              <Button variant="ghost" onClick={() => void uygulamadanCik()}>
                Çık
              </Button>
            </div>
          </Kutu>
        </div>
      )}
    </>
  );
}
