# Hafızada İngilizce

Türkçe konuşanlara İngilizce kelime öğreten PWA. Her kelime bir **Türkçe ses kancasına** bağlanır ve bu bağ **tek bir görselle** anlatılır. Kullanıcı ezberlemez, bir görüntüye bağlar.

`sell ≈ sel` → *"Sel gelmeden evini sattı"*

---

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
```

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Build'i servis eder (PWA'yı test etmek için tek yol) |
| `npm test` | Çekirdek mantık testleri (59 test) |
| `npm run import:cards` | `mnemonik-aday-havuzu.xlsx` → `content/cards.json` |
| `npm run icons` | `brand/kilit-kaynak.png` → tüm ikon ve marka türevleri |

Yeni bilgisayarda: repoyu klonla, `npm install`, `npm run dev`. Başka kurulum yok — backend, API anahtarı, veritabanı yok.

---

## Sistem

### İki ritim, tek kart

Üründe birbirine benzemeyen iki iş var; tek ritme sıkıştırmak ikisini de bozuyor.

| | **Tanış** (kodlama) | **Tekrarla** (hatırlama) |
|---|---|---|
| Ritim | Yavaş, tek kart, tam ekran | Hızlı, ritmik |
| Soru | "Kanca tuttu mu?" → `Tuttu` / `Tutmadı` | `Unuttum / Zor / İyi / Kolay` |
| Hacim | Günde 5 (istenirse uzatılır) | Günde 40'a kadar |

`Tutmadı` bir öğrenme verisi değil, **içerik verisi** — kancanın zayıf olduğunu kaydeder.

### Aşamalı iskele

Mnemonik kalıcı bir koltuk değneği değil, sökülecek bir iskele. Destek tekrar sayısına değil **başarıya** göre azalır.

| Seviye | Soru yüzünde ne var |
|---|---|
| L3 | Görsel + kelime + kanca + cümle |
| L2 | Görsel + kelime + kanca |
| L1 | Kelime + kanca |
| L0 | Sadece kelime |

- `İyi`/`Kolay` → bir basamak iner · `Unuttum`/`Zor` → bir basamak çıkar
- "Kancayı göster"e basıldıysa o tekrar destek **indirmez**
- FSRS aralığından **bağımsız ikinci eksen**: kart uzun aralıkta ama hâlâ L2'de olabilir

### İçerik kuralları

- v1 seti: 100 "Tutan" kart. `Kurtarılabilir` sınıfı 2. set için bekliyor.
- Sıralama sıklık sırası. **Tek istisna:** kancası kelimenin aynısı olanlar (`far ≈ far`) Deste 1'e giremez — ilk on kart yöntemin ne yaptığını göstermeli.
- Eleme kriteri (xlsx'ten): *kanca tek cümlede anlatılıyor ve dinleyen "haa" diyor mu?*
- Soyut kelimeler bilinçli elendi; keyword yöntemi orada zayıflıyor.

### Kalite ölçümü

Uygulama aynı zamanda bir içerik ölçüm aracı. İlerleme sekmesindeki panel:

| Sinyal | Ne söyler |
|---|---|
| `introStuck` | Tanış'ta "Tutmadı" — kanca ilk duyuşta oturmadı |
| `hookRevealCount` | Kancaya kaç kez bakıldı — kanca zayıf |
| `firstRecallOk` | İlk gerçek tekrarda hatırlandı mı — "haa" oldu mu |

Hangi kartın revize edileceğini tahminle değil bu verilerle seçmek için.

---

## Yapı

```
content/cards.json     İçeriğin tek kaynağı (xlsx'ten üretilir)
brand/                 Marka kaynağı + sosyal medya görselleri
  kilit-kaynak.png     Tek kaynak: işaret + isim (şeffaf). Her şey bundan üretilir.
  kilit.png            Kırpılmış kilit — sosyal medya
  logo-isaret.png      Kare işaret — profil fotoğrafı, filigran
src/
  assets/cards/        Kart görselleri — dosya adı kart id'si (snake.webp)
  content.ts           Kart havuzu, desteler, sabitler
  scheduler.ts         FSRS + aşamalı iskele + seans kurulumu
  dates.ts             Seri, seri koruma, tarih mantığı (saf)
  db.ts                Dexie (IndexedDB) — ilerleme cihazda
  share.ts             Paylaşım görselleri (canvas)
  screens/             Welcome, Home, IntroSession, ReviewSession,
                       DeckTest, SessionDone, Words, Progress
tools/
  import-xlsx.mjs      Tablo → JSON + doğrulama raporu
  make-icons.mjs       SVG → PNG ikonlar
```

**Local-first.** İlerleme tamamen tarayıcıda (IndexedDB), backend yok. İlerleme sekmesindeki **Yedek al / Geri yükle** ile taşınır.

**Teknoloji:** Vite · React · TypeScript · Tailwind v4 · Dexie · ts-fsrs (FSRS-5) · vite-plugin-pwa. Yazı karakterleri (Fredoka + Plus Jakarta Sans) yerelde, çevrimdışı çalışır.

---

## Durum

**Bitti:** Logo + marka kilidi (tek kaynaktan; app simgesi, favicon ve sosyal görseller aynı işareti taşıyor) · iki modlu çekirdek · aşamalı iskele · 10'arlı desteler + sıralı kilit · deste bitirme testi · karşılama ekranı · hafif seri + seri koruma · günlük takip (ısı haritası) · Kelimelerim + arama + kanca panosu · yedekleme · PWA (kurulabilir, çevrimdışı).

**Yapılmadı ve nedeni:**

- **Kart görselleri** — 100'ün 1'i hazır (`snake`). Görseli olmayan kartta brief metni duruyor, akış eksiksiz çalışıyor. Yeni görsel eklemek için tek iş: `src/assets/cards/<kart-id>.webp` — kod veya JSON düzenlemesi yok.
- **Hatırlatma bildirimi** — PWA'da kapalıyken bildirim göndermek sunucu gerektiriyor (Web Push). Backend'siz mümkün değil. Aynı sınır ana ekran widget'ı için de geçerli (o native istiyor).
- **Telaffuz** — ses kancası yanlış telaffuz öğretebilir (`sell` gerçekte "sel" değil). Planlanan çözüm: L1–L0'da, iskele sökülürken devreye girsin.

**Sırada:** görseller · içerik havuzunu 300'e çıkarma · soyut kelimeler için ayrı mod · hesap + bulut senkronu (gerekirse).

---

## Kararlar (neden böyle)

- **Oyunlaştırma yok** (XP, lig, can, maskot). Duolingo'nun kendi sorunu "içi boş katılım"; ayırt edici yanımız mekanik değil kancanın kalitesi.
- **Ham tekrar borcu asla gösterilmez.** SRS'te bırakmanın bir numaralı sebebi "347 tekrar bekliyor" kaygısı. Sadece bugünün porsiyonu gösterilir.
- **Seri: ödül var, ceza yok.** Kırılınca suçlayıcı bildirim gelmez; tek günlük boşlukta koruma hakkı harcanır.
- **Günlük bütçe fren, duvar değil.** İsteyen "5 kelime daha" ile devam eder.
- **Arayüz kartın çerçevesi, kart kahraman.** 3D nesne/avatar bilinçli alınmadı — çerçeve bağırırsa resim kaybolur.
