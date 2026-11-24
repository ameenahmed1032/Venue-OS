'use client';
import { useStore } from '@/lib/store';
import { Badge, PageHead, Table, useT, useToast } from '@/components/ui';
import { inr } from '@/lib/format';
import { OWNER_APPROVAL_THRESHOLD } from '@/lib/rbac';

export default function Approvals() {
  const t = useT();
  const { expenses, payroll, invoices, vendors, decideExpense, payStep, invStep, role } = useStore();
  const { run, node } = useToast();
  const rows = [
    ...expenses.filter(e => e.status === 'pending').map(e => ({ k: 'Expense ' + e.id, d: `${e.category} — ${e.note}`, a: e.amount, go: () => run(decideExpense(e.id, true)), no: () => run(decideExpense(e.id, false)) })),
    ...payroll.filter(p => p.status === 'calculated').map(p => ({ k: 'Payroll ' + p.id, d: `${p.items.length} workers`, a: p.total, go: () => run(payStep(p.id)), no: undefined })),
    ...invoices.filter(i => i.status === 'invoiced').map(i => ({ k: 'Vendor payment ' + i.number, d: vendors.find(v => v.id === i.vendorId)?.name ?? '', a: i.amount, go: () => run(invStep(i.id)), no: undefined })),
  ];
  return (
    <div>
      <PageHead title={t('nav.approvals')} />
      <p className="mb-3 text-xs text-mute">Items above {inr(OWNER_APPROVAL_THRESHOLD)} require owner approval. Current role: {role}.</p>
      <div className="card"><Table head={['Item', 'Detail', 'Amount', 'Level', '']}>
        {rows.length === 0 && <tr><td className="td text-mute" colSpan={5}>{t('common.empty')}</td></tr>}
        {rows.map(r => <tr key={r.k}><td className="td">{r.k}</td><td className="td">{r.d}</td><td className="td">{inr(r.a)}</td><td className="td">{r.a > OWNER_APPROVAL_THRESHOLD ? <Badge t="amber">Owner</Badge> : <Badge>Finance</Badge>}</td><td className="td"><button className="btn-primary !py-1" onClick={r.go}>{t('common.approve')}</button> {r.no && <button className="btn-ghost !py-1" onClick={r.no}>{t('common.reject')}</button>}</td></tr>)}
      </Table></div>
      {node}
    </div>
  );
}
