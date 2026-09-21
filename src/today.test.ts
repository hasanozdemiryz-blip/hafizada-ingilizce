import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/**
 * Store modul seviyesinde durum tutuyor; her test taze bir modulle
 * calismali, yoksa testlerin sirasi sonucu belirler.
 */
async function tazeModul(baslangic: Date) {
  vi.resetModules();
  vi.setSystemTime(baslangic);
  return import('./today');
}

const GECE = new Date(2026, 8, 21, 23, 59, 30);
const ERTESI = new Date(2026, 8, 22, 0, 0, 10);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test('ayni gun icinde haber verilmez', async () => {
  const { guneAbone, gunuKontrolEt } = await tazeModul(GECE);
  let haber = 0;
  const birak = guneAbone(() => haber++);

  expect(gunuKontrolEt(new Date(2026, 8, 21, 23, 59, 59))).toBe(false);
  expect(haber).toBe(0);

  birak();
});

test('gun degisince bir kez haber verilir', async () => {
  const { guneAbone, gunuKontrolEt } = await tazeModul(GECE);
  let haber = 0;
  const birak = guneAbone(() => haber++);

  expect(gunuKontrolEt(ERTESI)).toBe(true);
  expect(haber).toBe(1);

  // Ayni yeni gun: durum tazelendi, ikinci haber yok
  expect(gunuKontrolEt(new Date(2026, 8, 22, 8, 0, 0))).toBe(false);
  expect(haber).toBe(1);

  birak();
});

test('zamanlayici gece yarisini kendiliginden yakalar', async () => {
  const { guneAbone } = await tazeModul(GECE);
  let haber = 0;
  const birak = guneAbone(() => haber++);

  // Ekran acik duruyor, kimse dokunmuyor: gun yine de donmeli
  vi.setSystemTime(ERTESI);
  vi.advanceTimersByTime(60_000);
  expect(haber).toBe(1);

  birak();
});

test('abone kalmayinca zamanlayici durur', async () => {
  const { guneAbone } = await tazeModul(GECE);
  const birak = guneAbone(() => {});
  expect(vi.getTimerCount()).toBe(1);

  birak();
  expect(vi.getTimerCount()).toBe(0);
});
