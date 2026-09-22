/**
 * Android release hazirligi: SURUM + IMZA.
 *
 * `android/app/build.gradle` dosyasina iki sey enjekte eder:
 *   1. versionCode / versionName  — package.json'dan
 *   2. release imzalama yapilandirmasi — android-imza.properties'ten
 *
 * NEDEN AYRI BIR IS. `android/` depoda tutulmuyor, her seferinde
 * `cap add android` ile uretiliyor (bkz. NOTLAR). Uretilen build.gradle
 * ise HER SEFERINDE ayni seyi yaziyor:
 *
 *     versionCode 1
 *     versionName "1.0"
 *
 * Play ise her yuklemede versionCode'un ARTMASINI sart kosuyor. Yani ilk
 * yukleme gecer, ikinci guncellemede yine 1 uretilir ve Play reddeder.
 * "android/ tutulmaz" karari Play'e cikinca kendi basina calismiyor;
 * eksik parca bu betik.
 *
 * NEDEN package.json. Surum zaten TEK KAYNAKTAN geliyor: Ayarlar ekrani
 * `__APP_VERSION__` ile, olcum kayitlari `surum` sutunuyla oradan
 * besleniyor (bkz. vite.config.ts). Android'in ayri bir sayi tasimasi,
 * "kullanicinin ekranda gordugu surum" ile "Play'deki surum"un
 * ayrismasi demekti.
 *
 * Kullanim: npm run android:release   (cap add android SONRASINDA)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(fileURLToPath(import.meta.url), '../..');
const GRADLE = join(KOK, 'android/app/build.gradle');
const IMZA = join(KOK, 'android-imza.properties');

if (!existsSync(GRADLE)) {
  console.error('android/app/build.gradle yok.');
  console.error('Once `npx cap add android` calistir.');
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(KOK, 'package.json'), 'utf8'));

/**
 * versionName insan icin, versionCode Play icin.
 *
 * Kod semasi: major*10000 + minor*100 + patch  (1.2.3 -> 10203)
 *
 * Sema monoton ARTAN olmak zorunda, cunku Play daha kucuk bir
 * versionCode'u reddediyor ve geri donus yok. Bu sema yalnizca minor ve
 * patch 100'un altinda kaldigi surece monoton; asilirsa sessizce
 * cakisirdi, o yuzden asagida aciktan kontrol ediliyor.
 */
const parca = version.split('.').map(Number);
if (parca.length !== 3 || parca.some((n) => !Number.isInteger(n) || n < 0)) {
  console.error(`package.json surumu "x.y.z" olmali, su an: "${version}"`);
  process.exit(1);
}
const [major, minor, patch] = parca;
if (minor > 99 || patch > 99) {
  console.error(`Surum "${version}" bu semaya sigmiyor: minor ve patch 99'u gecemez.`);
  console.error('Gecmesi gerekiyorsa once semayi degistir — ama Play geri donus kabul etmiyor.');
  process.exit(1);
}
const kod = major * 10000 + minor * 100 + patch;

let g = readFileSync(GRADLE, 'utf8');
const onceki = g;

// --- 1. Surum -------------------------------------------------------------

const kodOnce = g.match(/versionCode\s+(\d+)/);
if (!kodOnce) {
  console.error('build.gradle icinde `versionCode` bulunamadi — Capacitor ciktisi degismis olabilir.');
  process.exit(1);
}
g = g.replace(/versionCode\s+\d+/, `versionCode ${kod}`);
g = g.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);

// --- 2. Imza --------------------------------------------------------------

/**
 * Imza bilgileri depoda DEGIL: `android-imza.properties` .gitignore'da ve
 * keystore dosyasinin kendisi de oyle. Keystore kaybolursa uygulama BIR
 * DAHA guncellenemez — Play ayni imzayi sart kosuyor — o yuzden o dosyanin
 * yedegi kullanicinin sorumlulugunda ve buraya hic girmiyor.
 *
 * Dosya yoksa: debug derlemesi calismaya devam eder, release derlemesi
 * OKUNUR bir mesajla duser.
 *
 * Ilk yazilista `signingConfig signingConfigs.release` kosulsuz
 * bagilaniyordu ve `bundleRelease` keystore olmadan su hatayi veriyordu:
 *
 *     Execution failed for task ':app:signReleaseBundle'.
 *     > java.lang.NullPointerException (no error message)
 *
 * Yani bos bir imza yapilandirmasi bundletool'u cokertiyor ve hicbir sey
 * anlatmiyor. Simdi bagilama da kosullu, ustune bir de acik bir kontrol
 * var: eksik olanin ne oldugunu SOYLEYEN bir hata, susan bir NPE'den
 * iyidir.
 */
const imzaVar = existsSync(IMZA);

/**
 * BOM TUZAGI.
 *
 * Java'nin `Properties.load`u dosyayi ISO-8859-1 okuyor ve UTF-8 BOM'unu
 * (EF BB BF) ILK ANAHTARIN ADINA yapistiriyor: `storeFile` degil
 * `﻿storeFile` diye okunuyor, deger null kaliyor ve Gradle
 * "Cannot convert 'null' to File" diyor — BOM'dan hic soz etmeden.
 *
 * Windows'ta `Set-Content -Encoding utf8` (PowerShell 5.1) tam da bu
 * dosyayi BOM'la yaziyor, yani tuzaga dusmek varsayilan davranis.
 * Sessizce temizliyoruz: kullanicinin duzeltebilmesi icin once ne
 * oldugunu anlamasi gerekirdi, oysa anlatan bir hata yok.
 */
if (imzaVar) {
  const ham = readFileSync(IMZA);
  if (ham[0] === 0xef && ham[1] === 0xbb && ham[2] === 0xbf) {
    writeFileSync(IMZA, ham.subarray(3));
    console.log('! android-imza.properties BOM ile yazilmisti — temizlendi');
  }
}

const yukleyici = `
// Release imza bilgileri — bkz. tools/android-release.mjs, android-imza.properties
def imzaDosyasi = rootProject.file("../android-imza.properties")
def imza = new Properties()
if (imzaDosyasi.exists()) {
    imza.load(new FileInputStream(imzaDosyasi))
}
`;

if (!g.includes('def imzaDosyasi')) {
  const i = g.search(/^android\s*\{/m);
  if (i < 0) {
    console.error('build.gradle icinde `android {` bloku bulunamadi.');
    process.exit(1);
  }
  g = g.slice(0, i) + yukleyici.trimStart() + '\n' + g.slice(i);
}

const imzaBloku = `    signingConfigs {
        release {
            if (imzaDosyasi.exists()) {
                storeFile file(imza['storeFile'])
                storePassword imza['storePassword']
                keyAlias imza['keyAlias']
                keyPassword imza['keyPassword']
            }
        }
    }
`;

if (!g.includes('signingConfigs {')) {
  // `buildTypes`tan HEMEN ONCE: Gradle signingConfigs'i once tanimlanmis gormeli.
  const i = g.search(/^\s*buildTypes\s*\{/m);
  if (i < 0) {
    console.error('build.gradle icinde `buildTypes {` bloku bulunamadi.');
    process.exit(1);
  }
  g = g.slice(0, i) + '\n' + imzaBloku + g.slice(i);
}

// release buildType'a imzayi bagla — YALNIZCA keystore varsa
if (!g.includes('signingConfig signingConfigs.release')) {
  const m = g.match(/(buildTypes\s*\{\s*\n\s*release\s*\{\s*\n)/);
  if (!m) {
    console.error('build.gradle icinde `buildTypes { release {` bulunamadi.');
    process.exit(1);
  }
  g = g.replace(
    m[1],
    `${m[1]}            if (imzaDosyasi.exists()) {\n` +
      `                signingConfig signingConfigs.release\n` +
      `            }\n`,
  );
}

/**
 * Release gorevleri keystore olmadan BASLAMADAN once dussun.
 *
 * Kosullu baglama tek basina yetmiyor: dosya yokken imzasiz bir paket
 * uretilir ve bu ancak Play'e yuklerken, reddedilince anlasilir. Sessiz
 * bir basari okunur bir hatadan kotudur.
 *
 * Debug derlemesi etkilenmiyor — kosul yalnizca release gorevlerine bakiyor.
 */
const bekci = `
// Bkz. tools/android-release.mjs — release paketi imzasiz uretilmesin.
// Gorev grafigi hazir olur olmaz bakiliyor: derlemeye hic baslanmadan duser.
//
// Mesaj Groovy'nin uc tirnakli dizgisinde: gercek satir sonu kabul ediyor.
// Kacis dizisi BILEREK kullanilmiyor — bu metin once bir JS sablon
// dizgisinden geciyor ve kacis orada bir kez daha cozulup dizgiyi
// ikiye boluyordu (build.gradle derlenmiyordu).
gradle.taskGraph.whenReady { graph ->
    if (!imzaDosyasi.exists() && graph.allTasks.any { it.name ==~ /^(assemble|bundle).*Release\$/ }) {
        throw new GradleException('''android-imza.properties bulunamadi — release paketi imzalanamaz.
Keystore uret, sonra proje kokunde su dosyayi olustur:
  storeFile=C:/tam/yol/hafizada.jks
  storePassword=...
  keyAlias=hafizada
  keyPassword=...''')
    }
}
`;

if (!g.includes('release paketi imzasiz uretilmesin')) {
  g = g.trimEnd() + '\n' + bekci;
}

if (g === onceki) {
  console.log('Degisiklik yok — build.gradle zaten guncel.');
} else {
  writeFileSync(GRADLE, g);
}

console.log('✓ versionName', version);
console.log('✓ versionCode', kod, `(onceki: ${kodOnce[1]})`);
console.log(imzaVar ? '✓ imza bilgileri bulundu' : '! android-imza.properties YOK — release derlemesi imzasiz duser');

if (!imzaVar) {
  console.log('\nKeystore olusturmak icin (parolayi SEN sakla, kaybolursa guncelleme yapilamaz):');
  console.log('  keytool -genkey -v -keystore hafizada.jks -keyalg RSA -keysize 2048 \\');
  console.log('          -validity 10000 -alias hafizada');
  console.log('\nSonra android-imza.properties olustur:');
  console.log('  storeFile=C:/tam/yol/hafizada.jks');
  console.log('  storePassword=...');
  console.log('  keyAlias=hafizada');
  console.log('  keyPassword=...');
}
