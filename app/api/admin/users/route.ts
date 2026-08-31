import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function authorize(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token || !serviceKey) return null;
  const publicClient = createClient(url, publicKey);
  const { data } = await publicClient.auth.getUser(token);
  if (!data.user) return null;
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();
  return profile?.role === 'administrador' ? admin : null;
}

export async function GET(request: NextRequest) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const [{ data: authData, error }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from('profiles').select('user_id, full_name, role'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return NextResponse.json(
    authData.users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: byId.get(user.id)?.full_name ?? '',
      role: byId.get(user.id)?.role ?? 'psicologo',
    })),
  );
}

export async function POST(request: NextRequest) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { fullName, email, password, role } = await request.json();
  if (!['administrador', 'psicologo', 'administrativo'].includes(role))
    return NextResponse.json({ error: 'Perfil inválido.' }, { status: 400 });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: profileError } = await admin.from('profiles').insert({
    user_id: data.user.id,
    full_name: fullName,
    role,
  });
  if (profileError)
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
