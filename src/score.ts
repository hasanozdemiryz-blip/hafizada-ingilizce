/**
 * Puanlama.
 *
 * Once "Nerede duruyorsun" diye alti satirlik bir DAGILIM vardi
 * (`1. Eslestirme: 7`, `2. Coktan secmeli: 2`...). Dagilim, degerlendirme
 * degil: "iyi gidiyor muyum?" sorusuna cevap vermiyordu.
 *
 * Yerine iki yuzde:
 *   Basari  — penceredeki kelimelerin ne kadarini EN SON dogru yaptigin
 *   Ustalik — kelimelerin merdivende ne kadar yukari ciktigi (anlik)
 *
 * Saf: IndexedDB'ye ve DOM'a bagimsiz, test edilebilir.
 */
import { SON_ADIM, ILK_ADIM } from './exercise';
import { lastNDays } from './dates';
import type { AppState, Cevap, Progress } from './types';

export type Pencere = 'gun' | 'hafta' | 'ay' | 'toplam';

/** `gun: null` = sinir yok, butun gecmis. */
export const PENCERELER: { id: Pencere; ad: string; gun: number | null }[] = [
  { id: 'gun', ad: 'Gün', gun: 1 },
  { id: 'hafta', ad: 'Hafta', gun: 7 },
  { id: 'ay', ad: 'Ay', gun: 30 },
  { id: 'toplam', ad: 'Toplam', gun: null },
];

export const pencereGun = (p: Pencere) => PENCERELER.find((x) => x.id === p)!.gun;

/** Pencerenin ilk aninin epoch ms degeri; `null` = sinirsiz. */
export function pencereBaslangic(pencere: Pencere, now = new Date()): number | null {
  const gun = pencereGun(pencere);
  if (gun === null) return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (gun - 1));
  return d.getTime();
}

export type Basari = {
  percent: number;
  /** En son DOGRU yapilan alistirma (kelime x basamak) sayisi — yuzdenin payi */
  dogru: number;
  /** Penceredeki farkli alistirma sayisi — yuzdenin paydasi */
  toplam: number;
  /** Kac farkli KELIME calisildi */
  kelime: number;
  /** Ham hacim: kac cevap verildi */
  cevap: number;
  /** Bunlarin kaci yanlisti */
  yanlisCevap: number;
};

/**
 * Basari: penceredeki her ALISTIRMANIN (kelime x basamak) en son cevabi.
 *
 * Iki tasarim hatasindan gecti, ikisi de gercek veriyle goruldu:
 *
 * 1. Once gun bazinda toplu sayaclar toplaniyordu. Bir kelimeyi yanlis
 *    yapip sonra uc kez dogru yapinca gun %75 oluyordu — eski yanlis hic
 *    silinmiyor, yalnizca seyreliyordu. Istenen bu degildi: "yeniden
 *    calisinca duzelsin".
 *
 * 2. Sonra birim KELIME oldu: her kelimenin en son cevabi. Ama ogrenme
 *    testi ayni kelimeyi ALTI kez, gittikce zorlasan basamaklarda soruyor
 *    ve en sonda dinleme var. Gercek bir derste 30 cevabin 21'i dogruydu
 *    ve bes kelimenin de SON cevabi yanlis cikti: ekranda %0 yazdi.
 *    "Son cevap" daha sonraki bir calismada anlamli, ayni testin daha zor
 *    basamagi icin degil — karsilastirma ayni basamakla yapilmali.
 *
 * Birim artik `kelime x basamak`. Ayni hucre yeniden calisilinca UZERINE
 * yaziliyor, yani istenen davranis duruyor:
 *   · Yanlis yaptigin alistirmayi tekrar edip dogru yapinca oran yukselir
 *   · Cok tekrar orani sisiremez, her hucrenin bir oyu var
 *   · Zor basamak kolay basamagin sonucunu silmez
 *
 * Ham hacim (`cevap`/`yanlisCevap`) ve kac kelime oldugu ayrica donuyor:
 * yuzdenin arkasinda ne kadar is oldugu ekranda durmali.
 *
 * `null`: o donemde hic cevap yok. %0 ile karistirilmamali — biri
 * "denedim, tutturamadim", digeri "hic calismadim".
 */
export function successRate(
  cevaplar: readonly Cevap[],
  pencere: Pencere,
  now = new Date(),
): Basari | null {
  const esik = pencereBaslangic(pencere, now);
  /** `cardId#step` -> o alistirmanin penceredeki en son cevabi */
  const son = new Map<string, { ts: number; ok: boolean }>();
  const kelimeler = new Set<string>();
  let cevap = 0;
  let yanlisCevap = 0;

  for (const c of cevaplar) {
    if (esik !== null && c.ts < esik) continue;
    cevap++;
    if (!c.ok) yanlisCevap++;
    kelimeler.add(c.cardId);

    // v6 oncesi kayitlarda basamak yok; hepsi tek hucrede toplanir
    const anahtar = `${c.cardId}#${c.step ?? '-'}`;
    const onceki = son.get(anahtar);
    // Esit zamanda sonra gelen kazanir: kayitlar eklenme sirasinda geliyor
    if (!onceki || c.ts >= onceki.ts) son.set(anahtar, { ts: c.ts, ok: c.ok });
  }

  if (son.size === 0) return null;
  const dogru = [...son.values()].filter((x) => x.ok).length;
  return {
    percent: Math.round((dogru / son.size) * 100),
    dogru,
    toplam: son.size,
    kelime: kelimeler.size,
    cevap,
    yanlisCevap,
  };
}

/**
 * Penceredeki kac gunde calisildigi — duzenlilik, takvim olmadan.
 * `toplam: null` = "Toplam" penceresinde payda yok, sadece calisilan gun sayilir.
 */
export function activeDays(
  days: AppState['days'],
  pencere: Pencere,
  now = new Date(),
): { calisilan: number; toplam: number | null } {
  const doluMu = (k: string) => {
    const g = days[k];
    return g ? g.r + g.i > 0 : false;
  };

  const gun = pencereGun(pencere);
  if (gun === null) {
    return { calisilan: Object.keys(days).filter(doluMu).length, toplam: null };
  }

  const gunler = lastNDays(gun, now);
  return { calisilan: gunler.filter(doluMu).length, toplam: gunler.length };
}

/**
 * Ustalik: kelimelerin merdivendeki ortalama yuksekligi.
 * 1. basamak %0, 6. basamak %100. "Kac kelime biliyorum" degil,
 * "ne kadar iyi biliyorum".
 */
export function masteryRate(all: Progress[]): number | null {
  const ogrenilen = all.filter((p) => p.introduced);
  if (ogrenilen.length === 0) return null;
  const aralik = SON_ADIM - ILK_ADIM;
  const toplam = ogrenilen.reduce((n, p) => n + (p.step - ILK_ADIM) / aralik, 0);
  return Math.round((toplam / ogrenilen.length) * 100);
}

export type Yetenekler = {
  /** Tanistigim */
  taniyor: number;
  /** Turkcesinden Ingilizcesini en az bir kez yardimsiz sectigim */
  seciyor: number;
  /** En az bir kez bastan yazdigim */
  yaziyor: number;
  toplam: number;
};

/** Bir beceri "yapildi" sayilmasi icin gereken en dusuk basamak. */
const SECME_ESIK = 3;
const YAZMA_ESIK = 5;

/**
 * Kullanicinin NE YAPABILDIGI — YAPTIGI olculerek.
 *
 * Once merdiven konumuna bakiyordu (`step >= 3`, `>= 5`). Sonucu suydu:
 * kullanici derste kelimeyi ters secmeli, harf dizme ve yazmayla dogru
 * yapiyor, panelde alt iki satir yine 0 duruyordu — cunku merdiven
 * ogrenme testinde oynamiyor ve 3. basamaga cikmak gunler suruyor.
 * Kullanici panelin bozuk oldugunu dusundu; haksiz da degildi, "neler
 * yapabildin" sorusunun cevabi "bugun bastan yazdin" olmali.
 *
 * Artik cevap gunlugune bakiyor: o basamakta EN AZ BIR KEZ, kancaya
 * basmadan dogru yapmis olmak yeter. Olculen sey gercek, beyan degil.
 *
 * Bunun bedeli bilincli: unutulan kelime de sayilmaya devam eder, cunku
 * soru "hala biliyor musun" degil "yapabildin mi". "Hala" sorusunun
 * cevabi kalicilik yuzdesi (bkz. `masteryRate`) — iki panel yan yana
 * duruyor ve ayri seyler soyluyor.
 */
export function abilities(all: Progress[], cevaplar: readonly Cevap[] = []): Yetenekler {
  const ogrenilen = all.filter((p) => p.introduced);
  const havuz = new Set(ogrenilen.map((p) => p.cardId));

  const basardi = (esik: number) => {
    const set = new Set<string>();
    for (const c of cevaplar) {
      if (!c.ok || c.ipucu || c.step === null || c.step < esik) continue;
      if (havuz.has(c.cardId)) set.add(c.cardId);
    }
    return set.size;
  };

  return {
    taniyor: ogrenilen.length,
    seciyor: basardi(SECME_ESIK),
    yaziyor: basardi(YAZMA_ESIK),
    toplam: ogrenilen.length,
  };
}
