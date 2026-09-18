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
| `npm test` | Çekirdek mantık testleri (154 test) |
| `npm run import:cards` | `mnemonik-aday-havuzu.xlsx` → `content/cards.json` |
| `npm run icons` | `brand/kilit-kaynak.png` → tüm ikon ve marka türevleri |

Yeni bilgisayarda: repoyu klonla, `npm install`, `npm run dev`. Başka kurulum yok — backend, API anahtarı, veritabanı yok.

---

## Sistem

### İlk karşılaşma

Üç adım, ~30 saniye, sonunda doğrudan ilk derse:

| | | |
|---|---|---|
| 1 | **Vaat** | "Ezberlemeyeceksin." + `snake ≈ sinek` kartı |
| 2 | **Kendin dene** | Kart kaybolur: *"snake ne demekti?"* → 4 şık → **"Hiç ezberlemedin. Kanca tuttu."** |
| 3 | **Günlük hedef** | 5 / 10 / 15 |

**2. adım asıl olan.** Önceki sürümde kart yalnızca *gösteriliyordu*; kullanıcı
"güzelmiş" deyip geçiyor ama kancanın işe yaradığına **inanmıyordu**, çünkü
kendi denemedi. Şimdi 15 saniyede kendi hafızasının çalıştığını görüyor.
Anlatmıyoruz, yaşatıyoruz. (Yanlış bilirse suçlayıcı değil: *"Olsun — kanca
birkaç tekrarda oturuyor."*)

3. adımdan sonra ana ekrana değil **doğrudan ilk derse** girilir: bir karar daha
eksilir, kullanıcı uygulamayı açtıktan ~40 saniye sonra ilk beş kelimesini
öğrenmiş olur.

**Eklenmeyenler ve nedeni:** isim sorma (hesap yok, karşılığı olmayan sürtünme) ·
seviye testi (havuz sıklık sırasında, test edilecek seviye yok) · çok ekranlı
tanıtım turu (kimse okumuyor; 2. adım turun yapamayacağını yapıyor) · ses izni
ekranı (telaffuz 3. basamakta başlıyor, ilk gün gerekmiyor).

### Açılış ekranı ve logo

Uygulama açılırken IndexedDB okunana kadar bir an boş ekran kalıyordu. O boşluk
artık markanın yeri: kare işaret, isim, ve **her açılışta değişen bir kanca
çifti** — bir saniyelik bekleme, yöntemin ne olduğunu söyleyen bir cümleye
dönüşüyor.

**Logo yalnızca orada.** Uygulama içi başlıkta yatay kilit (işaret + isim) 28px
yüksekliğe sıkışınca yazı ~10px'e düşüyor ve telefonda okunmuyor, işaret de
eziliyor — kilitler ~40px altında çalışmaz. Üstelik uygulamanın içindeyken
hangi uygulamada olduğunu kimse merak etmiyor. Başlıkta isim **metin olarak**
duruyor: her boyutta net, uygulamanın kendi yazı karakterinde.

### Tek akış

Ana ekranda tek düğme var: **Başla**. Ders üç bölüm hâlinde arka arkaya gelir,
kullanıcı hiçbir yerde "hangisine basayım" diye düşünmez.

| | Bölüm | Ne olur |
|---|---|---|
| 1 | **Yeni kelimeler** | 5 kart, yavaş, tam ekran. Görsel + kelime + kanca + cümle. Soru yok, tek "Devam" |
| 2 | **Öğrenme testi** | Aynı 5 kelime, merdivenin **altı basamağı da**, sırayla |
| 3 | **Tekrar** | Vadesi gelen eski kartlar, her biri kendi basamağında |

Önceki sürümde "Tanış" ve "Tekrarla" iki ayrı düğmeydi; deste testi üçüncü bir
giriş noktasıydı. Üçü tek akışa indi.

**Ders bütündür.** Yeni kelimeler önce bellekte tutulur, veritabanına ancak
öğrenme testi bitince topluca yazılır. Önce her kart görülür görülmez
yazılıyordu; yarıda çıkan kullanıcının kartları "tanışıldı" sayılıp öğrenme
testini hiç görmüyor, ertesi gün 1. basamakta tekrar olarak geri geliyordu.

Yeni kelimeler henüz kalıcı değilken çıkmak ciddi bir kayıp, o yüzden geri
tuşu doğrudan çıkarmaz: ne kaybedileceğini açıkça yazan bir uyarı gelir
(*"Bu dersin 5 yeni kelimesi henüz kaydedilmedi… ders bir dahakine baştan
başlar."*). Tarayıcının `confirm()` kutusu kullanılmıyor — PWA'da bloklayan
sistem diyaloğu hem çirkin hem akışı donduruyor. Tekrar bölümünde uyarı yok;
oradaki cevaplar zaten tek tek kaydediliyor.

### Egzersiz merdiveni

İki eksen (destek seviyesi + aşama) yerine **tek merdiven**. Her basamak hem
sorunun tipini hem ekrandaki yardımı belirler.

| # | Egzersiz | Soru | Kanca |
|---|---|---|---|
| 1 | **Eşleştirme** | 5 kelime ↔ 5 karşılık | ekranda |
| 2 | **Çoktan seçmeli** | `sell` → 4 Türkçe şık | ekranda |
| 3 | **Ters seçmeli** | `satmak` → 4 İngilizce şık | ipucu |
| 4 | **Harf dizme** | `satmak` → `l·e·s·l` | ipucu |
| 5 | **Yazma** | `satmak` → yaz | ipucu |
| 6 | **Dinleme** | 🔊 (yazı yok) → yaz | ipucu |

1–2 tanıma, 3–4 geçiş, 5–6 üretim. `recall` tanımadır ve en zayıf yöndür —
`snake` görüp "yılan" demek kolay, "yılan" deyip `snake` çıkarmak zordur.
Kullanılabilir kelime hazinesi üretim tarafında oluşur, o yüzden merdiven
tanımada bitmez.

Geçiş kuralı üç durumlu:

- **yanlış** → bir basamak geri
- **kancayla doğru** → yerinde kalır — ipucu kullanmak başarısızlık değil,
  aracı kullanmaktır. Doğru cevabı geri atmak kullanıcıyı ipucundan kaçınmaya,
  sonra tahmin etmeye iter
- **yardımsız doğru** → bir basamak ileri

*Eşleştirme bir grup egzersizi: 5'erli sorulur, tek kartla sorulamaz. Gruptan
tek kart artarsa çoktan seçmeliye kaydırılır.*

*Eşleştirmede yanlış eşleme **serbest ve görünür**: dokunulan iki karo da kısaca
kırmızıya döner ve her iki kelime "ilk denemede bilinmedi" sayılır. Önce yalnızca
Türkçe karo kızarıyor, İngilizce olan sessizce seçimi bırakıyordu — hata
yapıldığı anlaşılmıyordu.*

*Harf dizmede **yanlış sıra kurulamaz**: yalnızca sıradaki doğru harf yerleşir,
yanlışa dokunmak karoyu kısaca kırmızıya çevirir ve geçer. Ekranda hiçbir zaman
yanlış yazılmış bir kelime durmaz. Egzersiz bedavaya dönmesin diye yanlış
dokunuşlar sayılır: hatasız dizen merdivende ilerler, deneyerek bulan yerinde
kalır — kanca ipucuna basmakla aynı kural.*

### Öğrenme testi

Tanışmanın hemen ardından, aynı 5 kelime — ve merdivenin **altı basamağının
hepsi, sırayla**: eşleştirme → çoktan seçmeli → ters seçmeli → harf dizme →
yazma → dinleme. Kelime taze olduğu için en üst basamaklar bile yapılabilir;
amaç yeni kurulan bağı aynı oturumda her yönden bir kez kullandırmak.
(Bir ara yalnızca ilk iki basamak koşuluyordu ve ders bir anda bitiyordu.)

Sıra korunur: `Runner`'a `sirali` verilir, karıştırma kapanır. Tekrar
bölümünde tersi doğru — orada kartlar birbirinden bağımsız, karışık gelir.

Merdiveni yine de **oynatmaz** — kelime hâlâ kısa süreli hafızada, buradan
gelen başarı "öğrenildi" demek değil. İki iş yapar: FSRS'i gerçek bir cevapla
başlatmak ve **kancanın ilk denemede tutup tutmadığını ölçmek**.

Önceki sürümde kullanıcıya *"Kanca tuttu mu?"* diye soruluyor ve cevabı ilk
FSRS notu oluyordu. Bu bir **beyandı**. Artık sorulmuyor, ölçülüyor.

### Günlük hedef

Hedef **gerçek bir sınır**: Ayarlar'dan 5 / 10 / 15 seçilir, **15 aşılamaz**.
Bir ara tavan yoktu ve isteyen istediği kadar ilerliyordu; sonucu tekrar
borcunun sessizce şişmesiydi. Günde 15'in üstü, ertesi gün kaldırılamayan bir
tekrar yığını demek — sınır pedagojik, keyfî değil.

Hedef dolunca ana ekran **"Hızlı tekrar"**a döner ve **gün boyunca orada kalır**:
yeni kelime verilmez ama o günün kelimeleri istendiği kadar pekiştirilebilir.
Duvar değil, günün kapanışı.

Bir ara "bugünlük tamam mı" kontrolü hedef kontrolünden önce geliyordu; hızlı
tekrar bitince vadesi gelen kart kalmadığı için ekran *"Bugünlük tamam ·
Sıradaki tekrar 1 dakika sonra"*ya düşüyordu. Hedefi dolmuş bir günde
söylenecek tek şey var: istediğin kadar pekiştir.

Hızlı tekrarda **eşleştirme sorulmaz** — 1. basamaktakiler çoktan seçmeli
gelir. Eşleştirme beş kartı bir arada gösterir ve doğru cevap ekranda durur;
yeni kelimeyle ilk temas için doğru, aynı gün üçüncü kez görülen kelime için
fazla kolay.

Ana ekranda **"X / 100 kelime" yüzdesi yok**: havuz büyüdükçe payda değişecek
ve yüzde bir şey ifade etmiyor. Yerine bugünün hedefi gösteriliyor —
kullanıcının gerçekten etkileyebildiği sayı bu.

### Egzersiz bölümü

Öğrenilmiş kelimeler üzerinde serbest pratik. Kapsam ve egzersiz tipi seçilir.

Kelime listesi burada **değil**: bir ara bu ekranın dibindeydi ve her açılışta
uzun bir listeyi kaydırmak gerekiyordu. Artık İlerleme'nin en üstündeki büyük
**📖 Kelimeler** düğmesinden açılan kendi ekranı — arama ve basamak filtreleri
(Tanıma 1–2 · Geçiş 3–4 · Üretim 5–6 · Tüm havuz) orada.

| Kapsam | | Sınır |
|---|---|---|
| ☀️ **Bugün** | bugün öğrendiklerim — tam satır, en üstte | **sınırsız** (gün kaç kelimeyse) |
| 🌙 Dün | dün öğrendiklerim | 10 |
| 🩹 Zorlandıklarım | en çok düştüklerim | 10 |
| 🕰️ Eski kelimeler | 7+ günlük, **rastgele** | 10 |
| ✋ **Seç** | kendin işaretle | **sınırsız** |

**"Tümü" yok.** Havuz 600'e çıkınca tek tuşla yüzlerce kelime başlatmak
kimsenin istediği şey değil; isteyen **Seç**'e girip istediği kadarını
işaretler.

Eski kelimeler **rastgele** seçilir. Hep en eskiden başlamak aynı kelimeleri
döndürüp durur; havuz büyüdükçe arkadaki yüzlerce kelime hiç görünmez.

Egzersiz tipi merdivenin altı basamağı, artı iki tane:
**🎲 Karışık** (her kelime kendi basamağında) ve **🃏 Kartlar** — kelimenin
kartını (görsel + kanca + cümle) soru sormadan yeniden gösterir. Aylar önce
öğrenilen bir kelimenin kancasını tazelemenin yolu bu.

**FSRS'e ve merdivene dokunmaz.** Sebebi önemli: egzersiz öğütüp duran bir
kullanıcı bütün kartları öne çeker ve aralıklı tekrarın tüm faydası yok olur.
Buradaki çalışma seriye ve ısı haritasına sayılır, kanca kalite sinyallerini
besler — ama kartın ne zaman geleceğini değiştirmez.

### Telaffuz

Ses kancası yöntemin motoru ama aynı zamanda borcu: `sell ≈ sel` kancası
kelimeyi hatırlatırken **yanlış telaffuzu da öğretiyor** (gerçekte /sɛl/).

Bu yüzden doğru ses, kanca ekrandan kalkarken devreye girer — 3. basamaktan
itibaren. 6. basamak (dinleme) onun sınavı: kelime yazılı hiç görünmeden,
sadece duyularak tanınmalı.

- Ses seçimi elenerek yapılır: macOS'ta `en-US` listesinin yarısı **şaka sesi**
  (Bahh meliyor, Boing zıplıyor, Zarvox robot) ve alfabetik ilk sıra "Albert".
  Tercih listesi tutmazsa şaka sesleri elenir — `pickVoice` saf fonksiyonu ve
  testleri bunu koruyor.
- `speechSynthesis`, `en-US`, hız 0.9. Ses dosyası, backend, API anahtarı yok.

### İçerik kuralları

- v1 seti: 100 "Tutan" kart. `Kurtarılabilir` sınıfı 2. set için bekliyor.
- Sıralama sıklık sırası. **Tek istisna:** kancası kelimenin aynısı olanlar
  (`far ≈ far`) ilk beşe giremez — ilk kartlar yöntemin ne yaptığını göstermeli.
- Soyut kelimeler bilinçli elendi; keyword yöntemi orada zayıflıyor.
- Türkçe cevaplarda **şapkasız yazım kabul edilir** ("kotu" = "kötü"). Katlamanın
  yeni belirsizlik yaratmadığı doğrulandı.
- Çoktan seçmeli çeldiriciler **tüm havuzdan** gelir; aynı metni taşıyan kart
  (`turn`/`spin` = "dönmek") çeldirici olamaz — iki şıkkın da doğru olduğu bir
  soru sorulamaz.

### Puanlama

İlerleme sekmesinde iki yüzde var ve ikisi ayrı soruya cevap veriyor.

**Başarı** — verdiğin cevapların ne kadarı doğru. Gün / Hafta / Ay penceresi
tek dokunuşla değişir. Doğru–yanlış artık **gün bazında** kaydediliyor
(`days[gün] = { r, i, d, y }`); önce yalnızca kaç kart çalışıldığı tutuluyordu,
"ne kadarı doğruydu" sorusunun cevabı hiçbir yerde yoktu.

**Ustalık** — kelimelerin merdivende ne kadar yukarı çıktığı. 1. basamak %0,
6. basamak %100, ortalaması alınır. "Kaç kelime biliyorum" değil, **"ne kadar
iyi biliyorum"**.

Altı basamağın dağılımı tek satırlık yığın çubukta, kullanıcının anladığı üç
grupta: **Tanıma** (görünce anlıyorum) · **Geçiş** (seçebiliyorum) ·
**Üretim** (yazabiliyorum).

> Bir ara burada "Nerede duruyorsun" diye altı satır sayı vardı
> (`1. Eşleştirme: 7`…). Bu bir **dağılım**dı, bir değerlendirme değil —
> "iyi gidiyor muyum?" sorusuna cevap vermiyordu.

**Ders bitişinde** aynı ölçüm seansın kendisi için gösterilir, ve yanında
**"4 kelime bir basamak ilerledi"** satırı durur. İkincisi daha önemli: doğru
cevap vermek ilerlemek demek değil, ilerlemek için **yardımsız** doğru gerekiyor.
Kanca ipucuna basıp doğru bilen kullanıcı %100 alır ama hiçbir kelime ilerlemez
— bunu görmesi lazım, yoksa yüzde yanıltır. (Sıfırsa satır hiç gösterilmez.)

Egzersiz sekmesindeki serbest pratik de başarıya sayılır — tekrar zamanlamasını
bozmaz ama "cevaplarımın kaçı doğru" sorusunun cevabı orada da gerçek.

### Kalite ölçümü

Uygulama aynı zamanda bir içerik ölçüm aracı. Ölçümün **nerede** yapıldığı
önemli: 1–2. basamaklarda kanca zaten ekranda, oradan gelen "doğru" kancanın
işe yarayıp yaramadığını söylemez. Gerçek sınav 3'te başlar.

| Sinyal | Nerede | Ne söyler |
|---|---|---|
| `firstCheckOk` | Öğrenme testi | Kanca ilk denemede tuttu mu — **beyan değil** |
| `unaidedOk` | Adım ≥ 3 | Kanca ekrandan kalkınca anlamı getirdi mi — **birinci sayı** |
| `produceOk` | Adım 5 | İlk yazma denemesi tuttu mu |
| `hookRevealCount` | Adım ≥ 3 | Kaç kez ipucuna dönüldü |
| `failCount` | Adım ≥ 3 | Kancasız kaç kez düşüldü |

İlerleme sekmesindeki panel bunları birleştirip **"Gözden geçirilecek kancalar"**
listesini isimle çıkarır. Oranların yanında kaç karta dayandığı da yazar;
2 kartlık %100 bir şey söylemez.

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
  content.ts           Kart havuzu ve sabitler
  scheduler.ts         FSRS + merdiven geçişleri + kuyruklar
  exercise.ts          Egzersiz tanımları, şıklar, harf dizme (saf)
  dates.ts             Seri, seri koruma, tarih mantığı (saf)
  score.ts             Başarı ve ustalık yüzdeleri (saf)
  db.ts                Dexie (IndexedDB) — ilerleme cihazda
  share.ts             Paylaşım görselleri (canvas)
  components/          Match, Choice, Scramble, TypeAnswer, Runner, CardFace
  screens/             Welcome, Home, Lesson, Practice, Progress,
                       WordList, Settings, SessionDone
tools/
  import-xlsx.mjs      Tablo → JSON + doğrulama raporu
  make-icons.mjs       SVG → PNG ikonlar
```

**Local-first.** İlerleme tamamen tarayıcıda (IndexedDB), backend yok. Açılışta
`navigator.storage.persist()` çağrılır — yoksa Safari 7 gün kullanılmayan veriyi
koşulsuz siliyor. İlerleme sekmesindeki **Yedek al / Geri yükle** ile taşınır.

**Teknoloji:** Vite · React · TypeScript · Tailwind v4 · Dexie · ts-fsrs (FSRS-5) · vite-plugin-pwa. Yazı karakterleri (**Nunito** + Plus Jakarta Sans) yerelde, çevrimdışı çalışır.

> Başlık fontu Fredoka'ydı; fontun kendisinde **ğ, Ğ, İ, Ş, ş glifleri yok**
> (toplam 320 glif). Ayrıca `latin` @font-face'lerinde `unicode-range`
> eksikti — aralığı olmayan bir yüz tüm Unicode'u kapsadığını iddia edip
> `latin-ext`'i eziyor, o harfler onları içermeyen dosyaya yönlenip sistem
> fontuna düşüyordu. İkisi de düzeltildi; her @font-face'in aralığı var.

---

## Durum

**Bitti:** Logo + marka kilidi · tek akışlı ders · altı basamaklı egzersiz merdiveni · öğrenme testi (beyan yerine ölçüm) · serbest egzersiz bölümü · telaffuz · hafif seri + seri koruma · başarı ve ustalık puanları · Kelimelerim + arama + kanca panosu · kalite ölçümü ve zayıf kanca listesi · yedekleme · PWA (kurulabilir, çevrimdışı).

**Yapılmadı ve nedeni:**

- **Kart görselleri** — 100'ün 1'i hazır (`snake`). Görseli olmayan kartta brief metni duruyor, akış eksiksiz çalışıyor. Yeni görsel eklemek için tek iş: `src/assets/cards/<kart-id>.webp` — kod veya JSON düzenlemesi yok.
- **Hatırlatma bildirimi** — PWA'da kapalıyken bildirim göndermek sunucu gerektiriyor (Web Push). Backend'siz mümkün değil. Aynı sınır ana ekran widget'ı için de geçerli (o native istiyor).
- **Telaffuz kaydı** — tarayıcının ses sentezi kullanılıyor, kayıt kalitesinde değil. Yetmezse aynı arayüz önceden üretilmiş ses dosyalarına bağlanır; çağrı noktaları değişmez.

**Sırada:** kanca aday üretim hattı (havuzu ~600'e çıkarmak için) · kart görselleri · hesap + bulut senkronu (gerekirse).

---

## Kararlar (neden böyle)

- **Oyunlaştırma yok** (XP, lig, can, maskot). Duolingo'nun kendi sorunu "içi boş katılım"; ayırt edici yanımız mekanik değil kancanın kalitesi.
- **Ham tekrar borcu asla gösterilmez.** SRS'te bırakmanın bir numaralı sebebi "347 tekrar bekliyor" kaygısı. Sadece bugünün porsiyonu gösterilir.
- **Seri: ödül var, ceza yok.** Kırılınca suçlayıcı bildirim gelmez; tek günlük boşlukta koruma hakkı harcanır.
- **Günlük bütçe fren, duvar değil.** İsteyen "5 kelime daha" ile devam eder.
  Tekrar tarafında da aynı kapı açık: "Bugünlük tamam" ekranındaki **Yine de
  tekrar et** sırada bekleyen kartları öne alır. Kart erken sorulmuş olur; FSRS
  bunu geçen süreye göre hesapladığı için zamanlama bozulmaz, yalnızca o
  tekrarın hafızaya katkısı azalır. Çalışmak isteyen uygulamayı kapatmak
  zorunda kalmamalı.
- **Isı haritası yok.** 12 haftalık takvim kaldırıldı: serinin zaten söylediğini
  84 kareyle tekrar ediyordu, "ceza yok" ilkesine aykırı bir *kaçırılan günler
  defteri*ydi, telefon genişliğine sığmıyordu — ve en önemlisi *çalıştığını*
  gösteriyordu, *ne kadar iyi* çalıştığını değil. Düzenlilik bilgisi Başarı
  panelinde tek satıra indi: "Son 7 günde 3 gün çalıştın."
- **Sayıya Türkçe ek getirilmiyor.** "41'si / 6'sı / 3'ü / 7'sinde" — ekler
  sayının okunuşuna göre değişiyor ve sayıdan türetmek kırılgan. Onun yerine
  ek gerektirmeyen ifade: "41 doğru · 13 yanlış", "Son 7 günde 3 gün çalıştın."
- **Dört sekme: Öğren · Egzersiz · İlerleme · Ayarlar.** Ayarlar önce İlerleme'nin
  dibinde, grafiklerin arasındaydı — bir şeyi değiştirmek için önce istatistiklerden
  geçmek gerekiyordu. İlerleme artık saf profil.
- **Tek giriş noktası.** İncelediğimiz rakipte (Blarma, 5M indirme) akış tek yol:
  öğren → hemen test et → aralıklı tekrar geri getirsin. Çok giriş noktası
  kullanıcıyı her açılışta karar vermeye zorluyor.
- **Egzersiz bölümü ilerlemeyi değiştirmez.** Serbest pratik aralıklı tekrarı
  bozmamalı; yoksa çalışkan kullanıcı kendi zamanlamasını yok eder.
- **Arayüz kartın çerçevesi, kart kahraman.** 3D nesne/avatar bilinçli alınmadı — çerçeve bağırırsa resim kaybolur.
