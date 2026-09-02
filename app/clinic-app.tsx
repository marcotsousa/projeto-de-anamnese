'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { mgMesoregionEntries } from './mg-mesoregions';
import {
  Activity,
  Ban,
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Download,
  Eye,
  EyeOff,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  NotebookPen,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCog,
  UserX,
  Users,
  X,
} from 'lucide-react';

type Patient = {
  id: number;
  name: string;
  initials: string;
  age: number;
  phone: string;
  email: string;
  document: string;
  birth: string;
  last: string;
  status: string;
  color: string;
  registrationDate?: string;
  requesterName?: string;
  requesterRelationship?: string;
  contactOrigin?: string;
  source?: string;
  smoking?: string;
  genderSpa?: string;
  maritalStatus?: string;
  municipality?: string;
  region?: string;
  serviceType?: string;
  residentialAddress?: string;
  requesterEmail?: string;
  stateSpa?: string;
  spaPhone?: string;
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  assignedProfessionalRole?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentId?: string;
};
type ProfessionalOption = {
  id: string;
  name: string;
  role: 'psicologo' | 'assistente_social';
  availabilityStart: string;
  availabilityEnd: string;
};
type AppointmentRecord = {
  id: string;
  clientReference: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  professionalRole: 'psicologo' | 'assistente_social';
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};
type Assessment = {
  id: number;
  patientId: number;
  type: string;
  date: string;
  score: string;
  level: string;
  note: string;
  tone: string;
  assistResults?: AssistResult[];
  injectionUse?: string;
};
type AssistResult = { substance: string; score: number; classification: string; recommendation: string };
type Session = {
  id: number;
  patientId: number;
  date: string;
  time: string;
  note: string;
  next: string;
  isoDate?: string;
};
type AnamnesisRecord = {
  patientId: number;
  gender?: string;
  maritalOccupation?: string;
  education?: string;
  birthplaceResidence?: string;
  guardian?: string;
  interviewDate?: string;
  referredBy?: string;
  searchMotivation?: string;
  emotionalHistory?: string;
  supportNetwork?: string;
  functionalImpact?: string;
  substanceUse?: string;
  complaint?: string;
  currentHistory?: string;
  healthHistory?: string;
  familyHistory?: string;
  developmentRoutine?: string;
  initialImpressions?: string;
  city?: string;
  signedAt?: string;
  professionalName?: string;
  crp?: string;
  psychosocialAnswers?: Record<string, string>;
  updatedAt: string;
};
type UserRole = 'administrador' | 'psicologo' | 'assistente_social' | 'administrativo';
const initialPatients: Patient[] = [
  {
    id: 1,
    name: 'Mariana Costa',
    initials: 'MC',
    age: 34,
    phone: '(11) 98765-4321',
    email: 'mariana.costa@email.com',
    document: '***.482.***-09',
    birth: '12/04/1992',
    last: 'Hoje, 09:30',
    status: 'Em acompanhamento',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    id: 2,
    name: 'Rafael Mendes',
    initials: 'RM',
    age: 28,
    phone: '(11) 99881-2045',
    email: 'rafael.m@email.com',
    document: '***.175.***-41',
    birth: '05/11/1997',
    last: '28 ago, 14:00',
    status: 'Em acompanhamento',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    id: 3,
    name: 'Beatriz Lima',
    initials: 'BL',
    age: 41,
    phone: '(11) 97754-8830',
    email: 'bia.lima@email.com',
    document: '***.940.***-22',
    birth: '22/01/1985',
    last: '25 ago, 10:30',
    status: 'Em acompanhamento',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    id: 4,
    name: 'Lucas Ferreira',
    initials: 'LF',
    age: 22,
    phone: '(11) 98812-0450',
    email: 'lucas.f@email.com',
    document: '***.306.***-18',
    birth: '18/08/2004',
    last: '20 ago, 16:00',
    status: 'Pausado',
    color: 'bg-emerald-100 text-emerald-700',
  },
];
const initialAssessments: Assessment[] = [
  {
    id: 3,
    patientId: 1,
    type: 'ASSIST',
    date: '29 jul 2026',
    score: 'Álcool: 8',
    level: 'Risco moderado',
    note: 'Realizada intervenção breve.',
    tone: 'amber',
  },
];
const initialSessions: Session[] = [
  {
    id: 1,
    patientId: 1,
    date: '31 de agosto de 2026',
    time: '09:30 – 10:20',
    note: 'Acolhido relata melhora gradual do sono após implementação da rotina combinada. Trabalhamos identificação de pensamentos automáticos relacionados ao ambiente profissional.',
    next: 'Manter diário de pensamentos e revisar estratégias de regulação emocional.',
  },
  {
    id: 2,
    patientId: 1,
    date: '24 de agosto de 2026',
    time: '09:30 – 10:20',
    note: 'Exploração dos fatores que mantêm a ansiedade antecipatória. Psicoeducação sobre ciclo de evitação e reforço negativo.',
    next: 'Iniciar exposição gradual conforme hierarquia construída em sessão.',
  },
];
const nav = [
  ['Visão geral', LayoutDashboard],
  ['Acolhidos', Users],
  ['Agenda', CalendarDays],
  ['Avaliações', ClipboardCheck],
  ['Relatórios', FileText],
] as const;

const normalizeMunicipality = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, '')
  .replace(/-/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('pt-BR');

const mgMesoregions = new Map(
  mgMesoregionEntries.map(([municipality, mesoregion]) => [normalizeMunicipality(municipality), mesoregion]),
);

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch {
      // Mantém os dados iniciais quando um backup local estiver corrompido.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}

export default function ClinicApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profileName, setProfileName] = useState('Profissional');
  const [active, setActive] = useState('Visão geral'),
    [selected, setSelected] = useState<Patient | null>(null),
    [tab, setTab] = useState('Resumo');
  const [patients, setPatients] = usePersistentState(
      'projeto-anamnese:patients',
      initialPatients,
    ),
    [assessments, setAssessments] = usePersistentState(
      'projeto-anamnese:assessments',
      initialAssessments,
    ),
    [sessions, setSessions] = usePersistentState(
      'projeto-anamnese:sessions',
      initialSessions,
    ),
    [anamneses, setAnamneses] = usePersistentState<
      Record<string, AnamnesisRecord>
    >('projeto-anamnese:anamneses', {});
  const [query, setQuery] = useState(''),
    [modal, setModal] = useState<'patient' | 'session' | 'assessment' | null>(
      null,
    ),
    [mobile, setMobile] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setUserId(user?.id ?? null);
      setAuthenticated(Boolean(user));
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthenticated(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase
      .from('profiles')
      .select('role, full_name')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setRole((data?.role as UserRole) ?? 'psicologo');
        setProfileName(data?.full_name || 'Profissional');
      });
  }, [userId]);

  useEffect(() => {
    if (!supabase || !userId || !role) return;
    setCloudReady(false);
    if (role === 'administrativo') {
      supabase
        .from('client_registry')
        .select('data')
        .then(({ data }) => {
          setPatients((data ?? []).map((row) => row.data as Patient));
          setAssessments([]);
          setSessions([]);
          setAnamneses({});
          setActive('Acolhidos');
          setCloudReady(true);
        });
      return;
    }
    supabase
      .from('user_state')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.data) {
          const state = data.data as {
            patients?: Patient[];
            assessments?: Assessment[];
            sessions?: Session[];
            anamneses?: Record<string, AnamnesisRecord>;
          };
          if (state.patients) setPatients(state.patients);
          if (state.assessments) setAssessments(state.assessments);
          if (state.sessions) setSessions(state.sessions);
          if (state.anamneses) setAnamneses(state.anamneses);
        } else if (!error) {
          setPatients([]);
          setAssessments([]);
          setSessions([]);
          setAnamneses({});
        }
        setCloudReady(true);
      });
  }, [userId, role]);

  useEffect(() => {
    if (!supabase || !userId || !cloudReady || role === 'administrativo') return;
    const cloud = supabase;
    const timer = window.setTimeout(() => {
      cloud.from('user_state').upsert({
        user_id: userId,
        data: { patients, assessments, sessions, anamneses },
        updated_at: new Date().toISOString(),
      });
      const registryRows = patients.map((patient) => ({
        professional_id: userId,
        patient_id: patient.id,
        data: patient,
        updated_at: new Date().toISOString(),
      }));
      if (registryRows.length) cloud.from('client_registry').upsert(registryRows);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [userId, role, cloudReady, patients, assessments, sessions, anamneses]);
  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const close = () => setModal(null);
  function exportBackup() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 2,
            exportedAt: new Date().toISOString(),
            patients,
            assessments,
            sessions,
            anamneses,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `projeto-anamnese-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (
          !Array.isArray(data.patients) ||
          !Array.isArray(data.assessments) ||
          !Array.isArray(data.sessions)
        )
          throw new Error();
        setPatients(data.patients);
        setAssessments(data.assessments);
        setSessions(data.sessions);
        setAnamneses(data.anamneses ?? {});
        setSelected(null);
        window.alert('Backup importado com sucesso.');
      } catch {
        window.alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
  async function addPatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      name = String(f.get('name'));
    const patientId = Date.now();
    const { data: sessionData } = await supabase!.auth.getSession();
    const appointmentResponse = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({
        clientReference: patientId,
        clientName: name,
        professionalId: String(f.get('assignedProfessionalId')),
        date: String(f.get('appointmentDate')),
        startTime: String(f.get('appointmentTime')),
      }),
    });
    const appointmentResult = await appointmentResponse.json();
    if (!appointmentResponse.ok) {
      window.alert(appointmentResult.error || 'Não foi possível salvar o agendamento.');
      return;
    }
    setPatients((v) => [
      {
        id: patientId,
        name,
        initials: name
          .split(' ')
          .map((x) => x[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        age: Number(f.get('age')),
        phone: String(f.get('phone')),
        email: String(f.get('email')),
        document: String(f.get('document')),
        birth: String(f.get('birth')),
        last: 'Ainda não atendido',
        status: String(f.get('status') ?? 'Novo cadastro'),
        color: 'bg-teal-100 text-teal-700',
        registrationDate: String(f.get('registrationDate')),
        requesterName: String(f.get('requesterName')),
        requesterRelationship: String(f.get('requesterRelationship')),
        contactOrigin: String(f.get('contactOrigin') ?? ''),
        source: String(f.get('source') ?? ''),
        smoking: String(f.get('smoking') ?? ''),
        genderSpa: String(f.get('genderSpa')),
        maritalStatus: String(f.get('maritalStatus')),
        municipality: String(f.get('municipality')),
        region: String(f.get('region') ?? ''),
        serviceType: String(f.get('serviceType') ?? ''),
        residentialAddress: String(f.get('residentialAddress')),
        requesterEmail: String(f.get('requesterEmail')),
        stateSpa: String(f.get('stateSpa')),
        spaPhone: String(f.get('spaPhone')),
        assignedProfessionalId: String(f.get('assignedProfessionalId')),
        assignedProfessionalName: String(f.get('assignedProfessionalName')),
        assignedProfessionalRole: String(f.get('assignedProfessionalRole')),
        appointmentDate: String(f.get('appointmentDate')),
        appointmentTime: String(f.get('appointmentTime')),
        appointmentId: appointmentResult.id,
      },
      ...v,
    ]);
    close();
  }
  async function login(email: string, password: string) {
    if (!supabase) return 'Configuração do Supabase ausente.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? 'E-mail ou senha incorretos.' : null;
  }
  async function logout() {
    await supabase?.auth.signOut();
    setSelected(null);
    setUserId(null);
    setAuthenticated(false);
  }
  function deletePatient(patient: Patient) {
    const confirmed = window.confirm(
      `Apagar permanentemente o registro de ${patient.name}?\n\nA anamnese, as sessões e as avaliações vinculadas também serão excluídas. Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;
    setPatients((current) => current.filter((item) => item.id !== patient.id));
    setSessions((current) =>
      current.filter((item) => item.patientId !== patient.id),
    );
    setAssessments((current) =>
      current.filter((item) => item.patientId !== patient.id),
    );
    setAnamneses((current) => {
      const next = { ...current };
      delete next[String(patient.id)];
      return next;
    });
    setSelected(null);
    setActive('Acolhidos');
  }
  function addSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    setSessions((v) => [
      {
        id: Date.now(),
        patientId: selected.id,
        date: new Date(String(f.get('date')) + 'T12:00').toLocaleDateString(
          'pt-BR',
          { day: 'numeric', month: 'long', year: 'numeric' },
        ),
        time: String(f.get('time')),
        isoDate: String(f.get('date')),
        note: String(f.get('note')),
        next: String(f.get('next')),
      },
      ...v,
    ]);
    close();
    setTab('Evolução');
  }
  function addAssessment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget),
      type = String(f.get('type')),
      score = Number(f.get('score'));
    const rawAssistResults = String(f.get('assistResults') ?? '');
    const assistResults: AssistResult[] = rawAssistResults ? JSON.parse(rawAssistResults) : [];
    let level = 'Baixo / mínimo',
      tone = 'emerald';
    if (assistResults.length) {
      const highest = Math.max(...assistResults.map((result) => result.score));
      level = highest >= 16 ? 'Sugestivo de dependência' : highest >= 4 ? 'Sugestivo de abuso' : 'Uso ocasional';
      tone = highest >= 16 ? 'rose' : highest >= 4 ? 'amber' : 'emerald';
    } else {
      if (score >= 10) { level = 'Moderado'; tone = 'amber'; }
      if (score >= 20) { level = 'Alto / grave'; tone = 'rose'; }
    }
    setAssessments((v) => [
      {
        id: Date.now(),
        patientId: selected.id,
        type,
        date: new Date().toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        score: assistResults.length ? assistResults.map((result) => `${result.substance}: ${result.score}`).join(' · ') : String(score),
        level,
        note: String(f.get('note')),
        tone,
        assistResults,
        injectionUse: String(f.get('injectionUse') ?? ''),
      },
      ...v,
    ]);
    close();
    setTab('Avaliações');
  }
  const visibleNav =
    role === 'administrativo'
      ? ([['Acolhidos', Users]] as const)
      : role === 'administrador'
        ? ([...nav, ['Usuários', UserCog]] as const)
        : nav;
  if (!authReady)
    return (
      <div className="grid min-h-screen place-items-center bg-[#eef5f2] text-sm text-teal-800">
        Carregando acesso seguro…
      </div>
    );
  if (!authenticated) return <LoginScreen onLogin={login} />;
  if (!role)
    return (
      <div className="grid min-h-screen place-items-center bg-[#eef5f2] text-sm text-teal-800">
        Carregando permissões…
      </div>
    );
  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      <aside
        className={`${mobile ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 z-40 flex w-64 flex-col bg-[#123f42] text-white transition md:translate-x-0`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9f0e8] text-[#19595a]">
            <NotebookPen size={23} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">
              Projeto de Anamnese
            </div>
            <div className="text-[11px] text-teal-100/70">Nuvem segura</div>
          </div>
          <button
            className="ml-auto md:hidden"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-teal-100/45">
            Consultório
          </p>
          {visibleNav.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                if (label === 'Acolhidos') setSelected(null);
                setMobile(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active === label ? 'bg-white/12 text-white' : 'text-teal-50/70 hover:bg-white/7'}`}
            >
              <Icon size={18} />
              {label}
              {label === 'Acolhidos' && (
                <span className="ml-auto rounded-full bg-white/10 px-2 text-xs">
                  {patients.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-black/10 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e1b893] text-sm font-bold text-[#6b4126]">
              MT
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{profileName}</p>
              <p className="truncate text-xs text-teal-100/55">
                {role === 'administrador'
                  ? 'Administrador'
                  : role === 'psicologo'
                    ? 'Psicólogo'
                    : role === 'assistente_social'
                      ? 'Assistente Social'
                      : 'Administrativo'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="md:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-8">
          <button className="md:hidden" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div className="relative max-w-md flex-1">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
              placeholder="Buscar Acolhidos, avaliações..."
            />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              ● Salvo neste computador
            </span>
            <button
              onClick={exportBackup}
              title="Exportar backup"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-teal-700"
            >
              <Download size={17} />
            </button>
            <button
              onClick={() => importRef.current?.click()}
              title="Importar backup"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-teal-700"
            >
              <Upload size={17} />
            </button>
            <input
              ref={importRef}
              onChange={importBackup}
              type="file"
              accept="application/json"
              className="hidden"
            />
          </div>
          <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          {role !== 'administrativo' && (
            <button
              onClick={() => setModal('patient')}
              className="hidden items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
            >
              <Plus size={17} />
              Novo Acolhido
            </button>
          )}
        </header>
        <div className="p-5 md:p-8">
          {selected && role === 'administrativo' ? (
            <ClientRegistryView p={selected} back={() => setSelected(null)} />
          ) : selected ? (
            <PatientView
              p={selected}
              tab={tab}
              setTab={setTab}
              assessments={assessments.filter(
                (a) => a.patientId === selected.id && a.type === 'ASSIST',
              )}
              sessions={sessions.filter((s) => s.patientId === selected.id)}
              anamnesis={anamneses[String(selected.id)]}
              saveAnamnesis={(record) =>
                setAnamneses((current) => ({
                  ...current,
                  [String(selected.id)]: record,
                }))
              }
              onDelete={() => deletePatient(selected)}
              back={() => setSelected(null)}
              open={setModal}
            />
          ) : active === 'Usuários' && role === 'administrador' ? (
            <UserManagement />
          ) : active === 'Acolhidos' ? (
            <Patients
              patients={filtered}
              query={query}
              setQuery={setQuery}
              select={setSelected}
              open={() => role !== 'administrativo' && setModal('patient')}
              canCreate={role !== 'administrativo'}
            />
          ) : active === 'Agenda' ? (
            <Schedule patients={patients} select={setSelected} />
          ) : (
            <Dashboard
              patients={patients}
              sessions={sessions}
              assessments={assessments.filter((assessment) => assessment.type === 'ASSIST')}
              profileName={profileName}
              select={(p) => {
                setActive('Acolhidos');
                setSelected(p);
              }}
              open={() => setModal('patient')}
              openAgenda={() => setActive('Agenda')}
            />
          )}
        </div>
      </main>
      {modal && role !== 'administrativo' && (
        <Modal
          title={
            modal === 'patient'
              ? 'Cadastrar Acolhido'
              : modal === 'session'
                ? 'Nova atualização'
                : 'Aplicar instrumento'
          }
          close={close}
          wide={modal === 'patient' || modal === 'assessment'}
        >
          {modal === 'patient' ? (
            <PatientForm submit={addPatient} />
          ) : modal === 'session' ? (
            <SessionForm submit={addSession} />
          ) : (
            <AssessmentForm submit={addAssessment} />
          )}
        </Modal>
      )}
    </div>
  );
}

function Dashboard({
  patients,
  sessions,
  assessments,
  profileName,
  select,
  open,
  openAgenda,
}: {
  patients: Patient[];
  sessions: Session[];
  assessments: Assessment[];
  profileName: string;
  select: (p: Patient) => void;
  open: () => void;
  openAgenda: () => void;
}) {
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const monthPrefix = todayIso.slice(0, 7);
  const activePatients = patients.filter((patient) => patient.status !== 'Encerrado').length;
  const scheduledToday = patients.filter((patient) => patient.appointmentDate === todayIso);
  const sessionsToday = sessions.filter((session) => session.isoDate === todayIso).length + scheduledToday.length;
  const sessionsThisMonth = sessions.filter((session) => session.isoDate?.startsWith(monthPrefix)).length;
  const pendingAssessments = assessments.filter((assessment) => assessment.level.toLowerCase().includes('pendente')).length;
  const todayAppointments = sessions
    .filter((session) => session.isoDate === todayIso)
    .flatMap((session) => {
      const patient = patients.find((item) => item.id === session.patientId);
      return patient ? [{ session, patient }] : [];
    });
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-[#287472]">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Seja Bem-Vindo, {profileName}.
          </h1>
        </div>
        <button
          onClick={open}
          className="flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white sm:hidden"
        >
          <Plus size={17} />
          Novo Acolhido
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Users}
          label="Acolhidos ativos"
          value={String(activePatients)}
          detail={`${patients.length} cadastrado(s)`}
          color="teal"
        />
        <Metric
          icon={CalendarDays}
          label="Sessões hoje"
          value={String(sessionsToday)}
          detail={sessionsToday ? 'Conforme registros de hoje' : 'Nenhuma sessão registrada'}
          color="blue"
        />
        <Metric
          icon={ClipboardCheck}
          label="Avaliações pendentes"
          value={String(pendingAssessments)}
          detail={`${assessments.length} avaliação(ões) registrada(s)`}
          color="amber"
        />
        <Metric
          icon={Activity}
          label="Sessões no mês"
          value={String(sessionsThisMonth)}
          detail="Calculado pelos registros do mês"
          color="violet"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Agenda de hoje</h2>
              <p>{todayAppointments.length + scheduledToday.length} atendimento(s) agendado(s)/registrado(s)</p>
            </div>
            <button onClick={openAgenda} className="text-sm font-semibold text-[#176a68]">
              Ver agenda
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {scheduledToday.map((patient) => (
              <Appointment
                key={`scheduled-${patient.id}`}
                time={patient.appointmentTime || ''}
                p={patient}
                tag="Agendado"
                select={select}
              />
            ))}
            {todayAppointments.map(({ patient, session }) => (
              <Appointment
                key={session.id}
                time={session.time}
                p={patient}
                tag="Registrado"
                select={select}
              />
            ))}
            {todayAppointments.length === 0 && scheduledToday.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-400">
                Nenhuma sessão registrada para hoje.
              </p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Atenção clínica</h2>
              <p>Itens para acompanhar</p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <Alert
              icon={HeartPulse}
              title="Risco moderado no ASSIST"
              text="Mariana Costa · álcool"
              tone="rose"
            />
            <Alert
              icon={FileText}
              title="Anamnese incompleta"
              text="Lucas Ferreira · novo Acolhido"
              tone="blue"
            />
          </div>
        </section>
      </div>
      <section className="panel mt-6">
        <div className="panel-head">
          <div>
            <h2>Acolhidos recentes</h2>
            <p>Acesso rápido aos últimos prontuários</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Acolhido</th>
                <th className="px-6 py-3">Último atendimento</th>
                <th className="px-6 py-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => select(p)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <PatientName p={p} />
                  </td>
                  <td className="px-6 py-4 text-slate-500">{p.last}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function Schedule({ patients, select }: { patients: Patient[]; select: (patient: Patient) => void }) {
  const [scheduled, setScheduled] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase?.auth.getSession().then(async ({ data }) => {
      const response = await fetch('/api/appointments', { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
      if (response.ok && active) setScheduled(await response.json());
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <p className="mt-1 text-sm text-slate-500">Atendimentos agendados no cadastro dos Acolhidos.</p>
      </div>
      <section className="panel overflow-hidden">
        {loading ? <p className="p-10 text-center text-sm text-slate-400">Carregando agenda…</p> : scheduled.length ? (
          <div className="divide-y divide-slate-100">
            {scheduled.map((appointment) => {
              const localPatient = patients.find((patient) => String(patient.id) === appointment.clientReference);
              return (
              <button key={appointment.id} onClick={() => localPatient && select(localPatient)} disabled={!localPatient} className="grid w-full gap-3 p-5 text-left hover:bg-slate-50 disabled:cursor-default sm:grid-cols-[140px_1fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-bold text-teal-700">{new Date(`${appointment.date}T12:00:00`).toLocaleDateString('pt-BR')}</p>
                  <p className="text-sm text-slate-500">{appointment.startTime}–{appointment.endTime}</p>
                </div>
                <div><p className="font-semibold">{appointment.clientName}</p><p className="text-xs text-slate-500">Acolhido</p></div>
                <div><p className="font-medium">{appointment.professionalName}</p><p className="text-xs text-slate-500">{appointment.professionalRole === 'psicologo' ? 'Psicólogo' : 'Assistente Social'}</p></div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-center text-xs font-semibold capitalize text-teal-700">{appointment.status}</span>
              </button>
              );
            })}
          </div>
        ) : <p className="p-10 text-center text-sm text-slate-400">Nenhum atendimento agendado.</p>}
      </section>
    </div>
  );
}
function Patients({
  patients,
  query,
  setQuery,
  select,
  open,
  canCreate,
}: {
  patients: Patient[];
  query: string;
  setQuery: (s: string) => void;
  select: (p: Patient) => void;
  open: () => void;
  canCreate: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Acolhidos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastros e prontuários sob sua responsabilidade.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={open}
            className="flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            Novo Acolhido
          </button>
        )}
      </div>
      <section className="panel">
        <div className="p-5">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
              placeholder="Buscar por nome..."
            />
          </div>
        </div>
        <div className="grid gap-3 border-t border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => select(p)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left hover:border-teal-300"
            >
              <PatientName p={p} />
              <ChevronRight className="ml-auto text-slate-300" size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
function ClientRegistryView({ p, back }: { p: Patient; back: () => void }) {
  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={back} className="mb-4 text-sm font-medium text-slate-500">
        ← Voltar para clientes
      </button>
      <section className="panel p-6">
        <div className="mb-6 flex items-center gap-4">
          <PatientName p={p} />
          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Somente consulta
          </span>
        </div>
        <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">
          {[
            ['Data', p.registrationDate],
            ['Nome do solicitante', p.requesterName],
            ['Vínculo do solicitante', p.requesterRelationship],
            ['Telefone do solicitante', p.phone],
            ['E-mail do solicitante', p.requesterEmail],
            ['Nome do usuário (SPA)', p.name],
            ['E-mail (SPA)', p.email],
            ['Telefone (SPA)', p.spaPhone],
            ['Data de nascimento', p.birth],
            ['Idade', p.age ? `${p.age} anos` : ''],
            ['Documento', p.document],
            ['Sexo SPA', p.genderSpa],
            ['Estado civil', p.maritalStatus],
            ['Estado (UF)', p.stateSpa],
            ['Município', p.municipality],
            ['Macrorregião', p.region],
            ['Endereço residencial', p.residentialAddress],
            ['Origem do contato', p.contactOrigin],
            ['Fonte', p.source],
            ['Status do atendimento', p.status],
            ['Tipo de atendimento', p.serviceType],
            ['Último atendimento', p.last],
            ['Profissional responsável', p.assignedProfessionalName],
            ['Data do atendimento', p.appointmentDate ? new Date(`${p.appointmentDate}T12:00:00`).toLocaleDateString('pt-BR') : ''],
            ['Horário do atendimento', p.appointmentTime],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-sm text-slate-700">{value || 'Não informado'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UserManagement() {
  type ManagedUser = {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    jobTitle: string;
    council: string;
    availabilityStart: string;
    availabilityEnd: string;
    businessAddress: string;
    municipality: string;
    whatsapp: string;
    blocked: boolean;
  };
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);
  const [newUserRole, setNewUserRole] = useState<UserRole>('psicologo');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState('');
  async function request(path: string, options?: RequestInit) {
    const { data } = await supabase!.auth.getSession();
    return fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session?.access_token}`,
        ...options?.headers,
      },
    });
  }
  async function load() {
    setLoading(true);
    const response = await request('/api/admin/users');
    if (response.ok) setUsers(await response.json());
    else setMessage('Não foi possível carregar os usuários.');
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setMessage('Criando usuário…');
    const response = await request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || 'Falha ao criar usuário.');
    form.reset();
    setNewUserRole('psicologo');
    setMessage('Usuário criado com sucesso.');
    await load();
  }
  async function assignRole(userId: string, role: UserRole) {
    setSavingUserId(userId);
    setMessage('Atualizando função…');
    const response = await request('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId, role }),
    });
    const result = await response.json();
    if (!response.ok) {
      setSavingUserId('');
      return setMessage(result.error || 'Falha ao atualizar a função.');
    }
    setUsers((current) => current.map((user) => user.id === userId ? { ...user, role } : user));
    setSavingUserId('');
    setMessage('Função atualizada com sucesso.');
  }
  async function toggleBlock(user: { id: string; fullName: string; email: string; blocked: boolean }) {
    const actionLabel = user.blocked ? 'reativar' : 'suspender';
    if (!window.confirm(`Deseja ${actionLabel} a atividade de ${user.fullName || user.email}?`)) return;
    setSavingUserId(user.id);
    setMessage(`${user.blocked ? 'Reativando' : 'Suspendendo'} atividade…`);
    const response = await request('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId: user.id, action: user.blocked ? 'unblock' : 'block' }),
    });
    const result = await response.json();
    if (!response.ok) {
      setSavingUserId('');
      return setMessage(result.error || 'Não foi possível alterar o acesso.');
    }
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, blocked: !item.blocked } : item));
    setSavingUserId('');
    setMessage(`Atividade ${user.blocked ? 'reativada' : 'suspensa'} com sucesso.`);
  }
  async function deleteUser(user: { id: string; fullName: string; email: string }) {
    if (!window.confirm(`Excluir permanentemente a conta de ${user.fullName || user.email}?\n\nEsta ação não pode ser desfeita.`)) return;
    setSavingUserId(user.id);
    setMessage('Excluindo usuário…');
    const response = await request('/api/admin/users', {
      method: 'DELETE',
      body: JSON.stringify({ userId: user.id }),
    });
    const result = await response.json();
    if (!response.ok) {
      setSavingUserId('');
      return setMessage(result.error || 'Não foi possível excluir o usuário.');
    }
    setUsers((current) => current.filter((item) => item.id !== user.id));
    setSavingUserId('');
    setMessage('Usuário excluído com sucesso.');
  }
  const roleLabel = { administrador: 'Administrador', psicologo: 'Psicólogo', assistente_social: 'Assistente Social', administrativo: 'Administrativo' };
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Usuários e perfis</h1>
        <p className="mt-1 text-sm text-slate-500">Cadastre profissionais, verifique e atribua seus níveis de acesso.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={create} autoComplete="off" className="panel space-y-4 p-6">
          <h2 className="text-lg font-bold">Novo usuário</h2>
          <Field label="Nome completo" name="fullName" />
          <Field label="Cargo" name="jobTitle" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Conselho Regional
              <select required name="councilType" className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal" defaultValue="">
                <option value="">Selecione</option>
                <option value="CRP">CRP — Psicologia</option>
                <option value="CRESS">CRESS — Serviço Social</option>
              </select>
            </label>
            <Field label="Número do Conselho" name="council" placeholder="Digite o número e a região" />
          </div>
          {['psicologo', 'assistente_social'].includes(newUserRole) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Horário inicial" name="availabilityStart" type="time" />
              <Field label="Horário final" name="availabilityEnd" type="time" />
            </div>
          )}
          <Field label="Endereço comercial" name="businessAddress" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Município" name="municipality" />
            <Field label="WhatsApp" name="whatsapp" type="tel" />
          </div>
          <Field label="E-mail" name="email" type="email" />
          <Field label="Senha provisória" name="password" type="password" />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Perfil
            <select name="role" value={newUserRole} onChange={(event) => setNewUserRole(event.target.value as UserRole)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal">
              <option value="administrador">Administrador — acesso total</option>
              <option value="psicologo">Psicólogo — prontuários e instrumentos</option>
              <option value="assistente_social">Assistente Social — prontuários e instrumentos</option>
              <option value="administrativo">Administrativo — consulta de clientes</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Situação da atividade
            <select name="activityStatus" className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal" defaultValue="active">
              <option value="active">Ativo — acesso liberado</option>
              <option value="suspended">Suspenso — acesso bloqueado</option>
            </select>
          </label>
          <button className="h-11 w-full rounded-xl bg-[#176a68] font-semibold text-white">Criar usuário</button>
          {message && <p className="text-sm text-slate-500">{message}</p>}
        </form>
        <section className="panel overflow-hidden">
          <div className="panel-head"><div><h2>Usuários cadastrados</h2><p>{users.length} conta(s)</p></div></div>
          {loading ? <p className="p-6 text-sm text-slate-400">Carregando…</p> : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-50 font-bold text-teal-700">{(user.fullName || user.email)[0].toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{user.fullName || 'Sem nome'}</p>
                    <p className="truncate text-xs text-slate-500">{user.jobTitle || roleLabel[user.role]} · {user.council || 'Número do conselho não informado'}</p>
                    <p className="truncate text-xs text-slate-400">{user.email} · {user.whatsapp || 'Sem WhatsApp'}</p>
                  </div>
                  <label className="grid min-w-48 gap-1 text-xs font-semibold text-slate-500">
                    Função de acesso
                    <select
                      value={user.role}
                      disabled={savingUserId === user.id}
                      onChange={(event) => assignRole(user.id, event.target.value as UserRole)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                      aria-label={`Função de ${user.fullName || user.email}`}
                    >
                      <option value="administrador">Administrador</option>
                      <option value="psicologo">Psicólogo</option>
                      <option value="assistente_social">Assistente Social</option>
                      <option value="administrativo">Administrativo</option>
                    </select>
                  </label>
                  <div className="flex gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => setViewingUser(user)}
                      className="flex h-9 items-center justify-center gap-2 rounded-lg border border-sky-200 px-3 text-xs font-semibold text-sky-700"
                    >
                      <Eye size={15} /> Visualizar perfil
                    </button>
                    <button
                      type="button"
                      disabled={savingUserId === user.id}
                      onClick={() => toggleBlock(user)}
                      className={`flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50 ${user.blocked ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}`}
                    >
                      <Ban size={15} /> {user.blocked ? 'Reativar atividade' : 'Suspender atividade'}
                    </button>
                    <button
                      type="button"
                      disabled={savingUserId === user.id}
                      onClick={() => deleteUser(user)}
                      className="flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50"
                    >
                      <UserX size={15} /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {viewingUser && (
        <Modal
          title="Perfil do usuário"
          subtitle="Dados cadastrais e nível de acesso"
          close={() => setViewingUser(null)}
        >
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {[
              ['Nome completo', viewingUser.fullName],
              ['E-mail', viewingUser.email],
              ['Perfil de acesso', roleLabel[viewingUser.role]],
              ['Situação da atividade', viewingUser.blocked ? 'Suspensa' : 'Ativa'],
              ['Cargo', viewingUser.jobTitle],
              ['Conselho Regional', viewingUser.council],
              ['Disponibilidade', viewingUser.availabilityStart && viewingUser.availabilityEnd ? `${viewingUser.availabilityStart} às ${viewingUser.availabilityEnd}` : ''],
              ['WhatsApp', viewingUser.whatsapp],
              ['Município', viewingUser.municipality],
              ['Endereço comercial', viewingUser.businessAddress],
            ].map(([label, value]) => (
              <div key={label} className={label === 'Endereço comercial' ? 'sm:col-span-2' : ''}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-700">{value || 'Não informado'}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
function PatientView({
  p,
  tab,
  setTab,
  assessments,
  sessions,
  anamnesis,
  saveAnamnesis,
  onDelete,
  back,
  open,
}: {
  p: Patient;
  tab: string;
  setTab: (s: string) => void;
  assessments: Assessment[];
  sessions: Session[];
  anamnesis?: AnamnesisRecord;
  saveAnamnesis: (record: AnamnesisRecord) => void;
  onDelete: () => void;
  back: () => void;
  open: (m: 'session' | 'assessment') => void;
}) {
  const tabs = ['Resumo', 'Anamnese', 'Evolução', 'Avaliações'];
  return (
    <div className="mx-auto max-w-7xl">
      <button
        onClick={back}
        className="mb-4 text-sm font-medium text-slate-500"
      >
        ← Voltar para Acolhidos
      </button>
      <section className="panel overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#164f52] to-[#2c7c78]" />
        <div className="px-6">
          <div className="-mt-8 flex flex-wrap items-end gap-4">
            <div
              className={`grid h-20 w-20 place-items-center rounded-2xl border-4 border-white text-xl font-bold ${p.color}`}
            >
              {p.initials}
            </div>
            <div className="mb-1 flex-1">
              <h1 className="text-2xl font-bold">{p.name}</h1>
              <p className="text-sm text-slate-500">
                {p.age} anos · {p.birth} · {p.document}
              </p>
            </div>
            <div className="mb-1 flex flex-wrap gap-2">
              <button
                onClick={onDelete}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                <Trash2 size={17} />
                Apagar cliente
              </button>
              <button
                onClick={() => open('session')}
                className="flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={17} />
                Nova atualização
              </button>
            </div>
          </div>
          <div className="mt-6 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === t ? 'border-[#176a68] text-[#176a68]' : 'border-transparent text-slate-500'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>
      {tab === 'Resumo' && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
          <section className="panel p-6">
            <h2 className="mb-5 text-lg font-bold">Identificação do cliente</h2>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Data', p.registrationDate],
                ['Solicitante', p.requesterName],
                ['Vínculo', p.requesterRelationship],
                ['Telefone do solicitante', p.phone],
                ['E-mail do solicitante', p.requesterEmail],
                ['E-mail (SPA)', p.email],
                ['Telefone (SPA)', p.spaPhone],
                ['Documento', p.document],
                ['Data de nascimento', p.birth],
                ['Idade', p.age ? `${p.age} anos` : ''],
                ['Sexo SPA', p.genderSpa],
                ['Estado civil', p.maritalStatus],
                ['Estado (UF)', p.stateSpa],
                ['Município', p.municipality],
                ['Profissional responsável', p.assignedProfessionalName],
                ['Atendimento agendado', p.appointmentDate && p.appointmentTime ? `${new Date(`${p.appointmentDate}T12:00:00`).toLocaleDateString('pt-BR')} às ${p.appointmentTime}` : ''],
                ['Macrorregião', p.region],
                ['Endereço residencial', p.residentialAddress],
                ['Origem do contato', p.contactOrigin],
                ['Fonte', p.source],
                ['Status', p.status],
                ['Tipo de atendimento', p.serviceType],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-sm text-slate-700">{value || 'Não informado'}</p>
                </div>
              ))}
            </div>
            <h2 className="mb-5 border-t pt-6 text-lg font-bold">Resumo clínico</h2>
            <Info
              title="Queixa inicial"
              text="Ansiedade persistente, dificuldade para dormir e sensação de sobrecarga associada ao contexto profissional."
            />
            <Info
              title="Contexto"
              text="Início dos sintomas há aproximadamente oito meses, com intensificação após mudança de cargo. Rede de apoio preservada."
            />
            <Info
              title="Plano terapêutico"
              text="TCC com foco em regulação emocional, reestruturação cognitiva, higiene do sono e exposição gradual."
            />
          </section>
          <section className="panel p-6">
            <h2 className="mb-5 text-lg font-bold">Contato</h2>
            <p className="text-sm text-slate-400">Telefone (SPA)</p>
            <p className="font-medium">{p.spaPhone || 'Não informado'}</p>
            <p className="mt-4 text-sm text-slate-400">E-mail</p>
            <p className="font-medium">{p.email}</p>
            <div className="mt-6 rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
              <ShieldCheck className="mb-2" size={20} />
              <strong>Prontuário protegido</strong>
              <p className="mt-1 text-xs">Visível somente para você.</p>
            </div>
          </section>
        </div>
      )}
      {tab === 'Anamnese' && (
        <PsychosocialAnamnesisForm patient={p} value={anamnesis} onSave={saveAnamnesis} />
      )}
      {tab === 'Evolução' && (
        <section className="panel mt-6">
          <div className="panel-head">
            <div>
              <h2>Histórico de atualizações</h2>
              <p>{sessions.length} registros clínicos</p>
            </div>
            <button
              onClick={() => open('session')}
              className="rounded-xl bg-[#176a68] px-4 py-2 text-sm font-semibold text-white"
            >
              + Atualização
            </button>
          </div>
          <div className="p-6">
            {sessions.map((s, i) => (
              <div
                key={s.id}
                className="relative border-l-2 border-teal-100 pb-8 pl-7 last:pb-0"
              >
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-teal-50" />
                <h3 className="font-bold">{s.date}</h3>
                <p className="text-xs text-slate-400">
                  {s.time} · Sessão {sessions.length - i}
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                  <strong>Relato e evolução</strong>
                  <p>{s.note}</p>
                  <hr className="my-3" />
                  <strong>Próximos passos</strong>
                  <p>{s.next}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === 'Avaliações' && (
        <section className="panel mt-6">
          <div className="panel-head">
            <div>
              <h2>Instrumento ASSIST</h2>
              <p>Histórico de avaliações e rastreios</p>
            </div>
            <button
              onClick={() => open('assessment')}
              className="rounded-xl bg-[#176a68] px-4 py-2 text-sm font-semibold text-white"
            >
              + Aplicar instrumento
            </button>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {assessments.map((a) => (
              <div key={a.id} className="rounded-2xl border p-5">
                <div className="flex justify-between">
                  <ClipboardCheck className="text-teal-700" />
                  <span className="text-xs text-slate-400">{a.date}</span>
                </div>
                <h3 className="mt-4 font-bold">{a.type}</h3>
                {a.assistResults?.length ? <div className="mt-3 space-y-2">{a.assistResults.filter((result) => result.score > 0).map((result) => <div key={result.substance} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm">{result.substance}</b><span className="text-xs font-bold">{result.score}/20</span></div><p className="mt-1 text-xs font-semibold text-teal-700">{result.classification}</p><p className="mt-1 text-xs text-slate-500">{result.recommendation}</p></div>)}</div> : <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3"><b>{a.score}</b><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{a.level}</span></div>}
                {a.injectionUse && <p className="mt-3 rounded-lg border border-slate-100 p-2 text-xs text-slate-500"><b>Uso injetável:</b> {a.injectionUse}</p>}
                <p className="mt-3 text-sm text-slate-500">{a.note}</p>
              </div>
            ))}
            {assessments.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-400">Nenhum ASSIST aplicado.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
function LoginScreen({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<string | null>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationRole, setRegistrationRole] = useState<'psicologo' | 'assistente_social' | 'administrativo'>('psicologo');
  const [selectedState, setSelectedState] = useState('');
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  useEffect(() => {
    if (!selectedState) {
      setMunicipalities([]);
      return;
    }
    let active = true;
    setLoadingMunicipalities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`)
      .then((response) => response.json())
      .then((items: Array<{ nome: string }>) => {
        if (active) setMunicipalities(items.map((item) => item.nome));
      })
      .catch(() => {
        if (active) setMunicipalities([]);
      })
      .finally(() => {
        if (active) setLoadingMunicipalities(false);
      });
    return () => { active = false; };
  }, [selectedState]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim().toLowerCase();
    const password = String(data.get('password'));
    setLoading(true);
    setError('');
    const message = await onLogin(email, password);
    if (message) setError(message);
    setLoading(false);
  }
  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setLoading(true);
    setError('');
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'Não foi possível criar a conta.');
      setLoading(false);
      return;
    }
    setRegistering(false);
    setRegistrationRole('psicologo');
    setSelectedState('');
    form.reset();
    setError('Conta criada com sucesso. Use seu e-mail e senha para entrar.');
    setLoading(false);
  }
  return (
    <main className="grid min-h-screen bg-[#eef5f2] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#123f42] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[60px] border-white/5" />
        <div className="absolute -bottom-32 left-20 h-96 w-96 rounded-full bg-teal-300/5" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d9f0e8] text-[#19595a]">
            <NotebookPen size={25} />
          </div>
          <div>
            <p className="font-bold">Projeto de Anamnese</p>
            <p className="text-xs text-teal-100/60">Gestão clínica segura</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
            <ShieldCheck size={27} />
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Registro de Entrevista/Anamnese Psicológica Online
          </h1>
        </div>
        <p className="relative text-xs text-teal-100/45">
          Acesso protegido · Dados sincronizados com segurança
        </p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#176a68] text-white">
              <NotebookPen size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Projeto de Anamnese</p>
              <p className="text-xs text-slate-500">Gestão clínica segura</p>
            </div>
          </div>
          <div className="mb-7">
            <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <LockKeyhole size={21} />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {registering ? 'Crie sua conta' : 'Acesse sua conta'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {registering ? 'Informe seus dados profissionais para começar.' : 'Entre com suas credenciais para acessar os prontuários.'}
            </p>
          </div>
          {registering ? <form onSubmit={register} autoComplete="off" className="registration-form space-y-4">
            <div className="pointer-events-none absolute -left-[9999px] opacity-0" aria-hidden="true">
              <input name="registration-email-trap" type="email" autoComplete="username" tabIndex={-1} />
              <input name="registration-password-trap" type="password" autoComplete="current-password" tabIndex={-1} />
            </div>
            <Field label="Nome completo" name="fullName" autoComplete="new-password" />
            <label className="grid gap-1.5 text-sm font-semibold">
              Tipo de perfil
              <select required name="role" value={registrationRole} onChange={(event) => setRegistrationRole(event.target.value as 'psicologo' | 'assistente_social' | 'administrativo')} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
                <option value="psicologo">Psicólogo</option>
                <option value="assistente_social">Assistente Social</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </label>
            {registrationRole !== 'administrativo' && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Conselho Regional
                    <select required name="councilType" defaultValue="" className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
                      <option value="">Selecione</option>
                      <option value="CRP">CRP — Psicologia</option>
                      <option value="CRESS">CRESS — Serviço Social</option>
                    </select>
                  </label>
                  <Field label="Número do Conselho" name="council" placeholder="Número e região" autoComplete="new-password" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Horário inicial" name="availabilityStart" type="time" />
                  <Field label="Horário final" name="availabilityEnd" type="time" />
                </div>
              </div>
            )}
            <Field label="Endereço comercial" name="businessAddress" autoComplete="new-password" />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">
                Estado (UF)
                <select required name="state" value={selectedState} onChange={(event) => setSelectedState(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
                  <option value="">Selecione</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Município
                <select key={selectedState} required name="municipality" disabled={!selectedState || loadingMunicipalities} defaultValue="" className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500 disabled:bg-white disabled:text-slate-500">
                  <option value="">{loadingMunicipalities ? 'Carregando…' : selectedState ? 'Selecione o município' : 'Selecione o estado primeiro'}</option>
                  {municipalities.map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}
                </select>
              </label>
            </div>
            <Field label="WhatsApp" name="whatsapp" type="tel" autoComplete="new-password" />
            <Field label="E-mail profissional" name="email" type="email" autoComplete="new-password" />
            <Field label="Senha (mínimo de 8 caracteres)" name="password" type="password" autoComplete="new-password" />
            {error && <p role="alert" className={`rounded-xl border px-4 py-3 text-sm ${error.startsWith('Conta criada') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</p>}
            <button disabled={loading} className="h-12 w-full rounded-xl bg-[#176a68] font-semibold text-white disabled:opacity-60">
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
            <button type="button" onClick={() => { setRegistering(false); setError(''); }} className="w-full text-sm font-semibold text-teal-700 hover:underline">
              Já tenho uma conta
            </button>
          </form> : <form onSubmit={submit} className="space-y-5">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              E-mail profissional
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="seu@email.com"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Senha
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 accent-teal-700"
                />
                Manter conectado
              </label>
              <span className="text-slate-400">Acesso protegido</span>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
            <button disabled={loading} className="h-12 w-full rounded-xl bg-[#176a68] font-semibold text-white shadow-sm transition hover:bg-[#125856] disabled:opacity-60">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <p className="text-center text-sm text-slate-600">
              Ainda não possui acesso?{' '}
              <button type="button" onClick={() => { setRegistering(true); setRegistrationRole('psicologo'); setSelectedState(''); setError(''); }} className="font-semibold text-teal-700 hover:underline">
                Criar minha conta
              </button>
            </p>
          </form>}
          <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
            Sessão autenticada pelo Supabase. Os dados clínicos são isolados por
            profissional com políticas de acesso no banco.
          </p>
        </div>
      </section>
    </main>
  );
}

type PsychQuestion = {
  id: number;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'select' | 'multi' | 'matrix';
  options?: string[];
  rows?: string[];
  columns?: string[];
};

const psychosocialSections: Array<{ title: string; description: string; questions: PsychQuestion[] }> = [
  {
    title: 'Identificação', description: 'Dados pessoais, documentação, referência e demanda inicial.', questions: [
      { id: 6, label: 'Situação de documentação básica', type: 'multi', options: ['RG', 'CPF', 'CTPS', 'Certidão de nascimento', 'Certificado de reservista'] },
      { id: 7, label: 'Pessoa de referência (nome e relação com o entrevistado)' },
      { id: 8, label: 'Cor autodeclarada', type: 'select', options: ['Branco(a)', 'Preto(a)', 'Pardo(a)', 'Amarelo(a)', 'Indígena', 'Não informado'] },
      { id: 9, label: 'Município de nascimento' },
      { id: 12, label: 'Queixas', type: 'textarea' },
    ],
  },
  {
    title: 'Uso de substâncias psicoativas', description: 'Padrão de uso, impactos, gastos e motivação para interrupção.', questions: [
      { id: 13, label: 'Substância psicoativa mais utilizada', type: 'select', options: ['Álcool', 'Anfetamina', 'Cocaína', 'Êxtase (MDMA)', 'Haxixe', 'Heroína', 'Lança-perfume', 'Crack', 'LSD', 'Cetamina', 'Maconha', 'Outra'] },
      { id: 14, label: 'Tipo de SPA', type: 'select', options: ['Lícita', 'Ilícita', 'Ambas'] },
      { id: 15, label: 'Uso de SPA', type: 'matrix', rows: ['Cafeína', 'Álcool', 'Cigarro', 'Maconha', 'Cocaína', 'Crack', 'Alucinógenos', 'Anfetaminas', 'Opioides (heroína, morfina)', 'Cetamina', 'Maconha sintética'], columns: ['Frequentemente', 'Às vezes', 'Raramente', 'Nunca'] },
      { id: 16, label: 'Valor gasto mensalmente com consumo de SPA', type: 'select', options: ['Menos que R$ 500,00', 'Entre R$ 500,00 e R$ 1.400,00', 'Acima de R$ 1.400,00', 'Não sabe'] },
      { id: 17, label: 'Idade de início do uso de SPA', type: 'select', options: ['7 a 11 anos', '12 a 16 anos', '17 a 21 anos', 'Após 22 anos'] },
      { id: 18, label: 'Impacto do uso de SPA em sua vida', type: 'textarea' },
      { id: 19, label: 'Relação familiar após o início do uso de substâncias', type: 'textarea' },
      { id: 20, label: 'Situações envolvidas no uso', type: 'multi', options: ['Relacionamentos', 'Perda ou luto', 'Doença crônica', 'Relações sociais'] },
      { id: 31, label: 'Tem vontade de interromper o uso?', type: 'select', options: ['Sim', 'Não', 'Talvez', 'Não sabe'] },
      { id: 32, label: 'Uso de SPA por familiares', type: 'select', options: ['Sim', 'Não'] },
    ],
  },
  {
    title: 'Tratamentos e internações', description: 'Histórico psicológico, psiquiátrico, medicamentoso e institucional.', questions: [
      { id: 21, label: 'Histórico de tratamento psicológico', type: 'select', options: ['Sim', 'Não'] },
      { id: 22, label: 'Histórico de tratamento psiquiátrico', type: 'select', options: ['Sim', 'Não'] },
      { id: 23, label: 'Psicofarmacoterapia (medicações separadas por vírgula)' },
      { id: 24, label: 'Outras intervenções terapêuticas', type: 'multi', options: ['Comunidade terapêutica', 'Grupo de mútua ajuda', 'Outra'] },
      { id: 25, label: 'Histórico de internação pelo uso de SPA', type: 'select', options: ['Sim', 'Não'] },
      { id: 26, label: 'Internação por uso de SPA: ano, local e período', type: 'textarea' },
      { id: 27, label: 'Histórico de internação por sofrimento mental', type: 'select', options: ['Sim', 'Não'] },
      { id: 28, label: 'Internação por sofrimento mental: ano, local e período', type: 'textarea' },
      { id: 29, label: 'Histórico de acolhimento em comunidade terapêutica', type: 'select', options: ['Sim', 'Não'] },
      { id: 30, label: 'Acolhimento em comunidade terapêutica: ano, local e período', type: 'textarea' },
    ],
  },
  {
    title: 'Saúde e desenvolvimento', description: 'Condições clínicas, sono, alimentação, gestação e antecedentes.', questions: [
      { id: 33, label: 'Histórico de doenças crônicas', type: 'multi', options: ['Diabetes', 'Hipotireoidismo', 'Hipertireoidismo', 'Hipertensão', 'Doença autoimune', 'Dores crônicas', 'Outra', 'Nenhuma'] },
      { id: 34, label: 'Histórico de saúde mental na família', type: 'textarea' },
      { id: 35, label: 'Histórico de traumatismo cranioencefálico', type: 'textarea' },
      { id: 36, label: 'Sono', type: 'select', options: ['Regular', 'Insônia inicial', 'Insônia de manutenção', 'Insônia terminal'] },
      { id: 37, label: 'Apetite / alimentação', type: 'select', options: ['Regular', 'Falta de apetite', 'Excesso de apetite', 'Compulsão alimentar'] },
      { id: 38, label: 'Atividade física', type: 'select', options: ['Sedentário(a)', '1 vez por semana', '2 vezes por semana', '3 vezes por semana', 'Mais de 3 vezes por semana'] },
      { id: 39, label: 'Histórico de cirurgia', type: 'textarea' },
      { id: 40, label: 'Histórico de saúde familiar', type: 'textarea' },
      { id: 41, label: 'Gestação', type: 'multi', options: ['Normal', 'Uso de substância', 'Trauma', 'Infecções', 'Não sabe', 'Não se aplica'] },
      { id: 42, label: 'Parto', type: 'select', options: ['Normal', 'Cesariana', 'Prematuridade', 'Pré-eclâmpsia', 'Eclâmpsia', 'Fórceps', 'Parto forçado', 'Não sabe', 'Não se aplica'] },
      { id: 43, label: 'Última consulta médica' },
    ],
  },
  {
    title: 'Trabalho, renda e contexto social', description: 'Ocupação, benefícios, relações, apoio, escolaridade e projetos.', questions: [
      { id: 44, label: 'Exerce atividade remunerada?', type: 'select', options: ['Sim', 'Não'] },
      { id: 45, label: 'Se não trabalha, tem vontade de retornar ao trabalho?', type: 'select', options: ['Sim', 'Não', 'Já trabalha'] },
      { id: 46, label: 'Experiências profissionais / habilitações' },
      { id: 47, label: 'Áreas de interesse de trabalho' },
      { id: 48, label: 'Tem registro no CadÚnico?', type: 'select', options: ['Sim', 'Não', 'Não sabe / não deseja informar'] },
      { id: 49, label: 'Recebe benefícios estatais?', type: 'select', options: ['Sim', 'Não'] },
      { id: 50, label: 'Se sim, informe qual', type: 'multi', options: ['Bolsa Família', 'BPC / LOAS', 'Outros'] },
      { id: 51, label: 'Renda mensal', type: 'select', options: ['Menos que um salário mínimo', 'Mais que um salário mínimo', 'Sem informação'] },
      { id: 52, label: 'Estrutura e dinâmica familiar', type: 'textarea' },
      { id: 53, label: 'Qualidade das relações familiares', type: 'textarea' },
      { id: 54, label: 'Histórico social (amizades)', type: 'textarea' },
      { id: 55, label: 'Rede de apoio', type: 'multi', options: ['Núcleo familiar', 'Amigos', 'Referência espiritual', 'CAPS / CERSAM AD', 'UBS', 'Profissional de saúde mental', 'Grupo de mútua ajuda', 'Não possui'] },
      { id: 56, label: 'Liste pessoas ou instituições da rede de apoio', type: 'textarea' },
      { id: 57, label: 'Filhos', type: 'select', options: ['0', '1', '2', '3', '4', '5 ou mais'] },
      { id: 58, label: 'Relacionamentos amorosos', type: 'textarea' },
      { id: 59, label: 'Conflito com a lei', type: 'select', options: ['Sim', 'Não'] },
      { id: 60, label: 'Passagem pelo sistema prisional', type: 'select', options: ['Sim', 'Não'] },
      { id: 61, label: 'Escolaridade', type: 'select', options: ['Fundamental incompleto', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Superior / Pós-graduação / Mestrado / Doutorado'] },
      { id: 62, label: 'Curso de interesse' },
    ],
  },
  {
    title: 'Avaliação de risco e estado mental', description: 'TAE, cognição, humor, riscos, sensopercepção e impressão do entrevistador.', questions: [
      { id: 63, label: 'Avaliação de risco de TAE', type: 'matrix', rows: ['Pensamentos frequentes', 'Ideação suicida', 'Planejamento'], columns: ['Sim', 'Não', 'No passado'] },
      { id: 64, label: 'Tentativas de TAE', type: 'select', options: ['Sim', 'Não'] },
      { id: 65, label: 'Data da última tentativa de TAE ou informação disponível' },
      { id: 66, label: 'Meios letais', type: 'multi', options: ['Intoxicação', 'Enforcamento', 'Queda', 'Perfurocortante', 'Outro'] },
      { id: 67, label: 'Meios de autolesão', type: 'textarea' },
      { id: 68, label: 'Cognição', type: 'matrix', rows: ['Memória', 'Linguagem', 'Psicomotricidade', 'Juízo crítico'], columns: ['Preservado', 'Alterado'] },
      { id: 69, label: 'Humor', type: 'select', options: ['Eutimia', 'Hipotimia', 'Hipertimia'] },
      { id: 70, label: 'Avaliação de riscos', type: 'matrix', rows: ['Overdose', 'Comportamento violento', 'Segurança no ambiente domiciliar'], columns: ['Baixo', 'Médio', 'Alto'] },
      { id: 71, label: 'Sensopercepção', type: 'select', options: ['Preservada', 'Alucinação auditiva', 'Alucinação visual'] },
      { id: 72, label: 'Compreensão do entrevistador sobre a pessoa', type: 'textarea' },
    ],
  },
];

function PsychosocialAnamnesisForm({ patient, value, onSave }: { patient: Patient; value?: AnamnesisRecord; onSave: (record: AnamnesisRecord) => void }) {
  const [saved, setSaved] = useState(false);
  const answers = value?.psychosocialAnswers ?? {};
  const defaults: Record<string, string> = {};
  const answer = (key: string) => answers[key] ?? defaults[key] ?? '';
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const psychosocialAnswers: Record<string, string> = {};
    for (const [key, raw] of data.entries()) {
      const text = String(raw);
      psychosocialAnswers[key] = psychosocialAnswers[key] ? `${psychosocialAnswers[key]}, ${text}` : text;
    }
    onSave({ ...(value ?? {}), patientId: patient.id, psychosocialAnswers, updatedAt: new Date().toISOString() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }
  return (
    <form onSubmit={submit} className="panel mt-6 overflow-hidden">
      <div className="sticky top-20 z-10 border-b bg-white/95 px-6 py-5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold">Anamnese Psicossocial Individual</h2><p className="text-sm text-slate-500">65 questões organizadas em 6 blocos clínicos</p></div>
          <button className="rounded-xl bg-[#176a68] px-5 py-2.5 text-sm font-semibold text-white">{saved ? 'Salvo com sucesso' : 'Salvar anamnese'}</button>
        </div>
        <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Nome', patient.name],
            ['Sexo', patient.genderSpa],
            ['Data de nascimento', patient.birth],
            ['Estado civil', patient.maritalStatus],
            ['Município', patient.municipality],
          ].map(([label, content]) => (
            <div key={label} className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="truncate text-sm font-semibold text-slate-700">{content || 'Não informado'}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6 bg-slate-50/60 p-5 sm:p-6">
        {psychosocialSections.map((section, sectionIndex) => (
          <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-6 flex gap-3 border-b pb-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 font-bold text-teal-700">{sectionIndex + 1}</span><div><h3 className="font-bold text-slate-800">{section.title}</h3><p className="mt-1 text-xs text-slate-500">{section.description}</p></div></div>
            <div className="grid gap-6">
              {section.questions.map((question) => {
                const key = `q${question.id}`;
                return <div key={key} className="grid gap-2"><label className="text-sm font-semibold text-slate-700"><span className="mr-2 text-xs font-bold text-teal-700">{question.id}.</span>{question.label}</label>
                  {question.type === 'textarea' ? <textarea name={key} defaultValue={answer(key)} rows={3} className="rounded-xl border bg-white p-3 text-sm outline-none focus:border-teal-500" />
                  : question.type === 'select' ? <select name={key} defaultValue={answer(key)} className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:border-teal-500"><option value="">Selecione</option>{question.options?.map((option) => <option key={option}>{option}</option>)}</select>
                  : question.type === 'multi' ? <div className="grid gap-2 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">{question.options?.map((option) => <label key={option} className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" name={key} value={option} defaultChecked={answer(key).split(', ').includes(option)} className="h-4 w-4 accent-teal-700" />{option}</label>)}</div>
                  : question.type === 'matrix' ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[540px] text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-3 text-left">Item</th>{question.columns?.map((column) => <th key={column} className="px-3 py-3 text-center">{column}</th>)}</tr></thead><tbody>{question.rows?.map((row) => <tr key={row} className="border-t"><td className="px-3 py-3 font-medium">{row}</td>{question.columns?.map((column) => <td key={column} className="px-3 py-3 text-center"><input required type="radio" name={`${key}__${row}`} value={column} defaultChecked={answer(`${key}__${row}`) === column} className="h-4 w-4 accent-teal-700" /></td>)}</tr>)}</tbody></table></div>
                  : <input name={key} type={question.type === 'date' ? 'date' : 'text'} defaultValue={answer(key)} className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:border-teal-500" />}
                </div>;
              })}
            </div>
          </section>
        ))}
      </div>
    </form>
  );
}

function AnamnesisForm({
  patient,
  value,
  onSave,
}: {
  patient: Patient;
  value?: AnamnesisRecord;
  onSave: (record: AnamnesisRecord) => void;
}) {
  const [saved, setSaved] = useState(false);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? '');
    onSave({
      patientId: patient.id,
      gender: read('gender'),
      maritalOccupation: read('maritalOccupation'),
      education: read('education'),
      birthplaceResidence: read('birthplaceResidence'),
      guardian: read('guardian'),
      interviewDate: read('interviewDate'),
      referredBy: read('referredBy'),
      searchMotivation: read('searchMotivation'),
      emotionalHistory: read('emotionalHistory'),
      supportNetwork: read('supportNetwork'),
      functionalImpact: read('functionalImpact'),
      substanceUse: read('substanceUse'),
      complaint: read('complaint'),
      currentHistory: read('currentHistory'),
      healthHistory: read('healthHistory'),
      familyHistory: read('familyHistory'),
      developmentRoutine: read('developmentRoutine'),
      initialImpressions: read('initialImpressions'),
      city: read('city'),
      signedAt: read('signedAt'),
      professionalName: read('professionalName'),
      crp: read('crp'),
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }
  return (
    <form onSubmit={submit} className="panel mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-bold">Ficha de Anamnese Psicológica</h2>
          <p className="text-sm text-slate-500">
            {value?.updatedAt
              ? `Última atualização: ${new Date(value.updatedAt).toLocaleString('pt-BR')}`
              : 'Preencha a entrevista inicial do Acolhido'}
          </p>
        </div>
        <button className="rounded-xl bg-[#176a68] px-5 py-2.5 text-sm font-semibold text-white">
          {saved ? 'Salvo com sucesso' : 'Salvar anamnese'}
        </button>
      </div>
      <div className="space-y-8 p-6">
        <AnamnesisSection number="1" title="Identificação">
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <ReadOnly label="Acolhido" value={patient.name} />
            <ReadOnly
              label="Nascimento / idade"
              value={`${patient.birth} — ${patient.age} anos`}
            />
            <ShortField
              label="Sexo / gênero (autodeclaração)"
              name="gender"
              value={value?.gender}
            />
            <ShortField
              label="Estado civil / ocupação"
              name="maritalOccupation"
              value={value?.maritalOccupation}
            />
            <ShortField
              label="Escolaridade"
              name="education"
              value={value?.education}
            />
            <ShortField
              label="Naturalidade / residência (cidade/UF)"
              name="birthplaceResidence"
              value={value?.birthplaceResidence}
            />
            <ShortField
              label="Responsável e vínculo, quando aplicável"
              name="guardian"
              value={value?.guardian}
            />
            <ShortField
              label="Data da entrevista"
              name="interviewDate"
              type="date"
              value={value?.interviewDate}
            />
            <div className="sm:col-span-2">
              <ShortField
                label="Encaminhado(a) por"
                name="referredBy"
                value={value?.referredBy}
                placeholder="Procura espontânea, profissional ou instituição"
              />
            </div>
          </div>
        </AnamnesisSection>
        <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-5">
          <div className="mb-5">
            <h3 className="font-bold text-slate-800">
              Perguntas orientadoras da entrevista
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Registre a resposta do Acolhido com suas próprias palavras sempre
              que possível.
            </p>
          </div>
          <div className="space-y-5">
            <GuidedQuestion
              label="Motivo da busca"
              question="O que motivou você a buscar acompanhamento psicológico agora?"
              name="searchMotivation"
              value={value?.searchMotivation}
            />
            <GuidedQuestion
              label="Histórico emocional"
              question="Já realizou algum tratamento psicológico ou psiquiátrico anteriormente? Com que resultado?"
              name="emotionalHistory"
              value={value?.emotionalHistory}
            />
            <GuidedQuestion
              label="Relacionamentos e rede de suporte"
              question="Como você descreveria suas relações familiares e de amizade?"
              name="supportNetwork"
              value={value?.supportNetwork}
            />
            <GuidedQuestion
              label="Sintomas e impacto funcional"
              question="Esses sentimentos ou pensamentos interferem no seu trabalho, sono ou vida social?"
              name="functionalImpact"
              value={value?.functionalImpact}
            />
            <GuidedQuestion
              label="Uso de substâncias"
              question="Usa álcool, medicamentos ou outras substâncias para lidar com o que está sentindo?"
              name="substanceUse"
              value={value?.substanceUse}
            />
          </div>
        </section>
        <AnamnesisSection number="2" title="Queixa / demanda">
          <LongField
            name="complaint"
            value={value?.complaint}
            prompt="Motivo da procura, preferencialmente nas palavras do próprio Acolhido ou do responsável."
          />
        </AnamnesisSection>
        <AnamnesisSection number="3" title="História da queixa atual">
          <LongField
            name="currentHistory"
            value={value?.currentHistory}
            prompt="Início, evolução, frequência e intensidade; fatores que agravam ou aliviam; tentativas anteriores de ajuda e tratamentos."
          />
        </AnamnesisSection>
        <AnamnesisSection number="4" title="Antecedentes pessoais e de saúde">
          <LongField
            name="healthHistory"
            value={value?.healthHistory}
            prompt="Saúde física e mental; acompanhamentos psicológicos ou psiquiátricos; medicação; internações e condições clínicas relevantes."
          />
        </AnamnesisSection>
        <AnamnesisSection number="5" title="História familiar">
          <LongField
            name="familyHistory"
            value={value?.familyHistory}
            prompt="Composição familiar; relações significativas; antecedentes de saúde; dinâmica e rede de apoio."
          />
        </AnamnesisSection>
        <AnamnesisSection number="6" title="Desenvolvimento / rotina">
          <LongField
            name="developmentRoutine"
            value={value?.developmentRoutine}
            prompt="Marcos do desenvolvimento; escolaridade ou trabalho; sono; alimentação; lazer; hábitos e rotina atual."
          />
        </AnamnesisSection>
        <AnamnesisSection number="7" title="Observações / impressões iniciais">
          <LongField
            name="initialImpressions"
            value={value?.initialImpressions}
            prompt="Observações profissionais, hipóteses preliminares e próximos passos, sem juízo de valor ou diagnóstico categórico."
          />
        </AnamnesisSection>
        <section className="rounded-2xl border border-slate-200 p-5">
          <h3 className="mb-4 font-bold text-slate-800">
            Fechamento e responsabilidade técnica
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <ShortField label="Cidade" name="city" value={value?.city} />
            <ShortField
              label="Data"
              name="signedAt"
              type="date"
              value={value?.signedAt}
            />
            <ShortField
              label="Nome do(a) psicólogo(a)"
              name="professionalName"
              value={value?.professionalName ?? 'Marco Tulio'}
            />
            <ShortField
              label="CRP (nº/região)"
              name="crp"
              value={value?.crp ?? ''}
            />
          </div>
          <div className="mt-5 flex gap-3 rounded-xl bg-teal-50 p-4 text-sm leading-relaxed text-teal-800">
            <ShieldCheck className="mt-0.5 shrink-0" size={20} />
            <p>
              Instrumento clínico de coleta inicial; integra o prontuário e é
              protegido pelo sigilo profissional. A guarda e a responsabilidade
              técnica são do(a) psicólogo(a) que o assina.
            </p>
          </div>
        </section>
      </div>
    </form>
  );
}
function AnamnesisSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
          {number}
        </span>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </section>
  );
}
function ShortField({
  label,
  name,
  value,
  type = 'text',
  placeholder,
}: {
  label: string;
  name: string;
  value?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-teal-500"
      />
    </label>
  );
}
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">
        {value}
      </p>
    </div>
  );
}
function LongField({
  name,
  value,
  prompt,
}: {
  name: string;
  value?: string;
  prompt: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs leading-relaxed text-slate-500">{prompt}</span>
      <textarea
        name={name}
        defaultValue={value}
        rows={5}
        className="resize-y rounded-xl border border-slate-200 p-3 text-sm leading-relaxed outline-none focus:border-teal-500"
        placeholder="Registre as informações coletadas na entrevista..."
      />
    </label>
  );
}
function GuidedQuestion({
  label,
  question,
  name,
  value,
}: {
  label: string;
  question: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-teal-700">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-700">“{question}”</span>
      <textarea
        name={name}
        defaultValue={value}
        rows={3}
        className="resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed outline-none focus:border-teal-500"
        placeholder="Registre a resposta..."
      />
    </label>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  const c: any = {
    teal: 'bg-teal-50 text-teal-700',
    blue: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <div className="panel p-5">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div
          className={`grid h-11 w-11 place-items-center rounded-xl ${c[color]}`}
        >
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
function PatientName({ p }: { p: Patient }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${p.color}`}
      >
        {p.initials}
      </div>
      <div>
        <p className="truncate font-semibold">{p.name}</p>
        <p className="text-xs text-slate-400">{p.age} anos</p>
      </div>
    </div>
  );
}
function Appointment({
  time,
  p,
  tag,
  select,
}: {
  time: string;
  p: Patient;
  tag: string;
  select: (p: Patient) => void;
}) {
  return (
    <button
      onClick={() => select(p)}
      className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
    >
      <b className="w-12 text-sm">{time}</b>
      <span className="h-10 w-0.5 bg-teal-500" />
      <PatientName p={p} />
      <span className="ml-auto hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs sm:block">
        {tag}
      </span>
      <ChevronRight size={17} />
    </button>
  );
}
function Alert({
  icon: Icon,
  title,
  text,
  tone,
}: {
  icon: any;
  title: string;
  text: string;
  tone: string;
}) {
  const c: any = {
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-sky-50 text-sky-700',
  };
  return (
    <div className="flex gap-3 rounded-xl border p-3">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${c[tone]}`}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}
function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#287472]">
        {title}
      </p>
      <p className="text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}
function Modal({
  title,
  subtitle = 'Os campos marcados são obrigatórios',
  close,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
          <button onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
const Field = ({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) => (
  <label className="grid gap-1.5 text-sm font-semibold">
    {label}
    <input
      required
      name={name}
      type={type}
      autoComplete={autoComplete ?? (type === 'password' ? 'new-password' : 'off')}
      placeholder={placeholder}
      className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500"
    />
  </label>
);
const SelectField = ({ label, name, options }: { label: string; name: string; options: string[] }) => (
  <label className="grid gap-1.5 text-sm font-semibold">
    {label}
    <select required name={name} defaultValue="" className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
      <option value="" disabled>Selecione</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);
const FormSection = ({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">{number}</span>
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <div className="grid gap-4">{children}</div>
  </section>
);
function PatientForm({
  submit,
}: {
  submit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [clientState, setClientState] = useState('');
  const [clientMunicipality, setClientMunicipality] = useState('');
  const [clientMunicipalities, setClientMunicipalities] = useState<string[]>([]);
  const [birthDate, setBirthDate] = useState('');
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [professionalsLoading, setProfessionalsLoading] = useState(true);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [busyTimes, setBusyTimes] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const calculatedAge = birthDate ? (() => {
    const [year, month, day] = birthDate.split('-').map(Number);
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
    return Math.max(0, age);
  })() : '';
  const selectedProfessional = professionals.find((professional) => professional.id === selectedProfessionalId);
  const availableTimes = (() => {
    if (!selectedProfessional?.availabilityStart || !selectedProfessional.availabilityEnd) return [];
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const slots: string[] = [];
    for (let time = toMinutes(selectedProfessional.availabilityStart); time + 60 <= toMinutes(selectedProfessional.availabilityEnd); time += 30) {
      const value = toTime(time);
      if (!busyTimes.includes(value)) slots.push(value);
    }
    return slots;
  })();
  useEffect(() => {
    let active = true;
    supabase?.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const response = await fetch('/api/professionals', { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok && active) setProfessionals(await response.json());
      } finally {
        if (active) setProfessionalsLoading(false);
      }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!selectedProfessionalId || !appointmentDate) {
      setBusyTimes([]);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    supabase?.auth.getSession().then(async ({ data }) => {
      try {
        const params = new URLSearchParams({ professionalId: selectedProfessionalId, date: appointmentDate });
        const response = await fetch(`/api/appointments?${params}`, { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
        if (response.ok && active) {
          const appointments: AppointmentRecord[] = await response.json();
          setBusyTimes(appointments.flatMap((appointment) => {
            const [hours, minutes] = appointment.startTime.split(':').map(Number);
            const previous = hours * 60 + minutes - 30;
            return [
              appointment.startTime,
              previous >= 0 ? `${String(Math.floor(previous / 60)).padStart(2, '0')}:${String(previous % 60).padStart(2, '0')}` : '',
            ];
          }).filter(Boolean));
        }
      } finally {
        if (active) setSlotsLoading(false);
      }
    });
    return () => { active = false; };
  }, [selectedProfessionalId, appointmentDate]);
  useEffect(() => {
    if (!clientState) {
      setClientMunicipalities([]);
      setClientMunicipality('');
      return;
    }
    let active = true;
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${clientState}/municipios?orderBy=nome`)
      .then((response) => response.json())
      .then((items: Array<{ nome: string }>) => {
        if (active) setClientMunicipalities(items.map((item) => item.nome));
      })
      .catch(() => {
        if (active) setClientMunicipalities([]);
      });
    return () => { active = false; };
  }, [clientState]);
  const macroregion = !clientMunicipality
    ? ''
    : clientState.trim().toUpperCase() === 'MG'
      ? mgMesoregions.get(normalizeMunicipality(clientMunicipality)) ?? 'Outros Estados'
      : 'Outros Estados';
  return (
    <form onSubmit={submit} className="grid gap-5 bg-slate-50/70 p-5 sm:p-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-xs">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Data
          <input required name="registrationDate" type="date" defaultValue={todayValue} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" />
        </label>
      </div>
      <FormSection number="1" title="Dados do solicitante" description="Identifique quem realizou o contato inicial.">
        <Field label="Nome do solicitante" name="requesterName" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Vínculo do solicitante" name="requesterRelationship" />
          <Field label="Telefone do solicitante" name="phone" type="tel" />
          <Field label="E-mail do solicitante" name="requesterEmail" type="email" />
        </div>
      </FormSection>

      <FormSection number="2" title="Usuário SPA" description="Dados pessoais da pessoa que receberá o atendimento.">
        <Field label="Nome do usuário (SPA)" name="name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail (SPA)" name="email" type="email" />
          <Field label="Telefone (SPA)" name="spaPhone" type="tel" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Documento de identificação" name="document" />
          <label className="grid gap-1.5 text-sm font-semibold">Data de nascimento<input required name="birth" type="date" max={todayValue} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Idade<input required readOnly name="age" type="number" value={calculatedAge} placeholder="Automática" className="h-11 rounded-xl border bg-slate-50 px-3 font-normal text-slate-600 outline-none" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Sexo SPA" name="genderSpa" options={['Feminino', 'Masculino', 'Não binário', 'Outro', 'Não informado']} />
          <SelectField label="Estado civil" name="maritalStatus" options={['Solteiro(a)', 'Casado(a)', 'União estável', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Outro', 'Não informado']} />
        </div>
      </FormSection>

      <FormSection number="3" title="Endereço residencial" description="Selecione a UF para carregar os municípios correspondentes.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Estado (UF)<select required name="stateSpa" value={clientState} onChange={(event) => { setClientState(event.target.value); setClientMunicipality(''); }} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500"><option value="">Selecione</option>{['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-semibold">Município<select key={clientState} required name="municipality" disabled={!clientState} value={clientMunicipality} onChange={(event) => setClientMunicipality(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500 disabled:text-slate-400"><option value="">{clientState ? 'Selecione o município' : 'Selecione o estado primeiro'}</option>{clientMunicipalities.map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}</select></label>
        </div>
        <Field label="Logradouro, número e complemento" name="residentialAddress" />
        <label className="grid gap-1.5 text-sm font-semibold">
          Macrorregião
          <input readOnly name="region" value={macroregion} placeholder="Preenchida conforme o município" className="h-11 rounded-xl border bg-slate-50 px-3 font-normal text-slate-600 outline-none" />
        </label>
      </FormSection>

      <FormSection number="4" title="Agendamento do atendimento" description="Defina o profissional, a data e o horário do primeiro atendimento.">
        <label className="grid gap-1.5 text-sm font-semibold">
          Psicólogo ou Assistente Social
          <select required name="assignedProfessionalId" value={selectedProfessionalId} onChange={(event) => setSelectedProfessionalId(event.target.value)} disabled={professionalsLoading} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500 disabled:text-slate-400">
            <option value="">{professionalsLoading ? 'Carregando profissionais…' : 'Selecione o profissional'}</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name} — {professional.role === 'psicologo' ? 'Psicólogo' : 'Assistente Social'}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="assignedProfessionalName" value={selectedProfessional?.name ?? ''} />
        <input type="hidden" name="assignedProfessionalRole" value={selectedProfessional?.role === 'psicologo' ? 'Psicólogo' : selectedProfessional ? 'Assistente Social' : ''} />
        {selectedProfessional && (
          <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
            Disponibilidade: {selectedProfessional.availabilityStart && selectedProfessional.availabilityEnd
              ? `${selectedProfessional.availabilityStart} às ${selectedProfessional.availabilityEnd}`
              : 'horário ainda não informado'}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Data do atendimento<input required name="appointmentDate" type="date" min={todayValue} value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Horário disponível
            <select required name="appointmentTime" defaultValue="" key={`${selectedProfessionalId}-${appointmentDate}-${busyTimes.join(',')}`} disabled={!selectedProfessionalId || !appointmentDate || slotsLoading} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500 disabled:text-slate-400">
              <option value="">{slotsLoading ? 'Verificando horários…' : 'Selecione o horário'}</option>
              {availableTimes.map((time) => <option key={time} value={time}>{time}–{(() => { const [h, m] = time.split(':').map(Number); const total = h * 60 + m + 60; return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; })()}</option>)}
            </select>
          </label>
        </div>
        {selectedProfessionalId && appointmentDate && !slotsLoading && availableTimes.length === 0 && (
          <p className="text-sm font-medium text-amber-700">Não há horários livres para esta data. Escolha outro dia ou profissional.</p>
        )}
        {!professionalsLoading && professionals.length === 0 && (
          <p className="text-sm font-medium text-amber-700">Nenhum profissional ativo está disponível para agendamento.</p>
        )}
      </FormSection>

      <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end border-t bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
        <Submit label="Cadastrar Acolhido" />
      </div>
    </form>
  );
}
function SessionForm({
  submit,
}: {
  submit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={submit} className="grid gap-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" name="date" type="date" />
        <Field label="Horário" name="time" type="time" />
      </div>
      <Text label="Relato / anotações" name="note" />
      <Text label="Próximos passos" name="next" />
      <Submit label="Salvar atualização" />
    </form>
  );
}
function AssessmentForm({
  submit,
}: {
  submit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const substances = ['Tabaco', 'Álcool', 'Maconha', 'Cocaína / crack', 'Anfetaminas / ecstasy', 'Inalantes', 'Hipnóticos / sedativos', 'Alucinógenos', 'Opioides', 'Outras'];
  const questions = [
    { id: 2, text: 'Nos últimos três meses, com que frequência utilizou?', options: [['Nunca', 0], ['1 ou 2 vezes', 1], ['Mensalmente', 2], ['Semanalmente', 3], ['Diariamente ou quase todo dia', 4]] as const },
    { id: 3, text: 'Com que frequência teve forte desejo ou urgência em consumir?', options: [['Nunca', 0], ['1 ou 2 vezes', 1], ['Mensalmente', 2], ['Semanalmente', 3], ['Diariamente ou quase todo dia', 4]] as const },
    { id: 4, text: 'Com que frequência o consumo causou problema de saúde, social, legal ou financeiro?', options: [['Nunca', 0], ['1 ou 2 vezes', 1], ['Mensalmente', 2], ['Semanalmente', 3], ['Diariamente ou quase todo dia', 4]] as const },
    { id: 5, text: 'Com que frequência deixou de fazer coisas normalmente esperadas?', options: [['Nunca', 0], ['1 ou 2 vezes', 1], ['Mensalmente', 2], ['Semanalmente', 3], ['Diariamente ou quase todo dia', 4]] as const },
    { id: 6, text: 'Alguém demonstrou preocupação com esse uso?', options: [['Não, nunca', 0], ['Sim, mas não nos últimos 3 meses', 1], ['Sim, nos últimos 3 meses', 2]] as const },
    { id: 7, text: 'Já tentou controlar, diminuir ou parar o uso?', options: [['Não, nunca', 0], ['Sim, mas não nos últimos 3 meses', 1], ['Sim, nos últimos 3 meses', 2]] as const },
  ];
  const [usedEver, setUsedEver] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const results: AssistResult[] = substances.map((substance) => {
    const score = usedEver[substance] ? questions.reduce((sum, question) => sum + (answers[`${substance}__${question.id}`] ?? 0), 0) : 0;
    if (score >= 16) return { substance, score, classification: 'Sugestivo de dependência', recommendation: 'Realizar avaliação clínica aprofundada e considerar encaminhamento para cuidado especializado.' };
    if (score >= 4) return { substance, score, classification: 'Sugestivo de abuso', recommendation: 'Realizar intervenção breve e acompanhamento clínico.' };
    return { substance, score, classification: 'Uso ocasional', recommendation: 'Oferecer orientação preventiva e acompanhar conforme o contexto clínico.' };
  });
  const selectedResults = results.filter((result) => usedEver[result.substance]);
  return (
    <form onSubmit={(event) => { if (!selectedResults.length) { event.preventDefault(); window.alert('Selecione pelo menos uma substância utilizada.'); return; } submit(event); }} className="grid gap-5 bg-slate-50/60 p-5 sm:p-6">
      <input type="hidden" name="type" value="ASSIST" />
      <input type="hidden" name="score" value={selectedResults.length ? Math.max(...selectedResults.map((result) => result.score)) : 0} />
      <input type="hidden" name="assistResults" value={JSON.stringify(selectedResults)} />
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 text-sm text-teal-900">
        <div className="flex gap-3"><Sparkles className="shrink-0" size={20} /><div><b>ASSIST 2.0 - cálculo automático por substância</b><p className="mt-1 text-xs leading-5">Instrumento de triagem. O resultado deve ser interpretado junto à entrevista clínica e não estabelece diagnóstico isoladamente.</p></div></div>
      </div>
      <section className="rounded-2xl border bg-white p-5">
        <h3 className="font-bold">1. Uso na vida</h3>
        <p className="mt-1 text-xs text-slate-500">Marque as substâncias utilizadas alguma vez, somente em uso não médico.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {substances.map((substance) => <label key={substance} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={Boolean(usedEver[substance])} onChange={(event) => setUsedEver((current) => ({ ...current, [substance]: event.target.checked }))} className="h-4 w-4 accent-teal-700" />{substance}</label>)}
        </div>
        {usedEver.Outras && <div className="mt-4"><Field label="Especifique outras substâncias" name="otherSubstance" /></div>}
      </section>
      {questions.map((question) => (
        <section key={question.id} className="rounded-2xl border bg-white p-5">
          <h3 className="text-sm font-bold"><span className="mr-2 text-teal-700">{question.id}.</span>{question.text}</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {substances.filter((substance) => usedEver[substance]).map((substance) => (
              <label key={substance} className="grid gap-1.5 text-xs font-semibold text-slate-600">{substance}
                <select value={answers[`${substance}__${question.id}`] ?? 0} onChange={(event) => setAnswers((current) => ({ ...current, [`${substance}__${question.id}`]: Number(event.target.value) }))} className="h-10 rounded-xl border bg-white px-3 text-sm font-normal text-slate-700">
                  {question.options.map(([label, value]) => <option key={label} value={value}>{label} ({value})</option>)}
                </select>
              </label>
            ))}
            {!Object.values(usedEver).some(Boolean) && <p className="text-sm text-slate-400">Marque pelo menos uma substância na questão 1.</p>}
          </div>
        </section>
      ))}
      <section className="rounded-2xl border bg-white p-5">
        <label className="grid gap-2 text-sm font-bold">8. Alguma vez usou drogas por injeção? (uso não médico)
          <select required name="injectionUse" defaultValue="" className="h-11 rounded-xl border bg-white px-3 font-normal"><option value="">Selecione</option><option>Não, nunca</option><option>Sim, mas não nos últimos 3 meses</option><option>Sim, nos últimos 3 meses</option></select>
        </label>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h3 className="font-bold">Interpretação automática</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {selectedResults.map((result) => <div key={result.substance} className={`rounded-xl border p-4 ${result.score >= 16 ? 'border-rose-200 bg-rose-50' : result.score >= 4 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}><div className="flex items-center justify-between gap-2"><b>{result.substance}</b><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold">{result.score}/20</span></div><p className="mt-2 text-sm font-semibold">{result.classification}</p><p className="mt-1 text-xs leading-5 text-slate-600">{result.recommendation}</p></div>)}
          {!Object.values(usedEver).some(Boolean) && <p className="text-sm text-slate-400">Os resultados aparecerão após selecionar as substâncias utilizadas.</p>}
        </div>
      </section>
      <Text label="Observações do psicólogo" name="note" />
      <Submit label="Salvar ASSIST" />
    </form>
  );
}
function Text({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <textarea
        required
        name={name}
        rows={4}
        className="rounded-xl border p-3 font-normal outline-none focus:border-teal-500"
      />
    </label>
  );
}
function Submit({ label }: { label: string }) {
  return (
    <div className="mt-2 flex justify-end">
      <button className="rounded-xl bg-[#176a68] px-5 py-2.5 text-sm font-semibold text-white">
        {label}
      </button>
    </div>
  );
}
