import { CARDS, BATCH } from '../content';
import { firstCheckRate, produceRate, unaidedRate, weakestHooks } from '../quality';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getState, setState } from '../db';
import { todayKey } from '../dates';
import { Card } from '../components/ui';
import type { Progress, Step } from '../types';

/**
 * Gelistirme paneli — YALNIZCA `npm run dev`.
 *
 * Sistemin geri bildirim dongusu gunlerle olculuyor: bir kartin uretim
 * asamasina gelmesi 4 ardisik yardimsiz basari istiyor ve FSRS her
 * basaridan sonra karti gunlerce ileri atiyor. Yani yeni yazilan bir
 * zamanlama/asama davranisini elle gozlemlemek haftalar surer.
 *
 * Bu panel zamani ileri sarar; kisayol degil SIMULASYON — kartlar gercek
 * kurallarla ilerler. Asama dugmeleri ise yalnizca ekrana bakmak icin.
 *
 * `import.meta.env.DEV` false oldugunda Vite bu bileseni tamamen eler;
 * uretim derlemesine tek satiri girmez.
 */
export function DevPanel() {
  const progress = useLiveQuery(() => db.progress.toArray(), [], []);

  /**
   * Kanca kalite sinyalleri.
   *
   * Once Ilerleme sekmesinde, kullaniciya gosteriliyordu. Iki sebeple
   * buraya tasindi:
   *   · Ogrenen icin gurultu — "kanca ekrandan kalkinca durdu %62" cumlesi
   *     Ingilizce ogrenen birine hicbir sey soylemiyor
   *   · Yazar icin de tek kisinin verisi karar vermeye yetmiyor; bu olcum
   *     ancak cok kullanicidan toplanınca anlam kazanir (local-first oldugu
   *     surece yazara zaten ulasmiyor)
   *
   * Sinyaller toplanmaya devam ediyor ve yedege giriyor; yalnizca ekrandan
   * cekildi.
   */
  const ilk = firstCheckRate(progress);
  const kancasiz = unaidedRate(progress);
  const uretim = produceRate(progress);
  const zayiflar = weakestHooks(progress, 6);

  /**
   * Zaman ileri sarar — aslinda BUTUN kayitlari geri kaydirarak.
   *
   * Once yalnizca `progress` kaydiriliyordu. Simulasyon o haliyle yalan
   * soyluyordu: gunluk etkinlik, seri ve cevap gunlugu bugunde kaliyor,
   * yani alti gunluk bir tur tek gune yigiliyor, "yeni gun" hic gelmiyor
   * ve seri hic artmiyordu. Zamanin geri kaydirilmadigi her kayit,
   * simulasyonda bozuk bir ekran demek.
   */
  async function ileriSar(gun: number) {
    const ms = gun * 86_400_000;
    const geri = (d: Date) => new Date(d.getTime() - ms);
    /** YYYY-MM-DD anahtarini yerel ogleye sabitleyip kaydirir */
    const geriAnahtar = (key: string) => {
      const [y, m, d] = key.split('-').map(Number);
      return todayKey(geri(new Date(y, m - 1, d, 12, 0, 0)));
    };

    const hepsi = await db.progress.toArray();
    await db.progress.bulkPut(
      hepsi.map((p) => ({
        ...p,
        due: geri(p.due),
        // gunluk yeni kelime butcesi de acilsin
        introducedAt: p.introducedAt ? geri(new Date(p.introducedAt)).toISOString() : null,
        fsrs: {
          ...p.fsrs,
          due: geri(p.fsrs.due),
          last_review: p.fsrs.last_review ? geri(p.fsrs.last_review) : undefined,
        },
      })),
    );

    // Cevap gunlugu: Basari pencereleri dogru gunlere dagilsin
    const cevaplar = await db.answers.toArray();
    await db.answers.bulkPut(
      cevaplar.map((c) => {
        const ts = c.ts - ms;
        return { ...c, ts, gun: todayKey(new Date(ts)) };
      }),
    );

    // Gunluk etkinlik ve seri: "yeni gun" gelsin, seri islesin
    const state = await getState();
    await setState({
      days: Object.fromEntries(
        Object.entries(state.days).map(([k, v]) => [geriAnahtar(k), v]),
      ),
      lastSessionDate: state.lastSessionDate ? geriAnahtar(state.lastSessionDate) : null,
    });
  }

  /** Tanisilmis kartlari dogrudan bir basamaga tasir — sadece ekrani gormek icin. */
  async function asamayaTasi(step: Step) {
    const hepsi = await db.progress.toArray();
    const hedef = hepsi.filter((p) => p.introduced);
    if (hedef.length === 0) return;
    await db.progress.bulkPut(
      hedef.map((p): Progress => ({ ...p, step, due: new Date(), fsrs: { ...p.fsrs, due: new Date() } })),
    );
  }

  /**
   * Ilk destenin EKSIK kartlarini tanistirir.
   *
   * Once hepsini yeniden yaziyordu ve tanisilmis kartlarin ilerlemesini —
   * asamasini, kalite sinyallerini — sessizce siliyordu. Test sirasinda
   * "Gözden geçirilecek kancalar" listesinin bir anda bosalmasinin sebebi
   * buydu: hata uygulamada degil, bu kisayoldaydi.
   */
  async function desteyiDoldur() {
    const { introduceCard } = await import('../scheduler');
    const now = new Date();
    const mevcut = new Set((await db.progress.toArray()).map((p) => p.cardId));
    const eksik = CARDS.slice(0, BATCH).filter((c) => !mevcut.has(c.id));
    if (eksik.length === 0) return;
    await db.progress.bulkPut(eksik.map((c) => introduceCard(c, now)));
  }

  return (
    <Card className="border-2 border-dashed border-blush">
      <h2 className="text-sm font-bold text-[#c2417f] mb-1">Geliştirme paneli</h2>
      <p className="text-sm text-ink-soft mb-3">
        Sadece <code>npm run dev</code>'de görünür. Üretim derlemesine girmez.
      </p>

      <p className="text-xs font-bold text-ink-faint mb-1.5">ZAMANI İLERİ SAR</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <Dugme onClick={() => void ileriSar(1)}>+1 gün</Dugme>
        <Dugme onClick={() => void ileriSar(7)}>+7 gün</Dugme>
        <Dugme onClick={() => void ileriSar(30)}>+30 gün</Dugme>
      </div>

      <p className="text-xs font-bold text-ink-faint mb-1.5">BASAMAĞA TAŞI (tanışılmış kartlar)</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {([1, 2, 3, 4, 5, 6] as const).map((n) => (
          <Dugme key={n} onClick={() => void asamayaTasi(n)}>
            {n}
          </Dugme>
        ))}
      </div>

      <p className="text-xs font-bold text-ink-faint mb-1.5">KANCA KALİTESİ</p>
      <div className="mb-3 rounded-2xl bg-white/60 p-3 text-xs">
        <Oran ad="İlk denemede tuttu" v={ilk} />
        <Oran ad="Kanca kalkınca durdu" v={kancasiz} />
        <Oran ad="İlk yazmada üretildi" v={uretim} />
        {zayiflar.length > 0 && (
          <ul className="mt-2 border-t border-line pt-2">
            {zayiflar.map(({ card, reason }) => (
              <li key={card.id} className="flex justify-between gap-2 py-0.5">
                <span className="font-bold">
                  {card.en} ≈ {card.hook}
                </span>
                <span className="text-ink-faint text-right">{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs font-bold text-ink-faint mb-1.5">KISAYOL</p>
      <Dugme onClick={() => void desteyiDoldur()}>İlk paketi tanıştır</Dugme>
    </Card>
  );
}

function Oran({ ad, v }: { ad: string; v: { percent: number; of: number } | null }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-ink-soft">{ad}</span>
      <span className="tabular-nums font-bold">
        {v ? `%${v.percent} (${v.of})` : '—'}
      </span>
    </div>
  );
}

function Dugme({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-sunken px-3.5 py-2 text-sm font-bold text-ink transition-all active:scale-95 hover:bg-blush-soft"
    >
      {children}
    </button>
  );
}
