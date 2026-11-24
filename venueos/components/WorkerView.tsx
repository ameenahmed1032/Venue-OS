'use client';
import { useStore } from '@/lib/store';
import { inr } from '@/lib/format';
import { Badge, useT, useToast } from './ui';
import { LANGS } from '@/lib/i18n';

export default function WorkerView() {
  const t = useT();
  const { attendance, payroll, tasks, workerCheck, ackWage, taskDo, lang, setLang, workers } = useStore();
  const { run, node } = useToast();
  const me = workers.find(w => w.id === 'W-T1')!;
  const a = attendance.find(x => x.workerId === 'W-T1' && x.eventId === 'EV-1009');
  const myTasks = tasks.filter(x => x.owner === 'worker');
  const myPay = payroll.flatMap(p => p.items.filter(i => i.workerId === 'W-T1').map(i => ({ p, i })));
  const BIG = 'btn-primary !py-4 w-full text-base';
  return (
    <div className="space-y-4">
      <div className="flex gap-2">{LANGS.map(l => <button key={l.id} onClick={() => setLang(l.id)} className={`flex-1 rounded-lg border py-2 text-sm ${lang === l.id ? 'border-gold bg-gold text-white' : 'border-line bg-surface'}`}>{l.label}</button>)}</div>
      <div><div className="text-xs text-mute">{t('worker.hello')},</div><div className="text-xl font-semibold">{me.name}</div></div>
      <div className="card"><div className="mb-3 flex justify-between"><b>{t('worker.shift')}</b><span className="text-xs text-mute">Wedding Reception • Grand Durbar</span></div>
        {!a?.in && <button className={BIG} onClick={() => run(workerCheck('in'))}>{t('worker.checkin')}</button>}
        {a?.in && !a.out && <button className={BIG} onClick={() => run(workerCheck('out'))}>{t('worker.checkout')}</button>}
        {a?.out && <Badge t="green">{t('worker.checkedout')}</Badge>}
        {a?.in && !a.out && <div className="mt-2"><Badge t="green">{t('worker.checkedin')}</Badge></div>}
      </div>
      <div className="card"><b>{t('worker.tasks')}</b>
        {myTasks.map(x => <div key={x.id} className="mt-3 flex items-center justify-between gap-2"><span className="text-sm">{x.title}</span>{x.status === 'completed' ? <Badge t="green">{t('worker.done')}</Badge> : <button className="btn-primary !py-3" onClick={() => run(taskDo(x.id, 'completed'))}>{t('worker.done')}</button>}</div>)}
      </div>
      <div className="card"><b>{t('worker.wages')}</b>
        {myPay.length === 0 && <div className="mt-2 text-sm text-mute">{t('worker.nowages')}</div>}
        {myPay.map(({ p, i }) => <div key={p.id} className="mt-3 text-sm"><div className="flex justify-between"><span>{p.eventId}</span><b>{inr(i.amount)}</b></div><div className="text-xs text-mute">{inr(i.base)} + OT {inr(i.ot)} • {t('pay.' + p.status)}</div>
          {(p.status === 'disbursed' || p.status === 'acknowledged') && (i.ack ? <Badge t="green">{t('worker.acked')}</Badge> : <button className={BIG + ' mt-2'} onClick={() => run(ackWage(p.id, 'W-T1'))}>{t('worker.ack')}</button>)}</div>)}
      </div>
      {node}
    </div>
  );
}
