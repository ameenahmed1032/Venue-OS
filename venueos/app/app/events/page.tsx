'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Badge, PageHead, Table, useT, useToast } from '@/components/ui';
import { inr } from '@/lib/format';
import { can } from '@/lib/rbac';

export default function Events() {
  const t = useT();
  const { events, toggleChecklist, role, txns, invoices } = useStore();
  const { run, node } = useToast();
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const list = events.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
  const ev = events.find(e => e.id === sel);
  const fin = can(role, 'finance') || role === 'owner';
  return (
    <div>
      <PageHead title={t('nav.events')}><input className="input w-56" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} /></PageHead>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2"><Table head={['Event', 'Date', 'Hall', 'Status', 'Ready', ...(fin ? ['Contracted', 'Outstanding'] : [])]}>
          {list.slice(0, 40).map(e => <tr key={e.id} onClick={() => setSel(e.id)} className={`cursor-pointer hover:bg-black/5 ${sel === e.id ? 'bg-black/5' : ''}`}><td className="td">{e.name}</td><td className="td">{e.date}</td><td className="td">{e.hall}</td><td className="td"><Badge t={e.status === 'live' ? 'green' : e.status === 'pendingrec' ? 'amber' : 'gray'}>{t('ev.' + e.status)}</Badge></td><td className="td">{e.readiness}%</td>{fin && <><td className="td">{inr(e.contracted)}</td><td className="td">{inr(e.contracted - e.collected)}</td></>}</tr>)}
        </Table></div>
        <div className="card">
          {!ev ? <div className="py-8 text-center text-sm text-mute">Select an event workspace</div> : <div className="space-y-3">
            <div><div className="font-semibold">{ev.name}</div><div className="text-xs text-mute">{ev.customer} • {ev.guests} guests • Manager {ev.manager}</div></div>
            <div>Readiness <b>{ev.readiness}%</b> <span className="text-xs text-mute">(from checklist; critical items weigh double)</span></div>
            {ev.checklist.map(c => <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.done} onChange={() => run(toggleChecklist(ev.id, c.id))} /><span className="capitalize text-mute">{c.dept}</span> {c.label} {c.critical && <Badge t="red">critical</Badge>}</label>)}
            {fin && <div className="text-sm">Costs recorded: {inr(txns.filter(x => x.eventId === ev.id && x.kind === 'out').reduce((a, x) => a + x.amount, 0))} • Vendor invoices: {invoices.filter(i => i.eventId === ev.id).length}</div>}
            {ev.exception && <div className="rounded bg-amber-100 p-2 text-xs text-amber-900">Closed with exception: {ev.exception}</div>}
          </div>}
        </div>
      </div>
      {node}
    </div>
  );
}
