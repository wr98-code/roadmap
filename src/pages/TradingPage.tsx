// ─── ZERO COMMAND — TradingPage.tsx v2.0 "Terminal Slab" ─────────────────────
// Structural redesign: from floating cards to an institutional trading terminal —
// flat panels joined by hairline seams, dense mono readouts, tabular numerals.
// 4-Slot System | Risk Kalkulator | X30 Compounding | Trading Journal | 4-Pilar
// All calculators, inputs, journal CRUD + cloudSet sync preserved.
import { useState } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, BookOpen, Target,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Plus, Trash2, PieChart, X, Calendar,
} from 'lucide-react';
import { cloudSet } from '@/lib/cloudStorage';
import { Slab, SeamGrid, Panel, Badge, tLabelStyle, tNumStyle, SEAM } from '@/components/terminal';

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

// ─── SHARED FIELD STYLES ──────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  border: `1px solid ${SEAM}`, borderRadius: 6,
  background: 'var(--color-surface)', color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
  fontSize: 14, fontWeight: 600, outline: 'none',
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SLOT_CONFIG = [
  {
    slot: 1, mode: 'CROSS', leverage: '20x–40x', modal: 3_750_000,
    desc: 'High Confidence Scalp', targetMin: 500_000, targetMax: 1_000_000,
    tint: 'var(--color-primary)',
    strategy: 'Entry setelah konfirmasi Coinglass liquidation zone tebal. Volume spike ≥200%. EMA20 searah.',
  },
  {
    slot: 2, mode: 'ISOLATED', leverage: '10x–20x', modal: 3_750_000,
    desc: 'Momentum / Breakout', targetMin: 300_000, targetMax: 600_000,
    tint: 'var(--gold)',
    strategy: 'Breakout konfirmasi 1 candle close di atas resistance. OI naik + funding rate < +0.1%.',
  },
  {
    slot: 3, mode: 'ISOLATED', leverage: '10x–15x', modal: 3_750_000,
    desc: 'Retest Sniper', targetMin: 300_000, targetMax: 500_000,
    tint: 'var(--gain)',
    strategy: 'Retest support/resistance. Tunggu rejection candle. CryptoQuant netflow negatif untuk long.',
  },
  {
    slot: 4, mode: 'CROSS', leverage: '5x–10x', modal: 3_750_000,
    desc: 'Safe Setup / End of Day', targetMin: 300_000, targetMax: 500_000,
    tint: 'var(--warning)',
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

// ─── SECTION WRAPPER (collapsible terminal slab) ──────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Slab>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '11px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--glass-bg)',
          borderBottom: open ? `1px solid ${SEAM}` : 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Icon size={13} color="var(--color-muted)" />
        <span style={{ ...tLabelStyle, flex: 1 }}>{title}</span>
        {open ? <ChevronUp size={13} color="var(--color-muted)" /> : <ChevronDown size={13} color="var(--color-muted)" />}
      </button>
      {open && children}
    </Slab>
  );
}

// ── Block: full-bleed padded region inside a Section ──────────────────────────
function Block({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: '14px 16px', ...style }}>{children}</div>;
}

// ── SubLabel: mono uppercase micro caption ────────────────────────────────────
function SubLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...tLabelStyle, marginBottom: 10, ...style }}>{children}</div>;
}

// ─── 4-SLOT SYSTEM ────────────────────────────────────────────────────────────
function FourSlotSystem() {
  return (
    <Section title="4-SLOT DAY TRADE SYSTEM" icon={Target}>
      {/* Summary triad — seam-joined KPI tiles */}
      <SeamGrid cols="1fr 1fr 1fr" style={{ borderBottom: `1px solid ${SEAM}` }}>
        {[
          { label: 'Total Modal', value: 'Rp15.000.000', sub: '4 slot × Rp3.75jt' },
          { label: 'Target Harian', value: 'Rp1.5–2.5 jt', sub: '2–4 trade ideal' },
          { label: 'Max Daily Loss', value: 'Rp750rb–1jt', sub: 'Stop jika 2–3 SL berturut' },
        ].map(item => (
          <Panel key={item.label}>
            <div style={tLabelStyle}>{item.label}</div>
            <div className="num" style={{ ...tNumStyle, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{item.value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{item.sub}</div>
          </Panel>
        ))}
      </SeamGrid>

      {/* Slot rows — flat panels split by hairline seams */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {SLOT_CONFIG.map((slot, i) => (
          <div key={slot.slot} style={{
            padding: '12px 16px',
            borderBottom: i < SLOT_CONFIG.length - 1 ? `1px solid ${SEAM}` : 'none',
          }}>
            {/* Slot header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: slot.tint, flexShrink: 0 }} />
              <span style={{
                ...tLabelStyle, color: slot.tint,
                background: 'var(--color-surface)', border: `1px solid ${SEAM}`,
                padding: '2px 8px', borderRadius: 4,
              }}>
                SLOT {slot.slot}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                {slot.desc}
              </span>
              <Badge tone="muted">{slot.mode}</Badge>
            </div>

            {/* Slot metrics — dense mono readouts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
              {[
                { label: 'Modal', value: `Rp${(slot.modal / 1_000_000).toFixed(2)}jt` },
                { label: 'Leverage', value: slot.leverage },
                { label: 'Target Min', value: `Rp${(slot.targetMin / 1000).toFixed(0)}rb` },
                { label: 'Target Max', value: `Rp${(slot.targetMax / 1_000_000).toFixed(1)}jt` },
              ].map(item => (
                <div key={item.label}>
                  <div style={tLabelStyle}>{item.label}</div>
                  <div className="num" style={{ ...tNumStyle, fontSize: 14, fontWeight: 700, marginTop: 3 }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
              {slot.strategy}
            </div>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div style={{ padding: '14px 16px', borderTop: `1px solid ${SEAM}`, background: 'var(--color-surface)' }}>
        <SubLabel style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertTriangle size={11} style={{ color: 'var(--warning)', flexShrink: 0 }} /> ATURAN WAJIB
        </SubLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            'Jangan open lebih dari 2 slot/hari',
            'Tutup semua posisi sebelum tidur',
            'Stop jika 2–3 SL berturut-turut',
            'Jangan campur slot — tiap slot strategi beda',
            'SL wajib sebelum entry',
            'Liquidation price harus > SL',
          ].map(rule => (
            <div key={rule} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--color-text)' }}>
              <X size={13} style={{ color: 'var(--loss)', flexShrink: 0, marginTop: 1 }} />
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
      {/* Inputs */}
      <Block style={{ borderBottom: `1px solid ${SEAM}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Modal Futures (USD)', value: modal, set: setModal, step: 50 },
            { label: 'Risk per Trade (%)', value: riskPct, set: setRiskPct, step: 0.5, max: 5 },
            { label: 'Entry Price (USD)', value: entry, set: setEntry, step: 100 },
            { label: 'Stop Loss (USD)', value: sl, set: setSl, step: 100 },
            { label: 'Leverage (×)', value: leverage, set: setLeverage, step: 5, max: 50 },
          ].map(inp => (
            <div key={inp.label}>
              <label style={{ ...tLabelStyle, display: 'block', marginBottom: 5 }}>
                {inp.label}
              </label>
              <input
                type="number"
                value={inp.value}
                step={inp.step}
                max={inp.max}
                onChange={e => inp.set(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          ))}
          {/* Direction indicator */}
          <div>
            <label style={{ ...tLabelStyle, display: 'block', marginBottom: 5 }}>
              DIRECTION
            </label>
            <div style={{
              padding: '8px 10px', borderRadius: 6,
              background: isLong ? 'var(--gain-soft)' : 'var(--loss-soft)',
              border: `1px solid ${SEAM}`,
              fontSize: 14, fontWeight: 700,
              color: isLong ? 'var(--gain)' : 'var(--loss)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {isLong ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isLong ? 'LONG' : 'SHORT'}
            </div>
          </div>
        </div>
      </Block>

      {/* Results */}
      <Block>
        <SubLabel>HASIL KALKULASI</SubLabel>
        <SeamGrid cols="1fr 1fr 1fr" style={{ border: `1px solid ${SEAM}` }}>
          {[
            { label: 'Risk Amount', value: `$${riskUsd.toFixed(2)}`, sub: `${riskPct}% dari modal`, ok: true },
            { label: 'SL Distance', value: `$${slDistance.toFixed(0)}`, sub: `${slPct.toFixed(2)}% dari entry`, ok: true },
            { label: 'Contracts', value: contracts.toFixed(6), sub: 'qty posisi', ok: true },
            { label: 'Nominal', value: `$${nominal.toFixed(0)}`, sub: 'ukuran posisi', ok: true },
            { label: 'Margin Needed', value: `$${margin.toFixed(2)}`, sub: `${((margin/modal)*100).toFixed(1)}% modal`, ok: marginOk },
            { label: 'RR Ratio', value: `1:${rrRatio}`, sub: 'risk:reward', ok: Number(rrRatio) >= 2 },
          ].map(item => (
            <Panel key={item.label} style={{ background: item.ok ? 'var(--glass-bg)' : 'var(--loss-soft)' }}>
              <div style={tLabelStyle}>{item.label}</div>
              <div className="num" style={{ ...tNumStyle, fontSize: 16, fontWeight: 700, color: item.ok ? 'var(--color-text)' : 'var(--loss)', marginTop: 3 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{item.sub}</div>
            </Panel>
          ))}
        </SeamGrid>

        {/* Take Profit Targets */}
        <SeamGrid cols="1fr 1fr" style={{ marginTop: 12, border: `1px solid ${SEAM}` }}>
          <Panel style={{ background: 'var(--gain-soft)' }}>
            <div style={{ ...tLabelStyle, color: 'var(--gain)' }}>TP1 — RR 1:2</div>
            <div className="num" style={{ ...tNumStyle, fontSize: 18, fontWeight: 700, color: 'var(--gain)', marginTop: 3 }}>${tp1.toFixed(0)}</div>
          </Panel>
          <Panel style={{ background: 'var(--rail-active-bg)' }}>
            <div style={{ ...tLabelStyle, color: 'var(--color-primary)' }}>TP2 — RR 1:3</div>
            <div className="num" style={{ ...tNumStyle, fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginTop: 3 }}>${tp2.toFixed(0)}</div>
          </Panel>
        </SeamGrid>

        {/* Warning */}
        {!marginOk && (
          <div style={{
            marginTop: 12, padding: '9px 12px', borderRadius: 6,
            background: 'var(--loss-soft)', border: `1px solid ${SEAM}`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
            color: 'var(--loss)',
          }}>
            <AlertTriangle size={14} />
            Margin melebihi 10% modal! Kurangi leverage atau perbesar SL distance.
          </div>
        )}
        {marginOk && contracts > 0 && (
          <div style={{
            marginTop: 12, padding: '9px 12px', borderRadius: 6,
            background: 'var(--gain-soft)', border: `1px solid ${SEAM}`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
            color: 'var(--gain)',
          }}>
            <CheckCircle size={14} />
            Setup valid. Margin terkendali. Pasang SL sebelum entry!
          </div>
        )}
      </Block>
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
      <Block style={{ borderBottom: `1px solid ${SEAM}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ ...tLabelStyle, display: 'block', marginBottom: 5 }}>
              BULAN SEKARANG
            </label>
            <select
              value={currentMonth}
              onChange={e => setCurrentMonth(Number(e.target.value))}
              style={inputStyle}
            >
              {X30_ROADMAP.map(r => (
                <option key={r.bulan} value={r.bulan}>Bulan {r.bulan}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...tLabelStyle, display: 'block', marginBottom: 5 }}>
              BALANCE SEKARANG (JT)
            </label>
            <input
              type="number"
              value={currentBalance}
              step={1}
              onChange={e => setCurrentBalance(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
        </div>
      </Block>

      {/* Progress KPI triad */}
      {currentRow && (
        <SeamGrid cols="1fr 1fr 1fr" style={{ borderBottom: `1px solid ${SEAM}` }}>
          <Panel>
            <div style={tLabelStyle}>TARGET BULAN INI</div>
            <div className="num" style={{ ...tNumStyle, fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>Rp{currentRow.akhir}jt</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>+Rp{currentRow.profit}jt profit</div>
          </Panel>
          <Panel>
            <div style={tLabelStyle}>PROGRESS BULAN</div>
            <div className="num" style={{ ...tNumStyle, fontSize: 20, fontWeight: 800, color: progress >= 100 ? 'var(--gain)' : 'var(--warning)', marginTop: 4 }}>
              {progress.toFixed(0)}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
              Rp{currentBalance}jt / Rp{currentRow.akhir}jt
            </div>
          </Panel>
          <Panel>
            <div style={tLabelStyle}>OVERALL X30</div>
            <div className="num" style={{ ...tNumStyle, fontSize: 20, fontWeight: 800, color: 'var(--gold)', marginTop: 4 }}>{overallProgress.toFixed(1)}%</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>dari Rp1.000jt</div>
          </Panel>
        </SeamGrid>
      )}

      {/* Progress Bar Overall */}
      <Block style={{ borderBottom: `1px solid ${SEAM}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="num" style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>Rp33jt</span>
          <span style={{ ...tLabelStyle }}>X30 MENUJU KEABADIAN</span>
          <span className="num" style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>Rp1.000jt</span>
        </div>
        <div style={{ height: 8, background: 'var(--color-surface)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(overallProgress, 100)}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--gold))',
            borderRadius: 4, transition: 'width .5s',
          }} />
        </div>
      </Block>

      {/* Roadmap Table */}
      <Block style={{ borderBottom: `1px solid ${SEAM}` }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)' }}>
                {[
                  { h: 'Bulan', align: 'left' as const },
                  { h: 'Modal Awal', align: 'right' as const },
                  { h: 'Target Profit', align: 'right' as const },
                  { h: 'Uang Hidup', align: 'right' as const },
                  { h: 'Modal Akhir', align: 'right' as const },
                ].map(col => (
                  <th key={col.h} style={{
                    padding: '8px 12px', textAlign: col.align,
                    ...tLabelStyle,
                    border: `1px solid ${SEAM}`,
                  }}>
                    {col.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {X30_ROADMAP.map((row) => {
                const isCurrent = row.bulan === currentMonth;
                const isPast = row.bulan < currentMonth;
                return (
                  <tr key={row.bulan} style={{
                    background: isCurrent ? 'var(--rail-active-bg)' : isPast ? 'var(--color-surface)' : 'var(--glass-bg)',
                    borderLeft: isCurrent ? '3px solid var(--color-primary)' : '3px solid transparent',
                  }}>
                    <td style={{ padding: '8px 12px', border: `1px solid ${SEAM}`, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {isCurrent ? '→ ' : ''}{row.bulan}
                    </td>
                    <td className="num" style={{ padding: '8px 12px', border: `1px solid ${SEAM}`, color: 'var(--color-text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>Rp{row.awal}jt</td>
                    <td className="num" style={{ padding: '8px 12px', border: `1px solid ${SEAM}`, color: 'var(--gain)', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>+Rp{row.profit}jt</td>
                    <td className="num" style={{ padding: '8px 12px', border: `1px solid ${SEAM}`, color: row.hidup > 0 ? 'var(--warning)' : 'var(--color-muted)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {row.hidup > 0 ? `-Rp${row.hidup}jt` : '—'}
                    </td>
                    <td className="num" style={{ padding: '8px 12px', border: `1px solid ${SEAM}`, fontWeight: 700, color: row.bulan === 12 ? 'var(--gold)' : 'var(--color-text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      Rp{row.akhir}jt
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Block>

      {/* Profit Split Rule */}
      <Block>
        <SubLabel style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <PieChart size={11} style={{ color: 'var(--color-muted)', flexShrink: 0 }} /> PROFIT SPLIT RULE (WAJIB)
        </SubLabel>
        <SeamGrid cols="1fr 1fr 1fr" style={{ border: `1px solid ${SEAM}` }}>
          {[
            { pct: '50%', label: 'Compound ke modal trading', tint: 'var(--color-primary)', bg: 'var(--rail-active-bg)' },
            { pct: '30%', label: 'USDC yield (Bybit Earn)', tint: 'var(--gain)', bg: 'var(--gain-soft)' },
            { pct: '20%', label: 'Simpan aman (USD)', tint: 'var(--warning)', bg: 'var(--color-surface)' },
          ].map(item => (
            <Panel key={item.pct} style={{ textAlign: 'center', background: item.bg }}>
              <div className="num" style={{ ...tNumStyle, fontSize: 22, fontWeight: 800, color: item.tint }}>{item.pct}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.4 }}>{item.label}</div>
            </Panel>
          ))}
        </SeamGrid>
      </Block>
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

  const formInputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: `1px solid ${SEAM}`, borderRadius: 6,
    background: 'var(--color-surface)', color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
  };

  return (
    <Section title="TRADING JOURNAL" icon={BookOpen}>
      {/* Stats Bar */}
      {entries.length > 0 && (
        <SeamGrid cols="1fr 1fr 1fr 1fr" style={{ borderBottom: `1px solid ${SEAM}` }}>
          {[
            { label: 'Total Trades', value: entries.length.toString() },
            { label: 'Win Rate', value: `${winRate}%`, color: Number(winRate) >= 50 ? 'var(--gain)' : 'var(--loss)' },
            { label: 'Total Profit', value: `Rp${(totalProfit / 1_000_000).toFixed(2)}jt`, color: totalProfit >= 0 ? 'var(--gain)' : 'var(--loss)' },
            { label: 'Wins / Losses', value: `${wins} / ${entries.filter(e => e.status === 'LOSS').length}` },
          ].map(s => (
            <Panel key={s.label}>
              <div style={tLabelStyle}>{s.label}</div>
              <div className="num" style={{ ...tNumStyle, fontSize: 16, fontWeight: 700, color: (s as any).color || 'var(--color-text)', marginTop: 3 }}>{s.value}</div>
            </Panel>
          ))}
        </SeamGrid>
      )}

      <Block>
        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--rail-active-bg)', color: 'var(--color-primary)',
            border: '1px solid var(--rail-active-border)',
            borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> {showForm ? 'Batal' : 'Tambah Trade'}
        </button>

        {/* Add Form */}
        {showForm && (
          <div style={{
            marginBottom: 16, padding: 16,
            background: 'var(--color-surface)', border: `1px solid ${SEAM}`,
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
                  <label style={{ ...tLabelStyle, display: 'block', marginBottom: 4 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key] || ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={formInputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={{ ...tLabelStyle, display: 'block', marginBottom: 4 }}>
                  DIRECTION
                </label>
                <select
                  value={form.direction}
                  onChange={e => setForm(prev => ({ ...prev, direction: e.target.value as 'LONG' | 'SHORT' }))}
                  style={formInputStyle}
                >
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </div>
              <div>
                <label style={{ ...tLabelStyle, display: 'block', marginBottom: 4 }}>
                  STATUS
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'WIN' | 'LOSS' | 'BE' }))}
                  style={formInputStyle}
                >
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BE">BREAKEVEN</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ ...tLabelStyle, display: 'block', marginBottom: 4 }}>NOTES</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                style={{ ...formInputStyle, fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                placeholder="Setup notes, kesalahan, lesson..."
              />
            </div>
            <button
              onClick={addEntry}
              style={{
                background: 'var(--gain-soft)', color: 'var(--gain)',
                border: '1px solid var(--gain)', borderRadius: 7,
                padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
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
                  {[
                    { h: 'Tgl', align: 'left' as const },
                    { h: 'Slot', align: 'left' as const },
                    { h: 'Pair', align: 'left' as const },
                    { h: 'Dir', align: 'left' as const },
                    { h: 'Entry', align: 'right' as const },
                    { h: 'TP', align: 'right' as const },
                    { h: 'SL', align: 'right' as const },
                    { h: 'Lev', align: 'right' as const },
                    { h: 'Profit (Rp)', align: 'right' as const },
                    { h: 'Status', align: 'left' as const },
                    { h: 'Notes', align: 'left' as const },
                    { h: '', align: 'left' as const },
                  ].map((col, ci) => (
                    <th key={ci} style={{
                      padding: '7px 10px', textAlign: col.align,
                      ...tLabelStyle,
                      border: `1px solid ${SEAM}`, whiteSpace: 'nowrap',
                    }}>
                      {col.h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ background: 'var(--glass-bg)' }}>
                    <td className="num" style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--color-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{e.date}</td>
                    <td style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--color-text)', fontWeight: 600 }}>S{e.slot}</td>
                    <td style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{e.pair}</td>
                    <td style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: e.direction === 'LONG' ? 'var(--gain)' : 'var(--loss)', fontWeight: 700 }}>{e.direction}</td>
                    <td className="num" style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--color-text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${e.entry.toLocaleString()}</td>
                    <td className="num" style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--gain)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${e.tp.toLocaleString()}</td>
                    <td className="num" style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--loss)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${e.sl.toLocaleString()}</td>
                    <td className="num" style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--color-muted)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>×{e.leverage}</td>
                    <td className="num" style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, fontWeight: 700, color: e.profitIdr >= 0 ? 'var(--gain)' : 'var(--loss)', whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {e.profitIdr >= 0 ? '+' : ''}{(e.profitIdr / 1000).toFixed(0)}rb
                    </td>
                    <td style={{ padding: '7px 10px', border: `1px solid ${SEAM}` }}>
                      <Badge tone={e.status === 'WIN' ? 'gain' : e.status === 'LOSS' ? 'loss' : 'warning'}>
                        {e.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '7px 10px', border: `1px solid ${SEAM}`, color: 'var(--color-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</td>
                    <td style={{ padding: '7px 10px', border: `1px solid ${SEAM}` }}>
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
      </Block>
    </Section>
  );
}

// ─── 4-PILAR RETURN ENGINE ────────────────────────────────────────────────────
function FourPilarEngine() {
  const PILAR = [
    { name: 'Core Stability', market: 'Forex (EUR/USD, USD/JPY) + Gold (XAU/USD)', strategy: 'Mean-reversion + Order Flow', target: '8–12%/bulan', risk: 'Rendah', alloc: '40%', tint: 'var(--color-primary)' },
    { name: 'Alpha Explosive', market: 'Crypto Futures (BTC, ETH)', strategy: 'Volatility breakout + Funding Arbitrage', target: '20–30%/bulan', risk: 'Sedang-Tinggi', alloc: '40%', tint: 'var(--loss)' },
    { name: 'Opportunistic Spike', market: 'Crypto Spot + Gold Event', strategy: 'Airdrop, token launch, geopolitical rally', target: '10–20%/bulan', risk: 'Tinggi', alloc: '15%', tint: 'var(--warning)' },
    { name: 'Compound Shield', market: 'Stablecoin Yield', strategy: 'USDC/USDT auto-yield (Bybit Earn)', target: '0.4–0.7%/bulan', risk: 'Sangat Rendah', alloc: '5%', tint: 'var(--gain)' },
  ];

  return (
    <Section title="4-PILAR RETURN ENGINE — $2K → $100K" icon={PieChart} defaultOpen={false}>
      <Block style={{ borderBottom: `1px solid ${SEAM}` }}>
        <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Strategi dari Obsidian: Modal $2.000 → Target $100.000 dalam 12 bulan. 38.3% return/bulan rata-rata.
          Pasar: Forex, Crypto Spot, Crypto Futures, Gold (XAU/USD). Skill: 5+ tahun charting.
        </p>
      </Block>

      {/* Pilars — flat rows split by hairline seams */}
      <div style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${SEAM}` }}>
        {PILAR.map((p, i) => (
          <div key={p.name} style={{
            padding: '12px 16px',
            borderBottom: i < PILAR.length - 1 ? `1px solid ${SEAM}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div className="num" style={{
                width: 34, height: 34, borderRadius: 6,
                background: 'var(--color-surface)', border: `1px solid ${SEAM}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: p.tint,
                fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
              }}>
                {p.alloc}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{p.market}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="num" style={{ ...tNumStyle, fontSize: 14, fontWeight: 700, color: p.tint }}>{p.target}</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Risk: {p.risk}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{p.strategy}</div>
          </div>
        ))}
      </div>

      {/* Fase Eksekusi */}
      <Block>
        <SubLabel style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={11} style={{ color: 'var(--color-muted)', flexShrink: 0 }} /> FASE EKSEKUSI 12 BULAN
        </SubLabel>
        <SeamGrid cols="1fr 1fr 1fr" style={{ border: `1px solid ${SEAM}` }}>
          {[
            { fase: 'BLITZ LAUNCH', waktu: 'Bulan 1–3', target: '$2K → $10K', desc: 'Fokus Alpha + Core, compound agresif', tint: 'var(--color-primary)' },
            { fase: 'COMPOUND SURGE', waktu: 'Bulan 4–8', target: '$10K → $40K', desc: 'Tambah ukuran, funding arbitrage penuh', tint: 'var(--gold)' },
            { fase: 'ELITE SCALE', waktu: 'Bulan 9–12', target: '$40K → $100K+', desc: 'Diversifikasi ke private deal, simpan emas', tint: 'var(--warning)' },
          ].map(f => (
            <Panel key={f.fase}>
              <div style={{ ...tLabelStyle, color: f.tint, marginBottom: 4 }}>{f.fase}</div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 4 }}>{f.waktu}</div>
              <div className="num" style={{ ...tNumStyle, fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{f.target}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>{f.desc}</div>
            </Panel>
          ))}
        </SeamGrid>
      </Block>
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
