'use client';
import { useStore } from '@/lib/store';
import { PAY_FLOW } from '@/lib/types';
import { Badge, PageHead, Table, useT, useToast, Confirm } from '@/components/ui';
import { inr, csv } from '@/lib/format';

export default function Payroll() {
  const t = useT();
  const { payroll, payStep, events } = useStore();
  const { run, node } = useToast();
  return (
    <div>
      <PageHead title={t('nav.payroll')}><button className="btn-ghost" onClick={() => csv('payroll', payroll.map(p => ({ id: p.id, event: p.eventId, status: p.status, workers: p.items.length, base: p.base, overtime: p.ot, total: p.total })))}>{t('common.export')}</button></PageHead>
      <p className="mb-3 text-xs text-mute">Liabilities (calculated/approved wages) are kept separate from actual payments (cashier disbursement posts to the cash ledger). Statutory deductions are configurable demo functionality, not a compliance claim.</p>
      {payroll.length === 0 && <div className="card text-sm text-mute">{t('common.empty')} — supervisor submits attendance first.</div>}
      {payroll.map(p => {
        const i = PAY_FLOW.indexOf(p.status); const next = PAY_FLOW[i + 1];
        return <div key={p.id} className="card mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><b>{p.id}</b> — {events.find(e => e.id === p.eventId)?.name}<div className="text-xs text-mute">{p.items.length} workers • base {inr(p.base)} + overtime {inr(p.ot)}</div></div><div className="text-xl font-semibold">{inr(p.total)}</div></div>
          <div className="my-3 flex flex-wrap gap-1">{PAY_FLOW.map((s, k) => <span key={s} className={`rounded px-2 py-0.5 text-xs ${k <= i ? 'bg-emerald-100 text-emerald-800' : 'bg-black/5 text-mute'}`}>{t('pay.' + s)}</span>)}</div>
          {next && next !== 'acknowledged' ? <Confirm label={`→ ${t('pay.' + next)}`} msg={`Move payroll ${p.id} (${inr(p.total)}) to "${t('pay.' + next)}"?`} onYes={() => run(payStep(p.id))} /> : <Badge t="green">{p.status === 'acknowledged' ? 'Fully acknowledged' : `Awaiting acknowledgement ${p.items.filter(x => x.ack).length}/${p.items.length}`}</Badge>}
          <details className="mt-3 text-sm"><summary className="cursor-pointer text-mute">Workers & history</summary><Table head={['Worker', 'Base', 'OT', 'Total', 'Ack']}>{p.items.slice(0, 40).map(it => <tr key={it.workerId}><td className="td">{it.workerId}</td><td className="td">{inr(it.base)}</td><td className="td">{inr(it.ot)}</td><td className="td">{inr(it.amount)}</td><td className="td">{it.ack ? '✓' : '—'}</td></tr>)}</Table></details>
        </div>;
      })}
      {node}
    </div>
  );
}
