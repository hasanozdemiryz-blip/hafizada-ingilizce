import { describe, expect, it } from 'vitest';
import { PANO_MAX } from './share';
import { CARDS } from './content';

/**
 * PANONUN SINIRI SETTEN GERI KALMAMALI.
 *
 * Bu test bir davranisi degil, bir SOZU tutuyor: "seti bitiren kullanicinin
 * paylastigi sey eksiksiz olsun". Soz dort kez kirildi (24/26, 26/51,
 * 60/100) ve her seferinde ayni sekilde — sinir sabit kaldi, set buyudu,
 * kimse fark etmedi. Gorsel ancak tarayicida cizdirilince goruluyor,
 * yani gozle yakalanmasi mumkun degildi.
 *
 * Set yine buyurse bu test duser. Dusunce yapilacak sey `PANO_MAX`i
 * buyutmek DEGIL once: `duzen()` o kadar satiri okunur bicimde cizebiliyor
 * mu, ona bakmak. Cizemiyorsa pano bolunmeli.
 */
describe('kanca panosu', () => {
  it('tam seti tek panoya sigdirabiliyor', () => {
    expect(PANO_MAX).toBeGreaterThanOrEqual(CARDS.length);
  });

  it('sinir duzenin cizebildigi en buyuk panoyu asmiyor', () => {
    // 4 sutun x 26 satir — `duzen`in son kademesi. Uzeri satir yuksekligini
    // 25 pikselin altina indirir ve 20 puntoluk yazi ust uste biner.
    expect(PANO_MAX).toBeLessThanOrEqual(104);
  });
});
