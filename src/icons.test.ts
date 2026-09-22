import { describe, expect, it } from 'vitest';
import { IKONLAR, ikonUrl, type IkonAd } from './icons';

/**
 * Ikon setinin butunlugu.
 *
 * Kirilma yolu sessiz: `brand/ikonlar/` icinde bir dosya yeniden
 * adlandirilir, `npm run icons:ui` calisir, ama `IKONLAR` listesi eski
 * adda kalir. Tip sistemi bunu goremez — ad ile dosya arasindaki bag
 * derleme aninda degil, calisma aninda kuruluyor. O yuzden test.
 */
describe('ikon seti', () => {
  it('her adin duz ve ters dosyasi var', () => {
    for (const ad of IKONLAR) {
      expect(() => ikonUrl(ad), ad).not.toThrow();
      expect(() => ikonUrl(ad, true), `${ad} (ters)`).not.toThrow();
    }
  });

  it('uretilen her dosya listede — oksuz ikon kalmasin', () => {
    const uretilen = Object.keys(
      import.meta.glob('./assets/ikonlar/*.png', { eager: true, query: '?url', import: 'default' }),
    )
      .map((yol) => yol.split('/').pop()!.replace('.png', ''))
      .filter((ad) => !ad.endsWith('-ters'));

    expect([...uretilen].sort()).toEqual([...IKONLAR].sort());
  });

  it('bilinmeyen ad sessizce bos string dondurmez', () => {
    expect(() => ikonUrl('yok-boyle-bir-ikon' as IkonAd)).toThrow(/Ikon yok/);
  });
});
