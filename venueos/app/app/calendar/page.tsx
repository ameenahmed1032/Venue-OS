'use client';
import { useState } from 'react';
import { useStore, todayStr } from '@/lib/store';
import { PageHead, useT } from '@/components/ui';

const color: Record<string, string> = { upcoming: 'bg-sky-200 text-sky-900', preparation: 'bg-amber-200 text-amber-900', ready: 'bg-emerald-200 text-emerald-900', live: 'bg-emerald-600 text-white', opscomplete: 'bg-slate-300', pendingrec: 'bg-amber-400', closed: 'bg-slate-200 text-slate-600' };
export default function Calendar() {
  const t = useT();
  const { events, now } = useStore();
  const [off, setOff] = useState(0);
  const base = new Date(todayStr(now) + 'T00:00:00Z'); base.setUTCMonth(base.getUTCMonth() + off, 1);
  const y = base.getUTCFullYear(), m = base.getUTCMonth();
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const lead = base.getUTCDay();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const key = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const halls = ['Grand Durbar', 'Palace Lawn', 'Rajmahal Hall', 'Garden Pavilion'];
  const conflicts = (d: number) => halls.some(h => events.filter(e => e.date === key(d) && e.hall === h && e.status !== 'closed').length > 1);
  return (
    <div>
      <PageHead title={t('nav.calendar')}>
        <button className="btn-ghost" onClick={() => setOff(off - 1)}>←</button><span className="self-center text-sm font-medium">{base.toLocaleString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span><button className="btn-ghost" onClick={() => setOff(off + 1)}>→</button>
      </PageHead>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="px-1 font-semibold text-mute">{d}</div>)}
        {cells.map((d, i) => d === null ? <div key={i} /> : (
          <div key={i} className={`min-h-[84px] rounded-lg border p-1 ${key(d) === todayStr(now) ? 'border-gold' : 'border-line'} bg-surface`}>
            <div className="flex justify-between"><span>{d}</span>{conflicts(d) && <span className="text-red-600" title="Hall conflict">⚠</span>}</div>
            {events.filter(e => e.date === key(d)).map(e => <div key={e.id} className={`mt-1 truncate rounded px-1 ${color[e.status]}`} title={`${e.name} • ${e.hall} • ${t('ev.' + e.status)}`}>{e.hall.split(' ')[0]}: {e.type}</div>)}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">{Object.keys(color).map(k => <span key={k} className={`rounded px-2 py-0.5 ${color[k]}`}>{t('ev.' + k)}</span>)}</div>
    </div>
  );
}
