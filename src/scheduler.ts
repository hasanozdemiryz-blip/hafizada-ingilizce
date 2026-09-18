/**
 * Zamanlama ve egzersiz merdiveni.
 *
 * Iki soru ayri ayri yanitlanir:
 *   FSRS -> kart NE ZAMAN gelecek
 *   step -> kart geldiginde NASIL sorulacak
 *
 * Ikisi birbirine bagli degil: bir kart uzun araliga cikmis ama hala
 * 2. basamakta olabilir.
 */
import {
  Rating,
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as FSRSCard,
} from 'ts-fsrs';
import { BATCH, CARDS, ESKI_GUN, LIMIT_MAX } from './content';
import { ILK_ADIM, clampStep, olculebilir, shuffle } from './exercise';
import { todayKey } from './dates';
import type { Card, Progress } from './types';

const f = fsrs(generatorParameters({ enable_fuzz: true }));

/**
 * Basarisiz cevaplanan kart seansi terk etmez: kullanici seansi
 * hatirlayamadigi bir kartla bitirmemeli. Pencere, FSRS'in
 * (re)learning adimlarini kapsayacak kadar genis — adim suresi
 * degisirse kural bozulmasin diye.
 */
const REQUEUE_WINDOW_MS = 30 * 60 * 1000;

const toProgress = (
  cardId: string,
  fsrsCard: FSRSCard,
  rest: Omit<Progress, 'cardId' | 'fsrs' | 'due'>,
): Progress => ({ cardId, fsrs: fsrsCard, due: fsrsCard.due, ...rest });

/**
 * Kart havuza girer.
 *
 * Burada NOT VERILMEZ. Once kullaniciya "Kanca tuttu mu?" diye soruluyordu
 * ve cevabi ilk FSRS notu oluyordu — bir beyan. Artik ilk not, tanismanin
 * hemen ardindaki ogrenme testinden gelir (bkz. `learningCheck`).
 */
export function introduceCard(card: Card, now = new Date()): Progress {
  return toProgress(card.id, createEmptyCard(now), {
    step: ILK_ADIM,
    introduced: true,
    introducedAt: now.toISOString(),
    firstCheckOk: null,
    unaidedOk: null,
    produceOk: null,
    hookRevealCount: 0,
    failCount: 0,
  });
}

/**
 * Ogrenme testi — tanismanin hemen ardindaki kontrol.
 *
 * Kartin ILK gercek notunu burasi verir. Merdiveni oynatmaz: kelime hala
 * kisa sureli hafizada, buradan gelen basari "ogrenildi" demek degil.
 * Isi iki tane: FSRS'i gercek bir cevapla baslatmak ve kancanin ilk
 * denemede tutup tutmadigini OLCMEK.
 */
export function learningCheck(prev: Progress, ok: boolean, now = new Date()): Progress {
  const { card: next } = f.next(prev.fsrs, now, ok ? Rating.Good : Rating.Again);
  return {
    ...prev,
    fsrs: next,
    due: next.due,
    firstCheckOk: prev.firstCheckOk ?? ok,
  };
}

/**
 * Tekrar akisi.
 *
 * Merdiven uc durumlu:
 *   yanlis          -> bir basamak GERI
 *   kancayla dogru  -> YERINDE kal
 *   yardimsiz dogru -> bir basamak ILERI
 *
 * Ortadaki onemli: kanca ipucu kullanmak basarisizlik degil, araci
 * kullanmaktir. Dogru cevabi geri atmak kullaniciyi ipucundan kacinmaya,
 * sonra tahmin etmeye iter.
 *
 * Olcum cevaplandigi andaki basamaga gore yapilir (`prev.step`), sonrakine
 * gore degil — hangi yardimla bilindigi onemli.
 */
export function reviewCard(
  prev: Progress,
  ok: boolean,
  hookRevealed: boolean,
  now = new Date(),
): { progress: Progress; requeue: boolean } {
  const { card: next } = f.next(prev.fsrs, now, ok ? Rating.Good : Rating.Again);
  const yardimsiz = ok && !hookRevealed;
  const olcum = olculebilir(prev.step);

  const progress: Progress = {
    ...prev,
    fsrs: next,
    due: next.due,
    step: ok ? clampStep(prev.step + (yardimsiz ? 1 : 0)) : clampStep(prev.step - 1),
    hookRevealCount: prev.hookRevealCount + (hookRevealed ? 1 : 0),
    failCount: prev.failCount + (olcum && !ok ? 1 : 0),
    unaidedOk: prev.unaidedOk ?? (olcum ? yardimsiz : null),
    produceOk: prev.produceOk ?? (prev.step === 5 ? yardimsiz : null),
  };

  return {
    progress,
    requeue: !ok && next.due.getTime() - now.getTime() <= REQUEUE_WINDOW_MS,
  };
}

// --- Seans kurulumu ---

export const isDue = (p: Progress, now = new Date()) =>
  p.introduced && p.due.getTime() <= now.getTime();

export function dueQueue(all: Progress[], now = new Date()): Progress[] {
  return all.filter((p) => isDue(p, now)).sort((a, b) => a.due.getTime() - b.due.getTime());
}

/**
 * Vadesi HENUZ gelmemis, gunu en yakin kartlar — "Simdi tekrarla" icin.
 *
 * "Bugunluk tamam" bir cikmaz sokak olmamali: calismak isteyen kullanici
 * uygulamayi kapatmak zorunda kalmasin. Kart erken sorulmus olur; FSRS
 * bunu gecen sureye gore hesapladigi icin zamanlama bozulmaz, yalnizca o
 * tekrarin hafizaya katkisi azalir.
 */
export function aheadQueue(all: Progress[], count: number, now = new Date()): Progress[] {
  return all
    .filter((p) => p.introduced && p.due.getTime() > now.getTime())
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, count);
}

/**
 * Bugun daha kac yeni kelime alinabilir.
 * Gunluk hedef gercek bir sinir: dolunca yeni kelime verilmez.
 */
export function remainingToday(all: Progress[], limit: number, now = new Date()): number {
  const tavan = Math.min(limit, LIMIT_MAX);
  return Math.max(0, tavan - introducedToday(all, now));
}

/**
 * Siradaki paket: tanisilmamis ilk kartlar, gunluk hedefi asmadan.
 * Paket `BATCH` kadar; hedefe daha az kaldiysa o kadar.
 */
export function nextBatch(all: Progress[], limit: number, now = new Date()): Card[] {
  const kalan = remainingToday(all, limit, now);
  if (kalan === 0) return [];
  const introduced = new Set(all.filter((p) => p.introduced).map((p) => p.cardId));
  return CARDS.filter((c) => !introduced.has(c.id)).slice(0, Math.min(BATCH, kalan));
}

/** Belirli bir gunde tanisilan kartlar. */
function introducedOn(all: Progress[], key: string): Progress[] {
  return all.filter(
    (p) => p.introduced && p.introducedAt && todayKey(new Date(p.introducedAt)) === key,
  );
}

/**
 * Bugun tanisilan kartlar — gunluk hedef dolunca "Hizli tekrar" bunlari
 * calistirir. Vadeye bakmaz: amac gunun kelimelerini pekistirmek.
 */
export function todaysCards(all: Progress[], now = new Date()): Progress[] {
  return introducedOn(all, todayKey(now));
}

/** Dun tanisilan kartlar. */
export function yesterdaysCards(all: Progress[], now = new Date()): Progress[] {
  const dun = new Date(now);
  dun.setDate(dun.getDate() - 1);
  return introducedOn(all, todayKey(dun));
}

/** Bu kadar gun once tanisilmis kartlar, en eskiden baslayarak. */
export function olderThan(all: Progress[], gun = ESKI_GUN, now = new Date()): Progress[] {
  const esik = now.getTime() - gun * 86_400_000;
  return all
    .filter((p) => p.introduced && p.introducedAt && new Date(p.introducedAt).getTime() < esik)
    .sort((a, b) => (a.introducedAt! < b.introducedAt! ? -1 : 1));
}

/**
 * Eskilerden RASTGELE secim.
 *
 * Hep en eskiden baslamak ayni kelimeleri dondurup durur; havuz buyudukce
 * arkadaki yuzlerce kelime hic gorunmez. Rastgele secim hepsine sira gelmesini
 * saglar.
 */
export function randomOld(
  all: Progress[],
  count: number,
  now = new Date(),
  rastgele: () => number = Math.random,
): Progress[] {
  return shuffle(olderThan(all, ESKI_GUN, now), rastgele).slice(0, count);
}

/** Bugun tanisilan kelime sayisi — oneri esigini asip asmadigini soyler. */
export function introducedToday(all: Progress[], now = new Date()): number {
  const today = todayKey(now);
  return all.filter((p) => p.introducedAt && todayKey(new Date(p.introducedAt)) === today).length;
}

export { Rating };
