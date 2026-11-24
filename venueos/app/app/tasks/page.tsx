'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ROLES, allowed } from '@/lib/rbac';
import { Badge, PageHead, Table, useT, useToast, Stat } from '@/components/ui';
import { dt } from '@/lib/format';

export default function Tasks() {
  const t = useT();
  const { tasks, role, taskDo, delegateTask, extendTask } = useStore();
  const { run, node } = useToast();
  const [filter, setFilter] = useState<'open' | 'mine' | 'all'>('open');
  const [to, setTo] = useState('eventmgr');
  const mgmt = ['owner', 'gm'].includes(role);
  const list = tasks.filter(x => filter === 'all' || (filter === 'mine' ? x.owner === role : x.status !== 'completed') ).filter(x => mgmt || x.owner === role || filter === 'all').slice(0, 80);
  const done = tasks.filter(x => x.status === 'completed').length;
  const late = tasks.filter(x => x.delays > 0).length;
  const byDept: Record<string, number> = {}; tasks.filter(x => x.delays > 0).forEach(x => byDept[x.dept] = (byDept[x.dept] ?? 0) + 1);
  return (
    <div>
      <PageHead title={t('nav.tasks')}>{(['open', 'mine', 'all'] as const).map(f => <button key={f} className={filter === f ? 'btn-primary' : 'btn-ghost'} onClick={() => setFilter(f)}>{f}</button>)}</PageHead>
      {mgmt && <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Completion rate" value={Math.round(done / tasks.length * 100) + '%'} /><Stat label="Overdue now" value={tasks.filter(x => x.status === 'overdue').length} tone="red" /><Stat label="Escalated" value={tasks.filter(x => x.status === 'escalated').length} tone="red" /><Stat label="Repeated delays" value={late} sub={Object.entries(byDept).map(([k, v]) => `${k} ${v}`).join(' • ')} /></div>}
      <div className="card"><Table head={['Task', 'Owner', 'Dept', 'Deadline', 'Priority', 'Status', 'Actions']}>
        {list.length === 0 && <tr><td className="td text-mute" colSpan={7}>{t('common.empty')}</td></tr>}
        {list.map(x => <tr key={x.id}><td className="td">{x.title}<div className="text-xs text-mute">{x.eventId} {x.mandatoryFinance && '• mandatory finance record'}</div></td><td className="td">{x.ownerName}</td><td className="td">{x.dept}</td><td className="td">{dt(x.deadline)}</td><td className="td">{x.priority}</td><td className="td"><Badge t={x.status === 'completed' ? 'green' : x.status === 'escalated' ? 'red' : x.status === 'overdue' ? 'amber' : 'gray'}>{t('task.' + x.status)}</Badge></td>
          <td className="td"><div className="flex flex-wrap gap-1">
            {x.status !== 'completed' && <button className="btn-primary !py-1" onClick={() => run(taskDo(x.id, 'completed'))}>Complete</button>}
            {x.status !== 'completed' && allowed(role, 'delegate') && <><select className="input !w-28 !py-1" value={to} onChange={e => setTo(e.target.value)}>{ROLES.filter(r => !['super', 'worker', 'owner'].includes(r.id)).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><button className="btn-ghost !py-1" onClick={() => run(delegateTask(x.id, to as any, 'Delegated by management to meet deadline'))}>Delegate</button><button className="btn-ghost !py-1" onClick={() => run(extendTask(x.id, 4, 'Vendor delay — approved +4h'))}>+4h</button></>}
          </div></td></tr>)}
      </Table></div>
      {node}
    </div>
  );
}
