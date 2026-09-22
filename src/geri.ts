/**
 * DONANIM GERI TUSU.
 *
 * Android'de geri tusu hic ele alinmiyordu, yani varsayilan davranis
 * gecerliydi: nerede olursan ol, geri = uygulamadan cik. Ders ortasinda
 * yanlislikla basan kullanici dogrudan disari dusuyordu.
 *
 * Istenen davranis:
 *   bir ekranin icindeyken  -> bir ust ekrana
 *   ana ekranda             -> "cikmak istiyor musun?" onayi
 *
 * NEDEN BIR YIGIN. Uygulamanin gezinmesi URL tabanli degil, state tabanli
 * (bkz. App.tsx `tab` / `flow`). Yani tarayicinin gecmisi bize "nerede
 * oldugumuzu" soylemiyor; o bilgi ekranlarin kendisinde. Her ekran kendi
 * isleyicisini kaydediyor, geri tusu en icteki isleyiciden basliyor.
 *
 * NEDEN ONCELIK, KAYIT SIRASI DEGIL. React `useEffect`leri COCUKTAN EBEVEYNE
 * dogru kosuyor: en ictek ekran ONCE kaydolur, App SONRA. Sirayla gidersek
 * en son kaydolan (App) en ustte cikar ve ic ekranlar hic soz alamaz.
 * Oncelik sayisi bu tuzagi kapatiyor.
 */
import { useEffect, useRef } from 'react';

/** `true` dondurmek "ele aldim" demek; `false` ustteki katmana birakir. */
type Isleyici = () => boolean;

type Kayit = { f: Isleyici; oncelik: number };

const kayitlar: Kayit[] = [];

/** Onceligi buyuk olan once sorulur. App 0, ekranlar 10, ic ekranlar 20. */
export function geriEkle(f: Isleyici, oncelik: number): () => void {
  const kayit = { f, oncelik };
  kayitlar.push(kayit);
  return () => {
    const i = kayitlar.indexOf(kayit);
    if (i >= 0) kayitlar.splice(i, 1);
  };
}

/** Geri istegini sirayla dolas; ilk `true` dondurende dur. */
export function geriBas(): boolean {
  for (const { f } of [...kayitlar].sort((a, b) => b.oncelik - a.oncelik)) {
    if (f()) return true;
  }
  return false;
}

/**
 * Ekranin geri isleyicisi.
 *
 * `aktif` false iken kaydolmuyor — bir ekranin yalnizca belli bir
 * durumdayken geri tusunu ele almasi gerekebiliyor (Egzersiz'de calisma
 * suruyorsa durdur, secim ekranindaysa kapat, digerlerinde karisma).
 */
export function useGeri(f: Isleyici, oncelik: number, aktif = true): void {
  /*
    Isleyici bir REF'te tutuluyor ve her render'da tazeleniyor.

    Dogrudan kaydetseydik yalnizca ILK render'in kapanisi kaydolurdu ve
    isleyici state'i hep baslangic degeriyle okurdu — Egzersiz'in
    `calisiyor` kontrolu sonsuza kadar `false` gorur, App de her zaman
    cikis onayini acardi. Sessizce yanlis calisan turden bir hata.

    `f`yi bagimlilik listesine koymak da cozum degildi: her render'da
    yeniden uretildigi icin kayit her render'da sokulup takilirdi.
  */
  const son = useRef(f);
  son.current = f;

  useEffect(() => {
    if (!aktif) return;
    return geriEkle(() => son.current(), oncelik);
  }, [aktif, oncelik]);
}

/**
 * Native kabukta geri tusunu dinlemeye basla. Acilista BIR KEZ (main.tsx).
 *
 * Tarayicida hicbir sey yapmiyor: orada donanim geri tusu yok, tarayicinin
 * kendi geri dugmesi de bizim gecmisimizde bir sey bulamaz (tek sayfa).
 * `speech.ts` ve `dosya.ts` ile ayni kural — eklenti dinamik `import`,
 * web paketine giren bayt sifir.
 */
export async function geriHazirla(): Promise<void> {
  if (
    typeof window === 'undefined' ||
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform?.() !== true
  ) {
    return;
  }
  try {
    const { App } = await import('@capacitor/app');
    await App.addListener('backButton', () => {
      // Kimse ele almadiysa varsayilana donmuyoruz: App her zaman bir sey
      // yapiyor (en kotu ihtimalle cikis onayini aciyor). Buraya dusmek
      // App'in isleyicisinin kaydolmadigi anlamina gelir.
      geriBas();
    });
  } catch {
    // Eklenti yok ya da kopru cevap vermedi: varsayilan davranis kalir.
  }
}

/** Uygulamadan cik — yalnizca cikis onayindan cagriliyor. */
export async function uygulamadanCik(): Promise<void> {
  try {
    const { App } = await import('@capacitor/app');
    await App.exitApp();
  } catch {
    // Tarayicida ya da eklenti yokken: yapacak bir sey yok.
  }
}
