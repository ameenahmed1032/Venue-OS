'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Badge, PageHead, Empty, useT } from '@/components/ui';
import { dt } from '@/lib/format';
import { can } from '@/lib/rbac';

export default function Notifs() {
  const t = useT();
  const { notifs, role, markRead } = useStore();
  const mine = notifs.filter(n => n.to === role || n.to === 'all');
  return (
    <div>
      <PageHead title={t('nav.notifications')} />
      <div className="card divide-y divide-line">
        {mine.length === 0 && <Empty />}
        {mine.slice(0, 60).map(n => { const m = n.link.split('/')[2] as any; const ok = can(role, m);
          return <div key={n.id} className="flex items-center gap-3 py-2 text-sm"><Badge t={n.channel === 'whatsapp' ? 'green' : 'gray'}>{n.channel === 'whatsapp' ? 'WhatsApp (sim)' : 'in-app'}</Badge><div className="flex-1"><div className={n.read ? 'text-mute' : 'font-medium'}>{n.text}</div><div className="text-xs text-mute">{dt(n.ts)}</div></div>{ok ? <Link href={n.link} onClick={() => markRead(n.id)} className="btn-ghost !py-1">Open</Link> : <span className="text-xs text-mute">no access</span>}</div>; })}
      </div>
    </div>
  );
}
