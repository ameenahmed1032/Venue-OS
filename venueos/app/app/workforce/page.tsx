'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PageHead, Table, Badge, useT } from '@/components/ui';
import { inr, csv } from '@/lib/format';

export default function Workforce() {
  const t = useT();
  const { workers, role } = useStore();
  const [k, setK] = useState('all');
  const list = workers.filter(w => k === 'all' || w.kind === k);
  return (
    <div>
      <PageHead title={t('nav.workforce')}>{['all', 'permanent', 'temporary', 'contract'].map(x => <button key={x} className={k === x ? 'btn-primary' : 'btn-ghost'} onClick={() => setK(x)}>{x}</button>)}<button className="btn-ghost" onClick={() => csv('workforce', list.map(w => ({ id: w.id, name: w.name, kind: w.kind, role: w.role, rate: w.rate })))}>{t('common.export')}</button></PageHead>
      <div className="card"><Table head={['ID', 'Name', 'Type', 'Role', ...(role === 'owner' || role === 'hr' ? ['Rate/shift'] : [])]}>
        {list.slice(0, 100).map(w => <tr key={w.id}><td className="td">{w.id}</td><td className="td">{w.name}</td><td className="td"><Badge>{w.kind}</Badge></td><td className="td">{w.role}</td>{(role === 'owner' || role === 'hr') && <td className="td">{inr(w.rate)}</td>}</tr>)}
      </Table><p className="mt-2 text-xs text-mute">{list.length} workers (showing 100)</p></div>
    </div>
  );
}
