'use client';
import { useStore } from '@/lib/store';
import { PageHead, Stat, Table, useT } from '@/components/ui';
import { inr } from '@/lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function Finance() {
  const t = useT();
  const { events, txns } = useStore();
  const act = events.filter(e => e.status !== 'upcoming' || e.collected > 0);
  const rows = act.slice(0, 14).map(e => {
    const out = txns.filter(x => x.eventId === e.id && x.kind === 'out' && x.status === 'confirmed');
    const sum = (c: string[]) => out.filter(x => c.includes(x.category)).reduce((a, x) => a + x.amount, 0);
    const labour = sum(['wages']), vendor = sum(['vendor']), other = out.reduce((a, x) => a + x.amount, 0) - labour - vendor;
    return { e, labour, vendor, other, direct: labour + vendor + other, contribution: e.contracted - (labour + vendor + other) };
  });
  const totalContracted = events.reduce((a, e) => a + e.contracted, 0), totalCollected = events.reduce((a, e) => a + e.collected, 0);
  const cashIn = txns.filter(x => x.kind === 'in' && x.category !== 'opening' && x.method === 'cash').reduce((a, x) => a + x.amount, 0);
  const digital = txns.filter(x => x.kind === 'in' && x.method !== 'cash').reduce((a, x) => a + x.amount, 0);
  return (
    <div>
      <PageHead title={t('nav.finance')} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Contracted revenue" value={inr(totalContracted)} /><Stat label="Collected (cash received ≠ profit)" value={inr(totalCollected)} tone="green" /><Stat label="Receivables" value={inr(totalContracted - totalCollected)} tone="amber" /><Stat label="Cash vs digital receipts" value={`${inr(cashIn)} / ${inr(digital)}`} /></div>
      <div className="card mt-4"><b>Direct costs by event</b><div className="mt-3 h-64"><ResponsiveContainer><BarChart data={rows.map(r => ({ n: r.e.id, Labour: r.labour, Vendors: r.vendor, Other: r.other }))}><CartesianGrid strokeDasharray="3 3" stroke="#8884" /><XAxis dataKey="n" tick={{ fontSize: 10 }} /><YAxis /><Tooltip formatter={(v) => inr(Number(v))} /><Legend /><Bar dataKey="Labour" stackId="a" fill="#1a2540" /><Bar dataKey="Vendors" stackId="a" fill="#b8924a" /><Bar dataKey="Other" stackId="a" fill="#6b7384" /></BarChart></ResponsiveContainer></div></div>
      <div className="card mt-4"><Table head={['Event', 'Contracted', 'Collected', 'Labour', 'Vendors', 'Other', 'Est. contribution']}>
        {rows.map(r => <tr key={r.e.id}><td className="td">{r.e.name}</td><td className="td">{inr(r.e.contracted)}</td><td className="td">{inr(r.e.collected)}</td><td className="td">{inr(r.labour)}</td><td className="td">{inr(r.vendor)}</td><td className="td">{inr(r.other)}</td><td className="td font-medium">{inr(r.contribution)}</td></tr>)}
      </Table><p className="mt-2 text-xs text-mute">Estimated contribution = contracted − recorded direct costs, before overhead and taxes. Assumption-based; not a statutory profit figure. Revenue, collections, incurred expenses and disbursements are shown separately.</p></div>
    </div>
  );
}
