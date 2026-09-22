import { IC_ORAN, cerceveUrl, hayvanUrl } from '../avatarlar';
import type { Avatar as AvatarVerisi } from '../types';

/**
 * Profil avatari: resim + cerceve.
 *
 * Cerceve bir PNG ve icinde delik var; resim o deligin tam capinda,
 * deligin tam ortasinda duruyor. Delik orani uretimde olculuyor ve
 * `olcu.json` ile geliyor (bkz. tools/make-frames.mjs) — burada elle
 * yazili bir sayi yok, cunku cerceve seti degisince avatarin sessizce
 * kaymasi en zor fark edilen hata olurdu.
 *
 * Resim cercevenin ALTINDA cizilir: dikenli ve kivrimli cerceveler
 * delige biraz tastigi icin ustte kalmalari gerekiyor.
 */

/**
 * Dis kenar (cerceve dahil) — ic resim bunun `IC_ORAN` kadari olur.
 *
 * `tam`: sabit piksel yerine KAPSAYICIYI doldurur. Secim izgarasinda
 * gerekli — orada dugme izgara hucresi kadar genis, avatar ise sabit
 * 68 pikseldi ve secim halkasi resmin cevresinde bos bir daire olarak
 * duruyordu, bozuk gibi gorunuyordu.
 */
const BOYUT = { sm: 58, md: 68, lg: 104, xl: 132, tam: null } as const;

export function Avatar({
  avatar,
  cerceve,
  boyut = 'md',
  className = '',
}: {
  avatar: AvatarVerisi;
  /** Cerceve adi; verilmezse yalnizca resim cizilir (secim izgarasi) */
  cerceve?: string;
  boyut?: keyof typeof BOYUT;
  className?: string;
}) {
  const dis = BOYUT[boyut];
  const icOran = cerceve ? IC_ORAN : 1;
  const kaynak = avatar.tip === 'foto' ? avatar.veri : hayvanUrl(avatar.ad);

  /* `tam`'da olculer yuzde: kapsayici ne kadarsa avatar o kadar. */
  const disOlcu = dis === null ? { width: '100%', aspectRatio: '1' } : { width: dis, height: dis };
  const icOlcu =
    dis === null
      ? { width: `${icOran * 100}%`, aspectRatio: '1' }
      : { width: Math.round(dis * icOran), height: Math.round(dis * icOran) };

  return (
    /*
      `grid`, `inline-grid` DEGIL. Satir ici bir ogenin altinda taban
      cizgisi boslugu kaliyor ve kapsayici dugme resimden uzun oluyordu;
      secim halkasi da o yuzden resmin cevresinde genis bir daire olarak
      duruyordu. Blok seviyesinde bosluk olusmuyor.
    */
    <span
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={disOlcu}
    >
      <span className="absolute overflow-hidden rounded-full bg-sunken" style={icOlcu}>
        <img src={kaynak} alt="" className="h-full w-full rounded-full object-cover" />
      </span>
      {cerceve && (
        <img
          src={cerceveUrl(cerceve)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full pointer-events-none"
        />
      )}
    </span>
  );
}
