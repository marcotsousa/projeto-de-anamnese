import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function authorize(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token || !url || !publicKey || !serviceKey) return null;
  const publicClient = createClient(url, publicKey);
  const { data } = await publicClient.auth.getUser(token);
  if (!data.user) return null;
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile } = await admin.from('profiles').select('role').eq('user_id', data.user.id).single();
  if (!profile) return null;
  return { admin, userId: data.user.id, role: profile.role as string };
}

function addHour(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes + 60;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  let query = authorization.admin.from('clients').select('id, data').order('created_at', { ascending: false });
  if (['psicologo', 'assistente_social'].includes(authorization.role))
    query = query.or(`assigned_professional_id.eq.${authorization.userId},created_by.eq.${authorization.userId}`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os Acolhidos.' }, { status: 400 });
  return NextResponse.json((data ?? []).map((row) => row.data));
}

export async function POST(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization)
    return NextResponse.json({ error: 'Sem permissão para cadastrar.' }, { status: 403 });
  const { client, professionalId, date, startTime } = await request.json();
  if (!client?.id || !client?.name?.trim() || !client?.spaPhone?.trim() || !professionalId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime))
    return NextResponse.json({ error: 'Preencha os dados do Acolhido e do agendamento.' }, { status: 400 });
  if (date < new Date().toISOString().slice(0, 10))
    return NextResponse.json({ error: 'A data do atendimento não pode estar no passado.' }, { status: 400 });
  const { data: professional } = await authorization.admin
    .from('profiles')
    .select('availability_start, availability_end')
    .eq('user_id', professionalId)
    .in('role', ['psicologo', 'assistente_social'])
    .single();
  const availabilityStart = String(professional?.availability_start || '').slice(0, 5);
  const availabilityEnd = String(professional?.availability_end || '').slice(0, 5);
  const endTime = addHour(startTime);
  if (!professional || startTime < availabilityStart || endTime > availabilityEnd)
    return NextResponse.json({ error: 'Horário fora da disponibilidade do profissional.' }, { status: 400 });

  const { data: appointmentId, error } = await authorization.admin.rpc('create_client_with_appointment', {
    p_client_id: String(client.id),
    p_client_data: client,
    p_client_phone: client.spaPhone.trim(),
    p_professional_id: professionalId,
    p_appointment_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_created_by: authorization.userId,
  });
  if (error?.message.includes('Horário ocupado'))
    return NextResponse.json({ error: 'Este horário acabou de ser ocupado. Escolha outro.' }, { status: 409 });
  if (error) return NextResponse.json({ error: 'Não foi possível salvar o Acolhido e o agendamento.' }, { status: 400 });
  return NextResponse.json({ appointmentId, endTime });
}

export async function DELETE(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const clientId = request.nextUrl.searchParams.get('id');
  if (!clientId) return NextResponse.json({ error: 'Acolhido não informado.' }, { status: 400 });
  let query = authorization.admin.from('clients').delete().eq('id', clientId);
  if (['psicologo', 'assistente_social'].includes(authorization.role))
    query = query.or(`assigned_professional_id.eq.${authorization.userId},created_by.eq.${authorization.userId}`);
  const { error } = await query;
  if (error) return NextResponse.json({ error: 'Não foi possível apagar o Acolhido.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
