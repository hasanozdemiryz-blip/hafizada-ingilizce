import { useRef, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { BackButton, Button, Card, Screen, TopBar } from '../components/ui';
import {
  CERCEVELER,
  cerceveAcikMi,
  kilitYazisi,
  type Kazanim,
} from '../cerceveler';
import { AD_SINIR, HAYVANLAR, adDuzelt, rastgeleAd } from '../profil';
import type { Avatar as AvatarVerisi, Profil } from '../types';

/**
 * PROFILI DEGISTIR.
 *
 * Kullanici buraya gelmek ZORUNDA degil: profil ilk acilista kendiliginden
 * uretiliyor, adi ve yuzu hazir. Burasi isteyenin oynadigi yer — o yuzden
 * zorunlu alan, dogrulama uyarisi, "kaydet" baskisi yok. Ad bos birakilirsa
 * yenisi uretiliyor; bos profil diye bir sey olmuyor.
 */

/** Fotograf bu kenara kucultulur — IndexedDB'yi sismeden net gorunur. */
const FOTO_KENAR = 256;

/**
 * Secilen dosyayi KAREYE kirpip kucultur ve data URL dondurur.
 *
 * Ham dosya saklanmiyor: 4 MB'lik bir telefon fotografi hem IndexedDB'de
 * hem yedek dosyasinda oldugu gibi durur ve yedegi tasinmaz hale getirir.
 * Kirpma merkezden — portrede dogru olan bu.
 */
async function fotografiHazirla(dosya: File): Promise<string> {
  const url = URL.createObjectURL(dosya);
  try {
    const img = await new Promise<HTMLImageElement>((ok, hata) => {
      const el = new Image();
      el.onload = () => ok(el);
      el.onerror = () => hata(new Error('Görsel okunamadı'));
      el.src = url;
    });

    const kenar = Math.min(img.naturalWidth, img.naturalHeight);
    const tuval = document.createElement('canvas');
    tuval.width = FOTO_KENAR;
    tuval.height = FOTO_KENAR;
    tuval
      .getContext('2d')!
      .drawImage(
        img,
        (img.naturalWidth - kenar) / 2,
        (img.naturalHeight - kenar) / 2,
        kenar,
        kenar,
        0,
        0,
        FOTO_KENAR,
        FOTO_KENAR,
      );
    return tuval.toDataURL('image/webp', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Sekme = 'hayvan' | 'foto';

export function ProfilDuzenle({
  profil,
  kazanim,
  onKaydet,
  onKapat,
}: {
  profil: Profil;
  kazanim: Kazanim;
  onKaydet: (p: Profil) => void;
  onKapat: () => void;
}) {
  const [ad, setAd] = useState(profil.ad);
  const [avatar, setAvatar] = useState<AvatarVerisi>(profil.avatar);
  const [cerceve, setCerceve] = useState(profil.cerceve);
  const [sekme, setSekme] = useState<Sekme>(profil.avatar.tip);
  const [hata, setHata] = useState<string | null>(null);
  const dosyaGirisi = useRef<HTMLInputElement>(null);

  async function dosyaSecildi(dosya: File | undefined) {
    if (!dosya) return;
    setHata(null);
    try {
      setAvatar({ tip: 'foto', veri: await fotografiHazirla(dosya) });
    } catch {
      setHata('Bu dosya okunamadı. Başka bir görsel dene.');
    }
  }

  return (
    <Screen>
      <TopBar left={<BackButton onClick={onKapat} />} />

      <div className="flex-1 flex flex-col gap-4 pb-6">
        {/* --- Onizleme: degistirdigin sey hemen burada --- */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <Avatar avatar={avatar} cerceve={cerceve} boyut="xl" className="pop" />
          <p className="word text-xl font-extrabold">{ad.trim() || 'Adsız'}</p>
        </div>

        {/* --- Ad --- */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-ink-soft">Adın</h2>
            <button
              onClick={() => setAd(rastgeleAd())}
              className="rounded-full bg-sunken px-3 py-1.5 text-xs font-bold text-ink transition-all active:scale-95"
            >
              Karıştır
            </button>
          </div>
          <input
            value={ad}
            maxLength={AD_SINIR}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Adını yaz"
            className="w-full rounded-2xl bg-sunken px-4 py-3 text-sm outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-brand"
          />
          <p className="text-xs text-ink-faint mt-2">
            Boş bırakırsan sana eğlenceli bir ad seçeriz.
          </p>
        </Card>

        {/* --- Resim: hayvan ya da fotograf --- */}
        <Card>
          <h2 className="text-sm font-bold text-ink-soft mb-3">Resmin</h2>

          <div className="grid grid-cols-2 gap-1 rounded-full bg-sunken p-1 mb-4">
            {(
              [
                ['hayvan', 'Hayvanlar'],
                ['foto', 'Fotoğraf'],
              ] as const
            ).map(([id, baslik]) => (
              <button
                key={id}
                onClick={() => setSekme(id)}
                className={`rounded-full py-1.5 text-xs font-bold transition-all ${
                  sekme === id ? 'bg-white text-ink shadow-[var(--shadow-soft)]' : 'text-ink-faint'
                }`}
              >
                {baslik}
              </button>
            ))}
          </div>

          {sekme === 'hayvan' && (
            <div className="grid grid-cols-5 gap-2">
              {HAYVANLAR.map((h) => {
                const secili = avatar.tip === 'hayvan' && avatar.ad === h.dosya;
                return (
                  <button
                    key={h.dosya}
                    onClick={() => setAvatar({ tip: 'hayvan', ad: h.dosya })}
                    aria-label={h.ad}
                    /* Dugme resmin KENDISI kadar: halka tam kenarina otursun */
                    className={`block w-full rounded-full transition-all active:scale-95 ${
                      secili ? 'ring-2 ring-ink ring-offset-2' : ''
                    }`}
                  >
                    <Avatar avatar={{ tip: 'hayvan', ad: h.dosya }} boyut="tam" />
                  </button>
                );
              })}
            </div>
          )}

          {sekme === 'foto' && (
            <div className="text-center py-2">
              <button
                onClick={() => dosyaGirisi.current?.click()}
                className="rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition-all active:scale-95"
              >
                {avatar.tip === 'foto' ? 'Başka fotoğraf seç' : 'Fotoğraf yükle'}
              </button>
              {/*
                Fotograf CIHAZDA kaliyor. Yazili duruyor cunku "yukle"
                kelimesi nereye yuklendigini sormayi akla getiriyor.
              */}
              <p className="text-xs text-ink-faint mt-3 max-w-[30ch] mx-auto">
                Fotoğraf bu cihazda kalır, hiçbir yere gönderilmez. Kare olarak
                ortadan kırpılır.
              </p>
              {hata && <p className="text-xs text-blush mt-2 font-semibold">{hata}</p>}
            </div>
          )}

          <input
            ref={dosyaGirisi}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void dosyaSecildi(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </Card>

        {/* --- Cerceveler --- */}
        <Card>
          <h2 className="text-sm font-bold text-ink-soft">Çerçeven</h2>
          <p className="text-xs text-ink-faint mt-1 mb-3">
            Çerçeveler satın alınmaz, çalışınca açılır.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {CERCEVELER.map((c) => {
              const acik = cerceveAcikMi(c, kazanim);
              const secili = cerceve === c.ad;
              return (
                <button
                  key={c.ad}
                  onClick={() => acik && setCerceve(c.ad)}
                  disabled={!acik}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all ${
                    secili ? 'bg-sunken' : ''
                  } ${acik ? 'active:scale-95' : 'opacity-45'}`}
                >
                  <Avatar avatar={avatar} cerceve={c.ad} boyut="md" />
                  <span className="text-[11px] font-bold leading-none mt-0.5">{c.baslik}</span>
                  {!acik && (
                    <span className="text-[10px] text-ink-faint leading-tight">
                      {kilitYazisi(c)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="shrink-0">
        <Button
          variant="brand"
          onClick={() => onKaydet({ ...profil, ad: adDuzelt(ad), avatar, cerceve })}
        >
          Tamam
        </Button>
      </div>
    </Screen>
  );
}
