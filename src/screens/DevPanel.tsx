import { CARDS, BATCH } from '../content';
import { db } from '../db';
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
  async function ileriSar(gun: number) {
    const ms = gun * 86_400_000;
    const geri = (d: Date) => new Date(d.getTime() - ms);
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

      <p className="text-xs font-bold text-ink-faint mb-1.5">KISAYOL</p>
      <Dugme onClick={() => void desteyiDoldur()}>İlk paketi tanıştır</Dugme>
    </Card>
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
