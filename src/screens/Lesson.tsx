import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { olay } from '../analitik';
import { useGeri } from '../geri';
import { LearnFace } from '../components/CardFace';
import { Runner } from '../components/Runner';
import { ADIMLAR, bolgelereBol, type Gorev } from '../exercise';
import { Gecis } from '../components/Gecis';
import { BackButton, Button, Progressbar, Screen, TopBar } from '../components/ui';
import { CARD_BY_ID } from '../content';
import { db, logAnswer, logSession } from '../db';
import { introduceCard, learningCheck, learningDone, markKnown, reviewCard } from '../scheduler';
import type { Card, Progress, Step } from '../types';

type Bolum = 'yeni' | 'ogrenme' | 'tekrar';

/** Ekranda duran gecis ani: ne gosterilecegi + "Devam" basilinca ne olacagi. */
type GecisAni = Omit<Parameters<typeof Gecis>[0], 'onDevam'> & { devam: () => void };

/**
 * DERS — gunun tek akisi.
 *
 * Onceki surumde "Tanis" ve "Tekrarla" iki ayri dugmeydi; kullanici hangi
 * ise once girecegine karar vermek zorundaydi. Artik tek "Basla" var ve
 * bolumler arka arkaya geliyor:
 *
 *   1 Yeni kelimeler — kart gosterilir, soru sorulmaz
 *   2 Ogrenme testi  — AYNI kelimeler, merdivenin ALTI basamagi sirayla
 *   3 Tekrar         — vadesi gelen eski kartlar, kendi basamaklarinda
 *
 * Bolum 2, kartin ilk FSRS notunu veren yerdir (bkz. `learningCheck`).
 * Kalici hafizayi olcmez — kelime hala taze — ama kancanin ilk denemede
 * tutup tutmadigini olcer ve bunu kullaniciya SORMAK zorunda birakmaz.
 */
export function Lesson({
  yeniKartlar,
  yedekKartlar,
  tekrarKuyrugu,
  sound,
  eslestirmesiz = false,
  tekrarOnce = false,
  onExit,
  onFinish,
}: {
  yeniKartlar: Card[];
  /** "Bunu biliyorum" denince yerine kayacak kartlar */
  yedekKartlar: Card[];
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
  const [cikisSoruluyor, setCikisSoruluyor] = useState(false);

  /**
   * Ogrenme testi bolge bolge kosuyor (tanima -> hatirlama -> uretim).
   * Runner bir basamagin bittigini disari VERMIYOR; bolgeleri ayri ayri
   * kosturmak o sinirlari ucretsiz veriyor ve motoru degistirmiyor.
   */
  /**
   * Dersin kartlari YEREL durumda tutuluyor, prop'tan dogrudan okunmuyor:
   * "Bunu biliyorum" denince liste degisiyor (atlanan kartin yerine yedek
   * kayiyor).
   */
  const [dersKartlari, setDersKartlari] = useState<Card[]>(yeniKartlar);
  const yedekler = useRef<Card[]>([...yedekKartlar]);

  /** "Biliyorum" denen kartlar — ders bitince digerleriyle birlikte yazilir. */
  const bilinenler = useRef<Map<string, Progress>>(new Map());

  /** Son "biliyorum" — kisa sureli "geri al" icin. */
  const [sonBilinen, setSonBilinen] = useState<{ card: Card; yer: number } | null>(null);

  const [bolgeIndex, setBolgeIndex] = useState(0);

  /** Ekranda bir gecis ani duruyorsa bolum yerine o cizilir. */
  const [gecis, setGecis] = useState<GecisAni | null>(null);

  /** Yalnizca ICINDE bulunulan bolgenin sayaci — gecis aninda gosterilir. */
  const bolgeSayac = useRef({ dogru: 0, toplam: 0 });

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

  /**
   * Ders bitisi BIR KEZ.
   *
   * Koruma bir `busy` STATE'iyle yapiliyordu ve yetmiyordu: React state'i
   * eszamanli guncellemiyor, ayni tick'te gelen iki cagri da onu `false`
   * goruyor. Uretimdeki olcumde goruldu — tek derste iki `ders_bitti`,
   * ayni saniye, ayni veri. (O state baska hicbir yerde okunmuyordu,
   * kaldirildi.)
   *
   * Zarari olcumle sinirli degildi: `logSession` de iki kez kosuyor, yani
   * seans yerel veritabanina iki kez yaziliyordu. Ref eszamanli guncellendigi
   * icin ikinci cagri gercekten bos geciyor.
   */
  const bitiyor = useRef(false);

  const toplam = yeniKartlar.length + new Set(tekrarKuyrugu.map((p) => p.cardId)).size;

  /*
    Donanim geri tusu derste ozel: dogrudan cikmak dersi yarida birakir,
    o yuzden ekrandaki geri dugmesiyle AYNI uyariyi acar. Oncelik 20 —
    App'in genel isleyicisinden once sorulur.
  */
  useGeri(() => {
    cikmakIstiyor();
    return true;
  }, 20);

  /* Ders acilinca bir kez — bagimlilik listesi bos, yeniden kurulmuyor. */
  useEffect(() => {
    olay('ders_basladi', { yeni: yeniKartlar.length, tekrar: tekrarKuyrugu.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    () => ADIMLAR.flatMap((step) => dersKartlari.map((c): Gorev => ({ card: c, step }))),
    [dersKartlari],
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

  /** Ogrenme testinin bolgeleri — bos bolge duser, gecisi de acilmaz. */
  const ogrenmeBolgeleri = useMemo(() => bolgelereBol(ogrenmeGorevleri), [ogrenmeGorevleri]);

  const bolumler = useMemo<Bolum[]>(() => {
    const liste: Bolum[] = [];
    const tekrarVar = tekrarGorevleri.length > 0;
    if (tekrarOnce && tekrarVar) liste.push('tekrar');
    if (dersKartlari.length > 0) liste.push('yeni', 'ogrenme');
    if (!tekrarOnce && tekrarVar) liste.push('tekrar');
    return liste;
  }, [tekrarOnce, tekrarGorevleri.length, dersKartlari.length]);

  /** Ogrenme testi: merdiveni oynatmaz, yalnizca ilk notu ve olcumu yazar. */
  const ogrenmeSonucu = useCallback(
    async (cardId: string, ok: boolean, hookRevealed: boolean, step: Step) => {
      sayac.current.toplam++;
      bolgeSayac.current.toplam++;
      if (ok) {
        sayac.current.dogru++;
        bolgeSayac.current.dogru++;
      }
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
    /* "Biliyorum" denenler merdiveni HIC gormuyor, oldugu gibi yaziliyor. */
    const hepsi = [...kayitlar, ...bilinenler.current.values()];
    if (hepsi.length > 0) await db.progress.bulkPut(hepsi);
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
    setSonBilinen(null);
    if (!yeniKayitlar.current.has(card.id)) {
      yeniKayitlar.current.set(card.id, introduceCard(card));
    }
    if (i + 1 >= dersKartlari.length) gec('yeni');
    else setI(i + 1);
  }

  /**
   * "Bunu biliyorum" — kelimeyi kenara ayirir, YERINE siradaki kayar.
   *
   * Ders 5 kart kaliyor ki gunluk hedef "5 kelime OGRENDIM" anlamini
   * korusun; atlanan kelime hicbir sayaca girmiyor (bkz. types.ts
   * `bilinen`). Yedek kalmadiysa liste kisaliyor — set sonuna gelinmistir.
   *
   * `i` DEGISMIYOR: yedek ayni yere oturdugu icin kullanici siradaki
   * kelimeyi ayni konumda goruyor.
   */
  function biliyorum(card: Card) {
    olay('biliyorum_dendi', { basamak: 'yeni' });
    bilinenler.current.set(card.id, markKnown(card));
    yeniKayitlar.current.delete(card.id);

    const yedek = yedekler.current.shift();
    setDersKartlari((liste) => {
      const yeni = [...liste];
      if (yedek) yeni[i] = yedek;
      else yeni.splice(i, 1);
      return yeni;
    });
    setSonBilinen({ card, yer: i });

    // Yedek yoksa ve atlanan SON karttiysa bolum biter.
    if (!yedek && i >= dersKartlari.length - 1) gec('yeni');
  }

  /** Yanlis basilmisti — kelimeyi derse geri koy. */
  function bilinenGeriAl() {
    if (!sonBilinen) return;
    olay('bilinen_geri_alindi', { nerede: 'ders' });
    const { card, yer } = sonBilinen;
    bilinenler.current.delete(card.id);
    setDersKartlari((liste) => {
      const yeni = [...liste];
      // Yerine kayan yedek varsa onu yedeklere iade et
      const suan = yeni[yer];
      if (suan && suan.id !== card.id) yedekler.current.unshift(suan);
      yeni[yer] = card;
      return yeni;
    });
    setI(yer);
    setSonBilinen(null);
  }

  /**
   * Bolum kapanisinin gecis ani.
   *
   * `ogrenme` icin null: onun kapanisini SON BOLGE zaten gosterdi, ust
   * uste iki ekran cikmasin.
   */
  function bolumGecisi(simdiki: Bolum): Omit<GecisAni, 'devam'> | null {
    if (simdiki === 'yeni') {
      const n = dersKartlari.length;
      return {
        ikon: 'ogren',
        renk: 'brand',
        baslik: `${n} kelimeyle tanıştın`,
        sonraki: 'Şimdi kancalar tuttu mu bakalım',
      };
    }
    if (simdiki === 'tekrar') {
      return {
        ikon: 'bekleyen',
        renk: 'grow',
        baslik: 'Tekrarlar bitti',
        sonraki: 'Şimdi bugünün yeni kelimeleri',
      };
    }
    return null;
  }

  /**
   * Siradaki bolume gecer; sira bittiyse (ya da bolum listede yoksa) dersi
   * kapatir. Son bolumun ardindan gecis ani GOSTERILMEZ — orada `SessionDone`
   * var ve asil kutlama o.
   *
   * `ani` verilmezse bolumun varsayilani kullanilir; `null` verilirse hic
   * gecis cikmaz (bos bolum atlanirken oldugu gibi).
   */
  function gec(simdiki: Bolum, ani?: Omit<GecisAni, 'devam'> | null) {
    const yer = bolumler.indexOf(simdiki);
    const sonraki = yer >= 0 ? bolumler[yer + 1] : undefined;
    if (!sonraki) {
      void bitir();
      return;
    }
    const gosterilecek = ani === undefined ? bolumGecisi(simdiki) : ani;
    if (gosterilecek) setGecis({ ...gosterilecek, devam: () => setBolum(sonraki) });
    else setBolum(sonraki);
  }

  /**
   * Bir bolge bitti.
   *
   * Ara bolgelerde gecis ani bir sonraki bolgeyi aciyor; SON bolgede
   * once yeni kartlar yaziliyor, sonra bolum gecisi olarak ayni ekran
   * kullaniliyor (bkz. `bolumGecisi` — `ogrenme` orada null doner).
   */
  function bolgeBitti() {
    const simdiki = ogrenmeBolgeleri[bolgeIndex];
    if (!simdiki) return;

    const { dogru, toplam } = bolgeSayac.current;
    const ani = {
      ikon: simdiki.bolge.ikon,
      renk: simdiki.bolge.renk,
      baslik: simdiki.bolge.ad,
      sayi: toplam > 0 ? `${dogru} / ${toplam} doğru` : undefined,
      sonraki: simdiki.bolge.sonraki,
    };
    const sonBolge = bolgeIndex + 1 >= ogrenmeBolgeleri.length;

    if (!sonBolge) {
      setGecis({
        ...ani,
        devam: () => {
          bolgeSayac.current = { dogru: 0, toplam: 0 };
          setBolgeIndex(bolgeIndex + 1);
        },
      });
      return;
    }

    void yeniKartlariYaz().then(() =>
      gec('ogrenme', { ...ani, sonraki: 'Sırada bekleyen tekrarların' }),
    );
  }

  async function bitir() {
    if (bitiyor.current) return;
    bitiyor.current = true;
    const { dogru, toplam: cevap, ilerleyen } = sayac.current;
    const state = await logSession(toplam, dogru, cevap - dogru);
    olay('ders_bitti', {
      kelime: toplam,
      dogru,
      cevap,
      ilerleyen,
      bilinen: bilinenler.current.size,
      yuzde: cevap > 0 ? Math.round((dogru / cevap) * 100) : 0,
    });
    onFinish({
      count: toplam,
      streak: state.streakCount,
      dogru,
      toplam: cevap,
      ilerleyen,
      yeni: dersKartlari.length,
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
          Bu dersin <b>{dersKartlari.length} yeni kelimesi henüz kaydedilmedi</b>. Şimdi
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

  /*
    Gecis ani bolumlerin ONUNDE ciziliyor: o an ekranda ne soru var ne
    kart, yalnizca kapanan ve acilan sey. Cikis dugmesi de yok — sinirda
    kazara cikmak, yeni kelimeler henuz yazilmamisken en pahali hata.
  */
  if (gecis) {
    return (
      <Gecis
        ikon={gecis.ikon}
        renk={gecis.renk}
        baslik={gecis.baslik}
        sayi={gecis.sayi}
        sonraki={gecis.sonraki}
        onDevam={() => {
          const devam = gecis.devam;
          setGecis(null);
          devam();
        }}
      />
    );
  }

  // --- Bolum 1: yeni kartlar ---
  if (bolum === 'yeni') {
    const card = dersKartlari[i];
    if (!card) return null;
    return (
      <Screen>
        {/*
          "Biliyorum" ust barda, "Devam"dan UZAKTA. Ikisi yan yana olsaydi
          kazara basilir ve basan kisi kelimeyi kaybettigini fark etmezdi.
        */}
        <TopBar
          left={<BackButton onClick={cikmakIstiyor} />}
          right={
            <span className="flex items-center gap-3">
              <button
                onClick={() => biliyorum(card)}
                className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-ink-soft shadow-[var(--shadow-soft)] transition-all active:scale-95 hover:bg-white"
              >
                Bunu biliyorum
              </button>
              <span className="tabular-nums">
                {i + 1} / {dersKartlari.length}
              </span>
            </span>
          }
        />
        <Progressbar done={i} total={dersKartlari.length} />
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint mt-2">
          {bolumEtiketi}
        </p>

        <div key={card.id} className="rise flex-1 flex flex-col justify-center py-6">
          <LearnFace card={card} />
        </div>

        {/*
          Geri al: yanlis basildiysa kelime kaybolmasin. Kacirilsa bile
          kelime Kelimeler > Bildiklerim'den geri alinabiliyor.
        */}
        {sonBilinen && (
          <div className="rise shrink-0 mb-3 flex items-center justify-center gap-2 text-sm">
            <span className="text-ink-faint">
              <b className="word font-bold text-ink-soft">{sonBilinen.card.en}</b> kenara ayrıldı
            </span>
            <button
              onClick={bilinenGeriAl}
              className="rounded-full bg-sunken px-3 py-1.5 text-xs font-bold text-ink transition-all active:scale-95"
            >
              Geri al
            </button>
          </div>
        )}

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
  const ogrenmede = bolum === 'ogrenme';
  const gorevler = ogrenmede
    ? (ogrenmeBolgeleri[bolgeIndex]?.gorevler ?? [])
    : tekrarGorevleri;
  const sonuc = ogrenmede ? ogrenmeSonucu : tekrarSonucu;

  if (gorevler.length === 0) {
    // Bos bolum/bolge atlanirken gecis ani cikmaz: kapanan bir sey yok.
    if (ogrenmede) void yeniKartlariYaz().then(() => gec('ogrenme', null));
    else gec(bolum, null);
    return null;
  }

  return (
    <Screen>
      <TopBar left={<BackButton onClick={cikmakIstiyor} />} />
      {/* `mt-2` diger yoldaki etiketle ayni: serit ile etiket birlesik durmasin */}
      <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint mt-2">
        {bolumEtiketi}
      </p>
      <Runner
        /* Bolge degisince motor bastan kurulsun — sorular karismasin */
        key={ogrenmede ? `ogrenme-${bolgeIndex}` : bolum}
        gorevler={gorevler}
        sound={sound}
        sirali={ogrenmede}
        onResult={sonuc}
        onDone={() => (ogrenmede ? bolgeBitti() : gec(bolum))}
      />
      {uyari}
    </Screen>
  );
}
