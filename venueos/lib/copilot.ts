import type { RoleId } from './types';
import { cashSummary, todayStr, type Data } from './store';
import { inr, dt } from './format';

export interface CopilotAnswer { text: string; basis: string; sources: { label: string; href: string }[]; table?: { head: string[]; rows: string[][] }; refused?: boolean }
const has = (q: string, ...k: string[]) => k.some(x => q.includes(x));

export function askCopilot(qRaw: string, role: RoleId, d: Data, now: string): CopilotAnswer {
  const q = qRaw.toLowerCase();
  const stamp = `Last updated ${dt(now)} • Asia/Kolkata`;
  if (role !== 'owner' && role !== 'super') return { text: 'Copilot is available only to Venue Owner and Platform Super Admin roles.', basis: 'Permission check', sources: [], refused: true };

  // ---------- Platform scope ----------
  if (role === 'super') {
    if (has(q, 'payroll', 'cash', 'wage', 'revenue', 'task', 'vendor', 'नकद', 'वेतन', 'ನಗದು') || has(q, 'tenant') && has(q, 'salary'))
      return { text: 'Denied. Platform Super Admin cannot read tenant operational or financial data (payroll, cash, vendors) by default. Request time-limited, audited support access from the tenant owner first.', basis: 'Tenant isolation policy — no active support grant', sources: [{ label: 'Audit: denied query logged', href: '/app/audit' }], refused: true };
    if (has(q, 'module', 'enabled'))
      return { text: 'Enabled modules for Gayatri Vihar (demo tenant): CRM, Calendar, Events, Workforce, Payroll, Cash, Vendors, Tasks, Closure, Reports, Copilot.', basis: 'Platform feature flags', sources: [{ label: 'Platform', href: '/app/platform' }] };
    if (has(q, 'health', 'issue', 'tenant', 'usage'))
      return { text: '3 demo tenants. All services healthy. 1 tenant (Rangoli Convention) has a delayed WhatsApp gateway (simulated). Gayatri Vihar: 11 active roles, usage normal.', basis: 'Simulated platform telemetry (not tenant data)', sources: [{ label: 'Platform', href: '/app/platform' }], table: { head: ['Tenant', 'Status', 'Plan'], rows: [['Gayatri Vihar', 'Healthy', 'Enterprise'], ['Rangoli Convention', 'Degraded (WhatsApp)', 'Pro'], ['Kaveri Banquets', 'Healthy', 'Starter']] } };
    return { text: 'I can answer platform-level questions: tenant health, enabled modules, usage, subscriptions. I cannot answer that.', basis: 'Unsupported intent', sources: [], refused: true };
  }

  // ---------- Organisation scope ----------
  const c = cashSummary(d.txns, now);
  const day = todayStr(now);
  const lastCount = d.counts[0];
  if (has(q, 'cash', 'नकद', 'ನಗದು', 'collected', 'closing')) {
    const txToday = d.txns.filter(t => todayStr(t.ts) === day && t.status === 'confirmed' && t.category !== 'opening');
    return { text: `Cash position today: opening ${inr(c.opening)} + inflows ${inr(c.inflow)} − outflows ${inr(c.outflow)} = expected closing ${inr(c.expected)}. ${lastCount ? `Physical count ${inr(lastCount.counted)} (${lastCount.discrepancy >= 0 ? '+' : ''}${lastCount.discrepancy}).` : 'No physical count submitted yet. I cannot detect unrecorded physical cash.'}`, basis: 'Expected = opening + inflows − outflows over confirmed cash ledger entries dated today', sources: [{ label: `Cash ledger (${txToday.length} entries)`, href: '/app/cash' }], table: { head: ['Item', 'Amount'], rows: [['Opening', inr(c.opening)], ['Inflows', inr(c.inflow)], ['Outflows', inr(c.outflow)], ['Expected closing', inr(c.expected)]] } };
  }
  if (has(q, 'discrepan', 'shortfall', 'अंतर', 'ವ್ಯತ್ಯಾಸ', '₹500')) {
    if (!lastCount) return { text: 'No cash count has been submitted yet, so there is no discrepancy to explain. Expected closing is ' + inr(c.expected) + '.', basis: 'Cash counts', sources: [{ label: 'Cash', href: '/app/cash' }] };
    return { text: `Latest count ${lastCount.id}: counted ${inr(lastCount.counted)} vs expected ${inr(lastCount.expected)} → discrepancy ${lastCount.discrepancy}. Status: ${lastCount.status}${lastCount.reason ? ` (reason: ${lastCount.reason})` : ''}. Responsible: Cashier (count), Finance Manager (resolution).`, basis: 'Discrepancy = physical count − expected closing', sources: [{ label: lastCount.id, href: '/app/cash' }, { label: 'Audit trail', href: '/app/audit' }] };
  }
  if (has(q, 'closure', 'awaiting', 'closed') || has(q, 'समापन')) {
    const ev = d.events.filter(e => e.status === 'pendingrec' || e.status === 'opscomplete');
    return { text: ev.length ? `${ev.length} event(s) awaiting closure.` : 'No events awaiting closure.', basis: 'Event status in Pending Reconciliation / Operationally Completed', sources: [{ label: 'Closure', href: '/app/closure' }], table: { head: ['Event', 'Manager', 'Outstanding'], rows: ev.map(e => [e.name, e.manager, inr(e.contracted - e.collected)]) } };
  }
  if (has(q, 'vendor', 'wage', 'unpaid', 'विक्रेता', 'ಮಾರಾಟ')) {
    const inv = d.invoices.filter(i => i.status !== 'paid' && ['invoiced', 'payapproved', 'delivered'].includes(i.status));
    const wages = d.payroll.filter(p => !['disbursed', 'acknowledged'].includes(p.status)).reduce((a, p) => a + p.total, 0);
    return { text: `Outstanding vendor liabilities: ${inr(inv.reduce((a, i) => a + i.amount, 0))} across ${inv.length} invoice(s). Unpaid wages (approved/pending): ${inr(wages)}. Liabilities are kept separate from actual payments.`, basis: 'Invoices not yet paid and payroll batches not yet disbursed', sources: [{ label: 'Vendors', href: '/app/vendors' }, { label: 'Payroll', href: '/app/payroll' }], table: { head: ['Invoice', 'Status', 'Amount'], rows: inv.map(i => [i.number, i.status, inr(i.amount)]) } };
  }
  if (has(q, 'overdue', 'pending task', 'बाकी', 'ಬಾಕಿ', 'ಕೆಲಸ', 'कार्य')) {
    const od = d.tasks.filter(t => t.status === 'overdue' || t.status === 'escalated');
    const by: Record<string, number> = {}; od.forEach(t => by[t.dept] = (by[t.dept] ?? 0) + 1);
    return { text: od.length ? `${od.length} overdue/escalated task(s). Draft management summary: ${Object.entries(by).map(([k, v]) => `${k}: ${v}`).join(', ')}. Responsible: ${Array.from(new Set(od.map(t => t.ownerName))).join(', ')}.` : 'No overdue tasks right now.', basis: 'Tasks with status Overdue or Escalated', sources: [{ label: 'Tasks', href: '/app/tasks' }], table: { head: ['Task', 'Owner', 'Dept'], rows: od.map(t => [t.title, t.ownerName, t.dept]) } };
  }
  if (has(q, 'contribution', 'profit', 'highest')) {
    const rows = d.events.filter(e => e.status !== 'closed' || true).map(e => {
      const exp = d.txns.filter(t => t.eventId === e.id && t.kind === 'out' && t.status === 'confirmed').reduce((a, t) => a + t.amount, 0);
      return { e, exp, c: e.contracted - exp };
    }).sort((a, b) => b.c - a.c).slice(0, 5);
    return { text: `Highest estimated contribution: ${rows[0].e.name} at ${inr(rows[0].c)} (contracted − recorded outflows, before overhead and taxes; estimate only).`, basis: 'Contracted revenue − confirmed outflows tagged to event', sources: [{ label: 'Financial Intelligence', href: '/app/finance' }], table: { head: ['Event', 'Contracted', 'Direct cost', 'Est. contribution'], rows: rows.map(x => [x.e.name, inr(x.e.contracted), inr(x.exp), inr(x.c)]) } };
  }
  if (has(q, 'payroll of', 'other tenant', 'rangoli', 'kaveri'))
    return { text: 'Denied. Organisation Copilot only accesses Gayatri Vihar data. Cross-tenant requests are blocked.', basis: 'Tenant isolation', sources: [], refused: true };
  return { text: 'I could not map that to a supported question. Try: cash today, discrepancy, events awaiting closure, vendor and wage liabilities, overdue tasks, highest contribution.', basis: 'Deterministic intent parser (no external LLM)', sources: [], refused: true };
}
