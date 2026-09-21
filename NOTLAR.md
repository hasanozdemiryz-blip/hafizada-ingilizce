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

## Android paketi

PWA iki yoldan telefona giriyor:

- **PWA kurulumu** — GitHub Pages adresini Chrome'da aç, "Uygulamayı yükle".
  `main`'e her push'ta kendini günceller. Günlük kullanım için bu.
- **APK** — Capacitor ile WebView'a sarılmış native paket. Sabit sürüm;
  kod değişince yeniden derlemek gerekir. Test ve paylaşım için.

**Neden Capacitor, neden TWA değil.** TWA'da adres çubuğunun kalkması için
`assetlinks.json`'un alan adının **kökünde** durması gerekiyor. GitHub Pages
projeyi `/hafizada-ingilizce/` alt dizininde servis ediyor; köke dosya koymak
ayrı bir `<kullanici>.github.io` deposu ister. Capacitor'da bu sorun hiç yok.

### APK nasıl çıkar

```
npm install
npm run build
npx cap add android          # android/ .gitignore'da, her seferinde üretilir
cd android && ./gradlew assembleDebug
```

Çıktı: `~/Library/Caches/hafizada-android/_app/outputs/apk/debug/app-debug.apk`
(~5 MB, 26 kart görseli dahil tamamen çevrimdışı).

### İki tuzak

**Gradle ara çıktıları exFAT'te duramıyor.** macOS her yeni dizinin yanına
`._ad` gölgesi bırakıyor, Gradle kaynak tarayıcısı bunu gerçek dizin sanıp
`'._drawable' is not a directory` ile patlıyor. `android/build.gradle`
`buildDirectory`'yi `~/Library/Caches/hafizada-android` altına alıyor — bu
blok `cap add android` sonrası **elle geri konmalı**, çünkü `android/`
depoda tutulmuyor.

**Java sürümü iki taraftan sıkışıyor.** Capacitor 8 **21+** istiyor (JDK 17
`invalid source release: 21` veriyor), Gradle 8.14 ise **25'i tanımıyor**
(`Unsupported class file major version 69`). Bir süre Android Studio'nun
kendi JDK'si kullanılıyordu; Android Studio güncellenince o JDK 25 oldu ve
derleme kırıldı. Doğru çözüm ikisinin arasında sabit bir sürüm:

```
brew install openjdk@21
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export ANDROID_HOME=~/Library/Android/sdk
```

> Ders: derleme zincirini bir IDE'nin paketindeki sürüme bağlamak, IDE
> güncellenince sessizce kırılıyor. Sürümü projenin kendisi sabitlemeli.

### APK'yı telefona ulaştırmak

Tünel üzerinden **çalışmıyor**: uygulamanın service worker'ı o kaynağa kurulu
ve `navigateFallback: index.html` ayarı yüzünden `/hafizada.apk` isteğini
yakalayıp APK yerine uygulamayı açıyor. (`curl` bunu yaşamaz, service worker'ı
yoktur — yanıltıcı.) Çalışan yol: dosyayı Drive'a koyup telefondan indirmek.

---

### APK'da ses yoktu

Derlenen pakette telaffuz tamamen kayboldu: hoparlör düğmesi yok, Ayarlar'daki
"Telaffuz sesi" satırı yok, dinleme egzersizi yazmaya dönmüş. Hiçbiri hata
değildi — `telaffuzVar()` false döndüğü için üç yer de kendini doğru şekilde
gizledi. Eksik olan motorun kendisiydi.

**Sebep:** Android System WebView, Web Speech API'nin sentez tarafını
uygulamıyor; `speechSynthesis` orada tanımsız. Android **Chrome**'da var, yani
PWA kurulumunda uygulama konuşuyor, Capacitor APK'sında susuyor. iOS'un
WKWebView'ında API duruyor, orada sorun yok.

**Çözüm:** `@capacitor-community/text-to-speech` (8.0.2, `@capacitor/core >=8`
istiyor — bizim sürümle birebir). `speech.ts` artık üç durumlu bir motor
tutuyor: `web` · `native` · `yok`. Çağrı noktalarının hiçbiri değişmedi;
dosyanın başındaki *"aynı arayüz başka bir kaynağa bağlanabilir"* sözü tutuldu.

**Neden asenkron bir hazırlık adımı var.** Motorun varlığı köprüden geliyor,
render sırasında senkron sorulamıyor. İyimser davranıp düğmeyi hemen göstermek,
İngilizce ses verisi kurulu olmayan cihazda hiçbir şey yapmayan bir düğme
bırakırdı. Bu yüzden telaffuz açılışta "yok" sayılıyor, motor bulununca
`useSyncExternalStore` üzerinden arayüz kendiliğinden açılıyor —
`telaffuzVar()` yerine bileşenler `useTelaffuz()` kullanıyor.

**Native tarafta ses seçilmiyor.** `pickVoice`ın çözdüğü sorun macOS'a özgü
(şaka sesleri); Android'de varsayılan motor sesi zaten doğru tercih. Test
edilemeyen bir ses indeksi göndermek iyileştirmez, bozabilir. Web yolu ve
`pickVoice` testleri olduğu gibi duruyor.

**Boyut:** eklenti dinamik `import` ile çağrılıyor, web paketine girmiyor —
ayrı bir 1,7 KB parça olarak duruyor, yalnızca native kabukta indiriliyor.

---

## 2026-09-19 — v1 kapsamı: 26 kart ve tasarlanmış final

### Kapsamı görsel çiziyor

v1 artık 100 kart değil, **görseli hazır olan 26 kart**. Sebep parasal:
kalan 74 kartın görseli ~6.700 kredi ve elimizde tek bir D1/D7 verisi yok.
Kimsenin ulaşmadığı kartlara ödeme yapmak yerine küçük ama tam bir ürünle
çıkıp veriyi toplamak seçildi.

Kod tarafında sınır **elle tutulan bir liste değil**: `content.ts` yalnızca
`src/assets/cards/<id>.webp` dosyası olan kartları sete alıyor. Görsel
konulan kart kendiliğinden girer, `cards.json`'a dokunulmaz. Kalan 74 kart
dosyada duruyor, sette görünmüyor.

Neden ölçüt görsel: bu üründe görsel süsleme değil **yöntemin kendisi**.
Görseli olmayan kartta ekranda brief metni duruyordu — o kart kancayı
anlatmıyor, sadece bir kelime listesi oluyor. Yarım bir kartla çıkmak
yöntemin kendisini zayıf gösterirdi.

### Havuzun bitmesi bir kusur değil

26 kart, günde 10 hedefle ~3 günde biter. Eskiden o noktada ekran sıradan
bir *"Bugünlük tamam 🌿"*e düşüyordu — kullanıcı setin sonuna geldiğini
hiç anlamıyordu.

Artık iki yerde **final** var (`SetFinale`):

- **Seti bitiren dersin sonunda** — o dersin yüzdesi geri çekiliyor. O an
  "%80 aldın" anı değil "bitirdin" anı; iki başlık yan yana ikisini de
  küçültürdü. Yüzde zaten İlerleme'de duruyor.
- **Ana ekranda**, sonraki günlerde tekrar da kalmadığında.

Final yalnızca **yeni kelime getiren** derste çıkıyor. Set bittikten sonraki
tekrar dersleri de "set bitmiş" durumda biter; her seferinde kutlarsa
kutlama anlamını yitirir.

Finalin ortasındaki düğme **kanca panosu paylaşımı**. Gelir modeli kitle
üzerinden olduğu için paylaşım bir ekstra değil dağıtım kanalı, ve seti
bitiren kullanıcı paylaşmaya en yakın kişi. Altındaki satır bilinçli:
*"tekrarların devam ediyor"* — yoksa "bitti" kelimesi uygulamayı silmenin
davetiyesi olur.

Ana ekranda günlük hedef çubuğu da değişti: yeni kelime kalmadığı için
"0 / 10" her gün öyle kalacak ve kullanıcı yapmadığı bir şey yüzünden eksik
görünecekti. Set bitince çubuk "Set tamamlandı · 26 / 26" oluyor.

### Panoda 24 satır, başlıkta 26 yazıyordu

Kanca panosu en fazla 24 çift çiziyor ama başlığı `pairs.length`'ten
alıyordu. 26 kartlık sette bu, **"26 kelime, 26 kanca"** yazan ve 24 satır
gösteren bir görsel demekti — tarayıcıda çizdirmeden görünmüyordu. Sınır
26'ya çıkarıldı (tam set tek panoya sığsın) ve başlık artık çizilen satırı
sayıyor.

### Havuz testleri hangi havuza soruluyor

`judge`'ın "havuzdaki başka bir kelime asla *yakın* değil" davranışı
`short/shore` ve `dönmek/dövmek` çiftleriyle ölçülüyordu. Çiftlerin yarısı
görselsiz olduğu için artık v1 setinde yok; setin havuzuyla sorulunca
testler haklı olarak düştü.

Ayrım şu: **`judge`'ın sözleşmesi** tüm havuza sorulur (2. set geldiğinde de
geçerli olmalı), **setin kendi içinde çarpışma var mı** sorusu ise yalnızca
v1 setine. İkisi ayrı testler olarak duruyor.

---

## 2026-09-21 — Gün sınırı, ölçülen puanlama, renk sistemi

Yayın öncesi revizyon turu. İki karar geri alındı, iki ölçüm baştan kuruldu.

### Uygulama günün değiştiğini fark etmiyordu

Ana ekran, günlük hedefi dolduran bir günün **ertesinde de** "Hızlı tekrar"
diyordu. Sebep koddaydı: `new Date()` yalnızca render anında okunuyor, render
ise ancak veritabanı değişince ya da sekme değişince oluyordu. Telefonda
uygulama açık dururken gece yarısı geçilince ekran dünün durumunda donuyor.
`visibilitychange`, zamanlayıcı, gün kontrolü — hiçbiri yoktu.

`today.ts`: gün anahtarı bir store'da; sekmeye dönüşte, pencere odağında ve
dakikada bir kontrol ediliyor. Haber **yalnızca gün gerçekten değişince**
veriliyor — her tikte vermek bütün ekranı dakika başı boşuna çizerdi.
Zamanlayıcı tek başına yetmiyor (arka planda uyutuluyor), uygulamanın öne
gelmesi asıl güvenilir sinyal; ikisi birlikte tutuluyor.

Aynı temelin üstüne **"Yeni güne başla"** oturdu: o günün ilk girişinde
kahraman kart bunu söylüyor, ilk ders bitince normale dönüyor. Bilerek bir
**an**, sürekli bir etiket değil — gün içinde tekrarlanan bir "yeni gün"
anlamını yitirir.

### Geri alınan karar: doğrudan ilk derse girme

Karşılamadan sonra doğrudan derse giriliyordu ve gerekçesi "bir karar daha
eksilsin"di. Kötü tarafı şuydu: kullanıcı hazır olup olmadığı sorulmadan
derse düşüyor ve geri çıkmanın tek yolu *"ders yarıda kalacak"* uyarısı
oluyordu. Başlama kararı kullanıcıya geri verildi. Ana ekran boş kalmıyor:
ilk ders orada kendi kartı olarak duruyor (*"İlk dersin hazır"*).

### Geri alınan karar: "Dün" kapsamı

Egzersizdeki `🌙 Dün` kutusu sık sık boştu. Kullanıcının hatası değil,
**yapısal**: bir gün ara verildiğinde ya da o gün yalnızca tekrar yapıldığında
dün tanışılan kart yok. Aynı hata birinci kutuda daha büyüktü — `☀️ Bugün`
**set bitince sonsuza kadar** boşalıyor, çünkü artık hiçbir gün yeni kelime
gelmiyor.

Birim takvim gününden **derse** çevrildi: birinci kutu *en son ders*, ikincisi
*ondan önceki*. Tanım gereği çakışmazlar ve iki dersi olan herkeste ikisi de
dolu. Başlık da uyarlanıyor: bugün yeni kelime geldiyse "Bugün", gelmediyse
"Son ders". Boş kapsam kutusu artık basılamıyor — önce basılıyor, hiçbir şey
olmuyordu.

### Ayrı "eskileri tekrar et" düğmesi açılmadı

İstendi, açılmadı. Üç giriş noktasını tek *Başla*'ya indirmek bu ürünün en
büyük kazancıydı; tekrarı atlanabilir yapmak tekrar borcunu sessizce büyütür,
ki günlük hedefin 15'te sabitlenme sebebi de buydu.

Yerine üç küçük müdahale, üçü de aynı isteği karşılıyor:

- Dersin içinde **"Bölüm 2/3 · Tekrar"** göstergesi. Ayrı düğme isteği
  buradan doğuyordu: tekrarın derse dâhil olduğu görünmüyordu.
- Tekrar yükü ağırken *Başla*'nın altında ikincil **"Önce N tekrarı yap"**
  satırı — aynı ders, yalnızca **sıra** değişir, hiçbir bölüm atlanmaz.
- Egzersiz'de **⏰ Bekleyen tekrarlar** kapsamı: açıkça sadece tekrar isteyen
  oraya gidiyor.

Bölüm sırası artık tek bir listede duruyor; "önce tekrar" isteği tek satırda
ifade ediliyor ve ekranda bölüm sayısı yazmak mümkün oluyor.

### Başarı: iki tasarım hatası, ikisi de gerçek veriyle görüldü

**Birinci hata — toplu sayaç.** Doğru/yanlış gün bazında toplanıyordu
(`days[gün] = { r, i, d, y }`). Bir kelimeyi yanlış yapıp sonra üç kez doğru
yapınca gün %75 oluyordu: eski yanlış hiç silinmiyor, yalnızca seyreliyordu.
İstenen davranış "yeniden çalışınca düzelsin"di ve o sayaçla bu
**matematiksel olarak** karşılanamaz — hangi cevabın hangi kelimeye ait olduğu
bilgisi atılmış oluyor. Çözüm: her cevabı tek satır olarak tutmak (`answers`).
Ham veri durduğu sürece yüzdenin tanımı sonradan da değiştirilebilir.

**İkinci hata — birim kelime.** "Her kelimenin en son cevabı" kuralı ilk
gerçek derste çöktü. Öğrenme testi aynı kelimeyi **altı kez, gittikçe
zorlaşan** basamaklarda soruyor ve en sonda dinleme var:

```
door [0,1,0,1,1,0]   dust [1,1,1,1,1,0]   salt [1,1,1,1,1,0]
sell [1,1,1,1,1,0]   sick [0,0,1,1,1,0]
30 cevap · 21 doğru · ekranda yazan: %0
```

Beş kelimenin de son cevabı dinleme, beşi de yanlış. "Son cevap" *daha
sonraki bir çalışmada* anlamlı, **aynı testin daha zor basamağı** için değil;
karşılaştırma aynı basamakla yapılmalı. Birim `kelime × basamak` oldu, aynı
ders **%83** verdi. İstenen davranış da duruyor: aynı hücre yeniden
çalışılınca üzerine yazılıyor.

Geçişte başarı geçmişi **bilerek sıfırdan** başladı: eski toplu sayaçlar
kelime bazında geri üretilemiyor, ikisini tek rakamda toplamak iki farklı
şeyi karıştırmak olurdu. Kelime ilerlemesi (step/FSRS) etkilenmedi.

### "Neler yapabildin" merdivene değil yapılana bakıyor

Panel `step >= 3` ve `>= 5` eşiklerine bakıyordu. Sonucu: kullanıcı derste
kelimeyi ters seçmeli, harf dizme ve yazmayla doğru yapıyor, alt iki satır
yine **0** duruyordu — çünkü merdiven öğrenme testinde oynamıyor ve 3.
basamağa çıkmak günler sürüyor. Kullanıcı panelin bozuk olduğunu düşündü;
haksız değildi: *"neler yapabildin"* sorusunun cevabı "bugün baştan yazdın"
olmalı.

Artık cevap günlüğüne bakıyor: o basamakta **en az bir kez, kancaya basmadan**
doğru yapmış olmak yetiyor. Bunun için günlüğe `step` ve `ipucu` eklendi.

Bedeli bilinçli: **unutulan kelime de sayılmaya devam eder**, çünkü soru
"hâlâ biliyor musun" değil "yapabildin mi". "Hâlâ" sorusunun cevabı kalıcılık
yüzdesi. İki panel yan yana duruyor ve ayrı şeyler söylüyor.

### Öğrenme testi artık bir basamak kazandırıyor

Merdiven test *sırasında* hâlâ oynamıyor — kelime taze, oradan gelen başarı
kalıcı hafızanın kanıtı değil. Ama hiç basamak vermemenin sonucu şuydu: ilk
gün hiçbir şey ilerlemiyor, ders *"0 kelime ilerledi"* ile bitiyordu.

İlk ölçüt "testin **altı görevi de** temiz" oldu ve pratikte hiç tutmadı:
yukarıdaki gerçek derste beş kelimenin beşinde de en az bir hata var,
**hiçbiri ilerlemezdi**. Ölçüt tek ve nete indi: **2. basamağı (çoktan
seçmeli) kancaya basmadan doğru yapmak**. Aynı veride 5 kelimenin 4'ü
ilerliyor. Tavan yine 2 — tanıma tarafı; üretim basamakları (≥3) hâlâ yalnızca
gerçek tekrarla kazanılıyor.

### Aralıklı tekrar çalışmıyordu

Altı günlük tam bir tur (her gün 5 kelime, 26 kelimenin sonuna kadar) elle
oynanınca çıktı: **1., 2. ve 3. günde hiç tekrar gelmedi.** Veriye bakınca
sebep netti.

```
1 ders sonrası:   reps 6 · stabilite 2,3 gün
1 tekrar sonrası: reps 7 · stabilite 13,9 gün → vade 12–15 gün
26 kartın ortalama sıradaki vadesi: 7 gün (max 15)
```

Öğrenme testi aynı kelimeyi altı kez soruyor ve **her cevap FSRS'e ayrı bir
not** yazıyordu. FSRS her notu "aralıklı bir hatırlama" sayar; oysa altısı da
iki dakika içindeydi. Kelime daha ilk gün iki güne, ilk tekrardan sonra iki
haftaya fırlıyordu — kitaptaki *"cramming aralıkları şişirir"* hatası. Ürünün
bütün vaadi aralıklı tekrardı ve tam orası bozuktu.

**Düzeltme iki parça:**

1. **Öğrenme testi FSRS'e tek not verir**, o da testin sonunda (geçti → Good,
   geçemedi → Again). Anki'deki "öğrenme adımları → mezuniyet" düzeninin
   karşılığı. `learningCheck` artık yalnızca ölçüyor (`firstCheckOk`),
   zamanlamaya dokunmuyor.
2. **Aynı gün ikinci kez doğru bilmek aralığı uzatmaz.** Hızlı tekrar ve ders
   tekrarı aynı kelimeyi gün içinde defalarca soruyor. Yanlış cevap her zaman
   sayılır — bilmediğin kelimenin aralığı uzamamalı. Kural yalnızca mezun
   olmuş kartlar için; öğrenme adımındaki kart gün içinde birkaç kez sorulmak
   üzere tasarlanmıştır.

Aynı turla ölçülen sonuç: ortalama vade **7 → 3,2 gün**, ilk tekrar **4. gün →
2. gün**, ikinci tekrardan sonraki stabilite **13,9 → 7,3 gün**.

> Bu hata elle tek tek tıklayarak da bulunamazdı: tek bir ders kusursuz
> görünüyor. Ancak altı günlük turu koşturup `fsrs.reps` ile `stability`
> değerlerine bakınca ortaya çıktı.

### "Ustalık" kimseye bir şey söylemiyordu

Adı soruldu. Bir etiketi kullanıcı soruyorsa o etiket çalışmıyor demektir.
**"Kalıcılık"** oldu ve kutunun altına tek satır tanım kondu. Sayının kendisi
değişmedi: merdivendeki ortalama yükseklik.

### Logo: mavi kare rozetten iki renkli beyne

Eski işaret mavi yuvarlak kare + beyaz kare çerçeve + sarı çapraz izdi ve
**kurumsal** duruyordu. Sebebi tek cümleyle: **taşıyıcı kap, işaretin
kendisinden daha baskındı** — kare çerçeve herhangi bir SaaS ikonu olabilirdi,
içindeki form hiçbir şey anlatmıyordu.

**Instagram'daki kimlikle kopukluk asıl sorundu.** Hesabın profil fotoğrafı
siyah daire + beyaz "Hafızada" + **sarı bantta "İNGİLİZCE"**, ve aynı rozet
18 gönderinin hepsinde filigran; 5.000'den fazla takipçi onu tanıyor. Yani
sarı bant zaten markanın işaretiydi, uygulamanın mavi karesi ise oraya hiç
bağlanmıyordu.

**Neden beyin.** Kategori taraması: Duolingo baykuş, Babbel konuşma balonu,
Busuu/Memrise tek harf, Mondly küre — hepsi maskot, harf ya da balon, renk
neredeyse hep yeşil/mavi. Beyin bu kategoride yok; beyin *Lumosity · Elevate ·
Peak* gibi **zihin egzersizi** uygulamalarının işareti. Normalde bu bir
kategori hatası olurdu — ama bu markanın adı **Hafızada**, vaadi hafıza
teknikleri, Instagram bio'su bile *"Hafıza Teknikleri ile Kolay İngilizce"*.
Beyin burada süs değil, **farkın kendisi**.

**Seçilen biçim:** dikey ortadan ikiye ayrılmış beyin — sol yarı lacivert,
sağ yarı sarı, ortada kenetleniyor. İki dil, tek hafıza. Dört aday (beyin+`≈`,
beyin+fosforlu iz, iki yarım beyin, beyin+balon) 160/72/**40** pikselde yan
yana konup seçildi; küçük boyda ayakta kalan tek aday buydu. Elenenlerden biri
öğreticiydi: **beynin üzerinden geçen çapraz sarı iz 40 pikselde "yasak"
işaretine dönüşüyor** — eğik çizgi evrensel olarak "hayır" demek.

**Boru hattı vektöre taşındı.** Eski kaynak 1,1 MB'lik bir PNG'ydi ve tüm
türevler ondan kırpılıyordu: 40 pikselde kenarlar dağınıktı, rengi değiştirmek
dosyayı yeniden üretmek demekti. Üretilen görsel vektöre çevrildi
(`brand/logo-isaret.svg`), renkleri marka paletine **sabitlendi** (izleyici
#1C2940/#FECC47 çıkarmıştı, #16233A/#FFD23F'e çekildi) ve bütün türevler
artık o tek dosyadan geliyor.

**İki varyant zorunlu çıktı.** Lacivert zeminde beynin lacivert yarısı
kayboluyor ve geriye yarım beyin kalıyordu; koyu zeminde o yarı krem oluyor.
Sarı her iki zeminde de aynı.

**Yazı tipi tuzağı.** Kilit yazısı Nunito 800 olmalı ama `public/fonts`
altındakiler **woff2** ve resvg woff2 okumuyor — hata da vermiyor, yazıyı
sessizce çizmiyor. Üstelik font iki alt kümeye bölünmüş: `ı` latin'de,
`İ/ğ/ş` latin-ext'te. fontTools ile ikisi 800 ağırlığında örneklenip
birleştirildi, `brand/fonts/Nunito-800.ttf` o dosya.

### Ana ekranın boşluğu: iki deneme, iki geri alma

Uzun ekranda kahraman bloğun üstünde geniş bir boşluk kalıyor. İki şey denendi,
ikisi de çıkarıldı — kayda geçsin ki tekrar denenmesin.

**Günün kancası** — hedef çubuğunun üstünde tek satır (`boat ≈ bot`), o günün
dersinden, gün içinde sabit. Çıkarıldı: hemen altındaki *"Son tanıştıkların"*
şeridi zaten aynı kancaları gösteriyor; satır o bilgiyi ikinci kez yazmaktan
başka bir şey yapmıyordu. (Önce kahraman bloğun **altındaydı** ve orada
tekrar daha da göze batıyordu; üste taşımak da kurtarmadı.)

**Marka filigranı** — işaret %5 opaklıkta, üst şeritte, kenardan kırpılmış.
Çıkarıldı: boşluğu kapatıyordu ama ekrana hiçbir şey **katmıyordu** ve
ortadayken kelime şeridinin arkasına yayılıp o bölgeyi lekeli gösteriyordu.

Çıkan ders: **o boşluk bir sorun değil, bir sonuç.** Ana ekranın işi tek karar
verdirmek; boşluk o kararın etrafındaki sessizlik. Doldurmak için konan her
şey ya bilgiyi tekrar ediyor ya da hiçbir şey söylemiyor. Bir gün oraya bir
şey girecekse, **kendi başına bir işi olan** bir şey girmeli — boşluk
doldurmak bir iş değil.

### Renk sistemi

Palet zaten genişti ama tek renk taşıyordu: `blush` hiç kullanılmıyor, her
seçili kutu aynı maviydi. Renk artık anlam taşıyor ve **iki eksen birbirine
karışmıyor**: kapsam renkli, egzersiz tipi lacivert.

Merdivenin üç bölgesi üç renk (tanıma mavi · geçiş sarı · üretim nane) ve
bunlar İlerleme'deki çubukların **aynı** renkleri — iki ekran aynı şeyi aynı
renkle söylüyor.

Kart yüzüne ve soru ekranına dokunulmadı: `spark` (kanca sarısı) başka hiçbir
yerde vurgu rengi değil. Kancanın yanına ikinci bir renk girerse kanca dikkat
çekmeyi bırakır.

---

## Ortam

`/Volumes/TwinMOS` **exFAT**. macOS her dosyanın yanına `._` gölgesi bırakıyor;
git bunları `.git/objects` içinde gerçek pack sanıp `non-monotonic index`
hatası veriyor, vitest de test dosyası sanıp parse hatası veriyor. `.gitignore`
ve vitest `exclude` ile kapatıldı. Yine de çarparsa: `find . -name '._*' -delete`.

---

## Sırada

Kapsam kararı gereği sıra **veriden sonra** açılıyor: 26 kartlık set yayına
çıkacak, D1/D7 ölçülecek, kalan işler ondan sonra sıralanacak.

1. **Yayın** — GitHub Pages + telefonda PWA kurulumu; APK'daki telaffuz
   gerçek cihazda doğrulanacak (kod yazıldı, cihazda denenmedi).
2. **Kanca aday üretim hattı** — havuzu ~600'e çıkaran tek kaldıraç.
   CMU fonetik sözlüğü + Türkçe kelime listesi + fonem mesafesi → sıralı aday
   listesi. "Haa testi" insanda kalır; moat orası.
3. Kalan 74 kartın görseli — yukarıdaki iskele ve derslerle. Veri gelmeden
   ~6.700 kredi harcanmıyor.
4. Hesap + bulut senkronu — yalnızca retention verisi gerektirirse.
