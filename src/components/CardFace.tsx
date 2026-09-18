import { useEffect } from 'react';
import { CardVisual } from './CardVisual';
import { seslendir } from '../speech';
import { Card as CardShell, HookChip, SpeakButton } from './ui';
import type { Card } from '../types';

/**
 * YENI KELIME — tanisma yuzu.
 *
 * Gizlenen hicbir sey yok: amac "haa" anini yasatmak. Burada soru
 * sorulmaz, not verilmez. Kancanin tutup tutmadigi hemen ardindaki
 * ogrenme testinde OLCULUR (bkz. scheduler.ts `learningCheck`) — once
 * kullaniciya soruluyordu ve bu bir beyandi.
 */
export function LearnFace({ card }: { card: Card }) {
  return (
    <CardShell className="w-full">
      <CardVisual card={card} />
      <div className="flex flex-col items-center gap-3 pt-5">
        <p className="word text-[2.75rem] leading-none font-extrabold">{card.en}</p>
        <p className="word text-xl leading-none font-semibold text-ink-soft">{card.tr}</p>
        <HookChip big>
          {card.en} ≈ {card.hook}
        </HookChip>
        <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">“{card.sentence}”</p>
      </div>
    </CardShell>
  );
}

/**
 * YAZMA — merdivenin 5. basamagi.
 * Gorsel ve cumle YOK: cumlelerin %80'inde Turkce karsilik geciyor,
 * gorsel de kancayi resmediyor; ikisi de ipucu olurdu.
 */
export function WriteFace({ card, hookRevealed }: { card: Card; hookRevealed: boolean }) {
  return (
    <CardShell className="w-full">
      <div className="flex flex-col items-center gap-3 py-8">
        <span className="text-sm text-ink-faint">İngilizcesi ne?</span>
        <p className="text-[2.5rem] leading-none font-extrabold text-center">{card.tr}</p>
        {hookRevealed && (
          <span className="pop">
            <HookChip>{card.hook}</HookChip>
          </span>
        )}
      </div>
    </CardShell>
  );
}

/**
 * DINLEME — merdivenin son basamagi.
 *
 * Kanca telaffuzu ogretemez, hatta yanlisini ogretir (`sell ≈ sel`).
 * Bu yuz onun panzehiri: kelime yazili hic gorunmeden, sadece duyularak
 * taninmali. Tekrar dinlemek serbest ve yardim sayilmaz — sinav telaffuzu
 * TANIMAK, tek seferde yakalamak degil.
 */
export function ListenFace({ card, hookRevealed }: { card: Card; hookRevealed: boolean }) {
  useEffect(() => {
    seslendir(card.en);
  }, [card.en]);

  return (
    <CardShell className="w-full">
      <div className="flex flex-col items-center gap-4 py-10">
        <span className="text-sm text-ink-faint">Ne duyuyorsun?</span>
        <button
          type="button"
          aria-label="Tekrar dinle"
          onClick={() => seslendir(card.en)}
          className="h-24 w-24 rounded-full bg-brand text-4xl text-white shadow-[0_14px_30px_-12px_rgba(79,146,246,0.95)] transition-all active:scale-90"
        >
          🔊
        </button>
        <span className="text-sm text-ink-faint">dokun, tekrar dinle</span>
        {hookRevealed && (
          <span className="pop">
            <HookChip>{card.hook}</HookChip>
          </span>
        )}
      </div>
    </CardShell>
  );
}

/** Cevap yuzu — her zaman TAM bilgi. Kelime, anlam, kanca, cumle, ses. */
export function AnswerFace({ card }: { card: Card }) {
  return (
    <CardShell className="w-full rise">
      <CardVisual card={card} size="compact" />
      <div className="flex flex-col items-center gap-3 pt-5">
        <div className="flex items-center gap-2.5">
          <p className="word text-xl leading-none font-semibold text-ink-faint">{card.en}</p>
          <SpeakButton word={card.en} size="small" />
        </div>
        <p className="word text-[2.5rem] leading-none font-extrabold text-center">{card.tr}</p>
        <HookChip>
          {card.en} ≈ {card.hook}
        </HookChip>
        <p className="text-center text-ink-soft leading-relaxed max-w-[30ch]">“{card.sentence}”</p>
      </div>
    </CardShell>
  );
}
