import { describe, expect, it } from 'vitest';
import { pickVoice, type SesAdayi } from './speech';

const ses = (name: string, lang = 'en-US', localService = true): SesAdayi => ({
  name,
  lang,
  localService,
});

/**
 * Tarayicinin gercekte verdigi liste. Bir Mac'te `en-US` seslerinin yarisi
 * SAKA sesi; alfabetik ilk sira "Albert" ve o bir karikatur. Bu testler
 * yedek yolun oraya dusmemesini koruyor.
 */
const MACOS = [
  ses('Albert'),
  ses('Bahh'),
  ses('Bells'),
  ses('Boing'),
  ses('Bubbles'),
  ses('Cellos'),
  ses('Fred'),
  ses('İyi Haber'),
  ses('Jester'),
  ses('Junior'),
  ses('Kathy'),
  ses('Samantha'),
  ses('Zarvox'),
];

describe('ses secimi', () => {
  it('tercih listesindekini alir', () => {
    expect(pickVoice(MACOS)?.name).toBe('Samantha');
  });

  it('tercih sirasina uyar', () => {
    const v = [ses('Google US English'), ses('Samantha')];
    expect(pickVoice(v)?.name).toBe('Samantha'); // Samantha listede once
  });

  // Asil koruma: tercih edilen sesler yoksa saka sesine dusmemeli.
  it('tercih yoksa saka sesi secmez', () => {
    const sakasiz = MACOS.filter((v) => v.name !== 'Samantha');
    const secilen = pickVoice(sakasiz);
    expect(secilen?.name).not.toBe('Albert');
    expect(['Fred', 'Kathy']).toContain(secilen?.name);
  });

  it('yerellesmis saka ismini de eler', () => {
    const secilen = pickVoice([ses('İyi Haber'), ses('Kötü Haber'), ses('Fred')]);
    expect(secilen?.name).toBe('Fred');
  });

  // Sesin hic cikmamasi, kotu cikmasindan daha kotu.
  it('elde sadece saka sesi varsa yine de bir ses doner', () => {
    expect(pickVoice([ses('Zarvox'), ses('Boing')])?.name).toBe('Zarvox');
  });

  it('yerel ses agdakine tercih edilir', () => {
    const v = [ses('Bells'), ses('Reed', 'en-US', false), ses('Rocko', 'en-US', true)];
    expect(pickVoice(v)?.name).toBe('Rocko');
  });

  it('en-US yoksa baska bir Ingilizceye duser', () => {
    const v = [ses('Daniel', 'en-GB'), ses('Yelda', 'tr-TR')];
    expect(pickVoice(v)?.name).toBe('Daniel');
  });

  it('lang alt cizgiyle gelirse de tanir', () => {
    expect(pickVoice([ses('Samantha', 'en_US')])?.name).toBe('Samantha');
  });

  it('hic Ingilizce ses yoksa null', () => {
    expect(pickVoice([ses('Yelda', 'tr-TR')])).toBeNull();
    expect(pickVoice([])).toBeNull();
  });
});
