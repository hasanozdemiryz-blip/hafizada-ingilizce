/**
 * PROFIL CERCEVELERI.
 *
 * Oyunlardaki "premium avatar cercevesi" fikri — ama SATILMIYOR,
 * KAZANILIYOR. Bu urunun seriyle ilgili ilkesi "odul var, ceza yok";
 * cerceve de o ailedendir: yaptigin isin gorunur nisani.
 *
 * Kilit kosullari GERCEK ilerlemeye bagli. Sarti "uygulamayi 3 gun ac"
 * gibi bir katilim olcusu degil, "50 kelime ogren" gibi bir is olcusu:
 * bu uygulamada odul, yapilan sey icin verilir.
 */
import type { Profil } from './types';

/** Kullanicinin kazanimlari — kilitleri bu uc sayi acar. */
export type Kazanim = {
  /** Tanisilan kelime sayisi — birikimli, geri gitmez */
  ogrenilen: number;
  /** SIMDIYE KADARKI en uzun seri — mevcut seri degil (bkz. types.ts) */
  seri: number;
  setBitti: boolean;
};

type Kilit =
  | { tip: 'kelime'; esik: number }
  | { tip: 'seri'; esik: number }
  | { tip: 'set' };

export type Cerceve = {
  /** Dosya adi: src/assets/cerceveler/<ad>.png */
  ad: string;
  baslik: string;
  /** null = herkeste var */
  kilit: Kilit | null;
};

/**
 * Sira KOLAYDAN ZORA — ve son dordunde METAL kademesi.
 *
 * Ilk ikisi markanin kendi dilinde (lacivert + kanca sarisi): baslangic
 * cercevesi arayuzun geri kalaniyla ayni dilde olmali. Sonrakiler
 * bakir → gumus → altin → platin: hangisinin daha degerli oldugu
 * yazi okunmadan, renge bakarak anlasiliyor.
 *
 * Kosullar iki eksende:
 *   kelime — birikimli, hicbir zaman geri gitmez
 *   seri   — EN UZUN seri, mevcut degil (bkz. types.ts `bestStreak`)
 *   set    — bir kez olan sey
 *
 * Seri kosulunun "en uzun"a bakmasi kritik: mevcut seriye baksaydi seri
 * kirilinca kazanilmis cerceve geri alinirdi ve bu CEZA olurdu.
 */
export const CERCEVELER: Cerceve[] = [
  { ad: 'halka', baslik: 'Halka', kilit: null },
  { ad: 'halat', baslik: 'Halat', kilit: { tip: 'kelime', esik: 10 } },
  { ad: 'bronz', baslik: 'Bronz', kilit: { tip: 'kelime', esik: 25 } },
  { ad: 'gumus', baslik: 'Gümüş', kilit: { tip: 'seri', esik: 7 } },
  { ad: 'altin', baslik: 'Altın', kilit: { tip: 'kelime', esik: 50 } },
  { ad: 'elmas', baslik: 'Elmas', kilit: { tip: 'set' } },
];

/** Profili olmayan/eski kayitlar icin — herkeste olan cerceve. */
export const VARSAYILAN_CERCEVE = CERCEVELER[0].ad;

export const cerceveBul = (ad: string): Cerceve =>
  CERCEVELER.find((c) => c.ad === ad) ?? CERCEVELER[0];

export function cerceveAcikMi(cerceve: Cerceve, k: Kazanim): boolean {
  if (!cerceve.kilit) return true;
  switch (cerceve.kilit.tip) {
    case 'kelime':
      return k.ogrenilen >= cerceve.kilit.esik;
    case 'seri':
      return k.seri >= cerceve.kilit.esik;
    case 'set':
      return k.setBitti;
  }
}

/** Kilidin NASIL acilacagi — kilitli kutunun altinda yazar. */
export function kilitYazisi(cerceve: Cerceve): string {
  if (!cerceve.kilit) return '';
  switch (cerceve.kilit.tip) {
    case 'kelime':
      return `${cerceve.kilit.esik} kelime`;
    case 'seri':
      return `${cerceve.kilit.esik} gün üst üste`;
    case 'set':
      return 'Seti bitir';
  }
}

/**
 * Kazanimlar degisince YENI acilan cerceveler.
 *
 * Ders sonunda "yeni cerceve kazandin" demek icin: oncesi ve sonrasi
 * karsilastiriliyor. Kutlama ancak gercekten yeni bir sey olunca cikar.
 */
export function yeniAcilanlar(onceki: Kazanim, simdiki: Kazanim): Cerceve[] {
  return CERCEVELER.filter((c) => !cerceveAcikMi(c, onceki) && cerceveAcikMi(c, simdiki));
}

/** Profilin cercevesi hala acik mi — yedek geri yuklenince kontrol edilir. */
export const gecerliCerceve = (profil: Profil, k: Kazanim): string =>
  cerceveAcikMi(cerceveBul(profil.cerceve), k) ? profil.cerceve : VARSAYILAN_CERCEVE;
