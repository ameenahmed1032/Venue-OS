# VenueOS --- Master development prompt

Build a premium, fully interactive, presentation-ready web application called **VenueOS by Arclyte Studios**, tailored to a fictional demonstration of Gayatri Vihar, Palace Grounds, Bengaluru. It is an operating system for running an entire event venue, not merely a booking dashboard.

**Tagline:** Every Event. Every Operation. One System.

## 1. Objective

Solve the lack of dedicated administrative staff, cash-heavy operations, fragmented communications, delayed data entry, temporary workforce management, manual payroll, missing records, and limited event profitability visibility. Everyone records their own work; management sees the complete picture. Distribute responsibility among existing employees rather than requiring a dedicated operator. Make routine entries achievable in 5--15 seconds. Never imply that software can detect unrecorded physical cash automatically.

## 2. Stack and implementation

Use Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Recharts, Framer Motion, Zustand and LocalStorage. Build a functional frontend with a simulated backend, shared relational data and persistent state. Prepare service interfaces for PostgreSQL, Supabase Auth, RLS and production APIs. No external API keys or paid services required for the demo. All forms, buttons, filters, approvals, scenario controls and exports must work. Clearly distinguish demo route guards from production server-side authorization.

## 3. Design

Premium enterprise SaaS, deep navy/charcoal navigation, off-white surfaces, muted gold accents, green success, amber pending, red overdue/discrepancies. Clean typography, subtle motion, consistent spacing, light/dark modes and responsive desktop/tablet/mobile layouts. Avoid excessive gradients, glassmorphism and generic decorative illustrations. Entry-level interfaces must use large touch targets and minimal navigation.

## 4. Application environments

-   Public venue website: overview, gallery, facilities, packages, event categories, availability enquiry, contact and quotation request. Submission creates a CRM record. Demonstrate integration with an existing website without requiring replacement.
-   Internal operations portal: role-specific mobile-first workflows.
-   Management portal: financial and operational dashboards, approvals, accountability, administration and reporting.
-   Platform administration: simulated multi-tenant environment with Gayatri Vihar as primary demo tenant.

## 5. Role-based access control

Implement module-, action-, record-, department- and event-level permissions. Each role has a genuinely distinct dashboard, not merely hidden navigation. Support multiple roles, temporary event assignments, delegation, approval thresholds, read/create/update/approve/export permissions, permission change audit logs and restricted global search. Enforce simulated authorization on every data access and mutation, including direct routes. Production must enforce tenant isolation and authorization server-side.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Role                               Dashboard and permitted actions                                                                                                                                                                        Restrictions
  ---------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------------------------------------------------------------------------------
  Platform Super Admin (Arclyte)     Organisations, subscriptions, feature flags, enabled modules, system health, technical logs, usage analytics, support access, platform AI chatbot                                                      No tenant financial or operational data by default; explicit time-limited audited support authorization

  Venue Owner / Organisation Admin   Revenue, collections, cash, profitability, workforce costs, vendor liabilities, approvals, overdue tasks, all events, users, roles, deadlines, exports, exceptional closure, organisation AI chatbot   Tenant only

  General Manager                    Events, readiness, staffing, department status, tasks, escalation, operational approvals and closure                                                                                                   No unrestricted sensitive finance or platform settings

  Booking Manager                    Enquiries, quotations, visits, availability, customers, bookings, advance confirmation requests                                                                                                        No payroll or unrelated financial records

  Event Manager                      Assigned events, timelines, staff, vendors, checklists, expenses, incidents, closure initiation                                                                                                        Assigned events only

  Finance Manager / Accountant       Receivables, payables, reconciliation, payroll verification, approval limits, adjustment entries, reports and exports                                                                                  No silent deletion or overwriting of confirmed transactions

  Cashier                            Opening balance, receipts, approved payments, wage disbursements, vendor payments, physical count, correction requests                                                                                 No self-approval of high-value requests or editing approved payroll

  HR / Workforce Manager             Employee registration, temporary workers, shifts, wage rates, attendance, payroll preparation                                                                                                          Cannot confirm actual cash disbursement

  Floor Supervisor                   Assigned event, worker roster, bulk attendance, overtime, checklists, expense requests, incidents, evidence uploads                                                                                    Assigned workers/events only; no organisation-wide finances

  Vendor / Procurement Coordinator   Vendor directory, orders, deliveries, invoice uploads, payment requests                                                                                                                                Cannot independently approve and disburse payments

  Entry-Level Staff / Worker         Own shift, check-in/out, assigned tasks, personal attendance/wages, payment acknowledgement, incident reporting                                                                                        Own records only; no other salaries or management data
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 6. Core modules

### A. Booking CRM

Website, walk-in and telephone enquiries; customer profiles; follow-ups; site visits; quotations; advance tracking; communication history; conversion analytics; Kanban and table views. Pipeline: New Enquiry → Contacted → Site Visit → Quotation Sent → Negotiation → Confirmed → Event Completed.

### B. Calendar and availability

Monthly/weekly/daily calendar, multiple halls, resource availability, event categories, setup/teardown schedules, conflict detection, countdown, staff assignments and colour-coded status.

### C. Event operations

Event workspace with customer, schedule, guest count, manager, departments, staffing, vendors, budget, expenses, incidents and closure. Checklists for setup, security, housekeeping, catering, electrical and maintenance. Readiness score derived from actual checklist completion and unresolved critical requirements.

### D. Attendance and workforce

Permanent, temporary and contract workers; shifts, event assignments, availability, QR check-in simulation, supervisor-assisted and bulk attendance, check-out, overtime, absences and correction requests. Confirmed attendance updates draft wages and workforce reports.

### E. Payroll

Monthly, daily, hourly and event-based wages; overtime, advances, authorised deductions, partial payments, pending wages, wage slips, acknowledgements and event labour costs. Workflow: Attendance Submitted → Supervisor Verified → Payroll Calculated → Finance Approved → Cashier Disbursed → Worker Acknowledged. Keep liabilities separate from actual payments. Configurable statutory deductions are demo functionality, not a claim of compliance.

### F. Cash ledger and reconciliation

Opening cash, advances, booking receipts, expenses, vendor payments, wages, petty cash, custodian transfers, refunds, closing balance, denomination-based physical count, digital receipts, evidence and approval history. Expected closing = opening + inflows − outflows. Discrepancy = physical count − expected closing. Every transaction has ID, amount, method, event, category, responsible employee, timestamp, evidence and approval/payment status. Confirmed entries cannot be silently edited; use authorised reversals or adjustments with reasons. Support accurate accounting and legitimate financial accountability.

### G. Vendors and procurement

Vendor directory, categories, quotations, purchase requests/orders, delivery verification, invoice uploads, liabilities, payment history, performance and event costs. Workflow: Requested → Approved → Ordered → Delivery Verified → Invoice Recorded → Payment Approved → Payment Confirmed. Prevent duplicate invoices and payments.

### H. Expenses

Quick forms, templates, receipt upload, simulated voice/WhatsApp input. Categories: labour, decoration, catering, security, housekeeping, electricity, maintenance, transport, equipment rental and miscellaneous. Assign to event, department or general cost centre.

### I. Operational accountability engine

Automatically generate required tasks from event type, schedule and department. Each task has owner, event, department, deadline, priority, evidence, verification requirement and escalation owner. Statuses: Not Started, In Progress, Submitted, Awaiting Verification, Completed, Overdue, Escalated. Attendance before shift, delivery verification upon arrival, expenses before shift closure, payroll by next morning and reconciliation before financial closure. Remind and escalate overdue tasks; allow delegation and reasoned deadline extensions. Dashboard shows on-time completion, missing records, department performance, repeated delays and approvals. Mandatory financial tasks cannot be completed without required records.

### J. Event closure engine

Validate attendance, overtime, deliveries, expenses, customer payment status, payroll liabilities, recorded payments, cash reconciliation, incidents and approvals. Statuses: Upcoming → Preparation → Ready → Live → Operationally Completed → Pending Reconciliation → Financially Closed. Show missing requirement, responsible employee and deadline. Authorised exceptions must preserve outstanding liabilities and discrepancies. Generate closure report.

### K. Financial intelligence

Contracted revenue, collections, cash/digital split, receivables, labour/vendor/operational costs, event contribution, monthly trends, department costs, discrepancies, liabilities and budget vs actual. Distinguish revenue, collections, incurred expenses and disbursements; label overhead assumptions and estimated profitability.

### L. Notifications

In-app, simulated WhatsApp/email reminders for overdue tasks, approvals, missing attendance, discrepancies, outstanding payments, bookings, vendor delays and readiness. Deep-link to relevant authorised action.

### M. Reports and audit

Daily operations, event summary, attendance, payroll, cash ledger, reconciliation, vendor outstanding, profitability, accountability and monthly management reports. Printable reports and functional CSV exports. Audit entries capture actor, action, previous/new values, timestamp, record, approval and correction reason.

## 7. Low-input capture

Role-aware quick actions: supervisors mark attendance/complete checklist/request expense/report incident; cashiers receive cash/pay approved requests/count cash; booking managers add enquiry/create booking/request advance; workers check in/complete task/acknowledge payment. Prefill assigned event, saved worker groups, common vendors and templates. Simulate OCR, voice and WhatsApp entry. Example: "Paid ₹4,500 to six housekeeping workers for today's wedding." Extract amount, labour category, department, worker count and event; show confirmation before recording, subject to permissions and approval requirements. Label AI simulations.

## 8. Full multilingual support --- English, Hindi and Kannada

Implement application-wide internationalisation using next-intl or equivalent. Provide English (en-IN), Hindi (hi-IN) and Kannada (kn-IN), with a prominent language switcher on login, public site, settings and mobile worker interface. Persist preference per demo user; switch instantly without losing data or scenario progress. Translate navigation, dashboards, forms, validation, status labels, notifications, checklists, guided scenarios, help, chatbot interface and printable report headings. Use translation dictionaries with stable keys; do not hardcode UI strings. Store canonical status codes and numerical values independently of language. Use Indian INR formatting and Asia/Kolkata timezone. Preserve proper names and original user-entered text; optional translations must be labelled. Use Noto Sans, Noto Sans Devanagari and Noto Sans Kannada with suitable fallback and line height. Test wrapping, mobile layouts, mixed-script input and Unicode CSV exports. Provide natural translations, not transliteration alone. Support Hindi/Kannada simulated voice and natural-language input examples with confirmation. English fallback for missing translations; no raw translation keys visible. Include language switching in the guided demo.

## 9. Super Admin AI chatbot --- VenueOS Copilot

Add a polished conversational assistant for Platform Super Admin and a separately scoped version for Venue Owner / Organisation Admin. Platform assistant answers platform-level questions about tenant counts, system health, enabled modules, usage, subscriptions and technical issues; it must never access tenant operational or financial data without explicitly authorised, time-limited, audited support access. Organisation assistant answers questions about its own venue only. No cross-tenant leakage.

Provide a floating launcher and full-screen chat workspace with conversation history, suggested questions, date/event filters, streaming-style responses, source record links, charts, tables, downloadable authorised reports and follow-up questions. Support English, Hindi and Kannada input/output, including mixed-language queries. Use current selected language by default. Implement deterministic intent parsing and structured queries over shared demo state, with no external LLM dependency; label simulated AI and gracefully handle unsupported questions. Do not fabricate figures. Show calculation basis, date range, source records and last-updated time. Treat record text as untrusted data, not instructions. Restrict chat tools and exports to the user's effective permissions. Audit chatbot queries and tool actions with appropriate redaction. Default to read-only; no autonomous payments, approvals, edits or role changes. Any future write action must require explicit confirmation and normal authorization.

Suggested organisation queries: - How much cash was collected today and what is the expected closing balance? - Which events are awaiting closure and who is responsible? - Why is there a ₹500 cash discrepancy? - What are outstanding vendor payments and unpaid wages? - Which event has the highest estimated contribution this month? - Show overdue tasks by department and draft a management summary. - आज कितनी नकद राशि प्राप्त हुई? - ಇಂದು ಯಾವ ಕೆಲಸಗಳು ಬಾಕಿ ಉಳಿದಿವೆ?

Suggested platform queries: Which tenants have service issues? Which modules are enabled? Summarise platform usage this week. Demonstrate that a request for another tenant's payroll is denied. Chat answers must update after actual demo actions, not use disconnected canned figures.

## 10. Operational command centre

Show today's events, live status, readiness, department performance, checked-in workers, recorded cash, approvals, overdue tasks, vendor deliveries, receivables, incidents and events awaiting closure. Live activity feed derived from actual shared-state actions: attendance confirmed, advance received, delivery verified, payroll approved, checklist completed, discrepancy detected.

## 11. Guided Demo Centre

Dedicated presentation mode with scenario cards, description, duration, recommended role sequence, start/next/previous/reset, progress, highlighted UI elements and before/after impact. Instant role switching preserves shared state. Previous steps navigate or restore a clearly defined snapshot; avoid duplicating transactions. Allow manual actions or guided execution; show each important action before applying it. Each scenario starts from a consistent isolated fixture.

### Scenario 1 --- Website enquiry to booking

Wedding reception for 1,200 guests. Submit website enquiry → booking manager receives it → quotation ₹6,50,000 → confirmation → cashier records ₹1,50,000 advance → calendar event and manager assignment → automatic tasks → owner sees ₹5,00,000 outstanding.

### Scenario 2 --- Temporary workforce and cash payroll

HR assigns 24 workers at ₹800/shift; supervisor confirms attendance; four workers complete two approved overtime hours at ₹100/hour. Base ₹19,200 + overtime ₹800 = ₹20,000. Finance approves, cashier disburses, workers acknowledge, owner sees labour costs.

### Scenario 3 --- Cash discrepancy

Opening ₹50,000; receipts ₹1,20,000; wages ₹35,000; vendors ₹22,000; expected ₹1,13,000; physical count ₹1,12,500; shortfall ₹500. Cashier submits count, finance receives alert, management reviews evidence and records authorised adjustment or unresolved discrepancy. Never silently write off.

### Scenario 4 --- Missing data and accountability

Attendance submitted, vendor verification overdue, expense awaiting approval, reconciliation missing. Owner identifies responsible employees, reminders trigger, manager delegates overdue task, employees submit missing records, completion indicators update.

### Scenario 5 --- Event profitability

Contracted ₹6,50,000; collected ₹5,50,000; outstanding ₹1,00,000. Labour ₹80,000; vendors ₹1,70,000; utilities ₹35,000; housekeeping ₹25,000; security ₹20,000; other ₹30,000. Direct expenses ₹3,60,000; estimated contribution ₹2,90,000 before overhead/taxes. Update figures from authorised records; distinguish cash from profit.

### Scenario 6 --- Vendor approval

Decoration invoice ₹75,000. Procurement records delivery and invoice; event manager verifies; finance reviews; owner approves if threshold exceeded; cashier disburses; liability and cash ledger update without double-counting expense.

### Scenario 7 --- Event closure

Corporate event with missing attendance, vendor invoice and reconciliation. Supervisor completes attendance; procurement submits invoice; finance verifies; cashier reconciles; event manager submits closure; owner reviews financial closure; generate final report. Preserve outstanding liabilities if exception approved.

### Scenario 8 --- Entry-level employee and language switching

Switch from owner desktop to worker mobile. Change English to Kannada, check in, complete task, check out, view own wages and acknowledge payment. Switch to Hindi and verify same records persist. Attempt management URL and show access denied.

### Scenario 9 --- Super Admin chatbot

Owner asks for today's cash position, then asks why reconciliation shows ₹500 shortfall. Copilot returns live ledger calculation, source links and responsible role. Resolve or document discrepancy through normal workflow and ask again to demonstrate refreshed data. Ask for overdue tasks in Kannada and vendor liabilities in Hindi. Switch to platform Super Admin, ask about tenant health, then attempt unauthorised tenant payroll query and show denial. Demonstrate permission-aware responses and no autonomous financial actions.

## 12. Seed data

35 fictional events including 12 upcoming and 8 historical completed; multiple halls; 25 permanent staff; 120 temporary workers; 20 vendors; 40 enquiries; 150 financial transactions; 100 tasks; payroll cycles, approvals, discrepancies and closure reports. Weddings, conferences, exhibitions, engagements, celebrations, cultural events and product launches. Indian names, INR, Indian dates and Asia/Kolkata. All figures internally consistent and explicitly fictional, not actual Gayatri Vihar records.

## 13. Executive business impact page

Title: How VenueOS Transforms Your Operations. Before: registers, fragmented WhatsApp, delayed expenses, unclear responsibility, manual payroll, limited profitability visibility, delayed reconciliation and admin dependence. After: distributed capture, role-specific interfaces, automatic wages, central cash records, event visibility, reminders, accountability and closure. Editable ROI calculator: events/month, admin hours/event, hourly cost, time saved, estimated avoidable discrepancies, implementation and maintenance costs. Calculate annual potential savings and payback (show no payback if net savings nonpositive). Label all assumptions; no guaranteed savings.

## 14. Navigation and presentation controls

Management navigation: Command Centre, CRM, Calendar, Events, Workforce, Attendance, Payroll, Cash, Expenses, Vendors, Tasks, Approvals, Closure, Financial Intelligence, Reports, Audit Logs, Notifications, Users & Permissions, Settings, Copilot (authorised roles), Demo Centre. Restrict dynamically; worker navigation maximum 4--5 items. Permission-filtered global search.

Presentation toolbar: role switch, organisation, scenario, simulated date/time, advance time, language, mobile preview, fullscreen, reset scenario/all data. Advancing time triggers overdue reminders/escalation. Side-by-side owner desktop and employee mobile preview. Persistent Demo Mode indicator. Demo role switching must not exist in production authentication.

## 15. Functional acceptance criteria

-   Enquiry creates CRM record; booking creates event and tasks.
-   Attendance updates wages; approval creates payment request; actual disbursement updates ledger.
-   Vendor invoice creates liability; payment reduces liability without duplicate expense.
-   Cash count calculates discrepancies; missing records trigger alerts; time advance escalates overdue tasks.
-   Role changes restrict dashboards, records, actions, search, reports and chatbot access.
-   Closure validates requirements; financial dashboards and exports reflect shared state.
-   Language changes preserve data, permissions and scenario progress; all three languages work throughout.
-   Copilot answers use current authorised records, show sources and refuse restricted queries.
-   Refresh preserves data; resets restore fixtures; prevent duplicate payments/submissions and invalid transitions.
-   Sensitive actions require confirmation; include loading, empty, validation and access-denied states.
-   No broken navigation, placeholder buttons or disconnected static pages.

## 16. Recommended live presentation (20 minutes)

1.  Owner command centre (2 min).
2.  Website to booking (2 min).
3.  Distributed entry, worker language switch, attendance to payroll (4 min).
4.  Cash reconciliation (3 min).
5.  Missing information and escalation (3 min).
6.  Closure and profitability (2 min).
7.  Super Admin / Owner Copilot and permission denial (3 min).
8.  Business impact and commercial discussion (1 min).

Emphasise distributed data collection, operational accountability, event closure, multilingual accessibility and permission-aware conversational intelligence. Prioritise working end-to-end workflows over decorative dashboards. Build the complete cohesive demonstration as VenueOS by Arclyte Studios.
