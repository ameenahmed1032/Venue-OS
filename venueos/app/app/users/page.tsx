'use client';
import { PageHead, Table, Badge, useT } from '@/components/ui';
import { ROLES, ACCESS, ALL_MODULES } from '@/lib/rbac';

export default function Users() {
  const t = useT();
  const mods = ALL_MODULES.filter(m => !['worker', 'platform'].includes(m));
  return (
    <div>
      <PageHead title={t('nav.users')} />
      <p className="mb-3 text-xs text-mute">Demo route guards only. In production, tenant isolation, RLS and authorization are enforced server-side (Supabase Auth + PostgreSQL RLS). Demo role switching does not exist in production authentication.</p>
      <div className="card"><Table head={['Role', 'User', ...mods.map(m => t('nav.' + m))]}>
        {ROLES.map(r => <tr key={r.id}><td className="td">{r.name}</td><td className="td">{r.user}</td>{mods.map(m => <td key={m} className="td text-center">{ACCESS[r.id].includes(m) ? <Badge t="green">✓</Badge> : <span className="text-mute">—</span>}</td>)}</tr>)}
      </Table></div>
    </div>
  );
}
