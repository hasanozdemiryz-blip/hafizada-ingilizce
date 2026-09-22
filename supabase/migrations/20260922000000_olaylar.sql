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

comment on table public.olaylar is 'Kullanim olcumu. Istemci: src/analitik.ts. Sema kaynagi: supabase/migrations/';
comment on column public.olaylar.olustu is 'Cihaz saati; yanlis olabilir';
comment on column public.olaylar.alindi is 'Sunucu saati; olustu ile farki saat kaymasi';
comment on column public.olaylar.kimlik is 'Profil.id — cihazda uretilmis rastgele numara, kisisel veri degil';
comment on column public.olaylar.ad is 'Olay adi. Bilerek enum/check yok — bkz. yukaridaki gerekce';

-- Gunluk tekil kullanici ve D1/D7 sorgulari bu iki indeksi kullaniyor.
--
-- ILK HALI CALISMIYORDU: `(kimlik, (olustu::date))` yazilmisti ve Postgres
-- reddetti — "functions in index expression must be marked IMMUTABLE".
-- timestamptz'yi date'e cevirmek sunucunun TimeZone ayarina bagli, yani
-- IMMUTABLE degil. (Bu SQL bir sure NOTLAR.md'de duruyordu; demek ki hic
-- calistirilmamis.)
--
-- Duz `(kimlik, olustu)` hem "bu kullanicinin olaylari, zaman sirali"
-- hem de tarih araligi sorgularini karsiliyor. Gun bazli gruplama
-- sorgu zamaninda yapiliyor, indekse gerek yok.
create index if not exists olaylar_kimlik_olustu on public.olaylar (kimlik, olustu);
create index if not exists olaylar_ad_olustu on public.olaylar (ad, olustu);

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
-- Fonksiyon burada, ZAMANLAMASI bir sonraki migration'da: pg_cron her
-- projede acik olmayabiliyor, bu migration'in ilk calismasini ona
-- baglamak istemedik.
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
