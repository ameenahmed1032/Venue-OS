'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { INV_FLOW } from '@/lib/types';
import { allowed } from '@/lib/rbac';
import { Badge, PageHead, Table, useT, useToast, Confirm } from '@/components/ui';
import { inr } from '@/lib/format';

export default function Vendors() {
  const t = useT();
  const { vendors, invoices, invStep, addInvoice, events, role } = useStore();
  const { run, node } = useToast();
  const [f, setF] = useState({ vendorId: 'V-1', eventId: 'EV-1009', number: '', amount: 0, desc: '' });
  const liab = invoices.filter(i => i.status === 'invoiced' || i.status === 'payapproved').reduce((a, i) => a + i.amount, 0);
  return (
    <div>
      <PageHead title={t('nav.vendors')}><span className="text-sm">Open liabilities: <b>{inr(liab)}</b></span></PageHead>
      {allowed(role, 'vendorAdvance') && <form className="card mb-4 grid gap-2 md:grid-cols-6" onSubmit={e => { e.preventDefault(); const r = run(addInvoice(f)); if (r.ok) setF({ ...f, number: '', amount: 0 }); }}>
        <select className="input" value={f.vendorId} onChange={e => setF({ ...f, vendorId: e.target.value })}>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
        <select className="input" value={f.eventId} onChange={e => setF({ ...f, eventId: e.target.value })}>{events.filter(e => e.status !== 'closed').slice(0, 15).map(e => <option key={e.id} value={e.id}>{e.id}</option>)}</select>
        <input className="input" placeholder="Invoice no." value={f.number} onChange={e => setF({ ...f, number: e.target.value })} />
        <input type="number" className="input" placeholder="₹" value={f.amount || ''} onChange={e => setF({ ...f, amount: Number(e.target.value) })} />
        <input className="input" placeholder="Description" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />
        <button className="btn-gold">New purchase / invoice</button>
      </form>}
      <div className="card"><Table head={['Invoice', 'Vendor', 'Event', 'Amount', 'Status', '']}>
        {invoices.map(i => { const nx = INV_FLOW[INV_FLOW.indexOf(i.status) + 1]; return <tr key={i.id}><td className="td">{i.number}<div className="text-xs text-mute">{i.desc}</div></td><td className="td">{vendors.find(v => v.id === i.vendorId)?.name}</td><td className="td">{i.eventId}</td><td className="td">{inr(i.amount)}</td><td className="td"><Badge t={i.status === 'paid' ? 'green' : 'amber'}>{t('inv.' + i.status)}</Badge></td><td className="td">{nx && <Confirm label={`→ ${t('inv.' + nx)}`} msg={`Move ${i.number} (${inr(i.amount)}) to "${t('inv.' + nx)}"?`} onYes={() => run(invStep(i.id))} />}</td></tr>; })}
      </Table></div>
      <div className="card mt-4"><b>Vendor directory</b><Table head={['Vendor', 'Category', 'Rating']}>{vendors.map(v => <tr key={v.id}><td className="td">{v.name}</td><td className="td">{v.category}</td><td className="td">{v.rating.toFixed(1)}</td></tr>)}</Table></div>
      {node}
    </div>
  );
}
