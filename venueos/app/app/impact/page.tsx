'use client';
import { useState } from 'react';
import { PageHead } from '@/components/ui';
import { inr } from '@/lib/format';

const BEFORE = ['Paper registers', 'Fragmented WhatsApp', 'Delayed expense entry', 'Unclear responsibility', 'Manual payroll', 'No profitability visibility', 'Late reconciliation', 'Dependence on one admin'];
const AFTER = ['Distributed capture (5–15 s entries)', 'Role-specific interfaces', 'Automatic wages from attendance', 'Central cash records', 'Live event visibility', 'Reminders & escalation', 'Task accountability', 'Structured event closure'];

export default function Impact() {
  const [v, setV] = useState({ events: 30, hours: 6, rate: 250, saved: 50, leaks: 20000, impl: 400000, maint: 120000 });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Math.max(0, Number(e.target.value)) });
  const timeSaving = v.events * 12 * v.hours * (v.saved / 100) * v.rate;
  const gross = timeSaving + v.leaks * 12;
  const net = gross - v.maint;
  const payback = net > 0 ? (v.impl / net) * 12 : null;
  const F = (k: keyof typeof v, label: string) => <div><label className="label">{label}</label><input type="number" className="input" value={v[k]} onChange={set(k)} /></div>;
  return (
    <div>
      <PageHead title="How VenueOS Transforms Your Operations" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><b>Before</b><ul className="mt-2 list-disc pl-5 text-sm text-red-700">{BEFORE.map(x => <li key={x}>{x}</li>)}</ul></div>
        <div className="card"><b>After</b><ul className="mt-2 list-disc pl-5 text-sm text-emerald-700">{AFTER.map(x => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <div className="card mt-4"><b>ROI calculator (editable assumptions)</b>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{F('events', 'Events / month')}{F('hours', 'Admin hours / event')}{F('rate', 'Hourly cost ₹')}{F('saved', 'Time saved %')}{F('leaks', 'Avoidable discrepancies ₹ / month')}{F('impl', 'Implementation cost ₹')}{F('maint', 'Annual maintenance ₹')}</div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
          <div className="card">Time savings / yr<div className="text-xl font-semibold">{inr(timeSaving)}</div></div>
          <div className="card">Gross benefit / yr<div className="text-xl font-semibold">{inr(gross)}</div></div>
          <div className="card">Net annual savings<div className={`text-xl font-semibold ${net > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{inr(net)}</div></div>
          <div className="card">Payback<div className="text-xl font-semibold">{payback === null ? 'No payback' : payback.toFixed(1) + ' months'}</div></div>
        </div>
        <p className="mt-3 text-xs text-mute">Illustrative estimate from the assumptions above. Not a guarantee of savings. Figures are fictional demo inputs.</p>
      </div>
    </div>
  );
}
