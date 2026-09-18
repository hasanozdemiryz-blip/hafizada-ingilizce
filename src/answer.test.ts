import { describe, expect, it } from 'vitest';
import { CARDS, EN_HAVUZ, TR_HAVUZ } from './content';
import { distance, judge, normalize } from './answer';

describe('normalize', () => {
  it('buyuk/kucuk, bosluk ve noktalamayi siler', () => {
    expect(normalize('  Snake! ')).toBe('snake');
    expect(normalize('SELL')).toBe(normalize('sell'));
  });

  it('bos girdi bos doner', () => {
    expect(normalize('   ')).toBe('');
    expect(normalize('123')).toBe('');
  });
});

describe('distance', () => {
  it('ayni kelime 0', () => expect(distance('snake', 'snake')).toBe(0));
  it('tek harf degisimi 1', () => expect(distance('snake', 'snaka')).toBe(1));
  it('tek harf eksigi 1', () => expect(distance('snake', 'snae')).toBe(1));
  it('bos kelime digerinin uzunlugu', () => expect(distance('', 'snake')).toBe(5));
});

describe('judge', () => {
  it('tam esleme dogru', () => {
    expect(judge('snake', 'snake')).toBe('dogru');
    expect(judge('  SNAKE ', 'snake')).toBe('dogru');
  });

  it('bos cevap yanlis', () => {
    expect(judge('', 'snake')).toBe('yanlis');
    expect(judge('   ', 'snake')).toBe('yanlis');
  });

  // Uzun kelimede tek harf gercekten yazim hatasi
  it('uzun kelimede tek harf hatasi "yakin"', () => {
    expect(judge('brothar', 'brother')).toBe('yakin');
    expect(judge('kitchan', 'kitchen')).toBe('yakin');
  });

  /*
   * Kisa kelimelerde tek harf fark BASKA bir kelimedir. Havuzda car/cat,
   * bad/bat, cup/cut, pass/path hepsi var; "yakin" saymak yanlis kelimeyi
   * dogru gostermek olurdu.
   */
  it('havuzdaki BASKA bir kelime yazildiysa asla "yakin" degil', () => {
    // havuz verilmezse tek harf farki yazim hatasi sanilir...
    expect(judge('shake', 'snake')).toBe('yakin');
    // ...ama ikisi de gercek kelime: havuzla birlikte yanlis
    expect(judge('shake', 'snake', { havuz: EN_HAVUZ })).toBe('yanlis');
    expect(judge('short', 'shore', { havuz: EN_HAVUZ })).toBe('yanlis');
  });

  it('kisa kelimede tek harf farki yanlis sayilir', () => {
    expect(judge('cat', 'car')).toBe('yanlis');
    expect(judge('cut', 'cup')).toBe('yanlis');
    expect(judge('bat', 'bad')).toBe('yanlis');
  });

  it('iki harf farki her zaman yanlis', () => {
    expect(judge('brothxx', 'brother')).toBe('yanlis');
  });

  it('havuzdaki her kelime kendi yazimini dogru kabul eder', () => {
    const hatali = CARDS.filter((c) => judge(c.en, c.en, { havuz: EN_HAVUZ }) !== 'dogru');
    expect(hatali.map((c) => c.en)).toEqual([]);
  });

  /*
   * Kritik: havuzda, birbirini "yakin" sayacak kelime cifti olmamali —
   * yoksa kullanici `pass` yazip `path` karti icin puan alir.
   */
  it('havuzda birbirini "yakin" sayan kelime cifti yok', () => {
    const carpisma: string[] = [];
    for (const a of CARDS) {
      for (const b of CARDS) {
        if (a.id !== b.id && judge(a.en, b.en, { havuz: EN_HAVUZ }) !== 'yanlis') {
          carpisma.push(`${a.en} ~ ${b.en}`);
        }
      }
    }
    expect(carpisma).toEqual([]);
  });
});

describe('Türkçe yön', () => {
  // Cogu kisi telefonda sapkasiz yaziyor; bunu yanlis saymak kelime
  // bilgisini degil klavye aliskanligini olcmek olurdu.
  it('şapkasız yazım kabul edilir', () => {
    expect(judge('kotu', 'kötü', { dil: 'tr' })).toBe('dogru');
    expect(judge('kapi', 'kapı', { dil: 'tr' })).toBe('dogru');
    expect(judge('karanlik', 'karanlık', { dil: 'tr' })).toBe('dogru');
    expect(judge('gogus', 'göğüs', { dil: 'tr' })).toBe('dogru');
  });

  it('doğru yazım da kabul edilir', () => {
    expect(judge('kötü', 'kötü', { dil: 'tr' })).toBe('dogru');
  });

  it('çok kelimeli karşılıkta boşluk önemsiz', () => {
    expect(judge('erkek kardeş', 'erkek kardeş', { dil: 'tr' })).toBe('dogru');
    expect(judge('erkekkardes', 'erkek kardeş', { dil: 'tr' })).toBe('dogru');
  });

  // Turkce'de 'I'.toLowerCase() 'i' degil 'ı' olmali
  it('büyük harf dönüşümü Türkçe kurallarına uyar', () => {
    expect(judge('KAPI', 'kapı', { dil: 'tr' })).toBe('dogru');
    expect(judge('İYİ', 'iyi', { dil: 'tr' })).toBe('dogru');
  });

  it('havuzdaki başka bir Türkçe karşılık "yakın" sayılmaz', () => {
    expect(judge('dönmek', 'dövmek', { havuz: TR_HAVUZ, dil: 'tr' })).toBe('yanlis');
  });

  it('setteki her Türkçe karşılık kendini doğru kabul eder', () => {
    const hatali = CARDS.filter((c) => judge(c.tr, c.tr, { havuz: TR_HAVUZ, dil: 'tr' }) !== 'dogru');
    expect(hatali.map((c) => c.tr)).toEqual([]);
  });
});
