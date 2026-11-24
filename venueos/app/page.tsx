'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useReady, useToast, useT } from '@/components/ui';
import { LANGS } from '@/lib/i18n';
import { ROLES, homeFor } from '@/lib/rbac';
import { useRouter } from 'next/navigation';

export default function Public() {
  const ready = useReady(); const t = useT();
  const { submitEnquiry, lang, setLang, setRole } = useStore();
  const router = useRouter();
  const { run, node } = useToast();
  const [f, setF] = useState({ name: '', phone: '', type: 'Wedding', guests: 300, date: '2026-12-20', notes: '' });
  if (!ready) return null;
  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3 bg-navy-900 px-6 py-4 text-white">
        <div><div className="text-xl font-semibold">Gayatri Vihar <span className="text-xs text-gold-soft">(fictional demo)</span></div><div className="text-xs text-slate-400">Palace Grounds, Bengaluru</div></div>
        <div className="flex items-center gap-2">
          {LANGS.map(l => <button key={l.id} onClick={() => setLang(l.id)} className={`rounded px-2 py-1 text-sm ${lang === l.id ? 'bg-gold' : 'bg-navy-700'}`}>{l.label}</button>)}
        </div>
      </header>
      <section className="bg-navy-800 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-semibold md:text-5xl">VenueOS <span className="text-gold-soft">by Arclyte Studios</span></h1>
        <p className="mt-3 text-lg text-slate-300">{t('app.tagline')}</p>
        <div className="mx-auto mt-8 max-w-xl rounded-xl bg-surface p-4 text-left text-ink">
          <div className="mb-2 text-sm font-semibold">{t('login.pick')}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROLES.map(r => <button key={r.id} className="btn-ghost !justify-start text-left" onClick={() => { setRole(r.id); router.push(homeFor(r.id)); }}>{r.name}</button>)}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Halls & packages</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[['Grand Durbar', 'Up to 1,500 guests — weddings, receptions'], ['Palace Lawn', 'Open-air, up to 2,000 guests'], ['Rajmahal Hall', 'Conferences & launches, 400 guests'], ['Garden Pavilion', 'Engagements & celebrations, 250 guests']].map(h => <li key={h[0]} className="card"><b>{h[0]}</b><div className="text-mute">{h[1]}</div></li>)}
          </ul>
          <p className="mt-4 text-xs text-mute">Embeddable on an existing website: this enquiry form can be dropped in as a script/iframe widget; submissions create CRM records without replacing the current site.</p>
        </div>
        <form className="card space-y-3" onSubmit={e => { e.preventDefault(); const r = run(submitEnquiry({ ...f, guests: Number(f.guests) }, true)); if (r.ok) setF({ ...f, name: '', phone: '', notes: '' }); }}>
          <h2 className="text-lg font-semibold">Availability enquiry / quotation request</h2>
          <div><label className="label">Name</label><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="label">Phone (10 digits)</label><input className="input" inputMode="numeric" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Event type</label><select className="input" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{['Wedding', 'Conference', 'Exhibition', 'Engagement', 'Celebration', 'Cultural Event', 'Product Launch'].map(x => <option key={x}>{x}</option>)}</select></div>
            <div><label className="label">Guests</label><input type="number" className="input" value={f.guests} onChange={e => setF({ ...f, guests: Number(e.target.value) })} /></div>
          </div>
          <div><label className="label">Preferred date</label><input type="date" className="input" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
          <div><label className="label">Notes</label><textarea className="input" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
          <button className="btn-gold w-full">Request quotation</button>
          <p className="text-xs text-mute">Demo: submission appears in CRM as a website enquiry (Booking Manager role).</p>
        </form>
      </section>
      <footer className="px-6 pb-8 text-center text-xs text-mute">All data fictional. Not actual Gayatri Vihar records. <Link href="/app/impact" className="underline">Business impact</Link></footer>
      {node}
    </div>
  );
}
