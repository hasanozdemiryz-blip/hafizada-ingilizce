import { Button, Ikon, Screen } from './ui';
import type { IkonAd } from '../icons';

/**
 * GECIS ANI — bolum ve bolge araligi.
 *
 * Ders uzun bir duz akisti: bes kelime x alti basamak = otuz soru, arada
 * hicbir kapanis hissi yok. Bu ekran o akisa ritim veriyor.
 *
 * KUTLAMA DEGIL, bilerek. "Tebrikler!" demiyor, konfeti atmiyor. Iki
 * sebep:
 *
 * 1. Bu urunde kutlanacak iki an zaten var ve ikisi de nadir: ders sonu
 *    (`SessionDone`) ve setin bitmesi (`SetFinale` — "bir kez yasanan
 *    an"). Her asamaya tebrik koymak o ikisini duzlestirir.
 * 2. Asama bitirmek bir basari degil. 1-2. basamakta kanca ekranda
 *    duruyor (bkz. `olculebilir`), yani oradaki dogru "kanca tuttu"
 *    demiyor. Katilimi odullendirmek, bu urunun "beyan yerine olcum"
 *    ilkesinin tam tersi olurdu.
 *
 * Onun yerine uc sey soyluyor: ne kapandi, ne kadar dogru yapildi,
 * ne aciliyor. Sayi GERCEK — uydurma bir puan degil.
 */
export function Gecis({
  ikon,
  renk,
  baslik,
  sayi,
  sonraki,
  onDevam,
}: {
  ikon: IkonAd;
  /** Bolge rengi — merdivenin uc bolgesi, Egzersiz ve Ilerleme ile ayni */
  renk: 'brand' | 'spark' | 'grow';
  /** Az once YAPILAN sey, gecmis zaman: "Tanıdın" */
  baslik: string;
  /** Gercek bir olcum satiri — yoksa hic gosterilmez */
  sayi?: string;
  /** Sirada ne var */
  sonraki: string;
  onDevam: () => void;
}) {
  /*
    Tailwind sinif adlarini CALISMA aninda birlestirmek ise yaramaz:
    derleyici kaynak metinde gormedigi sinifi uretmiyor. O yuzden tam
    adlar burada yazili duruyor.
  */
  const zemin = {
    brand: 'bg-brand-soft',
    spark: 'bg-spark-soft',
    grow: 'bg-grow-soft',
  }[renk];

  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center items-center gap-5 text-center">
        <div className={`pop grid h-24 w-24 place-items-center rounded-full ${zemin}`}>
          <Ikon ad={ikon} className="h-12 w-12" />
        </div>

        <div className="rise delay-1">
          <h1 className="word text-3xl font-extrabold">{baslik}</h1>
          {sayi && <p className="text-ink-soft mt-2 tabular-nums">{sayi}</p>}
        </div>

        <p className="rise delay-2 text-sm text-ink-faint max-w-[26ch]">{sonraki}</p>
      </div>

      <div className="shrink-0">
        <Button variant="brand" onClick={onDevam}>
          Devam
        </Button>
      </div>
    </Screen>
  );
}
