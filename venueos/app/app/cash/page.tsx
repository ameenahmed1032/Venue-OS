'use client';
import { useState } from 'react';
import { useStore, cashSummary, todayStr } from '@/lib/store';
import { allowed } from '@/lib/rbac';
import { Badge, PageHead, Stat, Table, useT, useToast, Confirm } from '@/components/ui';
import { inr, dt, csv } from '@/lib/format';

const DEN = [500, 200, 100, 50, 20, 10];
export default function Cash() {
  const t = useT();
  const { txns, now, events, role, receipt, submitCount, counts, resolveCount } = useStore();
  const { run, node } = useToast();
  const c = cashSummary(txns, now);
  const [d, setD] = useState<Record<string, number>>({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 });
  const total = DEN.reduce((a, k) => a + k * (d[k] || 0), 0);
  const [r, setR] = useState({ eventId: 'EV-1009', amount: 0, method: 'cash' as 'cash' | 'upi' | 'bank', note: '' });
  const [reason, setReason] = useState('');
  const open = counts.find(x => x.status === 'open');
  const today = txns.filter(x => todayStr(x.ts) === todayStr(now));
  return (
    <div>
      <PageHead title={t('nav.cash')}><button className="btn-ghost" onClick={() => csv('cash-ledger', txns.map(x => ({ id: x.id, ts: x.ts, kind: x.kind, amount: x.amount, method: x.method, category: x.category, event: x.eventId ?? '', by: x.by, status: x.status, note: x.note })))}>{t('common.export')}</button></PageHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={t('cash.opening')} value={inr(c.opening)} /><Stat label={t('cash.inflow')} value={inr(c.inflow)} tone="green" /><Stat label={t('cash.outflow')} value={inr(c.outflow)} tone="red" /><Stat label={t('cash.expected')} value={inr(c.expected)} />
        <Stat label={t('cash.discrepancy')} value={counts[0] ? (counts[0].discrepancy > 0 ? '+' : '') + counts[0].discrepancy : '—'} tone={counts[0] && counts[0].discrepancy !== 0 ? 'red' : 'green'} sub={counts[0]?.status} />
      </div>
      <p className="mt-2 text-xs text-mute">Expected closing = opening + inflows − outflows. Discrepancy = physical count − expected. VenueOS records what staff enter; it cannot detect unrecorded physical cash.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {allowed(role, 'receipt') && <form className="card space-y-2" onSubmit={e => { e.preventDefault(); run(receipt(r.eventId, r.amount, r.method, r.note)); }}>
          <b>Record receipt (advance / balance)</b>
          <select className="input" value={r.eventId} onChange={e => setR({ ...r, eventId: e.target.value })}>{events.filter(e => e.status !== 'closed').slice(0, 20).map(e => <option key={e.id} value={e.id}>{e.id} {e.name} (due {inr(e.contracted - e.collected)})</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><input type="number" className="input" placeholder="₹ amount" value={r.amount || ''} onChange={e => setR({ ...r, amount: Number(e.target.value) })} /><select className="input" value={r.method} onChange={e => setR({ ...r, method: e.target.value as any })}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option></select></div>
          <input className="input" placeholder="Note" value={r.note} onChange={e => setR({ ...r, note: e.target.value })} />
          <button className="btn-gold">Record receipt</button>
        </form>}
        {allowed(role, 'countCash') && <div className="card space-y-2"><b>Physical count by denomination</b>
          <div className="grid grid-cols-3 gap-2">{DEN.map(k => <div key={k}><label className="label">₹{k} ×</label><input type="number" min={0} className="input" value={d[k] || ''} onChange={e => setD({ ...d, [k]: Math.max(0, Number(e.target.value)) })} /></div>)}</div>
          <div className="text-sm">Counted: <b>{inr(total)}</b> vs expected {inr(c.expected)} → difference <b>{total - c.expected}</b></div>
          <Confirm label={t('cash.count')} msg={`Submit physical count of ${inr(total)}?`} onYes={() => run(submitCount(d))} />
        </div>}
        {open && allowed(role, 'adjustCash') && <div className="card space-y-2 lg:col-span-2 border-red-300"><b className="text-red-600">Open discrepancy {open.id}: {open.discrepancy}</b>
          <input className="input" placeholder="Reason / evidence reviewed (required)" value={reason} onChange={e => setReason(e.target.value)} />
          <div className="flex gap-2"><Confirm cls="btn-gold" label="Record authorised adjustment" msg="Post an adjustment entry with this reason? The original count stays in the audit trail." onYes={() => run(resolveCount(open.id, 'adjusted', reason))} /><Confirm cls="btn-ghost" label="Mark unresolved" msg="Keep as unresolved discrepancy?" onYes={() => run(resolveCount(open.id, 'unresolved', reason))} /></div></div>}
      </div>

      <div className="card mt-4"><b>Ledger — today</b>
        <Table head={['ID', 'Time', 'Category', 'Event', 'Method', 'By', 'In', 'Out', 'Status']}>
          {today.map(x => <tr key={x.id}><td className="td">{x.id}</td><td className="td">{dt(x.ts)}</td><td className="td">{x.category}</td><td className="td">{x.eventId ?? '—'}</td><td className="td">{x.method}</td><td className="td">{x.by}</td><td className="td text-emerald-600">{x.kind === 'in' ? inr(x.amount) : ''}</td><td className="td text-red-600">{x.kind === 'out' ? inr(x.amount) : ''}</td><td className="td"><Badge t="green">{x.status}</Badge></td></tr>)}
        </Table>
        <p className="mt-2 text-xs text-mute">Confirmed entries are immutable; corrections use authorised adjustments with reasons.</p>
      </div>
      {node}
    </div>
  );
}
