import { describe, expect, it } from 'vitest';
import {
  AD_SINIR,
  HAYVANLAR,
  adDuzelt,
  profilDuzelt,
  rastgeleAd,
  yeniKimlik,
  yeniProfil,
} from './profil';
import { CERCEVELER, cerceveAcikMi, gecerliCerceve, yeniAcilanlar } from './cerceveler';
import { CERCEVE_ADLARI, HAYVAN_ADLARI } from './avatarlar';

/** Belirli "rastgelelik" — testler kararli olsun. */
const sabit = (n: number) => () => n;

describe('yerel profil', () => {
  it('kendiliginden dolu bir profil uretir', () => {
    const p = yeniProfil(sabit(0));
    expect(p.id).toBeTruthy();
    expect(p.ad).toBe('Meraklı Tilki');
    expect(p.avatar).toEqual({ tip: 'hayvan', ad: 'tilki' });
    expect(p.cerceve).toBe('halka');
    expect(Number.isNaN(Date.parse(p.olusturuldu))).toBe(false);
  });

  // Ad ile yuz ayni hayvandan gelmeli: "Meraklı Tilki" tilki resmiyle acilir.
  it('otomatik adin hayvani avatarin hayvanidir', () => {
    for (const n of [0, 0.3, 0.55, 0.9]) {
      const p = yeniProfil(sabit(n));
      const hayvan = HAYVANLAR.find((h) => p.ad.endsWith(h.ad))!;
      expect(p.avatar).toEqual({ tip: 'hayvan', ad: hayvan.dosya });
    }
  });

  /*
    Kimligin TEK isi ileride "bu ayni kisi mi" sorusunu cevaplamak.
    Cakisirsa iki kullanicinin verisi birbirine karisir.
  */
  it('kimlikler benzersiz', () => {
    const kimlikler = new Set(Array.from({ length: 500 }, yeniKimlik));
    expect(kimlikler.size).toBe(500);
  });

  it('listeler uretilen dosyalarla ayni', () => {
    expect(HAYVANLAR.map((h) => h.dosya).sort()).toEqual([...HAYVAN_ADLARI]);
    expect(CERCEVELER.map((c) => c.ad).sort()).toEqual([...CERCEVE_ADLARI]);
  });

  /*
    Avatar olarak marka ikonu da secilebiliyordu; secenek kalkti. Eski bir
    kayitta kalmis olabilir — cizilemeyecek bir sekle birakmak yerine
    hayvana cevriliyor, tercihen adin kendi hayvanina.
  */
  describe('kalkan ikon avatari', () => {
    const eski = (ad: string) =>
      ({ ...yeniProfil(sabit(0)), ad, avatar: { tip: 'ikon', ikon: 'ogren', renk: 'mavi' } }) as never;

    it('adin hayvanina cevrilir', () => {
      expect(profilDuzelt(eski('Şen Baykuş')).avatar).toEqual({ tip: 'hayvan', ad: 'baykus' });
    });

    it('ad hicbir hayvanla bitmiyorsa ilk hayvana duser', () => {
      expect(profilDuzelt(eski('Ali Veli')).avatar).toEqual({ tip: 'hayvan', ad: 'tilki' });
    });

    it('gecerli avatara dokunmaz', () => {
      const p = yeniProfil(sabit(0));
      expect(profilDuzelt(p)).toBe(p);
    });
  });

  describe('ad duzeltme', () => {
    it('bos ad kalmaz — yerine yenisi uretilir', () => {
      expect(adDuzelt('   ', sabit(0))).toBe('Meraklı Tilki');
    });

    it('bosluklari toplar, bastan sondan kirpar', () => {
      expect(adDuzelt('  Ali   Veli  ')).toBe('Ali Veli');
    });

    it('siniri asan ad kisaltilir', () => {
      expect(adDuzelt('x'.repeat(100))).toHaveLength(AD_SINIR);
    });

    // Turkce harf kaybolmasin: slice karakter sayar, bayt degil.
    it('Turkce harfleri bozmaz', () => {
      expect(adDuzelt('Şen Baykuş')).toBe('Şen Baykuş');
    });
  });

  it('uretilen ad iki kelime', () => {
    expect(rastgeleAd(sabit(0.99)).split(' ')).toHaveLength(2);
  });
});

describe('cerceveler', () => {
  const bos = { ogrenilen: 0, seri: 0, setBitti: false };

  it('ilk cerceve herkeste var, digerleri kilitli baslar', () => {
    expect(cerceveAcikMi(CERCEVELER[0], bos)).toBe(true);
    expect(CERCEVELER.slice(1).every((c) => !cerceveAcikMi(c, bos))).toBe(true);
  });

  it('kilit gercek ilerlemeye bakar', () => {
    const c = CERCEVELER.find((c) => c.ad === 'halat')!;
    expect(cerceveAcikMi(c, { ...bos, ogrenilen: 9 })).toBe(false);
    expect(cerceveAcikMi(c, { ...bos, ogrenilen: 10 })).toBe(true);
  });

  it('seti bitirmek en ustteki cerceveyi acar', () => {
    const c = CERCEVELER.find((c) => c.ad === 'elmas')!;
    expect(cerceveAcikMi(c, { ogrenilen: 999, seri: 999, setBitti: false })).toBe(false);
    expect(cerceveAcikMi(c, { ...bos, setBitti: true })).toBe(true);
  });

  /*
    Kutlama ancak GERCEKTEN yeni bir sey acilinca cikmali; ayni esigin
    ustunde kalmak yeniden kutlanmaz.
  */
  it('yalnizca yeni acilanlari bildirir', () => {
    expect(yeniAcilanlar({ ...bos, ogrenilen: 9 }, { ...bos, ogrenilen: 10 }).map((c) => c.ad)).toEqual([
      'halat',
    ]);
    expect(yeniAcilanlar({ ...bos, ogrenilen: 10 }, { ...bos, ogrenilen: 11 })).toEqual([]);
  });

  /*
    Yedek baska bir cihazdan geri yuklenince kazanimlar farkli olabilir:
    hak edilmemis cerceve sessizce varsayilana duser.
  */
  it('hak edilmeyen cerceve varsayilana duser', () => {
    const p = { ...yeniProfil(sabit(0)), cerceve: 'elmas' };
    expect(gecerliCerceve(p, bos)).toBe('halka');
    expect(gecerliCerceve(p, { ...bos, setBitti: true })).toBe('elmas');
  });
});
