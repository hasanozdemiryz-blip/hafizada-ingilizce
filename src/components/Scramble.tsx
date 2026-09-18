import { useEffect, useMemo, useState } from 'react';
import { harfKarolari } from '../exercise';
import { Card as CardShell, HookChip } from './ui';
import type { Card } from '../types';

/**
 * HARF DIZME — merdivenin 4. basamagi.
 *
 * Yazma ile secmeli arasindaki kopru: harfler veriliyor ama sira
 * verilmiyor. Kelimenin yazimi hala hatirlanmiyorken uretim denemesi
 * yapilabilsin diye var; bos bir kutuya bakip vazgecmenin panzehiri.
 *
 * YANLIS SIRA KURULAMAZ: yalnizca siradaki dogru harf yerlesir, yanlisa
 * dokunmak karoyu kisaca kirmiziya cevirir ve gecer. Boylece ekranda
 * hicbir zaman yanlis yazilmis bir kelime durmaz — dizilim bittiginde
 * kelime tanim geregi dogrudur.
 *
 * Bu, egzersizi bedavaya cevirmesin diye: yanlis dokunuslar sayilir ve
 * `temiz` bilgisi yukari verilir. Hatasiz dizen merdivende ilerler,
 * deneyerek bulan yerinde kalir (bkz. scheduler.ts uc durumlu kural).
 */
export function Scramble({
  card,
  hookRevealed,
  onSubmit,
}: {
  card: Card;
  hookRevealed: boolean;
  onSubmit: (yazilan: string, temiz: boolean) => void;
}) {
  const karolar = useMemo(() => harfKarolari(card.en), [card.en]);
  const [secili, setSecili] = useState<number[]>([]);
  const [hata, setHata] = useState<number | null>(null);
  const [hataSayisi, setHataSayisi] = useState(0);

  useEffect(() => {
    setSecili([]);
    setHata(null);
    setHataSayisi(0);
  }, [card.id]);

  const kullanildi = new Set(secili);
  const siradakiHarf = card.en[secili.length];

  function karoyaDokun(i: number) {
    if (kullanildi.has(i) || secili.length >= karolar.length) return;

    if (karolar[i] !== siradakiHarf) {
      setHata(i);
      setHataSayisi((n) => n + 1);
      setTimeout(() => setHata(null), 400);
      return;
    }

    const yeni = [...secili, i];
    setSecili(yeni);
    if (yeni.length === karolar.length) {
      // Dizilim bittiginde kelime zaten dogru; bekletmeden sonuca gec.
      setTimeout(() => onSubmit(card.en, hataSayisi === 0), 350);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CardShell className="w-full">
        <div className="flex flex-col items-center gap-3 py-6">
          <span className="text-sm text-ink-faint">Harfleri sıraya diz</span>
          <p className="text-[2.25rem] leading-none font-extrabold text-center">{card.tr}</p>
          {hookRevealed && (
            <span className="pop">
              <HookChip>{card.hook}</HookChip>
            </span>
          )}
        </div>
      </CardShell>

      {/* Yazilan: bos kutucuklar kac harf oldugunu da soyler */}
      <div className="flex justify-center gap-1.5 min-h-[3.25rem]">
        {karolar.map((_, i) => (
          <span
            key={i}
            className={`word grid h-12 w-10 place-items-center rounded-xl text-xl font-extrabold transition-all ${
              i < secili.length
                ? 'bg-grow-soft text-[#128a5f] shadow-[var(--shadow-soft)]'
                : 'bg-white/45 text-transparent'
            }`}
          >
            {karolar[secili[i]] ?? '·'}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {karolar.map((h, i) => (
          <button
            key={i}
            onClick={() => karoyaDokun(i)}
            className={`word grid h-12 w-10 place-items-center rounded-xl text-xl font-extrabold transition-all active:scale-90 ${
              kullanildi.has(i)
                ? 'bg-sunken text-transparent'
                : hata === i
                  ? 'bg-blush text-white'
                  : 'bg-white text-ink shadow-[var(--shadow-soft)]'
            }`}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}
