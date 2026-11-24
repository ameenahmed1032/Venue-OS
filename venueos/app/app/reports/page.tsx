'use client';
import { useStore, cashSummary } from '@/lib/store';
import { PageHead, useT } from '@/components/ui';
import { csv, inr } from '@/lib/format';

export default function Reports() {
  const t = useT();
  const s = useStore();
  const c = cashSummary(s.txns, s.now);
  const R: { n: string; rows: () => Record<string, unknown>[] }[] = [
    { n: 'Daily operations', rows: () => s.tasks.map(x => ({ id: x.id, task: x.title, owner: x.ownerName, dept: x.dept, status: x.status, deadline: x.deadline })) },
    { n: 'Event summary', rows: () => s.events.map(e => ({ id: e.id, name: e.name, date: e.date, status: e.status, contracted: e.contracted, collected: e.collected })) },
    { n: 'Attendance', rows: () => s.attendance.map(a => ({ event: a.eventId, worker: a.workerId, in: a.in, out: a.out, ot: a.otHours, verified: a.verified })) },
    { n: 'Payroll', rows: () => s.payroll.flatMap(p => p.items.map(i => ({ payroll: p.id, event: p.eventId, worker: i.workerId, base: i.base, overtime: i.ot, total: i.amount, status: p.status }))) },
    { n: 'Cash ledger', rows: () => s.txns.map(x => ({ id: x.id, ts: x.ts, kind: x.kind, amount: x.amount, method: x.method, category: x.category, event: x.eventId ?? '', status: x.status })) },
    { n: 'Reconciliation', rows: () => s.counts.map(x => ({ id: x.id, expected: x.expected, counted: x.counted, discrepancy: x.discrepancy, status: x.status, reason: x.reason ?? '' })) },
    { n: 'Vendor outstanding', rows: () => s.invoices.filter(i => i.status !== 'paid').map(i => ({ invoice: i.number, vendor: i.vendorId, event: i.eventId, amount: i.amount, status: i.status })) },
    { n: 'Audit trail', rows: () => s.audit.map(a => ({ ts: a.ts, actor: a.actor, action: a.action, record: a.record, previous: a.prev ?? '', next: a.next ?? '', reason: a.reason ?? '' })) },
  ];
  return (
    <div>
      <PageHead title={t('nav.reports')}><button className="btn-ghost" onClick={() => window.print()}>{t('common.print')}</button></PageHead>
      <div className="card mb-4 text-sm"><b>Monthly management summary</b> — Events {s.events.length} • Cash expected today {inr(c.expected)} • Open tasks {s.tasks.filter(x => x.status !== 'completed').length} • Audit entries {s.audit.length}</div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{R.map(r => <div key={r.n} className="card"><div className="font-medium">{r.n}</div><div className="text-xs text-mute">{r.rows().length} rows</div><button className="btn-primary mt-3" onClick={() => csv(r.n.toLowerCase().replace(/ /g, '-'), r.rows())}>{t('common.export')}</button></div>)}</div>
    </div>
  );
}
