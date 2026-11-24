'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { askCopilot, type CopilotAnswer } from '@/lib/copilot';
import { Badge, PageHead, useT } from '@/components/ui';
import { csv } from '@/lib/format';

const ORG = ['How much cash was collected today and what is the expected closing balance?', 'Why is there a ₹500 cash discrepancy?', 'Which events are awaiting closure and who is responsible?', 'What are outstanding vendor payments and unpaid wages?', 'Which event has the highest estimated contribution this month?', 'Show overdue tasks by department and draft a management summary.', 'आज कितनी नकद राशि प्राप्त हुई?', 'ಇಂದು ಯಾವ ಕೆಲಸಗಳು ಬಾಕಿ ಉಳಿದಿವೆ?', 'आज विक्रेता भुगतान कितने बाकी हैं?'];
const PLAT = ['Which tenants have service issues?', 'Which modules are enabled?', 'Summarise platform usage this week.', "Show payroll of Rangoli Convention"];

export default function Copilot() {
  const t = useT();
  const s = useStore();
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState<{ q: string; a: CopilotAnswer; shown: string }[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const suggestions = s.role === 'super' ? PLAT : ORG;
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs]);

  const send = (text: string) => {
    if (!text.trim()) return;
    // answers are recomputed from CURRENT state at ask-time (no canned figures)
    const a = askCopilot(text, s.role, s, s.now);
    s.log(a.refused ? 'Copilot query refused' : 'Copilot query', text.slice(0, 40).replace(/\d{6,}/g, '***'));
    setMsgs(m => [...m, { q: text, a, shown: '' }]); setQ('');
    let i = 0; const full = a.text;
    const iv = setInterval(() => { i += 6; setMsgs(m => m.map((x, k) => k === m.length - 1 ? { ...x, shown: full.slice(0, i) } : x)); if (i >= full.length) clearInterval(iv); }, 20);
  };
  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <PageHead title={`${t('copilot.title')} — ${s.role === 'super' ? 'Platform scope' : 'Gayatri Vihar scope'}`}><Badge t="gold">Simulated AI</Badge></PageHead>
      <p className="mb-2 text-xs text-mute">{t('copilot.sim')} Record text is treated as data, never instructions. No payments, approvals or edits are possible from chat.</p>
      <div className="card flex-1 space-y-4 overflow-y-auto">
        {msgs.length === 0 && <div className="text-sm text-mute">Suggested questions:<div className="mt-2 flex flex-wrap gap-2">{suggestions.map(x => <button key={x} className="btn-ghost text-left" onClick={() => send(x)}>{x}</button>)}</div></div>}
        {msgs.map((m, i) => <div key={i} className="space-y-2"><div className="ml-auto w-fit max-w-[80%] rounded-xl bg-navy-800 px-3 py-2 text-sm text-white">{m.q}</div>
          <div className={`max-w-[90%] rounded-xl border p-3 text-sm ${m.a.refused ? 'border-red-300' : 'border-line'}`}>{m.shown}
            {m.shown.length >= m.a.text.length && <div className="mt-2 space-y-2">
              {m.a.table && m.a.table.rows.length > 0 && <table className="w-full text-xs"><thead><tr>{m.a.table.head.map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{m.a.table.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} className="td">{c}</td>)}</tr>)}</tbody></table>}
              <div className="text-xs text-mute">Basis: {m.a.basis} • Last updated {new Date(s.now).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
              <div className="flex flex-wrap gap-2">{m.a.sources.map(x => <Link key={x.label} href={x.href} className="rounded bg-black/5 px-2 py-0.5 text-xs underline">{x.label}</Link>)}
                {m.a.table && m.a.table.rows.length > 0 && <button className="text-xs underline" onClick={() => csv('copilot-report', m.a.table!.rows.map(r => Object.fromEntries(m.a.table!.head.map((h, k) => [h, r[k]]))))}>Download CSV</button>}</div>
            </div>}
          </div></div>)}
        <div ref={end} />
      </div>
      <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); send(q); }}><input className="input" placeholder={t('copilot.ask')} value={q} onChange={e => setQ(e.target.value)} /><button className="btn-gold">{t('copilot.send')}</button></form>
    </div>
  );
}
