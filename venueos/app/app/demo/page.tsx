'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, type Res } from '@/lib/store';
import { homeFor } from '@/lib/rbac';
import type { RoleId } from '@/lib/types';
import { PageHead, useT, useToast, Badge } from '@/components/ui';

type Step = { role: RoleId; text: string; link: string; run?: () => Res; lang?: 'en' | 'hi' | 'kn' };
const g = () => useStore.getState();
const as = (r: RoleId) => useStore.setState({ role: r });
const lastEv = () => g().enquiries.find(e => e.name === 'Anil Gowda')?.eventId ?? 'EV-1009';

const SCENARIOS: { id: string; title: string; mins: number; desc: string; steps: Step[]; fixture?: boolean }[] = [
  { id: 's1', title: '1 · Website enquiry → booking', mins: 3, desc: 'Wedding reception, 1,200 guests, quote ₹6,50,000, advance ₹1,50,000.', steps: [
    { role: 'booking', text: 'Customer submits website enquiry (1,200 guests)', link: '/app/crm', run: () => g().submitEnquiry({ name: 'Anil Gowda', phone: '9812345678', type: 'Wedding', guests: 1200, date: '2027-01-18', notes: 'Reception' }, true) },
    { role: 'booking', text: 'Move through Contacted → Site Visit', link: '/app/crm', run: () => { const id = g().enquiries.find(e => e.name === 'Anil Gowda')!.id; as('booking'); g().moveEnquiry(id, 'contacted'); return g().moveEnquiry(id, 'visit'); } },
    { role: 'booking', text: 'Send quotation ₹6,50,000 → Negotiation', link: '/app/crm', run: () => { const id = g().enquiries.find(e => e.name === 'Anil Gowda')!.id; as('booking'); g().moveEnquiry(id, 'quoted', 650000); return g().moveEnquiry(id, 'negotiation'); } },
    { role: 'booking', text: 'Confirm booking → event & 6 tasks auto-created', link: '/app/events', run: () => { as('booking'); return g().confirmBooking(g().enquiries.find(e => e.name === 'Anil Gowda')!.id); } },
    { role: 'cashier', text: 'Cashier records ₹1,50,000 advance', link: '/app/cash', run: () => { as('cashier'); return g().receipt(lastEv(), 150000, 'cash', 'Advance'); } },
    { role: 'owner', text: 'Owner sees ₹5,00,000 outstanding', link: '/app/events' },
  ] },
  { id: 's2', title: '2 · Temporary workforce & cash payroll', mins: 4, desc: '24 workers × ₹800 + 4 workers × 2h OT × ₹100 = ₹20,000.', steps: [
    { role: 'supervisor', text: 'Supervisor bulk-marks 24 workers present', link: '/app/attendance', run: () => { as('supervisor'); return g().markAttendance('EV-1009', 24); } },
    { role: 'supervisor', text: 'Approve 2h overtime for 4 workers (→ ₹20,000)', link: '/app/attendance', run: () => { as('supervisor'); return g().setOT('EV-1009', ['W-T2', 'W-T3', 'W-T4', 'W-T5'], 2); } },
    { role: 'supervisor', text: 'Supervisor verifies attendance', link: '/app/payroll', run: () => { as('supervisor'); return g().payStep(g().payroll.find(p => p.eventId === 'EV-1009')!.id); } },
    { role: 'hr', text: 'HR calculates payroll', link: '/app/payroll', run: () => { as('hr'); return g().payStep(g().payroll.find(p => p.eventId === 'EV-1009')!.id); } },
    { role: 'finance', text: 'Finance approves', link: '/app/payroll', run: () => { as('finance'); return g().payStep(g().payroll.find(p => p.eventId === 'EV-1009')!.id); } },
    { role: 'cashier', text: 'Cashier disburses cash (ledger outflow)', link: '/app/cash', run: () => { as('cashier'); return g().payStep(g().payroll.find(p => p.eventId === 'EV-1009')!.id); } },
    { role: 'worker', text: 'Worker acknowledges wages on mobile', link: '/app/worker' },
  ] },
  { id: 's3', title: '3 · Cash discrepancy', mins: 3, desc: 'Expected ₹1,13,000, counted ₹1,12,500 → ₹500 shortfall. No silent write-off.', steps: [
    { role: 'cashier', text: 'Cashier submits denomination count = ₹1,12,500', link: '/app/cash', run: () => { as('cashier'); return g().submitCount({ 500: 225, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 }); } },
    { role: 'finance', text: 'Finance receives alert and reviews evidence', link: '/app/notifications' },
    { role: 'finance', text: 'Record authorised adjustment with a reason', link: '/app/cash', run: () => { as('finance'); const c = g().counts.find(x => x.status === 'open'); return c ? g().resolveCount(c.id, 'adjusted', 'Change shortfall confirmed after evidence review') : { ok: false, msg: 'No open discrepancy' }; } },
  ] },
  { id: 's4', title: '4 · Missing data & accountability', mins: 3, desc: 'Advance time; overdue reminders and escalation fire.', steps: [
    { role: 'owner', text: 'Owner views overdue/open tasks', link: '/app/tasks' },
    { role: 'owner', text: 'Advance time +6h → reminders & escalation', link: '/app/notifications', run: () => { g().advance(6); return { ok: true, msg: 'Time advanced 6h' }; } },
    { role: 'gm', text: 'GM delegates the overdue task', link: '/app/tasks' },
  ] },
  { id: 's5', title: '5 · Event profitability', mins: 2, desc: 'Contracted ₹6,50,000, collected ₹5,50,000, direct costs → contribution.', steps: [{ role: 'owner', text: 'Open Financial Intelligence — cash ≠ profit', link: '/app/finance' }] },
  { id: 's6', title: '6 · Vendor approval', mins: 3, desc: 'Decoration invoice ₹75,000 through threshold approval.', steps: [
    { role: 'procure', text: 'Procurement moves order → delivery verified → invoice', link: '/app/vendors', run: () => { as('procure'); g().invStep('INV-1'); return g().invStep('INV-1'); } },
    { role: 'finance', text: 'Finance tries approval (>₹50,000 needs owner)', link: '/app/vendors', run: () => { as('finance'); return g().invStep('INV-1'); } },
    { role: 'owner', text: 'Owner approves payment', link: '/app/vendors', run: () => { as('owner'); return g().invStep('INV-1'); } },
    { role: 'cashier', text: 'Cashier pays (single ledger outflow, no double count)', link: '/app/vendors', run: () => { as('cashier'); return g().invStep('INV-1'); } },
  ] },
  { id: 's7', title: '7 · Event closure', mins: 3, desc: 'Corporate summit with missing attendance, invoice and reconciliation.', steps: [
    { role: 'owner', text: 'See failing closure checks', link: '/app/closure' },
    { role: 'supervisor', text: 'Supervisor verifies attendance', link: '/app/payroll', run: () => { as('supervisor'); return g().payStep('PR-1'); } },
    { role: 'owner', text: 'Owner closes with exception (liabilities preserved)', link: '/app/closure', run: () => { as('owner'); return g().closeEvent('EV-1008', 'Vendor invoice dispute pending'); } },
  ] },
  { id: 's8', title: '8 · Worker mobile & language', mins: 3, desc: 'Kannada → Hindi, same records; management URL denied.', steps: [
    { role: 'worker', text: 'Worker (Kannada) checks in', link: '/app/worker', lang: 'kn', run: () => g().workerCheck('in') },
    { role: 'worker', text: 'Switch to Hindi — records persist; complete task', link: '/app/worker', lang: 'hi', run: () => g().taskDo('T-S4', 'completed') },
    { role: 'worker', text: 'Attempt management URL /app/cash → denied', link: '/app/cash' },
  ] },
  { id: 's9', title: '9 · Copilot', mins: 3, desc: 'Cash question, discrepancy, Kannada/Hindi, platform denial.', steps: [
    { role: 'owner', text: 'Ask Copilot for cash position & discrepancy', link: '/app/copilot' },
    { role: 'super', text: 'Super Admin: tenant health, then payroll query → denied', link: '/app/copilot' },
  ] },
];

export default function Demo() {
  const t = useT(); const router = useRouter();
  const { setRole, setLang, reset } = useStore();
  const { run, node } = useToast();
  const [sid, setSid] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const sc = SCENARIOS.find(x => x.id === sid);
  const go = (st: Step) => { setRole(st.role); if (st.lang) setLang(st.lang); router.push(st.link === '/app/cash' && st.role === 'worker' ? st.link : st.link); };
  return (
    <div>
      <PageHead title={t('nav.demo')}>{sc && <button className="btn-ghost" onClick={() => { setSid(null); setI(0); }}>All scenarios</button>}</PageHead>
      {!sc ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{SCENARIOS.map(x => <div key={x.id} className="card"><div className="font-medium">{x.title}</div><div className="mt-1 text-sm text-mute">{x.desc}</div><div className="mt-2 flex items-center justify-between"><Badge>{x.mins} min • {x.steps.length} steps</Badge><button className="btn-gold" onClick={() => { if (confirm('Start from a clean fixture? This resets demo data.')) { reset(); setSid(x.id); setI(0); } }}>Start</button></div></div>)}</div> : (
        <div className="card space-y-4">
          <div className="flex items-center justify-between"><b>{sc.title}</b><span className="text-sm text-mute">Step {i + 1} / {sc.steps.length}</span></div>
          <div className="h-2 rounded bg-black/10"><div className="h-2 rounded bg-gold" style={{ width: ((i + 1) / sc.steps.length * 100) + '%' }} /></div>
          <div className="rounded-lg border-2 border-gold p-4"><div className="text-xs text-mute">Recommended role: {sc.steps[i].role}</div><div className="mt-1 text-lg">{sc.steps[i].text}</div>
            <div className="mt-3 flex flex-wrap gap-2"><button className="btn-ghost" onClick={() => go(sc.steps[i])}>Switch role & open screen</button>{sc.steps[i].run && <button className="btn-gold" onClick={() => { if (confirm(`Run this step now?\n\n${sc.steps[i].text}`)) { const r = run(sc.steps[i].run!()); if (r.ok) go(sc.steps[i]); } }}>Run step (guided)</button>}</div>
            <p className="mt-2 text-xs text-mute">Re-running a step is blocked by duplicate protections. Previous only moves the pointer; it never duplicates transactions.</p></div>
          <div className="flex justify-between"><button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button><button className="btn-ghost" onClick={() => { reset(); setI(0); }}>Reset scenario</button><button className="btn-primary" disabled={i === sc.steps.length - 1} onClick={() => setI(i + 1)}>Next</button></div>
        </div>
      )}
      {node}
    </div>
  );
}
