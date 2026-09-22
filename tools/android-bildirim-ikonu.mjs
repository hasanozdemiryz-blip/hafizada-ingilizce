/**
 * Android bildirim (durum cubugu) ikonu.
 *
 *   src/assets/ikonlar/ogren.png
 *     -> android/app/src/main/res/drawable-<yogunluk>/ic_stat_hafizada.png
 *
 * NEDEN AYRI BIR IS. `capacitor.config.json` uzun sure Capacitor'un
 * BELGELERINDEKI ornek degeri tasidi: `ic_stat_icon_config_sample`. Eklenti
 * boyle bir drawable gondermiyor (`@capacitor/local-notifications` icinde
 * yalnizca `ic_transparent.xml` var), yani ad hicbir seye cozulmuyor ve
 * Android uygulama simgesine dusuyordu — durum cubugunda beyaz bir leke.
 *
 * NEDEN LOGO DEGIL. Durum cubugu ikonu ALFA MASKESIDIR: Android butun opak
 * pikselleri beyaza boyar, renk bilgisi atilir. Logonun dolu beyin formu
 * boyle olunca taninmaz bir lekeye donusuyor (denendi). Ikon setindeki
 * cizimler ise CIZGI cizimi — icleri seffaf oldugu icin siluete cevrilince
 * yapilarini koruyorlar ve 24 pikselde bile okunuyorlar.
 *
 * Filiz secildi: zaten "Ogren" sekmesinin sembolu, yani bildirim
 * uygulamanin kendi diliyle "ogrenme vakti" diyor.
 *
 * NEDEN android/ ICINE YAZIYOR. `android/` depoda tutulmuyor, her seferinde
 * `cap add android` ile uretiliyor (bkz. NOTLAR). `@capacitor/assets` ise
 * launcher ve acilis ekranini uretiyor, bildirim ikonunu URETMIYOR. Bu
 * yuzden bu betik `cap add android` SONRASINDA calistirilmali — tipki
 * build.gradle'daki buildDirectory blogu gibi.
 *
 * Kullanim: npm run icons:bildirim
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(fileURLToPath(import.meta.url), '../..');
const KAYNAK = join(KOK, 'src/assets/ikonlar/ogren.png');
const ANDROID = join(KOK, 'android/app/src/main/res');

/** Dosya adi — `capacitor.config.json` -> plugins.LocalNotifications.smallIcon */
const AD = 'ic_stat_hafizada';

/** Android yogunluklari. Taban 24dp; kaynak 128px oldugu icin hepsi kucultme. */
const YOGUNLUKLAR = {
  'drawable-mdpi': 24,
  'drawable-hdpi': 36,
  'drawable-xhdpi': 48,
  'drawable-xxhdpi': 72,
  'drawable-xxxhdpi': 96,
};

if (!existsSync(ANDROID)) {
  console.error(`Android projesi yok: ${ANDROID}`);
  console.error('Once `npx cap add android` calistir, sonra burayi.');
  process.exit(1);
}

if (!existsSync(KAYNAK)) {
  console.error(`Kaynak ikon yok: ${KAYNAK}`);
  console.error('Once `npm run icons:ui` calistir.');
  process.exit(1);
}

/**
 * Siluete cevir: rengi at, alfayi birak.
 *
 * Android zaten bunu yapacak; burada da yapmamizin sebebi ciktinin ne
 * gorunecegini DOSYAYA yazmak — kimse "acaba nasil cikiyor" diye
 * derlemek zorunda kalmasin.
 */
const { data, info } = await sharp(KAYNAK).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
}
const beyaz = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toBuffer();

for (const [klasor, boyut] of Object.entries(YOGUNLUKLAR)) {
  const hedef = join(ANDROID, klasor);
  await mkdir(hedef, { recursive: true });
  await sharp(beyaz)
    .resize(boyut, boyut, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(join(hedef, `${AD}.png`));
  console.log('✓', `${klasor}/${AD}.png`, `${boyut}px`);
}

console.log(`\nBildirim ikonu yerlestirildi. capacitor.config.json bunu "${AD}" olarak cagiriyor.`);
