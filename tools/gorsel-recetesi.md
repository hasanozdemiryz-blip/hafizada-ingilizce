# Kart görseli üretim reçetesi

Tutarlılığın tek kaynağı bu dosya. Üç kaldıraç birden gerekir; biri değişince
çizgi kalınlığı ve palet kayar:

| | |
|---|---|
| Model | `imagen-nano-banana-2` (Google Nano Banana Pro) |
| Seed | `20260918` — **değiştirme** |
| Oran | `4:3` (1024×768) |
| Stil referansı | ilk `snake` kartı, creation `VXEgEPIMMU` |
| Maliyet | 75 kredi/görsel |

> Bu reçete bir süre yalnızca sohbet geçmişinde vardı; ikinci parti üretilirken
> Magnific'teki eski creation'ların prompt'undan geri çıkarıldı. Bir daha
> kaybolmasın diye burada.

## İskelet

Her kart yalnızca **ilk satırı** ve **arka plan tonunu** değiştirir. Gerisi
kelimesi kelimesine aynı kalır.

```
<SAHNE — tek cümle>

Copy the reference image's drawing style exactly.

COMPOSITION: the subject occupies about 75% of the frame height, fully visible,
with an even margin of empty background on all four sides — nothing touches or
crosses the frame edge. Seen straight on, flat, not in perspective. Centred.

NO white outline around the subject. NO sticker border, NO die-cut edge, NO
cut-out effect. The artwork sits directly on the flat background.

ABSOLUTELY FLAT colour fills. NO gloss, NO shine, NO metallic sheen, NO specular
highlights, NO reflections, NO gradients, NO soft shading, NO texture, NO drop
shadow, NO ground shadow, NO ambient occlusion, NO 3D depth. Each object is a
base colour plus at most one slightly lighter flat tone.

Every shape outlined with a confident medium-thick, evenly rounded stroke in a
darker tone of its own fill colour, the same weight as the reference.

BACKGROUND: one single very pale washed-out <TON> tint, extremely light, close
to white. Completely empty — no scene, no props, no horizon, no pattern.

Inanimate objects have NO faces, NO eyes, NO mouths, NO limbs.

No text, no letters, no numbers, no logos anywhere in the image.
```

### Duruma göre eklenen bloklar

- **İnsan varsa** — tam gövde iste ve **kıyafeti yaz**. Yazmayınca çıplak gövde
  çiziyor; gövdesiz uzuv (yalnız ayak, yalnız el) kesik uzuv gibi çıkıyor.
- **Metin gerekiyorsa** — son satır: `The only text in the image is the word
  "DUR" written clearly in white on the red sign. No other text...`
  Türkçe metin sorun değil, `İ` dahil ilk denemede doğru çıkıyor.
- **Duvara/yüzeye monte bir şey varsa** — `flat against the wall — no bracket,
  no post, no pole, no metal mounting hardware, no shadow, no 3D depth`.

## Üretimde öğrenilenler

| Ders | Neden |
|---|---|
| "Özne çerçeveyi doldursun" deme | Model bunu "taşır" diye anlıyor; 5 görselin 4'ü alt kenardan kesildi |
| İnsanı tam gövde + kıyafetli iste | Gövdesiz uzuv rahatsız edici, kıyafetsiz istek çıplak gövde getiriyor |
| Kalabalığı tek tek yasakla | `deep`'e denizaltı, batık gemi, hazine sandığı koydu |
| Ölçek farkını nesneyle kur | `large`'da insan + dev gömlek iki denemede de aynı boyda çıktı |
| Spor/nesne adını tarif et | "football" → Amerikan futbolu topu; "round soccer ball with black pentagon patches" → doğru |
| Gölgeyi ayrıca yasakla | "NO drop shadow" yetmiyor, "NO ground shadow, NO ambient occlusion" da gerekiyor |
| Koyu sahne isteme | "karanlıkta yanan mum" arka plan kuralını bozuyor; sahneyi aydınlık kur |

## Boru hattı

```
üret → gorseller/<kart-id>.png → npm run import:images
     → src/assets/cards/<kart-id>.webp (800×600, q82, ~14 KB)
```

`content.ts` klasörü `import.meta.glob` ile tarar; `cards.json`'a dokunmak
gerekmez, dosyayı koyman yeter. Kart kendiliğinden sete girer.

> exFAT tuzağı: `gorseller/` içine kopyalarken macOS `._*` gölgeleri bırakıyor,
> importer bunları "tanınmayan kart id'si" diye uyarıyor.
> `find . -name '._*' -delete`
