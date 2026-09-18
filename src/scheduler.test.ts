import { describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import {
  BATCH,
  CARDS,
  ESKI_GUN,
  LIMIT_DEFAULT,
  LIMIT_MAX,
  ogrenilenKancalar,
  setBittiMi,
  setteOlanlar,
} from './content';
import {
  aheadQueue,
  dueQueue,
  introduceCard,
  introducedToday,
  learningCheck,
  nextBatch,
  olderThan,
  randomOld,
  remainingToday,
  reviewCard,
  todaysCards,
  yesterdaysCards,
} from './scheduler';
import type { Progress } from './types';

const NOW = new Date('2026-03-10T09:00:00');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const introduceMany = (count: number, when = NOW) =>
  CARDS.slice(0, count).map((c) => introduceCard(c, when));

/** Karti art arda yardimsiz basariyla hedef basamaga cikarir. */
const cikar = (hedef: number) => {
  let p = introduceCard(CARDS[0], NOW);
  for (let i = 1; p.step < hedef; i++) p = reviewCard(p, true, false, day(i)).progress;
  return p;
};

describe('icerik', () => {
  /*
   * v1 setinin sinirini GORSEL cizer: gorseli olmayan kart yontemi
   * anlatmadigi icin sete hic girmez. Kural bu — sayi degil; gorsel
   * eklendikce set kendiliginden buyur.
   */
  it('setteki her kartin gorseli var ve hepsi "Tutan"', () => {
    expect(CARDS.length).toBeGreaterThan(0);
    expect(CARDS.filter((c) => !c.image)).toEqual([]);
    expect(CARDS.every((c) => c.klass === 'tutan')).toBe(true);
  });

  it('siklik sirasi 1..N, bosluksuz', () => {
    expect(CARDS.map((c) => c.order)).toEqual(CARDS.map((_, i) => i + 1));
  });

  it('kart idleri benzersiz', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });

  // Ilk bes kart yontemin ne yaptigini gostermeli. "far ≈ far" gibi
  // kancasi kelimenin aynisi olanlar vitrin degil.
  it('ilk pakette kancasi kelimenin aynisi olan kart yok', () => {
    const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]/g, '');
    const zayif = CARDS.slice(0, BATCH).filter((c) => norm(c.en) === norm(c.hook));
    expect(zayif.map((c) => c.en)).toEqual([]);
  });

  it('gorseli olan kart cards.json elle duzenlenmeden baglanir', () => {
    expect(CARDS.find((c) => c.id === 'snake')?.image).toBeTruthy();
  });
});

describe('set sonu', () => {
  it('son kelime tanisilmadan "bitti" demez', () => {
    expect(setBittiMi([])).toBe(false);
    expect(setBittiMi(introduceMany(CARDS.length - 1))).toBe(false);
    expect(setBittiMi(introduceMany(CARDS.length))).toBe(true);
  });

  // Paylasilan pano kelime listesi degil KANCA listesi; sirasi da sabit
  // olmali ki ayni kullanicinin panosu her seferinde ayni gorunsun.
  it('kanca panosu yalnizca tanisilanlari, siklik sirasinda verir', () => {
    const kancalar = ogrenilenKancalar(introduceMany(3));
    expect(kancalar).toEqual(CARDS.slice(0, 3).map((c) => ({ en: c.en, hook: c.hook })));
  });

  it('tanisilmamis kart panoya girmez', () => {
    expect(ogrenilenKancalar([])).toEqual([]);
  });

  /*
   * Set 100'den 26'ya indi; onceden kurulmus cihazlarda artik sette olmayan
   * kartlarin kaydi duruyor. Elenmezse sayilar sisiyor ve set daha ilk gun
   * "bitmis" gorunebiliyor — kullanici o 26 kelimeyi hic gormeden.
   */
  const disaridakiler = Array.from({ length: CARDS.length }, (_, i) => ({
    ...introduceCard(CARDS[0], NOW),
    cardId: `eski-set-${i}`,
  }));

  it('setten cikmis kartin kaydi elenir', () => {
    const karisik = [...introduceMany(3), ...disaridakiler];
    expect(setteOlanlar(karisik)).toHaveLength(3);
  });

  it('setten cikmis kayitlar seti "bitmis" gostermez', () => {
    const karisik = [...introduceMany(3), ...disaridakiler];
    // ham liste yaniltiyor...
    expect(setBittiMi(karisik)).toBe(true);
    // ...elendiginde dogru cevap
    expect(setBittiMi(setteOlanlar(karisik))).toBe(false);
  });
});

describe('tanisma', () => {
  it('kart ilk basamakta, notsuz havuza girer', () => {
    const p = introduceCard(CARDS[0], NOW);
    expect(p.step).toBe(1);
    expect(p.introduced).toBe(true);
    expect(p.fsrs.reps).toBe(0); // not verilmedi
    expect(p.firstCheckOk).toBeNull();
  });
});

describe('ogrenme testi', () => {
  // Ilk gercek notu burasi verir; once kullaniciya sorulup beyan aliniyordu.
  it('kartin ilk FSRS notunu verir', () => {
    const p = learningCheck(introduceCard(CARDS[0], NOW), true, NOW);
    expect(p.fsrs.reps).toBe(1);
  });

  it('sonucu firstCheckOka yazar', () => {
    expect(learningCheck(introduceCard(CARDS[0], NOW), true, NOW).firstCheckOk).toBe(true);
    expect(learningCheck(introduceCard(CARDS[0], NOW), false, NOW).firstCheckOk).toBe(false);
  });

  it('firstCheckOk sonraki kontrollerde degismez', () => {
    let p = learningCheck(introduceCard(CARDS[0], NOW), false, NOW);
    p = learningCheck(p, true, NOW);
    expect(p.firstCheckOk).toBe(false);
  });

  // Kelime hala kisa sureli hafizada; buradan gelen basari "ogrenildi" demek degil.
  it('merdiveni OYNATMAZ', () => {
    const p = learningCheck(introduceCard(CARDS[0], NOW), true, NOW);
    expect(p.step).toBe(1);
  });
});

describe('merdiven', () => {
  it('yardimsiz basari bir basamak cikarir', () => {
    const p = introduceCard(CARDS[0], NOW);
    expect(reviewCard(p, true, false, day(1)).progress.step).toBe(2);
  });

  it('yanlis bir basamak indirir', () => {
    const p = cikar(3);
    expect(reviewCard(p, false, false, day(9)).progress.step).toBe(2);
  });

  // Ipucu kullanmak basarisizlik degil: ilerletmez ama geri de atmaz.
  it('kancayla dogru yerinde birakir', () => {
    const p = cikar(4);
    expect(reviewCard(p, true, true, day(9)).progress.step).toBe(4);
  });

  it('ilk basamagin altina inmez', () => {
    let p = introduceCard(CARDS[0], NOW);
    p = reviewCard(p, false, false, day(1)).progress;
    p = reviewCard(p, false, false, day(2)).progress;
    expect(p.step).toBe(1);
  });

  it('son basamagin ustune cikmaz', () => {
    let p = cikar(6);
    expect(p.step).toBe(6);
    p = reviewCard(p, true, false, day(40)).progress;
    expect(p.step).toBe(6);
  });

  it('bastan sona tirmanis alti basamak surer', () => {
    expect(cikar(6).fsrs.reps).toBe(5);
  });
});

describe('kalite sinyalleri', () => {
  /*
   * 1-2. basamaklarda kanca zaten ekranda; oradan gelen "dogru" kancanin
   * ise yarayip yaramadigini soylemez. Gercek sinav 3'te basliyor.
   */
  it('ilk iki basamak olcum uretmez', () => {
    let p = introduceCard(CARDS[0], NOW);
    p = reviewCard(p, true, false, day(1)).progress; // 1'de cevaplandi
    expect(p.unaidedOk).toBeNull();
    p = reviewCard(p, true, false, day(2)).progress; // 2'de cevaplandi
    expect(p.unaidedOk).toBeNull();
  });

  it('3. basamakta yardimsiz bilinirse unaidedOk true', () => {
    const p = cikar(3);
    expect(reviewCard(p, true, false, day(9)).progress.unaidedOk).toBe(true);
  });

  it('3. basamakta kancaya bakildiysa yardimsiz sayilmaz', () => {
    const p = cikar(3);
    expect(reviewCard(p, true, true, day(9)).progress.unaidedOk).toBe(false);
  });

  it('unaidedOk ilk olcumden sonra degismez', () => {
    let p = cikar(3);
    p = reviewCard(p, false, false, day(9)).progress; // false
    p = reviewCard(p, true, false, day(10)).progress;
    p = reviewCard(p, true, false, day(11)).progress;
    expect(p.unaidedOk).toBe(false);
  });

  it('produceOk yalnizca yazma basamaginda yazilir', () => {
    const dort = cikar(4);
    expect(reviewCard(dort, true, false, day(12)).progress.produceOk).toBeNull();
    const bes = cikar(5);
    expect(reviewCard(bes, true, false, day(20)).progress.produceOk).toBe(true);
  });

  it('failCount yalnizca olculebilir basamaklarda artar', () => {
    let p = introduceCard(CARDS[0], NOW);
    p = reviewCard(p, false, false, day(1)).progress; // 1. basamak
    expect(p.failCount).toBe(0);

    p = cikar(3);
    expect(reviewCard(p, false, false, day(9)).progress.failCount).toBe(1);
  });

  it('hookRevealCount her ipucunda artar', () => {
    const p = cikar(3);
    expect(reviewCard(p, true, true, day(9)).progress.hookRevealCount).toBe(1);
  });
});

describe('siradaki paket', () => {
  it('bos havuzda ilk BATCH karti verir', () => {
    expect(nextBatch([], LIMIT_DEFAULT, NOW)).toHaveLength(BATCH);
    expect(nextBatch([], LIMIT_DEFAULT, NOW)[0].id).toBe(CARDS[0].id);
  });

  it('tanisilmis kartlari atlar', () => {
    const ps = introduceMany(BATCH);
    expect(nextBatch(ps, LIMIT_DEFAULT, NOW)[0].id).toBe(CARDS[BATCH].id);
  });

  it('sira bozulmaz', () => {
    expect(nextBatch([], LIMIT_DEFAULT, NOW).map((c) => c.order)).toEqual(
      CARDS.slice(0, BATCH).map((c) => c.order),
    );
  });

  it('tum kartlar tanisilinca bos doner', () => {
    expect(nextBatch(CARDS.map((c) => introduceCard(c, NOW)), 15, day(1))).toHaveLength(0);
  });
});

describe('gunluk hedef', () => {
  // Hedef GERCEK bir sinir: dolunca yeni kelime verilmez.
  it('hedef dolunca paket bos doner', () => {
    const ps = introduceMany(10, NOW);
    expect(remainingToday(ps, 10, NOW)).toBe(0);
    expect(nextBatch(ps, 10, NOW)).toHaveLength(0);
  });

  it('hedefe az kaldiysa paketi kisaltir', () => {
    const ps = introduceMany(8, NOW);
    expect(remainingToday(ps, 10, NOW)).toBe(2);
    expect(nextBatch(ps, 10, NOW)).toHaveLength(2);
  });

  it('ertesi gun hedef sifirlanir', () => {
    const ps = introduceMany(10, NOW);
    expect(remainingToday(ps, 10, day(1))).toBe(10);
    expect(nextBatch(ps, 10, day(1))).toHaveLength(BATCH);
  });

  // 15'in ustu ertesi gun kaldirilamayan bir tekrar yigini demek.
  it('tavan asilamaz', () => {
    expect(remainingToday([], 999, NOW)).toBe(LIMIT_MAX);
    expect(remainingToday([], 15, NOW)).toBe(LIMIT_MAX);
  });

  it('secilebilen hedefler tavani gecmez', () => {
    expect(Math.max(...[5, 10, 15])).toBe(LIMIT_MAX);
  });
});

describe('bugunun kartlari', () => {
  it('yalnizca bugun tanisilanlari verir', () => {
    const ps = [...introduceMany(3, NOW), ...CARDS.slice(3, 6).map((c) => introduceCard(c, day(-2)))];
    expect(todaysCards(ps, NOW)).toHaveLength(3);
  });

  it('tanisilmamis kart girmez', () => {
    const ps = introduceMany(3, NOW).map((p) => ({ ...p, introduced: false }));
    expect(todaysCards(ps, NOW)).toEqual([]);
  });
});

describe('eski kelimeler', () => {
  it('esikten eski kartlari en eskiden baslayarak verir', () => {
    const eski = CARDS.slice(0, 2).map((c) => introduceCard(c, day(-30)));
    const orta = CARDS.slice(2, 4).map((c) => introduceCard(c, day(-10)));
    const yeni = introduceMany(2, NOW);
    const liste = olderThan([...yeni, ...orta, ...eski], ESKI_GUN, NOW);

    expect(liste).toHaveLength(4);
    expect(liste[0].introducedAt! < liste[3].introducedAt!).toBe(true);
  });

  it('esikten yeni kartlari disarida birakir', () => {
    expect(olderThan(introduceMany(3, NOW), ESKI_GUN, NOW)).toEqual([]);
  });
});

describe('gunluk sayim', () => {
  it('bugun tanisilanlari sayar', () => {
    expect(introducedToday(introduceMany(7, NOW), NOW)).toBe(7);
  });

  it('dunku kartlari saymaz', () => {
    expect(introducedToday(introduceMany(7, NOW), day(1))).toBe(0);
  });
});

describe('kuyruklar', () => {
  it('vadesi gecmis kartlari erken olandan siralar', () => {
    const ps = introduceMany(3).map((p) => learningCheck(p, true, NOW));
    const q = dueQueue(ps, day(30));
    expect(q).toHaveLength(3);
    const t = q.map((p) => p.due.getTime());
    expect(t).toEqual([...t].sort((a, b) => a - b));
  });

  it('erken kuyruk vadesi GELMEMIS kartlari verir', () => {
    const ps = introduceMany(5).map((p) => learningCheck(p, true, NOW));
    expect(aheadQueue(ps, 10, NOW)).toHaveLength(5);
    expect(aheadQueue(ps, 10, day(30))).toEqual([]);
  });

  it('erken kuyruk parti boyutunu asmaz', () => {
    const ps = introduceMany(20).map((p) => learningCheck(p, true, NOW));
    expect(aheadQueue(ps, 10, NOW)).toHaveLength(10);
  });

  it('tanisilmamis kart hicbir kuyruga girmez', () => {
    const ps: Progress[] = introduceMany(3).map((p) => ({ ...p, introduced: false }));
    expect(aheadQueue(ps, 10, NOW)).toEqual([]);
    expect(dueQueue(ps, day(30))).toEqual([]);
  });

  /*
   * Regresyon: Review durumundaki kart yanlis alinca FSRS onu TAM 10 dk
   * sonraya koyuyordu; kesin "<" karsilastirmasi bunu kaciriyor ve kart
   * seanstan sessizce dusuyordu. Tarayicida yakalandi.
   */
  it('Review durumundaki kart da yanlis deyince ayni seansa doner', () => {
    let p = learningCheck(introduceCard(CARDS[0], NOW), true, NOW);
    p = reviewCard(p, true, false, day(1)).progress;
    expect(p.fsrs.state).toBe(State.Review);
    expect(reviewCard(p, false, false, day(30)).requeue).toBe(true);
  });

  it('dogru cevaplanan kart seanstan cikar', () => {
    const p = learningCheck(introduceCard(CARDS[0], NOW), true, NOW);
    expect(reviewCard(p, true, false, day(1)).requeue).toBe(false);
  });
});

describe('egzersiz kapsamlari', () => {
  const kartlarla = (n: number, when: Date) =>
    CARDS.slice(0, n).map((c) => introduceCard(c, when));

  it('dun tanisilanlari verir, bugunkuleri degil', () => {
    const ps = [...introduceMany(3, NOW), ...CARDS.slice(3, 8).map((c) => introduceCard(c, day(-1)))];
    expect(yesterdaysCards(ps, NOW)).toHaveLength(5);
    expect(todaysCards(ps, NOW)).toHaveLength(3);
  });

  it('iki gun oncesi "dun" degildir', () => {
    expect(yesterdaysCards(kartlarla(4, day(-2)), NOW)).toEqual([]);
  });

  /*
   * Hep en eskiden baslamak ayni kelimeleri dondurup durur; havuz
   * buyudukce arkadaki yuzlerce kelime hic gorunmez.
   */
  it('eskilerden rastgele secer, hepsi ayni gelmez', () => {
    const ps = kartlarla(30, day(-30));
    const a = randomOld(ps, 10, NOW).map((p) => p.cardId);
    const b = randomOld(ps, 10, NOW).map((p) => p.cardId);
    expect(a).toHaveLength(10);
    expect(a.join()).not.toBe(b.join());
  });

  it('rastgele secim yalnizca ESKI kartlardan gelir', () => {
    const ps = [...kartlarla(5, day(-30)), ...CARDS.slice(5, 10).map((c) => introduceCard(c, NOW))];
    const secim = randomOld(ps, 10, NOW);
    expect(secim).toHaveLength(5);
    expect(secim.every((p) => new Date(p.introducedAt!) < day(-7))).toBe(true);
  });

  it('parti boyutunu asmaz', () => {
    expect(randomOld(kartlarla(40, day(-30)), 10, NOW)).toHaveLength(10);
  });

  it('eski kart yoksa bos doner', () => {
    expect(randomOld(introduceMany(5, NOW), 10, NOW)).toEqual([]);
  });
});
