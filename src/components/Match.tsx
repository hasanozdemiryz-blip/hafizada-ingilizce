import { useMemo, useRef, useState } from 'react';
import { shuffle } from '../exercise';
import { Card as CardShell } from './ui';
import type { Card } from '../types';

/**
 * ESLESTIRME — merdivenin ilk basamagi.
 *
 * Grup egzersizi: tek kartla sorulamaz, 5 kelime bir arada gelir. En kolay
 * basamak olmasinin sebebi secenegin kapali olmasi — dogru cevap ekranda,
 * is yalnizca eslemek. Yeni kelimenin ilk temasi icin dogru zorluk.
 *
 * Yanlis eslesme serbest ve GORUNUR: dokunulan iki karo da kisaca
 * kirmiziya doner. Once yalnizca Turkce karo kiziriyor, Ingilizce olan
 * sessizce secimi birakiyordu — hata yapildigi anlasilmiyordu.
 *
 * Yanlis eslesme kartlari silmez, sadece isaretler: her iki kelime de
 * "ilk denemede bilinmedi" sayilir ve ekran bir anda bosalmaz.
 */
export function Match({
  cards,
  onDone,
}: {
  cards: Card[];
  /** Hangi kartin ilk denemede dogru eslendigi */
  onDone: (sonuc: Map<string, boolean>) => void;
}) {
  const sol = useMemo(() => shuffle(cards), [cards]);
  const sag = useMemo(() => shuffle(cards), [cards]);

  const [secilenEn, setSecilenEn] = useState<string | null>(null);
  const [eslesen, setEslesen] = useState<Set<string>>(new Set());
  /** Yanlista iki karo birden kizarir: hangi ikisine dokunuldugu belli olsun */
  const [hata, setHata] = useState<{ en: string; tr: string } | null>(null);
  /** Ilk denemede bilinmeyenler — olcum icin. Ref: kapanista bayatlamasin. */
  const kirli = useRef<Set<string>>(new Set());

  function trSec(kart: Card) {
    if (!secilenEn || eslesen.has(kart.id)) return;

    if (secilenEn === kart.id) {
      const yeni = new Set(eslesen).add(kart.id);
      setEslesen(yeni);
      setSecilenEn(null);
      setHata(null);
      if (yeni.size === cards.length) {
        onDone(new Map(cards.map((c) => [c.id, !kirli.current.has(c.id)])));
      }
      return;
    }

    setHata({ en: secilenEn, tr: kart.id });
    kirli.current.add(secilenEn).add(kart.id);
    setTimeout(() => setHata(null), 550);
    setSecilenEn(null);
  }

  return (
    <CardShell className="w-full">
      <p className="text-center text-sm text-ink-faint mb-4">Eşleştir</p>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-2.5">
          {sol.map((c) => (
            <Karo
              key={c.id}
              metin={c.en}
              ingilizce
              bitti={eslesen.has(c.id)}
              secili={secilenEn === c.id}
              yanlis={hata?.en === c.id}
              onClick={() => !eslesen.has(c.id) && setSecilenEn(c.id)}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          {sag.map((c) => (
            <Karo
              key={c.id}
              metin={c.tr}
              bitti={eslesen.has(c.id)}
              yanlis={hata?.tr === c.id}
              onClick={() => trSec(c)}
            />
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function Karo({
  metin,
  onClick,
  bitti,
  secili,
  yanlis,
  ingilizce,
}: {
  metin: string;
  onClick: () => void;
  bitti: boolean;
  secili?: boolean;
  yanlis?: boolean;
  ingilizce?: boolean;
}) {
  const ton = bitti
    ? 'bg-grow-soft text-[#128a5f] opacity-60'
    : yanlis
      ? 'bg-blush text-white'
      : secili
        ? 'bg-brand text-white'
        : 'bg-sunken text-ink';

  return (
    <button
      onClick={onClick}
      disabled={bitti}
      className={`rounded-2xl px-3 py-3.5 text-sm font-bold transition-all active:scale-95 ${ton} ${
        ingilizce ? 'word' : ''
      }`}
    >
      {metin}
    </button>
  );
}
