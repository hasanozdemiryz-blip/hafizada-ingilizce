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
npm run icons:bildirim       # durum çubuğu ikonu — cap add onu üretmiyor
npm run android:release      # versionCode/versionName + imza yapılandırması
cd android && ./gradlew assembleDebug
```

Son iki betik `cap add android` **sonrasında** çalışmalı; ikisi de `android/`
içine yazıyor ve `android/` depoda tutulmuyor.

`icons:bildirim` atlanırsa bildirimin durum çubuğu ikonu uygulama simgesine
düşer ve beyaz bir leke olarak çıkar (bkz. aşağıda *Bildirim ikonu*).

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

## 2026-09-22 — İkon seti: emojiden markaya

### Emoji marka değildir

Arayüzün her yerinde emoji vardı: alt menüde `🌱 🎯 📊 ⚙️`, egzersiz
kapsamlarında `☀️ 🌙 ⏰ 🩹 🕰️`, merdivenin altı basamağında `🔗 ✅ 🔄 🔤 ✍️ 🔊`.
Tek tek bakınca sorun görünmüyordu; sorun **kimin çizdiğiydi**.

Emojiyi uygulama çizmiyor, **cihazın yazı karakteri** çiziyor. Yani aynı ekran
Android'de Noto, iOS'ta Apple Color Emoji, masaüstünde bir üçüncüsüyle
görünüyordu — üç ayrı stil, üç ayrı çizgi kalınlığı, üç ayrı palet. Hiçbiri de
logonun iki rengini taşımıyordu. Uygulamanın en çok tekrar eden görsel öğesi,
markanın hiç söz sahibi olmadığı tek öğeydi.

20 ikonluk set bunun için üretildi: lacivert çizgi + sarı vurgu, logonun
kendisiyle aynı iki renk.

### Kaynak sayfa doğrudan kullanılmadı — üç sebep

`brand/ikon-sayfasi.png` **kaynak**, `src/assets/ikonlar/` **üretim**; arada
`tools/make-ui-icons.mjs` var. Ara adımın her biri gerçek bir kusuru kapatıyor:

1. **Renk.** Model kremi `#FBF3D7`, laciverdi `#0B203A`, sarıyı `#FFCC08`
   çizdi; markanınkiler `#FFF7E4`, `#16233A`, `#FFD23F`. Yan yana konunca
   görülüyor: ikonun sarısı kancanın sarısından daha turuncu. Her piksel
   markanın **tam token değerine** yazılıyor.
2. **Ters varyant.** Seçili sekme, seçili kapsam kutusu ve dinleme düğmesi
   koyu zeminde; lacivert ikon orada kayboluyor. Ters varyantta mürekkep
   logonun kremine döner, sarı yerinde kalır.
3. **Optik boyut.** Her çizim hücresini farklı dolduruyor. Uzun kenardan
   sığdırmak yetmiyor: `harf` beş karo genişliğinde ve o yolla komşularının
   yanında küçük kalıyordu. Ölçek **√alan**'a göre veriliyor, tuval yine de
   aşılmıyor.

> Ders: üretilen varlık **kaynak**tır, ürün değil. Araya bir üretim adımı
> koymak "elle düzelt"ten ucuz: aynı kusur bir daha gelirse yine düzelir —
> ve elle kırpmak, kusuru üretimin kendisine yazmak demekti.

### İki ikon yanlış adla gelmişti

Kırpılmış dosyalar arasında `ara.png` bir **hoparlör** çizimiydi,
`dinleme.png` ise harf karoları. İkisi de yanlış yerdeydi ve sebebi yine
kırpmaydı — kaynak sayfaya bakınca hoparlörün `ses`, karoların `harf`
olduğu, `ara`nın ise hiç çıkarılmamış **büyüteç** olduğu görüldü.

Setteki adlar **ne gösterdiğine** değil **nerede kullanıldığına** göre anılıyor:
`ses` bir hoparlör çizimi ama uygulamada telaffuzun adı.

### Kırpılmış PNG'ler kaynak sanılmıştı

Depoda `brand/ikonlar/` altında 20 tane 64px'lik PNG duruyordu ve bunlar
"ikonlar" sanılıyordu. Ekranda üç ayrı kusur çıktı, üçü de aynı kökten:

- `egzersiz`in (hedef tahtası) **alt halkası düz kesikti**.
- `bugun` ve `zor`un üstünde, gövdeden boş bir satırla ayrılmış **yabancı
  çubuklar** vardı.
- `harf` (harf karoları) ile bir başka karo çizimi **neredeyse aynıydı**;
  ikisini iki ayrı ikon sanıp birini kelime listesine koymuştum.

Kök sebep: ikonlar tek tek üretilmemişti. Hepsi **tek bir sayfada**,
5×5'lik bir ızgarada birlikte çizilmişti ve o sayfadan gözle kırpılmıştı.
Dar kutular şekilleri kesiyor, komşu hücrelerden parça bulaştırıyordu —
ve beş karo genişliğindeki `harf` ikonu **ortadan ikiye bölünmüştü**. İki
"ayrı" karo ikonu aslında aynı ikonun sol ve sağ yarısıydı.

### Yeniden üretmek değil, yeniden indirmek

Kullanıcı "tekrar indirip ayarlar mısın" dedi ve doğru olan buydu: sayfa
Magnific'te duruyordu (`iGdE85Q3uK`). **Var olan bir üretimi indirmek kredi
harcamıyor**, yalnızca üretmek harcıyor — yani kredi bitmiş olması bu işi
engellemiyordu.

İndirilen sayfa 1152×928: hücre başına ~230px, eldekinin **4 katı
çözünürlük**. İçinde bir de hiç çıkarılmamış **büyüteç** varmış, artık
arama kutularında duruyor. Model dört ikonu ikişer kez çizmiş; ikizlerden
sarı vurgusu olanı alınıyor, çünkü setin kuralı "her ikonda bir sarı
vurgu" ve vurgusuz olan onu bozuyordu (`bekleyen` bu yüzden değişti).

Kırpmayı artık göz değil ölçüm yapıyor: satır izdüşümünden satır bantları,
**her satırın kendi içinde** sütun bantları. Sütunları tüm sayfadan aramak
işe yaramıyor — geniş `harf` ikonu üstteki sütun boşluklarını kapatıp
ızgarayı 5 yerine 4 sütun gösteriyor.

Bir ikon kopuk parçalardan oluşabiliyor (hoparlörün konisi ile ses dalgaları
arasında 5 piksel var), o yüzden 40 pikselden yakın bantlar birleştiriliyor;
hücreler arası boşluk 80 pikselden geniş olduğu için eşik ikisini ayırıyor.

### Krem zemin alfaya nasıl çevrildi

Sayfanın zemini krem, ikonların olması gereken yer şeffaf. Sert bir renk
anahtarı (krem → şeffaf) kenarları tırtıklı bırakırdı: çizginin kenarındaki
piksel krem ile mürekkebin **karışımı**.

Onun yerine her piksel iki karışım doğrusuna izdüşürülüyor
(zemin→mürekkep, zemin→kanca): hangi doğruya daha yakınsa rengi o, doğru
üzerindeki konumu da alfası. Yumuşak kenar korunuyor, renk tam token oluyor.

İki renk + alfa rampası 16 girdilik palete rahat sığıyor. 40 dosya
128 pikselde **114 KB** — eski 64 piksellik setten (151 KB) küçük.

### Kelime listesi kart destesi taşıyor

"Kelimeler" listesine konan karo ikonu `harf`in yarısı çıkınca yeri boşaldı.
Liste artık `kartlar` (kalpli kart destesi) taşıyor — Egzersiz'deki "Kartlar"
kutusuyla **aynı ikon**. Zorlama değil: ikisi de aynı şeyi gösteriyor,
öğrendiğin kartlar.

> Ders: "set tamam görünsün" diye boş slotu doldurmak, boş bırakmaktan kötü.
> Bir ikonun iki anlamı olması, bir kavramın ikonsuz kalmasından daha çok
> karıştırıyor — üstelik buradaki "iki ikon" hiç var olmamıştı bile.

### `dark` kartı kendi çerçevesiyle gelmişti

100 kartı yan yana dizince biri ayrıksı duruyordu: `dark`. Sebebi kırpma
değil, **çizimin kendisiydi** — model onu tuvalin ortasına, etrafında geniş
boş pay bırakan bir yuvarlak dikdörtgen içine çizmişti. İçerik 1200×896'lık
tuvalin yalnızca %62'sini kaplıyordu ve `cover` o payı olduğu gibi koruyordu.

`import-images.mjs` artık listelenen id'lerde çerçeveyi atıyor: içeriğin sınır
kutusu bulunuyor, sonra kutu 4:3'e **genişletiliyor** — kırpılmıyor. Kenarda
226 piksel pay olduğu için genişletme gerçek piksellerden geliyor; uydurma
zemin eklenmiyor, çizimden de bir şey kesilmiyor.

Liste elle tutuluyor, kural otomatik değil: kartların çoğunda zemin düz bir
renkle kenardan kenara doluyor ve orada "içerik kutusu" çizimin *kendisi*
olur — kırpmak onları yakınlaştırıp bozardı.

> Dikkat: kancası "dark ≈ **dar**" ve görsel notu "iki duvar arasında daralan
> karanlık sokak". Yani sokağın dar olması yöntemin kendisi; düzeltilen şey
> çizimin kendi çerçevesi içinde küçük kalmasıydı.

### Sette çalışmayan tek ikon: harf

`harf` artık tam ve doğru ama **beş karo genişliğinde**, yani 4:1 bir çizim.
Egzersiz kutusundaki 20 pikselde 20×5 piksele sıkışıyor ve koyu bir leke
olarak okunuyor. Rayı kesip kırpmak yeni bir kesik kenar yaratacağı için
elle düzeltilmedi; kredi gelince o hücre üç karo olarak yeniden çizilmeli.

### `ikon` alanı resim değil, AD taşıyor

`exercise.ts` merdivenin kurallarını tutuyor ve **saf** — DOM yok, varlık yok,
test edilebilir. Basamağa doğrudan resim URL'si koymak o saflığı bozardı.
Onun yerine `IkonAd` taşıyor; adın hangi dosyaya düştüğünü yalnızca
`icons.ts` biliyor.

Bu bağ **çalışma anında** kuruluyor, yani tip sistemi göremiyor: `brand/`
içinde bir dosyanın adı değişip `IKONLAR` listesi eski adda kalırsa derleme
sessizce geçer, ekranda ikon kaybolur. `icons.test.ts` tam bunu tutuyor —
her adın iki dosyası var mı, ve üretilen her dosya listede mi.

### Paketin yarısı base64'e gömülüyordu

İlk derlemede 40 ikonun 17'si dosya, 23'ü **base64 olarak paketin içinde**
çıktı. Sebep Vite'ın varsayılan 4 KB sınırı: set tam ortasına düşüyor. İki
sonucu vardı — ana paket ~100 KB'lik base64 ile şişiyor ve *aynı setin*
ikonları birbirinden farklı davranıyordu.

`assetsInlineLimit` bir işlevle daraltıldı: `/assets/ikonlar/` altındakiler
hiç gömülmüyor. Uygulama zaten çevrimdışı, servis çalışanı `**/*.png`'yi
ön-belliyor — dosya olmaları hiçbir şey kaybettirmiyor, ana paket 573 KB'den
476 KB'ye indi.

> Tuzak: `assetsInlineLimit` işlevi `true` dönerse **zorla gömer**. İlk
> yazılışta yüklem ters kurulmuştu ve kart görselleri o dala düşüp ana paketi
> 2,3 MB yapmıştı. Doğrusu: `false` = gömme, `undefined` = her zamanki sınır.

### Sette olmayan üç ikon

`🔥` (seri), `❄️` (seri koruma) ve `🎉` (set finali) hâlâ emoji — setin bu üçü
için çizimi yok ve üretim kredisi bitti. Elle çizilen, setin çizgi kalınlığını
tutturamayan bir alev koymaktansa tanınır bir emoji bırakmak daha az kötü.
Kredi gelince üretilecek ilk üç ikon bunlar.

`✓`, `←`, `›` ise **tipografik** ve öyle kalmalı: onlar ikon değil, işaret.

### Bildirim ikonu: örnek değer üretimde kalmış

`capacitor.config.json` Capacitor'un **belgelerindeki örnek değeri**
taşıyordu: `smallIcon: "ic_stat_icon_config_sample"`. Eklenti böyle bir
drawable göndermiyor (`@capacitor/local-notifications` içinde yalnızca
`ic_transparent.xml` var), yani ad hiçbir şeye çözülmüyor ve Android
uygulama simgesine düşüyordu — durum çubuğunda **beyaz bir leke**.

Günlük hatırlatma gerçekten gönderildiği için (Ayarlar'daki o satır, APK'da)
bu görünen bir kusurdu.

**Neden logo kullanılamadı.** Durum çubuğu ikonu bir ALFA MASKESİDİR: Android
bütün opak pikselleri beyaza boyar, renk atılır. Logonun dolu beyin formu
böyle olunca 24 pikselde tanınmaz bir lekeye dönüşüyor — denendi, görüldü.

**Çözüm ikon setinden geldi.** Setteki çizimler *çizgi* çizimi; içleri şeffaf
olduğu için siluete çevrilince yapılarını koruyorlar. `ogren` (filiz) seçildi:
zaten "Öğren" sekmesinin sembolü, yani bildirim uygulamanın kendi diliyle
"öğrenme vakti" diyor. 24 pikselde okunuyor.

`iconColor` da değişti: `#16233A` → `#4F92F6`. Bildirim gölgesinde küçük ikon
bu renkle boyanıyor; koyu lacivert, koyu temadaki gölgede kayboluyordu.
Marka mavisi hem açık hem koyu gölgede okunuyor.

**Yerleştirme ayrı bir adım.** `android/` depoda tutulmuyor, her seferinde
`cap add android` ile üretiliyor; `@capacitor/assets` ise launcher ve açılış
ekranını üretiyor, bildirim ikonunu **üretmiyor**. Bu yüzden
`npm run icons:bildirim` `cap add android` SONRASINDA çalıştırılmalı —
tıpkı build.gradle'daki `buildDirectory` bloğu gibi.

> Betik çalıştırılmazsa davranış bugünküyle aynı kalır (ad çözülmez,
> uygulama simgesine düşer), yani unutmak bir gerileme yaratmıyor —
> sadece düzelme olmuyor.

---

## 2026-09-22 — Ders içinde ritim: geçiş anı

### İstek kutlamaydı, çıkan şey kutlama olmadı

İstek şuydu: *"her aşama bittikten sonra kutlama olsun, tebrikler bitirdiniz
tarzı"*. Altında gerçek bir kusur vardı — ders **uzun bir düz akış**. Beş
kelime × altı basamak = otuz soru, arada hiçbir kapanış hissi yok.

Ama kutlama yanlış araçtı, üç sebeple:

1. **Ödül enflasyonu.** Bu üründe kutlanacak iki an zaten var ve ikisi de
   nadir: ders sonu (`SessionDone`) ve setin bitmesi (`SetFinale` — dosyanın
   kendi yorumunda "bir kez yaşanan an" diye geçiyor). Her aşamaya tebrik
   koymak o ikisini düzleştirir.
2. **Akış maliyeti.** Bu ürünün en büyük kazancı üç düğmeyi tek "Başla"ya
   indirmekti. Aşama başına kutlama, her aşamanın arasına bir duraklama
   koyar.
3. **Yanlış şeyi kutlamak.** 1-2. basamakta kanca ekranda duruyor —
   `olculebilir()` bu yüzden orada `false` döndürüyor. Oradaki doğru
   "kanca tuttu" demiyor. Katılımı ödüllendirmek, "beyan yerine ölçüm"
   ilkesinin tam tersi.

Onun yerine **geçiş anı**: ne kapandı, kaç doğru, ne açılıyor. Tebrik dili
yok, konfeti yok, sayı gerçek.

### Kaç tane olacağı zaten belliydi

İlk öneri "bölüm araları" idi (2 geçiş) ama kodu okuyunca görüldü ki öğrenme
testi merdivenin **altı basamağını da** sırayla koşuyor
(`ADIMLAR.flatMap(...)`) — yani kullanıcının tarif ettiği aşamalar gerçekten
var. Dosyanın tepesindeki açıklama hâlâ "merdivenin 1-2. basamağı" diyordu,
bayat kalmış; düzeltildi.

Altı geçiş fazlaydı, ikisi azdı. Doğru sayı **üçtü** — çünkü merdivenin üç
bölgesi zaten iki ekranda yaşıyordu: Egzersiz'de basamak kutularının rengi
(mavi/sarı/nane), İlerleme'de "Neler yapabildin" çubukları. Geçiş anı yeni
bir kavram icat etmiyor, var olanı tekrar ediyor:

| Basamak | Renk | Geçişte |
|---|---|---|
| 1–2 | mavi | **Tanıdın** → "Şimdi kanca ekrandan kalkıyor" |
| 3–4 | sarı | **Hatırladın** → "Şimdi kelimeyi baştan sen yazacaksın" |
| 5–6 | nane | **Ürettin** |

Başlıklar **geçmiş zaman**: bölge bittiğinde gösteriliyor, yani az önce
yapılan şey. "Tanıma" değil "Tanıdın".

### Üç bölge artık tek kaynakta

`BOLGELER` + `bolgelereBol()` `exercise.ts` içinde — modül saf kalıyor, ikon
ve renk **ad** olarak taşınıyor (`ADIM`'ın `ikon` alanıyla aynı desen).
Egzersiz ve İlerleme ekranları bir gün buradan beslenebilir.

### Runner'a dokunulmadı

Motor bir basamağın bittiğini dışarı vermiyor. Ona olay eklemek yerine
öğrenme testi **bölge bölge koşturuluyor**: her bölge kendi `Runner`'ını
alıyor, `onDone` zaten aradığımız sınır. Motorun sözleşmesi değişmedi.

Son bölgenin geçişi aynı zamanda bölümün geçişi — üst üste iki ekran
çıkmasın diye `bolumGecisi('ogrenme')` bilerek `null` dönüyor. Son bölümün
ardından geçiş anı hiç gösterilmiyor: orada `SessionDone` var ve asıl
kutlama o.

### Ertelenen: hesap

Aynı turda "kullanıcı oluşturma mantıklı mı" diye soruldu. Cevap **hayır,
bu aşamada değil** — gerekçesi "Sırada" listesindekiyle aynı: yayın → D1/D7
→ sonra karar. Kayıt duvarı "haa" anından önce konursa hesabın kurtardığından
fazlasını kapıda kaybettirir.

İstenen şeyin özü hesap değilmiş: *"kendi hesabı gibi görsün, yedeği yine
cihaza alsın, ismini kendi seçsin"*. Bu **yerel profil** demek ve sunucusuz
yapılabilir; ileride bulut gelirse bu profil çapa olur. Ayrı bir tura bırakıldı.

> Dikkat: yerel profil "kaç kişi kullanıyor" sorusunu ÇÖZMÜYOR. Cihazda duran
> bir isim kimseye ulaşmaz; sayım ayrı bir iş ve tek yolu anonim bir ping
> (ya da APK Play'e girerse Play Console).

---

## 2026-09-22 — Yerel profil, avatarlar ve çerçeveler

### Kredi bitmemişti

Bu turun başında "Magnific kredisi bitti" varsayımıyla üç iş ertelenmişti:
beş karolu `harf` ikonu, `🔥`/`❄️`/`🎉` emojileri ve çerçeve fikri.
Bakiye kontrol edilince **192.535 kredi** çıktı (planın 216.000'inin
23.465'i harcanmış). Erteleme gereksizmiş.

> Ders: "kredi yok" bir varsayımdı, bir ölçüm değil. Maliyeti olan bir
> karar vermeden önce bakılacak bir sayı varsa bakılır.

### Hesap değil, PROFİL

İstek "kullanıcı oluşturma" diye başladı, konuşunca özü çıktı: *"kendi
hesabı gibi görsün, yedeği yine cihaza alsın, ismini kendi seçsin"*.
Yani istenen şey hesap değil, **kimlik hissi**.

Kurulan şey tamamen yerel: e-posta yok, şifre yok, giriş yok, sunucu yok.
Uygulama içinde her yerde "profil" denir — "hesap" denirse insanlar
verilerinin bulutta olduğunu sanıp yedek almayı bırakır ve veri kaybı
**artar**.

**Profil kendiliğinden oluşur.** İlk açılışta ad ve avatar üretilir
(`profilSagla`), kullanıcıya "adın ne" diye sorulmaz. Kayıt duvarı yeni
bir uygulamanın en pahalı ekranıdır ve "haa" anından önce konursa
kazandırdığından fazlasını kapıda kaybettirir. İsteyen Ayarlar'dan
değiştirir, istemeyen hiç fark etmez.

**Ad ile yüz aynı yerden geliyor.** Otomatik ad sıfat + hayvan
("Meraklı Tilki") ve avatar da o hayvan. Kullanıcı hiçbir şey yapmadan
kendine ait bir şeye bakıyor. `HAYVANLAR` listesi ile avatar klasörü
ayrışırsa profil adsız bir yüze düşer — test ikisini karşılaştırıyor.

### İleride bulut istenirse ne işe yarar

Soru buydu ve cevabı net: **ad ve fotoğraf değil, `id` işe yarar.**

`Profil.id` rastgele, kalıcı, görünmez bir kimlik. Ad kimlik değildir —
iki kişi de "Meraklı Tilki" olabilir, kullanıcı adını her gün
değiştirebilir. Bu alan olmadan bulut senkronu geldiğinde *"bu aynı
kişinin yeniden kurulumu mu, yoksa başka biri mi"* sorusu cevapsız kalır
ve herkes sıfırdan başlar. Üretildiği an dışında hiç değişmiyor,
kullanıcıya hiç gösterilmiyor, hiçbir yere gönderilmiyor — ama **yedeğe
giriyor**, yani cihaz değiştiren kişi kimliğini de taşıyor.

`olusturuldu` ikinci yarısı: iki cihaz birleşirse hangisinin eski olduğu
oradan bilinir.

> Yine de: yerel profil **"kaç kişi kullanıyor"u çözmüyor.** Cihazda duran
> bir isim kimseye ulaşmaz. Sayım ayrı bir iş; tek yolu anonim bir ping
> (aynı `id` kullanılabilir) ya da APK Play'e girerse Play Console.

**Fotoğraf ayrı tutuldu.** `Avatar` birleşim tipinde `foto` ayrı bir dal:
bulut senkronu gelirse hayvan/ikon seçimi zararsızca taşınır ama fotoğraf
**kişisel veridir** ve ayrı bir onay ister.

### Çerçeveler satılmıyor, kazanılıyor

İstek "oyunlardaki premium çerçeveler, hatta bazen satılıyor" idi. Altı
çerçeve üretildi (halka, halat, taşlı, defne, güneş, kraliyet) ama
satılmıyorlar: **gerçek ilerlemeyle** açılıyorlar — 10/25/50 kelime,
7 günlük seri, seti bitirmek. Şart "uygulamayı 3 gün aç" gibi bir
katılım ölçüsü değil, iş ölçüsü; bu üründe ödül yapılan şey için verilir.

Hak edilmemiş çerçeve **okurken** düzeltiliyor (`gecerliCerceve`): yedek
başka cihazdan gelirse ya da ilerleme sıfırlanırsa profil varsayılana
düşer. Kayda dokunulmuyor — koşul yeniden sağlanırsa çerçeve geri gelir.

### Çerçevenin deliği ölçülüyor — bu işin can alıcı yeri

Altı çerçeve aynı sayfada çizildi ama birbirinin aynı değil: defnenin
yaprakları dışa taşıyor, dikenli taç çok daha geniş, kraliyetin tepesinde
taç var. Hepsini aynı **dış** kutuya oturtmak işe yaramaz — o zaman iç
delikler farklı büyüklükte olur ve avatar kimi çerçevede taşar, kiminde
ortada küçücük kalır.

Hizalama bu yüzden dışarıdan değil **içeriden**: her çerçevenin deliği
flood fill ile bulunuyor (merkez + yarıçap), sonra çizim o delik sabit
bir orana gelecek şekilde ölçekleniyor ve delik merkezi tuval merkezine
oturtuluyor. Kutu merkezi kullanılamazdı: taç yüzünden çizim simetrik
değil, delik kutunun ortasında durmuyor.

Oran da elle yazılmıyor. En geniş çerçeve (dikenli taç) deliğin 1,67 katı
olduğu için delik ancak 0,58 olabiliyor; üretim bunu hesaplayıp
`olcu.json`'a yazıyor, `Avatar` bileşeni oradan okuyor. İki yerde tutulan
bir sayı, çerçeve seti değişince avatarın sessizce kayması demekti.

### Çerçeveler madeni kademeye döndü

İlk set altı ayrı süslemeydi (halka, defne, taşlı, dikenli, halat,
kraliyet) ve hepsi lacivert + sarıydı. Ekranda görülünce eksik olan şey
belli oldu: **hangisinin daha değerli olduğu anlaşılmıyordu.** Altı farklı
şekil, altı eşit görünüm — sıra ancak altındaki yazı okunarak biliniyordu.

Son dördü madeni kademeye çevrildi: **bakır → gümüş → altın → platin**.
Kademe artık renkten okunuyor. İlk ikisi markanın kendi dilinde kaldı —
başlangıç çerçevesinin arayüzün geri kalanıyla aynı dilde olması doğru.

Bu, "düz dolgu, gradyan yok" kuralının bilerek delindiği tek yer: bunlar
arayüz ikonu değil, **kazanılan nesneler**. Üretim tarafında da ayrı bir yol
gerekti — `boya()` her pikseli iki karışım doğrusundan birine indirgiyor,
madeni geçişler onlarca ton taşıyor. `renkliKes()` alfayı zeminden
uzaklıkla veriyor ve rengi karışımdan geri çözüyor
(`F = (P − (1−a)·BG) / a`), yoksa yarı saydam kenarlarda krem bir hale
kalıyordu.

### Seri kırılınca çerçeve geri alınıyordu

Çerçeve kilidi `streakCount`'a, yani **mevcut** seriye bakıyordu. Yani 7
günlük seriyle Gümüş'ü açan biri bir gün kaçırınca çerçeveyi kaybediyordu.

Bu bir ceza ve serinin kendi kuralıyla çelişiyor: *"ödül var, ceza yok —
kırılınca suçlayıcı bildirim gelmez"*. Kazanılmış bir nişanı geri almak,
suçlayıcı bildirimden daha ağır.

`AppState.bestStreak` eklendi: yalnızca büyüyen bir sayı, her seans
sonunda `max` ile güncelleniyor. Kilitler ona bakıyor. Eski kayıtlarda
alan yok, `getState` onu mevcut seriyle dolduruyor — geçmişteki daha uzun
bir seri bilinmiyor ama kullanıcıyı bugün sahip olduğundan geride
göstermek yanlış olurdu.

> Ders: "kazanıldı" ile "şu an geçerli" ayrı şeyler. Bir rozet ikincisine
> bağlanırsa rozet değil, kira olur.

### Seçim halkası resimden büyüktü — iki ayrı sebep

Hayvan seçme ızgarasında seçili olanın etrafındaki halka resimden belirgin
biçimde genişti, bozukluk gibi duruyordu. İki sebebi vardı ve ilki
düzeltilince ikincisi ortaya çıktı.

**Birincisi:** `Avatar` sabit piksel ölçüsüyle çiziliyordu (68px) ama düğme
ızgara hücresi kadar genişti; halka düğmeyi sarıyor, resim içeride küçük
kalıyordu. `w-full` sınıfı işe yaramıyordu çünkü satır içi `style` onu
eziyor. `boyut="tam"` eklendi: sabit piksel yerine kapsayıcıyı dolduruyor,
iç çember de yüzdeyle veriliyor.

**İkincisi — asıl inatçı olan:** `Avatar`'ın kökü `inline-grid`'di. Satır
içi bir öğenin altında **taban çizgisi boşluğu** kalıyor, yani kapsayıcı
düğme resimden birkaç piksel uzun oluyor ve halka bir daire değil hafif
oval, resimden büyük bir şekil olarak çiziliyordu. `grid`'e (blok seviyesi)
çevrilince boşluk kayboldu: düğme 61,6×61,6, resim 61,6×61,6.

Halka kalınlığı da 3px'ten 2px'e indi.

> Ders: "ölçüyü büyüttüm, hâlâ oturmuyor" dendiğinde ölçü değil YERLEŞİM
> modeline bakılmalı. Tarayıcıda görülen boşluğun kaynağı çoğu zaman
> yazılan bir sayı değil, öğenin satır içi mi blok mu olduğudur.

### Ana ekranda iki bölüm yüzeysizdi

"Bugünün hedefi" çubuğu ve "Son tanıştıkların" cipleri sayfanın zemininde,
kartların arasında **yüzer halde** duruyordu. Ekrandaki her şey bir yüzeyin
üzerindeyken tek başına duran o iki satır eksik görünüyordu — bu uygulamanın
dili kart: *"beyaz, yuvarlak, yumuşak gölgeli bir nesne"*.

İkisi de karta alındı. İki küçük ama gerekli ayrıntı:

- İlerleme çubuğunun zemini `white/70`'ten `sunken`'a döndü — beyaz kartın
  üzerinde beyaz çubuk görünmüyor.
- Kanca çipleri de `white`'tan `sunken`'a; aynı sebep.

"Son tanıştıkların" yanındaki **"12 kelime" sayacı kaldırıldı.** O bölüm bir
ölçüm değil, son öğrenilenlere bakma yeri; sayı zaten hemen üstteki hedefte
ve İlerleme sekmesinde duruyor. İki yerde duran sayı, üçüncü yerde gürültü.

### Geri alınan: ikon avatarları

Avatar olarak marka ikonu + renkli zemin de seçilebiliyordu (23 × 6 = 138
kombinasyon). Ekranda görülünce kalktı: **hayvan portrelerinin yanında
sönük duruyordu.** Çizilmiş, ifadeli, renkli dokuz yüzün yanına iki renkli
bir arayüz ikonu koymak, ikisini de zayıflatıyor — biri profil resmi gibi
durmuyor, diğeri de artık "tek seçenek" olmanın netliğini kaybediyor.

Seçenek sayısı düştü ama seçim kolaylaştı: hayvan ya da kendi fotoğrafın.

Tip birleşiminden de çıkarıldı, yani artık üretilemez. Eski bir kayıtta
kalmış olabilir diye `profilDuzelt` okurken onu hayvana çeviriyor —
tercihen **adın kendi hayvanına** ("Şen Baykuş" → baykuş).

> Ders: bir seçenek eklemek bedava değil. Yanına konduğu şeyi de
> değiştiriyor.

### Emojiler bitti

`seri`, `koruma`, `kutlama` ikinci ikon sayfasıyla geldi; `🔥 ❄️ 🎉`
kalktı. Arayüzde artık `✓`, `←`, `›` dışında emoji yok — o üçü de
tipografik işaret, ikon değil.

İkinci sayfanın ilk denemesi **dolu siluet** olarak geldi ve setin çizgi
diliyle örtüşmedi. Atılmadı, stil açıkça tarif edilip bir kez yeniden
üretildi: *"bunlar KONTUR ikonları, içi boş, dolu glif değil"*.

---

## 2026-09-22 — "Bunu biliyorum" ve kancanın bedeli

### İstek kelime seçtirmekti, çıkan şey o olmadı

İstek şuydu: ilk derste kullanıcı kendi kelimelerini seçsin, bir de
"rastgele seç" düğmesi olsun. İkisi de yapılmadı, sebepleriyle:

**Rastgele** mevcut sırayı bozar. Sıra rastgele değil, tasarlanmış:
sıklık sırası + ilk beş kartta zayıf kanca yok (`far ≈ far` gibi kartlar
yöntemin ne yaptığını göstermiyor, bilerek geriye itilmişler). Rastgelelik
özgürlük değil; iyi bir sıralamayı kötüsüyle değiştirmek.

**İlk derste seçtirmek** üç sebeple en kötü an: (1) kullanıcının karar
verecek bilgisi yok — kelimeleri bilmediği için buradalar, (2) ilk beş
kart vitrin, kendi seçerse ilk izlenimi "bu zaten aynı kelime" olabilir,
(3) "tek akış, tek karar" kazancını en kırılgan noktada harcar.

Ama altındaki ihtiyaç gerçekti. İnsanların kelime seçmek istemesinin
sebebi genelde *"bunu zaten biliyorum, boşa çalışmayayım"*dır — bu
**planlama değil tepki**, ve tepki çok daha ucuz.

### Kayma, kararın kilit taşı

"Biliyorum" denince yerine sıradaki kelime kayıyor. Alternatif ders
kısalmasıydı ve o günlük hedefi **yalancı** yapardı: "5/5 kelime" derken
aslında 4 öğrenilmiş olurdu. Hedefin anlamı korunması gereken şeydi.

Kaymanın şartı: atlanan kelime **günlük sayacı yememeli**. `introduced:
false` bunu kendiliğinden sağlıyor.

### `introduced: false` bir numara değil, doğru olan

Kelime uygulamada öğrenilmedi: kanca gösterilmedi, soru sorulmadı, hiçbir
şey ölçülmedi. Onu "öğrenilmiş" saymak veriyi kirletirdi.

Yan faydası büyük: `introduced` süzen **her yer** onu kendiliğinden eliyor —
puanlama, set bitişi, günlük sayaç, kapsamlar, paylaşım panosu. Elle
elenmesi gereken yalnızca iki yer kaldı (`nextBatch` ve `dueQueue`) ve
ikisi de açıkça yazıldı.

> Ders: doğru veri modelini seçmek, yirmi yerde "bunu da ele" yazmaktan
> ucuz. Bayrak eklemeden önce var olan alanın ne anlattığına bakılmalı.

### Kancaya basmanın bedeli — sanılandan azmış

"Kancaya basınca olumsuz etkisi olmasın" istendi. Koda bakınca çıkan:
zaten neredeyse yok.

| | |
|---|---|
| Başarı yüzdesi | doğru sayılıyor, `ipucu` süzülmüyor |
| FSRS zamanlaması | `Rating.Good`, aralık normal uzuyor |
| "Neler yapabildin" | o cevap sayılmıyor ama sonradan kancasız yapınca sayılıyor |
| `unaidedOk` / `hookRevealCount` | yalnızca geliştirme paneline gidiyor |
| **Merdiven** | **yerinde kalıyor** — tek gerçek etki |

Merdiven ilerlemesi bilerek engelli: merdivenin tek işi *"artık kancasız
yapabiliyor musun"* sorusuna cevap vermek. Kancayla ilerletirsek yeteneği
değil katılımı ölçer ve kullanıcı 6. basamakta kanca yokken çuvallar.

**Eksik olan ceza değil, geri bildirimdi.** Kancayla doğru bilince ekranda
hiçbir şey olmuyordu: "Doğru" yazıyor, merdiven kımıldamıyor, sebebi
söylenmiyor — bu cezalandırılmış gibi hissettiriyor. Tek satır eklendi:
*"kancayla bildin · bir dahakine kancasız dene"*. Puanlamaya dokunulmadı.

### Kenarda duran kusur

`unaidedOk` ilk ölçülebilir cevapta **bir kez** yazılıp bir daha
güncellenmiyor; tek bir erken an kalıcı damga bırakıyor. Kullanıcıya zararı
yok (yalnızca geliştirme paneli) ama ölçüm olarak zayıf. Bilerek bu turda
dokunulmadı.

---

## 2026-09-22 — Kullanım ölçümü (kendi Supabase tablomuz)

### Bu karar "veri toplamıyoruz" sözünü bitiriyor

Uygulamanın en net özelliklerinden biriydi ve Play'in Veri Güvenliği
formunu "hiçbir veri toplanmıyor" diye doldurmayı planlıyorduk. Artık
öyle diyemeyiz.

O yüzden kodla **birlikte** yasal metinler de yazıldı. Play'de asıl
ret/kaldırma sebebi analitik kullanmak değil, **beyan uyuşmazlığıdır**.

### Önce Firebase kuruldu, sonra Supabase'e geçildi

Bir tur Firebase Analytics kurulu kaldı. Sonra Supabase hesabının zaten
açılmış olduğu ortaya çıktı — ve ikisinin **aynı işi yapmadığı** yanlış
anlaşılmıştı. Karşılaştırma:

| | Firebase | Supabase |
|---|---|---|
| Panolar | Hazır (retention, huni) | Yok — SQL yazılır |
| Veri kimde | Google'da | Bizde |
| Paket | ~45 KB ayrı parça | `fetch` ile **0 KB** |
| KVKK | Google'a aktarım ayrıca anlatılır | Tek işleyen, barındırma |

Asıl soru *"kaç kişi kullanıyor, geri geliyorlar mı"* ve Supabase buna
fazlasıyla yetiyor. Firebase'in fazlası (hazır panolar, huni, A/B) bu
aşamada gerekmiyor — 0 kullanıcıda değil, 1.000'de gerekir.

Geçiş ucuzdu çünkü `analitik.ts` baştan **sınır** olarak yazılmıştı:
uygulamanın geri kalanı yalnızca `olay()` çağırıyor, arka ucu tanımıyor.
Değişen tek dosya o oldu. Toplam JS 553 → 509 KB.

> Ders: dış bir servisi doğrudan çağrı noktalarına serpiştirmek ucuz
> görünür; bir sınır dosyası yazmak, fikir değiştirince bedava çıkar.

### SDK yok

`@supabase/supabase-js` ~40 KB getirir ve karşılığında auth, realtime,
storage verir — hiçbirini kullanmıyoruz. Tek ihtiyacımız bir INSERT;
PostgREST düz bir HTTP ucu, `fetch` yetiyor.

### Kuyruk: çevrimdışı çalışan bir uygulamada şart

Olaylar `localStorage`'da biriktirilip 5 saniyede bir toplu gönderiliyor.
Gönderim başarısız olursa kayıtlar **kuyrukta kalıyor** — uygulama
çevrimdışı çalışabildiği için "gönderemedim, attım" ölçümün yarısını yok
ederdi. Kuyruk 200 kayıtla sınırlı; sayfa gizlenirken `keepalive` ile
boşaltılıyor.

Kalıcı hatada (4xx — şema uyumsuzluğu gibi) kuyruk temizleniyor, yoksa
sonsuza kadar aynı hatayı tekrarlardı.

### Supabase kurulumu

Şema artık **panelde değil, depoda**:
`supabase/migrations/20260922000000_olaylar.sql`.

Bir süre bu SQL burada, bu dosyada duruyordu ve SQL Editor'e elle
yapıştırılıyordu. Böyle olunca "üretimdeki tablo hangi halde" sorusunun
cevabı hiçbir yerde yazmıyordu. Artık `supabase db push` uyguluyor ve
değişiklikler yeni bir migration dosyası olarak birikiyor.

Migration'ın kendisi neden öyle yazıldığını anlatıyor; buraya
tekrarlanmayacak kadar yorumlu. Üç karar özetle:

- **`ad` sütununda enum/check yok.** Kısıtlasaydık, kodda yeni bir olay
  eklenip migration unutulduğunda sunucu 4xx döner, istemci de 4xx'i
  "kalıcı hata" sayıp kayıtları atardı — sessiz ve geri dönülmez veri
  kaybı. Yazım hatasını zaten `type Olay` yakalıyor.
- **RLS yalnızca INSERT.** `anon` anahtarı gizli değil, APK'dan
  çıkarılabilir. Güvenliği sağlayan şey anahtarın saklanması değil, bu
  politika: kimse yazılanı geri okuyamaz, güncelleyemez, silemez.
- **`olustu` istemciden, `alindi` sunucudan.** Cihaz saati yanlış
  olabilir; ikisinin farkı saat kaymasını gösteriyor.

#### Saklama süresi — artık bağlı

`public/gizlilik.html` 5. maddede kullanım olaylarının **en fazla 24 ay**
saklanacağı yazıyor. Bir süre bunu yapan hiçbir şey yoktu: metin söz
veriyor, kod tutmuyordu.

`pg_cron` ile bağlandı (`20260922000100_olaylar_saklama_zamanlamasi.sql`):
her ayın 1'i 04:00 UTC'de `bakim.olaylari_temizle(24)` çalışıyor. Ayrı
migration dosyası, çünkü `pg_cron` her projede açık değil — tablo her
koşulda kurulsun, zamanlama takılırsa yalnızca kendisi takılsın.

Fonksiyon `ay = 0` ile çağrılıp gerçekten sildiği doğrulandı.

#### Kurulum yapıldı — ve iki hata çıktı

Şema 22 Eylül 2026'da uygulandı (Supabase MCP üzerinden, `apply_migration`).
İkisi de ancak gerçekten çalıştırınca ortaya çıkan iki hata vardı:

**1. İndeks hiç çalışmıyormuş.** `(kimlik, (olustu::date))` yazılıydı,
Postgres reddetti: *"functions in index expression must be marked
IMMUTABLE"*. `timestamptz → date` çevirimi sunucunun TimeZone ayarına
bağlı. Bu SQL aylardır NOTLAR'da duruyordu, demek ki **hiç
çalıştırılmamış** — panele elle yapıştırma yöntemiyle de aynı hatayı
alacaktık. Şemayı migration'a taşımanın karşılığını ilk gün verdi.
Düzeltme: düz `(kimlik, olustu)`.

**2. Ölçüm sorguları yanlış günü sayıyormuş.** Aynı `olustu::date`
sorgularda çalışıyor (STABLE yeterli) ama **UTC'ye göre** gün kesiyor.
Türkiye UTC+3; gece 00:00–03:00 arası ders yapan biri bir önceki güne
düşüyordu. Hem günlük aktif kullanıcıyı hem D1/D7'yi kaydıran sessiz bir
hata. Düzeltildi: `at time zone 'Europe/Istanbul'`.

#### RLS iddia ettiğini yapıyor mu — ölçüldü

"Yalnızca INSERT" bir niyet beyanı olarak kalmasın diye `anon` rolüyle ve
gerçek HTTP ucuyla denendi:

| Deneme | Sonuç |
|---|---|
| INSERT | 201 — yazdı |
| SELECT | `[]` — 0 satır |
| DELETE | HTTP 204 döndü ama **0 satır silindi** |
| UPDATE | 0 satır |
| `bakim.olaylari_temizle()` RPC | 404 / permission denied |

DELETE'in 204 dönmesi ilk bakışta korkutucu: PostgREST politika olmadığı
için 0 satır etkileyip yine de "başarılı" diyor. Satır sayısı kontrol
edildi, hiçbir şey silinmemişti.

Uçtan uca da denendi: uygulama başsız tarayıcıda açıldı, `uygulama_acildi`
olayı kuyruğa girdi, 5 sn sonra POST 201 aldı, kuyruk boşaldı ve satır
tabloya düştü. Giden tek kimlik rastgele UUID; isim, fotoğraf, cevap,
konum yok. `alindi - olustu = 5 sn` — toplu gönderim penceresinin kendisi.

#### Fonksiyon neden `public` dışında

PostgREST yalnızca `public` şemasını dışa açıyor. `olaylari_temizle`
orada olsaydı, `security definer` bir silme fonksiyonu anon anahtarıyla
RPC olarak çağrılabilirdi — yani herkes ölçümü süpürebilirdi. O yüzden
`bakim` şemasında ve `anon`dan yetkisi alınmış durumda.

### Ölçüm sorguları

**Gün sınırı UTC'de değil, Türkiye saatinde.** Sorguların ilk hali düz
`olustu::date` yazıyordu; o, sunucunun TimeZone ayarına (Supabase'de UTC)
göre gün kesiyor. Türkiye UTC+3 olduğu için gece 00:00–03:00 arasında ders
yapan biri **bir önceki güne** sayılırdı — hem günlük aktif kullanıcıyı
hem D1/D7'yi sessizce kaydıran bir hata. Onun yerine açıkça
`at time zone 'Europe/Istanbul'`.

```sql
-- Günlük tekil kullanıcı
select (olustu at time zone 'Europe/Istanbul')::date gun,
       count(distinct kimlik) kisi
from olaylar where ad = 'uygulama_acildi'
group by 1 order by 1 desc;

-- D1 / D7: ilk günden sonra geri gelen oranı
with olay as (
  select kimlik, (olustu at time zone 'Europe/Istanbul')::date gun
  from olaylar
),
ilk as (select kimlik, min(gun) g0 from olay group by 1)
select
  count(*) filter (where var1)::float / nullif(count(*), 0) d1,
  count(*) filter (where var7)::float / nullif(count(*), 0) d7
from (
  select i.kimlik,
    exists (select 1 from olay o where o.kimlik = i.kimlik and o.gun = i.g0 + 1) var1,
    exists (select 1 from olay o where o.kimlik = i.kimlik and o.gun = i.g0 + 7) var7
  from ilk i
  where i.g0 < (now() at time zone 'Europe/Istanbul')::date - 7
) t;
```

`nullif(count(*), 0)` da sonradan eklendi: henüz 7 günü dolmuş kimse
yokken payda sıfır oluyor ve sorgu bölme hatasıyla patlıyordu. Yayının
ilk haftasında tam olarak bu durumda olacağız.

### Üç kural (değişmedi)

1. **Yapılandırma yoksa sessizce kapalı.** Adres ve anahtar
   `VITE_SUPABASE_*` ortam değişkeninden; yoksa hiçbir şey gönderilmiyor
   ve Ayarlar'daki anahtar bile görünmüyor.
2. **Kullanıcı kapatabilir.** Varsayılan açık ama ilk açılışta izin
   diyaloğu **sorulmuyor**: karşılama akışı bu ürünün en korunan yeri.
3. **Kişisel veri gönderilmiyor.** Tek kimlik `Profil.id`.

### Olay adları sabit liste

`type Olay` bir birleşim tipi, serbest metin değil. Serbest olsaydı bir
gün `ders_bitti`, başka gün `dersBitti` yazılır ve tabloda iki ayrı olay
birikirdi. Yazım hatası artık derlemede yakalanıyor.

### Sürüm tek kaynaktan

Ayarlar'da elle `"0.1.0"` yazılıydı ve paketin sürümüyle ayrışabilirdi.
Artık `package.json`'dan derleme sabiti olarak geliyor (`__APP_VERSION__`)
— hem ekranda hem ölçüm kayıtlarında aynı sayı.

### Play Veri Güvenliği formu için cevaplar

Uygulama veri **topluyor** (artık "hayır" denemez). Beyan edilecekler:

| Kategori | Ne | Amaç |
|---|---|---|
| Uygulama etkinliği | uygulama içi olaylar | Analiz |
| Cihaz veya diğer kimlikler | uygulamanın ürettiği rastgele numara | Analiz |

Konum **beyan edilmez** — Firebase'den farklı olarak toplamıyoruz. Hepsi
için: aktarım şifreli · kullanıcı silme talep edebilir · veriler
satılmıyor · reklam yok.

### Android tarafı

Firebase kaldırılınca `google-services.json` gereği de kalktı. Supabase
düz HTTPS olduğu için native tarafta **hiçbir kurulum gerekmiyor**.

---

## Ortam

`/Volumes/TwinMOS` **exFAT**. macOS her dosyanın yanına `._` gölgesi bırakıyor;
git bunları `.git/objects` içinde gerçek pack sanıp `non-monotonic index`
hatası veriyor, vitest de test dosyası sanıp parse hatası veriyor. `.gitignore`
ve vitest `exclude` ile kapatıldı. Yine de çarparsa: `find . -name '._*' -delete`.

---

## 2026-09-22 — Yedekleme buluta değil, kullanıcının kendi Drive'ına

### Fikir büyük okundu, küçüğü doğruydu

İstek "Supabase + Google hesabıyla bulut senkronizasyonu" diye geldi ve
ben bunu tam bir hesap sistemi olarak okudum: kullanıcı tablosu, misafir→
hesap göçü, iki cihaz arası çakışma çözümü, satır bazında "son yazan
kazanır". Buna göre beş başlıklı bir risk listesi çıkardım.

Kastedilen o değilmiş. İstenen şey WhatsApp'taki gibi: **Ayarlar'dan
"Yedekle" deyip Google hesabını seçmek, yedek kullanıcının kendi
Drive'ına gitmek.** Kayıt yok, hesap yok, sürekli senkron yok.

Fark küçük görünüyor ama analizin dördünü buharlaştırıyor:

| Endişe | Tam senkronda | Kendi Drive'ına yedekte |
|---|---|---|
| Çakışma çözümü | Gerekli (`guncellendi` damgası şart) | Yok — yedek bir anlık görüntü |
| Misafir→hesap göçü | Kural yazılmalı | Yok |
| Kullanıcı tablosu + RLS | Gerekli | Yok |
| Yasal metinler | Baştan yazılır | **Değişmiyor** |

Son satır en önemlisi. `public/gizlilik.html` birinci paragrafta
"yalnızca kendi cihazında durur; **bize hiç ulaşmaz**" diyor. Tam senkron
bunu yalan yapıyordu. Kendi Drive'ına yedekte veri bize değil kullanıcının
kendi hesabına gidiyor — cümle doğru kalıyor, e-posta toplamıyoruz, Play
Veri Güvenliği beyanı olduğu gibi kalıyor.

### Aşama 1: paylaş menüsü, hiç OAuth yok

Karar: önce OAuth'suz olanı yapmak, "sonra gelişecek" diye not düşmek.

Yedek dosyası zaten üretiliyor (Ayarlar → Yedek al). Tek eklenen şey onu
Android'in paylaş menüsüne vermek; kullanıcı oradan "Drive'a kaydet"i
seçiyor. Geri yükleme de dosya seçiciyle.

Bunun bedeli: Google'a tek bir OAuth isteği gitmiyor, doğrulama süreci
yok, SHA-1 yok, keystore bağımlılığı yok, Play beyanı değişmiyor. Kimlik
doğrulamayı **işletim sistemi** yapıyor, biz değil. Maliyet ~1 gün.

Karşılığında kaybedilen tek şey otomatiklik: kullanıcı her seferinde elle
seçiyor. Gerçek entegrasyon (bkz. Sırada) bunu çözecek ama release
keystore'a bağlı olduğu için yayından önce yapılamaz — ters sırada
yapılırsa aynı iş iki kez yapılır.

## 2026-09-22 — APK derlemesi Java 21 istiyor

`./gradlew assembleDebug` şu hatayla düştü:

```
Cannot find a Java installation ... matching: {languageVersion=21}
```

Java 21 **kuruluydu** (`/opt/homebrew/opt/openjdk@21/...`) ama `JAVA_HOME`
17'yi gösteriyordu ve Gradle toolchain'i brew'un dizininde bulamadı.
Çözüm, derlemeye 21'i açıkça vermek:

```
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  ./gradlew assembleDebug
```

Kalıcı çözüm istenirse `JAVA_HOME`'u kabuk profilinde 21'e çekmek ya da
`android/gradle.properties` içine `org.gradle.java.home` yazmak. İkincisi
depoya girer ve başka makinede yanlış yolu gösterir; o yüzden yapılmadı.

## 2026-09-22 — Yedek paylaş menüsüne bağlandı (Drive, Aşama 1)

Aşama 1 yapıldı: yedek dosyası artık işletim sisteminin paylaş menüsüne
gidiyor, kullanıcı oradan Drive'ı seçiyor. Tek bir OAuth isteği yok.

### Plan "~1 gün, hiç eklenti yok" diyordu — değilmiş

Aşama 1 tasarlanırken varsayım şuydu: dosya zaten üretiliyor, tek eklenen
şey `navigator.share`. Koda bakınca varsayım düştü ve sebebi **daha önce bir
kez çarptığımız duvarın aynısıydı**.

Android System WebView `navigator.share`'i uygulamıyor — tıpkı
`speechSynthesis`i uygulamadığı gibi (bkz. *APK'da ses yoktu*). Üstelik
`a.download` da orada çalışmıyor. Yani APK'da "Yedekle" düğmesi **hiçbir şey
yapmayan bir düğme** olacaktı; Android Chrome'da (PWA kurulumu) ise
çalışacaktı. Sessiz kalite hatalarının tam da kaçınılmak istenen türü.

Çözüm `speech.ts` ile aynı desen: üç durumlu bir geçit.

```
native — Capacitor kabuğu: önbelleğe yaz, URI'yi paylaş menüsüne ver
web    — tarayıcının kendi navigator.share'i
indir  — klasik a.download (masaüstü)
```

`@capacitor/share` + `@capacitor/filesystem`, ikisi de **dinamik `import`**
ile — web paketine giren bayt sayısı sıfır, ayrı parça olarak yalnızca native
kabukta iniyor. Ana paket 506,4 → 507,6 KB; o 1,2 KB geçidin kendi kodu.

### Neden iki dosya tek kapıdan geçiyor

`share.ts` içinde `paylas()` diye özel bir yardımcı vardı ve **aynı kusuru
taşıyordu**: kanca panosu da APK'da paylaşılamazdı. İki ayrı düzeltme yazmak
yerine `dosya.ts` tek kapı oldu; `share.ts` artık onu çağırıyor.

Kanca panosunun APK'da çalışması bu turda istenmemişti — bedava geldi, çünkü
düzeltilen şey paylaşımın kendisi değil, **dosyayı dışarı verme yolu**.

### Önbellek dizini, belgeler değil

Native yol dosyayı `Directory.Cache`'e yazıyor. Bu dosya bir **çıktı**,
saklanacak veri değil: kullanıcı Drive'a kopyaladıktan sonra işletim sistemi
onbelleği temizleyebilir. `Documents` seçilseydi her yedekleme cihazda kalıcı
bir çöp bırakırdı.

### İptal iki dilde geliyor

Web tarafı `AbortError` atıyor, Capacitor'ın Share eklentisi ise platforma
göre değişen bir **metin** ("Share canceled" / "cancelled"). İkisi de
yakalanmazsa vazgeçen kullanıcının dosyası bir de ayrıca inerdi — yani
"vazgeç" düğmesi dosya indirirdi.

### Arayüz metni yola göre değişiyor

Paylaş menüsü açılacaksa düğme **"Yedekle"**, dosya inecekse **"Yedek al"**.
Aynı düğmeye iki farklı şey yaptırıp tek isim vermek, ikisinden birinde yalan
söylemek olurdu.

### Kalan

Native taraf `npx cap add android` sırasında kendiliğinden kuruluyor (`add`
zaten `sync` çalıştırıyor), yani APK adımları değişmiyor. `android/` **zaten
duruyorsa** eklentiler girmez; o durumda `npx cap sync android` gerekir.

Paylaş menüsü **gerçek cihazda denenmedi** — telaffuz ve bildirim ikonuyla
aynı sırada bekliyor.

---

## 2026-09-22 — Play yayını: sürüm ve imza

APK'ya kadar olan her şey **debug** derlemesiydi. Play'e çıkmak üç şeyi
değiştiriyor ve üçü de `android/` depoda tutulmadığı için ayrı bir adım
gerektiriyor.

### versionCode her derlemede 1'e dönüyordu

`cap add android` üretilen `build.gradle`'a her seferinde aynı şeyi yazıyor:

```
versionCode 1
versionName "1.0"
```

Play ise her yüklemede versionCode'un **artmasını** şart koşuyor. İlk yükleme
geçer, ikinci güncellemede yine 1 üretilir ve Play reddeder. *"android/
tutulmaz"* kararı tek başına Play'e çıkmaya yetmiyor.

`tools/android-release.mjs` eksik parçayı kapatıyor: sürümü `package.json`'dan
alıp enjekte ediyor.

**Neden `package.json`.** Sürüm zaten tek kaynaktan geliyor — Ayarlar ekranı
`__APP_VERSION__` ile, ölçüm kayıtları `surum` sütunuyla oradan besleniyor.
Android'in ayrı bir sayı taşıması, kullanıcının ekranda gördüğü sürüm ile
Play'deki sürümün sessizce ayrışması demekti.

**Kod şeması:** `major*10000 + minor*100 + patch` — `1.2.3` → `10203`.
Yalnızca minor ve patch 100'ün altında kaldıkça monoton artıyor; aşılırsa
sessizce çakışırdı, o yüzden betik açıktan kontrol edip patlıyor. Play daha
küçük bir versionCode'u kabul etmiyor ve **geri dönüş yok**.

### İmza bilgileri depoya girmiyor

Aynı betik `signingConfigs.release` bloğunu da enjekte ediyor; değerleri
`android-imza.properties`ten okuyor. O dosya ve `*.jks` `.gitignore`'da.

Dosya yoksa blok yine yazılıyor ama boş kalıyor: debug derlemesi çalışmaya
devam eder, release derlemesi *"imzasız"* diye düşer. Sessizce imzasız bir
paket üretmektense açıkça patlaması iyi.

> **Keystore kaybolursa uygulama bir daha güncellenemez.** Play aynı imzayı
> şart koşuyor ve kurtarma yolu yok. Dosyanın ve parolanın yedeği depoda
> değil, ayrı bir yerde durmalı.

### Play APK değil AAB istiyor

Yeni uygulamalarda `.aab` zorunlu:

```
cd android && ./gradlew bundleRelease     # Play'e yüklenecek
cd android && ./gradlew assembleRelease   # kendi dağıtımın için imzalı APK
```

İkisi de aynı keystore'la imzalanıyor.

### İmzasız paket sessizce üretiliyordu — iki tur sürdü

İlk yazılışta `signingConfig signingConfigs.release` **koşulsuz** bağlıydı ve
imza bloğu keystore yokken boş kalıyordu. `bundleRelease` şunu verdi:

```
Execution failed for task ':app:signReleaseBundle'.
> java.lang.NullPointerException (no error message)
```

1 dakika 17 saniye derledikten sonra, eksik olanın ne olduğunu söylemeyen bir
NPE. Bağlama koşullu yapıldı — ama tek başına bu da yetmiyordu: dosya yokken
bu sefer **imzasız bir AAB sessizce üretiliyor** ve bu ancak Play'e yükleyip
reddedilince anlaşılıyor. Sessiz bir başarı, okunur bir hatadan kötü.

Çözüm `gradle.taskGraph.whenReady`: görev grafiği hazır olur olmaz bakıyor,
derlemeye hiç başlamadan **18 saniyede** düşüyor ve hangi dosyanın eksik
olduğunu satır satır yazıyor. Debug derlemesi etkilenmiyor.

> Kaçış tuzağı: hata metni önce bir JS şablon dizgisinden, sonra Groovy'den
> geçiyor. `
` ikisinde de çözülüp dizgiyi ikiye bölüyor ve `build.gradle`
> hiç derlenmiyordu — **debug dahil her şey** kırılmıştı. Metin Groovy'nin üç
> tırnaklı dizgisinde, kaçışsız.

### İmza dosyası BOM'la yazılınca Gradle "null" diyor

İlk imzalı derleme şununla düştü:

```
A problem occurred evaluating project ':app'.
> Cannot convert 'null' to File.
```

Sebep `android-imza.properties`in **UTF-8 BOM**'uyla yazılmış olmasıydı.
Java'nın `Properties.load`u dosyayı ISO-8859-1 okuyor ve BOM baytlarını
(`EF BB BF`) **ilk anahtarın adına** yapıştırıyor: `storeFile` değil
`﻿storeFile`. Değer null kalıyor, Gradle da BOM'dan hiç söz etmeden
"null" diyor.

Windows'ta tuzağa düşmek **varsayılan davranış**: PowerShell 5.1'de
`Set-Content -Encoding utf8` tam da BOM'lu yazıyor. `android-release.mjs`
artık dosyanın başına bakıp BOM'u sessizce temizliyor.

### Üretilen paketler doğrulandı

```
bundleRelease + assembleRelease → BUILD SUCCESSFUL (38 sn)
app-release.aab  5,35 MB   jarsigner: "jar verified"
app-release.apk  5,48 MB   apksigner: Verifies (v2 scheme)
```

Debug APK 6,5 MB'tı; release'in daha küçük olması beklenen (debug simgeleri
ve test altyapısı yok).

`v1 scheme: false` bilerek — JAR imzası yalnızca API 24 altı için gerekiyor,
bizim `minSdk` zaten 24.

**İmza sertifikasının SHA-1'i:**

```
6a:37:b9:61:aa:27:bb:60:c5:89:1a:3b:99:3c:40:5c:b3:7b:40:14
```

Bu değer Faz 2'de (gerçek Drive entegrasyonu) OAuth istemcisi için
gerekecek — notlarda *"release keystore'un SHA-1'i"* diye geçen şey bu.
Artık var.

### sdkmanager kaldırılmış

`sdkmanager --licenses` ve `sdkmanager "platforms;android-36"` artık uyarı
basıp **boş dönüyor**: Google yerine `android` CLI'ını koymuş.

```
android sdk install "platforms;android-36"
android sdk install "build-tools;36.0.0"
```

Lisans onayı da ayrı bir adım değil, kurulumun içinde. Eski komut hata
vermeden hiçbir şey yapmadığı için fark edilmesi zor.

### Windows — doğrulandı

- **JDK 21** (Microsoft OpenJDK 21.0.12), `JAVA_HOME` makine düzeyinde
- **Android SDK**: cmdline-tools + platform-36 + build-tools 36.0.0 +
  platform-tools, `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`, ~426 MB
- `./gradlew` yerine `gradlew.bat`
- exFAT'e özgü `buildDirectory` bloğu **gerekmiyor** — o `._` gölgeleri
  macOS'un sorunuydu

Capacitor 8'in istediği: `compileSdk 36`, `minSdk 24`, AGP 8.13.

`assembleDebug` **BUILD SUCCESSFUL**, APK 6,5 MB. Paket içi doğrulandı
(`aapt2 dump badging`): `com.hafizada.ingilizce`, versionCode **10000**,
versionName **1.0.0**, minSdk 24, targetSdk 36.

Derleme sırasında `SDK XML version 4 ... only understands up to 3` uyarısı
çıkıyor; AGP ile SDK araçlarının farklı zamanlarda çıkmasından, zararsız.

> Tuzak: `npm run android:release | Select-Object -First 4` betiği **erken
> öldürüyor** — PowerShell boru hattını kapatıyor ve node dosyayı yazmadan
> ölüyor. Çıktı normal göründüğü için fark edilmiyor; `versionCode 1` kalıyor.

---

## Sırada

Kapsam kararı gereği sıra **veriden sonra** açılıyor: **100 kartlık** set
yayına çıkacak, D1/D7 ölçülecek, kalan işler ondan sonra sıralanacak.
*(Kapsam 26'ydı; görseller üretilince 100'e çıktı.)*

### Nerede duruyoruz (23 Eylül 2026)

**Hazır olanlar.** Uygulama 1.0.0; 236 test, tip denetimi ve derleme temiz.
Ölçüm tablosu Supabase'de kurulu ve doğrulandı (RLS yalnızca INSERT,
`pg_cron` temizliği aktif). Android araç zinciri Windows'ta kuruldu ve
çalıştığı **derlenerek** kanıtlandı: imzalı `.aab` (5,35 MB) ve `.apk`
(5,48 MB) üretildi, imzaları doğrulandı. Keystore üretildi ve yedeklendi.

**Adımların tamamı `YAYIN.md`'de.** Sıfırdan makine kurulumu, telefonda
deneme, Pages ve Play adımları orada; burada tekrarlanmıyor.

**Sırada bekleyen ilk üç iş:**

1. **Cihaz turu** — telaffuz · bildirim ikonu · yedeklemenin paylaş menüsü.
   Üçü de yalnızca gerçek telefonda görülebilir, üçü de hiç denenmedi.
   İmzalı APK hazır duruyor, `adb install` ile kurulabilir.
2. **Web yayını** — Actions'a iki secret (`VITE_SUPABASE_*`) ve Pages
   ayarı. Play'in istediği gizlilik adresi buradan geliyor, yani **Play'den
   önce.** Secret'lar konmazsa site çıkar ama ölçüm sessizce kapalı kalır.
3. **Play Console** — hesap açılışı (kimlik doğrulama günler sürüyor) ve
   mağaza varlıkları: metinler, 512×512 ikon, 1024×500 grafik, ekran
   görüntüleri, Veri Güvenliği formu (cevapları hazır, bkz. yukarısı).

**Karar bekleyen:** depo herkese açık. Sır sızmıyor (kontrol edildi) ama
`NOTLAR.md` görsel üretim reçetesini ve gelir modelini taşıyor. Pages
ücretsiz planda yalnızca açık depoda çalışıyor, yani kapatmanın bedeli var.

### Veriden sonra açılacaklar

4. **Kanca aday üretim hattı** — havuzu ~600'e çıkaran tek kaldıraç.
   CMU fonetik sözlüğü + Türkçe kelime listesi + fonem mesafesi → sıralı aday
   listesi. "Haa testi" insanda kalır; moat orası.
5. Kalan 200 kartın görseli.
6. **Drive'a yedek — ikinci aşama.** Aşama 1 (paylaş menüsü) YAPILDI;
   sırada gerçek Google Drive entegrasyonu: "Yedekle" → hesap seç → bitti, ve
   otomatik yedek. OAuth client gerekiyor; **release keystore'un SHA-1'i
   artık var** (bkz. "Play yayını: sürüm ve imza"), yani tek engel kalmadı —
   yine de yayından sonraya bırakıldı, sıra bozulmasın.
7. Hesap + bulut senkronu — yalnızca retention verisi gerektirirse. Drive
   yedeği bunun büyük kısmını zaten çözüyorsa hiç gerekmeyebilir.
