import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAreas } from '../services/areas';
import type { Area } from '../types/area';
import { useWeather } from '../hooks/useWeather';

function cultureCycleDays(cultura?: string | null): number {
  if (!cultura) return 60;
  const key = cultura.toLowerCase();
  if (key.includes('rúcula') || key.includes('rucula')) return 40;
  if (key.includes('alface')) return 60;
  if (key.includes('cebolinha')) return 90;
  if (key.includes('tomate')) return 120;
  if (key.includes('coentro')) return 45;
  if (key.includes('couve')) return 90;
  return 60;
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function computeStage(area: Area) {
  const start = new Date(area.createdAt);
  const now = new Date();
  const cycleDays = cultureCycleDays(area.cultura);
  const d = daysBetween(start, now);
  const pct = Math.max(0, Math.min(100, Math.round((d / cycleDays) * 100)));

  let stage = 'Crescimento';
  if (d <= 7) stage = 'Emergência';
  else if (d <= 21) stage = 'Crescimento inicial';
  else if (d >= cycleDays - 7 && d < cycleDays) stage = 'Pré‑colheita';
  else if (d >= cycleDays) stage = 'Colheita';

  const estHarvest = new Date(start);
  estHarvest.setDate(estHarvest.getDate() + cycleDays);

  return { stage, pct, cycleDays, days: d, estHarvest };
}

export default function AreaCover({ areaId, onBack }: { areaId: string; onBack?: () => void }) {
  const { user } = useAuth();
  const area: Area | undefined = useMemo(() => {
    if (!user) return undefined;
    return getAreas(user.id).find((a) => a.id === areaId);
  }, [user?.id, areaId]);

  // Clima
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (area?.geo?.lat && area?.geo?.lng) {
        setCoords({ lat: area.geo.lat, lng: area.geo.lng });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!cancelled) setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            if (!cancelled) setCoords({ lat: -23.55, lng: -46.63 }); // fallback: São Paulo
          },
          { enableHighAccuracy: false, timeout: 4000 }
        );
      } else {
        setCoords({ lat: -23.55, lng: -46.63 });
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, [area?.geo?.lat, area?.geo?.lng]);

  const weather = useWeather(coords);
  const weatherDaily = weather.data?.daily ?? [];

  if (!area) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-neutral-700 hover:bg-neutral-100" aria-label="Voltar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-sm text-neutral-600">Área não encontrada</span>
          </div>
        </header>
        <div className="mx-auto max-w-md p-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-neutral-700">Não encontramos dados desta área.</div>
        </div>
      </div>
    );
  }

  const { stage, pct, cycleDays, days, estHarvest } = computeStage(area);

  // Sugestões automáticas de tarefas (sem input do usuário)
  type Suggest = { title: string; desc?: string };
  const suggestions: Suggest[] = useMemo(() => {
    const arr: Suggest[] = [];
    // Baseado em estágio
    if (stage === 'Emergência') {
      arr.push({ title: 'Acompanhar emergência', desc: 'Manter substrato úmido, sem encharcar.' });
    }
    if (stage === 'Crescimento inicial') {
      arr.push({ title: 'Iniciar adubo de cobertura', desc: 'Dose leve de N e K para estimular vigor.' });
      arr.push({ title: 'Capina leve', desc: 'Retirar plantas daninhas ao redor do canteiro.' });
    }
    if (stage === 'Pré‑colheita') {
      arr.push({ title: 'Organizar colheita', desc: 'Planejar embalagens, transporte e escoamento.' });
    }
    if (stage === 'Colheita') {
      arr.push({ title: 'Realizar colheita', desc: 'Escolher horário mais fresco e manusear com cuidado.' });
    }
    // Irrigação
    if (area.irrigacaoUsa) {
      // Se previsão de chuva baixa, sugerir irrigação; se alta, sugerir ajuste
      const today = weatherDaily[0];
      const rainProb = today?.pop ?? null;
      if (rainProb != null) {
        if (rainProb >= 50) {
          arr.push({ title: 'Aproveitar chuva prevista', desc: 'Reduzir a irrigação nas próximas 24h.' });
        } else {
          arr.push({ title: 'Programar irrigação', desc: 'Verificar pressão e uniformidade de aplicação.' });
        }
      } else {
        arr.push({ title: 'Checar irrigação', desc: 'Inspecionar filtros, gotejadores e vazamentos.' });
      }
    } else {
      arr.push({ title: 'Monitorar umidade do solo', desc: 'Usar teste simples com a mão para avaliar.' });
    }
    // Sugestão geral
    arr.push({ title: 'Inspecionar pragas e doenças', desc: 'Olhar face inferior das folhas e ápices.' });
    // Limitar a 4-5 itens para foco
    return arr.slice(0, 5);
  }, [stage, area.irrigacaoUsa, weatherDaily]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-stone-700 hover:bg-stone-100" aria-label="Voltar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="text-sm text-stone-500">Área</div>
              <div className="text-base font-medium text-stone-800">{area.nome}</div>
            </div>
          </div>
          <span className="text-[11px] uppercase tracking-wide bg-stone-900 text-white px-2.5 py-1 rounded-full">{area.status}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 pb-24">
        {/* Capa com progresso */}
        <section className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-emerald-800 to-emerald-600 shadow-sm text-white">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1500937386664-56adf86244b5?q=80&w=1400&auto=format&fit=crop')] bg-cover bg-center"/>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="p-5">
              <div className="text-sm text-emerald-50/90">{area.cultura ?? 'Cultura não informada'}</div>
              <h1 className="mt-0.5 text-2xl font-semibold">Ciclo do plantio</h1>
              <p className="mt-2 text-emerald-50/90 text-sm">{days} dias desde o início • {cycleDays} dias estimados</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm">
                <span className="h-2 w-2 rounded-full bg-amber-300"/>
                <span>{stage}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-stone-900">
                <div className="rounded-xl bg-white/95 p-3 text-sm shadow-sm">
                  <div className="text-stone-500">Área</div>
                  <div className="text-stone-900 font-medium">{area.ha ?? 0} ha</div>
                </div>
                <div className="rounded-xl bg-white/95 p-3 text-sm shadow-sm">
                  <div className="text-stone-500">Irrigação</div>
                  <div className="text-stone-900 font-medium">{area.irrigacaoUsa ? 'Usa' : 'Não usa'}</div>
                </div>
                <div className="rounded-xl bg-white/95 p-3 text-sm shadow-sm col-span-2">
                  <div className="text-stone-500">Colheita prevista</div>
                  <div className="text-stone-900 font-medium">{estHarvest.toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <div className="md:p-5 p-4 flex items-center justify-center">
              <ProgressRing percent={pct} label={`${pct}%`} />
            </div>
          </div>
        </section>

        {/* Clima e Sugestões */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-stone-800">Clima local</h2>
              <p className="text-xs text-stone-500">Atualizado pela sua localização</p>
            </div>
            {weather.loading && <div className="text-sm text-stone-600">Carregando clima…</div>}
            {weather.error && <div className="text-sm text-red-600">{weather.error}</div>}
            {weather.data && (
              <div>
                {weather.data.current && (
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-semibold text-stone-900">{Math.round(weather.data.current.temperature)}°C</div>
                    <div className="text-sm text-stone-600">
                      Vento {Math.round(weather.data.current.wind)} km/h
                    </div>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(weather.data.daily ?? []).slice(0, 3).map((d) => (
                    <div key={d.date} className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-center">
                      <div className="text-xs text-stone-500">{new Date(d.date).toLocaleDateString()}</div>
                      <div className="text-sm font-medium text-stone-800">{Math.round(d.tmax)}° / {Math.round(d.tmin)}°</div>
                      {d.pop != null && <div className="text-xs text-stone-600">Chuva {d.pop}%</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-stone-800">Sugestões de tarefas</h2>
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Automático</span>
            </div>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-stone-200 p-3">
                  <div className="mt-0.5 h-6 w-6 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-stone-800">{s.title}</div>
                    {s.desc && <div className="text-xs text-stone-600 mt-0.5">{s.desc}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProgressRing({ percent, label }: { percent: number; label?: string }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-sm">
      <circle cx="80" cy="80" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none" />
      <circle
        cx="80"
        cy="80"
        r={r}
        stroke="#059669"
        strokeWidth="12"
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-stone-900" fontSize="18" fontWeight="600">
        {label}
      </text>
      <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" className="fill-stone-500" fontSize="11">
        do ciclo
      </text>
    </svg>
  );
}

function SuggestCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-stone-800">{title}</div>
      <div className="text-sm text-stone-600 mt-1">{desc}</div>
      <button className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        <span>Ver mais</span>
      </button>
    </div>
  );
}
