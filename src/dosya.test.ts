import { describe, expect, it, afterEach, vi } from 'vitest';
import { paylasilabilir, yedekAdi, yol } from './dosya';

/**
 * Kabuk taklidi. `yol()` iki global'e bakiyor ve ikisi de test ortaminda
 * yok; hangi kabukta hangi yolun secildigi bu yuzden ancak taklitle
 * olculebilir. Karar tablosu kodda tek satir, ama YANLIS olursa APK'da
 * hicbir sey yapmayan bir dugme birakir — sessiz kalite hatasi.
 */
function kabuk({ native, canShare }: { native?: boolean; canShare?: boolean }) {
  vi.stubGlobal('window', native === undefined ? undefined : { Capacitor: { isNativePlatform: () => native } });
  vi.stubGlobal('navigator', canShare === undefined ? {} : { canShare: () => canShare });
}

afterEach(() => vi.unstubAllGlobals());

const blob = () => new Blob(['{}'], { type: 'application/json' });

describe('yol', () => {
  it('Capacitor kabugunda native secer', () => {
    // APK: `navigator.share` zaten tanimsiz, canShare true olsa bile native kazanir.
    kabuk({ native: true, canShare: true });
    expect(yol(blob(), 'y.json')).toBe('native');
  });

  it('tarayicida paylasim varsa web secer', () => {
    kabuk({ native: false, canShare: true });
    expect(yol(blob(), 'y.json')).toBe('web');
  });

  it('paylasim yoksa indirmeye duser', () => {
    kabuk({ native: false, canShare: false });
    expect(yol(blob(), 'y.json')).toBe('indir');
  });

  it('canShare hic yokken indirmeye duser', () => {
    // Masaustu Firefox: `navigator.canShare` tanimsiz, patlamamali.
    kabuk({ native: false });
    expect(yol(blob(), 'y.json')).toBe('indir');
  });

  it('dosya verilmezse paylasim sorulamaz, indir doner', () => {
    kabuk({ native: false, canShare: true });
    expect(yol()).toBe('indir');
  });
});

describe('paylasilabilir', () => {
  it('native kabukta dogru', () => {
    kabuk({ native: true, canShare: false });
    expect(paylasilabilir()).toBe(true);
  });

  it('canShare varsa dogru', () => {
    kabuk({ native: false, canShare: true });
    expect(paylasilabilir()).toBe(true);
  });

  it('ikisi de yoksa yanlis', () => {
    kabuk({ native: false });
    expect(paylasilabilir()).toBe(false);
  });
});

describe('yedekAdi', () => {
  const gun = new Date('2026-09-22T10:00:00Z');

  it('profil adini dosya adina sadelestirerek koyar', () => {
    expect(yedekAdi('Meraklı Tilki', gun)).toBe('merakli-tilki-yedek-2026-09-22.json');
  });

  it('butun Turkce harfleri cevirir', () => {
    expect(yedekAdi('ĞÜŞİÖÇ', gun)).toBe('gusioc-yedek-2026-09-22.json');
  });

  it('ad yoksa genel ada duser', () => {
    expect(yedekAdi(undefined, gun)).toBe('hafizada-yedek-2026-09-22.json');
  });

  it('adin tamami elenirse genel ada duser', () => {
    // Yalnizca isaretten olusan bir ad, bos bir on ek birakirdi: "-yedek-...".
    expect(yedekAdi('!!! ???', gun)).toBe('hafizada-yedek-2026-09-22.json');
  });

  it('bas ve sondaki tireleri atar', () => {
    expect(yedekAdi(' Ali ', gun)).toBe('ali-yedek-2026-09-22.json');
  });
});
