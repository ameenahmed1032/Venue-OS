'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { STAGES, type Stage } from '@/lib/types';
import { allowed } from '@/lib/rbac';
import { Badge, PageHead, Table, useT, useToast } from '@/components/ui';
import { inr, csv } from '@/lib/format';

export default function CRM() {
  const t = useT();
  const { enquiries, moveEnquiry, confirmBooking, submitEnquiry, role } = useStore();
  const { run, node } = useToast();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [quote, setQuote] = useState<Record<string, string>>({});
  const [f, setF] = useState({ name: '', phone: '', type: 'Wedding', guests: 200, date: '2026-12-15', notes: '', source: 'phone' as 'phone' | 'walkin' });
  const canEdit = allowed(role, 'quote');
  const card = (e: typeof enquiries[number]) => {
    const i = STAGES.indexOf(e.stage);
    return (
      <div key={e.id} className="rounded-lg border border-line bg-surface p-2 text-xs">
        <div className="flex justify-between"><b>{e.name}</b><Badge t={e.source === 'website' ? 'blue' : 'gray'}>{e.source}</Badge></div>
        <div className="text-mute">{e.type} • {e.guests} guests • {e.date}</div>
        {e.quote && <div className="font-medium">{inr(e.quote)}</div>}
        {canEdit && e.stage !== 'completed' && !e.eventId && <div className="mt-2 space-y-1">
          {STAGES[i + 1] === 'quoted' || e.stage === 'visit' ? <div className="flex gap-1"><input className="input !py-1" placeholder="Quote ₹" value={quote[e.id] ?? ''} onChange={x => setQuote({ ...quote, [e.id]: x.target.value })} /></div> : null}
          {e.stage === 'negotiation' ? <button className="btn-gold w-full !py-1" onClick={() => run(confirmBooking(e.id))}>Confirm booking</button> : <button className="btn-ghost w-full !py-1" onClick={() => run(moveEnquiry(e.id, STAGES[i + 1], quote[e.id] ? Number(quote[e.id]) : undefined))}>→ {t('st.' + STAGES[i + 1])}</button>}
        </div>}
        {e.eventId && <div className="mt-1 text-emerald-600">Event {e.eventId}</div>}
      </div>
    );
  };
  return (
    <div>
      <PageHead title={t('nav.crm')}>
        <button className={view === 'kanban' ? 'btn-primary' : 'btn-ghost'} onClick={() => setView('kanban')}>Kanban</button>
        <button className={view === 'table' ? 'btn-primary' : 'btn-ghost'} onClick={() => setView('table')}>Table</button>
        <button className="btn-ghost" onClick={() => csv('enquiries', enquiries.map(e => ({ id: e.id, name: e.name, type: e.type, guests: e.guests, date: e.date, source: e.source, stage: e.stage, quote: e.quote ?? '' })))}>{t('common.export')}</button>
      </PageHead>
      {allowed(role, 'addEnquiry') && <form className="card mb-4 grid gap-2 md:grid-cols-7" onSubmit={e => { e.preventDefault(); const r = run(submitEnquiry(f)); if (r.ok) setF({ ...f, name: '', phone: '' }); }}>
        <input className="input" placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="Phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <select className="input" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{['Wedding', 'Conference', 'Exhibition', 'Engagement', 'Celebration'].map(x => <option key={x}>{x}</option>)}</select>
        <input type="number" className="input" value={f.guests} onChange={e => setF({ ...f, guests: Number(e.target.value) })} />
        <input type="date" className="input" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
        <select className="input" value={f.source} onChange={e => setF({ ...f, source: e.target.value as any })}><option value="phone">Phone</option><option value="walkin">Walk-in</option></select>
        <button className="btn-gold">Add enquiry</button>
      </form>}
      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map(st => { const list = enquiries.filter(e => e.stage === st); return (
            <div key={st} className="w-60 shrink-0 rounded-xl bg-black/5 p-2"><div className="mb-2 flex justify-between text-xs font-semibold"><span>{t('st.' + st)}</span><span>{list.length}</span></div><div className="max-h-[60vh] space-y-2 overflow-y-auto">{list.slice(0, 12).map(card)}</div></div>
          ); })}
        </div>
      ) : (
        <div className="card"><Table head={['ID', 'Name', 'Type', 'Guests', 'Source', 'Stage', 'Quote']}>{enquiries.map(e => <tr key={e.id}><td className="td">{e.id}</td><td className="td">{e.name}</td><td className="td">{e.type}</td><td className="td">{e.guests}</td><td className="td">{e.source}</td><td className="td">{t('st.' + e.stage)}</td><td className="td">{e.quote ? inr(e.quote) : '—'}</td></tr>)}</Table></div>
      )}
      {node}
    </div>
  );
}
