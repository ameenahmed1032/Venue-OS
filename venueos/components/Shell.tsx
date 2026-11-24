'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, BarChart3, Bell, Building2, CalendarDays, Wallet, ClipboardCheck, FileText, Gauge, Handshake, Users, Truck, Receipt, ShieldCheck, Sparkles, PlayCircle, Moon, Sun, Languages, Clock, RotateCcw, Smartphone, TrendingUp, Banknote, Lock, UserCog, ListChecks, CheckSquare } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ROLES, ACCESS, can, homeFor, type Module } from '@/lib/rbac';
import { LANGS } from '@/lib/i18n';
import { useT, useReady } from './ui';
import { dt } from '@/lib/format';
import WorkerView from './WorkerView';

const NAV: { m: Module; icon: any }[] = [
  { m: 'command', icon: Gauge }, { m: 'platform', icon: Building2 }, { m: 'crm', icon: Handshake }, { m: 'calendar', icon: CalendarDays }, { m: 'events', icon: Activity }, { m: 'workforce', icon: Users }, { m: 'attendance', icon: ClipboardCheck }, { m: 'payroll', icon: Banknote }, { m: 'cash', icon: Wallet }, { m: 'expenses', icon: Receipt }, { m: 'vendors', icon: Truck }, { m: 'tasks', icon: ListChecks }, { m: 'approvals', icon: CheckSquare }, { m: 'closure', icon: Lock }, { m: 'finance', icon: TrendingUp }, { m: 'reports', icon: FileText }, { m: 'audit', icon: ShieldCheck }, { m: 'notifications', icon: Bell }, { m: 'users', icon: UserCog }, { m: 'copilot', icon: Sparkles }, { m: 'demo', icon: PlayCircle }, { m: 'impact', icon: BarChart3 },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const ready = useReady();
  const t = useT();
  const path = usePathname(); const router = useRouter();
  const { role, lang, dark, now, setRole, setLang, toggleDark, advance, reset, notifs } = useStore();
  const [mobile, setMobile] = useState(false);
  const seg = (path.split('/')[2] || 'command') as Module;
  const allowedHere = can(role, seg);
  const unread = notifs.filter(n => (n.to === role || n.to === 'all') && !n.read).length;
  useEffect(() => { if (ready && path === '/app') router.replace(homeFor(role)); }, [ready, path, role, router]);

  if (!ready) return <div className="grid h-screen place-items-center text-mute">Loading VenueOS…</div>;
  const me = ROLES.find(r => r.id === role)!;
  const navItems = NAV.filter(n => can(role, n.m) && n.m !== 'worker');
  const body = allowedHere ? children : (
    <div className="card mx-auto mt-16 max-w-md text-center"><Lock className="mx-auto mb-2 text-red-600" /><h1 className="text-lg font-semibold">{t('common.denied')}</h1><p className="mt-2 text-sm text-mute">{t('common.deniedBody')}</p><p className="mt-2 text-xs text-mute">Role: {me.name} → /app/{seg}</p><button className="btn-primary mt-4" onClick={() => router.push(homeFor(role))}>{t('nav.command')}</button></div>
  );

  const toolbar = (
    <header className="no-print sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-line bg-surface/95 px-4 py-2 text-sm">
      <span className="rounded bg-gold px-2 py-0.5 text-xs font-semibold text-white">DEMO MODE</span>
      <select aria-label="Role" className="input w-auto" value={role} onChange={e => { const r = e.target.value as any; setRole(r); router.push(homeFor(r)); }}>
        {ROLES.map(r => <option key={r.id} value={r.id}>{r.name} — {r.user}</option>)}
      </select>
      <span className="hidden text-mute md:inline">Gayatri Vihar (fictional)</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-mute"><Clock size={14} />{dt(now)}</span>
        <button className="btn-ghost !px-2 !py-1" onClick={() => advance(1)}>+1h</button>
        <button className="btn-ghost !px-2 !py-1" onClick={() => advance(6)}>+6h</button>
        <button className="btn-ghost !px-2 !py-1" onClick={() => advance(24)}>+1d</button>
        <Languages size={16} className="text-mute" />
        <select aria-label={t('lang.label')} className="input w-auto" value={lang} onChange={e => setLang(e.target.value as any)}>{LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
        <button className="btn-ghost !px-2 !py-1" title="Mobile preview" onClick={() => setMobile(m => !m)}><Smartphone size={16} /></button>
        <button className="btn-ghost !px-2 !py-1" aria-label="Theme" onClick={toggleDark}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button className="btn-ghost !px-2 !py-1" title="Reset all data" onClick={() => { if (confirm('Reset all demo data to the fixture?')) reset(); }}><RotateCcw size={16} /></button>
      </div>
    </header>
  );

  if (role === 'worker') {
    return <div className="min-h-screen">{toolbar}<div className="mx-auto max-w-md p-4">{body}</div></div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto bg-navy-900 p-3 text-slate-200 md:block">
        <Link href="/" className="mb-4 block px-2"><div className="text-lg font-semibold text-white">Venue<span className="text-gold-soft">OS</span></div><div className="text-[11px] text-slate-400">by Arclyte Studios</div></Link>
        <nav className="space-y-0.5">
          {navItems.map(n => { const I = n.icon; const active = path.startsWith('/app/' + n.m); return (
            <Link key={n.m} href={'/app/' + n.m} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? 'bg-navy-700 text-gold-soft' : 'hover:bg-navy-800'}`}><I size={16} /><span className="flex-1">{t('nav.' + n.m)}</span>{n.m === 'notifications' && unread > 0 && <span className="rounded-full bg-red-600 px-1.5 text-[10px] text-white">{unread}</span>}</Link>
          ); })}
        </nav>
        <div className="mt-4 px-2 text-[10px] text-slate-500">{ACCESS[role].length} modules visible to this role</div>
      </aside>
      <div className="min-w-0 flex-1">
        {toolbar}
        <nav className="no-print flex gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-1 md:hidden">{navItems.map(n => <Link key={n.m} href={'/app/' + n.m} className={`whitespace-nowrap rounded px-2 py-1 text-xs ${path.startsWith('/app/' + n.m) ? 'bg-navy-800 text-white' : ''}`}>{t('nav.' + n.m)}</Link>)}</nav>
        <main className="p-4 md:p-6">{body}</main>
      </div>
      {mobile && (
        <div className="no-print fixed bottom-4 right-4 z-40 h-[640px] w-[330px] overflow-hidden rounded-[28px] border-4 border-navy-900 bg-page shadow-2xl">
          <div className="flex items-center justify-between bg-navy-900 px-3 py-1 text-xs text-white"><span>Employee mobile preview</span><button onClick={() => setMobile(false)} aria-label="Close">✕</button></div>
          <div className="h-full overflow-y-auto p-3 pb-14"><WorkerView /></div>
        </div>
      )}
    </div>
  );
}
