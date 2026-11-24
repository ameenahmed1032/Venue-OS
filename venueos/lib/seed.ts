import type { Enquiry, VEvent, Txn, Worker, Attendance, Payroll, Vendor, Invoice, Task, Audit, Notif, CashCount, Expense, EventStatus, Stage } from './types';

function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const r = rng(42);
function pick<T>(a: T[]): T { return a[Math.floor(r() * a.length)]; }
export const BASE_NOW = '2026-11-24T09:00:00+05:30';
const first = ['Aarav', 'Vivaan', 'Ananya', 'Diya', 'Rohan', 'Kavya', 'Suresh', 'Lakshmi', 'Manjunath', 'Shruthi', 'Ramesh', 'Priya', 'Naveen', 'Meena', 'Harish', 'Deepa', 'Kiran', 'Pooja', 'Mahesh', 'Savitha', 'Arjun', 'Nandini', 'Girish', 'Rekha'];
const last = ['Reddy', 'Gowda', 'Shetty', 'Rao', 'Nair', 'Iyer', 'Kumar', 'Patil', 'Hegde', 'Sharma', 'Naik', 'Bhat'];
const nm = () => `${pick(first)} ${pick(last)}`;
const types = ['Wedding', 'Conference', 'Exhibition', 'Engagement', 'Celebration', 'Cultural Event', 'Product Launch', 'Corporate Event'];
const halls = ['Grand Durbar', 'Palace Lawn', 'Rajmahal Hall', 'Garden Pavilion'];
const day = (off: number) => { const d = new Date('2026-11-24T00:00:00+05:30'); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };

const dueList: [string, string, boolean][] = [['setup', 'Stage & seating setup', true], ['security', 'Security briefing & gate plan', true], ['housekeeping', 'Housekeeping readiness', false], ['catering', 'Catering kitchen inspection', true], ['electrical', 'Electrical & generator check', true], ['maintenance', 'AC & washroom maintenance', false]];
export function makeChecklist(done = 0) {
  return dueList.map((d, i) => ({ id: `c${i}`, dept: d[0], label: d[1], critical: d[2], done: i < done }));
}
export function readiness(cl: VEvent['checklist']) {
  const w = cl.reduce((a, c) => a + (c.critical ? 2 : 1), 0);
  const got = cl.filter(c => c.done).reduce((a, c) => a + (c.critical ? 2 : 1), 0);
  return Math.round((got / w) * 100);
}

export function seed() {
  const events: VEvent[] = [];
  const statusFor = (i: number): EventStatus => i < 8 ? 'closed' : i === 8 ? 'pendingrec' : i === 9 ? 'live' : i < 12 ? 'preparation' : i < 14 ? 'ready' : 'upcoming';
  for (let i = 0; i < 35; i++) {
    const status = statusFor(i);
    const off = i < 8 ? -(60 - i * 6) : i === 8 ? -2 : i === 9 ? 0 : (i - 9) * 4;
    const contracted = Math.round((250000 + r() * 700000) / 5000) * 5000;
    const cl = makeChecklist(status === 'closed' || status === 'ready' ? 6 : status === 'preparation' ? 3 : 0);
    const type = pick(types);
    events.push({ id: `EV-${1000 + i}`, name: `${type} – ${pick(last)} Family`, type, hall: pick(halls), date: day(off), guests: 100 + Math.floor(r() * 1100), customer: nm(), manager: pick(['Ravi Kumar', 'Sunita Rao', 'Anil Hegde']), status, contracted, collected: status === 'closed' ? contracted : Math.round(contracted * (0.3 + r() * 0.4) / 1000) * 1000, budget: Math.round(contracted * 0.55), readiness: readiness(cl), checklist: cl, incidents: Math.floor(r() * 2) });
  }
  // Fixed demo events
  const cl9 = makeChecklist(4);
  events[9] = { ...events[9], id: 'EV-1009', name: 'Wedding Reception – Reddy Family', type: 'Wedding', hall: 'Grand Durbar', guests: 1200, contracted: 650000, collected: 550000, budget: 360000, status: 'live', checklist: cl9, readiness: readiness(cl9), customer: 'Aarav Reddy', manager: 'Ravi Kumar', date: day(0) };
  events[8] = { ...events[8], id: 'EV-1008', name: 'Corporate Annual Summit – Partners', type: 'Corporate Event', status: 'pendingrec', date: day(-2), contracted: 480000, collected: 380000, customer: 'Nandini Iyer', manager: 'Sunita Rao', checklist: makeChecklist(6), readiness: 100 };

  const stages: Stage[] = ['new', 'contacted', 'visit', 'quoted', 'negotiation', 'confirmed', 'completed'];
  const enquiries: Enquiry[] = Array.from({ length: 40 }, (_, i) => ({ id: `ENQ-${200 + i}`, name: nm(), phone: `98${Math.floor(10000000 + r() * 89999999)}`, type: pick(types), guests: 80 + Math.floor(r() * 900), date: day(20 + Math.floor(r() * 120)), source: pick(['website', 'walkin', 'phone'] as const), stage: stages[i % 7], quote: i % 7 >= 3 ? Math.round((200000 + r() * 600000) / 5000) * 5000 : undefined, notes: '', createdAt: day(-Math.floor(r() * 30)) + 'T10:00:00+05:30', history: ['Enquiry created'] }));

  const workers: Worker[] = [];
  for (let i = 0; i < 25; i++) workers.push({ id: `W-P${i + 1}`, name: nm(), kind: 'permanent', rate: 900 + Math.floor(r() * 5) * 100, phone: '', role: pick(['Housekeeping', 'Security', 'Electrician', 'Gardener', 'Hall Staff']) });
  for (let i = 0; i < 120; i++) workers.push({ id: `W-T${i + 1}`, name: nm(), kind: i % 5 === 0 ? 'contract' : 'temporary', rate: 800, phone: '', role: pick(['Setup', 'Serving', 'Cleaning', 'Loading']) });
  workers[25].name = 'Mahesh Naik'; // demo worker (W-T1)

  const vendors: Vendor[] = ['Shree Decorators', 'Mysore Caterers', 'Bhat Sound & Light', 'Karnataka Tent House', 'Royal Flowers', 'SafeGuard Security', 'CleanPro Services', 'Power Gen Rentals', 'Namma Transport', 'Sri Sai Printers', 'Lakshmi Sweets', 'Orion AV', 'Green Leaf Catering', 'Bangalore Furniture Rentals', 'Elite Photography', 'Surya Electricals', 'AquaPure Water', 'Fresh Veg Traders', 'Ganesh Tent', 'Kaveri Linens'].map((n, i) => ({ id: `V-${i + 1}`, name: n, category: ['Decoration', 'Catering', 'AV', 'Rentals', 'Flowers', 'Security', 'Housekeeping', 'Power', 'Transport', 'Printing'][i % 10], rating: 3 + Math.round(r() * 20) / 10, phone: '' }));

  const invoices: Invoice[] = [
    { id: 'INV-1', vendorId: 'V-1', eventId: 'EV-1009', number: 'SD/2026/441', amount: 75000, status: 'ordered', desc: 'Stage & floral decoration', ts: BASE_NOW },
    { id: 'INV-2', vendorId: 'V-2', eventId: 'EV-1008', number: 'MC/1190', amount: 120000, status: 'delivered', desc: 'Catering – 400 pax', ts: BASE_NOW },
    { id: 'INV-3', vendorId: 'V-3', eventId: 'EV-1009', number: 'BSL/88', amount: 40000, status: 'invoiced', desc: 'Sound & light', ts: BASE_NOW },
  ];

  // Scenario-3 consistent day: opening 50,000 + receipts 1,20,000 − wages 35,000 − vendors 22,000 = 1,13,000
  const t = (id: string, kind: 'in' | 'out', amount: number, category: string, by: string, eventId?: string, note = ''): Txn => ({ id, ts: BASE_NOW, kind, amount, method: 'cash', category, eventId, by, status: 'confirmed', note });
  const txns: Txn[] = [
    t('TX-0001', 'in', 50000, 'opening', 'Cashier'),
    t('TX-0002', 'in', 70000, 'booking-receipt', 'Cashier', 'EV-1009', 'Booking balance'),
    t('TX-0003', 'in', 50000, 'booking-receipt', 'Cashier', 'EV-1008', 'Advance'),
    t('TX-0004', 'out', 35000, 'wages', 'Cashier', 'EV-1009', 'Daily wages'),
    t('TX-0005', 'out', 22000, 'vendor', 'Cashier', 'EV-1009', 'Vendor part payment'),
  ];
  for (let i = 0; i < 145; i++) {
    const inflow = r() < 0.4; const ev = events[Math.floor(r() * 8)];
    txns.push({ id: `TX-H${i}`, ts: ev.date + 'T12:00:00+05:30', kind: inflow ? 'in' : 'out', amount: Math.round((2000 + r() * 60000) / 500) * 500, method: pick(['cash', 'upi', 'bank'] as const), category: inflow ? 'booking-receipt' : pick(['wages', 'vendor', 'electricity', 'housekeeping', 'security', 'maintenance']), eventId: ev.id, by: 'Cashier', status: 'confirmed', note: 'Historical' });
  }

  const tasks: Task[] = [];
  const depts = ['Operations', 'Finance', 'Housekeeping', 'Security', 'Catering', 'Procurement', 'HR'];
  const titles = ['Submit attendance before shift', 'Verify vendor delivery', 'Record shift expenses', 'Calculate payroll', 'Cash reconciliation', 'Complete checklist', 'Upload invoice'];
  const owners: [string, string][] = [['supervisor', 'Geeta Naik'], ['procure', 'Prakash Shetty'], ['cashier', 'Meena Gowda'], ['finance', 'Suresh Rao'], ['hr', 'Lakshmi Bhat'], ['eventmgr', 'Ravi Kumar']];
  for (let i = 0; i < 100; i++) {
    const o = owners[i % 6]; const done = i < 70;
    tasks.push({ id: `T-${i + 1}`, title: titles[i % 7], eventId: events[i % 8].id, dept: depts[i % 7], owner: o[0] as any, ownerName: o[1], deadline: day(done ? -(i % 10) - 3 : 1 + (i % 4)) + 'T18:00:00+05:30', priority: pick(['low', 'med', 'high'] as const), status: done ? 'completed' : 'notstarted', escalateTo: 'gm', delays: i % 9 === 0 ? 2 : 0, link: '/app/tasks', mandatoryFinance: i % 7 === 4 });
  }
  tasks.push(
    { id: 'T-S1', title: 'Verify vendor delivery – Decoration', eventId: 'EV-1009', dept: 'Procurement', owner: 'procure', ownerName: 'Prakash Shetty', deadline: '2026-11-24T10:00:00+05:30', priority: 'high', status: 'notstarted', escalateTo: 'gm', delays: 0, link: '/app/vendors' },
    { id: 'T-S2', title: 'Cash reconciliation for today', eventId: 'EV-1009', dept: 'Finance', owner: 'cashier', ownerName: 'Meena Gowda', deadline: '2026-11-24T20:00:00+05:30', priority: 'high', status: 'notstarted', escalateTo: 'finance', delays: 0, link: '/app/cash', mandatoryFinance: true },
    { id: 'T-S3', title: 'Submit attendance – Wedding shift', eventId: 'EV-1009', dept: 'Operations', owner: 'supervisor', ownerName: 'Geeta Naik', deadline: '2026-11-24T08:00:00+05:30', priority: 'high', status: 'overdue', escalateTo: 'gm', delays: 1, link: '/app/attendance' },
    { id: 'T-S4', title: 'Stage cleanup', eventId: 'EV-1009', dept: 'Housekeeping', owner: 'worker', ownerName: 'Mahesh Naik', deadline: '2026-11-24T17:00:00+05:30', priority: 'med', status: 'notstarted', escalateTo: 'supervisor', delays: 0, link: '/app/worker' },
  );

  const payroll: Payroll[] = [];
  const attendance: Attendance[] = [];
  const expenses: Expense[] = [{ id: 'EXP-1', ts: BASE_NOW, eventId: 'EV-1009', category: 'housekeeping', amount: 4500, by: 'Geeta Naik', status: 'pending', note: 'Paid to six housekeeping workers' }];
  const counts: CashCount[] = [];
  const audit: Audit[] = [{ id: 'AU-1', ts: BASE_NOW, actor: 'System', role: 'owner', action: 'Demo data loaded', record: 'seed' }];
  const notifs: Notif[] = [{ id: 'N-1', ts: BASE_NOW, to: 'supervisor', text: 'Attendance for Wedding shift is overdue', link: '/app/attendance', channel: 'whatsapp', read: false }];
  return { enquiries, events, txns, workers, attendance, payroll, vendors, invoices, tasks, audit, notifs, counts, expenses };
}
