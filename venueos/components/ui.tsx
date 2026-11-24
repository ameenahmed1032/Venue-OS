'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { translate } from '@/lib/i18n';
import type { Res } from '@/lib/store';

export function useT() {
  const lang = useStore(s => s.lang);
  return (k: string) => translate(lang, k);
}
export function useReady() {
  const [r, setR] = useState(false);
  useEffect(() => { Promise.resolve(useStore.persist.rehydrate()).then(() => setR(true)); }, []);
  const dark = useStore(s => s.dark); const lang = useStore(s => s.lang);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.documentElement.lang = lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'kn-IN'; }, [dark, lang]);
  return r;
}

export function useToast() {
  const [m, setM] = useState<(Res & { n: number }) | null>(null);
  useEffect(() => { if (m) { const t = setTimeout(() => setM(null), 3500); return () => clearTimeout(t); } }, [m]);
  const run = (r: Res) => { setM({ ...r, n: Date.now() }); return r; };
  const node = m ? <div role="status" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-lg ${m.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>{m.msg}</div> : null;
  return { run, node };
}

const tone: Record<string, string> = { green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-800', gray: 'bg-slate-100 text-slate-700', gold: 'bg-yellow-100 text-yellow-800', blue: 'bg-sky-100 text-sky-800' };
export const Badge = ({ t = 'gray', children }: { t?: keyof typeof tone; children: React.ReactNode }) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone[t]}`}>{children}</span>;

export const Stat = ({ label, value, sub, tone: tn }: { label: string; value: React.ReactNode; sub?: string; tone?: 'red' | 'green' | 'amber' }) => (
  <div className="card"><div className="text-xs text-mute">{label}</div><div className={`mt-1 text-2xl font-semibold ${tn === 'red' ? 'text-red-600' : tn === 'green' ? 'text-emerald-600' : tn === 'amber' ? 'text-amber-600' : ''}`}>{value}</div>{sub && <div className="mt-1 text-xs text-mute">{sub}</div>}</div>
);
export const PageHead = ({ title, children }: { title: string; children?: React.ReactNode }) => <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">{title}</h1><div className="flex flex-wrap gap-2">{children}</div></div>;
export const Empty = ({ text }: { text?: string }) => { const t = useT(); return <div className="py-8 text-center text-sm text-mute">{text ?? t('common.empty')}</div>; };

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full"><thead><tr>{head.map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function Confirm({ label, msg, onYes, cls = 'btn-primary', disabled }: { label: string; msg: string; onYes: () => void; cls?: string; disabled?: boolean }) {
  const [o, setO] = useState(false);
  const t = useT();
  return <>
    <button className={cls} disabled={disabled} onClick={() => setO(true)}>{label}</button>
    {o && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog"><div className="card w-full max-w-sm"><p className="text-sm">{msg}</p><div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setO(false)}>{t('common.cancel')}</button><button className="btn-primary" onClick={() => { setO(false); onYes(); }}>{t('common.confirm')}</button></div></div></div>}
  </>;
}
