'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang, RoleId, Enquiry, VEvent, Txn, Worker, Attendance, Payroll, Vendor, Invoice, Task, Audit, Notif, CashCount, Expense, Stage, PayStatus, InvStatus, TaskStatus } from './types';
import { PAY_FLOW, INV_FLOW } from './types';
import { seed, BASE_NOW, makeChecklist, readiness } from './seed';
import { ROLES, allowed, OWNER_APPROVAL_THRESHOLD } from './rbac';

export interface Data { enquiries: Enquiry[]; events: VEvent[]; txns: Txn[]; workers: Worker[]; attendance: Attendance[]; payroll: Payroll[]; vendors: Vendor[]; invoices: Invoice[]; tasks: Task[]; audit: Audit[]; notifs: Notif[]; counts: CashCount[]; expenses: Expense[] }
export type Res = { ok: boolean; msg: string };
const ok = (msg: string): Res => ({ ok: true, msg });
const no = (msg: string): Res => ({ ok: false, msg });

function initial(): Data {
  const d = seed();
  // Scenario 7: corporate event with missing attendance (unverified) and payroll awaiting supervisor
  const w = d.workers.filter(x => x.kind === 'temporary').slice(30, 40);
  d.attendance = [
    ...w.map(x => ({ id: `AT-C-${x.id}`, eventId: 'EV-1008', workerId: x.id, in: true, out: true, otHours: 0, verified: false })),
    { id: 'AT-DEMO', eventId: 'EV-1009', workerId: 'W-T1', in: false, out: false, otHours: 0, verified: false },
  ];
  d.payroll = [buildPayroll('EV-1008', 'PR-1', d.attendance.filter(a => a.eventId === 'EV-1008'), d.workers, 'submitted')];
  return d;
}

export function buildPayroll(eventId: string, id: string, att: Attendance[], workers: Worker[], status: PayStatus, prev?: Payroll): Payroll {
  const items = att.filter(a => a.in && a.out).map(a => {
    const w = workers.find(x => x.id === a.workerId)!;
    const base = w.rate, ot = a.otHours * 100;
    const old = prev?.items.find(i => i.workerId === a.workerId);
    return { workerId: a.workerId, shifts: 1, otHours: a.otHours, base, ot, amount: base + ot, ack: old?.ack ?? false };
  });
  const base = items.reduce((s, i) => s + i.base, 0), ot = items.reduce((s, i) => s + i.ot, 0);
  return { id, eventId, status, items, base, ot, total: base + ot, history: prev?.history ?? [{ s: status, by: 'System', ts: BASE_NOW }] };
}

interface State extends Data {
  now: string; role: RoleId; lang: Lang; dark: boolean; seq: number; hydrated: boolean; demoStep: Record<string, number>; copilotHistory: { q: string; a: string; ts: string; role: RoleId }[];
  setRole: (r: RoleId) => void; setLang: (l: Lang) => void; toggleDark: () => void; advance: (h: number) => void; reset: () => void;
  submitEnquiry: (e: { name: string; phone: string; type: string; guests: number; date: string; notes: string; source?: Enquiry['source'] }, asPublic?: boolean) => Res;
  moveEnquiry: (id: string, stage: Stage, quote?: number) => Res;
  confirmBooking: (id: string) => Res;
  receipt: (eventId: string, amount: number, method: Txn['method'], note: string) => Res;
  markAttendance: (eventId: string, count: number) => Res;
  setOT: (eventId: string, workerIds: string[], hours: number) => Res;
  payStep: (id: string) => Res;
  ackWage: (payrollId: string, workerId: string) => Res;
  workerCheck: (dir: 'in' | 'out') => Res;
  addExpense: (e: { eventId?: string; category: string; amount: number; note: string }) => Res;
  decideExpense: (id: string, approve: boolean) => Res;
  addInvoice: (e: { vendorId: string; eventId: string; number: string; amount: number; desc: string }) => Res;
  invStep: (id: string) => Res;
  submitCount: (denoms: Record<string, number>) => Res;
  resolveCount: (id: string, mode: 'adjusted' | 'unresolved', reason: string) => Res;
  taskDo: (id: string, status: TaskStatus) => Res;
  delegateTask: (id: string, owner: RoleId, reason: string) => Res;
  extendTask: (id: string, hours: number, reason: string) => Res;
  toggleChecklist: (eventId: string, cid: string) => Res;
  closeEvent: (eventId: string, exception?: string) => Res;
  markRead: (id: string) => void;
  log: (action: string, record: string) => void;
}

const roleName = (r: RoleId) => ROLES.find(x => x.id === r)!;
const mk = (s: State, p: string) => `${p}-${s.seq + 1}`;
const addA = (s: State, action: string, record: string, extra: Partial<Audit> = {}): Audit[] => [{ id: `AU-${s.seq + 100}-${s.audit.length}`, ts: s.now, actor: roleName(s.role).user, role: s.role, action, record, ...extra }, ...s.audit];
const addN = (s: State, to: Notif['to'], text: string, link: string, channel: Notif['channel'] = 'app'): Notif[] => [{ id: `N-${s.seq + 100}-${s.notifs.length}`, ts: s.now, to, text, link, channel, read: false }, ...s.notifs];

export const todayStr = (now: string) => new Date(new Date(now).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
export function cashSummary(txns: Txn[], now: string) {
  const day = todayStr(now);
  const t = txns.filter(x => x.status === 'confirmed' && todayStr(x.ts) === day);
  const opening = t.filter(x => x.category === 'opening').reduce((a, x) => a + x.amount, 0);
  const inflow = t.filter(x => x.kind === 'in' && x.category !== 'opening' && x.method === 'cash').reduce((a, x) => a + x.amount, 0);
  const outflow = t.filter(x => x.kind === 'out' && x.method === 'cash').reduce((a, x) => a + x.amount, 0);
  return { opening, inflow, outflow, expected: opening + inflow - outflow };
}

export function closureChecks(d: Data, now: string, eventId: string) {
  const ev = d.events.find(e => e.id === eventId)!;
  const hist = ev.status === 'closed';
  const att = d.attendance.filter(a => a.eventId === eventId);
  const pr = d.payroll.filter(p => p.eventId === eventId);
  const inv = d.invoices.filter(i => i.eventId === eventId);
  const exp = d.expenses.filter(x => x.eventId === eventId);
  const lastCount = d.counts[0];
  return [
    { key: 'attendance', label: 'Attendance verified', ok: hist || att.every(a => a.verified), owner: 'Floor Supervisor', deadline: 'Before payroll' },
    { key: 'payroll', label: 'Wages disbursed & acknowledged (liabilities cleared)', ok: hist || pr.every(p => p.status === 'acknowledged' || p.status === 'disbursed'), owner: 'Cashier / HR', deadline: 'Next morning' },
    { key: 'vendors', label: 'Vendor invoices recorded and paid', ok: hist || inv.every(i => i.status === 'paid'), owner: 'Procurement / Finance', deadline: 'Before closure' },
    { key: 'expenses', label: 'Expenses approved', ok: hist || exp.every(e => e.status !== 'pending'), owner: 'Finance Manager', deadline: 'Before closure' },
    { key: 'customer', label: 'Customer payment settled', ok: hist || ev.collected >= ev.contracted, owner: 'Booking Manager', deadline: 'Before closure' },
    { key: 'reconciliation', label: 'Cash reconciliation completed', ok: hist || (!!lastCount && todayStr(lastCount.ts) === todayStr(now) && (lastCount.status === 'balanced' || lastCount.status === 'adjusted')), owner: 'Cashier', deadline: 'Before financial closure' },
    { key: 'incidents', label: 'No unresolved incidents', ok: true, owner: 'Event Manager', deadline: 'Before closure' },
  ];
}

export const useStore = create<State>()(persist((set, get) => ({
  ...initial(), now: BASE_NOW, role: 'owner', lang: 'en', dark: false, seq: 0, hydrated: false, demoStep: {}, copilotHistory: [],
  setRole: r => set({ role: r }),
  setLang: l => set({ lang: l }),
  toggleDark: () => set(s => ({ dark: !s.dark })),
  reset: () => set({ ...initial(), now: BASE_NOW, seq: 0, copilotHistory: [], demoStep: {} }),
  log: (action, record) => set(s => ({ audit: addA(s, action, record) })),
  markRead: id => set(s => ({ notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n) })),

  advance: h => set(s => {
    const now = new Date(new Date(s.now).getTime() + h * 3600e3).toISOString();
    let audit = s.audit, notifs = s.notifs, seq = s.seq;
    const sx = { ...s, now } as State;
    const tasks = s.tasks.map(t => {
      if (t.status === 'completed') return t;
      const late = new Date(now).getTime() - new Date(t.deadline).getTime();
      if (late > 4 * 3600e3 && (t.status === 'overdue')) {
        seq++; sx.seq = seq; sx.audit = audit; sx.notifs = notifs;
        notifs = addN(sx, t.escalateTo, `Escalated: "${t.title}" owned by ${t.ownerName} is >4h overdue`, '/app/tasks', 'whatsapp');
        audit = addA({ ...sx, role: t.escalateTo }, 'Task escalated', t.id);
        return { ...t, status: 'escalated' as TaskStatus, delays: t.delays + 1 };
      }
      if (late > 0 && t.status !== 'overdue' && t.status !== 'escalated') {
        seq++; sx.seq = seq; sx.audit = audit; sx.notifs = notifs;
        notifs = addN(sx, t.owner, `Reminder: "${t.title}" is overdue`, t.link, 'whatsapp');
        notifs = addN({ ...sx, notifs }, 'owner', `${t.ownerName} missed: ${t.title}`, '/app/tasks');
        audit = addA({ ...sx, role: t.owner }, 'Task marked overdue', t.id);
        return { ...t, status: 'overdue' as TaskStatus, delays: t.delays + 1 };
      }
      return t;
    });
    return { now, tasks, audit, notifs, seq };
  }),

  submitEnquiry: (e, asPublic) => {
    const s = get();
    if (!asPublic && !allowed(s.role, 'addEnquiry')) return no('Not permitted');
    if (!e.name.trim() || !/^\d{10}$/.test(e.phone) || e.guests < 1) return no('Name, 10-digit phone and guest count are required');
    const id = mk(s, 'ENQ');
    const enq: Enquiry = { id, name: e.name, phone: e.phone, type: e.type, guests: e.guests, date: e.date, source: asPublic ? 'website' : (e.source ?? 'walkin'), stage: 'new', notes: e.notes, createdAt: s.now, history: ['Enquiry created'] };
    set({ seq: s.seq + 1, enquiries: [enq, ...s.enquiries], audit: addA(s, 'Enquiry created', id, { next: enq.source }), notifs: addN(s, 'booking', `New ${enq.source} enquiry: ${enq.name} (${enq.type}, ${enq.guests} guests)`, '/app/crm', 'whatsapp') });
    return ok(`Enquiry ${id} created in CRM`);
  },
  moveEnquiry: (id, stage, quote) => {
    const s = get();
    if (!allowed(s.role, 'quote')) return no('Not permitted');
    const enq = s.enquiries.find(x => x.id === id); if (!enq) return no('Not found');
    if (stage === 'quoted' && !(quote && quote > 0) && !enq.quote) return no('Quotation amount required');
    set({ enquiries: s.enquiries.map(x => x.id === id ? { ...x, stage, quote: quote ?? x.quote, history: [...x.history, `Moved to ${stage}`] } : x), audit: addA(s, 'Enquiry stage changed', id, { prev: enq.stage, next: stage }) });
    return ok(`Moved to ${stage}`);
  },
  confirmBooking: id => {
    const s = get();
    if (!allowed(s.role, 'confirmBooking')) return no('Not permitted');
    const enq = s.enquiries.find(x => x.id === id); if (!enq) return no('Not found');
    if (enq.eventId) return no('Already confirmed (duplicate prevented)');
    if (!enq.quote) return no('A quotation is required before confirmation');
    const evId = `EV-${1100 + s.events.length}`;
    const cl = makeChecklist(0);
    const ev: VEvent = { id: evId, name: `${enq.type} – ${enq.name}`, type: enq.type, hall: 'Grand Durbar', date: enq.date, guests: enq.guests, customer: enq.name, manager: 'Ravi Kumar', status: 'upcoming', contracted: enq.quote, collected: 0, budget: Math.round(enq.quote * 0.55), readiness: readiness(cl), checklist: cl, incidents: 0 };
    const mkT = (i: number, title: string, dept: string, owner: RoleId, ownerName: string, link: string, fin = false): Task => ({ id: `T-${evId}-${i}`, title, eventId: evId, dept, owner, ownerName, deadline: enq.date + 'T08:00:00+05:30', priority: 'high', status: 'notstarted', escalateTo: 'gm', delays: 0, link, mandatoryFinance: fin });
    const tasks = [mkT(1, 'Assign event manager & halls', 'Operations', 'gm', 'Vikram Hegde', '/app/events'), mkT(2, 'Submit attendance before shift', 'Operations', 'supervisor', 'Geeta Naik', '/app/attendance'), mkT(3, 'Verify vendor deliveries', 'Procurement', 'procure', 'Prakash Shetty', '/app/vendors'), mkT(4, 'Record shift expenses', 'Finance', 'cashier', 'Meena Gowda', '/app/expenses', true), mkT(5, 'Cash reconciliation', 'Finance', 'cashier', 'Meena Gowda', '/app/cash', true), mkT(6, 'Calculate payroll by next morning', 'HR', 'hr', 'Lakshmi Bhat', '/app/payroll')];
    set({ seq: s.seq + 1, events: [ev, ...s.events], tasks: [...tasks, ...s.tasks], enquiries: s.enquiries.map(x => x.id === id ? { ...x, stage: 'confirmed', eventId: evId, history: [...x.history, 'Booking confirmed'] } : x), audit: addA(s, 'Booking confirmed → event + 6 tasks created', evId, { prev: id }), notifs: addN(s, 'owner', `Booking confirmed: ${ev.name}. Outstanding ${ev.contracted}`, '/app/events') });
    return ok(`Event ${evId} created with 6 automatic tasks`);
  },
  receipt: (eventId, amount, method, note) => {
    const s = get();
    if (!allowed(s.role, 'receipt')) return no('Not permitted');
    if (!(amount > 0)) return no('Enter a valid amount');
    const ev = s.events.find(e => e.id === eventId); if (!ev) return no('Select an event');
    if (ev.collected + amount > ev.contracted) return no('Receipt exceeds contracted amount');
    const id = `TX-${String(s.txns.length + 1).padStart(4, '0')}`;
    const tx: Txn = { id, ts: s.now, kind: 'in', amount, method, category: 'booking-receipt', eventId, by: roleName(s.role).user, status: 'confirmed', note, evidence: 'receipt-' + id };
    set({ seq: s.seq + 1, txns: [tx, ...s.txns], events: s.events.map(e => e.id === eventId ? { ...e, collected: e.collected + amount } : e), audit: addA(s, 'Receipt recorded', id, { next: String(amount) }), notifs: addN(s, 'owner', `${amount} received for ${ev.name} (${method})`, '/app/cash') });
    return ok(`Receipt ${id} recorded`);
  },

  markAttendance: (eventId, count) => {
    const s = get();
    if (!allowed(s.role, 'markAttendance')) return no('Not permitted');
    if (s.attendance.some(a => a.eventId === eventId && a.workerId === 'W-T2')) return no('Attendance already submitted for this event');
    const ws = s.workers.filter(w => w.kind !== 'permanent' && w.id !== 'W-T1').slice(0, count);
    if (!ws.length) return no('No workers');
    const att = ws.map(w => ({ id: `AT-${eventId}-${w.id}`, eventId, workerId: w.id, in: true, out: true, otHours: 0, verified: false }));
    const demoMe = s.attendance.find(a => a.eventId === eventId && a.workerId === 'W-T1');
    const pr = buildPayroll(eventId, mk(s, 'PR'), att, s.workers, 'submitted');
    set({ seq: s.seq + 1, attendance: [...s.attendance.filter(a => !(a.eventId === eventId && a.workerId !== 'W-T1')), ...att, ...(demoMe ? [] : [])], payroll: [pr, ...s.payroll.filter(p => p.eventId !== eventId)], audit: addA(s, `Bulk attendance for ${ws.length} workers`, eventId), tasks: s.tasks.map(t => t.eventId === eventId && t.title.includes('attendance') && t.status !== 'completed' ? { ...t, status: 'completed' as TaskStatus } : t), notifs: addN(s, 'hr', `Attendance submitted for ${eventId} (${ws.length} workers)`, '/app/payroll') });
    return ok(`${ws.length} workers marked present; draft wages created`);
  },
  setOT: (eventId, ids, hours) => {
    const s = get();
    if (!allowed(s.role, 'markAttendance')) return no('Not permitted');
    const pr = s.payroll.find(p => p.eventId === eventId); if (!pr) return no('Submit attendance first');
    if (PAY_FLOW.indexOf(pr.status) >= PAY_FLOW.indexOf('approved')) return no('Payroll already approved — cannot edit');
    const att = s.attendance.map(a => a.eventId === eventId && ids.includes(a.workerId) ? { ...a, otHours: hours } : a);
    const np = buildPayroll(eventId, pr.id, att.filter(a => a.eventId === eventId), s.workers, pr.status, pr);
    set({ attendance: att, payroll: s.payroll.map(p => p.id === pr.id ? np : p), audit: addA(s, `Overtime ${hours}h approved for ${ids.length} workers`, pr.id, { prev: String(pr.total), next: String(np.total) }) });
    return ok(`Overtime applied. Total ${np.total}`);
  },
  payStep: id => {
    const s = get();
    const p = s.payroll.find(x => x.id === id); if (!p) return no('Not found');
    const i = PAY_FLOW.indexOf(p.status); const next = PAY_FLOW[i + 1];
    if (!next || next === 'acknowledged') return no('Awaiting worker acknowledgement');
    const need = { verified: 'verifyAttendance', calculated: 'calcPayroll', approved: 'approvePayroll', disbursed: 'payWages' } as const;
    const a = need[next as keyof typeof need];
    if (!allowed(s.role, a)) return no(`Role ${roleName(s.role).name} cannot perform "${next}"`);
    let txns = s.txns, extra: Partial<State> = {};
    if (next === 'verified') extra = { attendance: s.attendance.map(x => x.eventId === p.eventId ? { ...x, verified: true } : x) };
    if (next === 'disbursed') {
      if (p.history.some(h => h.s === 'disbursed')) return no('Already disbursed (duplicate prevented)');
      const tx: Txn = { id: `TX-${String(s.txns.length + 1).padStart(4, '0')}`, ts: s.now, kind: 'out', amount: p.total, method: 'cash', category: 'wages', eventId: p.eventId, by: roleName(s.role).user, status: 'confirmed', note: `Wages ${p.id}`, ref: p.id };
      txns = [tx, ...s.txns];
    }
    set({ ...extra, seq: s.seq + 1, txns, payroll: s.payroll.map(x => x.id === id ? { ...x, status: next, history: [...x.history, { s: next, by: roleName(s.role).user, ts: s.now }] } : x), audit: addA(s, `Payroll → ${next}`, id, { prev: p.status, next, }), notifs: addN(s, next === 'calculated' ? 'finance' : next === 'approved' ? 'cashier' : 'owner', `Payroll ${id} is now ${next} (${p.total})`, '/app/payroll') });
    return ok(`Payroll moved to ${next}`);
  },
  ackWage: (pid, wid) => {
    const s = get();
    const p = s.payroll.find(x => x.id === pid); if (!p || p.status === 'submitted') return no('Not payable yet');
    if (p.status !== 'disbursed' && p.status !== 'acknowledged') return no('Wages not disbursed yet');
    const items = p.items.map(i => i.workerId === wid ? { ...i, ack: true } : i);
    const all = items.every(i => i.ack);
    set({ payroll: s.payroll.map(x => x.id === pid ? { ...x, items, status: all ? 'acknowledged' : x.status } : x), audit: addA(s, 'Wage acknowledged', pid, { next: wid }) });
    return ok('Payment acknowledged');
  },
  workerCheck: dir => {
    const s = get();
    const a = s.attendance.find(x => x.workerId === 'W-T1' && x.eventId === 'EV-1009'); if (!a) return no('No shift assigned');
    if (dir === 'in' && a.in) return no('Already checked in');
    if (dir === 'out' && !a.in) return no('Check in first');
    if (dir === 'out' && a.out) return no('Already checked out');
    set({ attendance: s.attendance.map(x => x === a ? { ...x, [dir]: true } : x), audit: addA(s, `Worker check-${dir}`, a.id) });
    return ok(dir === 'in' ? 'Checked in' : 'Checked out');
  },

  addExpense: e => {
    const s = get();
    if (!allowed(s.role, 'addExpense')) return no('Not permitted');
    if (!(e.amount > 0)) return no('Enter a valid amount');
    const id = mk(s, 'EXP');
    const ex: Expense = { id, ts: s.now, eventId: e.eventId, category: e.category, amount: e.amount, by: roleName(s.role).user, status: 'pending', note: e.note };
    set({ seq: s.seq + 1, expenses: [ex, ...s.expenses], audit: addA(s, 'Expense requested', id, { next: String(e.amount) }), notifs: addN(s, 'finance', `Expense ${e.amount} (${e.category}) awaiting approval`, '/app/approvals') });
    return ok(`Expense ${id} submitted for approval`);
  },
  decideExpense: (id, approve) => {
    const s = get();
    if (!allowed(s.role, 'approveExpense')) return no('Not permitted');
    const x = s.expenses.find(e => e.id === id); if (!x || x.status !== 'pending') return no('Already decided');
    if (approve && x.amount > OWNER_APPROVAL_THRESHOLD && s.role !== 'owner') return no(`Above ₹${OWNER_APPROVAL_THRESHOLD} requires owner approval`);
    let txns = s.txns;
    if (approve) txns = [{ id: `TX-${String(s.txns.length + 1).padStart(4, '0')}`, ts: s.now, kind: 'out', amount: x.amount, method: 'cash', category: x.category, eventId: x.eventId, by: x.by, status: 'confirmed', note: x.note, ref: x.id }, ...s.txns];
    set({ txns, expenses: s.expenses.map(e => e.id === id ? { ...e, status: approve ? 'approved' : 'rejected' } : e), audit: addA(s, approve ? 'Expense approved' : 'Expense rejected', id, { next: String(x.amount) }) });
    return ok(approve ? 'Expense approved and posted to ledger' : 'Expense rejected');
  },

  addInvoice: e => {
    const s = get();
    if (!allowed(s.role, 'vendorAdvance')) return no('Not permitted');
    if (!(e.amount > 0) || !e.number.trim()) return no('Invoice number and amount required');
    if (s.invoices.some(i => i.vendorId === e.vendorId && i.number.toLowerCase() === e.number.trim().toLowerCase())) return no('Duplicate invoice number for this vendor');
    const id = mk(s, 'INV');
    set({ seq: s.seq + 1, invoices: [{ id, ...e, number: e.number.trim(), status: 'requested', ts: s.now }, ...s.invoices], audit: addA(s, 'Purchase/invoice created', id, { next: String(e.amount) }) });
    return ok(`Invoice ${id} created`);
  },
  invStep: id => {
    const s = get();
    const inv = s.invoices.find(i => i.id === id); if (!inv) return no('Not found');
    const next = INV_FLOW[INV_FLOW.indexOf(inv.status) + 1]; if (!next) return no('Already paid');
    const need: Record<string, keyof typeof import('./rbac').ACTIONS> = { approved: 'approvePay', ordered: 'vendorAdvance', delivered: 'vendorAdvance', invoiced: 'vendorAdvance', payapproved: 'approvePay', paid: 'payInvoice' };
    if (!allowed(s.role, need[next])) return no(`${roleName(s.role).name} cannot move to "${next}"`);
    if (next === 'payapproved' && inv.amount > OWNER_APPROVAL_THRESHOLD && s.role !== 'owner') return no(`Above ₹${OWNER_APPROVAL_THRESHOLD}: owner approval required`);
    let txns = s.txns;
    if (next === 'paid') {
      if (s.txns.some(t => t.ref === inv.id)) return no('Payment already recorded (duplicate prevented)');
      txns = [{ id: `TX-${String(s.txns.length + 1).padStart(4, '0')}`, ts: s.now, kind: 'out', amount: inv.amount, method: 'cash', category: 'vendor', eventId: inv.eventId, by: roleName(s.role).user, status: 'confirmed', note: `Invoice ${inv.number}`, ref: inv.id }, ...s.txns];
    }
    set({ txns, invoices: s.invoices.map(i => i.id === id ? { ...i, status: next } : i), audit: addA(s, `Invoice → ${next}`, id, { prev: inv.status, next }) });
    return ok(`Moved to ${next}`);
  },

  submitCount: denoms => {
    const s = get();
    if (!allowed(s.role, 'countCash')) return no('Only the Cashier can submit a physical count');
    const counted = Object.entries(denoms).reduce((a, [k, v]) => a + Number(k) * v, 0);
    const { expected } = cashSummary(s.txns, s.now);
    const d = counted - expected;
    const id = mk(s, 'CC');
    const c: CashCount = { id, ts: s.now, date: todayStr(s.now), expected, counted, discrepancy: d, denoms, status: d === 0 ? 'balanced' : 'open' };
    set({ seq: s.seq + 1, counts: [c, ...s.counts], audit: addA(s, 'Physical cash count', id, { prev: String(expected), next: String(counted) }), notifs: d !== 0 ? addN(s, 'finance', `Cash discrepancy ${d} detected (expected ${expected}, counted ${counted})`, '/app/cash', 'whatsapp') : s.notifs, tasks: d === 0 ? s.tasks.map(t => t.id === 'T-S2' ? { ...t, status: 'completed' as TaskStatus } : t) : s.tasks });
    return ok(d === 0 ? 'Cash balanced' : `Discrepancy of ${d} flagged to Finance`);
  },
  resolveCount: (id, mode, reason) => {
    const s = get();
    if (!allowed(s.role, 'adjustCash')) return no('Only Finance or Owner can resolve discrepancies');
    if (reason.trim().length < 5) return no('A reason is required');
    const c = s.counts.find(x => x.id === id); if (!c || (c.status !== 'open')) return no('Not open');
    let txns = s.txns;
    if (mode === 'adjusted') txns = [{ id: `TX-${String(s.txns.length + 1).padStart(4, '0')}`, ts: s.now, kind: c.discrepancy < 0 ? 'out' : 'in', amount: Math.abs(c.discrepancy), method: 'cash', category: 'adjustment', by: roleName(s.role).user, status: 'confirmed', note: `Authorised adjustment: ${reason}`, ref: c.id }, ...s.txns];
    set({ txns, counts: s.counts.map(x => x.id === id ? { ...x, status: mode, reason } : x), tasks: s.tasks.map(t => t.id === 'T-S2' ? { ...t, status: 'completed' as TaskStatus } : t), audit: addA(s, `Discrepancy ${mode}`, id, { reason, prev: String(c.discrepancy) }) });
    return ok(mode === 'adjusted' ? 'Adjustment posted with reason (no silent write-off)' : 'Recorded as unresolved discrepancy');
  },

  taskDo: (id, status) => {
    const s = get();
    const t = s.tasks.find(x => x.id === id); if (!t) return no('Not found');
    if (t.owner !== s.role && !['owner', 'gm'].includes(s.role)) return no('Only the task owner (or management) can update this task');
    if (status === 'completed' && t.mandatoryFinance) {
      if (t.title.startsWith('Cash recon') && !(s.counts[0] && todayStr(s.counts[0].ts) === todayStr(s.now))) return no('Mandatory: submit a cash count first');
      if (t.title.startsWith('Record shift') && !s.expenses.some(e => e.eventId === t.eventId)) return no('Mandatory: record at least one expense/receipt first');
    }
    if (t.title.startsWith('Submit attendance') && status === 'completed' && !s.attendance.some(a => a.eventId === t.eventId && a.workerId !== 'W-T1')) return no('Mandatory: submit attendance records first');
    set({ tasks: s.tasks.map(x => x.id === id ? { ...x, status } : x), audit: addA(s, `Task → ${status}`, id) });
    return ok('Task updated');
  },
  delegateTask: (id, owner, reason) => {
    const s = get();
    if (!allowed(s.role, 'delegate')) return no('Not permitted');
    if (!reason.trim()) return no('Reason required');
    const t = s.tasks.find(x => x.id === id)!;
    const u = roleName(owner);
    set({ tasks: s.tasks.map(x => x.id === id ? { ...x, owner, ownerName: u.user, status: 'notstarted' as TaskStatus } : x), audit: addA(s, 'Task delegated', id, { prev: t.ownerName, next: u.user, reason }), notifs: addN(s, owner, `Delegated to you: ${t.title}`, t.link, 'whatsapp') });
    return ok(`Delegated to ${u.user}`);
  },
  extendTask: (id, hours, reason) => {
    const s = get();
    if (!allowed(s.role, 'delegate')) return no('Not permitted');
    if (!reason.trim()) return no('Reason required');
    const t = s.tasks.find(x => x.id === id)!;
    const nd = new Date(new Date(s.now).getTime() + hours * 3600e3).toISOString();
    set({ tasks: s.tasks.map(x => x.id === id ? { ...x, deadline: nd, status: 'inprogress' as TaskStatus } : x), audit: addA(s, 'Deadline extended', id, { prev: t.deadline, next: nd, reason }) });
    return ok('Deadline extended');
  },
  toggleChecklist: (eventId, cid) => {
    const s = get();
    if (!allowed(s.role, 'resolveTask')) return no('Not permitted');
    set({ events: s.events.map(e => { if (e.id !== eventId) return e; const cl = e.checklist.map(c => c.id === cid ? { ...c, done: !c.done } : c); return { ...e, checklist: cl, readiness: readiness(cl), status: e.status === 'upcoming' || e.status === 'preparation' || e.status === 'ready' ? (readiness(cl) === 100 ? 'ready' : 'preparation') : e.status }; }), audit: addA(s, 'Checklist toggled', cid + '@' + eventId) });
    return ok('Checklist updated');
  },
  closeEvent: (eventId, exception) => {
    const s = get();
    if (!allowed(s.role, 'closeEvent')) return no('Not permitted');
    const checks = closureChecks(s, s.now, eventId);
    const missing = checks.filter(c => !c.ok);
    if (missing.length && !exception) return no(`${missing.length} requirement(s) outstanding`);
    if (exception && s.role !== 'owner') return no('Only the owner can approve a closure exception');
    set({ events: s.events.map(e => e.id === eventId ? { ...e, status: 'closed', exception: exception ? `${exception} | outstanding: ${missing.map(m => m.label).join('; ')}` : undefined } : e), audit: addA(s, exception ? 'Event closed with exception' : 'Event financially closed', eventId, { reason: exception }) });
    return ok('Event financially closed');
  },
}), {
  name: 'venueos-v1', version: 1, skipHydration: true,
  partialize: s => { const { hydrated, ...rest } = s as any; return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')); },
  onRehydrateStorage: () => st => { if (st) st.hydrated = true; },
}));
