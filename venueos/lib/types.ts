export type Lang = 'en' | 'hi' | 'kn';
export type RoleId = 'super' | 'owner' | 'gm' | 'booking' | 'eventmgr' | 'finance' | 'cashier' | 'hr' | 'supervisor' | 'procure' | 'worker';
export type Stage = 'new' | 'contacted' | 'visit' | 'quoted' | 'negotiation' | 'confirmed' | 'completed';
export const STAGES: Stage[] = ['new', 'contacted', 'visit', 'quoted', 'negotiation', 'confirmed', 'completed'];
export type EventStatus = 'upcoming' | 'preparation' | 'ready' | 'live' | 'opscomplete' | 'pendingrec' | 'closed';
export const EVENT_STATUSES: EventStatus[] = ['upcoming', 'preparation', 'ready', 'live', 'opscomplete', 'pendingrec', 'closed'];
export type PayStatus = 'submitted' | 'verified' | 'calculated' | 'approved' | 'disbursed' | 'acknowledged';
export const PAY_FLOW: PayStatus[] = ['submitted', 'verified', 'calculated', 'approved', 'disbursed', 'acknowledged'];
export type InvStatus = 'requested' | 'approved' | 'ordered' | 'delivered' | 'invoiced' | 'payapproved' | 'paid';
export const INV_FLOW: InvStatus[] = ['requested', 'approved', 'ordered', 'delivered', 'invoiced', 'payapproved', 'paid'];
export type TaskStatus = 'notstarted' | 'inprogress' | 'submitted' | 'awaiting' | 'completed' | 'overdue' | 'escalated';

export interface Enquiry { id: string; name: string; phone: string; type: string; guests: number; date: string; source: 'website' | 'walkin' | 'phone'; stage: Stage; quote?: number; notes: string; createdAt: string; eventId?: string; history: string[] }
export interface VEvent { id: string; name: string; type: string; hall: string; date: string; guests: number; customer: string; manager: string; status: EventStatus; contracted: number; collected: number; budget: number; readiness: number; checklist: { id: string; dept: string; label: string; done: boolean; critical: boolean }[]; incidents: number; exception?: string }
export interface Txn { id: string; ts: string; kind: 'in' | 'out'; amount: number; method: 'cash' | 'upi' | 'bank'; category: string; eventId?: string; by: string; status: 'confirmed' | 'reversed' | 'pending'; note: string; evidence?: string; ref?: string }
export interface Worker { id: string; name: string; kind: 'permanent' | 'temporary' | 'contract'; rate: number; phone: string; role: string }
export interface Attendance { id: string; eventId: string; workerId: string; in: boolean; out: boolean; otHours: number; verified: boolean }
export interface PayItem { workerId: string; shifts: number; otHours: number; base: number; ot: number; amount: number; ack: boolean }
export interface Payroll { id: string; eventId: string; status: PayStatus; items: PayItem[]; base: number; ot: number; total: number; history: { s: PayStatus; by: string; ts: string }[] }
export interface Vendor { id: string; name: string; category: string; rating: number; phone: string }
export interface Invoice { id: string; vendorId: string; eventId: string; number: string; amount: number; status: InvStatus; desc: string; ts: string }
export interface Task { id: string; title: string; eventId?: string; dept: string; owner: RoleId; ownerName: string; deadline: string; priority: 'low' | 'med' | 'high'; status: TaskStatus; escalateTo: RoleId; mandatoryFinance?: boolean; delays: number; link: string }
export interface Audit { id: string; ts: string; actor: string; role: RoleId; action: string; record: string; prev?: string; next?: string; reason?: string }
export interface Notif { id: string; ts: string; to: RoleId | 'all'; text: string; link: string; channel: 'app' | 'whatsapp' | 'email'; read: boolean }
export interface CashCount { id: string; ts: string; date: string; expected: number; counted: number; discrepancy: number; denoms: Record<string, number>; status: 'balanced' | 'open' | 'adjusted' | 'unresolved'; reason?: string }
export interface Expense { id: string; ts: string; eventId?: string; category: string; amount: number; by: string; status: 'pending' | 'approved' | 'rejected'; note: string }
