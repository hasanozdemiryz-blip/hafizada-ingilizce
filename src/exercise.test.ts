import { describe, expect, it } from 'vitest';
import { CARDS } from './content';
import {
  ADIM,
  ADIMLAR,
  bloklaraBol,
  clampStep,
  harfKarolari,
  olculebilir,
  secenekler,
  shuffle,
} from './exercise';

/** Belirli "rastgelelik" — testler kararli olsun. */
const sabit = (diziler: number[]) => {
  let i = 0;
  return () => diziler[i++ % diziler.length];
};

describe('merdiven tanimlari', () => {
  it('alti basamak, hepsi tanimli', () => {
    expect(ADIMLAR).toEqual([1, 2, 3, 4, 5, 6]);
    expect(ADIMLAR.every((n) => ADIM[n]?.ad)).toBe(true);
  });

  // Kanca ilk iki basamakta ekranda, sonra yalnizca ipucu.
  it('kanca yalnizca ilk iki basamakta ekranda durur', () => {
    expect(ADIMLAR.filter((n) => ADIM[n].kancaGorunur)).toEqual([1, 2]);
  });

  // Olcum, kancanin ekranda OLMADIGI basamaklarda anlamli.
  it('olcum 3. basamakta baslar', () => {
    expect(ADIMLAR.filter(olculebilir)).toEqual([3, 4, 5, 6]);
  });

  it('merdiven tanimadan uretime gider', () => {
    expect(ADIM[2].cevapDili).toBe('tr');
    expect(ADIM[5].cevapDili).toBe('en');
    expect(ADIM[6].egzersiz).toBe('dinleme');
  });

  it('clampStep araligin disina cikmaz', () => {
    expect(clampStep(0)).toBe(1);
    expect(clampStep(-5)).toBe(1);
    expect(clampStep(7)).toBe(6);
    expect(clampStep(3)).toBe(3);
  });
});

describe('shuffle', () => {
  it('ayni elemanlari korur', () => {
    const xs = [1, 2, 3, 4, 5];
    expect([...shuffle(xs)].sort()).toEqual(xs);
  });

  it('girdiyi degistirmez', () => {
    const xs = [1, 2, 3];
    shuffle(xs);
    expect(xs).toEqual([1, 2, 3]);
  });
});

describe('coktan secmeli siklar', () => {
  const kart = CARDS[0];

  it('dogru cevabi icerir', () => {
    expect(secenekler(kart, CARDS, 'tr')).toContain(kart.tr);
    expect(secenekler(kart, CARDS, 'en')).toContain(kart.en);
  });

  it('istenen sayida sik verir', () => {
    expect(secenekler(kart, CARDS, 'tr', 4)).toHaveLength(4);
    expect(secenekler(kart, CARDS, 'tr', 3)).toHaveLength(3);
  });

  it('siklar benzersiz', () => {
    const s = secenekler(kart, CARDS, 'tr');
    expect(new Set(s).size).toBe(s.length);
  });

  /*
   * turn ve spin ikisi de "dönmek". Celdirici olarak girseydi iki sikkin
   * da dogru oldugu bir soru cikardi.
   */
  it('ayni metni tasiyan kart celdirici olamaz', () => {
    const turn = CARDS.find((c) => c.en === 'turn')!;
    for (let i = 0; i < 200; i++) {
      const s = secenekler(turn, CARDS, 'tr');
      expect(s.filter((o) => o === 'dönmek')).toHaveLength(1);
    }
  });

  it('havuz kucukse elindekiyle yetinir', () => {
    const kucuk = CARDS.slice(0, 2);
    expect(secenekler(kucuk[0], kucuk, 'tr', 4)).toHaveLength(2);
  });
});

describe('harf dizme', () => {
  it('kelimenin harflerini verir', () => {
    expect([...harfKarolari('snake')].sort().join('')).toBe([...'snake'].sort().join(''));
  });

  // Kullanici hicbir sey yapmadan dogru cevabi gormemeli.
  it('harfleri ASLA dogru sirada birakmaz', () => {
    for (const c of CARDS) {
      if (new Set(c.en).size === 1) continue;
      for (let i = 0; i < 20; i++) {
        expect(harfKarolari(c.en).join('')).not.toBe(c.en);
      }
    }
  });

  it('tek harfli girdide sonsuz donguye girmez', () => {
    expect(harfKarolari('a')).toEqual(['a']);
  });

  it('tum harfleri ayni olan kelimede oldugu gibi birakir', () => {
    expect(harfKarolari('aaa', sabit([0, 0, 0]))).toEqual(['a', 'a', 'a']);
  });
});

describe('bloklara bolme', () => {
  const g = (i: number, step: 1 | 2 | 3 | 4 | 5 | 6) => ({ card: CARDS[i], step });

  it('1. basamaktakileri beserli gruplar', () => {
    const b = bloklaraBol([0, 1, 2, 3, 4].map((i) => g(i, 1)));
    expect(b).toHaveLength(1);
    expect(b[0].tip).toBe('eslestirme');
  });

  it('bes ustu kartlari birden fazla gruba boler', () => {
    const b = bloklaraBol([0, 1, 2, 3, 4, 5, 6, 7].map((i) => g(i, 1)));
    expect(b.filter((x) => x.tip === 'eslestirme')).toHaveLength(2);
  });

  // Tek kalan kart eslestirilemez — anlamsiz tek satirlik ekran cikardi.
  it('gruptan tek kart artarsa onu secmeliye kaydirir', () => {
    const b = bloklaraBol([0, 1, 2, 3, 4, 5].map((i) => g(i, 1)));
    const tekli = b.filter((x) => x.tip === 'tekli');
    expect(tekli).toHaveLength(1);
    expect(tekli[0]).toMatchObject({ gorev: { step: 2 } });
  });

  it('diger basamaklar tek tek sorulur', () => {
    const b = bloklaraBol([g(0, 3), g(1, 5), g(2, 6)]);
    expect(b).toHaveLength(3);
    expect(b.every((x) => x.tip === 'tekli')).toBe(true);
  });

  it('hicbir gorev kaybolmaz', () => {
    const gorevler = [g(0, 1), g(1, 1), g(2, 1), g(3, 4), g(4, 6)];
    const b = bloklaraBol(gorevler);
    const sayi = b.reduce((n, x) => n + (x.tip === 'eslestirme' ? x.kartlar.length : 1), 0);
    expect(sayi).toBe(gorevler.length);
  });

  it('bos girdide bos doner', () => {
    expect(bloklaraBol([])).toEqual([]);
  });
});

describe('sirali blok dizilimi', () => {
  const g = (i: number, step: 1 | 2 | 3 | 4 | 5 | 6) => ({ card: CARDS[i], step });

  /*
   * Ogrenme testi merdiveni asama asama tirmanir: once 5 kelime
   * eslestirilir, sonra ayni 5 kelime coktan secmeli, sonra ters
   * secmeli... Bloklara bolme bu sirayi bozmamali.
   */
  it('asama sirasi korunur', () => {
    const gorevler = [1, 2, 3, 4, 5, 6].flatMap((step) =>
      [0, 1, 2].map((i) => g(i, step as 1)),
    );
    const b = bloklaraBol(gorevler);

    expect(b[0].tip).toBe('eslestirme');
    const adimlar = b.slice(1).map((x) => (x.tip === 'tekli' ? x.gorev.step : 0));
    expect(adimlar).toEqual([...adimlar].sort((a, z) => a - z));
  });

  it('tum gorevler kosulur', () => {
    const gorevler = [1, 2, 3, 4, 5, 6].flatMap((step) =>
      [0, 1, 2, 3, 4].map((i) => g(i, step as 1)),
    );
    const b = bloklaraBol(gorevler);
    const sayi = b.reduce((n, x) => n + (x.tip === 'eslestirme' ? x.kartlar.length : 1), 0);
    expect(sayi).toBe(30);
  });
});
