import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const svc = supabaseService();
  const { data, error } = await svc.from('posts')
    .select('id,created_at,body_redacted,reports_count,is_hidden,reaction_fire,reaction_lol,reaction_wow,reaction_mad,image_url')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return <div className="text-red-400">error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">admin</h1>
      <div className="text-sm text-neutral-400">latest 50 posts</div>
      <div className="space-y-3">
        {data?.map((p) => (
          <div key={p.id} className="rounded border border-neutral-800 p-3">
            <div className="text-xs text-neutral-500">{new Date(p.created_at).toLocaleString()}</div>
            {p.image_url && <img src={p.image_url} alt="" className="mt-2 w-full rounded-lg border border-neutral-800" />}
            <div className="mt-2">{p.body_redacted}</div>
            <div className="mt-2 text-xs text-neutral-400 flex gap-3">
              <span>reports: {p.reports_count}</span>
              <span>hidden: {String(p.is_hidden)}</span>
              <span>🔥 {p.reaction_fire} 😂 {p.reaction_lol} 😮 {p.reaction_wow} 😡 {p.reaction_mad}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
