import { useState } from 'react';
import { Button, Card, Ikon } from './ui';
import { shareHookBoard } from '../share';

/**
 * SET SONU.
 *
 * Havuzun bitmesi bir kusur degil, TASARLANMIS final. v1 seti gorseli hazir
 * olan kartlarla sinirli (bkz. content.ts); kullanici bir gun sonuna
 * varacak ve orada "kelime kalmadi" diyen bos bir ekranla karsilasmayacak.
 *
 * Ekranda uc sey var ve sirasi onemli:
 *   1. Bitirdigin sey                — emek gorunur olsun
 *   2. Kanca panosunu paylas         — gelir modeli kitle uzerinden; bitiren
 *                                      kullanici paylasmaya en yakin kisi
 *   3. Tekrarlar devam ediyor        — "bitti, uygulamayi silebilirim" degil
 *
 * Paylasilan sey kelime listesi degil KANCALAR: baskasinin kopyalayamayacagi
 * tek icerik o.
 */
export function SetFinale({
  kancalar,
  variant,
}: {
  kancalar: { en: string; hook: string }[];
  /** `ekran` — seti bitiren dersin sonunda; `kart` — ana ekranda, sonraki gunler */
  variant: 'ekran' | 'kart';
}) {
  const [paylasiliyor, setPaylasiliyor] = useState(false);

  const paylas = async () => {
    setPaylasiliyor(true);
    try {
      await shareHookBoard(kancalar);
    } catch {
      // Paylasim iptal edildi ya da desteklenmiyor: share.ts dosyayi indirmeye duser.
    } finally {
      setPaylasiliyor(false);
    }
  };

  const govde = (
    <>
      <p className="text-ink-soft mt-2 text-sm">
        Setteki {kancalar.length} kelimenin hepsini tanıdın.
      </p>

      <div className="mt-5">
        <Button variant="brand" onClick={paylas} disabled={paylasiliyor}>
          {paylasiliyor ? 'Hazırlanıyor…' : 'Kanca panosunu paylaş'}
        </Button>
      </div>

      {/*
        Bitis bir kapi degil: 26 kelime tanindi, KALICI olmadi. Tekrar
        cizelgesi haftalarca devam ediyor ve asil is orada. Bunu yazmazsak
        "bitti" kelimesi uygulamayi silmenin davetiyesi olur.
      */}
      <p className="text-xs text-ink-faint mt-4 leading-relaxed">
        Sonraki set hazırlanıyor. O gelene kadar tekrarların devam ediyor — bağlar asıl orada
        kalıcı oluyor.
      </p>
    </>
  );

  if (variant === 'kart') {
    return (
      <Card className="rise text-center py-8">
        <Ikon ad="kutlama" className="h-14 w-14 mx-auto mb-2" />
        <p className="word text-2xl font-extrabold">Seti bitirdin</p>
        {govde}
      </Card>
    );
  }

  return (
    <div className="text-center">
      <Ikon ad="kutlama" className="pop h-16 w-16 mx-auto" />
      <h1 className="word text-3xl font-bold mt-4">Seti bitirdin</h1>
      {govde}
    </div>
  );
}
