'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Download,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
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
};
type Session = {
  id: number;
  patientId: number;
  date: string;
  time: string;
  note: string;
  next: string;
};
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
    id: 1,
    patientId: 1,
    type: 'PHQ-9',
    date: '26 ago 2026',
    score: '14 / 27',
    level: 'Moderada',
    note: 'Reavaliar em quatro semanas.',
    tone: 'amber',
  },
  {
    id: 2,
    patientId: 1,
    type: 'ASRS-v1.1',
    date: '12 ago 2026',
    score: '5 / 6',
    level: 'Rastreio positivo',
    note: 'Investigar história escolar e funcional.',
    tone: 'violet',
  },
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
    note: 'Paciente relata melhora gradual do sono após implementação da rotina combinada. Trabalhamos identificação de pensamentos automáticos relacionados ao ambiente profissional.',
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
  ['Pacientes', Users],
  ['Agenda', CalendarDays],
  ['Avaliações', ClipboardCheck],
  ['Relatórios', FileText],
] as const;

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
    );
  const [query, setQuery] = useState(''),
    [modal, setModal] = useState<'patient' | 'session' | 'assessment' | null>(
      null,
    ),
    [mobile, setMobile] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const close = () => setModal(null);
  function exportBackup() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            patients,
            assessments,
            sessions,
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
        setSelected(null);
        window.alert('Backup importado com sucesso.');
      } catch {
        window.alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
  function addPatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      name = String(f.get('name'));
    setPatients((v) => [
      {
        id: Date.now(),
        name,
        initials: name
          .split(' ')
          .map((x) => x[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        age: 0,
        phone: String(f.get('phone')),
        email: String(f.get('email')),
        document: String(f.get('document')),
        birth: String(f.get('birth')),
        last: 'Ainda não atendido',
        status: 'Novo cadastro',
        color: 'bg-teal-100 text-teal-700',
      },
      ...v,
    ]);
    close();
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
    let level = 'Baixo / mínimo',
      tone = 'emerald';
    if (score >= 10) {
      level = 'Moderado';
      tone = 'amber';
    }
    if (score >= 20) {
      level = 'Alto / grave';
      tone = 'rose';
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
        score: String(score),
        level,
        note: String(f.get('note')),
        tone,
      },
      ...v,
    ]);
    close();
    setTab('Avaliações');
  }
  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      <aside
        className={`${mobile ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 z-40 flex w-64 flex-col bg-[#123f42] text-white transition md:translate-x-0`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9f0e8] text-[#19595a]">
            <Brain size={23} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">
              Projeto de Anamnese
            </div>
            <div className="text-[11px] text-teal-100/70">Versão local</div>
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
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                if (label === 'Pacientes') setSelected(null);
                setMobile(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active === label ? 'bg-white/12 text-white' : 'text-teal-50/70 hover:bg-white/7'}`}
            >
              <Icon size={18} />
              {label}
              {label === 'Pacientes' && (
                <span className="ml-auto rounded-full bg-white/10 px-2 text-xs">
                  {patients.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button className="flex items-center gap-3 px-3 py-2 text-sm text-teal-50/70">
            <Settings size={18} />
            Configurações
          </button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/10 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e1b893] text-sm font-bold text-[#6b4126]">
              AM
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Ana Martins</p>
              <p className="text-xs text-teal-100/55">CRP 06/123456</p>
            </div>
            <LogOut size={16} />
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
              placeholder="Buscar pacientes, avaliações..."
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
          <button
            onClick={() => setModal('patient')}
            className="hidden items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
          >
            <Plus size={17} />
            Novo paciente
          </button>
        </header>
        <div className="p-5 md:p-8">
          {selected ? (
            <PatientView
              p={selected}
              tab={tab}
              setTab={setTab}
              assessments={assessments.filter(
                (a) => a.patientId === selected.id,
              )}
              sessions={sessions.filter((s) => s.patientId === selected.id)}
              back={() => setSelected(null)}
              open={setModal}
            />
          ) : active === 'Pacientes' ? (
            <Patients
              patients={filtered}
              query={query}
              setQuery={setQuery}
              select={setSelected}
              open={() => setModal('patient')}
            />
          ) : (
            <Dashboard
              patients={patients}
              select={(p) => {
                setActive('Pacientes');
                setSelected(p);
              }}
              open={() => setModal('patient')}
            />
          )}
        </div>
      </main>
      {modal && (
        <Modal
          title={
            modal === 'patient'
              ? 'Cadastrar paciente'
              : modal === 'session'
                ? 'Nova atualização'
                : 'Aplicar instrumento'
          }
          close={close}
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
  select,
  open,
}: {
  patients: Patient[];
  select: (p: Patient) => void;
  open: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-[#287472]">
            Segunda-feira, 31 de agosto
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Bom dia, Ana.
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aqui está o panorama do seu consultório hoje.
          </p>
        </div>
        <button
          onClick={open}
          className="flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white sm:hidden"
        >
          <Plus size={17} />
          Novo paciente
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Users}
          label="Pacientes ativos"
          value="24"
          detail="+3 neste mês"
          color="teal"
        />
        <Metric
          icon={CalendarDays}
          label="Sessões hoje"
          value="6"
          detail="Próxima às 11:00"
          color="blue"
        />
        <Metric
          icon={ClipboardCheck}
          label="Avaliações pendentes"
          value="4"
          detail="2 vencem esta semana"
          color="amber"
        />
        <Metric
          icon={Activity}
          label="Sessões no mês"
          value="38"
          detail="12% acima de julho"
          color="violet"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Agenda de hoje</h2>
              <p>6 atendimentos programados</p>
            </div>
            <button className="text-sm font-semibold text-[#176a68]">
              Ver agenda
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            <Appointment
              time="09:30"
              p={patients[0]}
              tag="Finalizado"
              select={select}
            />
            <Appointment
              time="11:00"
              p={patients[1]}
              tag="Em 50 min"
              select={select}
            />
            <Appointment
              time="14:00"
              p={patients[2]}
              tag="Confirmado"
              select={select}
            />
            <Appointment
              time="16:30"
              p={patients[3]}
              tag="Confirmado"
              select={select}
            />
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
              icon={ClipboardCheck}
              title="PHQ-9 para reaplicar"
              text="Rafael Mendes · há 4 semanas"
              tone="amber"
            />
            <Alert
              icon={HeartPulse}
              title="Risco moderado no ASSIST"
              text="Mariana Costa · álcool"
              tone="rose"
            />
            <Alert
              icon={FileText}
              title="Anamnese incompleta"
              text="Lucas Ferreira · novo paciente"
              tone="blue"
            />
          </div>
        </section>
      </div>
      <section className="panel mt-6">
        <div className="panel-head">
          <div>
            <h2>Pacientes recentes</h2>
            <p>Acesso rápido aos últimos prontuários</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Paciente</th>
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
function Patients({
  patients,
  query,
  setQuery,
  select,
  open,
}: {
  patients: Patient[];
  query: string;
  setQuery: (s: string) => void;
  select: (p: Patient) => void;
  open: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastros e prontuários sob sua responsabilidade.
          </p>
        </div>
        <button
          onClick={open}
          className="flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={17} />
          Novo paciente
        </button>
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
function PatientView({
  p,
  tab,
  setTab,
  assessments,
  sessions,
  back,
  open,
}: {
  p: Patient;
  tab: string;
  setTab: (s: string) => void;
  assessments: Assessment[];
  sessions: Session[];
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
        ← Voltar para pacientes
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
            <button
              onClick={() => open('session')}
              className="mb-1 flex items-center gap-2 rounded-xl bg-[#176a68] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Nova atualização
            </button>
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
            <h2 className="mb-5 text-lg font-bold">Resumo clínico</h2>
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
            <p className="text-sm text-slate-400">Telefone</p>
            <p className="font-medium">{p.phone}</p>
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
        <section className="panel mt-6 p-6">
          <div className="mb-6 flex justify-between">
            <div>
              <h2 className="text-lg font-bold">Anamnese psicológica</h2>
              <p className="text-sm text-slate-500">
                Atualizada em 18 de agosto de 2026
              </p>
            </div>
            <button className="rounded-xl border px-4 py-2 text-sm font-semibold">
              Editar
            </button>
          </div>
          <Info
            title="Queixa inicial"
            text="Ansiedade persistente, dificuldade para dormir, ruminação e sensação de sobrecarga associada ao trabalho."
          />
          <Info
            title="Histórico e contexto"
            text="Sintomas iniciados há oito meses. Sem histórico de internações psiquiátricas. Mantém boa rede de apoio familiar."
          />
          <Info
            title="Plano de atendimento e metas terapêuticas"
            text="Reduzir sintomas ansiosos, ampliar regulação emocional, melhorar o sono e desenvolver limites saudáveis no trabalho."
          />
        </section>
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
              <h2>Instrumentos e escalas</h2>
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
                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <b>{a.score}</b>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {a.level}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{a.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
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
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-xs text-slate-400">
              Os campos marcados são obrigatórios
            </p>
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
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) => (
  <label className="grid gap-1.5 text-sm font-semibold">
    {label}
    <input
      required
      name={name}
      type={type}
      placeholder={placeholder}
      className="h-11 rounded-xl border px-3 font-normal outline-none focus:border-teal-500"
    />
  </label>
);
function PatientForm({
  submit,
}: {
  submit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={submit} className="grid gap-4 p-6">
      <Field label="Nome completo" name="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data de nascimento" name="birth" type="date" />
        <Field label="CPF ou RG" name="document" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone" name="phone" />
        <Field label="E-mail" name="email" type="email" />
      </div>
      <Submit label="Cadastrar paciente" />
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
  return (
    <form onSubmit={submit} className="grid gap-4 p-6">
      <label className="grid gap-1.5 text-sm font-semibold">
        Instrumento
        <select name="type" className="h-11 rounded-xl border px-3 font-normal">
          <option>PHQ-9</option>
          <option>ASSIST</option>
          <option>ASRS-v1.1</option>
          <option>M-CHAT-R</option>
          <option>AQ-10</option>
          <option>SNAP-IV</option>
        </select>
      </label>
      <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
        <Sparkles size={18} />
        <b>Cálculo automático</b>
        <p className="text-xs">
          O sistema classifica a faixa e salva o resultado no histórico.
        </p>
      </div>
      <Field label="Escore total" name="score" type="number" />
      <Text label="Observações do psicólogo" name="note" />
      <Submit label="Salvar avaliação" />
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
