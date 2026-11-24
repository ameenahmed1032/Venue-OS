'use client';
import { useState } from 'react';
import { useStore, closureChecks } from '@/lib/store';
import { Badge, PageHead, useT, useToast, Confirm } from '@/components/ui';
import { inr } from '@/lib/format';
import { allowed } from '@/lib/rbac';

export default function Closure() {
  const t = useT();
  const d = useStore();
  const { events, now, closeEvent, role } = d;
  const { run, node } = useToast();
  const [sel, setSel] = useState('EV-1008');
  const [exc, setExc] = useState('');
  const open = events.filter(e => ['pendingrec', 'live', 'opscomplete'].includes(e.status));
  const ev = events.find(e => e.id === sel);
  const checks = ev ? closureChecks(d, now, ev.id) : [];
  const missing = checks.filter(c => !c.ok);
  return (
    <div>
      <PageHead title={t('nav.closure')}><select className="input w-auto" value={sel} onChange={e => setSel(e.target.value)}>{open.map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}</select><button className="btn-ghost no-print" onClick={() => window.print()}>{t('common.print')}</button></PageHead>
      {!ev ? <div className="card text-sm text-mute">{t('common.empty')}</div> : <div className="card space-y-3">
        <div className="flex justify-between"><div><b>{ev.name}</b><div className="text-xs text-mute">Customer {ev.customer} • Manager {ev.manager}</div></div><Badge t={ev.status === 'closed' ? 'green' : 'amber'}>{t('ev.' + ev.status)}</Badge></div>
        <div className="text-sm">Contracted {inr(ev.contracted)} • Collected {inr(ev.collected)} • Outstanding {inr(ev.contracted - ev.collected)}</div>
        <ul className="space-y-1">{checks.map(c => <li key={c.key} className="flex items-center gap-2 rounded border border-line p-2 text-sm"><span className={c.ok ? 'text-emerald-600' : 'text-red-600'}>{c.ok ? '✓' : '✗'}</span><span className="flex-1">{c.label}</span>{!c.ok && <span className="text-xs text-mute">Owner: {c.owner} • {c.deadline}</span>}</li>)}</ul>
        {ev.status !== 'closed' && allowed(role, 'closeEvent') && <div className="flex flex-wrap items-center gap-2">
          <Confirm label="Close event financially" msg="Close this event? All requirements are validated." disabled={missing.length > 0} onYes={() => run(closeEvent(ev.id))} />
          {missing.length > 0 && role === 'owner' && <><input className="input w-72" placeholder="Exception reason (liabilities remain recorded)" value={exc} onChange={e => setExc(e.target.value)} /><Confirm cls="btn-gold" label="Close with exception" msg="Outstanding liabilities and discrepancies stay recorded. Proceed?" onYes={() => run(closeEvent(ev.id, exc || 'Owner exception'))} /></>}
        </div>}
        {ev.status === 'closed' && <div className="rounded border border-line p-3 text-sm"><b>Closure report</b><div>Revenue {inr(ev.contracted)} • Collected {inr(ev.collected)} • Readiness {ev.readiness}%</div>{ev.exception && <div className="text-amber-700">Exception: {ev.exception}</div>}</div>}
      </div>}
      {node}
    </div>
  );
}
