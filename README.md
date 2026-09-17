# Hafızada İngilizce

Türkçe konuşanlara İngilizce kelime öğreten PWA. Her kelime bir **Türkçe ses kancasına** bağlanıyor ve bu bağ **tek bir görselle** anlatılıyor.

## Çalıştırma

```bash
npm install
npm run dev          # http://localhost:5173
```

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Build'i servis eder (PWA'yı test etmek için) |
| `npm test` | Çekirdek mantık testleri |
| `npm run import:cards` | `mnemonik-aday-havuzu.xlsx` → `content/cards.json` |
| `npm run icons` | `public/icon.svg` → PWA ikonları (PNG) |

## Çekirdek fikir

**İki ritim, tek kart.** Bu üründe birbirine benzemeyen iki iş var:

- **Tanış** — kodlama. Yavaş, tek kart, tam ekran. Tek soru: *kanca tuttu mu?*
- **Tekrarla** — hatırlama. Hızlı, ritmik, FSRS zamanlamalı.

**Aşamalı iskele.** Mnemonik kalıcı bir koltuk değneği değil, sökülecek bir iskele. Destek tekrar sayısına değil **başarıya** göre azalır:

| Seviye | Soru yüzünde ne var |
|---|---|
| L3 | Görsel + kelime + kanca + cümle |
| L2 | Görsel + kelime + kanca |
| L1 | Kelime + kanca |
| L0 | Sadece kelime |

`İyi`/`Kolay` → bir basamak iner. `Unuttum`/`Zor` → bir basamak çıkar. "Kancayı göster"e basıldıysa o tekrar destek indirmez.

FSRS aralığı ve destek seviyesi **bağımsız iki eksen**: bir kart uzun aralığa çıkmış ama hâlâ L2'de olabilir.

## Yapı

```
content/cards.json     İçeriğin tek kaynağı (xlsx'ten üretilir)
src/
  content.ts           Kart havuzu, desteler, sabitler
  scheduler.ts         FSRS + aşamalı iskele + seans kurulumu
  dates.ts             Seri / tarih mantığı (saf, test edilebilir)
  db.ts                Dexie (IndexedDB) — ilerleme cihazda
  screens/             Home, IntroSession, ReviewSession, DeckTest
tools/
  import-xlsx.mjs      Tablo → JSON, doğrulama raporuyla
  make-icons.mjs       SVG → PNG ikonlar
```

İlerleme tamamen tarayıcıda (IndexedDB). Backend yok. Ana ekrandaki **Yedek al / Geri yükle** ile taşınır.

## İçerik kalite sinyalleri

Uygulama aynı zamanda bir içerik ölçüm aracı. Her kart şunları biriktirir:

| Alan | Ne söyler |
|---|---|
| `introStuck` | Tanış'ta "Tutmadı" dendi — kanca ilk duyuşta oturmadı |
| `hookRevealCount` | "Kancayı göster" kaç kez — kanca zayıf |
| `firstRecallOk` | İlk gerçek tekrarda hatırlandı mı — "haa" oldu mu |
| `support` takılması | L2'den inmiyorsa görsel bağı taşımıyor |

Hangi kartın revize edileceğini tahminle değil bu verilerle belirlemek için.

## Durum

- **Faz 0 — tamam.** 145 aday içe aktarıldı, 100'ü "Tutan" (v1 seti).
- **Faz 1 — tamam.** İki modlu uygulama, desteler, test, seri, PWA.
- **Faz 2 — kilitli.** Kart görselleri henüz üretilmedi; görsel yerine brief metni gösteriliyor, akış eksiksiz çalışıyor.
