'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { allowed } from '@/lib/rbac';
import { Badge, PageHead, Table, useT, useToast } from '@/components/ui';
import { inr, dt } from '@/lib/format';

const CATS = ['labour', 'decoration', 'catering', 'security', 'housekeeping', 'electricity', 'maintenance', 'transport', 'equipment rental', 'miscellaneous'];
// Simulated voice/WhatsApp parsing (deterministic, labelled as simulation)
function parse(text: string) {
  const amt = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  const cnt = text.match(/(\d+|six|five|four|ten|three|two)\s+(\w+)\s+workers?/i);
  const words: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10 };
  const cat = CATS.find(c => text.toLowerCase().includes(c.split(' ')[0])) ?? 'miscellaneous';
  return { amount: amt ? Number(amt[1].replace(/,/g, '')) : 0, cat: text.toLowerCase().includes('worker') && cat === 'miscellaneous' ? 'labour' : cat, workers: cnt ? (words[cnt[1].toLowerCase()] ?? Number(cnt[1])) : 0 };
}
export default function Expenses() {
  const t = useT();
  const { expenses, addExpense, decideExpense, role, events } = useStore();
  const { run, node } = useToast();
  const [f, setF] = useState({ eventId: 'EV-1009', category: 'housekeeping', amount: 0, note: '' });
  const [voice, setVoice] = useState('Paid ₹4,500 to six housekeeping workers for today\'s wedding');
  const [parsed, setParsed] = useState<ReturnType<typeof parse> | null>(null);
  return (
    <div>
      <PageHead title={t('nav.expenses')} />
      {allowed(role, 'addExpense') && <div className="grid gap-4 lg:grid-cols-2">
        <form className="card space-y-2" onSubmit={e => { e.preventDefault(); run(addExpense(f)); }}>
          <b>Quick expense</b>
          <select className="input" value={f.eventId} onChange={e => setF({ ...f, eventId: e.target.value })}>{events.filter(e => e.status !== 'closed').slice(0, 15).map(e => <option key={e.id} value={e.id}>{e.id} {e.name}</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><select className="input" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select><input type="number" className="input" placeholder="₹" value={f.amount || ''} onChange={e => setF({ ...f, amount: Number(e.target.value) })} /></div>
          <input className="input" placeholder="Note (receipt photo upload simulated)" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
          <button className="btn-gold">{t('common.submit')}</button>
        </form>
        <div className="card space-y-2"><b>Voice / WhatsApp entry <Badge t="gold">Simulated AI</Badge></b>
          <textarea className="input" rows={2} value={voice} onChange={e => setVoice(e.target.value)} />
          <button className="btn-ghost" onClick={() => setParsed(parse(voice))}>Extract</button>
          {parsed && <div className="rounded border border-line p-2 text-sm">Amount <b>{inr(parsed.amount)}</b> • Category <b>{parsed.cat}</b> • Workers <b>{parsed.workers || '—'}</b> • Event <b>EV-1009</b><div className="mt-2"><button className="btn-primary" onClick={() => { run(addExpense({ eventId: 'EV-1009', category: parsed.cat, amount: parsed.amount, note: voice })); setParsed(null); }}>Confirm and submit for approval</button></div></div>}
        </div>
      </div>}
      <div className="card mt-4"><Table head={['ID', 'Time', 'Event', 'Category', 'By', 'Amount', 'Status', '']}>
        {expenses.map(x => <tr key={x.id}><td className="td">{x.id}</td><td className="td">{dt(x.ts)}</td><td className="td">{x.eventId}</td><td className="td">{x.category}</td><td className="td">{x.by}</td><td className="td">{inr(x.amount)}</td><td className="td"><Badge t={x.status === 'approved' ? 'green' : x.status === 'rejected' ? 'red' : 'amber'}>{x.status}</Badge></td><td className="td">{x.status === 'pending' && allowed(role, 'approveExpense') && <><button className="btn-primary !py-1" onClick={() => run(decideExpense(x.id, true))}>{t('common.approve')}</button> <button className="btn-ghost !py-1" onClick={() => run(decideExpense(x.id, false))}>{t('common.reject')}</button></>}</td></tr>)}
      </Table></div>
      {node}
    </div>
  );
}
