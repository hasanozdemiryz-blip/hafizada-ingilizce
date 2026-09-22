-- SAKLAMA SURESININ ZAMANLANMASI
--
-- Bir onceki migration `bakim.olaylari_temizle()` fonksiyonunu
-- olusturdu ama cagiran yoktu. Yani public/gizlilik.html 5. maddedeki
-- "en fazla 24 ay saklanir" sozu bagli degildi — metin bir sey vaat
-- ediyor, kod onu yapmiyordu.
--
-- Ayri dosya olmasinin sebebi: pg_cron her projede acik degil. Tablo
-- olusturan migration'in ilk calismasini bu eklentiye baglamak
-- istemedik; tablo her kosulda kurulsun, zamanlama takilirsa yalnizca
-- kendisi takilsin.
create extension if not exists pg_cron;

select cron.unschedule('olaylari-temizle')
where exists (select 1 from cron.job where jobname = 'olaylari-temizle');

-- Her ayin 1'i, 04:00 UTC.
select cron.schedule(
  'olaylari-temizle',
  '0 4 1 * *',
  $$select bakim.olaylari_temizle(24)$$
);
