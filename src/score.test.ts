import { describe, expect, it } from 'vitest';
import { CARDS } from './content';
import { introduceCard } from './scheduler';
import { abilities, activeDays, masteryRate, successRate } from './score';
import type { AppState, Cevap, Progress, Step } from './types';

const NOW = new Date('2026-03-10T09:00:00');
/** n gun once */
const key = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const gunler = (kayit: Record<number, { r?: number; i?: number; d?: number; y?: number }>) =>
  Object.fromEntries(
    Object.entries(kayit).map(([n, v]) => [key(Number(n)), { r: 0, i: 0, ...v }]),
  ) as AppState['days'];

const kart = (i: number, step: Step): Progress => ({ ...introduceCard(CARDS[i], NOW), step });

/** `gunOnce` gun once, o gunun oglen vakti verilmis bir cevap. */
const cevap = (
  cardId: string,
  ok: boolean,
  gunOnce: number,
  step: Step | null = 1,
  ipucu = false,
): Cevap => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - gunOnce);
  return { cardId, ok, step, ipucu, ts: d.getTime(), gun: key(gunOnce), kaynak: 'ders' };
};

describe('basari orani', () => {
  /*
   * Yuzde KELIME bazinda: her kelime penceresinde bir kez sayilir, ona
   * verilen en son cevaba gore.
   */
  it('ayni alistirmanin son cevabini sayar', () => {
    const c = [cevap('a', false, 0), cevap('a', true, 0), cevap('b', true, 0)];
    expect(successRate(c, 'gun', NOW)).toEqual({
      percent: 100,
      dogru: 2,
      toplam: 2,
      kelime: 2,
      cevap: 3,
      yanlisCevap: 1,
    });
  });

  /*
   * Gercek bir derste bulundu: ogrenme testi ayni kelimeyi alti kez,
   * gittikce zorlasan basamaklarda soruyor. Birim KELIME oldugunda en
   * sondaki dinleme butun kelimenin sonucunu belirliyor ve 30 cevabin
   * 21'i dogru olan ders %0 gorunuyordu.
   */
  it('zor basamak kolay basamagin sonucunu silmez', () => {
    const ders = ['a', 'b', 'c', 'd', 'e'].flatMap((id) => [
      cevap(id, true, 0, 1),
      cevap(id, true, 0, 2),
      cevap(id, true, 0, 3),
      cevap(id, true, 0, 4),
      cevap(id, true, 0, 5),
      cevap(id, false, 0, 6), // dinleme — hepsi yanlis
    ]);
    const b = successRate(ders, 'gun', NOW)!;
    expect(b.toplam).toBe(30);
    expect(b.dogru).toBe(25);
    expect(b.percent).toBe(83);
    expect(b.kelime).toBe(5);
  });

  it('ayni kelimenin farkli basamaklari ayri sayilir', () => {
    const c = [cevap('a', true, 0, 1), cevap('a', false, 0, 5)];
    expect(successRate(c, 'gun', NOW)?.toplam).toBe(2);
    expect(successRate(c, 'gun', NOW)?.kelime).toBe(1);
    expect(successRate(c, 'gun', NOW)?.percent).toBe(50);
  });

  // Istenen davranis: yanlis yapilan alistirma tekrar edilince oran YUKSELIR.
  it('sonradan dogru yapilan alistirma orani yukseltir', () => {
    const once = [cevap('a', false, 0), cevap('b', true, 0)];
    expect(successRate(once, 'gun', NOW)?.percent).toBe(50);
    expect(successRate([...once, cevap('a', true, 0)], 'gun', NOW)?.percent).toBe(100);
  });

  // Ve tersi: dogru bilinen kelime sonra yanlis yapilirsa oran DUSER.
  it('sonradan yanlis yapilan alistirma orani dusurur', () => {
    const c = [cevap('a', true, 0), cevap('b', true, 0), cevap('a', false, 0)];
    expect(successRate(c, 'gun', NOW)?.percent).toBe(50);
  });

  // Tekrar sayisi oy sayisi degil: bir kelimeyi 10 kez dogru yapmak
  // digerinin yanlisini gizlemez.
  it('cok tekrar orani sismez', () => {
    const c = [
      ...Array.from({ length: 10 }, () => cevap('a', true, 0)),
      cevap('b', false, 0),
    ];
    const b = successRate(c, 'gun', NOW)!;
    expect(b.percent).toBe(50);
    expect(b.cevap).toBe(11);
  });

  it('pencere disindaki cevaplari saymaz', () => {
    const c = [cevap('a', true, 0), cevap('b', false, 10)];
    expect(successRate(c, 'hafta', NOW)?.toplam).toBe(1);
    expect(successRate(c, 'ay', NOW)?.toplam).toBe(2);
  });

  // Ayni kelimenin pencere ICINDEKI son cevabi gecerli; disarida kalan eski
  // cevap yuzdeyi etkilemez.
  it('pencere disinda kalan eski cevap gormezden gelinir', () => {
    const c = [cevap('a', true, 20), cevap('a', false, 0)];
    expect(successRate(c, 'ay', NOW)?.percent).toBe(0);
    expect(successRate(c, 'gun', NOW)?.percent).toBe(0);
  });

  it('toplam penceresi butun gecmisi alir', () => {
    const c = [cevap('a', true, 400), cevap('b', false, 0)];
    expect(successRate(c, 'toplam', NOW)?.toplam).toBe(2);
    expect(successRate(c, 'ay', NOW)?.toplam).toBe(1);
  });

  /*
   * "Hic cevap yok" ile "hepsi yanlis" ayri seyler; ikisi de %0 gorunmemeli.
   */
  it('hic cevap yoksa null doner', () => {
    expect(successRate([], 'gun', NOW)).toBeNull();
    expect(successRate([cevap('a', true, 30)], 'hafta', NOW)).toBeNull();
  });

  it('hepsi yanlissa %0 doner, null degil', () => {
    expect(successRate([cevap('a', false, 0)], 'gun', NOW)).toEqual({
      percent: 0,
      dogru: 0,
      toplam: 1,
      kelime: 1,
      cevap: 1,
      yanlisCevap: 1,
    });
  });

  // v6 oncesi kayitlarda basamak yok; cokmeden, kelime bazinda sayilirlar.
  it('basamaksiz eski kayitlar tek hucrede toplanir', () => {
    const c = [cevap('a', false, 0, null), cevap('a', true, 0, null)];
    expect(successRate(c, 'gun', NOW)?.toplam).toBe(1);
    expect(successRate(c, 'gun', NOW)?.percent).toBe(100);
  });

  // Gun penceresi yerel gece yarisinda baslar, "24 saat once" degil.
  it('gun penceresi dunku cevabi almaz', () => {
    expect(successRate([cevap('a', true, 1)], 'gun', NOW)).toBeNull();
  });
});

describe('duzenlilik', () => {
  it('penceredeki calisilan gun sayisini verir', () => {
    const d = gunler({ 0: { r: 3 }, 2: { i: 5 }, 5: { r: 1 } });
    expect(activeDays(d, 'hafta', NOW)).toEqual({ calisilan: 3, toplam: 7 });
  });

  it('bos gun sayilmaz', () => {
    expect(activeDays(gunler({ 0: { r: 0, i: 0 } }), 'hafta', NOW).calisilan).toBe(0);
  });

  it('ay penceresi 30 gun', () => {
    expect(activeDays({}, 'ay', NOW).toplam).toBe(30);
  });

  // "Toplam"da payda yok: 30 gunun kaci degil, toplam kac gun calisildigi.
  it('toplam penceresinde payda yoktur', () => {
    const d = gunler({ 0: { r: 1 }, 40: { r: 1 }, 400: { r: 1 } });
    expect(activeDays(d, 'toplam', NOW)).toEqual({ calisilan: 3, toplam: null });
  });
});

describe('ustalik', () => {
  // 1. basamak %0, 6. basamak %100.
  it('en alt %0, en ust %100', () => {
    expect(masteryRate([kart(0, 1)])).toBe(0);
    expect(masteryRate([kart(0, 6)])).toBe(100);
  });

  it('ortalamayi alir', () => {
    expect(masteryRate([kart(0, 1), kart(1, 6)])).toBe(50);
  });

  it('tanisilmamis kart sayilmaz', () => {
    const ps = [kart(0, 6), { ...kart(1, 1), introduced: false }];
    expect(masteryRate(ps)).toBe(100);
  });

  it('hic kelime yoksa null', () => {
    expect(masteryRate([])).toBeNull();
    expect(masteryRate([{ ...kart(0, 1), introduced: false }])).toBeNull();
  });
});

describe('yetenekler', () => {
  /*
   * Panel MERDIVEN konumuna degil YAPILANA bakiyor. Once `step >= 3` /
   * `>= 5` esiklerine bakiyordu ve derste ters secmeli + yazma dogru
   * yapilmis olmasina ragmen alt iki satir 0 duruyordu: merdiven ogrenme
   * testinde oynamiyor, 3. basamaga cikmak gunler suruyor.
   */
  const dogru = (cardId: string, step: Step, ipucu = false) =>
    cevap(cardId, true, 0, step, ipucu);

  it('derste yapilan basamak ayni gun sayilir', () => {
    const ps = [kart(0, 1), kart(1, 1)];
    const y = abilities(ps, [
      dogru(CARDS[0].id, 3),
      dogru(CARDS[0].id, 5),
      dogru(CARDS[1].id, 3),
    ]);
    // Ikisi de hala 1. basamakta ama yapilan is sayiliyor
    expect(y).toEqual({ taniyor: 2, seciyor: 2, yaziyor: 1, toplam: 2 });
  });

  it('kanca ipucuyla bulunan sayilmaz', () => {
    const y = abilities([kart(0, 1)], [dogru(CARDS[0].id, 5, true)]);
    expect(y.yaziyor).toBe(0);
  });

  it('yanlis cevap sayilmaz', () => {
    const y = abilities([kart(0, 1)], [cevap(CARDS[0].id, false, 0, 5)]);
    expect(y.yaziyor).toBe(0);
  });

  it('alt basamak ust beceriyi doldurmaz', () => {
    const y = abilities([kart(0, 1)], [dogru(CARDS[0].id, 4)]);
    expect(y.seciyor).toBe(1);
    expect(y.yaziyor).toBe(0);
  });

  it('ayni kelime iki kez sayilmaz', () => {
    const y = abilities([kart(0, 1)], [dogru(CARDS[0].id, 5), dogru(CARDS[0].id, 5)]);
    expect(y.yaziyor).toBe(1);
  });

  it('basamaksiz eski kayit sayilmaz', () => {
    const y = abilities([kart(0, 1)], [cevap(CARDS[0].id, true, 0, null)]);
    expect(y.seciyor).toBe(0);
  });

  it('tanisilmamis kart girmez', () => {
    const ps = [{ ...kart(0, 6), introduced: false }];
    expect(abilities(ps, [dogru(CARDS[0].id, 5)])).toEqual({
      taniyor: 0,
      seciyor: 0,
      yaziyor: 0,
      toplam: 0,
    });
  });

  it('cevap yoksa yalnizca tanistiklari sayar', () => {
    expect(abilities([kart(0, 6), kart(1, 6)], [])).toEqual({
      taniyor: 2,
      seciyor: 0,
      yaziyor: 0,
      toplam: 2,
    });
  });

  it('bos girdide hepsi sifir', () => {
    expect(abilities([], [])).toEqual({ taniyor: 0, seciyor: 0, yaziyor: 0, toplam: 0 });
  });
});
