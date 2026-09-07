import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  if (!url || !serviceKey)
    return NextResponse.json({ error: 'Cadastro indisponível no momento.' }, { status: 503 });

  const { fullName, email, password, role = 'psicologo', jobTitle, councilType, council, availabilityStart, availabilityEnd, businessAddress, state, municipality, whatsapp } = await request.json();
  if (!fullName?.trim() || !email?.trim() || !password)
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 });
  if (!['psicologo', 'assistente_social', 'administrativo', 'juridico'].includes(role))
    return NextResponse.json({ error: 'Tipo de perfil inválido.' }, { status: 400 });
  if (['psicologo', 'assistente_social'].includes(role) &&
      (!['CRP', 'CRESS'].includes(councilType) || !council?.trim()))
    return NextResponse.json(
      { error: 'Selecione o Conselho Regional e informe o respectivo número.' },
      { status: 400 },
    );
  if (['psicologo', 'assistente_social'].includes(role) &&
      (!availabilityStart || !availabilityEnd || availabilityEnd <= availabilityStart))
    return NextResponse.json(
      { error: 'Informe um horário final posterior ao horário inicial.' },
      { status: 400 },
    );
  if (!state?.trim() || !municipality?.trim())
    return NextResponse.json(
      { error: 'Selecione o Estado (UF) e o Município.' },
      { status: 400 },
    );
  if (password.length < 8)
    return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 });

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim() },
  });
  if (error) {
    const duplicate = error.message.toLowerCase().includes('already');
    return NextResponse.json(
      { error: duplicate ? 'Este e-mail já possui uma conta.' : 'Não foi possível criar a conta.' },
      { status: 400 },
    );
  }

  const { error: profileError } = await admin.from('profiles').insert({
    user_id: data.user.id,
    full_name: fullName.trim(),
    role,
    job_title: jobTitle?.trim() || (role === 'psicologo' ? 'Psicólogo(a)' : role === 'assistente_social' ? 'Assistente Social' : role === 'juridico' ? 'Jurídico' : 'Administrativo'),
    council: council?.trim() ? `${councilType} ${council.trim().replace(/^(CRP|CRESS)\s*/i, '')}` : '',
    availability_start: availabilityStart || '',
    availability_end: availabilityEnd || '',
    business_address: businessAddress?.trim() || '',
    state: state.trim(),
    municipality: municipality?.trim() || '',
    whatsapp: whatsapp?.trim() || '',
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: 'Não foi possível concluir o cadastro.' }, { status: 400 });
  }
  const { error: suspendError } = await admin.auth.admin.updateUserById(data.user.id, {
    ban_duration: '876000h',
  });
  if (suspendError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: 'Não foi possível deixar a conta aguardando aprovação.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
