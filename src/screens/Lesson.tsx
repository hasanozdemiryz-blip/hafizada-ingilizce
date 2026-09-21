import { useCallback, useMemo, useRef, useState } from 'react';
import { LearnFace } from '../components/CardFace';
import { Runner } from '../components/Runner';
import { ADIMLAR, type Gorev } from '../exercise';
import { BackButton, Button, Progressbar, Screen, TopBar } from '../components/ui';
import { CARD_BY_ID } from '../content';
import { db, logAnswer, logSession } from '../db';
import { introduceCard, learningCheck, learningDone, reviewCard } from '../scheduler';
import type { Card, Progress, Step } from '../types';

type Bolum = 'yeni' | 'ogrenme' | 'tekrar';

/**
 * DERS — gunun tek akisi.
 *
 * Onceki surumde "Tanis" ve "Tekrarla" iki ayri dugmeydi; kullanici hangi
 * ise once girecegine karar vermek zorundaydi. Artik tek "Basla" var ve
 * bolumler arka arkaya geliyor:
 *
 *   1 Yeni kelimeler — kart gosterilir, soru sorulmaz
 *   2 Ogrenme testi  — AYNI kelimeler, merdivenin 1-2. basamagi
 *   3 Tekrar         — vadesi gelen eski kartlar, kendi basamaklarinda
 *
 * Bolum 2, kartin ilk FSRS notunu veren yerdir (bkz. `learningCheck`).
 * Kalici hafizayi olcmez — kelime hala taze — ama kancanin ilk denemede
 * tutup tutmadigini olcer ve bunu kullaniciya SORMAK zorunda birakmaz.
 */
export function Lesson({
  yeniKartlar,
  tekrarKuyrugu,
  sound,
  eslestirmesiz = false,
  tekrarOnce = false,
  onExit,
  onFinish,
}: {
  yeniKartlar: Card[];
  tekrarKuyrugu: Progress[];
  sound: boolean;
  /**
   * Hizli tekrarda eslestirme sorulmaz.
   *
   * Eslestirme bes karti bir arada gosterir ve dogru cevap ekranda durur —
   * yeni kelimeyle ILK temas icin dogru, ayni gun ucuncu kez gorulen
   * kelime icin fazla kolay. 1. basamaktakiler coktan secmeli sorulur.
   */
  eslestirmesiz?: boolean;
  /**
   * Tekrar bolumu basa alinir.
   *
   * Ana ekranda ayri bir "eskileri tekrar et" dugmesi ACILMADI: uc giris
   * noktasini tek "Basla"ya indirmek bu urunun en buyuk kazancıydı ve
   * tekrari atlanabilir yapmak tekrar borcunu sessizce buyutur. Ama tekrar
   * yuku agirken kullanicinin "once sunlari halledeyim" demesi mesru —
   * bu yalnizca SIRAYI degistirir, hicbir bolumu atlamaz.
   */
  tekrarOnce?: boolean;
  onExit: () => void;
  onFinish: (ozet: {
    count: number;
    streak: number;
    dogru: number;
    toplam: number;
    ilerleyen: number;
    /** Bu derste TANISILAN kelime sayisi — set sonu ani buradan anlasiliyor */
    yeni: number;
  }) => void;
}) {
  const [bolum, setBolum] = useState<Bolum>(() =>
    tekrarOnce && tekrarKuyrugu.length > 0 ? 'tekrar' : yeniKartlar.length > 0 ? 'yeni' : 'tekrar',
  );
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cikisSoruluyor, setCikisSoruluyor] = useState(false);

  /**
   * Yeni kartlar once BELLEKTE tutulur, veritabanina ogrenme testi
   * bitince topluca yazilir.
   *
   * Once her kart gorulur gorulmez yaziliyordu. Sonucu kotuydu: yarida
   * cikan kullanicinin kartlari "tanisildi" sayilip ogrenme testini hic
   * gormuyor, ertesi gun 1. basamakta tekrar olarak geri geliyordu.
   * Ders artik BUTUN: ya tamamlanir ya bastan baslanir.
   */
  const yeniKayitlar = useRef(new Map<string, Progress>());

  /** Seansin kendi sayaclari — bitis ekrani bunlari gosterir. */
  const sayac = useRef({ dogru: 0, toplam: 0, ilerleyen: 0 });

  /**
   * Ogrenme testinde kelime basina "2. basamagi yardimsiz gecti mi".
   *
   * Once olcut "ALTI gorevin hepsi temiz"ti ve pratikte hic tutmuyordu:
   * gercek bir derste bes kelimenin besinde de en az bir hata cikti,
   * hicbiri ilerlemedi. Olcut artik tek ve net — cokten secmeliyi
   * kancaya basmadan dogru yapmak tanimayi gectin demektir (bkz.
   * `learningDone`).
   */
  const tanimaGecti = useRef(new Map<string, boolean>());

  /** Yeni kartlar iki yerden yazilmaya cagriliyor; ikinci cagri bos gecer. */
  const yazildi = useRef(false);

  const toplam = yeniKartlar.length + new Set(tekrarKuyrugu.map((p) => p.cardId)).size;

  /**
   * Ogrenme testi merdivenin TUM basamaklarini sirayla kosar:
   * eslestirme -> coktan secmeli -> ters secmeli -> harf dizme ->
   * yazma -> dinleme. Kelime taze oldugu icin en ust basamaklar bile
   * yapilabilir; amac olcmek degil, yeni kurulan bagi ayni oturumda
   * her yonden bir kez kullandirmak.
   *
   * Once yalnizca ilk iki basamak kosuluyordu ve ders bir anda bitiyordu.
   *
   * Merdiveni yine de OYNATMAZ (bkz. scheduler.ts `learningCheck`):
   * buradaki basari kalici hafizanin degil, tazeligin sonucu.
   */
  const ogrenmeGorevleri = useMemo<Gorev[]>(
    () => ADIMLAR.flatMap((step) => yeniKartlar.map((c): Gorev => ({ card: c, step }))),
    [yeniKartlar],
  );

  /**
   * Bolumlerin SIRASI tek yerde duruyor.
   *
   * Once gecisler dagilmisti ("ogrenme bitti -> tekrar var mi?"). Sira bir
   * liste olunca "once tekrar" istegi tek satirda ifade ediliyor ve ekranda
   * "Bolum 2/3" yazmak da mumkun oluyor — kullanici tekrarin derse DAHIL
   * oldugunu gorsun diye; ayri bir tekrar dugmesi istegi buradan doguyordu.
   */
  const tekrarGorevleri = useMemo<Gorev[]>(
    () =>
      tekrarKuyrugu
        .map((p) => {
          const card = CARD_BY_ID.get(p.cardId);
          if (!card) return null;
          const step = eslestirmesiz && p.step === 1 ? 2 : p.step;
          return { card, step } as Gorev;
        })
        .filter((g): g is Gorev => g !== null),
    [tekrarKuyrugu, eslestirmesiz],
  );

  const bolumler = useMemo<Bolum[]>(() => {
    const liste: Bolum[] = [];
    const tekrarVar = tekrarGorevleri.length > 0;
    if (tekrarOnce && tekrarVar) liste.push('tekrar');
    if (yeniKartlar.length > 0) liste.push('yeni', 'ogrenme');
    if (!tekrarOnce && tekrarVar) liste.push('tekrar');
    return liste;
  }, [tekrarOnce, tekrarGorevleri.length, yeniKartlar.length]);

  /** Ogrenme testi: merdiveni oynatmaz, yalnizca ilk notu ve olcumu yazar. */
  const ogrenmeSonucu = useCallback(
    async (cardId: string, ok: boolean, hookRevealed: boolean, step: Step) => {
      sayac.current.toplam++;
      if (ok) sayac.current.dogru++;
      void logAnswer({ cardId, ok, step, ipucu: hookRevealed, kaynak: 'ders' });

      if (step === 2) tanimaGecti.current.set(cardId, ok && !hookRevealed);

      const p = yeniKayitlar.current.get(cardId);
      if (p) yeniKayitlar.current.set(cardId, learningCheck(p, ok));
    },
    [],
  );

  /** Ogrenme testi bitti: yeni kartlar artik kalici. */
  const yeniKartlariYaz = useCallback(async () => {
    if (yazildi.current) return;
    yazildi.current = true;

    const kayitlar = [...yeniKayitlar.current.values()].map((p) => {
      const sonra = learningDone(p, tanimaGecti.current.get(p.cardId) === true);
      if (sonra.step > p.step) sayac.current.ilerleyen++;
      return sonra;
    });
    if (kayitlar.length > 0) await db.progress.bulkPut(kayitlar);
  }, []);

  /** Tekrar: merdiveni oynatir. */
  const tekrarSonucu = useCallback(
    async (cardId: string, ok: boolean, hookRevealed: boolean, step: Step) => {
      sayac.current.toplam++;
      if (ok) sayac.current.dogru++;
      void logAnswer({ cardId, ok, step, ipucu: hookRevealed, kaynak: 'ders' });

      const p = await db.progress.get(cardId);
      if (!p) return;
      const { progress: sonra } = reviewCard(p, ok, hookRevealed);
      if (sonra.step > p.step) sayac.current.ilerleyen++;
      await db.progress.put(sonra);
    },
    [],
  );

  /** Kart bellege alinir; not verilmez — ilk not ogrenme testinden gelir. */
  function kartiGor(card: Card) {
    if (!yeniKayitlar.current.has(card.id)) {
      yeniKayitlar.current.set(card.id, introduceCard(card));
    }
    if (i + 1 >= yeniKartlar.length) gec('yeni');
    else setI(i + 1);
  }

  /** Siradaki bolume gecer; sira bittiyse (ya da bolum listede yoksa) dersi kapatir. */
  function gec(simdiki: Bolum) {
    const yer = bolumler.indexOf(simdiki);
    const sonraki = yer >= 0 ? bolumler[yer + 1] : undefined;
    if (sonraki) setBolum(sonraki);
    else void bitir();
  }

  async function bitir() {
    if (busy) return;
    setBusy(true);
    const { dogru, toplam: cevap, ilerleyen } = sayac.current;
    const state = await logSession(toplam, dogru, cevap - dogru);
    onFinish({
      count: toplam,
      streak: state.streakCount,
      dogru,
      toplam: cevap,
      ilerleyen,
      yeni: yeniKartlar.length,
    });
  }

  const basilik: Record<Bolum, string> = {
    yeni: 'Yeni kelimeler',
    ogrenme: 'Öğrenme testi',
    tekrar: 'Tekrar',
  };

  /*
    Bolum sayisi ekranda: tekrar dersin ICINDE oldugu gorunsun. Tek bolumlu
    derste sayi yazmak gurultu — o zaman yalnizca bolumun adi kaliyor.
  */
  const bolumEtiketi =
    bolumler.length > 1
      ? `Bölüm ${bolumler.indexOf(bolum) + 1}/${bolumler.length} · ${basilik[bolum]}`
      : basilik[bolum];

  /**
   * Cikis, yeni kelimeler daha kalici degilken CIDDI bir kayip.
   * O yuzden dogrudan cikilmaz; ne kaybedilecegi acikca yazilir.
   * Tarayicinin `confirm()` kutusu kullanilmiyor: PWA'da bloklayan
   * sistem diyalogu hem cirkin hem de akisi donduruyor.
   */
  const yeniKaybolacak = bolum === 'yeni' || bolum === 'ogrenme';
  const cikmakIstiyor = () => (yeniKaybolacak ? setCikisSoruluyor(true) : onExit());

  const uyari = cikisSoruluyor ? (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 px-5 pb-8 backdrop-blur-sm">
      <div className="rise w-full max-w-md rounded-card bg-white p-6 shadow-[var(--shadow-lift)]">
        <p className="word text-xl font-extrabold">Ders yarıda kalacak</p>
        <p className="text-sm text-ink-soft mt-2">
          Bu dersin <b>{yeniKartlar.length} yeni kelimesi henüz kaydedilmedi</b>. Şimdi
          çıkarsan hiçbiri öğrenilmiş sayılmaz ve ders bir dahakine <b>baştan</b> başlar.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <Button variant="brand" onClick={() => setCikisSoruluyor(false)}>
            Derse dön
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Yine de çık
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // --- Bolum 1: yeni kartlar ---
  if (bolum === 'yeni') {
    const card = yeniKartlar[i];
    if (!card) return null;
    return (
      <Screen>
        <TopBar
          left={<BackButton onClick={cikmakIstiyor} />}
          right={
            <span>
              {i + 1} / {yeniKartlar.length}
            </span>
          }
        />
        <Progressbar done={i} total={yeniKartlar.length} />
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint mt-2">
          {bolumEtiketi}
        </p>

        <div key={card.id} className="rise flex-1 flex flex-col justify-center py-6">
          <LearnFace card={card} />
        </div>

        <div className="shrink-0">
          <Button variant="brand" onClick={() => kartiGor(card)}>
            Devam
          </Button>
        </div>
        {uyari}
      </Screen>
    );
  }

  // --- Bolum 2 ve 3: merdiven motoru ---
  const gorevler = bolum === 'ogrenme' ? ogrenmeGorevleri : tekrarGorevleri;
  const sonuc = bolum === 'ogrenme' ? ogrenmeSonucu : tekrarSonucu;

  if (gorevler.length === 0) {
    if (bolum === 'ogrenme') void yeniKartlariYaz().then(() => gec('ogrenme'));
    else gec(bolum);
    return null;
  }

  return (
    <Screen>
      <TopBar left={<BackButton onClick={cikmakIstiyor} />} />
      <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
        {bolumEtiketi}
      </p>
      <Runner
        key={bolum}
        gorevler={gorevler}
        sound={sound}
        sirali={bolum === 'ogrenme'}
        onResult={sonuc}
        onDone={() => {
          if (bolum === 'ogrenme') void yeniKartlariYaz().then(() => gec('ogrenme'));
          else gec(bolum);
        }}
      />
      {uyari}
    </Screen>
  );
}
