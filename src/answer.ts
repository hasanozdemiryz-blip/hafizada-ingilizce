/**
 * Yazilan cevabin degerlendirilmesi.
 *
 * Bu modul urundeki en onemli degisikligin cekirdegi: uygulama ilk kez
 * cevabin dogru olup olmadigini KENDI biliyor. Hatirla asamasinda kullanici
 * kendini puanliyor (`Unuttum/Zor/Iyi/Kolay`) — insanlar kendilerini
 * kandirir ve FSRS o beyanla besleniyor. Uretim ve dinleme asamalarinda
 * puan beyandan degil cevaptan cikiyor.
 *
 * Saf: DOM yok, IndexedDB yok, test edilebilir.
 */

export type Dil = 'en' | 'tr';

/** Turkce harfleri ASCII karsiligina katlar. */
const TR_KATLAMA: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
};

/**
 * Buyuk/kucuk, bosluk ve noktalama farklarini siler.
 *
 * Turkce tarafta harfler ASCII'ye katlanir: cogu kisi telefonda "kötü"
 * yerine "kotu", "kapı" yerine "kapi" yaziyor ve bunu yanlis saymak
 * kelime bilgisini degil klavye aliskanligini olcmek olurdu. Katlamanin
 * yeni bir belirsizlik yaratmadigi dogrulandi — setteki tum Turkce
 * karsiliklar katlandiktan sonra da birbirinden ayri.
 *
 * "erkek kardeş" gibi cok kelimeli karsiliklarda bosluk da dustugu icin
 * "erkekkardes" de kabul edilir.
 */
export const normalize = (s: string, dil: Dil = 'en'): string => {
  if (dil === 'tr') {
    return s
      .toLocaleLowerCase('tr')
      .replace(/[çğıöşüâîû]/g, (h) => TR_KATLAMA[h] ?? h)
      .replace(/[^a-z]/g, '');
  }
  return s.toLocaleLowerCase('en').normalize('NFKD').replace(/[^a-z]/g, '');
};

/** Klasik Levenshtein. Kelimeler kisa (3-7 harf), maliyeti onemsiz. */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let onceki = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const simdi = [i];
    for (let j = 1; j <= b.length; j++) {
      simdi[j] = Math.min(
        onceki[j] + 1,
        simdi[j - 1] + 1,
        onceki[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    onceki = simdi;
  }
  return onceki[b.length];
}

export type Judgement = 'dogru' | 'yakin' | 'yanlis';

/**
 * Tek harflik fark KISA kelimelerde kabul edilmez.
 * `car`/`cat`, `bad`/`bat`, `cup`/`cut` aralarinda bir harf var ama
 * bambaska kelimeler — havuzun %59'u 4 harf veya daha kisa. Uzun
 * kelimelerde ise tek harf genelde yazim hatasidir.
 */
const YAKIN_ESIK = 5;

/**
 * Yazilan cevabi degerlendirir.
 *
 * `havuz` verilirse (o yondeki TUM cevaplarin normalize hali), yazilan sey
 * baska bir GERCEK kelimeyse asla "yakin" sayilmaz. Bu sart olmadan
 * `snake`/`shake` ve `shore`/`short` birbirine puan yazdiriyor: ikisi de
 * uzun, aralarinda tek harf var, ama ikisi de havuzda duran ayri kelimeler.
 * Yazim hatasi ile baska bir kelime arasindaki fark budur.
 */
export function judge(
  input: string,
  expected: string,
  { havuz, dil = 'en' }: { havuz?: ReadonlySet<string>; dil?: Dil } = {},
): Judgement {
  const a = normalize(input, dil);
  const b = normalize(expected, dil);
  if (a.length === 0) return 'yanlis';
  if (a === b) return 'dogru';
  if (havuz?.has(a)) return 'yanlis';
  if (b.length >= YAKIN_ESIK && distance(a, b) === 1) return 'yakin';
  return 'yanlis';
}
