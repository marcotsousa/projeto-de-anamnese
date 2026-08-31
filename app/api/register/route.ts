import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  if (!url || !serviceKey)
    return NextResponse.json({ error: 'Cadastro indisponível no momento.' }, { status: 503 });

  const { fullName, email, password, jobTitle, council, businessAddress, state, municipality, whatsapp } = await request.json();
  if (!fullName?.trim() || !email?.trim() || !password)
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 });
  if (!council?.trim())
    return NextResponse.json(
      { error: 'Informe o número do CRP para prosseguir com o cadastro.' },
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
    role: 'psicologo',
    job_title: jobTitle?.trim() || 'Psicólogo(a)',
    council: council?.trim() || '',
    business_address: businessAddress?.trim() || '',
    state: state.trim(),
    municipality: municipality?.trim() || '',
    whatsapp: whatsapp?.trim() || '',
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: 'Não foi possível concluir o cadastro.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
