# Yayın kılavuzu

Sıfırdan bir makinede kurup yayına çıkarma adımları. Sırayla.

Bu dosya *nasıl*ı anlatır; *neden*ler `NOTLAR.md`'de.

---

## 0. Başka makineye geçmeden önce

Depoya girmeyen üç şey var (bilerek — `.gitignore`). Klonlayınca **gelmezler**:

| Dosya | Nerede | Ne yapılmalı |
|---|---|---|
| `hafizada.jks` | `C:\Users\Hasan\keys\` | **Taşı.** USB ya da kendi bulutun. Masaüstünde de bir kopya var: `hafizada-keystore-yedek\` |
| Keystore parolası | Sende | Parola yöneticisine. Onsuz keystore işe yaramaz. |
| `android-imza.properties` | Proje kökü | Yeni makinede elle oluşturulur (aşağıda) |
| `.env.local` | Proje kökü | Supabase panelinden ya da MCP ile yeniden yazılır |

Ve tabii: **yaptığın işi commit + push et.** Klon ancak push edilmiş olanı getirir.

---

## 1. Yeni makinede kurulum

### 1.1 Depo ve bağımlılıklar

```powershell
git clone https://github.com/hasanozdemiryz-blip/hafizada-ingilizce.git
cd hafizada-ingilizce
npm install
```

Node 22 gerekiyor (Actions da onu kullanıyor).

### 1.2 JDK 21

```powershell
winget install --id Microsoft.OpenJDK.21 --silent --accept-package-agreements --accept-source-agreements
```

MSI `JAVA_HOME`'u kendisi ayarlıyor. Doğrula:

```powershell
[Environment]::GetEnvironmentVariable("JAVA_HOME","Machine")
```

> Capacitor 8 **JDK 21+** istiyor, Gradle 8.14 ise **25'i tanımıyor**. Arada
> sabit bir sürüm şart — 21 o sürüm.

### 1.3 Android SDK

`winget`te tam SDK yok; komut satırı araçları elle iniyor.

```powershell
$ProgressPreference='SilentlyContinue'
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
New-Item -ItemType Directory -Force -Path "$sdk\cmdline-tools" | Out-Null
curl.exe -sSL -o "$env:TEMP\clt.zip" "https://dl.google.com/android/repository/commandlinetools-win-16111833_latest.zip"
Expand-Archive "$env:TEMP\clt.zip" -DestinationPath "$sdk\cmdline-tools" -Force
Rename-Item "$sdk\cmdline-tools\cmdline-tools" "latest"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdk, "User")
```

> `Invoke-WebRequest` kullanma — 148 MB'lık bu dosyada dakikalarca sürüyor
> (ilerleme çubuğu yüzünden). `curl.exe` saniyeler alıyor.

Sonra paketler:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$a = "$env:ANDROID_HOME\cmdline-tools\latest\bin\android.exe"
& $a sdk install "platforms;android-36"
& $a sdk install "build-tools;36.0.0"
& $a sdk install "platform-tools"
```

> **`sdkmanager` kullanma.** Kaldırılmış: uyarı basıp *hiçbir şey yapmadan*
> çıkıyor. Yerine `android sdk install` geldi. Lisans onayı kurulumun içinde.

### 1.4 Ölçüm anahtarları

Proje kökünde `.env.local` (BOM'suz):

```
VITE_SUPABASE_URL=https://safbupshatjmfxdviwvp.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase > Settings > API > anon public>
```

Yoksa uygulama çalışır ama **ölçüm sessizce kapalı kalır** — D1/D7 verisi gelmez.

### 1.5 İmza bilgileri

Keystore'u taşıdıktan sonra, proje kökünde `android-imza.properties`:

```
storeFile=C:/tam/yol/hafizada.jks
storePassword=...
keyAlias=hafizada
keyPassword=...
```

**İki tuzak:**

- Yoldaki eğik çizgiler **`/`** yönünde. `.properties` dosyasında `\` kaçış
  karakteri; `C:\Users\...` yazarsan yol bozulur.
- Dosya **BOM'suz** olmalı. PowerShell'in `Set-Content -Encoding utf8`'i BOM
  koyuyor ve Java onu ilk anahtarın adına yapıştırıyor → Gradle
  `Cannot convert 'null' to File` diyor, BOM'dan hiç söz etmeden.
  (`npm run android:release` artık BOM'u kendisi temizliyor.)

---

## 2. Telefonda deneme — mağazaya yüklemeden

```powershell
npm run build
npx cap add android
npm run icons:android      # uygulama simgesi + açılış ekranı
npm run icons:bildirim     # durum çubuğu ikonu
npm run android:release    # sürüm + imza
cd android
.\gradlew.bat assembleRelease
```

Çıktı: `android\app\build\outputs\apk\release\app-release.apk`

Telefonu USB ile bağla, **Geliştirici seçenekleri → USB hata ayıklama**'yı aç:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices          # telefon listede mi
& $adb install -r "android\app\build\outputs\apk\release\app-release.apk"
```

> Tünel üzerinden indirme **çalışmıyor**: uygulamanın service worker'ı
> `/hafizada.apk` isteğini yakalayıp APK yerine uygulamayı açıyor. USB ya da
> dosyayı Drive'a koyup telefondan indirmek gerekiyor.

### Cihazda mutlaka bakılacak üç şey

Üçü de yalnızca gerçek telefonda görülebilir:

1. **Telaffuz** — kelime kartında hoparlör düğmesi var mı, ses çıkıyor mu.
   (WebView'da `speechSynthesis` yok; Capacitor eklentisi devrede olmalı.)
2. **Bildirim ikonu** — Ayarlar'dan hatırlatmayı aç, bildirim gelince durum
   çubuğundaki ikon **filiz** mi, beyaz leke mi.
3. **Yedekle** — Ayarlar → Verilerim → Yedekle. Sistem **paylaş menüsü**
   açılmalı ve Drive görünmeli. Düğmenin yazısı "Yedekle" ise doğru yol
   seçilmiş demektir; "Yedek al" yazıyorsa native yol bulunamamış.

---

## 3. Web yayını (GitHub Pages)

Play'in istediği gizlilik adresi buradan geliyor, **Play'den önce yapılmalı.**

1. GitHub → repo → **Settings → Secrets and variables → Actions**, iki secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. **Settings → Pages → Source: GitHub Actions**
3. `main`'e push — `.github/workflows/deploy.yml` kendiliğinden çalışır

Çıkan adresler:

```
https://<kullanici>.github.io/hafizada-ingilizce/
https://<kullanici>.github.io/hafizada-ingilizce/gizlilik.html
https://<kullanici>.github.io/hafizada-ingilizce/kvkk-aydinlatma.html
https://<kullanici>.github.io/hafizada-ingilizce/kullanim-kosullari.html
```

> Secret'lar tanımlı değilse site çıkar, çalışır, kimse fark etmez — ve
> **tek bir D1/D7 kaydı gelmez.** Vite bu değişkenleri derleme anında gömüyor.

---

## 4. Play'e yükleme

### 4.1 Paket

```powershell
cd android
.\gradlew.bat bundleRelease
```

Çıktı: `android\app\build\outputs\bundle\release\app-release.aab`

Play **APK kabul etmiyor**, `.aab` istiyor.

### 4.2 Sürüm

`versionCode` `package.json`'dan türüyor: `major*10000 + minor*100 + patch`.
`1.0.0` → `10000`.

**Her yeni yüklemede `package.json` sürümünü artır.** Play aynı ya da daha
küçük `versionCode`'u reddediyor ve geri dönüş yok.

### 4.3 Veri Güvenliği formu

Uygulama veri **topluyor** — "hayır" denemez. Beyan:

| Kategori | Ne | Amaç |
|---|---|---|
| Uygulama etkinliği | uygulama içi olaylar | Analiz |
| Cihaz veya diğer kimlikler | uygulamanın ürettiği rastgele numara | Analiz |

Konum **beyan edilmez** (toplanmıyor). Hepsi için: aktarım şifreli ·
kullanıcı silme talep edebilir · veriler satılmıyor · reklam yok.

> Play'de ret sebebi analitik kullanmak değil, **beyan uyuşmazlığıdır.**

### 4.4 Gereken diğer şeyler

- Play Console hesabı (25 USD tek seferlik, kimlik doğrulama günler sürüyor)
- Kısa açıklama (80 krk) + uzun açıklama (4000 krk)
- 512×512 uygulama ikonu, 1024×500 özellik grafiği
- En az 2 telefon ekran görüntüsü
- İçerik derecelendirme anketi
- Gizlilik politikası adresi → bkz. bölüm 3

### 4.5 Kapalı test

Kişisel geliştirici hesaplarında üretime çıkmadan önce kapalı test şartı
olabiliyor (bilinen hâli 12 kişi × 14 gün). Kurallar değişiyor — Play
Console kendi hesabında ne yazıyorsa o geçerli.

---

## Hızlı başvuru

```powershell
# tam zincir, sıfırdan imzalı pakete
npm install
npm run build
npx cap add android
npm run icons:android      # uygulama simgesi + açılış ekranı
npm run icons:bildirim     # durum çubuğu ikonu
npm run android:release    # sürüm + imza
cd android
.\gradlew.bat bundleRelease      # Play'e .aab
.\gradlew.bat assembleRelease    # kendi dağıtımın için imzalı APK
```

Üç betik de **`cap add android` sonrasında** çalışmalı; hepsi `android/`
içine yazıyor ve o klasör depoda tutulmuyor. Sıra önemli: `icons:android`
önce, çünkü `icons:bildirim`in yazdığı `ic_stat_hafizada` onun ürettiği
klasörlerin yanına gidiyor.

> `icons:android` atlanırsa kurulan uygulamada **Capacitor'ın varsayılan
> simgesi** kalır. Tam da bu oldu: `resources/` klasörü aylar önce
> hazırlanmıştı ama onu Android'e çeviren adım hiçbir betiğe bağlanmamıştı,
> `@capacitor/assets` bağımlılıklarda bile yoktu.

> Betikleri `| Select-Object -First N` ile borulama — PowerShell boru hattını
> erken kapatıp node'u öldürüyor, dosya yazılmadan çıkıyor ve çıktı normal
> görünüyor.

---

## İmza bilgileri

```
Alias      : hafizada
Algoritma  : RSA 2048 / SHA384
Geçerlilik : 8 Şubat 2054
SHA-1      : 6a:37:b9:61:aa:27:bb:60:c5:89:1a:3b:99:3c:40:5c:b3:7b:40:14
```

SHA-1, gerçek Google Drive entegrasyonunda (Faz 2) OAuth istemcisi için
gerekecek.
