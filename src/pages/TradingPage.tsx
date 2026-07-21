// ─── ZERO COMMAND — TradingPage.tsx ──────────────────────────────────────────
// 4-Slot Day Trade System | Risk Kalkulator | X30 Compounding | Trading Journal
import { useState, useMemo } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, BookOpen, Target,
  DollarSign, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Plus, Trash2, PieChart,
} from 'lucide-react';
import { cloudSet } from '@/lib/cloudStorage';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface JournalEntry {
  id: string;
  date: string;
  slot: number;
  pair: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  tp: number;
  sl: number;
  leverage: number;
  modal: number;
  profitIdr: number;
  status: 'WIN' | 'LOSS' | 'BE';
  notes: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SLOT_CONFIG = [
  {
    slot: 1, mode: 'CROSS', leverage: '20x–40x', modal: 3_750_000,
    desc: 'High Confidence Scalp', targetMin: 500_000, targetMax: 1_000_000,
    color: '#2563eb', bg: '#2563eb15',
    strategy: 'Entry setelah konfirmasi Coinglass liquidation zone tebal. Volume spike ≥200%. EMA20 searah.',
  },
  {
    slot: 2, mode: 'ISOLATED', leverage: '10x–20x', modal: 3_750_000,
    desc: 'Momentum / Breakout', targetMin: 300_000, targetMax: 600_000,
    color: '#7c3aed', bg: '#7c3aed15',
    strategy: 'Breakout konfirmasi 1 candle close di atas resistance. OI naik + funding rate < +0.1%.',
  },
  {
    slot: 3, mode: 'ISOLATED', leverage: '10x–15x', modal: 3_750_000,
    desc: 'Retest Sniper', targetMin: 300_000, targetMax: 500_000,
    color: '#059669', bg: '#05906915',
    strategy: 'Retest support/resistance. Tunggu rejection candle. CryptoQuant netflow negatif untuk long.',
  },
  {
    slot: 4, mode: 'CROSS', leverage: '5x–10x', modal: 3_750_000,
    desc: 'Safe Setup / End of Day', targetMin: 300_000, targetMax: 500_000,
    color: '#d97706', bg: '#d9770615',
    strategy: 'Low-risk end of day setup. Hanya saat market jelas trennya. Target kecil, RR minimal 1:2.',
  },
];

// X30 Roadmap — Rp33jt → Rp1M
const X30_ROADMAP = [
  { bulan: 1, awal: 33, profit: 15, hidup: 0, akhir: 48 },
  { bulan: 2, awal: 48, profit: 22, hidup: 0, akhir: 70 },
  { bulan: 3, awal: 70, profit: 30, hidup: 0, akhir: 100 },
  { bulan: 4, awal: 100, profit: 30, hidup: 10, akhir: 120 },
  { bulan: 5, awal: 120, profit: 36, hidup: 10, akhir: 146 },
  { bulan: 6, awal: 146, profit: 44, hidup: 10, akhir: 180 },
  { bulan: 7, awal: 180, profit: 54, hidup: 10, akhir: 224 },
  { bulan: 8, awal: 224, profit: 67, hidup: 10, akhir: 281 },
  { bulan: 9, awal: 281, profit: 84, hidup: 10, akhir: 355 },
  { bulan: 10, awal: 355, profit: 107, hidup: 10, akhir: 452 },
  { bulan: 11, awal: 452, profit: 136, hidup: 10, akhir: 578 },
  { bulan: 12, awal: 578, profit: 422, hidup: 10, akhir: 1000 },
];

const JOURNAL_KEY = 'zero-trading-journal-v2';
function loadJournal(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); } catch { return []; }
}
function saveJournal(entries: JournalEntry[]) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  cloudSet(JOURNAL_KEY, entries);
}

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 12,
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-surface)',
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Icon size={15} color="var(--color-muted)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'monospace', letterSpacing: 1.5, flex: 1 }}>
          {title}
        </span>
        {open ? <ChevronUp size={14} color="var(--color-muted)" /> : <ChevronDown size={14} color="var(--color-muted)" />}
      </button>
      {open && <div style={{ padding: 18 }}>{children}</div>}
    </div>
  );
}

// ─── 4-SLOT SYSTEM ────────────────────────────────────────────────────────────
function FourSlotSystem() {
  return (
    <Section title="4-SLOT DAY TRADE SYSTEM" icon={Target}>
      {/* Summary */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 8,
        padding: '12px 16px', marginBottom: 16,
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Modal', value: 'Rp15.000.000', sub: '4 slot × Rp3.75jt' },
            { label: 'Target Harian', value: 'Rp1.5–2.5 jt', sub: '2–4 trade ideal' },
            { label: 'Max Daily Loss', value: 'Rp750rb–1jt', sub: 'Stop jika 2–3 SL berturut' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 1 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slot Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SLOT_CONFIG.map(slot => (
          <div key={slot.slot} style={{
            borderRadius: 10, border: `1px solid ${slot.color}30`,
            background: slot.bg, overflow: 'hidden',
          }}>
            {/* Slot Header */}
            <div style={{
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: `1px solid ${slot.color}20`,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                background: slot.color, color: 'white',
                padding: '2px 8px', borderRadius: 4,
              }}>
                SLOT {slot.slot}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                {slot.desc}
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: 10,
                padding: '2px 8px', borderRadius: 4,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)', fontFamily: 'monospace',
              }}>
                {slot.mode}
              </span>
            </div>

            {/* Slot Details */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
                {[
                  { label: 'Modal', value: `Rp${(slot.modal / 1_000_000).toFixed(2)}jt` },
                  { label: 'Leverage', value: slot.leverage },
                  { label: 'Target Min', value: `Rp${(slot.targetMin / 1000).toFixed(0)}rb` },
                  { label: 'Target Max', value: `Rp${(slot.targetMax / 1_000_000).toFixed(1)}jt` },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: slot.color, marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                💡 {slot.strategy}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div style={{
        marginTop: 14, padding: '12px 14px', borderRadius: 8,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 1, marginBottom: 8 }}>
          ⚠️ ATURAN WAJIB
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {[
            'Jangan open lebih dari 2 slot/hari',
            'Tutup semua posisi sebelum tidur',
            'Stop jika 2–3 SL berturut-turut',
            'Jangan campur slot — tiap slot strategi beda',
            'SL wajib sebelum entry',
            'Liquidation price harus > SL',
          ].map(rule => (
            <div key={rule} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--color-text)' }}>
              <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0 }}>✗</span>
              {rule}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── RISK CALCULATOR ──────────────────────────────────────────────────────────
function RiskCalculator() {
  const [modal, setModal] = useState(937.5);   // USD
  const [riskPct, setRiskPct] = useState(2);
  const [entry, setEntry] = useState(95000);
  const [sl, setSl] = useState(94000);
  const [leverage, setLeverage] = useState(20);

  const riskUsd = (modal * riskPct) / 100;
  const slDistance = Math.abs(entry - sl);
  const slPct = entry > 0 ? slDistance / entry * 100 : 0;
  const contracts = slDistance > 0 ? riskUsd / slDistance : 0;
  const nominal = contracts * entry;
  const margin = leverage > 0 ? nominal / leverage : 0;
  const tp1 = entry > sl ? entry + slDistance * 2 : entry - slDistance * 2;
  const tp2 = entry > sl ? entry + slDistance * 3 : entry - slDistance * 3;
  const isLong = entry > sl;
  const marginOk = margin <= modal * 0.1;
  const rrRatio = slDistance > 0 ? ((Math.abs(tp1 - entry)) / slDistance).toFixed(1) : '—';

  return (
    <Section title="KALKULATOR RISK — ISOLATED MODE" icon={Calculator}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Inputs */}
        {[
          { label: 'Modal Futures (USD)', value: modal, set: setModal, step: 50 },
          { label: 'Risk per Trade (%)', value: riskPct, set: setRiskPct, step: 0.5, max: 5 },
          { label: 'Entry Price (USD)', value: entry, set: setEntry, step: 100 },
          { label: 'Stop Loss (USD)', value: sl, set: setSl, step: 100 },
          { label: 'Leverage (×)', value: leverage, set: setLeverage, step: 5, max: 50 },
        ].map(inp => (
          <div key={inp.label}>
            <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
              {inp.label}
            </label>
            <input
              type="number"
              value={inp.value}
              step={inp.step}
              max={inp.max}
              onChange={e => inp.set(Number(e.target.value))}
              style={{
                width: '100%', padding: '8px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: 'var(--color-surface)', color: 'var(--color-text)',
                outline: 'none',
              }}
            />
          </div>
        ))}
        {/* Direction indicator */}
        <div>
          <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
            DIRECTION
          </label>
          <div style={{
            padding: '8px 10px', borderRadius: 6,
            background: isLong ? '#05906920' : '#dc262620',
            border: `1px solid ${isLong ? '#059669' : '#dc2626'}40`,
            fontSize: 14, fontWeight: 700,
            color: isLong ? '#059669' : '#dc2626',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {isLong ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isLong ? 'LONG' : 'SHORT'}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 10,
        border: '1px solid var(--color-border)', padding: 16,
      }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 1.5, marginBottom: 12 }}>
          HASIL KALKULASI
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Risk Amount', value: `$${riskUsd.toFixed(2)}`, sub: `${riskPct}% dari modal`, ok: true },
            { label: 'SL Distance', value: `$${slDistance.toFixed(0)}`, sub: `${slPct.toFixed(2)}% dari entry`, ok: true },
            { label: 'Contracts', value: contracts.toFixed(6), sub: 'qty posisi', ok: true },
            { label: 'Nominal', value: `$${nominal.toFixed(0)}`, sub: 'ukuran posisi', ok: true },
            { label: 'Margin Needed', value: `$${margin.toFixed(2)}`, sub: `${((margin/modal)*100).toFixed(1)}% modal`, ok: marginOk },
            { label: 'RR Ratio', value: `1:${rrRatio}`, sub: 'risk:reward', ok: Number(rrRatio) >= 2 },
          ].map(item => (
            <div key={item.label} style={{
              padding: '10px 12px', borderRadius: 8,
              background: item.ok ? 'var(--color-card)' : '#fee2e215',
              border: `1px solid ${item.ok ? 'var(--color-border)' : '#dc262630'}`,
            }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: item.ok ? 'var(--color-text)' : '#dc2626', marginTop: 2 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Take Profit Targets */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: '#05906910', border: '1px solid #05906930' }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#059669', letterSpacing: 1 }}>TP1 — RR 1:2</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 2 }}>${tp1.toFixed(0)}</div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: '#2563eb10', border: '1px solid #2563eb30' }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#2563eb', letterSpacing: 1 }}>TP2 — RR 1:3</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginTop: 2 }}>${tp2.toFixed(0)}</div>
          </div>
        </div>

        {/* Warning */}
        {!marginOk && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: '#fee2e215', border: '1px solid #dc262630',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
            color: '#dc2626',
          }}>
            <AlertTriangle size={14} />
            Margin melebihi 10% modal! Kurangi leverage atau perbesar SL distance.
          </div>
        )}
        {marginOk && contracts > 0 && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: '#05906910', border: '1px solid #05906930',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
            color: '#059669',
          }}>
            <CheckCircle size={14} />
            Setup valid. Margin terkendali. Pasang SL sebelum entry!
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── X30 COMPOUNDING TRACKER ──────────────────────────────────────────────────
function CompoundingTracker() {
  const [currentMonth, setCurrentMonth] = useState(1);
  const [currentBalance, setCurrentBalance] = useState(33);

  const currentRow = X30_ROADMAP[currentMonth - 1];
  const progress = currentRow ? (currentBalance / currentRow.akhir) * 100 : 0;
  const totalTarget = 1000;
  const overallProgress = (currentBalance / totalTarget) * 100;

  return (
    <Section title="X30 COMPOUNDING TRACKER — Rp33jt → Rp1M" icon={TrendingUp}>
      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
            BULAN SEKARANG
          </label>
          <select
            value={currentMonth}
            onChange={e => setCurrentMonth(Number(e.target.value))}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid var(--color-border)', borderRadius: 6,
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 14, fontWeight: 600, outline: 'none',
            }}
          >
            {X30_ROADMAP.map(r => (
              <option key={r.bulan} value={r.bulan}>Bulan {r.bulan}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
            BALANCE SEKARANG (JT)
          </label>
          <input
            type="number"
            value={currentBalance}
            step={1}
            onChange={e => setCurrentBalance(Number(e.target.value))}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid var(--color-border)', borderRadius: 6,
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 14, fontWeight: 600, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Progress Cards */}
      {currentRow && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1 }}>TARGET BULAN INI</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>Rp{currentRow.akhir}jt</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>+Rp{currentRow.profit}jt profit</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1 }}>PROGRESS BULAN</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: progress >= 100 ? '#059669' : '#d97706', marginTop: 4 }}>
              {progress.toFixed(0)}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
              Rp{currentBalance}jt / Rp{currentRow.akhir}jt
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1 }}>OVERALL X30</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>{overallProgress.toFixed(1)}%</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>dari Rp1.000jt</div>
          </div>
        </div>
      )}

      {/* Progress Bar Overall */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Rp33jt</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>X30 MENUJU KEABADIAN</span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Rp1.000jt</span>
        </div>
        <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(overallProgress, 100)}%`,
            background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
            borderRadius: 4, transition: 'width .5s',
          }} />
        </div>
      </div>

      {/* Roadmap Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-surface)' }}>
              {['Bulan', 'Modal Awal', 'Target Profit', 'Uang Hidup', 'Modal Akhir'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left',
                  fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                  color: 'var(--color-muted)', letterSpacing: 1,
                  border: '1px solid var(--color-border)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {X30_ROADMAP.map((row, i) => {
              const isCurrent = row.bulan === currentMonth;
              const isPast = row.bulan < currentMonth;
              return (
                <tr key={row.bulan} style={{
                  background: isCurrent ? '#2563eb10' : isPast ? 'var(--color-surface)' : 'var(--color-card)',
                  borderLeft: isCurrent ? '3px solid #2563eb' : '3px solid transparent',
                }}>
                  <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#2563eb' : 'var(--color-text)' }}>
                    {isCurrent ? '→ ' : ''}{row.bulan}
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>Rp{row.awal}jt</td>
                  <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', color: '#059669', fontWeight: 600 }}>+Rp{row.profit}jt</td>
                  <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', color: row.hidup > 0 ? '#d97706' : 'var(--color-muted)' }}>
                    {row.hidup > 0 ? `-Rp${row.hidup}jt` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', fontWeight: 700, color: row.bulan === 12 ? '#7c3aed' : 'var(--color-text)' }}>
                    Rp{row.akhir}jt {row.bulan === 12 ? '🏆' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Profit Split Rule */}
      <div style={{
        marginTop: 14, padding: '12px 14px', borderRadius: 8,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 1, marginBottom: 8 }}>
          💰 PROFIT SPLIT RULE (WAJIB)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { pct: '50%', label: 'Compound ke modal trading', color: '#2563eb' },
            { pct: '30%', label: 'USDC yield (Bybit Earn)', color: '#059669' },
            { pct: '20%', label: 'Simpan aman (USD)', color: '#d97706' },
          ].map(item => (
            <div key={item.pct} style={{
              padding: '10px 12px', borderRadius: 8, textAlign: 'center',
              background: `${item.color}10`, border: `1px solid ${item.color}30`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.pct}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── TRADING JOURNAL ──────────────────────────────────────────────────────────
function TradingJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(loadJournal);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    slot: 1, pair: 'BTC/USDT', direction: 'LONG',
    entry: 0, tp: 0, sl: 0, leverage: 20,
    modal: 3_750_000, profitIdr: 0, status: 'WIN', notes: '',
  });

  const addEntry = () => {
    const e: JournalEntry = { ...form as JournalEntry, id: Date.now().toString() };
    const updated = [e, ...entries];
    setEntries(updated); saveJournal(updated);
    setShowForm(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      slot: 1, pair: 'BTC/USDT', direction: 'LONG',
      entry: 0, tp: 0, sl: 0, leverage: 20,
      modal: 3_750_000, profitIdr: 0, status: 'WIN', notes: '',
    });
  };
  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated); saveJournal(updated);
  };

  // Stats
  const totalProfit = entries.reduce((a, e) => a + e.profitIdr, 0);
  const wins = entries.filter(e => e.status === 'WIN').length;
  const winRate = entries.length > 0 ? ((wins / entries.length) * 100).toFixed(0) : '—';

  return (
    <Section title="TRADING JOURNAL" icon={BookOpen}>
      {/* Stats Bar */}
      {entries.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16,
          padding: '12px 14px', borderRadius: 8,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        }}>
          {[
            { label: 'Total Trades', value: entries.length.toString() },
            { label: 'Win Rate', value: `${winRate}%`, color: Number(winRate) >= 50 ? '#059669' : '#dc2626' },
            { label: 'Total Profit', value: `Rp${(totalProfit / 1_000_000).toFixed(2)}jt`, color: totalProfit >= 0 ? '#059669' : '#dc2626' },
            { label: 'Wins / Losses', value: `${wins} / ${entries.filter(e => e.status === 'LOSS').length}` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: (s as any).color || 'var(--color-text)', marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
          background: '#2563eb', color: 'white', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Plus size={14} /> {showForm ? 'Batal' : 'Tambah Trade'}
      </button>

      {/* Add Form */}
      {showForm && (
        <div style={{
          marginBottom: 16, padding: 16, borderRadius: 10,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'Tanggal', key: 'date', type: 'date' },
              { label: 'Slot (1-4)', key: 'slot', type: 'number' },
              { label: 'Pair', key: 'pair', type: 'text' },
              { label: 'Entry ($)', key: 'entry', type: 'number' },
              { label: 'TP ($)', key: 'tp', type: 'number' },
              { label: 'SL ($)', key: 'sl', type: 'number' },
              { label: 'Leverage (×)', key: 'leverage', type: 'number' },
              { label: 'Profit (Rp)', key: 'profitIdr', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={(form as any)[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  style={{
                    width: '100%', padding: '7px 10px',
                    border: '1px solid var(--color-border)', borderRadius: 6,
                    background: 'var(--color-card)', color: 'var(--color-text)',
                    fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>
                DIRECTION
              </label>
              <select
                value={form.direction}
                onChange={e => setForm(prev => ({ ...prev, direction: e.target.value as 'LONG' | 'SHORT' }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-card)', color: 'var(--color-text)', fontSize: 13, outline: 'none' }}
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>
                STATUS
              </label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'WIN' | 'LOSS' | 'BE' }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-card)', color: 'var(--color-text)', fontSize: 13, outline: 'none' }}
              >
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
                <option value="BE">BREAKEVEN</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>NOTES</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-card)', color: 'var(--color-text)', fontSize: 13, outline: 'none', resize: 'vertical' }}
              placeholder="Setup notes, kesalahan, lesson..."
            />
          </div>
          <button
            onClick={addEntry}
            style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Simpan Trade
          </button>
        </div>
      )}

      {/* Journal Table */}
      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)', fontSize: 13 }}>
          Belum ada trade yang dicatat. Tambah trade pertama lo!
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)' }}>
                {['Tgl', 'Slot', 'Pair', 'Dir', 'Entry', 'TP', 'SL', 'Lev', 'Profit (Rp)', 'Status', 'Notes', ''].map(h => (
                  <th key={h} style={{
                    padding: '7px 10px', textAlign: 'left', fontSize: 9,
                    fontFamily: 'monospace', fontWeight: 700,
                    color: 'var(--color-muted)', letterSpacing: 1,
                    border: '1px solid var(--color-border)', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ background: 'var(--color-card)' }}>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{e.date}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontWeight: 600 }}>S{e.slot}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'monospace' }}>{e.pair}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: e.direction === 'LONG' ? '#059669' : '#dc2626', fontWeight: 700 }}>{e.direction}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>${e.entry.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: '#059669' }}>${e.tp.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: '#dc2626' }}>${e.sl.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>×{e.leverage}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', fontWeight: 700, color: e.profitIdr >= 0 ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                    {e.profitIdr >= 0 ? '+' : ''}{(e.profitIdr / 1000).toFixed(0)}rb
                  </td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                      padding: '2px 6px', borderRadius: 4,
                      background: e.status === 'WIN' ? '#05906920' : e.status === 'LOSS' ? '#dc262620' : '#d9770620',
                      color: e.status === 'WIN' ? '#059669' : e.status === 'LOSS' ? '#dc2626' : '#d97706',
                    }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)', color: 'var(--color-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid var(--color-border)' }}>
                    <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2 }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ─── 4-PILAR RETURN ENGINE ────────────────────────────────────────────────────
function FourPilarEngine() {
  const PILAR = [
    { name: 'Core Stability', market: 'Forex (EUR/USD, USD/JPY) + Gold (XAU/USD)', strategy: 'Mean-reversion + Order Flow', target: '8–12%/bulan', risk: 'Rendah', alloc: '40%', color: '#2563eb' },
    { name: 'Alpha Explosive', market: 'Crypto Futures (BTC, ETH)', strategy: 'Volatility breakout + Funding Arbitrage', target: '20–30%/bulan', risk: 'Sedang-Tinggi', alloc: '40%', color: '#dc2626' },
    { name: 'Opportunistic Spike', market: 'Crypto Spot + Gold Event', strategy: 'Airdrop, token launch, geopolitical rally', target: '10–20%/bulan', risk: 'Tinggi', alloc: '15%', color: '#d97706' },
    { name: 'Compound Shield', market: 'Stablecoin Yield', strategy: 'USDC/USDT auto-yield (Bybit Earn)', target: '0.4–0.7%/bulan', risk: 'Sangat Rendah', alloc: '5%', color: '#059669' },
  ];

  return (
    <Section title="4-PILAR RETURN ENGINE — $2K → $100K" icon={PieChart} defaultOpen={false}>
      <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Strategi dari Obsidian: Modal $2.000 → Target $100.000 dalam 12 bulan. 38.3% return/bulan rata-rata.
          Pasar: Forex, Crypto Spot, Crypto Futures, Gold (XAU/USD). Skill: 5+ tahun charting.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PILAR.map(p => (
          <div key={p.name} style={{
            borderRadius: 10, border: `1px solid ${p.color}30`,
            background: `${p.color}08`, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: `${p.color}20`, border: `1px solid ${p.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: p.color,
              }}>
                {p.alloc}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{p.market}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.target}</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Risk: {p.risk}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>📌 {p.strategy}</div>
          </div>
        ))}
      </div>

      {/* Fase Eksekusi */}
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 1, marginBottom: 10 }}>
          📅 FASE EKSEKUSI 12 BULAN
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { fase: 'BLITZ LAUNCH', waktu: 'Bulan 1–3', target: '$2K → $10K', desc: 'Fokus Alpha + Core, compound agresif', color: '#2563eb' },
            { fase: 'COMPOUND SURGE', waktu: 'Bulan 4–8', target: '$10K → $40K', desc: 'Tambah ukuran, funding arbitrage penuh', color: '#7c3aed' },
            { fase: 'ELITE SCALE', waktu: 'Bulan 9–12', target: '$40K → $100K+', desc: 'Diversifikasi ke private deal, simpan emas', color: '#d97706' },
          ].map(f => (
            <div key={f.fase} style={{
              padding: '12px 14px', borderRadius: 10,
              background: `${f.color}10`, border: `1px solid ${f.color}30`,
            }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: f.color, letterSpacing: 1, marginBottom: 4 }}>{f.fase}</div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 4 }}>{f.waktu}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>{f.target}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── MAIN TradingPage ─────────────────────────────────────────────────────────
export function TradingPage() {
  return (
    <div className="space-y-4">
      <FourSlotSystem />
      <RiskCalculator />
      <CompoundingTracker />
      <TradingJournal />
      <FourPilarEngine />
    </div>
  );
}
