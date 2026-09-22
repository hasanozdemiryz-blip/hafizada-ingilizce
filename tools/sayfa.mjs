/**
 * Uretim SAYFALARINI okuyup hucrelere ayirir.
 *
 * Ikonlar da cerceveler de tek tek uretilmedi: her biri krem zeminli bir
 * izgarada, ayni firca ve ayni cizgi kalinligiyla bir arada cizildi. Set
 * olmalarinin sebebi bu. Bu modul o sayfalari isleyen ORTAK adimlari
 * tutuyor — `make-ui-icons.mjs` ve `make-frames.mjs` ikisini de kullanir.
 *
 * Bir sure sayfalardan gozle kirpilmis PNG'ler kullaniliyordu ve kirpma
 * kutulari dardi: sekiller kesiliyor, komsu hucreden parca bulasiyordu.
 * Kirpmayi olcum yapinca hepsi gecti (bkz. NOTLAR).
 */
import sharp from 'sharp';

/** Sayfalardaki GERCEK renkler — markanin renkleri degil, olculmus degerler. */
export const ZEMIN = [0xfb, 0xf3, 0xd7];
export const HAM_MUREKKEP = [0x0b, 0x20, 0x3a];
export const HAM_KANCA = [0xff, 0xcc, 0x1e];

/** Bir izdusumdeki dolu araliklar. */
export function bantlar(izdusum, esik, enAz) {
  const cikti = [];
  let bas = null;
  for (let i = 0; i < izdusum.length; i++) {
    if (izdusum[i] > esik) {
      if (bas === null) bas = i;
    } else if (bas !== null) {
      if (i - bas >= enAz) cikti.push([bas, i - 1]);
      bas = null;
    }
  }
  if (bas !== null && izdusum.length - bas >= enAz) cikti.push([bas, izdusum.length - 1]);
  return cikti;
}

/**
 * Yakin bantlari tek cizim say.
 *
 * Bir cizim kopuk parcalardan olusabiliyor: hoparlorun konisi ile ses
 * dalgalari arasinda 5 piksel var. Hucreler arasi bosluk ise 80 pikselden
 * genis, yani esik ikisini rahatca ayiriyor.
 */
export const birlestir = (bs, bosluk) =>
  bs.reduce((a, b) => {
    const son = a[a.length - 1];
    if (son && b[0] - son[1] <= bosluk) son[1] = b[1];
    else a.push([...b]);
    return a;
  }, []);

/**
 * Sayfayi oku, hucrelere ayir.
 *
 * Sutunlar HER SATIRIN ICINDE ayri araniyor. Tum sayfanin sutun izdusumu
 * alinirsa genis bir cizim (ornegin bes karolu eski `harf`) ustteki
 * sutun bosluklarini kapatip izgarayi yanlis gosteriyor.
 */
export async function sayfayiBol(yol, { esik = 45, bosluk = 40 } = {}) {
  const { data, info } = await sharp(yol).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;

  const uzak = (i) =>
    Math.max(
      Math.abs(data[i] - ZEMIN[0]),
      Math.abs(data[i + 1] - ZEMIN[1]),
      Math.abs(data[i + 2] - ZEMIN[2]),
    );

  const dolu = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) dolu[p] = uzak(p * 4) > esik ? 1 : 0;

  const satirIzdusumu = [];
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) n += dolu[y * W + x];
    satirIzdusumu.push(n);
  }

  const hucreler = [];
  bantlar(satirIzdusumu, 2, 20).forEach(([y0, y1], r) => {
    const izdusum = [];
    for (let x = 0; x < W; x++) {
      let n = 0;
      for (let y = y0; y <= y1; y++) n += dolu[y * W + x];
      izdusum.push(n);
    }
    birlestir(bantlar(izdusum, 1, 15), bosluk).forEach(([x0, x1], c) =>
      hucreler.push({ anahtar: `${r + 1},${c + 1}`, x0, x1, y0, y1 }),
    );
  });

  return { data, W, H, hucreler };
}

/** Hucreyi sayfadan kesip RGBA tampona alir. */
export function hucreyiKes(data, W, hucre) {
  const w = hucre.x1 - hucre.x0 + 1;
  const h = hucre.y1 - hucre.y0 + 1;
  const ham = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = ((hucre.y0 + y) * W + hucre.x0 + x) * 4;
      ham.set([data[k], data[k + 1], data[k + 2], 255], (y * w + x) * 4);
    }
  }
  return { ham, w, h };
}

/**
 * Kremi alfaya cevirir ve verilen renklere boyar.
 *
 * Sert bir renk anahtari (krem -> seffaf) kenarlari tirtikli birakirdi:
 * cizginin kenarindaki piksel krem ile murekkebin KARISIMI. Onun yerine
 * her piksel iki karisim dogrusuna (zemin->murekkep, zemin->kanca)
 * izdusuruluyor: hangi dogruya daha yakinsa rengi o, dogru uzerindeki
 * konumu da alfasi. Yumusak kenar korunur, renk tam token olur.
 */
export function boya(ham, genislik, yukseklik, murekkep, kanca) {
  const cikti = Buffer.alloc(genislik * yukseklik * 4);
  const dogrular = [
    { hamRenk: HAM_MUREKKEP, hedef: murekkep },
    { hamRenk: HAM_KANCA, hedef: kanca },
  ].map((d) => {
    const u = d.hamRenk.map((v, k) => v - ZEMIN[k]);
    return { ...d, u, uu: u[0] * u[0] + u[1] * u[1] + u[2] * u[2] };
  });

  for (let p = 0; p < genislik * yukseklik; p++) {
    const i = p * 4;
    const v = [ham[i] - ZEMIN[0], ham[i + 1] - ZEMIN[1], ham[i + 2] - ZEMIN[2]];

    let enIyi = null;
    let enAzKalinti = Infinity;
    for (const d of dogrular) {
      const t = (v[0] * d.u[0] + v[1] * d.u[1] + v[2] * d.u[2]) / d.uu;
      const kalinti = Math.hypot(...v.map((vk, k) => vk - t * d.u[k]));
      if (kalinti < enAzKalinti) {
        enAzKalinti = kalinti;
        enIyi = { t, hedef: d.hedef };
      }
    }

    const alfa = Math.max(0, Math.min(1, enIyi.t));
    cikti[i] = enIyi.hedef[0];
    cikti[i + 1] = enIyi.hedef[1];
    cikti[i + 2] = enIyi.hedef[2];
    cikti[i + 3] = Math.round(alfa * 255);
  }
  return cikti;
}

/** Opak piksellerin sinir kutusu. */
export function kutu(piks, w, h) {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (piks[(y * w + x) * 4 + 3] <= 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
