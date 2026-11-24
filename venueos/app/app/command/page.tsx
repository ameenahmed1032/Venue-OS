'use client';
import Link from 'next/link';
import { useStore, cashSummary, todayStr } from '@/lib/store';
import { Badge, PageHead, Stat, useT } from '@/components/ui';
import { inr, dt } from '@/lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ROLES } from '@/lib/rbac';

export default function Command() {
  const t = useT();
  const s = useStore();
  const { role, events, tasks, notifs, audit, attendance, enquiries, payroll, expenses, invoices, now, txns } = s;
  const c = cashSummary(txns, now);
  const today = events.filter(e => e.date === todayStr(now));
  const overdue = tasks.filter(x => x.status === 'overdue' || x.status === 'escalated');
  const mine = tasks.filter(x => x.owner === role && x.status !== 'completed');
  const pendingApprovals = expenses.filter(e => e.status === 'pending').length + payroll.filter(p => p.status === 'calculated').length + invoices.filter(i => i.status === 'invoiced').length;
  const closure = events.filter(e => e.status === 'pendingrec' || e.status === 'opscomplete');
  const rec = events.filter(e => e.status !== 'closed').reduce((a, e) => a + e.contracted - e.collected, 0);
  const finance = ['owner', 'finance'].includes(role);
  const depts = ['Operations', 'Finance', 'Housekeeping', 'Security', 'Catering', 'Procurement', 'HR'].map(d => { const ts = tasks.filter(x => x.dept === d); const done = ts.filter(x => x.status === 'completed').length; return { d, pct: ts.length ? Math.round(done / ts.length * 100) : 0 }; });
  const rn = ROLES.find(r => r.id === role)!;
  const stat = (k: string) => k;
  void stat;

  return (
    <div>
      <PageHead title={`${t('cmd.title')} — ${rn.name}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {['owner', 'gm', 'eventmgr', 'supervisor', 'hr', 'procure', 'booking'].includes(role) && <Stat label={t('cmd.events')} value={today.length} sub={today.map(e => e.name).join(', ') || '—'} />}
        {['owner', 'finance', 'cashier'].includes(role) && <Stat label={t('cmd.cash')} value={inr(c.expected)} sub={`${inr(c.opening)} + ${inr(c.inflow)} − ${inr(c.outflow)}`} />}
        {finance && <Stat label={t('cmd.receivables')} value={inr(rec)} tone="amber" />}
        {['owner', 'gm', 'finance'].includes(role) && <Stat label={t('cmd.pending')} value={pendingApprovals} tone={pendingApprovals ? 'amber' : 'green'} />}
        {['owner', 'gm', 'eventmgr'].includes(role) && <Stat label={t('cmd.closure')} value={closure.length} />}
        <Stat label={t('cmd.overdue')} value={overdue.length} tone={overdue.length ? 'red' : 'green'} sub={role === 'owner' || role === 'gm' ? 'org-wide' : `my tasks: ${mine.length}`} />
        {['owner', 'gm', 'supervisor', 'hr'].includes(role) && <Stat label={t('cmd.checkedin')} value={attendance.filter(a => a.in && !a.out).length} />}
        {role === 'booking' && <Stat label="New enquiries" value={enquiries.filter(e => e.stage === 'new').length} />}
        {finance && <Stat label={t('cmd.collected')} value={inr(events.reduce((a, e) => a + e.collected, 0))} />}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <b>Events & readiness</b>
          <div className="mt-3 space-y-2">
            {events.filter(e => ['live', 'preparation', 'ready', 'pendingrec'].includes(e.status)).slice(0, 6).map(e => (
              <Link href="/app/events" key={e.id} className="flex items-center gap-3 rounded-lg border border-line p-2 hover:bg-black/5">
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{e.name}</div><div className="text-xs text-mute">{e.hall} • {e.date}</div></div>
                <div className="w-24"><div className="h-2 rounded bg-black/10"><div className={`h-2 rounded ${e.readiness === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: e.readiness + '%' }} /></div><div className="text-right text-[10px] text-mute">{e.readiness}%</div></div>
                <Badge t={e.status === 'live' ? 'green' : e.status === 'pendingrec' ? 'amber' : 'gray'}>{t('ev.' + e.status)}</Badge>
              </Link>
            ))}
          </div>
        </div>
        <div className="card">
          <b>{t('cmd.feed')}</b>
          <ul className="mt-3 space-y-2 text-xs">
            {audit.slice(0, 8).map(a => <li key={a.id}><span className="text-mute">{dt(a.ts)}</span> — {a.action} <span className="text-mute">({a.record})</span></li>)}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {['owner', 'gm'].includes(role) && <div className="card"><b>Department task completion %</b>
          <div className="mt-3 h-56"><ResponsiveContainer><BarChart data={depts}><CartesianGrid strokeDasharray="3 3" stroke="#8884" /><XAxis dataKey="d" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="pct" fill="#b8924a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>}
        <div className="card"><b>{role === 'owner' || role === 'gm' ? 'Overdue & escalated — responsible people' : 'My open tasks'}</b>
          <div className="mt-2 space-y-2">
            {(['owner', 'gm'].includes(role) ? overdue : mine).slice(0, 6).map(x => <Link href={x.link} key={x.id} className="flex items-center justify-between rounded border border-line p-2 text-sm hover:bg-black/5"><span>{x.title}<span className="block text-xs text-mute">{x.ownerName} • due {dt(x.deadline)}</span></span><Badge t={x.status === 'escalated' ? 'red' : x.status === 'overdue' ? 'amber' : 'gray'}>{t('task.' + x.status)}</Badge></Link>)}
            {!(['owner', 'gm'].includes(role) ? overdue : mine).length && <div className="py-4 text-center text-sm text-mute">{t('common.empty')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
