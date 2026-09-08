import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token || !url || !publicKey || !serviceKey)
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const publicClient = createClient(url, publicKey);
  const { data: authData } = await publicClient.auth.getUser(token);
  if (!authData.user)
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [{ data: profiles, error }, { data: usersData }] = await Promise.all([
    admin
      .from('profiles')
      .select('user_id, full_name, role, availability_start, availability_end')
      .in('role', ['psicologo', 'assistente_social'])
      .order('full_name'),
    admin.auth.admin.listUsers(),
  ]);
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os profissionais.' }, { status: 400 });
  if (request.nextUrl.searchParams.get('mode') === 'count')
    return NextResponse.json({ count: profiles?.length ?? 0 });

  const suspendedIds = new Set(
    (usersData?.users ?? [])
      .filter((user) => user.banned_until && new Date(user.banned_until) > new Date())
      .map((user) => user.id),
  );
  return NextResponse.json(
    (profiles ?? [])
      .filter((profile) => !suspendedIds.has(profile.user_id))
      .map((profile) => ({
        id: profile.user_id,
        name: profile.full_name,
        role: profile.role,
        availabilityStart: profile.availability_start ?? '',
        availabilityEnd: profile.availability_end ?? '',
      })),
  );
}
