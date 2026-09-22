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
| `npm run import:images` | `gorseller/<id>.png` → `src/assets/cards/<id>.webp` (4:3, 800×600) |
| `npm run import:images -- --brief` | Görseli olmayan kartların brief listesini `gorsel-brief.tsv` olarak döker |
| `npm run icons` | `brand/logo-isaret.svg` → tüm ikon ve marka türevleri |
| `npm run lockup` | işaret + isim → yazılı kilit ve profil görselleri |

Yeni bilgisayarda: repoyu klonla, `npm install`, `npm run dev`. Başka kurulum yok — backend, API anahtarı, veritabanı yok.

---

## Sistem

### İlk karşılaşma

Üç adım, ~30 saniye, sonunda ana ekranda bekleyen ilk ders:

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

3. adımdan sonra **ana ekrana** düşülür; ilk ders orada kendi kartı olarak
bekler (*"İlk dersin hazır · 5 kelime"*) ve başlatan kullanıcı olur.

> Bir süre buradan **doğrudan ilk derse** giriliyordu — bir karar eksiltmek
> için. Kötü tarafı: kullanıcı hazır olup olmadığı sorulmadan derse düşüyordu
> ve geri çıkmanın tek yolu *"ders yarıda kalacak"* uyarısıydı. Başlama kararı
> kullanıcıya geri verildi; ana ekran da boş değil, ilk ders orada duruyor.

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

**Aynı gün ikinci kez doğru bilmek aralığı uzatmaz.** Hızlı tekrar ve "Dersi
tekrar et" aynı kelimeyi gün içinde defalarca sorabiliyor; her doğru cevap
FSRS'e yazılsaydı çalışkan kullanıcı kendi zamanlamasını haftalar öteye atardı
— Egzersiz sekmesi için zaten geçerli olan kuralın aynısı. **Yanlış cevap her
zaman sayılır**: bilmediğin bir kelimenin aralığı uzamamalı. Kural yalnızca
mezun olmuş (Review) kartlar için; öğrenme adımındaki kart gün içinde birkaç
kez sorulmak üzere tasarlanmıştır.

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

### Ders içinde ritim: geçiş anı

Ders uzun bir düz akış: beş kelime × altı basamak = otuz soru. Bölge ve bölüm
sınırlarında kısa bir **geçiş anı** duruyor — ne kapandı, kaç doğru, ne
açılıyor.

**Kutlama değil, bilerek.** Kutlanacak iki an zaten var ve ikisi de nadir:
ders sonu ve setin bitmesi. Her aşamaya "Tebrikler" koymak o ikisini
düzleştirir. Üstelik 1-2. basamakta kanca ekranda duruyor, yani oradaki doğru
"kanca tuttu" demiyor — katılımı ödüllendirmek `beyan yerine ölçüm` ilkesinin
tersi olurdu.

Sayı üç, çünkü merdivenin üç bölgesi zaten Egzersiz'in renkleri ve
İlerleme'nin çubuklarıyla anlatılıyor; geçiş anı yeni kavram icat etmiyor:

| Basamak | Renk | Geçişte |
|---|---|---|
| 1–2 | mavi | **Tanıdın** → "Şimdi kanca ekrandan kalkıyor" |
| 3–4 | sarı | **Hatırladın** → "Şimdi kelimeyi baştan sen yazacaksın" |
| 5–6 | nane | **Ürettin** |

Bölgeler `exercise.ts` içindeki `BOLGELER`'de — modül saf, ikon ve renk **ad**
olarak taşınıyor. Motor (`Runner`) bir basamağın bittiğini dışarı vermiyor;
öğrenme testi bölge bölge koşturularak o sınır ücretsiz elde ediliyor.

### "Bunu biliyorum"

Yeni kelime kartında, üst barda — **"Devam"dan uzakta**, çünkü yan yana
olsalardı kazara basılır ve basan kişi kelimeyi kaybettiğini fark etmezdi.

Basınca kelime kenara ayrılır ve **yerine sıradaki kelime kayar**: ders 5
kart kalır, günlük hedef "5 kelime **öğrendim**" anlamını korur.

Kelime `bilinen` işaretiyle kaydedilir ve **`introduced: false`** olur —
uygulamada öğrenilmedi, kanca hiç gösterilmedi, hiçbir şey ölçülmedi.
Bunun güzel yanı: `introduced` süzen her yer onu **kendiliğinden** eliyor.

| | |
|---|---|
| Tekrar kuyruğu · kapsamlar | girmez |
| Başarı % · kalıcılık · "Neler yapabildin" | girmez |
| Günlük hedef sayacı | girmez *(kaymanın şartı)* |
| Set bitişi | girmez — hepsine "biliyorum" diyen kutlama görmez |
| Yeni kelime havuzu | bir daha sunulmaz |

**İki katmanlı geri alma:** basar basmaz ekranda "Geri al"; kaçırılsa bile
Kelimeler → **Bildiklerim**'den "Geri ekle". Geri eklenince kayıt **silinir**
ve kelime yeni kelime havuzuna kendi sıklık sırasındaki yerine döner —
"öğrenilmiş ama tekrarı gelmiş" gibi davranmak yalan olurdu.

### Kelimeler ekranı üç bölüm

**Öğrendiklerim · Tüm set · Bildiklerim.** Bir süre merdiven bölgeleri de
sekmeydi ("Tanıma (1–2)", "Geçiş (3–4)", "Üretim (5–6)"); kalktılar. İkisi
birden sorundu: basamak numarası kullanıcıya hiç öğretilmiyor, ve aynı
bilgiyi İlerleme'deki "Neler yapabildin" çubukları zaten anlatıyor.

### Öğrenme testi

Tanışmanın hemen ardından, aynı 5 kelime — ve merdivenin **altı basamağının
hepsi, sırayla**: eşleştirme → çoktan seçmeli → ters seçmeli → harf dizme →
yazma → dinleme. Kelime taze olduğu için en üst basamaklar bile yapılabilir;
amaç yeni kurulan bağı aynı oturumda her yönden bir kez kullandırmak.
(Bir ara yalnızca ilk iki basamak koşuluyordu ve ders bir anda bitiyordu.)

Sıra korunur: `Runner`'a `sirali` verilir, karıştırma kapanır. Tekrar
bölümünde tersi doğru — orada kartlar birbirinden bağımsız, karışık gelir.

Merdiveni **sırasında** oynatmaz — kelime hâlâ kısa süreli hafızada, buradan
gelen başarı "öğrenildi" demek değil.

**FSRS'e tek not verilir, o da testin sonunda.** Altı sorunun her biri ayrı bir
not olarak yazılıyordu ve kelime iki dakika içinde altı kez "hatırlanmış"
sayılıyordu:

| | Altı not | Tek not |
|---|---|---|
| 1 ders sonrası | reps 6 · stabilite 2,3 gün | reps 1 · 2,3 gün |
| 1 tekrar sonrası | **13,9 gün** → vade 12–15 gün | **7,3 gün** |
| Ortalama sıradaki vade | 7 gün (max 15) | 3,2 gün (max 7) |
| Tekrarlar ne zaman başlar | **4. gün** | **2. gün** |

Ölçüm altı günlük gerçek bir turda alındı. Aralıklı tekrarın vaadi buydu ve
çalışmıyordu: kelime daha ilk gün iki güne, ilk tekrardan sonra iki haftaya
fırlıyordu. Bu, kitaptaki *"cramming aralıkları şişirir"* hatası — FSRS her
notu **aralıklı** bir hatırlama sayar, oysa altısı da aynı oturumdaydı.
Anki'deki "öğrenme adımları → mezuniyet" düzeninin karşılığı: oturumun tamamı
tek bir not.

**2. basamağı (çoktan seçmeli) kancaya basmadan doğru** yapan kelime, test
biterken **bir basamak** kazanır (1 → 2). Tek basamak ve tanıma tarafında
kalıyor: 2. basamakta görsel ve kanca hâlâ ekranda, yani bu bir üretim iddiası
değil.

> Bir süre hiçbir basamak verilmiyordu ve sonucu şuydu: ilk gün hiçbir şey
> ilerlemiyordu. Kullanıcı testte kelimeyi baştan yazmış, dinleyip yazmış
> oluyor, ders sonunda yine *"0 kelime ilerledi"* görüyordu.
>
> Sonra ölçüt *"testin altı görevi de temiz"* oldu ve o da tutmadı: gerçek bir
> derste beş kelimenin beşinde de en az bir hata çıktı, **hiçbiri ilerlemedi**.
> Altı görev gittikçe zorlaşıyor; en üstteki dinlemeyi ilk gün tutturamamak
> tanımayı bilmediği anlamına gelmiyor. Aynı veriyle bugünkü ölçüt 5 kelimenin
> **4'ünü** ilerletiyor.

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

### Günün değişmesi

Ana ekran **günün değiştiğini fark eder**. Gün anahtarı tek bir yerde tutulur
(`today.ts`): sekmeye dönüşte, pencere odağında ve dakikada bir kontrol edilir,
haber **yalnızca gün gerçekten değişince** verilir — her tikte vermek bütün
ekranı dakika başı boşuna yeniden çizerdi.

> Önce bunu yapan hiçbir şey yoktu: `new Date()` sadece render anında
> okunuyordu, render ise ancak veritabanı değişince oluyordu. Uygulama açık
> dururken gece yarısı geçilince ekran dünün durumunda donuyordu — günlük
> hedefi dolduran bir günün ertesinde ana ekran hâlâ **"Hızlı tekrar"**
> diyordu.

O günün ilk girişinde ana ekranın kartı **"Yeni güne başla"** olur, altında
günün paketi (`5 yeni · 8 tekrar`). Bu bir **an**, sürekli bir etiket değil:
ilk ders bitince kart normal *"Bugünün dersi"*ne döner, yoksa "yeni gün" sözü
gün içinde tekrarlanıp anlamını yitirir. Havuz boşken aynı yer *"İlk dersin
hazır"* olur.

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

Kapsam birimi takvim günü değil **ders**:

| Kapsam | | Sınır |
|---|---|---|
| ☀️ **Bugün / Son ders** | en son dersin kelimeleri — tam satır, en üstte | **sınırsız** (ders kaç kelimeyse) |
| 🌙 Önceki ders | bir önceki dersin kelimeleri | sınırsız |
| ⏰ Bekleyen tekrarlar | vadesi gelmiş | 10 |
| 🩹 Zorlandıklarım | en çok düştüklerim | 10 |
| 🕰️ Eski kelimeler | 7+ günlük, **rastgele** | 10 |
| ✋ **Seç** | kendin işaretle — kendi satırında | **sınırsız** |

> Birinci kutu bir süre sabit **"Bugün"**dü ve ikincisi **"Dün"**. İkisi de
> yapısal olarak boşalıyordu: "Dün" bir gün ara verildiğinde ya da o gün
> yalnızca tekrar yapıldığında boş kalıyor, "Bugün" ise **set bitince
> sonsuza kadar** boş kalıyordu — artık hiçbir gün yeni kelime gelmiyor.
> Birim ders olunca kural tek cümleye indi: *birinci kutu en son ders,
> ikincisi ondan önceki.* Tanım gereği çakışmazlar ve iki dersi olan
> herkeste ikisi de doludur. Bugün yeni kelime geldiyse birinci kutunun
> başlığı **"Bugün"**, gelmediyse **"Son ders"**.

Boş kapsam kutusu **basılamaz** (soluk durur); önce basılıyor ve hiçbir şey
olmuyordu.

**"Tümü" yok.** Havuz 600'e çıkınca tek tuşla yüzlerce kelime başlatmak
kimsenin istediği şey değil; isteyen **Seç**'e girip istediği kadarını
işaretler.

Eski kelimeler **rastgele** seçilir. Hep en eskiden başlamak aynı kelimeleri
döndürüp durur; havuz büyüdükçe arkadaki yüzlerce kelime hiç görünmez.

Egzersiz tipi merdivenin altı basamağı, artı üç tane:

- **🎓 Dersi tekrar et** — dersin kendisi: önce kartlar gösterilir, sonra
  **altı basamak sırayla** koşar. Öğrenme testiyle aynı görev listesi, aynı
  sıra (`Runner`'a `sirali` verilir). Seçili kapsam hangisiyse onu ders gibi
  işler; varsayılan kapsamla birlikte "bugünün dersini baştan yap" demek olur.
- **🎲 Karışık** — her kelime kendi basamağında
- **🃏 Kartlar** — kelimenin kartını (görsel + kanca + cümle) soru sormadan
  yeniden gösterir. Aylar önce öğrenilen bir kelimenin kancasını tazelemenin
  yolu bu.

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

**Başarı** — penceredeki her **alıştırmanın** (`kelime × basamak`) en son cevabı.
Gün / Hafta / Ay / **Toplam** penceresi tek dokunuşla değişir. Aynı kelimenin
eşleştirmesi ile yazması **ayrı hücre**; her hücre bir kez sayılır:

- Yanlış yaptığın alıştırmayı tekrar edip doğru yapınca oran **gerçekten yükselir**
- Çok tekrar yapan oranı **şişiremez** — her hücrenin bir oyu var
- **Zor basamak kolay basamağın sonucunu silmez**
- Ham hacim yüzdenin altında ayrıca durur (`12 kelime · 48 cevap · 9 yanlış`)

Bunun için her cevap **tek satır** olarak kaydedilir
(`answers` tablosu: `cardId`, `ts`, `gun`, `ok`, `step`, `ipucu`, `kaynak`).

> Önce gün bazında toplu sayaçlar tutuluyordu (`days[gün] = { r, i, d, y }`).
> O şekille "kelimeyi yeniden çalışınca önceki yanlışı düzelsin" isteği
> **matematiksel olarak** karşılanamaz: hangi cevabın hangi kelimeye ait
> olduğu bilgisi atılmış oluyor, geri getirilemiyor. Bir kelimeyi yanlış
> yapıp sonra üç kez doğru yapmak günü %75 gösteriyordu — eski yanlış hiç
> silinmiyor, yalnızca seyreliyordu. Ham cevap durduğu sürece yüzdenin
> tanımı sonradan da değiştirilebilir.
>
> Geçiş sırasında **başarı geçmişi bilerek sıfırdan başladı**: eski toplu
> sayaçlar kelime bazında geri üretilemiyor, ikisini tek rakamda toplamak
> iki farklı şeyi karıştırmak olurdu. Kelime ilerlemesi (step/FSRS)
> etkilenmedi.
>
> Birim bir süre **kelime** idi ve gerçek bir derste çöktü: öğrenme testi
> aynı kelimeyi altı kez, gittikçe zorlaşan basamaklarda soruyor ve en
> sonda dinleme var. 30 cevabın 21'i doğru olan bir derste beş kelimenin
> de **son** cevabı yanlış çıktı; ekranda **%0** yazdı. "Son cevap" daha
> sonraki bir çalışmada anlamlı, aynı testin daha zor basamağı için değil
> — karşılaştırma aynı basamakla yapılmalı. Birim `kelime × basamak` olunca
> aynı ders **%83** verdi.

**Kalıcılık** *(önceki adı "ustalık")* — aşağıda.

**Kalıcılık** — kelimelerin merdivende ne kadar yukarı çıktığı. 1. basamak %0,
6. basamak %100, ortalaması alınır. "Kaç kelime biliyorum" değil, **"ne kadar
iyi biliyorum"**.

> Adı **"ustalık"**tı ve ne olduğu soruldu — kimse bilmiyorsa etiket
> çalışmıyor demektir. Kutunun altında artık tek satır tanımı duruyor:
> *"Kelimelerin merdivende ne kadar yukarı çıktığı. Tekrarlarla yükselir."*

Altı basamak kullanıcıya **ne yapabildiği** olarak gösterilir, ve sayım
**birikimlidir**:

```
Neler yapabildin
Tanıştım                      5 / 5
Türkçesinden seçtim           3 / 5
Baştan yazdım                 1 / 5
```

Sayım **merdiven konumuna değil yapılana** bakar: bir kelimeyi o basamakta
(`≥ 3` seçme, `≥ 5` yazma) **kancaya basmadan en az bir kez** doğru yaptıysan
sayılır — cevap günlüğünden okunur.

> Önce eşik merdiven konumuydu (`step ≥ 3` / `≥ 5`). Sonucu şuydu: kullanıcı
> derste kelimeyi ters seçmeli, harf dizme ve yazmayla doğru yapıyor, panelde
> alt iki satır yine **0** duruyordu — çünkü merdiven öğrenme testinde
> oynamıyor ve 3. basamağa çıkmak günler sürüyor. Kullanıcı panelin bozuk
> olduğunu düşündü; haksız da değildi: *"neler yapabildin"* sorusunun cevabı
> "bugün baştan yazdın" olmalı.
>
> Bedeli bilinçli: **unutulan kelime de sayılmaya devam eder**, çünkü soru
> "hâlâ biliyor musun" değil "yapabildin mi". "Hâlâ" sorusunun cevabı hemen
> üstteki **kalıcılık** yüzdesi. İki panel yan yana duruyor ve ayrı şeyler
> söylüyor.

Bir ara basamaklar birbirini dışlayan üç kutuya bölünüyordu (1–2 tanıma,
3–4 geçiş, 5–6 üretim). Yanıltıyordu: *"Tanıma 2"* yazınca "sadece 2 kelimeyi
tanıyorum" gibi okunuyor, oysa hepsini tanıyor — ikisi o basamakta *duruyor*.
Beceri birikimli: 5. basamaktaki kelime 3'ten geçerek geldi, yani onu hem
tanıyor hem seçebiliyor.

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

Bu paneller **kullanıcıya gösterilmiyor**, geliştirme panelinde duruyor. İki
sebeple: öğrenen için gürültü ("kanca ekrandan kalkınca durdu %62" cümlesi
İngilizce öğrenen birine hiçbir şey söylemiyor), yazar için de tek kişinin
verisi karar vermeye yetmiyor — bu ölçüm ancak çok kullanıcıdan toplanınca
anlam kazanır ve local-first olduğu sürece yazara zaten ulaşmıyor.

Sinyaller toplanmaya devam ediyor ve yedeğe giriyor; yalnızca ekrandan çekildi.
Oranların yanında kaç karta dayandığı da yazar; 2 kartlık %100 bir şey söylemez.

---

## Yapı

```
content/cards.json     İçeriğin tek kaynağı (xlsx'ten üretilir)
brand/                 Marka kaynağı + sosyal medya görselleri
  logo-isaret.svg      TEK KAYNAK: işaret (şeffaf vektör). Her şey bundan üretilir.
  logo-isaret.png      Şeffaf işaret — filigran, sunum
  kilit.png            Yatay kilit (işaret + isim) — başlık, afiş
  instagram-profil*.png  Profil fotoğrafı: sade/yazılı × krem/lacivert
  ikon-sayfasi.png     Arayüz ikonları, 5×5 ızgara (kaynak)
  ikon-sayfasi-2.png   harf + seri + koruma + kutlama, 2×2 (kaynak)
  avatar-sayfasi.png   9 hayvan avatarı, 3×3 (kaynak)
  cerceve-sayfasi.png  Marka dilinde çerçeveler, 3×2 (kaynak)
  cerceve-sayfasi-2.png  Madeni çerçeveler: bronz/gümüş/altın/platin (kaynak)
  *-seti.png           Kontak sayfaları — üretim yazar, elle tutulmaz
  fonts/Nunito-800.ttf Kilit yazısı için (resvg woff2 okumuyor)
src/
  assets/cards/        Kart görselleri — dosya adı kart id'si (snake.webp)
  assets/ikonlar/      Marka rengine oturtulmuş ikonlar (düz + ters)
  assets/avatarlar/    9 hayvan avatarı
  assets/cerceveler/   6 çerçeve + olcu.json (delik oranı)
  icons.ts             İkon kaydı: ad → URL (saf, React'siz)
  avatarlar.ts         Avatar/çerçeve kaydı + delik oranı
  profil.ts            Yerel profil: kimlik, otomatik ad, avatar (saf)
  cerceveler.ts        Çerçeveler ve kilit koşulları (saf)
  content.ts           Kart havuzu ve sabitler
  scheduler.ts         FSRS + merdiven geçişleri + kuyruklar
  exercise.ts          Egzersiz tanımları, şıklar, harf dizme (saf)
  dates.ts             Seri, seri koruma, tarih mantığı (saf)
  today.ts             Gün sınırı — gün dönünce ekran da döner
  score.ts             Başarı ve kalıcılık yüzdeleri (saf)
  db.ts                Dexie (IndexedDB) — ilerleme + cevap günlüğü, cihazda
  share.ts             Paylaşım görselleri (canvas)
  components/          Match, Choice, Scramble, TypeAnswer, Runner, CardFace, Gecis
  screens/             Welcome, Home, Lesson, Practice, Progress,
                       WordList, Settings, SessionDone
tools/
  import-xlsx.mjs      Tablo → JSON + doğrulama raporu
  import-images.mjs    Kart görselleri → 4:3 webp (çerçeveliler düzeltilir)
  make-icons.mjs       Vektör işaret → uygulama/cihaz simgeleri
  sayfa.mjs            Ortak: sayfayı hücrelere böl, kremi alfaya çevir
  make-ui-icons.mjs    İkon sayfaları → marka rengi + ters varyant
  make-avatars.mjs     Avatar sayfası → 9 daire-hazır resim
  make-frames.mjs      Çerçeve sayfası → deliği ölçülüp hizalanmış 6 çerçeve
  make-lockup.mjs      İşaret + isim → yazılı kilit, profil görselleri
  android-bildirim-ikonu.mjs  Filiz → durum çubuğu silueti (cap add sonrası)
```

**Local-first.** İlerleme tamamen tarayıcıda (IndexedDB), backend yok. Açılışta
`navigator.storage.persist()` çağrılır — yoksa Safari 7 gün kullanılmayan veriyi
koşulsuz siliyor. İlerleme sekmesindeki **Yedek al / Geri yükle** ile taşınır.

### Renk sistemi

Palet zaten genişti ama tek renk (mavi) taşıyordu: `blush` hiç kullanılmıyor,
her seçili kutu aynı maviydi. Renk artık **anlam taşıyor** ve iki eksen
birbirine karışmıyor:

| Nerede | Kural |
|---|---|
| Egzersiz **kapsamları** | her kapsamın kendi rengi (lacivert · nane · pembe · koyu mavi) |
| Egzersiz **tipleri** | hepsi lacivert — tip bir eksen değiştirmez |
| Merdiven basamakları | üç bölge üç renk: tanıma **mavi** · geçiş **sarı** · üretim **nane** |
| İlerleme çubukları | aynı üç renk — iki ekran aynı şeyi aynı renkle söylüyor |
| İlerleme sayı kutuları | mavi (kelime) · sarı (kalıcılık) · pembe (seri) · nane (toplam) |
| Alt menü | her sekmenin sabit rengi |
| **Kart yüzü ve soru ekranı** | dokunulmadı — orada tek vurgu kancanın sarısı |

Son satır kuralın kendisi: `spark` (kanca sarısı) başka hiçbir yerde vurgu
rengi olarak kullanılmıyor. Kancanın yanına ikinci bir renk girerse kanca
dikkat çekmeyi bırakır.

### İkon seti

Arayüzdeki her ikon emojiydi: `🌱`, `🎯`, `📊`, `⚙️`, `🔊`, `🎲`… Emoji marka
değil — **cihazın yazı karakteri çiziyor**, yani aynı ekran Android'de,
iOS'ta ve masaüstünde üç ayrı stilde görünüyordu ve hiçbiri logonun iki
rengini taşımıyordu. Artık 20 ikonluk tek bir çizim seti var; logoyla aynı
lacivert (`#16233A`) ve aynı sarı (`#FFD23F`).

**Kaynak tek bir sayfa.** İkonlar tek tek üretilmedi: hepsi 1152×928'lik bir
5×5 ızgarada, aynı fırça ve aynı çizgi kalınlığıyla bir arada çizildi. Set
olmalarının sebebi bu — ayrı ayrı üretilseler kalınlıklar tutmazdı.

| Katman | Nerede |
|---|---|
| `brand/ikon-sayfasi.png` | **tek kaynak** — elle düzenlenmez |
| `tools/make-ui-icons.mjs` | hücreleri ölçerek kırpar, kremi alfaya çevirir, markaya boyar, ters varyantı üretir, optik boyutu eşitler |
| `src/assets/ikonlar/*.png` | üretilen dosyalar (`ad.png` + `ad-ters.png`), 128px |
| `src/icons.ts` | ad → URL. Saf: `exercise.ts` de ikon **adı** taşıyabiliyor |
| `<Ikon>` (components/ui.tsx) | çizen bileşen |

> Bir süre depoda sayfadan **elle kırpılmış** 64px'lik PNG'ler duruyordu ve
> kırpma kutuları dardı: `egzersiz`in alt halkası düz kesikti, `bugun` ile
> `zor`un üstünde komşu hücreden bulaşmış çubuklar vardı, beş karo
> genişliğindeki `harf` ikonu ise ortadan ikiye bölünüp iki ayrı ikon
> sanılmıştı. Kırpmayı göz yerine ölçüm yapınca hepsi geçti.

**Ters varyant KOYU ZEMİN demek, "seçili" demek değil.** Seçili bir kutu beyaz
kalıyorsa düz varyant doğru olanı. Ters varyantta lacivert mürekkep logonun
kremine (`#FFF7E4`) döner, kanca sarısı yerinde kalır — alt menüde seçili
sekme, seçili kapsam kutusu ve dinleme düğmesi böyle okunuyor.

Yeni ikon: kaynak sayfaya ekle → `tools/make-ui-icons.mjs` içindeki `YERLESIM`
tablosuna hücresini yaz → `npm run icons:ui` → `src/icons.ts` listesine adını
ekle. Liste ile üretilen dosyalar ayrışırsa test (`icons.test.ts`) yakalar;
tip sistemi bu bağı göremiyor çünkü ad ile dosya derleme anında değil çalışma
anında eşleşiyor.

> Arayüzde artık emoji yok. `✓`, `←`, `›` duruyor ama onlar tipografik
> işaret, ikon değil.

### Yerel profil

Kullanıcı hiçbir şey yapmadan bir profili olur: ilk açılışta ad ve avatar
üretilir. **Hesap değil** — e-posta yok, şifre yok, giriş yok, sunucu yok;
uygulama içinde her yerde "profil" denir. "Hesap" denirse insanlar
verilerinin bulutta olduğunu sanıp yedek almayı bırakır.

Otomatik ad sıfat + hayvan ("Meraklı Tilki") ve avatar da **o hayvan** —
ad ile yüz aynı yerden geliyor. İsteyen Ayarlar → Profil'den adını
değiştirir, dokuz hayvandan birini ya da kendi fotoğrafını seçer. Fotoğraf
256px kareye küçültülüp cihazda tutulur, hiçbir yere gönderilmez.

> Bir süre üçüncü bir seçenek daha vardı: marka ikonu + renkli zemin.
> Kaldırıldı — hayvan portrelerinin yanında sönük duruyordu ve aynı işi
> onlar daha iyi yapıyor. Eski bir kayıtta kalmışsa `profilDuzelt` onu
> adın kendi hayvanına çeviriyor.

**Çerçeveler satılmaz, kazanılır.** İlk ikisi markanın kendi dilinde
(lacivert + kanca sarısı), sonraki dördü bir **metal kademesi** — hangisinin
daha değerli olduğu yazı okunmadan, renge bakarak anlaşılıyor:

| Çerçeve | Nasıl açılır |
|---|---|
| Halka | başlangıç, herkeste var |
| Halat | 10 kelime |
| Bronz | 25 kelime |
| Gümüş | 7 gün üst üste |
| Altın | 50 kelime |
| Elmas | seti bitir |

> **Seri koşulu EN UZUN seriye bakar, mevcut seriye değil.** Mevcut seriye
> baksaydı seri kırılınca kazanılmış çerçeve geri alınırdı — bu ceza olurdu
> ve serinin kuralı "ödül var, ceza yok". Bir kez 7 güne ulaşan bir daha
> kaybetmez (`AppState.bestStreak`).

Hak edilmemiş çerçeve okurken varsayılana düşer (yedek başka cihazdan
gelmiş olabilir).

> **`Profil.id` neden var.** Rastgele, kalıcı, görünmez bir kimlik. Ad
> kimlik değildir — iki kişi de "Meraklı Tilki" olabilir. Bu alan olmadan
> ileride bulut senkronu *"bu aynı kişinin yeniden kurulumu mu"* sorusunu
> cevaplayamaz ve herkes sıfırdan başlar. Hiçbir yere gönderilmiyor ama
> yedeğe giriyor. Yine de "kaç kişi kullanıyor"u **çözmüyor**; o ayrı iş.

### Kullanım ölçümü

`src/analitik.ts` tek kapı — uygulamanın geri kalanı yalnızca `olay()`
çağırıyor, Firebase'i tanımıyor. Vazgeçilirse değişen tek yer orası.

Arka uç **kendi Supabase tablomuz** — üçüncü taraf analitik yok. SDK de
yok: PostgREST düz bir HTTP ucu, tek ihtiyacımız bir INSERT, `fetch`
yetiyor. Pakete eklenen bayt: **sıfır**.

- **Yapılandırma yoksa sessizce kapalı.** `VITE_SUPABASE_*` ortam
  değişkeninden (bkz. `.env.example`); yoksa hiçbir şey gönderilmez ve
  Ayarlar'daki anahtar bile görünmez.
- **Kullanıcı kapatabilir** — Ayarlar → Kullanım istatistikleri.
- **Kişisel veri gitmez** — ad, fotoğraf, cevaplar hiç gönderilmiyor. Tek
  kimlik `Profil.id`: rastgele, dışarıda hiçbir şeye bağlanmıyor.
- **Çevrimdışı kaybolmaz** — olaylar `localStorage`'da birikir, bağlanınca
  toplu gider.

Tablo şeması, RLS politikası ve D1/D7 sorguları **NOTLAR.md**'de.

> Bu, uygulamanın artık "hiçbir veri toplamıyor" diyemeyeceği anlamına
> geliyor. Yasal metinler ve Play'in Veri Güvenliği formu buna göre.
> Play'de ret sebebi analitik değil, **beyan uyuşmazlığıdır**.

### Yasal metinler

`public/` içinde **düz HTML**, React değil — çünkü mağazalar uygulama
**yüklenmeden** açılabilen bir gizlilik adresi istiyor. Aynı dosyalar hem
internette hem uygulama paketinde; tek kaynak.

| Dosya | Ne |
|---|---|
| `gizlilik.html` | Gizlilik Politikası |
| `kullanim-kosullari.html` | Kullanım Koşulları |
| `kvkk-aydinlatma.html` | KVKK Aydınlatma Metni (6698 m.10) |
| `yasal.css` | Ortak stil — açık/koyu tema |

Uygulamadan erişim: **Ayarlar → Yasal** (en altta; aranan bir şey değil
ama bulunabilir olmak zorunda).

> Metinler uygulamanın **gerçek davranışına** göre yazıldı: neyin cihazda
> kaldığı, neyin gönderildiği, neyin gönderilmediği tek tek sayılı. Çoğu
> uygulamanın gizlilik metni kopyalandığı için yanlıştır; buradaki değil.
> Yine de bunlar hukuki danışmanlık değildir — yayından önce bir avukata
> okutulmalı, özellikle **veri sorumlusu kimliği** (şahıs mı şirket mi)
> ve **yurt dışına aktarım** başlıkları.

**Teknoloji:** Vite · React · TypeScript · Tailwind v4 · Dexie · ts-fsrs (FSRS-5) · vite-plugin-pwa. Yazı karakterleri (**Nunito** + Plus Jakarta Sans) yerelde, çevrimdışı çalışır.

> Başlık fontu Fredoka'ydı; fontun kendisinde **ğ, Ğ, İ, Ş, ş glifleri yok**
> (toplam 320 glif). Ayrıca `latin` @font-face'lerinde `unicode-range`
> eksikti — aralığı olmayan bir yüz tüm Unicode'u kapsadığını iddia edip
> `latin-ext`'i eziyor, o harfler onları içermeyen dosyaya yönlenip sistem
> fontuna düşüyordu. İkisi de düzeltildi; her @font-face'in aralığı var.

---

## Durum

**Bitti:** Logo + marka kilidi · **23 parçalık marka ikon seti** (arayüzde emoji kalmadı) · tek akışlı ders · altı basamaklı egzersiz merdiveni · **ders içinde geçiş anı** · öğrenme testi (beyan yerine ölçüm) · serbest egzersiz bölümü · telaffuz · hafif seri + seri koruma · başarı ve kalıcılık puanları · **yerel profil (ad, avatar, kazanılan çerçeveler)** · Kelimelerim + arama + kanca panosu · kalite ölçümü ve zayıf kanca listesi · yedekleme · PWA (kurulabilir, çevrimdışı) · **APK** (uygulama simgesi + bildirim ikonu dahil).

**Yayın öncesi son tur:** 50 kontrollük tıklama turu (karşılamadan ders sonuna,
egzersiz · ilerleme · ayarlar · profil · çerçeve kilitleri · yedek) tamamlandı,
konsolda hata yok. 215 birim testi, tip denetimi ve derleme temiz. Paket
2,7 MB (ana paket 488 KB), 184 dosya çevrimdışı ön-bellekte.

**Yapılmadı ve nedeni:**

- **Kart görselleri** — 100'ün 1'i hazır (`snake`). Görseli olmayan kartta brief
  metni duruyor, akış eksiksiz çalışıyor. Eklemek için: `npm run import:images
  -- --brief` ile brief listesini al, üretilenleri `gorseller/<kart-id>.png`
  olarak kaydet, `npm run import:images` çalıştır. Kod veya JSON düzenlemesi yok.
  *(Havuz dolunca workbox ayarı gözden geçirilmeli: şu an tüm `.webp`
  precache ediliyor, 100 görsel ≈ 5 MB'lık ilk indirme demek.)*
- **Hatırlatma bildirimi** — PWA'da kapalıyken bildirim göndermek sunucu gerektiriyor (Web Push). Backend'siz mümkün değil, o yüzden **yalnızca APK'da** var (cihazın kendi zamanlayıcısı). Aynı sınır ana ekran widget'ı için de geçerli (o native istiyor).
- **Kullanım sayısı** — "kaç kişi kullanıyor" sorusunun cevabı yok ve yerel profil bunu **çözmüyor**: cihazda duran bir isim kimseye ulaşmaz. Tek yolu anonim bir ping (profil kimliği kullanılabilir) ya da APK Play'e girerse Play Console.
- **Telaffuz kaydı** — tarayıcının ses sentezi kullanılıyor, kayıt kalitesinde değil. Yetmezse aynı arayüz önceden üretilmiş ses dosyalarına bağlanır; çağrı noktaları değişmez.

**Sırada:** yayın ve D1/D7 ölçümü · kanca aday üretim hattı (havuzu ~600'e çıkarmak için) · kart görselleri · bulut senkronu (gerekirse — yerel profilin `id` alanı çapa olarak hazır).

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
  bozmamalı; yoksa çalışkan kullanıcı kendi zamanlamasını yok eder. **Dersi
  tekrar et** de bu kurala tabi: ders gibi işler, hiçbir şeyi ilerletmez.
- **Ana ekranda ayrı "eskileri tekrar et" düğmesi yok.** İstendi, açılmadı: üç
  giriş noktasını tek *Başla*'ya indirmek bu ürünün en büyük kazancıydı ve
  tekrarı atlanabilir yapmak tekrar borcunu sessizce büyütür. Yerine üç küçük
  müdahale: dersin içinde **"Bölüm 2/3 · Tekrar"** göstergesi (tekrarın derse
  dâhil olduğu görünsün — ayrı düğme isteği buradan doğuyordu), tekrar yükü
  ağırken *Başla*'nın altında ikincil **"Önce N tekrarı yap"** satırı (aynı
  ders, yalnızca sıra değişir; hiçbir bölüm atlanmaz) ve Egzersiz'de
  **⏰ Bekleyen tekrarlar** kapsamı.
- **Arayüz kartın çerçevesi, kart kahraman.** 3D nesne/avatar bilinçli alınmadı — çerçeve bağırırsa resim kaybolur.
