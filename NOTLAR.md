# Çalışma notları

Kararların **neden** öyle olduğunu tutar. Ne yapıldığı git geçmişinde,
nasıl çalıştığı README'de; burası sebepler için.

---

## 2026-09-18 — Merdiven, tek akış ve puanlama

Tek oturumda yapılan büyük yeniden kurgu. Sıralı olarak ne değişti ve niçin.

### Ölçüm bozuktu

`firstRecallOk` ilk tekrarda, yani kart hâlâ L3'teyken ölçülüyordu. L3 soru
yüzünde görsel, kanca **ve cümle** var — ve cümlelerin **%80'inde Türkçe
karşılık geçiyor** (`door/kapı → "Kapıda DUR"`). Yani neredeyse her zaman
`true` dönecekti. Ölçtüğü şey "hatırladın mı" değil **"okuyabildin mi"**ydi.

Bunu veriyle doğruladım: 100 kartın 80'inde cevap cümlenin içinde.

Ölçüm noktaları baştan tanımlandı: kancanın **ekranda olmadığı** basamaklardan
önce alınan hiçbir "doğru" kanca hakkında bir şey söylemiyor.

### İki eksen tek merdivene indi

`support` (3→0) + `stage` (recall/produce/listen) yerine tek `step` (1–6):

```
1 Eşleştirme · 2 Çoktan seçmeli · 3 Ters seçmeli
4 Harf dizme · 5 Yazma · 6 Dinleme
```

Sebep: kullanıcı iki ekseni anlamıyordu, kodda iki kavram taşımak da
gereksizdi. Kayıp: "kart uzun aralıkta ama hâlâ çok destekli" gibi ince
durumlar artık ifade edilemiyor — bilinçli takas.

Geçiş kuralı üç durumlu: **yanlış** geri · **kancayla doğru** yerinde ·
**yardımsız doğru** ileri. Ortadaki önemli — ipucu kullanmak başarısızlık
değil, aracı kullanmaktır; doğru cevabı geri atmak kullanıcıyı ipucundan
kaçınmaya, sonra tahmin etmeye iter.

### Beyan yerine ölçüm

Tanış'ta *"Kanca tuttu mu? [Tuttu] [Tutmadı]"* soruluyordu ve cevap ilk FSRS
notu oluyordu. Bu bir **beyan**dı. Kaldırıldı: artık tanışmanın hemen
ardındaki öğrenme testi hem ilk notu veriyor hem kancanın tutup tutmadığını
**ölçüyor**.

### Tek akış

Üç giriş noktası (Tanış · Tekrarla · Deste testi) tek "Başla"ya indi.
Kullanıcı her açılışta "hangisine basayım" diye düşünüyordu. Ders üç bölüm
hâlinde arka arkaya geliyor: yeni kelimeler → öğrenme testi → tekrar.

Deste kavramı tamamen kalktı — 20 numaralı kare "ilerleme göstergesi" değil
karar yükü yaratıyordu.

### Ders bütün

Yeni kelimeler önce bellekte tutulur, veritabanına ancak öğrenme testi
bitince yazılır. Önce her kart görülür görülmez yazılıyordu; yarıda çıkan
kullanıcının kartları "tanışıldı" sayılıp öğrenme testini hiç görmüyor,
ertesi gün 1. basamakta geri geliyordu — ne bitmiş ne bitmemiş.

Çıkışta kart içi uyarı: ne kaybedileceği açıkça yazıyor. Tarayıcının
`confirm()` kutusu kullanılmıyor — PWA'da bloklayan sistem diyalogu.

### Günlük hedef gerçek sınır

Bir ara tavan kaldırılmıştı; sonucu tekrar borcunun sessizce şişmesiydi.
Günde 15'in üstü, ertesi gün kaldırılamayan bir tekrar yığını demek.
Ayarlar'dan 5/10/15, **15 aşılamaz**. Dolunca ana ekran **"Hızlı tekrar"**a
döner ve gün boyunca orada kalır.

### Puanlama

"Nerede duruyorsun" altı satır sayı gösteriyordu — bir **dağılım**, bir
değerlendirme değil. Yerine iki yüzde:

- **Başarı** — cevapların ne kadarı doğru (Gün/Hafta/Ay). Bunun için
  doğru/yanlış **gün bazında** kaydedilmeye başlandı; önce yalnızca kaç kart
  çalışıldığı tutuluyordu.
- **Ustalık** — kelimelerin merdivendeki ortalama yüksekliği.

Ders bitişinde seansın kendi oranı, yanında **"N kelime bir basamak
ilerledi"**. İkincisi daha önemli: doğru cevap vermek ilerlemek demek değil.
Sıfırsa satır hiç gösterilmez.

### "Kelimelerin nerede" yanıltıcıydı

Panel basamakları birbirini dışlayan üç kutuya bölüyordu. Kullanıcı anlamadı;
açıklarken asıl sorun çıktı: gösterim **yanlıştı**. *"Tanıma 2"* yazınca
"sadece 2 kelimeyi tanıyorum" gibi okunuyor, oysa hepsini tanıyor — ikisi o
basamakta *duruyor*.

Beceri birikimli: 5. basamaktaki kelime 3'ten geçerek geldi. Panel artık
"Neler yapabiliyorsun" ve sayım birikimli — üç çubuk iç içe doluyor.

### Kalite panelleri kullanıcıdan çekildi

"Kancalar nasıl gidiyor" ve "Gözden geçirilecek kancalar" İlerleme
sekmesindeydi. Kullanıcı ikisini de anlamadığını söyledi — haklıydı, çünkü
ikisi de **öğrenene değil içerik yazarına** bakıyordu.

İki ayrı sorun vardı: öğrenen için gürültü, yazar için de tek kişinin verisi
karar vermeye yetmiyor. Bu ölçüm ancak çok kullanıcıdan toplanınca anlam
kazanır ve local-first olduğu sürece yazara zaten ulaşmıyor.

Sinyaller toplanmaya devam ediyor (yedeğe de giriyor), paneller geliştirme
panelinde duruyor. Backend geldiğinde asıl yerine oturur.

### Isı haritası kaldırıldı

12 haftalık takvim: serinin zaten söylediğini 84 kareyle tekrar ediyordu,
*"ceza yok"* ilkesine aykırı bir **kaçırılan günler defteri**ydi, telefon
genişliğine sığmıyordu — ve en önemlisi *çalıştığını* gösteriyordu, *ne kadar
iyi* çalıştığını değil. Düzenlilik tek satıra indi: "Son 7 günde 3 gün
çalıştın."

*(Kaldırılmadan önce gerçek bir hizalama hatası da bulunmuştu: son 84 gün
alınıp yedişerli dilimleniyordu, sütunlar haftanın rastgele bir gününden
başladığı için "Pt / Ça / Cu" etiketleri yanlış günleri gösteriyordu.)*

### Yazı karakteri: Fredoka → Nunito

Başlık fontunda **ğ, Ğ, İ, Ş, ş glifleri yoktu** — fontun tamamını indirip
glif tablosunu okudum: 320 glif, o beş harf yok. Türkçe bir uygulamada başlık
fontu olamaz.

Ayrıca `latin` @font-face'lerinde `unicode-range` eksikti. Aralığı olmayan bir
yüz tüm Unicode'u kapsadığını iddia edip `latin-ext`'i eziyor; `ş` aslında
latin-ext dosyasında **var**ken tarayıcı onu, o glifi içermeyen latin
dosyasına yönlendirip sistem fontuna düşürüyordu. Bu hata tek başına bile
gövde metnini bozuyordu.

`.word` kuralı katman dışında olduğu için Tailwind'in `font-semibold` /
`font-bold` sınıflarını da eziyordu — 20 yerde yazılı ağırlık sınıfı ölü
koddu, her başlık 600'de çiziliyordu.

### Telaffuz

Tarayıcının ses sentezi; dosya, backend, API anahtarı yok. **Nerede çaldığı
bilinçli:** kanca `sell ≈ sel` derken yanlış telaffuz öğretiyor, o yüzden
doğru ses kanca ekrandan kalkarken (3. basamak) devreye giriyor.

Ses seçiminde gerçek bir tuzak vardı: macOS'ta `en-US` listesinin yarısı
**şaka sesi** (Bahh meliyor, Boing zıplıyor, Zarvox robot) ve alfabetik ilk
sıra "Albert". Tercih listesi tutmazsa uygulama telaffuzu bir karikatür sesle
öğretecekti. `pickVoice` saf fonksiyona çıkarıldı ve gerçek macOS listesiyle
test edildi. İsimlerin yerelleştiği de ortaya çıktı ("Good News" → "İyi Haber").

### Giriş akışı

Üç adım: vaat → **kendin dene** → günlük hedef → doğrudan ilk ders.

2. adım asıl olan. Önce kart yalnızca *gösteriliyordu*; kullanıcı "güzelmiş"
deyip geçiyor ama kancanın işe yaradığına **inanmıyordu**, çünkü kendi
denemedi. Şimdi 15 saniyede kendi hafızasının çalıştığını görüyor.

**Eklenmeyenler:** isim sorma (hesap yok, karşılığı olmayan sürtünme) · seviye
testi (havuz sıklık sırasında) · çok ekranlı tur (kimse okumuyor) · ses izni
ekranı (telaffuz 3. basamakta başlıyor).

### Logo

Yatay kilit 28px başlıkta yazısı ~10px'e düşüyor, okunmuyordu — kilitler
~40px altında çalışmaz. Logo uygulama içinden tamamen kalktı, açılış ekranına
taşındı (orada işaret + isim + her açılışta değişen bir kanca çifti).
Başlıkta isim **metin** olarak duruyor.

---

## Tarayıcıda tıklayarak bulunan hatalar

Elle test olmadan hiçbiri görünmüyordu.

| Hata | Neydi |
|---|---|
| Kartlar kaydedilmiyordu | Ders bitiyor, veritabanı boş kalıyordu — `introduceCard` hiç çağrılmıyormuş |
| "Kancayı göster" yanlış yerde | L1/L2'de de çıkıyordu ama kanca zaten ekrandaydı; basınca **cümleyi** açıyor, cevabı sızdırıyordu |
| Geri bildirim etiketi ters | `Doğrusu  c̶a̶t̶` — yani "doğrusu cat" gibi okunuyordu |
| Şıklar yeniden karışıyordu | `secenekler` her render'da çağrılıyordu; ipucuna basınca seçenekler parmağın altında yer değiştiriyordu |
| Eşleştirmede hata görünmüyordu | Sadece Türkçe karo kızarıyor, İngilizce olan sessizce seçimi bırakıyordu |
| Düğmeler alt menünün altında | Egzersiz ve seçim ekranlarında; menü gizlenerek çözüldü |
| Kelimelerim'de çift hoparlör | |
| Türkçe sayı eki | "41'si doğru" yanlış — ekler sayının okunuşuna göre değişiyor (41'i, 6'sı, 3'ü). Ek gerektirmeyen ifadeye çevrildi |
| Deste testi tekrardan kolaydı | 4 şıklı ve çeldiriciler aynı desteden geliyordu; eleme ile geçilebiliyordu |

---

## Kart görselleri

100 kartın görseli Magnific üzerinden **Nano Banana Pro** (`imagen-nano-banana-2`)
ile üretiliyor. 4:3, `seed 20260918`, stil referansı olarak elle üretilmiş
`snake` kartı veriliyor.

**Tutarlılık nasıl sağlanıyor.** Bu hesapta LoRA / stil eğitimi yok, kütüphane
boş, flow tanımlı değil. Geriye üç kaldıraç kalıyor ve üçü birden gerekiyor:
aynı **stil referansı**, aynı **prompt iskeleti**, aynı **seed**. Üçünden biri
değişince çizgi kalınlığı ve palet kayıyor.

Prompt iskeleti sabit bloklardan kuruluyor: sahne tarifi → KOMPOZİSYON →
(insan varsa) YÜZ + KARAKTER → "beyaz kontur yok" → "kesinlikle düz dolgu" →
kontur ağırlığı → ARKA PLAN tonu → cansız nesnenin yüzü olmaz → metin kuralı.
Her kart yalnızca ilk satırını ve arka plan tonunu değiştiriyor.

### Üretimde öğrenilenler

| Ders | Neden |
|---|---|
| "Özne çerçeveyi doldursun" deme | Model bunu "taşır" diye anlıyor; 5 görselin 4'ü alt kenardan kesildi. Doğrusu: "%75 yükseklik, dört kenarda eşit boşluk, hiçbir şey kenarı geçmesin" |
| İnsanı tam gövde iste | Gövdesiz uzuv (`foot` ilk hali) kesik uzuv gibi çıkıyor, rahatsız edici |
| Kıyafeti açıkça yaz | Yazmayınca çıplak gövde çiziyor (`laugh` ilk hali) |
| Kalabalığı tek tek yasakla | `deep`'e denizaltı, batık gemi, hazine sandığı koydu; "balık yok, denizaltı yok, batık yok" deyince düzeldi |
| Ölçek farkını nesneyle kur | `large`'da insan + dev gömlek iki denemede de aynı boyda çıktı; iki kutu tek denemede tuttu |
| Spor/nesne adını tarif et | "football" → Amerikan futbolu topu. "round soccer ball with black pentagon patches" → doğru |
| Gölgeyi ayrıca yasakla | "NO drop shadow" yetmiyor, "NO ground shadow, NO ambient occlusion" da gerekiyor |
| 3B montaj parçası yasakla | `door`'da DUR levhasını duvara metal braketle monte etti; "flat against the wall, no bracket, no shadow, no 3D depth" ile düzeldi |

**Türkçe metin sorun değil.** `SATILIK`, `DUR`, `DİP`, `FUL`, `SON` hepsi ilk
denemede doğru çıktı — `İ` dahil. Metin gereken kartlarda kelimeyi prompt'a
yazmak güvenli.

### Kredi hesabı

| Aşama | Görsel | Kredi |
|---|---:|---:|
| İlk deneme (tuz, stil arayışı) | 2 | 150 |
| Deste 1 ilk tur | 5 | 375 |
| `door` + `dust` düzeltme turları | 6 | 450 |
| Deste 1 kalan üçü | 3 | 225 |
| Deste 2–5 | 20 | 1.500 |
| Düzeltmeler (`eye` `foot` `laugh` `large` `deep` `sun`) | 6 | 450 |
| Son iki düzeltme (`foot` `large`) | 2 | 150 |
| **Toplam** | **44** | **3.300** |

Görsel başına liste fiyatı 75 kredi. Teslim edilen 26 kart için 3.300 kredi
harcandı — kart başına **~127 kredi**, yani ortalama **1,7 deneme**. Kalan 74
kart için ham maliyet 5.550, aynı tekrar oranıyla gerçekçi tahmin **~6.700**.

### Boru hattı

`gorseller/<kart-id>.png` → `npm run import:images` → `src/assets/cards/<kart-id>.webp`
(800×600, 4:3, q82). `content.ts` klasörü `import.meta.glob` ile tarıyor —
`cards.json`'a dokunmaya gerek yok, dosyayı koyman yeter.

Kart başına ortalama **14 KB**. 100 kart ≈ **1,4 MB**; bu boyutta workbox
precache stratejisini değiştirmeye gerek yok.

> exFAT tuzağı: `gorseller/` içine kopyalarken macOS `._*` gölgeleri bırakıyor,
> importer bunları "tanınmayan kart id'si" diye uyarıyor. `find . -name '._*' -delete`.

---

## Ortam

`/Volumes/TwinMOS` **exFAT**. macOS her dosyanın yanına `._` gölgesi bırakıyor;
git bunları `.git/objects` içinde gerçek pack sanıp `non-monotonic index`
hatası veriyor, vitest de test dosyası sanıp parse hatası veriyor. `.gitignore`
ve vitest `exclude` ile kapatıldı. Yine de çarparsa: `find . -name '._*' -delete`.

---

## Sırada

1. **Kanca aday üretim hattı** — havuzu ~600'e çıkaran tek kaldıraç.
   CMU fonetik sözlüğü + Türkçe kelime listesi + fonem mesafesi → sıralı aday
   listesi. "Haa testi" insanda kalır; moat orası.
2. Kalan 74 kartın görseli — yukarıdaki iskele ve derslerle.
3. Hesap + bulut senkronu — yalnızca retention verisi gerektirirse.
