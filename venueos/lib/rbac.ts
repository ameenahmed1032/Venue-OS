import type { RoleId } from './types';

export const ROLES: { id: RoleId; name: string; user: string }[] = [
  { id: 'super', name: 'Platform Super Admin', user: 'Arclyte Admin' },
  { id: 'owner', name: 'Venue Owner', user: 'Gayatri Rao' },
  { id: 'gm', name: 'General Manager', user: 'Vikram Hegde' },
  { id: 'booking', name: 'Booking Manager', user: 'Shruthi Nair' },
  { id: 'eventmgr', name: 'Event Manager', user: 'Ravi Kumar' },
  { id: 'finance', name: 'Finance Manager', user: 'Suresh Rao' },
  { id: 'cashier', name: 'Cashier', user: 'Meena Gowda' },
  { id: 'hr', name: 'HR / Workforce', user: 'Lakshmi Bhat' },
  { id: 'supervisor', name: 'Floor Supervisor', user: 'Geeta Naik' },
  { id: 'procure', name: 'Procurement', user: 'Prakash Shetty' },
  { id: 'worker', name: 'Worker', user: 'Mahesh Naik' },
];

export type Module = 'command' | 'crm' | 'calendar' | 'events' | 'workforce' | 'attendance' | 'payroll' | 'cash' | 'expenses' | 'vendors' | 'tasks' | 'approvals' | 'closure' | 'finance' | 'reports' | 'audit' | 'notifications' | 'users' | 'copilot' | 'demo' | 'impact' | 'worker' | 'platform';
export const ALL_MODULES: Module[] = ['command', 'crm', 'calendar', 'events', 'workforce', 'attendance', 'payroll', 'cash', 'expenses', 'vendors', 'tasks', 'approvals', 'closure', 'finance', 'reports', 'audit', 'notifications', 'users', 'copilot', 'demo', 'impact', 'worker', 'platform'];

// module access per role (demo route guard — production must enforce server-side with RLS)
export const ACCESS: Record<RoleId, Module[]> = {
  super: ['platform', 'copilot', 'audit', 'demo', 'impact', 'notifications'],
  owner: ['command', 'crm', 'calendar', 'events', 'workforce', 'attendance', 'payroll', 'cash', 'expenses', 'vendors', 'tasks', 'approvals', 'closure', 'finance', 'reports', 'audit', 'notifications', 'users', 'copilot', 'demo', 'impact'],
  gm: ['command', 'calendar', 'events', 'workforce', 'attendance', 'tasks', 'approvals', 'closure', 'notifications', 'reports', 'demo'],
  booking: ['command', 'crm', 'calendar', 'events', 'notifications', 'demo'],
  eventmgr: ['command', 'calendar', 'events', 'attendance', 'expenses', 'vendors', 'tasks', 'closure', 'notifications', 'demo'],
  finance: ['command', 'payroll', 'cash', 'expenses', 'vendors', 'approvals', 'closure', 'finance', 'reports', 'audit', 'tasks', 'notifications', 'demo'],
  cashier: ['command', 'cash', 'payroll', 'expenses', 'tasks', 'notifications', 'demo'],
  hr: ['command', 'workforce', 'attendance', 'payroll', 'tasks', 'notifications', 'demo'],
  supervisor: ['command', 'attendance', 'expenses', 'tasks', 'events', 'notifications', 'demo'],
  procure: ['command', 'vendors', 'tasks', 'notifications', 'demo'],
  worker: ['worker'],
};
export const can = (role: RoleId, m: Module) => ACCESS[role].includes(m);
export const homeFor = (role: RoleId) => role === 'worker' ? '/app/worker' : role === 'super' ? '/app/platform' : '/app/command';

// action permissions
export const ACTIONS = {
  confirmBooking: ['owner', 'booking'], quote: ['owner', 'booking'], addEnquiry: ['owner', 'booking'],
  receipt: ['cashier', 'owner'], payWages: ['cashier'], countCash: ['cashier'], adjustCash: ['owner', 'finance'],
  markAttendance: ['supervisor', 'hr', 'eventmgr'], verifyAttendance: ['supervisor'], calcPayroll: ['hr', 'finance'], approvePayroll: ['finance', 'owner'],
  approveExpense: ['finance', 'owner', 'gm'], addExpense: ['supervisor', 'cashier', 'eventmgr', 'finance'],
  vendorAdvance: ['procure', 'eventmgr', 'finance', 'owner'], approvePay: ['finance', 'owner'], payInvoice: ['cashier'],
  closeEvent: ['eventmgr', 'owner', 'finance'], delegate: ['gm', 'owner', 'eventmgr'], resolveTask: ['owner', 'gm', 'supervisor', 'procure', 'cashier', 'finance', 'hr', 'eventmgr'],
} as const satisfies Record<string, RoleId[]>;
export const allowed = (role: RoleId, a: keyof typeof ACTIONS) => (ACTIONS[a] as readonly RoleId[]).includes(role);
export const OWNER_APPROVAL_THRESHOLD = 50000;
