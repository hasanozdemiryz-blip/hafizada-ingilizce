import { useEffect, useState } from 'react';
import { Logo } from '../components/ui';
import { CARDS } from '../content';

/**
 * ACILIS EKRANI.
 *
 * Uygulama acilirken IndexedDB okunana kadar bir an bos ekran kaliyordu
 * (`if (!data) return null`). O bosluk artik markanin yeri: isaret, isim
 * ve bir kanca cifti.
 *
 * Logo yalnizca BURADA. Uygulama icindeki baslikta gorunmuyordu zaten
 * dogru durmuyor — yatay kilit 28px'e sikisinca yazisi okunmuyor. Ustelik
 * uygulamanin icindeyken hangi uygulamada oldugunu kimse merak etmiyor.
 *
 * Kanca cifti her acilista degisir: bir saniyelik bekleme, yontemin ne
 * oldugunu soyleyen bir cumleye donusur.
 *
 * Zemin KREM, uygulamanin mavisi degil: ikona basmaktan ana ekrana kadar
 * olan zincirde renk sicramasin diye. Sira su — cihazin cizdigi acilis
 * karesi (manifest `background_color`) krem, bu ekran krem, sonra
 * uygulama kendi mavisine aciliyor.
 */
const ORNEKLER = CARDS.slice(0, 12);

export function Splash() {
  const [ornek] = useState(() => ORNEKLER[Math.floor(Math.random() * ORNEKLER.length)]);
  const [gorundu, setGorundu] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGorundu(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-full bg-cream flex flex-col items-center justify-center gap-6 px-8">
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-500 ${
          gorundu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <Logo className="h-20" />
        <p className="word text-2xl font-extrabold text-ink">Hafızada İngilizce</p>
      </div>

      <p
        className={`text-center transition-all duration-700 delay-200 ${
          gorundu ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="word text-lg font-bold text-ink-soft">{ornek.en}</span>
        <span className="text-ink-faint"> ≈ </span>
        <span className="word text-lg font-bold text-ink bg-spark/55 rounded px-1.5 py-0.5">
          {ornek.hook}
        </span>
      </p>
    </div>
  );
}
