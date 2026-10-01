const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

loadEnvConfig(process.cwd());
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const names = ['Aurora', 'Bento', 'Caio', 'Dália', 'Estela', 'Fábio', 'Gabi', 'Heitor', 'Íris', 'Jonas'];
const today = new Date().toISOString().slice(0, 10);

(async () => {
  const { data: owner, error: ownerError } = await admin.from('profiles').select('user_id, full_name').eq('role', 'administrador').limit(1).single();
  if (ownerError) throw new Error(`Administrador não encontrado: ${ownerError.message}`);
  const { data: rows, error: rowsError } = await admin.from('clients').select('id, data');
  if (rowsError) throw rowsError;
  const existing = new Set((rows || []).map((row) => row.data?.name));
  const clients = names.filter((name) => !existing.has(`Acolhido TESTE ${name}`)).map((name, index) => {
    const id = Date.now() + index;
    const fullName = `Acolhido TESTE ${name}`;
    const birth = `${1980 + index}-0${(index % 9) + 1}-15`;
    return { id: String(id), created_by: owner.user_id, assigned_professional_id: owner.user_id, data: {
      id, name: fullName, initials: `T${name[0]}`, age: 45 - index, phone: `(32) 99999-${String(1000 + index)}`, spaPhone: `(32) 99999-${String(1000 + index)}`, email: '', requesterEmail: '', document: `TESTE-${String(index + 1).padStart(3, '0')}`, birth, last: 'Ainda não atendido', status: 'Novo cadastro', color: 'bg-teal-100 text-teal-700', registrationDate: today, requesterName: fullName, requesterRelationship: 'Próprio Usuário', genderSpa: index % 2 ? 'Masculino' : 'Feminino', maritalStatus: index % 3 ? 'Solteiro(a)' : 'Casado(a)', stateSpa: 'MG', municipality: 'Juiz de Fora', region: 'Zona da Mata', residentialAddress: `Endereço fictício TESTE ${index + 1}`, contactOrigin: 'Cadastro fictício para teste', source: 'TESTE', smoking: index % 2 ? 'Não' : 'Não informado', serviceType: 'Teste', assignedProfessionalId: '', assignedProfessionalName: '', assignedProfessionalRole: '', appointmentDate: '', appointmentTime: '', legalReferrals: []
    }};
  });
  if (clients.length) {
    const { error } = await admin.from('clients').insert(clients);
    if (error) throw error;
  }
  const { data: stateRow, error: stateError } = await admin.from('user_state').select('data').eq('user_id', owner.user_id).maybeSingle();
  if (stateError) throw stateError;
  const state = stateRow?.data || { assessments: [], sessions: [], anamneses: {} };
  for (const row of clients) state.anamneses[String(row.data.id)] = { patientId: row.data.id, updatedAt: new Date().toISOString(), psychosocialAnswers: { q12: 'Entrevista inicial fictícia para teste.', q18: 'Relato fictício sem dados reais.', q72: 'Registro de teste; não representa avaliação clínica real.' }, complementaryAnswers: { c_q9: 'Motivo fictício para validação do fluxo.', c_q48: 'Objetivo fictício de teste.' } };
  const { error: upsertError } = await admin.from('user_state').upsert({ user_id: owner.user_id, data: state, updated_at: new Date().toISOString() });
  if (upsertError) throw upsertError;
  console.log(`${clients.length} acolhidos TESTE criados com anamnese fictícia.`);
})().catch((error) => { console.error(error.message); process.exit(1); });
