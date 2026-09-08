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
  const professionalId = request.nextUrl.searchParams.get('professionalId');
  const date = request.nextUrl.searchParams.get('date');
  const includeAll = request.nextUrl.searchParams.get('all') === 'true';
  let query = authorization.admin
    .from('appointments')
    .select('id, client_reference, client_name, client_phone, professional_user_id, professional_name, professional_role, appointment_date, start_time, end_time, status')
    .neq('status', 'cancelado')
    .order('appointment_date')
    .order('start_time');
  if (professionalId) query = query.eq('professional_user_id', professionalId);
  if (date) query = query.eq('appointment_date', date);
  else if (!includeAll) query = query.gte('appointment_date', new Date().toISOString().slice(0, 10));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Não foi possível carregar a agenda.' }, { status: 400 });
  return NextResponse.json((data ?? []).map((item) => ({
    id: item.id,
    clientReference: item.client_reference,
    clientName: item.client_name,
    clientPhone: item.client_phone,
    professionalId: item.professional_user_id,
    professionalName: item.professional_name,
    professionalRole: item.professional_role,
    date: item.appointment_date,
    startTime: String(item.start_time).slice(0, 5),
    endTime: String(item.end_time).slice(0, 5),
    status: item.status,
  })));
}

export async function POST(request: NextRequest) {
  const authorization = await authorize(request);
  if (!authorization || authorization.role === 'juridico') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { clientReference, clientName, clientPhone, professionalId, date, startTime } = await request.json();
  if (!clientReference || !clientName?.trim() || !clientPhone?.trim() || !professionalId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime))
    return NextResponse.json({ error: 'Preencha telefone, profissional, data e horário.' }, { status: 400 });
  if (date < new Date().toISOString().slice(0, 10))
    return NextResponse.json({ error: 'A data do atendimento não pode estar no passado.' }, { status: 400 });

  let clientQuery = authorization.admin.from('clients').select('data').eq('id', String(clientReference));
  if (['psicologo', 'assistente_social'].includes(authorization.role))
    clientQuery = clientQuery.or(`assigned_professional_id.eq.${authorization.userId},created_by.eq.${authorization.userId}`);
  const { data: clientRow, error: clientError } = await clientQuery.maybeSingle();
  if (clientError || !clientRow)
    return NextResponse.json({ error: 'Acolhido não encontrado ou sem permissão.' }, { status: 404 });

  const { data: professional } = await authorization.admin
    .from('profiles')
    .select('full_name, role, availability_start, availability_end')
    .eq('user_id', professionalId)
    .in('role', ['psicologo', 'assistente_social'])
    .single();
  if (!professional)
    return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 });
  const availabilityStart = String(professional.availability_start || '').slice(0, 5);
  const availabilityEnd = String(professional.availability_end || '').slice(0, 5);
  const endTime = addHour(startTime);
  if (!availabilityStart || !availabilityEnd || startTime < availabilityStart || endTime > availabilityEnd)
    return NextResponse.json({ error: 'O horário escolhido está fora da disponibilidade do profissional.' }, { status: 400 });

  const { data: overlap } = await authorization.admin
    .from('appointments')
    .select('id')
    .eq('professional_user_id', professionalId)
    .eq('appointment_date', date)
    .in('status', ['agendado', 'confirmado'])
    .lt('start_time', endTime)
    .gt('end_time', startTime)
    .limit(1);
  if (overlap?.length)
    return NextResponse.json({ error: 'Este horário conflita com outro atendimento.' }, { status: 409 });

  const storedClient = clientRow.data as Record<string, unknown>;
  const storedClientName = String(storedClient.name || clientName).trim();
  const storedClientPhone = String(storedClient.spaPhone || storedClient.phone || clientPhone).trim();
  const { data, error } = await authorization.admin.from('appointments').insert({
    client_reference: String(clientReference),
    client_name: storedClientName,
    client_phone: storedClientPhone,
    professional_user_id: professionalId,
    professional_name: professional.full_name,
    professional_role: professional.role,
    appointment_date: date,
    start_time: startTime,
    end_time: endTime,
    created_by: authorization.userId,
  }).select('id').single();
  if (error?.code === '23505')
    return NextResponse.json({ error: 'Este horário acabou de ser ocupado. Escolha outro.' }, { status: 409 });
  if (error) return NextResponse.json({ error: 'Não foi possível salvar o agendamento.' }, { status: 400 });
  const updatedClient = {
    ...storedClient,
    assignedProfessionalId: professionalId,
    assignedProfessionalName: professional.full_name,
    assignedProfessionalRole: professional.role === 'psicologo' ? 'Psicólogo' : 'Assistente Social',
    appointmentDate: date,
    appointmentTime: startTime,
    appointmentId: data.id,
  };
  const { error: updateError } = await authorization.admin
    .from('clients')
    .update({ data: updatedClient, assigned_professional_id: professionalId })
    .eq('id', String(clientReference));
  if (updateError) {
    await authorization.admin.from('appointments').delete().eq('id', data.id);
    return NextResponse.json({ error: 'Não foi possível vincular o agendamento ao Acolhido.' }, { status: 400 });
  }
  return NextResponse.json({
    id: data.id,
    endTime,
    professionalName: professional.full_name,
    professionalRole: professional.role,
    client: updatedClient,
  });
}
