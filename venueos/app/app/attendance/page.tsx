'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { allowed } from '@/lib/rbac';
import { Badge, PageHead, Table, useT, useToast, Confirm } from '@/components/ui';
import { inr } from '@/lib/format';

export default function Attendance() {
  const t = useT();
  const { attendance, workers, events, markAttendance, setOT, payStep, payroll, role } = useStore();
  const { run, node } = useToast();
  const [eventId, setEventId] = useState('EV-1009');
  const [count, setCount] = useState(24);
  const [sel, setSel] = useState<string[]>([]);
  const att = attendance.filter(a => a.eventId === eventId);
  const pr = payroll.find(p => p.eventId === eventId);
  const edit = allowed(role, 'markAttendance');
  return (
    <div>
      <PageHead title={t('nav.attendance')}>
        <select className="input w-auto" value={eventId} onChange={e => setEventId(e.target.value)}>{events.filter(e => e.status !== 'closed').slice(0, 15).map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}</select>
      </PageHead>
      {edit && <div className="card mb-4 flex flex-wrap items-end gap-3">
        <div><label className="label">Temporary workers (saved group)</label><input type="number" className="input w-28" value={count} min={1} max={100} onChange={e => setCount(Number(e.target.value))} /></div>
        <Confirm label="Bulk mark present & submit" msg={`Submit attendance for ${count} workers at ₹800/shift? This creates draft wages.`} onYes={() => run(markAttendance(eventId, count))} />
        <div className="ml-auto flex items-end gap-2">
          <span className="text-xs text-mute">{sel.length} selected</span>
          <Confirm cls="btn-gold" label="Approve 2h overtime (₹100/h)" disabled={!sel.length} msg={`Apply 2 overtime hours to ${sel.length} worker(s)?`} onYes={() => { run(setOT(eventId, sel, 2)); setSel([]); }} />
        </div>
      </div>}
      {pr && <div className="card mb-4 flex flex-wrap items-center gap-3"><div>Payroll <b>{pr.id}</b>: base {inr(pr.base)} + OT {inr(pr.ot)} = <b>{inr(pr.total)}</b></div><Badge t="amber">{t('pay.' + pr.status)}</Badge>{pr.status === 'submitted' && allowed(role, 'verifyAttendance') && <Confirm label="Verify attendance" msg="Confirm attendance is verified?" onYes={() => run(payStep(pr.id))} />}</div>}
      <div className="card"><Table head={['', 'Worker', 'In', 'Out', 'OT h', 'Verified']}>
        {att.length === 0 && <tr><td className="td text-mute" colSpan={6}>{t('common.empty')}</td></tr>}
        {att.map(a => { const w = workers.find(x => x.id === a.workerId)!; return <tr key={a.id}><td className="td"><input type="checkbox" disabled={!edit} checked={sel.includes(a.workerId)} onChange={e => setSel(e.target.checked ? [...sel, a.workerId] : sel.filter(x => x !== a.workerId))} /></td><td className="td">{w.name} <span className="text-xs text-mute">{w.id}</span></td><td className="td">{a.in ? '✓' : '—'}</td><td className="td">{a.out ? '✓' : '—'}</td><td className="td">{a.otHours}</td><td className="td">{a.verified ? <Badge t="green">Yes</Badge> : <Badge t="amber">No</Badge>}</td></tr>; })}
      </Table></div>
      {node}
    </div>
  );
}
