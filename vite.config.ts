import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * GitHub Pages alt dizinde servis ediyor (/repo-adi/).
 * Yerelde kok dizin; yayinda is akisi BASE_PATH'i veriyor.
 */
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,

  /**
   * macOS, xattr desteklemeyen suruculerde (exFAT USB bellek gibi) her
   * dosyanin yanina bir `._ad` golgesi birakiyor. Vitest bunlari test
   * dosyasi sanip parse hatasi veriyor — depodaki hicbir sey bozuk olmasa da.
   */
  test: { exclude: ['**/node_modules/**', '**/dist/**', '**/._*'] },

  build: {
    /**
     * Arayuz ikonlari HER ZAMAN ayri dosya — base64 olarak paketin icine
     * gommesin.
     *
     * Varsayilan sinir 4 KB ve set tam ortasina dusuyor: 40 dosyanin 23'u
     * gomulup 17'si dosya oluyordu. Iki sonucu vardi — ana paket ~100 KB'lik
     * base64 ile sisiyor (uygulama cevrimdisi zaten her seyi onbellege
     * aliyor, yani kazanc yok, sadece her aciliste cozulecek fazladan
     * metin) ve ayni setin ikonlari birbirinden farkli davraniyor.
     * Servis calisani `**\/*.png` zaten on-belliyor (bkz. workbox), yani
     * dosya olmalari cevrimdisi calismayi bozmuyor.
     *
     * `false` = "gomme", `undefined` = "her zamanki boyut sinirina bak".
     * `true` dondurmek ZORLA gomer: ilk yazilista kart gorselleri de o
     * dala dusup ana paketi 2,3 MB'a cikarmisti.
     */
    assetsInlineLimit: (yol) => (yol.includes('/assets/ikonlar/') ? false : undefined),
  },

  // Telefonda test icin cloudflare tuneli uzerinden servis edilebilsin.
  // Sadece alt alan adlari; genel erisime acmaz.
  preview: { allowedHosts: ['.trycloudflare.com'] },
  server: { allowedHosts: ['.trycloudflare.com'] },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Hafızada İngilizce',
        short_name: 'Hafızada',
        description: 'İngilizce kelimeleri Türkçe ses kancası ve tek görselle öğren.',
        lang: 'tr',
        dir: 'ltr',
        id: base,
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        /* Acilis karesi: ikonun zeminiyle ayni krem (bkz. Splash) */
        background_color: '#fff7e4',
        theme_color: '#16233a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // Alt dizinde de dogru giris noktasina dus
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
