'use client';
import { useStore } from '@/lib/store';
import { PageHead, Table, useT } from '@/components/ui';
import { dt, csv } from '@/lib/format';

export default function Audit() {
  const t = useT();
  const { audit, role } = useStore();
  if (role === 'super') return <div className="card text-sm">Platform Super Admin sees only platform/technical logs. Tenant audit trails require explicit, time-limited, audited support access (none granted).</div>;
  return (
    <div>
      <PageHead title={t('nav.audit')}><button className="btn-ghost" onClick={() => csv('audit', audit.map(a => ({ ts: a.ts, actor: a.actor, role: a.role, action: a.action, record: a.record, previous: a.prev ?? '', next: a.next ?? '', reason: a.reason ?? '' })))}>{t('common.export')}</button></PageHead>
      <div className="card"><Table head={['Time', 'Actor', 'Action', 'Record', 'Previous → New', 'Reason']}>
        {audit.slice(0, 200).map(a => <tr key={a.id}><td className="td">{dt(a.ts)}</td><td className="td">{a.actor}</td><td className="td">{a.action}</td><td className="td">{a.record}</td><td className="td">{a.prev ?? ''}{a.next ? ' → ' + a.next : ''}</td><td className="td">{a.reason ?? ''}</td></tr>)}
      </Table></div>
    </div>
  );
}
