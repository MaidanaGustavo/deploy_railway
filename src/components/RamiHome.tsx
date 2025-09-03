import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAreas } from '../services/areas';
import { Area } from '../types/area';

// Mock de dados — substitua depois por dados reais da API
const areasMock = [
  { id: 'a1', nome: 'Chácara Santa Luzia', cultura: 'Rúcula', ha: 1.2, status: 'Plantio em dia', progresso: 68 },
  { id: 'a2', nome: 'Sítio Recanto Verde', cultura: 'Alface', ha: 0.8, status: 'Irrigação agendada', progresso: 40 },
  { id: 'a3', nome: 'Fazendinha Boa Esperança', cultura: 'Cebolinha', ha: 2.0, status: 'Adubação pendente', progresso: 22 },
];

export default function RamiHome({ onNewPlanting }: { onNewPlanting?: () => void }) {
  const { user, logout } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Produtor';
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    if (user?.id) {
      setAreas(getAreas(user.id));
    } else {
      setAreas([]);
    }
  }, [user?.id]);

  const irrigando = useMemo(() => areas.filter(a => a.irrigacaoUsa).length, [areas]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white shadow-sm border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 grid place-items-center text-white font-semibold">R</div>
            <div className="leading-tight">
              <p className="text-sm text-stone-500">Bem-vindo de volta</p>
              <h1 className="text-lg font-semibold text-stone-800">{firstName} – Painel do Produtor</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-stone-100 transition" title="Notificações">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-stone-700">
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>
                <path d="M10.3 21a1.7 1.7 0 0 0 3.4 0"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-amber-500 rounded-full"/>
            </button>
            <button className="p-2 rounded-xl hover:bg-stone-100 transition" title="Configurações">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-stone-700">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.27 17l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.04 3.27l.06.06a1.65 1.65 0 0 0 1.82.33H8c.66 0 1.26-.39 1.51-1V2a2 2 0 1 1 4 0v.09c.1.46.44.85.9 1.05.37.16.78.24 1.19.19.35-.04.69-.16.99-.38l.06-.06A2 2 0 1 1 20.73 6l-.06.06c-.27.27-.45.6-.52.96-.08.41-.01.83.19 1.19.2.46.59.8 1.05.9H22a2 2 0 1 1 0 4h-.09c-.46.1-.85.44-1.05.9z"/>
              </svg>
            </button>
            <button onClick={logout} className="ml-1 px-3 py-2 rounded-xl text-sm text-stone-700 hover:bg-stone-100 border border-stone-200 transition" title="Sair">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-4 pb-24">
        {/* Resumo / KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <KpiCard titulo="Áreas" valor={String(areas.length)} detalhe={areas.length === 1 ? 'gerenciada' : 'gerenciadas'} />
          <KpiCard titulo="Tarefas" valor={String(0)} detalhe="para hoje" />
          <KpiCard titulo="Irrigação" valor={String(irrigando)} detalhe="usando" />
        </section>

        {/* Ações Rápidas */}
        <section className="mt-6">
          <h2 className="text-base font-semibold text-stone-700 mb-3">Ações rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction icon={<PlantIcon/>} label="Novo plantio"/>
            <QuickAction icon={<WaterIcon/>} label="Reg. irrigação"/>
            <QuickAction icon={<FertIcon/>} label="Adubar"/>
            <QuickAction icon={<NoteIcon/>} label="Anotar tarefa"/>
          </div>
        </section>

        {/* Suas Áreas */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-stone-700">Suas áreas</h2>
            <button onClick={onNewPlanting} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 text-white text-sm shadow hover:shadow-md hover:opacity-95 active:scale-[.99] transition">
              <PlusIcon/>
              <span>Nova área</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {areas.map((a) => (
              <AreaCard key={a.id} area={a} />
            ))}

            {/* Card vazio quando não há áreas */}
            {areas.length === 0 && (
              <button onClick={onNewPlanting} className="group aspect-[16/10] rounded-2xl border-2 border-dashed border-stone-300 hover:border-stone-400 text-stone-500 hover:text-stone-700 grid place-items-center p-4 transition">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-stone-100 grid place-items-center group-hover:bg-stone-200 transition">
                    <PlusIcon/>
                  </div>
                  <span className="text-sm font-medium">Cadastrar nova área</span>
                </div>
              </button>
            )}
          </div>
        </section>
      </main>

      {/* FAB */}
      <button onClick={onNewPlanting} className="fixed bottom-20 right-4 sm:right-6 h-14 w-14 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/20 grid place-items-center active:scale-95 transition" title="Cadastrar nova área">
        <PlusIcon/>
      </button>

      {/* Bottom Nav (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-stone-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-4">
            <BottomItem label="Início" active icon={<HomeIcon/>} />
            <BottomItem label="Tarefas" icon={<TasksIcon/>} />
            <BottomItem label="Clima" icon={<WeatherIcon/>} />
            <BottomItem label="Perfil" icon={<UserIcon/>} />
          </div>
        </div>
      </nav>
    </div>
  );
}

function KpiCard({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string; detalhe?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${destaque ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-stone-200'}`}>
      <p className={`text-sm ${destaque ? 'text-emerald-50/90' : 'text-stone-500'}`}>{titulo}</p>
      <div className="mt-1 flex items-end gap-2">
        <span className={`text-2xl font-semibold leading-none ${destaque ? 'text-white' : 'text-stone-900'}`}>{valor}</span>
        {detalhe && (
          <span className={`text-xs mb-0.5 ${destaque ? 'text-emerald-50/90' : 'text-stone-500'}`}>{detalhe}</span>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 shadow-sm hover:shadow transition">
      <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
        {icon}
      </div>
      <span className="text-sm font-medium text-stone-800">{label}</span>
    </button>
  );
}

function AreaCard({ area }: { area: Area }) {
  return (
    <article className="group rounded-2xl bg-white border border-stone-200 hover:border-stone-300 shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Capa */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-emerald-800 to-emerald-600">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1500937386664-56adf86244b5?q=80&w=1400&auto=format&fit=crop')] bg-cover bg-center"/>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-white/90 text-emerald-700 grid place-items-center shadow">
            <PlantIcon/>
          </div>
          <div className="text-white drop-shadow-sm">
            <h3 className="text-sm font-semibold">{area.nome}</h3>
            <p className="text-xs text-emerald-50/90">{area.cultura ?? 'Sem cultura'} • {area.ha ?? 0} ha</p>
          </div>
        </div>
        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wide bg-white/95 text-emerald-800 px-2.5 py-1 rounded-full shadow">{area.status}</span>
      </div>

      {/* Corpo */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-600">Progresso do ciclo</p>
          <span className="text-sm font-medium text-stone-800">{area.progresso}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-stone-100 overflow-hidden">
          <div className="h-full bg-emerald-600" style={{ width: `${area.progresso}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Chip icon={<WaterIcon small/>} label={area.irrigacaoUsa ? 'Irrigação' : 'Sem irrigação'} />
          <Chip icon={<FertIcon small/>} label="Adubação"/>
          <Chip icon={<NoteIcon small/>} label="Tarefas"/>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="text-sm px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 transition">Detalhes</button>
          <button className="text-sm px-3 py-2 rounded-xl bg-stone-900 text-white hover:opacity-95 transition">Abrir</button>
        </div>
      </div>
    </article>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function BottomItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-1 py-3 ${active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>
      <div className={`h-8 w-8 rounded-xl grid place-items-center ${active ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>
        {icon}
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

/* ====== ÍCONES SVG minimalistas (sem libs externas) ====== */
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}
function PlantIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9c2-3 6-3 8 0 2-3 6-3 8 0-2 5-6 6-8 6v4"/>
      <path d="M2 9c2 5 6 6 8 6"/>
    </svg>
  );
}
function WaterIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2s7 7 7 12a7 7 0 1 1-14 0c0-5 7-12 7-12z"/>
    </svg>
  );
}
function FertIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-4-5-4-9a4 4 0 1 1 8 0c0 4-4 9-4 9z"/>
      <path d="M9 10c1-2 3-3 3-6"/>
    </svg>
  );
}
function NoteIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12v12H9l-5 5V4z"/>
      <path d="M8 8h6M8 12h4"/>
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9"/>
      <path d="M9 21V9h6v12"/>
    </svg>
  );
}
function TasksIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}
function WeatherIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 1 0-16 0"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
