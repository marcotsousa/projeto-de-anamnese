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
  return profile?.role === 'administrador' ? { admin, requesterId: data.user.id } : null;
}

export async function GET(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { admin } = authorization;
  const [{ data: authData, error }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin
      .from('profiles')
      .select('user_id, full_name, role, job_title, council, business_address, municipality, whatsapp'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return NextResponse.json(
    authData.users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: byId.get(user.id)?.full_name ?? '',
      role: byId.get(user.id)?.role ?? 'psicologo',
      jobTitle: byId.get(user.id)?.job_title ?? '',
      council: byId.get(user.id)?.council ?? '',
      businessAddress: byId.get(user.id)?.business_address ?? '',
      municipality: byId.get(user.id)?.municipality ?? '',
      whatsapp: byId.get(user.id)?.whatsapp ?? '',
      blocked: Boolean(user.banned_until && new Date(user.banned_until) > new Date()),
    })),
  );
}

export async function POST(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { admin } = authorization;
  const {
    fullName,
    email,
    password,
    role,
    jobTitle,
    councilType,
    council,
    businessAddress,
    municipality,
    whatsapp,
  } = await request.json();
  if (!['administrador', 'psicologo', 'assistente_social', 'administrativo'].includes(role))
    return NextResponse.json({ error: 'Perfil inválido.' }, { status: 400 });
  if (['psicologo', 'assistente_social'].includes(role) &&
      (!['CRP', 'CRESS'].includes(councilType) || !council?.trim()))
    return NextResponse.json(
      { error: 'Selecione o Conselho Regional e informe o respectivo número.' },
      { status: 400 },
    );
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
    job_title: jobTitle,
    council: council?.trim() ? `${councilType} ${council.trim().replace(/^(CRP|CRESS)\s*/i, '')}` : '',
    business_address: businessAddress,
    municipality,
    whatsapp,
  });
  if (profileError)
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { admin } = authorization;
  const { userId, role, action } = await request.json();
  if (userId && ['block', 'unblock'].includes(action)) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: action === 'block' ? '876000h' : 'none',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (!userId || !['administrador', 'psicologo', 'assistente_social', 'administrativo'].includes(role))
    return NextResponse.json({ error: 'Usuário ou perfil inválido.' }, { status: 400 });

  const { data: currentProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  if (!currentProfile)
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  if (currentProfile.role === 'administrador' && role !== 'administrador') {
    const { count } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'administrador');
    if ((count ?? 0) <= 1)
      return NextResponse.json(
        { error: 'Cadastre outro Administrador antes de alterar o último acesso administrativo.' },
        { status: 400 },
      );
  }

  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { admin, requesterId } = authorization;
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: 'Usuário inválido.' }, { status: 400 });
  if (userId === requesterId)
    return NextResponse.json({ error: 'Você não pode excluir a própria conta.' }, { status: 400 });

  const { data: profile } = await admin.from('profiles').select('role').eq('user_id', userId).single();
  if (profile?.role === 'administrador') {
    const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'administrador');
    if ((count ?? 0) <= 1)
      return NextResponse.json({ error: 'O último Administrador não pode ser excluído.' }, { status: 400 });
  }
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
