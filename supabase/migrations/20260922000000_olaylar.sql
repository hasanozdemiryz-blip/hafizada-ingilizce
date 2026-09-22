-- KULLANIM OLCUMU TABLOSU
--
-- Istemci tarafi: src/analitik.ts. Oradan PostgREST'e duz bir HTTP
-- INSERT atiliyor (SDK yok, pakete sifir bayt).
--
-- NEDEN MIGRATION DOSYASI. Bu SQL bir sure NOTLAR.md'de duruyordu ve
-- panele elle yapistiriliyordu. Boyle olunca "uretimdeki tablo hangi
-- haldeydi" sorusunun cevabi hicbir yerde yazmiyor. Artik depoda.

create table if not exists public.olaylar (
  id       bigint generated always as identity primary key,

  -- Cihazin saati. Yanlis olabilir; dogrusu icin `alindi`ya bakilir.
  olustu   timestamptz not null,
  -- Sunucu zamani. Ikisinin farki saat kaymasini gosteriyor.
  alindi   timestamptz not null default now(),

  -- Profil.id: cihazda uretilmis rastgele numara. Kisisel veri DEGIL;
  -- kullaniciyi uygulama disinda hicbir seye baglamiyor (bkz. profil.ts).
  kimlik   text not null,

  -- Olay adi. TypeScript tarafinda sabit bir birlesim tipi (`type Olay`).
  --
  -- BILEREK burada enum/check YOK: kisitlasaydik, kodda yeni bir olay
  -- eklenip migration unutuldugunda sunucu 4xx doner, istemci de 4xx'i
  -- "kalici hata" sayip kayitlari ATAR. Yani sessiz ve geri donulmez
  -- veri kaybi. Yazim hatasini zaten derleme yakaliyor.
  ad       text not null,

  veri     jsonb,
  surum    text,
  platform text,

  -- Anahtar herkese acik oldugu icin (bkz. asagisi) tabloya cop
  -- yazilabilir. Bu siniri asan sey en azindan olcumu sismez.
  constraint olaylar_makul check (
    length(kimlik) <= 64
    and length(ad) <= 64
    and (surum is null or length(surum) <= 32)
    and (platform is null or length(platform) <= 32)
    and (veri is null or pg_column_size(veri) <= 4096)
  )
);

-- Gunluk tekil kullanici ve D1/D7 sorgulari bu iki indeksi kullaniyor.
create index if not exists olaylar_kimlik_gun on public.olaylar (kimlik, (olustu::date));
create index if not exists olaylar_ad on public.olaylar (ad, olustu);

-- ---------------------------------------------------------------------
-- SATIR DUZEYI GUVENLIK
--
-- `anon` anahtari GIZLI DEGILDIR: istemciye gonderiliyor, APK'dan
-- cikarilabiliyor. Guvenligi saglayan sey anahtarin saklanmasi degil,
-- bu politika: yalnizca INSERT. Kimse yazilani geri OKUYAMAZ,
-- guncelleyemez, silemez.
-- ---------------------------------------------------------------------
alter table public.olaylar enable row level security;

drop policy if exists "anon ekleyebilir" on public.olaylar;
create policy "anon ekleyebilir" on public.olaylar
  for insert to anon with check (true);

-- ---------------------------------------------------------------------
-- SAKLAMA SURESI
--
-- Gizlilik politikasi 24 ay soz veriyor (public/gizlilik.html, 5. madde).
-- Fonksiyon burada versiyonlu duruyor; ZAMANLAMASI ayri bir adim
-- (bkz. NOTLAR.md), cunku pg_cron her projede acik olmayabiliyor ve
-- migration'in ilk calismasini riske atmak istemiyoruz.
--
-- Fonksiyon `public` DISINDA bir semada: PostgREST yalnizca `public`i
-- disa aciyor. Burada olsaydi `security definer` bir silme fonksiyonu
-- anon anahtariyla RPC olarak cagrilabilir, yani herkes olcumu
-- supurebilirdi.
-- ---------------------------------------------------------------------
create schema if not exists bakim;

create or replace function bakim.olaylari_temizle(ay int default 24)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare silinen bigint;
begin
  delete from public.olaylar where olustu < now() - (ay || ' months')::interval;
  get diagnostics silinen = row_count;
  return silinen;
end;
$$;

revoke all on schema bakim from public, anon, authenticated;
revoke all on function bakim.olaylari_temizle(int) from public, anon, authenticated;
