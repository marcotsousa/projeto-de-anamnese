'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { mgMesoregionEntries } from './mg-mesoregions';
import {
  Activity,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Gavel,
  Download,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  NotebookPen,
  Plus,
  Printer,
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
  sefip?: string;
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
  legalReferrals?: LegalReferral[];
  legalAttendances?: LegalAttendance[];
  sefipFollowUps?: SefipFollowUp[];
};
type SefipFollowUp = { id: number; date: string; service: string; unit: string; status: string; notes: string; nextSteps: string; recordedBy: string };
type LegalReferral = {
  id: number;
  date: string;
  reason: string;
  requestedBy: string;
  status: string;
};
type LegalAttendance = {
  id: number;
  date: string;
  time: string;
  mode: 'Presencial' | 'Virtual';
  demand: string;
  guidance: string;
  actions: string;
  nextSteps: string;
  recordedBy: string;
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
  clientPhone: string;
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

const portugueseMonths: Record<string, string> = {
  jan: '01', janeiro: '01', fev: '02', fevereiro: '02', mar: '03', março: '03',
  abr: '04', abril: '04', mai: '05', maio: '05', jun: '06', junho: '06',
  jul: '07', julho: '07', ago: '08', agosto: '08', set: '09', setembro: '09',
  out: '10', outubro: '10', nov: '11', novembro: '11', dez: '12', dezembro: '12',
};

function formatDateBR(value?: string | null) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const yearFirst = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (yearFirst) return `${yearFirst[3]}/${yearFirst[2]}/${yearFirst[1]}`;
  const brazilian = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brazilian) return `${brazilian[1].padStart(2, '0')}/${brazilian[2].padStart(2, '0')}/${brazilian[3]}`;
  const written = text.toLocaleLowerCase('pt-BR').replace(/\s+de\s+/g, ' ').match(/^(\d{1,2})\s+([a-zç]+)\.?\s+(\d{4})$/);
  if (written && portugueseMonths[written[2]]) return `${written[1].padStart(2, '0')}/${portugueseMonths[written[2]]}/${written[3]}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? text
    : parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTimeBR(value?: string | null) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return formatDateBR(text);
  return `${parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às ${parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

type UserRole = 'administrador' | 'psicologo' | 'assistente_social' | 'administrativo' | 'juridico';
const nav = [
  ['Visão geral', LayoutDashboard],
  ['Acolhidos', Users],
  ['Agenda', CalendarDays],
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

export default function ClinicApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profileName, setProfileName] = useState('Profissional');
  const [profileJobTitle, setProfileJobTitle] = useState('');
  const [profileCouncil, setProfileCouncil] = useState('');
  const [fontScale, setFontScale] = useState(100);
  const [professionalCount, setProfessionalCount] = useState(0);
  const [active, setActive] = useState('Visão geral'),
    [selected, setSelected] = useState<Patient | null>(null),
    [tab, setTab] = useState('Resumo');
  const [patients, setPatients] = useState<Patient[]>([]),
    [assessments, setAssessments] = useState<Assessment[]>([]),
    [sessions, setSessions] = useState<Session[]>([]),
    [anamneses, setAnamneses] = useState<Record<string, AnamnesisRecord>>({});
  const [query, setQuery] = useState(''),
    [modal, setModal] = useState<'patient' | 'session' | 'assessment' | 'legalReferral' | 'legalAttendance' | 'sefip' | 'appointment' | null>(
      null,
    ),
    [mobile, setMobile] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    [
      'projeto-anamnese:patients',
      'projeto-anamnese:assessments',
      'projeto-anamnese:sessions',
      'projeto-anamnese:anamneses',
    ].forEach((key) => window.localStorage.removeItem(key));
    const storedScale = Number(window.localStorage.getItem('projeto-anamnese:font-scale'));
    const initialScale = storedScale >= 80 && storedScale <= 130 ? storedScale : 100;
    setFontScale(initialScale);
    document.documentElement.style.fontSize = '100%';
  }, []);
  const changeFontScale = (amount: number) => {
    setFontScale((current) => {
      const nextScale = Math.min(130, Math.max(80, current + amount));
      window.localStorage.setItem('projeto-anamnese:font-scale', String(nextScale));
      return nextScale;
    });
  };
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
      .select('role, full_name, job_title, council')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setRole((data?.role as UserRole) ?? 'psicologo');
        setProfileName(data?.full_name || 'Profissional');
        setProfileJobTitle(data?.job_title || '');
        setProfileCouncil(data?.council || '');
      });
  }, [userId]);

  useEffect(() => {
    if (!supabase || !userId || !role) return;
    const cloud = supabase;
    setCloudReady(false);
    let activeRequest = true;
    const loadCloudData = async () => {
      const { data: sessionData } = await cloud.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers = { Authorization: `Bearer ${token}` };
      const shouldLoadClinicalState = role !== 'administrativo' && role !== 'juridico';
      const [professionalsResponse, clientsResponse, stateResult] = await Promise.all([
        fetch('/api/professionals?mode=count', { headers }),
        fetch('/api/clients', { headers }),
        shouldLoadClinicalState
          ? cloud.from('user_state').select('data').eq('user_id', userId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (professionalsResponse.ok && activeRequest) {
        const professionalsResult = await professionalsResponse.json();
        setProfessionalCount(Number(professionalsResult.count) || 0);
      }
      if (clientsResponse.ok && activeRequest) setPatients(await clientsResponse.json());
      if (!shouldLoadClinicalState) {
        if (activeRequest) {
          setAssessments([]);
          setSessions([]);
          setAnamneses({});
          setActive('Acolhidos');
          setCloudReady(true);
        }
        return;
      }
      if (activeRequest) {
        if (!stateResult.error && stateResult.data?.data) {
          const state = stateResult.data.data as {
            assessments?: Assessment[];
            sessions?: Session[];
            anamneses?: Record<string, AnamnesisRecord>;
          };
          if (state.assessments) setAssessments(state.assessments);
          if (state.sessions) setSessions(state.sessions);
          if (state.anamneses) setAnamneses(state.anamneses);
        } else if (!stateResult.error) {
          setAssessments([]);
          setSessions([]);
          setAnamneses({});
        }
        setCloudReady(true);
      }
    };
    loadCloudData();
    return () => { activeRequest = false; };
  }, [userId, role]);

  useEffect(() => {
    if (!supabase || !userId || !cloudReady || role === 'administrativo' || role === 'juridico') return;
    const cloud = supabase;
    const timer = window.setTimeout(() => {
      cloud.from('user_state').upsert({
        user_id: userId,
        data: { assessments, sessions, anamneses },
        updated_at: new Date().toISOString(),
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [userId, role, cloudReady, assessments, sessions, anamneses]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return patients;
    return patients.filter((patient) => patient.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  }, [patients, query]);
  const selectedAssessments = useMemo(
    () => selected ? assessments.filter((assessment) => assessment.patientId === selected.id && assessment.type === 'ASSIST') : [],
    [assessments, selected],
  );
  const selectedSessions = useMemo(
    () => selected ? sessions.filter((session) => session.patientId === selected.id) : [],
    [sessions, selected],
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
    const patient: Patient = {
      id: patientId,
      name,
      initials: name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(),
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
      sefip: String(f.get('sefip') ?? ''),
      residentialAddress: String(f.get('residentialAddress')),
      requesterEmail: String(f.get('requesterEmail')),
      stateSpa: String(f.get('stateSpa')),
      spaPhone: String(f.get('spaPhone')),
      assignedProfessionalId: String(f.get('assignedProfessionalId')),
      assignedProfessionalName: String(f.get('assignedProfessionalName')),
      assignedProfessionalRole: String(f.get('assignedProfessionalRole')),
      appointmentDate: String(f.get('appointmentDate')),
      appointmentTime: String(f.get('appointmentTime')),
    };
    const { data: sessionData } = await supabase!.auth.getSession();
    const appointmentResponse = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({
        client: patient,
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
    const savedPatient = { ...patient, appointmentId: appointmentResult.appointmentId };
    setPatients((v) => [savedPatient, ...v]);
    setActive('Acolhidos');
    setTab('Resumo');
    setSelected(savedPatient);
    close();
  }
  async function login(email: string, password: string) {
    if (!supabase) return 'Configuração do Supabase ausente.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return null;
    if (error.message.toLowerCase().includes('banned'))
      return 'Sua conta está suspensa. Aguarde o desbloqueio pelo Administrador.';
    return 'E-mail ou senha incorretos.';
  }
  async function logout() {
    await supabase?.auth.signOut();
    setSelected(null);
    setUserId(null);
    setAuthenticated(false);
  }
  async function deletePatient(patient: Patient) {
    const confirmed = window.confirm(
      `Apagar permanentemente o registro de ${patient.name}?\n\nA anamnese, as sessões e as avaliações vinculadas também serão excluídas. Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;
    const { data: sessionData } = await supabase!.auth.getSession();
    const response = await fetch(`/api/clients?id=${encodeURIComponent(String(patient.id))}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });
    if (!response.ok) {
      const result = await response.json();
      window.alert(result.error || 'Não foi possível apagar o Acolhido.');
      return;
    }
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
        date: String(f.get('date')),
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
        date: new Date().toISOString().slice(0, 10),
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
  async function addLegalReferral(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    const referral: LegalReferral = {
      id: Date.now(),
      date: String(form.get('date')),
      reason: String(form.get('reason')).trim(),
      requestedBy: profileName,
      status: 'Pendente',
    };
    const { data: sessionData } = await supabase!.auth.getSession();
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({ clientId: selected.id, legalReferral: referral }),
    });
    const result = await response.json();
    if (!response.ok) {
      window.alert(result.error || 'Não foi possível registrar o encaminhamento jurídico.');
      return;
    }
    const updatedPatient = result.client as Patient;
    setPatients((current) => current.map((patient) => patient.id === selected.id ? updatedPatient : patient));
    setSelected(updatedPatient);
    close();
  }
  async function addLegalAttendance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    const legalAttendance: LegalAttendance = {
      id: Date.now(),
      date: String(form.get('date')),
      time: String(form.get('time')),
      mode: String(form.get('mode')) as LegalAttendance['mode'],
      demand: String(form.get('demand')).trim(),
      guidance: String(form.get('guidance')).trim(),
      actions: String(form.get('actions')).trim(),
      nextSteps: String(form.get('nextSteps')).trim(),
      recordedBy: profileName,
    };
    const { data: sessionData } = await supabase!.auth.getSession();
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({ clientId: selected.id, legalAttendance }),
    });
    const result = await response.json();
    if (!response.ok) {
      window.alert(result.error || 'Não foi possível salvar o atendimento jurídico.');
      return;
    }
    const updatedPatient = result.client as Patient;
    setPatients((current) => current.map((patient) => patient.id === selected.id ? updatedPatient : patient));
    setSelected(updatedPatient);
    close();
  }
  async function addSefipFollowUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    const followUp: SefipFollowUp = { id: Date.now(), date: String(form.get('date')), service: String(form.get('service')), unit: String(form.get('unit')).trim(), status: String(form.get('status')), notes: String(form.get('notes')).trim(), nextSteps: String(form.get('nextSteps')).trim(), recordedBy: profileName };
    const { data: sessionData } = await supabase!.auth.getSession();
    const response = await fetch('/api/clients', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session?.access_token}` }, body: JSON.stringify({ clientId: selected.id, sefipFollowUp: followUp }) });
    const result = await response.json();
    if (!response.ok) { window.alert(result.error || 'Não foi possível registrar o acompanhamento SEFIP.'); return; }
    const updatedPatient = result.client as Patient;
    setPatients((current) => current.map((patient) => patient.id === selected.id ? updatedPatient : patient)); setSelected(updatedPatient); close();
  }
  async function addAppointment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    const { data: sessionData } = await supabase!.auth.getSession();
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({
        clientReference: selected.id,
        clientName: selected.name,
        clientPhone: selected.spaPhone || selected.phone,
        professionalId: String(form.get('professionalId')),
        date: String(form.get('date')),
        startTime: String(form.get('startTime')),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      window.alert(result.error || 'Não foi possível salvar o agendamento.');
      return;
    }
    const updatedPatient = result.client as Patient;
    setPatients((current) => current.map((patient) => patient.id === selected.id ? updatedPatient : patient));
    setSelected(updatedPatient);
    close();
  }
  const visibleNav =
    role === 'administrativo'
      ? ([['Acolhidos', Users], ['Agenda', CalendarDays], ['Relatórios', FileText]] as const)
      : role === 'juridico'
        ? ([['Acolhidos', Users], ['Agenda', CalendarDays], ['Relatórios', FileText]] as const)
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
    <div className="app-shell min-h-screen text-slate-800">
      <aside
        className={`${mobile ? 'translate-x-0' : '-translate-x-full'} app-sidebar fixed inset-y-0 z-40 flex w-64 flex-col border-r border-slate-200/70 bg-white text-slate-700 transition md:translate-x-0`}
      >
        <div className="flex h-24 items-center gap-3 border-b border-slate-100 px-6">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-[#287472]">
            <NotebookPen size={23} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight text-slate-800">
              Projeto de Anamnese
            </div>
            <div className="mt-1 text-xs text-slate-400">Nuvem segura</div>
          </div>
          <button
            className="ml-auto md:hidden"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <nav className="flex-1 space-y-2 p-5">
          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[.16em] text-teal-700/55">
            Consultório
          </p>
          {visibleNav.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                setSelected(null);
                setMobile(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${active === label ? 'border-teal-100 bg-teal-50 text-teal-800' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <Icon size={18} />
              {label}
              {label === 'Acolhidos' && (
                <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-xs text-teal-700 shadow-sm">
                  {patients.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e1b893] text-sm font-bold text-[#6b4126]">
              MT
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{profileName}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {role === 'administrador'
                  ? 'Administrador'
                  : role === 'psicologo'
                    ? 'Psicólogo'
                    : role === 'assistente_social'
                      ? 'Assistente Social'
                      : role === 'juridico'
                        ? 'Jurídico'
                        : 'Administrativo'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="md:ml-64">
        <header className="app-header sticky top-0 z-20 flex h-24 items-center gap-4 border-b border-slate-200/60 bg-white/85 px-6 backdrop-blur-xl md:px-10">
          <button className="md:hidden" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div className="flex-1" />
          <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Ajustar tamanho da fonte">
            <span className="hidden border-r border-slate-200 px-3 text-xs font-semibold text-slate-500 xl:block">Fonte</span>
            <button type="button" onClick={() => changeFontScale(-10)} disabled={fontScale <= 80} title="Reduzir fonte" aria-label="Reduzir tamanho da fonte" className="h-10 px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35">A−</button>
            <span className="hidden min-w-12 border-x border-slate-200 px-2 text-center text-xs font-semibold text-slate-500 sm:block">{fontScale}%</span>
            <button type="button" onClick={() => changeFontScale(10)} disabled={fontScale >= 130} title="Aumentar fonte" aria-label="Aumentar tamanho da fonte" className="h-10 px-3 text-base font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35">A+</button>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
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
        </header>
        <div className="app-content p-6 md:p-10 xl:p-12" style={{ zoom: fontScale / 100 }}>
          {selected && (role === 'administrativo' || role === 'juridico') ? (
            <ClientRegistryView p={selected} role={role} back={() => setSelected(null)} onLegalReferral={() => setModal('legalReferral')} onLegalAttendance={() => setModal('legalAttendance')} onSchedule={() => setModal('appointment')} />
          ) : selected ? (
            <PatientView
              p={selected}
              tab={tab}
              setTab={setTab}
              assessments={selectedAssessments}
              sessions={selectedSessions}
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
              onLegalReferral={(patient) => {
                setSelected(patient);
                setModal('legalReferral');
              }}
              onSchedule={(patient) => {
                setSelected(patient);
                setModal('appointment');
              }}
              open={() => role !== 'juridico' && setModal('patient')}
              canCreate={role !== 'juridico'}
              canRefer={role !== 'juridico'}
              canSchedule={role !== 'juridico'}
              restrictedToReferrals={role === 'juridico'}
            />
          ) : active === 'Agenda' ? (
            <Schedule patients={patients} select={setSelected} role={role} />
          ) : active === 'Relatórios' ? (
            <ReportsPage patients={patients} sessions={sessions} profileName={profileName} profileJobTitle={profileJobTitle} profileCouncil={profileCouncil} />
          ) : (
            <Dashboard
              patients={patients}
              sessions={sessions}
              profileName={profileName}
              professionalCount={professionalCount}
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
      {modal && ((role === 'juridico' && modal === 'legalAttendance') || (role !== 'juridico' && (role !== 'administrativo' || modal === 'patient' || modal === 'legalReferral' || modal === 'sefip' || modal === 'appointment'))) && (
        <Modal
          title={
            modal === 'patient'
              ? 'Cadastrar Acolhido'
              : modal === 'session'
                ? 'Nova atualização'
                : modal === 'assessment'
                  ? 'Aplicar instrumento'
                  : modal === 'legalReferral'
                    ? 'Encaminhar Orientação Jurídica'
                    : modal === 'legalAttendance'
                      ? 'Prontuário de Atendimento Jurídico'
                    : modal === 'sefip'
                      ? 'Acompanhamento SEFIP'
                    : 'Agendar atendimento'
          }
          close={close}
          wide={modal === 'patient' || modal === 'assessment'}
        >
          {modal === 'patient' ? (
            <PatientForm submit={addPatient} />
          ) : modal === 'session' ? (
            <SessionForm submit={addSession} />
          ) : modal === 'legalReferral' ? (
            <LegalReferralForm submit={addLegalReferral} patientName={selected?.name ?? ''} />
          ) : modal === 'legalAttendance' ? (
            <LegalAttendanceForm submit={addLegalAttendance} patientName={selected?.name ?? ''} />
          ) : modal === 'sefip' ? (
            <SefipForm submit={addSefipFollowUp} patientName={selected?.name ?? ''} />
          ) : modal === 'appointment' ? (
            <AppointmentForm submit={addAppointment} patientName={selected?.name ?? ''} />
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
  profileName,
  professionalCount,
  select,
  open,
  openAgenda,
}: {
  patients: Patient[];
  sessions: Session[];
  profileName: string;
  professionalCount: number;
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
            {formatDateBR(todayIso)}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Seja Bem-Vindo, {profileName}.
          </h1>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
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
          icon={Activity}
          label="Sessões no mês"
          value={String(sessionsThisMonth)}
          detail="Calculado pelos registros do mês"
          color="violet"
        />
        <Metric
          icon={UserCog}
          label="Profissionais cadastrados"
          value={String(professionalCount)}
          detail="Psicólogos e assistentes sociais"
          color="amber"
        />
      </div>
      <div className="mt-6">
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
function Schedule({ patients, select, role }: { patients: Patient[]; select: (patient: Patient) => void; role: UserRole }) {
  const [scheduled, setScheduled] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [professionalFilter, setProfessionalFilter] = useState('');
  const [professionalRoleFilter, setProfessionalRoleFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  useEffect(() => {
    let active = true;
    supabase?.auth.getSession().then(async ({ data }) => {
      const response = await fetch('/api/appointments?all=true', { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
      if (response.ok && active) setScheduled(await response.json());
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const today = new Date().toISOString().slice(0, 10);
  const professionalOptions = Array.from(
    new Map(
      scheduled
        .filter((appointment) => !professionalRoleFilter || appointment.professionalRole === professionalRoleFilter)
        .map((appointment) => [appointment.professionalId, appointment.professionalName]),
    ).entries(),
  );
  const filtered = scheduled.filter((appointment) =>
    (!dateFilter || appointment.date === dateFilter) &&
    (!professionalFilter || appointment.professionalId === professionalFilter) &&
    (!professionalRoleFilter || appointment.professionalRole === professionalRoleFilter) &&
    (periodFilter === 'all' ||
      (periodFilter === 'today' && appointment.date === today) ||
      (periodFilter === 'upcoming' && appointment.date >= today) ||
      (periodFilter === 'past' && appointment.date < today)),
  );
  const appointmentsToday = scheduled.filter((appointment) => appointment.date === today).length;
  const upcomingAppointments = scheduled.filter((appointment) => appointment.date >= today).length;
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === 'administrativo'
            ? 'Agenda completa de todos os Psicólogos e Assistentes Sociais.'
            : 'Registros de atendimentos compartilhados entre os profissionais.'}
        </p>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total de registros</p><p className="mt-2 text-3xl font-bold">{scheduled.length}</p></div>
        <div className="panel p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Atendimentos hoje</p><p className="mt-2 text-3xl font-bold text-teal-700">{appointmentsToday}</p></div>
        <div className="panel p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Próximos</p><p className="mt-2 text-3xl font-bold text-sky-700">{upcomingAppointments}</p></div>
      </div>
      <section className="panel overflow-hidden">
        <div className="grid gap-6 border-b border-slate-100 p-7 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Visualizar atendimentos<select value={periodFilter} onChange={(event) => { setPeriodFilter(event.target.value); setDateFilter(''); }} className="h-11 rounded-xl border bg-white px-3 text-sm font-normal normal-case outline-none focus:border-teal-500"><option value="all">Todos os atendimentos agendados</option><option value="today">Atendimentos de hoje</option><option value="upcoming">Próximos atendimentos</option><option value="past">Atendimentos anteriores</option></select></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Filtrar por data<input type="date" lang="pt-BR" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm font-normal normal-case outline-none focus:border-teal-500" /></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Categoria profissional<select value={professionalRoleFilter} onChange={(event) => { setProfessionalRoleFilter(event.target.value); setProfessionalFilter(''); }} className="h-11 rounded-xl border bg-white px-3 text-sm font-normal normal-case outline-none focus:border-teal-500"><option value="">Psicólogos e Assistentes Sociais</option><option value="psicologo">Somente Psicólogos</option><option value="assistente_social">Somente Assistentes Sociais</option></select></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Filtrar por profissional<select value={professionalFilter} onChange={(event) => setProfessionalFilter(event.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm font-normal normal-case outline-none focus:border-teal-500"><option value="">Todos os profissionais</option>{professionalOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        </div>
        {loading ? <p className="p-10 text-center text-sm text-slate-400">Carregando agenda…</p> : filtered.length ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((appointment) => {
              const localPatient = patients.find((patient) => String(patient.id) === appointment.clientReference);
              const phoneDigits = appointment.clientPhone.replace(/\D/g, '');
              const whatsappPhone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits.replace(/^0/, '')}`;
              const formattedDate = formatDateBR(appointment.date);
              const whatsappMessage = encodeURIComponent(`Olá, ${appointment.clientName}. Confirmamos seu atendimento em ${formattedDate}, às ${appointment.startTime}, com ${appointment.professionalName}.`);
              return (
              <div key={appointment.id} className="grid w-full gap-3 p-5 text-left hover:bg-slate-50 sm:grid-cols-[140px_1fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-bold text-teal-700">{formattedDate}</p>
                  <p className="text-sm text-slate-500">{appointment.startTime}–{appointment.endTime}</p>
                </div>
                <div><p className="font-semibold">{appointment.clientName}</p><p className="text-xs text-slate-500">{appointment.clientPhone}</p></div>
                <div><p className="font-medium">{appointment.professionalName}</p><p className="text-xs text-slate-500">{appointment.professionalRole === 'psicologo' ? 'Psicólogo' : 'Assistente Social'}</p></div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-center text-xs font-semibold capitalize text-teal-700">{appointment.status}</span>
                  <a href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white" aria-label={`Enviar WhatsApp para ${appointment.clientName}`}>
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                  {localPatient && <button type="button" onClick={() => select(localPatient)} className="grid h-9 w-9 place-items-center rounded-lg border text-slate-500" aria-label={`Abrir prontuário de ${appointment.clientName}`}><ChevronRight size={18} /></button>}
                </div>
              </div>
              );
            })}
          </div>
        ) : <p className="p-10 text-center text-sm text-slate-400">Nenhum registro encontrado para os filtros selecionados.</p>}
      </section>
    </div>
  );
}

function ReportsPage({ patients, sessions, profileName, profileJobTitle, profileCouncil }: { patients: Patient[]; sessions: Session[]; profileName: string; profileJobTitle: string; profileCouncil: string }) {
  const [reportType, setReportType] = useState<'declaration' | 'attendance' | 'sefip'>('declaration');
  const [patientId, setPatientId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [city, setCity] = useState('');
  const [attendanceMode, setAttendanceMode] = useState<'Virtual' | 'Presencial' | ''>('');
  const patient = patients.find((item) => String(item.id) === patientId);
  const patientSessions = sessions
    .filter((session) => String(session.patientId) === patientId)
    .sort((a, b) => String(a.isoDate ?? a.date).localeCompare(String(b.isoDate ?? b.date)));
  const formatDate = (value: string) => formatDateBR(value) || '__/__/____';
  const issuingProfessional = profileName;
  const sefipPatients = patients.filter((item) => String(item.sefip ?? '').trim().toLowerCase() === 'sim');

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="mt-1 text-sm text-slate-500">Emita documentos a partir dos dados e atendimentos registrados.</p>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <button type="button" onClick={() => setReportType('declaration')} className={`rounded-2xl border p-5 text-left transition ${reportType === 'declaration' ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
          <p className="font-bold text-slate-800">Declaração de Comparecimento</p>
          <p className="mt-1 text-sm text-slate-500">Comprova a presença do Acolhido em uma data e horário.</p>
        </button>
        <button type="button" onClick={() => setReportType('attendance')} className={`rounded-2xl border p-5 text-left transition ${reportType === 'attendance' ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
          <p className="font-bold text-slate-800">Relatório de Atendimento</p>
          <p className="mt-1 text-sm text-slate-500">Apresenta o número de atendimentos e suas respectivas datas.</p>
        </button>
        <button type="button" onClick={() => setReportType('sefip')} className={`rounded-2xl border p-5 text-left transition ${reportType === 'sefip' ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
          <p className="font-bold text-slate-800">Relatório SEFIP</p>
          <p className="mt-1 text-sm text-slate-500">Lista os Acolhidos com SEFIP marcado como Sim.</p>
        </button>
      </div>
      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        <section className="panel h-fit space-y-4 p-6 print:hidden">
          <h2 className="font-bold">Dados do documento</h2>
          <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Emissão vinculada ao usuário logado</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{issuingProfessional}</p>
            <p className="mt-1 text-xs text-slate-600">{profileJobTitle || 'Cargo não informado'}{profileCouncil ? ` · ${profileCouncil}` : ''}</p>
          </div>
          {reportType !== 'sefip' && <>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Acolhido
              <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
                <option value="">Selecione o Acolhido</option>
                {patients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Modalidade do atendimento
              <select value={attendanceMode} onChange={(event) => setAttendanceMode(event.target.value as 'Virtual' | 'Presencial' | '')} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
                <option value="">Selecione a modalidade</option>
                <option value="Virtual">Atendimento Virtual</option>
                <option value="Presencial">Atendimento Presencial</option>
              </select>
            </label>
          </>}
          {reportType === 'declaration' && (
            <>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Data do comparecimento<input type="date" lang="pt-BR" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">Horário inicial<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">Horário final<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
              </div>
            </>
          )}
          {reportType !== 'sefip' && <label className="grid gap-2 text-sm font-semibold text-slate-700">Cidade de emissão<input value={city} onChange={(event) => setCity(event.target.value)} placeholder={patient?.municipality || 'Informe a cidade'} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>}
          <button type="button" disabled={reportType !== 'sefip' && (!patient || !attendanceMode)} onClick={() => window.print()} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#176a68] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Printer size={17} /> Imprimir ou salvar em PDF</button>
        </section>

        <section className="report-print-area min-h-[720px] rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm sm:px-14 sm:py-14">
          <div className="border-b border-slate-200 pb-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><NotebookPen size={25} /></div>
            <p className="font-bold text-slate-900">Projeto de Anamnese</p>
            <p className="text-xs text-slate-500">Registro de atendimento</p>
          </div>
          {reportType === 'sefip' ? (
            <div className="pt-12 text-slate-800">
              <h2 className="text-center text-xl font-bold uppercase tracking-wide">Relatório de Acolhidos com SEFIP</h2>
              <p className="mt-3 text-center text-sm text-slate-500">Acolhidos cujo cadastro possui SEFIP marcado como Sim.</p>
              <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
                {sefipPatients.length ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Acolhido</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Nascimento</th><th className="px-4 py-3">Município</th><th className="px-4 py-3">Telefone</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{sefipPatients.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold">{item.name}</td><td className="px-4 py-3">{item.document || 'Não informado'}</td><td className="px-4 py-3">{item.birth ? formatDate(item.birth) : 'Não informado'}</td><td className="px-4 py-3">{item.municipality || 'Não informado'}</td><td className="px-4 py-3">{item.phone || 'Não informado'}</td></tr>)}</tbody>
                  </table>
                ) : <p className="p-6 text-center text-sm text-slate-500">Nenhum Acolhido com SEFIP marcado como Sim.</p>}
              </div>
              <p className="mt-6 text-right text-sm">Total: <b>{sefipPatients.length}</b> Acolhido(s)</p>
              <p className="mt-10 text-right">{formatDate(new Date().toISOString().slice(0, 10))}.</p>
              <div className="mx-auto mt-24 max-w-sm border-t border-slate-500 pt-3 text-center"><p className="font-semibold">{issuingProfessional}</p><p className="text-sm text-slate-600">{profileJobTitle || 'Cargo não informado'}</p>{profileCouncil && <p className="text-sm text-slate-600">{profileCouncil}</p>}<p className="mt-1 text-xs text-slate-500">Usuário responsável pela emissão</p></div>
            </div>
          ) : !patient ? (
            <div className="grid min-h-[480px] place-items-center text-center text-sm text-slate-400">Selecione um Acolhido para gerar o documento.</div>
          ) : reportType === 'declaration' ? (
            <div className="pt-12 text-slate-800">
              <h2 className="text-center text-xl font-bold uppercase tracking-wide">Declaração de Comparecimento</h2>
              <p className="mt-12 text-justify leading-8">
                Declaramos, para os devidos fins, que <b>{patient.name}</b>{patient.document ? <>, documento de identificação <b>{patient.document}</b></> : null}, compareceu para atendimento <b>{attendanceMode ? attendanceMode.toLocaleLowerCase('pt-BR') : 'com modalidade não informada'}</b> no dia <b>{formatDate(attendanceDate)}</b>{startTime ? <> no período de <b>{startTime}</b>{endTime ? <> às <b>{endTime}</b></> : null}</> : null}.
              </p>
              <p className="mt-10 text-right">{city || patient.municipality || '________________'}, {formatDate(new Date().toISOString().slice(0, 10))}.</p>
              <div className="mx-auto mt-28 max-w-sm border-t border-slate-500 pt-3 text-center">
                <p className="font-semibold">{issuingProfessional}</p>
                <p className="text-sm text-slate-600">{profileJobTitle || 'Cargo não informado'}</p>
                {profileCouncil && <p className="text-sm text-slate-600">{profileCouncil}</p>}
                <p className="mt-1 text-xs text-slate-500">Usuário responsável pela emissão</p>
              </div>
            </div>
          ) : (
            <div className="pt-12 text-slate-800">
              <h2 className="text-center text-xl font-bold uppercase tracking-wide">Relatório de Atendimento</h2>
              <div className="mt-10 grid gap-3 rounded-xl border border-slate-200 p-5 sm:grid-cols-3">
                <div><p className="text-xs font-bold uppercase text-slate-400">Acolhido</p><p className="mt-1 font-semibold">{patient.name}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Modalidade</p><p className="mt-1 font-semibold">{attendanceMode ? `Atendimento ${attendanceMode}` : 'Não informada'}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Total de atendimentos</p><p className="mt-1 font-semibold">{patientSessions.length}</p></div>
              </div>
              <h3 className="mt-8 font-bold">Datas dos atendimentos</h3>
              {patientSessions.length ? (
                <ol className="mt-4 space-y-3">
                  {patientSessions.map((session, index) => <li key={session.id} className="flex justify-between border-b border-slate-100 pb-3"><span>{index + 1}. {formatDateBR(session.isoDate ?? session.date)}</span><span className="text-slate-500">{session.time}</span></li>)}
                </ol>
              ) : <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Nenhum atendimento registrado para este Acolhido.</p>}
              <p className="mt-10 text-right">{city || patient.municipality || '________________'}, {formatDate(new Date().toISOString().slice(0, 10))}.</p>
              <div className="mx-auto mt-24 max-w-sm border-t border-slate-500 pt-3 text-center">
                <p className="font-semibold">{issuingProfessional}</p>
                <p className="text-sm text-slate-600">{profileJobTitle || 'Cargo não informado'}</p>
                {profileCouncil && <p className="text-sm text-slate-600">{profileCouncil}</p>}
                <p className="mt-1 text-xs text-slate-500">Usuário responsável pela emissão</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Patients({
  patients,
  query,
  setQuery,
  select,
  onLegalReferral,
  onSchedule,
  open,
  canCreate,
  canRefer,
  canSchedule,
  restrictedToReferrals,
}: {
  patients: Patient[];
  query: string;
  setQuery: (s: string) => void;
  select: (p: Patient) => void;
  onLegalReferral: (p: Patient) => void;
  onSchedule: (p: Patient) => void;
  open: () => void;
  canCreate: boolean;
  canRefer: boolean;
  canSchedule: boolean;
  restrictedToReferrals: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Acolhidos</h1>
          <p className="mt-1 text-sm text-slate-500">
            {restrictedToReferrals
              ? 'Somente Acolhidos encaminhados para Orientação Jurídica.'
              : 'Cadastros e prontuários sob sua responsabilidade.'}
          </p>
        </div>
        {canCreate && <button type="button" onClick={open} className="flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17} /> Incluir Acolhido</button>}
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
        <div className="grid gap-5 border-t border-slate-100 p-7 md:grid-cols-2">
          {patients.map((p) => (
            <div key={p.id} className="group rounded-2xl border border-slate-200 p-2 hover:border-teal-300">
              <button onClick={() => select(p)} className="flex w-full min-w-0 items-center gap-4 p-2 text-left">
                <PatientName p={p} />
                <ChevronRight className="ml-auto text-slate-300" size={18} />
              </button>
              {canRefer && (
                <button type="button" onClick={() => onLegalReferral(p)} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                  <Gavel size={15} /> Encaminhar Orientação Jurídica
                </button>
              )}
              {canSchedule && (
                <button type="button" onClick={() => onSchedule(p)} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                  <CalendarDays size={15} /> Agendar atendimento
                </button>
              )}
            </div>
          ))}
          {patients.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              {restrictedToReferrals
                ? 'Nenhum Acolhido foi encaminhado para Orientação Jurídica.'
                : 'Nenhum Acolhido encontrado.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function ClientRegistryView({ p, role, back, onLegalReferral, onLegalAttendance, onSchedule }: { p: Patient; role: UserRole; back: () => void; onLegalReferral: () => void; onLegalAttendance: () => void; onSchedule: () => void }) {
  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={back} className="mb-4 text-sm font-medium text-slate-500">
        ← Voltar para Acolhidos
      </button>
      <section className="panel p-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <PatientName p={p} />
          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {role === 'juridico' ? 'Atendimento jurídico' : 'Cadastro, agenda e encaminhamento'}
          </span>
          {role !== 'juridico' && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onSchedule} className="flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white">
                <CalendarDays size={17} /> Agendar atendimento
              </button>
              <button type="button" onClick={onLegalReferral} className="flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white">
                <Gavel size={17} /> Encaminhar Orientação Jurídica
              </button>
            </div>
          )}
          {role === 'juridico' && (
            <button type="button" onClick={onLegalAttendance} className="flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white">
              <Gavel size={17} /> Registrar atendimento jurídico
            </button>
          )}
        </div>
        <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">
          {[
            ['Data', formatDateBR(p.registrationDate)],
            ['Nome do solicitante', p.requesterName],
            ['Vínculo do solicitante', p.requesterRelationship],
            ['Telefone do solicitante', p.phone],
            ['E-mail do solicitante', p.requesterEmail],
            ['Acolhido', p.name],
            ['E-mail (SPA)', p.email],
            ['Telefone (SPA)', p.spaPhone],
            ['Data de nascimento', formatDateBR(p.birth)],
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
            ['Data do atendimento', formatDateBR(p.appointmentDate)],
            ['Horário do atendimento', p.appointmentTime],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-sm text-slate-700">{value || 'Não informado'}</p>
            </div>
          ))}
        </div>
        <LegalReferralsPanel referrals={p.legalReferrals ?? []} />
        {role === 'juridico' && <LegalAttendancesPanel attendances={p.legalAttendances ?? []} />}
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
  const roleLabel = { administrador: 'Administrador', psicologo: 'Psicólogo', assistente_social: 'Assistente Social', administrativo: 'Administrativo', juridico: 'Jurídico' };
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Usuários e perfis</h1>
        <p className="mt-1 text-sm text-slate-500">Cadastre profissionais, verifique e atribua seus níveis de acesso.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        {viewingUser ? <section className="panel overflow-hidden">
          <div className="panel-head"><div><h2>Perfil do usuário</h2><p>Dados cadastrais e nível de acesso</p></div><button type="button" onClick={() => setViewingUser(null)} className="text-sm font-semibold text-teal-700">Novo usuário</button></div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {[['Nome completo', viewingUser.fullName], ['E-mail', viewingUser.email], ['Perfil de acesso', roleLabel[viewingUser.role]], ['Situação da atividade', viewingUser.blocked ? 'Suspensa' : 'Ativa'], ['Cargo', viewingUser.jobTitle], ['Conselho Regional', viewingUser.council], ['Disponibilidade', viewingUser.availabilityStart && viewingUser.availabilityEnd ? `${viewingUser.availabilityStart} às ${viewingUser.availabilityEnd}` : ''], ['WhatsApp', viewingUser.whatsapp], ['Município', viewingUser.municipality], ['Endereço comercial', viewingUser.businessAddress]].map(([label, value]) => <div key={label} className={label === 'Endereço comercial' ? 'sm:col-span-2' : ''}><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-700">{value || 'Não informado'}</p></div>)}
          </div>
        </section> : <form onSubmit={create} autoComplete="off" className="panel space-y-4 p-6">
          <h2 className="text-lg font-bold">Novo usuário</h2>
          <Field label="Nome completo" name="fullName" />
          <Field label="Cargo" name="jobTitle" />
          {['psicologo', 'assistente_social', 'juridico'].includes(newUserRole) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Conselho Regional
                <select required name="councilType" className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal" defaultValue="">
                  <option value="">Selecione</option>
                  <option value="CRP">CRP — Psicologia</option>
                  <option value="CRESS">CRESS — Serviço Social</option>
                  <option value="OAB">OAB — Advocacia</option>
                </select>
              </label>
              <Field label="Número do Conselho" name="council" placeholder="Digite o número e a região" />
            </div>
          )}
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
              <option value="administrativo">Administrativo — consulta de Acolhidos</option>
              <option value="juridico">Jurídico — consulta, agenda e relatórios</option>
            </select>
          </label>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            O novo usuário será criado como <b>suspenso</b>. Libere o acesso pelo botão “Desbloquear” na lista de usuários.
          </div>
          <button className="h-11 w-full rounded-xl bg-[#176a68] font-semibold text-white">Criar usuário</button>
          {message && <p className="text-sm text-slate-500">{message}</p>}
        </form>}
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
                    <p className={`mt-1 text-xs font-semibold ${user.blocked ? 'text-amber-700' : 'text-emerald-700'}`}>{user.blocked ? 'Atividade suspensa — aguardando desbloqueio' : 'Atividade liberada'}</p>
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
                      <option value="juridico">Jurídico</option>
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
                      <Ban size={15} /> {user.blocked ? 'Desbloquear' : 'Bloquear'}
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
  open: (m: 'session' | 'assessment' | 'legalReferral' | 'appointment') => void;
}) {
  const tabs = ['Resumo', 'Anamnese', 'Evolução', 'Avaliações'];
  const clinicalSummary = anamnesis?.psychosocialAnswers?.q72?.trim() ?? '';
  const anamnesisStarted = Boolean(anamnesis?.psychosocialAnswers && Object.values(anamnesis.psychosocialAnswers).some((answer) => answer.trim()));
  const workflowSteps = [
    { label: 'Cadastro', complete: true, action: () => setTab('Resumo') },
    { label: 'Agendamento', complete: Boolean(p.appointmentDate && p.appointmentTime && p.assignedProfessionalId), action: () => open('appointment') },
    { label: 'Anamnese', complete: anamnesisStarted, action: () => setTab('Anamnese') },
    { label: 'ASSIST', complete: assessments.length > 0, action: () => assessments.length ? setTab('Avaliações') : open('assessment') },
    { label: 'Atendimento', complete: sessions.length > 0, action: () => sessions.length ? setTab('Evolução') : open('session') },
  ];
  const nextWorkflowStep = workflowSteps.find((step) => !step.complete);
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
              <h1 className="text-2xl font-bold text-white">{p.name}</h1>
              <p className="text-sm text-slate-500">
                {p.age} anos · {formatDateBR(p.birth)} · {p.document}
              </p>
            </div>
            <div className="mb-1 flex flex-wrap gap-2">
              <button
                onClick={() => open('appointment')}
                className="flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
              >
                <CalendarDays size={17} />
                Agendar atendimento
              </button>
              <button
                onClick={() => open('legalReferral')}
                className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <Gavel size={17} />
                Encaminhar Orientação Jurídica
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                <Trash2 size={17} />
                Apagar Acolhido
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
      <section className="panel mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-800">Fluxo do atendimento</h2>
            <p className="mt-1 text-xs text-slate-500">Acompanhe as etapas e acesse diretamente o próximo registro.</p>
          </div>
          {nextWorkflowStep ? (
            <button type="button" onClick={nextWorkflowStep.action} className="rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white">
              Próxima etapa: {nextWorkflowStep.label}
            </button>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><CheckCircle2 size={16} /> Fluxo completo</span>
          )}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <button key={step.label} type="button" onClick={step.action} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${step.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700'}`}>
              {step.complete ? <CheckCircle2 size={17} className="shrink-0" /> : <span className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border text-[9px]">{index + 1}</span>}
              <span><span className="block">{step.label}</span><span className="mt-0.5 block text-[10px] font-normal opacity-75">{step.complete ? 'Concluído' : 'Pendente'}</span></span>
            </button>
          ))}
        </div>
      </section>
      {tab === 'Resumo' && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
          <section className="panel p-6">
            <h2 className="mb-5 text-lg font-bold">Identificação do Acolhido</h2>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Data', formatDateBR(p.registrationDate)],
                ['Solicitante', p.requesterName],
                ['Vínculo', p.requesterRelationship],
                ['Telefone do solicitante', p.phone],
                ['E-mail do solicitante', p.requesterEmail],
                ['E-mail (SPA)', p.email],
                ['Telefone (SPA)', p.spaPhone],
                ['Documento', p.document],
                ['Data de nascimento', formatDateBR(p.birth)],
                ['Idade', p.age ? `${p.age} anos` : ''],
                ['Sexo SPA', p.genderSpa],
                ['Estado civil', p.maritalStatus],
                ['Estado (UF)', p.stateSpa],
                ['Município', p.municipality],
                ['Profissional responsável', p.assignedProfessionalName],
                ['Atendimento agendado', p.appointmentDate && p.appointmentTime ? `${formatDateBR(p.appointmentDate)} às ${p.appointmentTime}` : ''],
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
            {clinicalSummary ? (
              <Info title="Compreensão do entrevistador sobre a pessoa" text={clinicalSummary} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-400">
                O resumo clínico será apresentado após a realização da anamnese e o preenchimento do campo 72.
              </div>
            )}
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
            <div className="mt-6">
              <LegalReferralsPanel referrals={p.legalReferrals ?? []} compact />
            </div>
          </section>
        </div>
      )}
      {tab === 'Anamnese' && (
        <PsychosocialAnamnesisForm
          patient={p}
          value={anamnesis}
          assistCount={assessments.length}
          onSave={saveAnamnesis}
          openAssist={() => open('assessment')}
        />
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
                <h3 className="font-bold">{formatDateBR(s.isoDate ?? s.date)}</h3>
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
                  <span className="text-xs text-slate-400">{formatDateBR(a.date)}</span>
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
  const [registrationRole, setRegistrationRole] = useState<'psicologo' | 'assistente_social' | 'administrativo' | 'juridico'>('psicologo');
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
    setError('Conta criada com sucesso. Aguarde o desbloqueio pelo Administrador para entrar.');
    setLoading(false);
  }
  return (
    <main className="grid min-h-screen bg-[#f8fbfa] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-teal-100/70 bg-[#edf7f3] p-14 text-slate-800 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[60px] border-teal-600/5" />
        <div className="absolute -bottom-32 left-20 h-96 w-96 rounded-full bg-teal-300/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d9f0e8] text-[#19595a]">
            <NotebookPen size={25} />
          </div>
          <div>
            <p className="font-bold">Projeto de Anamnese</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-white text-teal-700 shadow-sm">
            <ShieldCheck size={27} />
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Registro de Entrevista/Anamnese Psicológica Online
          </h1>
        </div>
        <p className="relative text-sm text-slate-500">
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
              <select required name="role" value={registrationRole} onChange={(event) => setRegistrationRole(event.target.value as 'psicologo' | 'assistente_social' | 'administrativo' | 'juridico')} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
                <option value="psicologo">Psicólogo</option>
                <option value="assistente_social">Assistente Social</option>
                <option value="administrativo">Administrativo</option>
                <option value="juridico">Jurídico</option>
              </select>
            </label>
            {['psicologo', 'assistente_social', 'juridico'].includes(registrationRole) && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Conselho Regional
                    <select required name="councilType" defaultValue="" className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
                      <option value="">Selecione</option>
                      <option value="CRP">CRP — Psicologia</option>
                      <option value="CRESS">CRESS — Serviço Social</option>
                      <option value="OAB">OAB — Advocacia</option>
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

function PsychosocialAnamnesisForm({
  patient,
  value,
  assistCount,
  onSave,
  openAssist,
}: {
  patient: Patient;
  value?: AnamnesisRecord;
  assistCount: number;
  onSave: (record: AnamnesisRecord) => void;
  openAssist: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const answers = value?.psychosocialAnswers ?? {};
  const defaults: Record<string, string> = {};
  const answer = (key: string) => answers[key] ?? defaults[key] ?? '';
  function collectAnswers(form: HTMLFormElement) {
    const data = new FormData(form);
    const psychosocialAnswers: Record<string, string> = {};
    for (const [key, raw] of data.entries()) {
      const text = String(raw);
      psychosocialAnswers[key] = psychosocialAnswers[key] ? `${psychosocialAnswers[key]}, ${text}` : text;
    }
    return psychosocialAnswers;
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ ...(value ?? {}), patientId: patient.id, psychosocialAnswers: collectAnswers(event.currentTarget), updatedAt: new Date().toISOString() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }
  return (
    <form onSubmit={submit} onChange={(event) => onSave({ ...(value ?? {}), patientId: patient.id, psychosocialAnswers: collectAnswers(event.currentTarget), updatedAt: new Date().toISOString() })} className="panel mt-6 overflow-hidden">
      <div className="sticky top-20 z-10 border-b bg-white/95 px-6 py-5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold">Anamnese Psicossocial Individual</h2><p className="text-sm text-slate-500">64 questões e instrumento ASSIST organizados em 6 blocos clínicos</p></div>
          <button className="rounded-xl bg-[#176a68] px-5 py-2.5 text-sm font-semibold text-white">{saved ? 'Salvo com sucesso' : 'Salvar anamnese'}</button>
        </div>
        <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Nome', patient.name],
            ['Sexo', patient.genderSpa],
            ['Data de nascimento', formatDateBR(patient.birth)],
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
                return <div key={key} className="grid gap-6">
                  <div className="grid gap-2"><label className="text-sm font-semibold text-slate-700"><span className="mr-2 text-xs font-bold text-teal-700">{question.id}.</span>{question.label}</label>
                  {question.type === 'textarea' ? <textarea name={key} defaultValue={answer(key)} rows={3} className="rounded-xl border bg-white p-3 text-sm outline-none focus:border-teal-500" />
                  : question.type === 'select' ? <select name={key} defaultValue={answer(key)} className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:border-teal-500"><option value="">Selecione</option>{question.options?.map((option) => <option key={option}>{option}</option>)}</select>
                  : question.type === 'multi' ? <div className="grid gap-2 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">{question.options?.map((option) => <label key={option} className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" name={key} value={option} defaultChecked={answer(key).split(', ').includes(option)} className="h-4 w-4 accent-teal-700" />{option}</label>)}</div>
                  : question.type === 'matrix' ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[540px] text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-3 text-left">Item</th>{question.columns?.map((column) => <th key={column} className="px-3 py-3 text-center">{column}</th>)}</tr></thead><tbody>{question.rows?.map((row) => <tr key={row} className="border-t"><td className="px-3 py-3 font-medium">{row}</td>{question.columns?.map((column) => <td key={column} className="px-3 py-3 text-center"><input required type="radio" name={`${key}__${row}`} value={column} defaultChecked={answer(`${key}__${row}`) === column} className="h-4 w-4 accent-teal-700" /></td>)}</tr>)}</tbody></table></div>
                  : <input name={key} type={question.type === 'date' ? 'date' : 'text'} lang={question.type === 'date' ? 'pt-BR' : undefined} defaultValue={answer(key)} className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:border-teal-500" />}
                  </div>
                  {question.id === 14 && (
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><ClipboardCheck size={20} /></span>
                          <div>
                            <h4 className="font-bold text-slate-800">Instrumento ASSIST</h4>
                            <p className="mt-1 text-sm text-slate-600">Avalie o uso de substâncias com cálculo e interpretação automáticos.</p>
                            <p className="mt-1 text-xs font-medium text-teal-700">{assistCount} {assistCount === 1 ? 'aplicação registrada' : 'aplicações registradas'} para este Acolhido.</p>
                          </div>
                        </div>
                        <button type="button" onClick={openAssist} className="shrink-0 rounded-xl bg-[#176a68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#125755]">Preencher ASSIST</button>
                      </div>
                    </div>
                  )}
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
              ? `Última atualização: ${formatDateTimeBR(value.updatedAt)}`
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
              value={`${formatDateBR(patient.birth)} — ${patient.age} anos`}
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
        lang={type === 'date' ? 'pt-BR' : undefined}
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
function LegalReferralsPanel({ referrals, compact = false }: { referrals: LegalReferral[]; compact?: boolean }) {
  return (
    <div className={compact ? '' : 'mt-8 border-t pt-6'}>
      <div className="mb-4 flex items-center gap-2">
        <Gavel size={18} className="text-indigo-700" />
        <h2 className="font-bold">Encaminhamentos para Orientação Jurídica</h2>
      </div>
      {referrals.length ? (
        <div className="space-y-3">
          {referrals.map((referral) => (
            <article key={referral.id} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-500">{formatDateBR(referral.date)} · Solicitado por {referral.requestedBy}</p>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{referral.status}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{referral.reason}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">Nenhum encaminhamento jurídico registrado.</p>
      )}
    </div>
  );
}
function LegalAttendancesPanel({ attendances }: { attendances: LegalAttendance[] }) {
  return (
    <div className="mt-8 border-t pt-6">
      <div className="mb-4 flex items-center gap-2">
        <NotebookPen size={18} className="text-teal-700" />
        <h2 className="font-bold">Prontuário de Atendimento Jurídico</h2>
      </div>
      {attendances.length ? (
        <div className="space-y-4">
          {attendances.map((attendance) => (
            <article key={attendance.id} className="rounded-2xl border border-teal-100 bg-teal-50/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">{formatDateBR(attendance.date)} às {attendance.time} · {attendance.recordedBy}</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700">{attendance.mode}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Info title="Demanda apresentada" text={attendance.demand} />
                <Info title="Orientações prestadas" text={attendance.guidance} />
                <Info title="Providências adotadas" text={attendance.actions} />
                <Info title="Próximos passos" text={attendance.nextSteps} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">Nenhum atendimento jurídico registrado.</p>
      )}
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
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-5">
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
  required = true,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  readOnly?: boolean;
}) => (
  <label className="grid gap-1.5 text-sm font-semibold">
    {label}
    <input
      required={required}
      name={name}
      type={type}
      lang={type === 'date' ? 'pt-BR' : undefined}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      autoComplete={autoComplete ?? (type === 'password' ? 'new-password' : 'off')}
      placeholder={placeholder}
      className={`h-11 rounded-xl border px-3 font-normal outline-none focus:border-teal-500 ${readOnly ? 'bg-slate-50 text-slate-600' : 'bg-white'}`}
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
  const [requesterName, setRequesterName] = useState('');
  const [requesterRelationship, setRequesterRelationship] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [spaName, setSpaName] = useState('');
  const [spaPhone, setSpaPhone] = useState('');
  const [spaEmail, setSpaEmail] = useState('');
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
  const requesterIsSpaUser = requesterRelationship === 'Próprio Usuário';
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
            const [startHour, startMinute] = appointment.startTime.split(':').map(Number);
            const [endHour, endMinute] = appointment.endTime.split(':').map(Number);
            const start = startHour * 60 + startMinute;
            const end = endHour * 60 + endMinute;
            const slots: string[] = [];
            for (let slot = start - 60; slot < end; slot += 30) {
              if (slot >= 0) slots.push(`${String(Math.floor(slot / 60)).padStart(2, '0')}:${String(slot % 60).padStart(2, '0')}`);
            }
            return slots;
          }));
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
          <input required name="registrationDate" type="date" lang="pt-BR" defaultValue={todayValue} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" />
        </label>
      </div>
      <FormSection number="1" title="Dados do solicitante" description="Identifique quem realizou o contato inicial.">
        <Field label="Nome do solicitante" name="requesterName" value={requesterName} onChange={(event) => setRequesterName(event.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-semibold">
            Vínculo do solicitante
            <select required name="requesterRelationship" value={requesterRelationship} onChange={(event) => setRequesterRelationship(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
              <option value="">Selecione</option>
              {['Cônjuge', 'Irmão(ã)', 'Filho(a)', 'Amigo(a)', 'Avô(ó)', 'Madrasta', 'Cunhado(a)', 'Mãe', 'Namorado(a)', 'Outro', 'Padrasto', 'Pai', 'Primo(a)', 'Profissional da rede', 'Tio(a)', 'Vizinho(a)', 'Próprio Usuário'].map((relationship) => <option key={relationship} value={relationship}>{relationship}</option>)}
            </select>
          </label>
          <Field label="Telefone do solicitante" name="phone" type="tel" value={requesterPhone} onChange={(event) => setRequesterPhone(event.target.value)} />
          <Field label="E-mail do solicitante (opcional)" name="requesterEmail" type="email" required={false} value={requesterEmail} onChange={(event) => setRequesterEmail(event.target.value)} />
        </div>
      </FormSection>

      <FormSection number="2" title="Dados do Acolhido" description="Dados pessoais da pessoa que receberá o atendimento.">
        {requesterIsSpaUser && <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">Os dados do solicitante foram repetidos automaticamente para o Acolhido.</p>}
        <Field label="Acolhido" name="name" value={requesterIsSpaUser ? requesterName : spaName} onChange={(event) => setSpaName(event.target.value)} readOnly={requesterIsSpaUser} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail do acolhido (opcional)" name="email" type="email" required={false} value={requesterIsSpaUser ? requesterEmail : spaEmail} onChange={(event) => setSpaEmail(event.target.value)} readOnly={requesterIsSpaUser} />
          <Field label="Telefone do acolhido" name="spaPhone" type="tel" value={requesterIsSpaUser ? requesterPhone : spaPhone} onChange={(event) => setSpaPhone(event.target.value)} readOnly={requesterIsSpaUser} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Documento de identificação" name="document" />
          <label className="grid gap-1.5 text-sm font-semibold">Data de nascimento<input required name="birth" type="date" lang="pt-BR" max={todayValue} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Idade<input required readOnly name="age" type="number" value={calculatedAge} placeholder="Automática" className="h-11 rounded-xl border bg-slate-50 px-3 font-normal text-slate-600 outline-none" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Sexo do acolhido" name="genderSpa" options={['Feminino', 'Masculino', 'Não binário', 'Outro', 'Não informado']} />
          <SelectField label="Estado civil" name="maritalStatus" options={['Solteiro(a)', 'Casado(a)', 'União estável', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Outro', 'Não informado']} />
        </div>
        <SelectField label="SEFIP" name="sefip" options={['Sim', 'Não']} />
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
          <label className="grid gap-1.5 text-sm font-semibold">Data do atendimento<input required name="appointmentDate" type="date" lang="pt-BR" min={todayValue} value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
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
function LegalReferralForm({ submit, patientName }: { submit: (e: React.FormEvent<HTMLFormElement>) => void; patientName: string }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return (
    <form onSubmit={submit} className="grid gap-5 p-6">
      <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">
        <p className="font-semibold">Acolhido: {patientName}</p>
        <p className="mt-1 text-xs">Descreva objetivamente a necessidade de atendimento pela equipe jurídica.</p>
      </div>
      <Field label="Data do encaminhamento" name="date" type="date" value={today} readOnly />
      <Text label="Motivos e justificativa do atendimento jurídico" name="reason" />
      <Submit label="Registrar encaminhamento" />
    </form>
  );
}
function LegalAttendanceForm({ submit, patientName }: { submit: (e: React.FormEvent<HTMLFormElement>) => void; patientName: string }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return (
    <form onSubmit={submit} className="grid gap-5 p-6">
      <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">
        <p className="font-semibold">Acolhido: {patientName}</p>
        <p className="mt-1 text-xs">Registro restrito ao atendimento jurídico. Evite inserir informações clínicas que não sejam necessárias.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Data do atendimento" name="date" type="date" value={today} readOnly />
        <Field label="Horário" name="time" type="time" value={currentTime} />
        <label className="grid gap-1.5 text-sm font-semibold">
          Modalidade
          <select required name="mode" defaultValue="" className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500">
            <option value="">Selecione</option>
            <option>Presencial</option>
            <option>Virtual</option>
          </select>
        </label>
      </div>
      <Text label="Demanda apresentada / motivo do atendimento" name="demand" />
      <Text label="Orientações prestadas" name="guidance" />
      <Text label="Providências adotadas" name="actions" />
      <Text label="Próximos passos" name="nextSteps" />
      <Submit label="Salvar atendimento jurídico" />
    </form>
  );
}
function SefipForm({ submit, patientName }: { submit: (e: React.FormEvent<HTMLFormElement>) => void; patientName: string }) {
  const today = new Date().toISOString().slice(0, 10);
  return <form onSubmit={submit} className="grid gap-5 p-6">
    <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800"><p className="font-semibold">Acolhido: {patientName}</p><p className="mt-1 text-xs">Registre o acompanhamento do encaminhamento e a articulação com a rede de saúde.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Data do acompanhamento" name="date" type="date" value={today} readOnly /><label className="grid gap-1.5 text-sm font-semibold">Serviço de encaminhamento<select required name="service" className="h-11 rounded-xl border bg-white px-3 font-normal"><option value="">Selecione</option><option>Unidade de Saúde</option><option>RAPS</option><option>Comunidade Terapêutica</option></select></label></div>
    <Field label="Unidade / serviço" name="unit" placeholder="Nome da unidade ou serviço" />
    <label className="grid gap-1.5 text-sm font-semibold">Situação do encaminhamento<select required name="status" className="h-11 rounded-xl border bg-white px-3 font-normal"><option value="">Selecione</option><option>Encaminhado</option><option>Em acompanhamento</option><option>Atendido</option><option>Não compareceu</option><option>Contrarreferência recebida</option></select></label>
    <Text label="Registro do acompanhamento" name="notes" /><Text label="Próximos passos" name="nextSteps" /><Submit label="Registrar acompanhamento SEFIP" />
  </form>;
}
function AppointmentForm({ submit, patientName }: { submit: (e: React.FormEvent<HTMLFormElement>) => void; patientName: string }) {
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [busyTimes, setBusyTimes] = useState<string[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
      try {
        const response = await fetch('/api/professionals', { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
        if (response.ok && active) setProfessionals(await response.json());
      } finally {
        if (active) setLoadingProfessionals(false);
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
    setLoadingTimes(true);
    supabase?.auth.getSession().then(async ({ data }) => {
      try {
        const params = new URLSearchParams({ professionalId: selectedProfessionalId, date: appointmentDate });
        const response = await fetch(`/api/appointments?${params}`, { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
        if (response.ok && active) {
          const appointments: AppointmentRecord[] = await response.json();
          setBusyTimes(appointments.flatMap((appointment) => {
            const [startHour, startMinute] = appointment.startTime.split(':').map(Number);
            const [endHour, endMinute] = appointment.endTime.split(':').map(Number);
            const start = startHour * 60 + startMinute;
            const end = endHour * 60 + endMinute;
            const slots: string[] = [];
            for (let slot = start - 60; slot < end; slot += 30) {
              if (slot >= 0) slots.push(`${String(Math.floor(slot / 60)).padStart(2, '0')}:${String(slot % 60).padStart(2, '0')}`);
            }
            return slots;
          }));
        }
      } finally {
        if (active) setLoadingTimes(false);
      }
    });
    return () => { active = false; };
  }, [selectedProfessionalId, appointmentDate]);

  return (
    <form onSubmit={submit} className="grid gap-5 p-6">
      <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
        <p className="font-semibold">Acolhido: {patientName}</p>
        <p className="mt-1 text-xs">Escolha um profissional ativo, a data e um horário disponível.</p>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold">
        Profissional
        <select required name="professionalId" value={selectedProfessionalId} onChange={(event) => setSelectedProfessionalId(event.target.value)} disabled={loadingProfessionals} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500 disabled:text-slate-400">
          <option value="">{loadingProfessionals ? 'Carregando profissionais…' : 'Selecione o profissional'}</option>
          {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name} — {professional.role === 'psicologo' ? 'Psicólogo' : 'Assistente Social'}</option>)}
        </select>
      </label>
      {selectedProfessional && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Disponibilidade: {selectedProfessional.availabilityStart && selectedProfessional.availabilityEnd ? `${selectedProfessional.availabilityStart} às ${selectedProfessional.availabilityEnd}` : 'horário ainda não informado'}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">Data do atendimento<input required name="date" type="date" lang="pt-BR" min={today} value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500" /></label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Horário disponível
          <select required name="startTime" defaultValue="" key={`${selectedProfessionalId}-${appointmentDate}-${busyTimes.join(',')}`} disabled={!selectedProfessionalId || !appointmentDate || loadingTimes} className="h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:border-teal-500 disabled:text-slate-400">
            <option value="">{loadingTimes ? 'Verificando horários…' : 'Selecione o horário'}</option>
            {availableTimes.map((time) => <option key={time} value={time}>{time}–{(() => { const [hours, minutes] = time.split(':').map(Number); const total = hours * 60 + minutes + 60; return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; })()}</option>)}
          </select>
        </label>
      </div>
      {!loadingProfessionals && professionals.length === 0 && <p className="text-sm font-medium text-amber-700">Nenhum psicólogo ou assistente social ativo está disponível.</p>}
      {selectedProfessionalId && appointmentDate && !loadingTimes && availableTimes.length === 0 && <p className="text-sm font-medium text-amber-700">Não há horários livres para esta data. Escolha outro dia ou profissional.</p>}
      <Submit label="Salvar agendamento" />
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
