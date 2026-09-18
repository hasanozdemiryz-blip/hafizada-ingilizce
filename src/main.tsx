import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { telaffuzHazirla } from './speech';

/**
 * Ilerleme yalnizca IndexedDB'de. Tarayicilar "best-effort" depolamayi
 * yer sikisinca — Safari'de 7 gun kullanilmayinca kosulsuz — silebiliyor.
 * Seri odakli bir uygulamada tatilden donen kullanicinin her seyini
 * kaybetmesi demek bu. persist() kaliciya cevirmeyi ister; verilmezse
 * hicbir sey bozulmaz, yedek alma zaten duruyor.
 */
void navigator.storage?.persist?.().catch(() => {});

/**
 * Native kabukta (APK) tarayicinin ses sentezi YOK; cihazin TTS motoru
 * kopru uzerinden aranir. Web'de hemen doner, hicbir sey geciktirmez.
 * Bkz. speech.ts — motor bulununca arayuz kendiliginden acilir.
 */
void telaffuzHazirla();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
