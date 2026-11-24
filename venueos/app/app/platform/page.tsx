'use client';
import { PageHead, Stat, Table, Badge } from '@/components/ui';
import Link from 'next/link';

export default function Platform() {
  return (
    <div>
      <PageHead title="Platform administration — Arclyte" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Tenants" value={3} /><Stat label="Services healthy" value="2 / 3" tone="amber" /><Stat label="Active users (7d)" value={142} /><Stat label="Support grants active" value={0} /></div>
      <div className="card mt-4"><Table head={['Tenant', 'Plan', 'Modules', 'Health']}>
        <tr><td className="td">Gayatri Vihar (demo)</td><td className="td">Enterprise</td><td className="td">CRM, Events, Payroll, Cash, Vendors, Copilot</td><td className="td"><Badge t="green">Healthy</Badge></td></tr>
        <tr><td className="td">Rangoli Convention</td><td className="td">Pro</td><td className="td">CRM, Events, Cash</td><td className="td"><Badge t="amber">WhatsApp gateway delayed</Badge></td></tr>
        <tr><td className="td">Kaveri Banquets</td><td className="td">Starter</td><td className="td">CRM, Calendar</td><td className="td"><Badge t="green">Healthy</Badge></td></tr>
      </Table></div>
      <p className="mt-3 text-sm text-mute">Super Admin has no tenant financial or operational data by default. Tenant access requires explicit, time-limited, audited support authorization (not granted). Try the <Link className="underline" href="/app/copilot">platform Copilot</Link> with a tenant payroll question to see denial.</p>
    </div>
  );
}
