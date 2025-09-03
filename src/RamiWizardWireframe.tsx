import React, { useEffect, useMemo, useRef, useState } from "react";

// Rami – MVP Wizard (React, Mobile-first, 1–2 inputs por tela)
// Versão v2: transições suaves entre passos, linguagem mais simples e regional
// - Sem libs externas além de React + Tailwind
// - Auto-save no localStorage
// - Etapas condicionais
// - Botões grandes, linguagem direta

// -------------------- Tipos --------------------

type UnidadeArea = "m2" | "ha";

type Dados = {
  area: { valor: number | null; unidade: UnidadeArea };
  cultura: string | null;
  solo: { correcaoFeita: boolean | null; pendencias: string[]; lembrete: boolean };
  plantio: { modo: "linha" | "canteiro" | null; dimensoes?: string };
  irrigacao: { usa: boolean | null; tipo?: "gotejamento" | "aspersao" | "outro" };
  fertirrigacao: "sim" | "nao" | "nao_sei" | null;
  forma: {
    tipo: "semente" | "muda" | null;
    semente?: { marca: string | null; variedade: string | null; substrato: string | null; bandeja: number | null };
    muda?: { variedade: string | null; fornecedor: string | null; bandeja: number | null };
  };
  localizacao: { talhao: string | null; geo?: { lat: number; lng: number } | null };
  materiais: { status: "ja_comprou" | "nao_comprou" | null; itens: string[] };
  aduboPlantio: { tipo: "granulado" | "organico" | "ja_possuo" | null; descricao: string | null };
};

// -------------------- Constantes --------------------

const STORAGE_KEY = "rami_wizard_v2";

const CULTURAS_SUGERIDAS = ["Rúcula", "Alface", "Tomate", "Cebolinha", "Couve", "Coentro"];
const PENDENCIAS_SOLO = ["Análise de solo", "Calcário", "Gesso", "Outro"];
const BANDEJAS = [128, 200, 288];
const ITENS_MATERIAIS = ["Semente/Muda", "Substrato", "Bandeja", "Mangueira/Tubo", "Registro/Válvula"];

// -------------------- Utils --------------------

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function loadDraft(): Dados | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(d: Dados) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

// -------------------- Passos --------------------

type StepId =
  | "area"
  | "cultura"
  | "solo"
  | "solo_pendencias"
  | "solo_lembrete"
  | "plantio"
  | "irrigacao"
  | "fertirrigacao"
  | "forma"
  | "forma_semente_marca"
  | "forma_semente_variedade"
  | "forma_semente_substrato"
  | "forma_semente_bandeja"
  | "forma_muda_variedade"
  | "forma_muda_fornecedor"
  | "forma_muda_bandeja"
  | "localizacao"
  | "materiais"
  | "adubo"
  | "revisao";

function getSteps(d: Dados): StepId[] {
  const steps: StepId[] = ["area", "cultura", "solo"];

  if (d.solo.correcaoFeita === false) {
    steps.push("solo_pendencias", "solo_lembrete");
  }

  steps.push("plantio", "irrigacao", "fertirrigacao", "forma");

  if (d.forma.tipo === "semente") {
    steps.push(
      "forma_semente_marca",
      "forma_semente_variedade",
      "forma_semente_substrato",
      "forma_semente_bandeja"
    );
  } else if (d.forma.tipo === "muda") {
    steps.push("forma_muda_variedade", "forma_muda_fornecedor", "forma_muda_bandeja");
  }

  steps.push("localizacao", "materiais", "adubo", "revisao");
  return steps;
}

// -------------------- Transição suave (sem libs) --------------------

function usePrev<T>(value: T) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

function WizardTransition({ idx, children }: { idx: number; children: React.ReactNode }) {
  const prev = usePrev(idx) ?? idx;
  const dir = idx > prev ? 1 : idx < prev ? -1 : 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [idx]);

  return (
    <div
      className={clsx(
        "transition-all duration-300 ease-out",
        mounted ? "opacity-100 translate-x-0" : dir >= 0 ? "opacity-0 translate-x-5" : "opacity-0 -translate-x-5"
      )}
    >
      {children}
    </div>
  );
}

// -------------------- Componente Principal --------------------

export default function RamiWizardApp({ onExit, onComplete }: { onExit?: () => void; onComplete?: (dados: Dados) => void }) {
  const [dados, setDados] = useState<Dados>(() =>
    loadDraft() ?? {
      area: { valor: null, unidade: "m2" },
      cultura: null,
      solo: { correcaoFeita: null, pendencias: [], lembrete: false },
      plantio: { modo: null },
      irrigacao: { usa: null },
      fertirrigacao: null,
      forma: { tipo: null, semente: { marca: null, variedade: null, substrato: null, bandeja: null }, muda: { variedade: null, fornecedor: null, bandeja: null } },
      localizacao: { talhao: null, geo: null },
      materiais: { status: null, itens: [] },
      aduboPlantio: { tipo: null, descricao: null },
    }
  );

  const steps = useMemo(() => getSteps(dados), [dados]);
  const [current, setCurrent] = useState<number>(0);
  const stepId = steps[current];
  const [error, setError] = useState<string | null>(null);

  // Auto-save
  useEffect(() => {
    saveDraft(dados);
  }, [dados]);

  // Corrigir índice quando o conjunto de passos muda
  useEffect(() => {
    if (current >= steps.length) setCurrent(steps.length - 1);
  }, [steps, current]);

  function goto(step: StepId) {
    const idx = steps.indexOf(step);
    if (idx >= 0) setCurrent(idx);
  }

  function next() {
    setError(null);
    const [ok, msg] = validate(stepId, dados);
    if (!ok) {
      setError(msg);
      // micro feedback de erro (agita o card)
      const card = document.querySelector("#step-card");
      card?.classList.remove("animate-wiggle");
      // força reflow
      void (card as HTMLElement)?.offsetWidth;
      card?.classList.add("animate-wiggle");
      return;
    }
    if (current < steps.length - 1) setCurrent((c) => c + 1);
  }

  function back() {
    setError(null);
    if (current > 0) setCurrent((c) => c - 1);
  }

  const progresso = `${current + 1}/${steps.length}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <WizardHeader progresso={progresso} onExit={onExit} />

      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
        <OfflineBadge />

        <StepCard>
          <WizardTransition idx={current}>
            {stepId === "area" && <AreaStep dados={dados} setDados={setDados} />}
            {stepId === "cultura" && <CulturaStep dados={dados} setDados={setDados} />}
            {stepId === "solo" && <SoloStep dados={dados} setDados={setDados} />}
            {stepId === "solo_pendencias" && <SoloPendenciasStep dados={dados} setDados={setDados} />}
            {stepId === "solo_lembrete" && <SoloLembreteStep dados={dados} setDados={setDados} />}
            {stepId === "plantio" && <PlantioStep dados={dados} setDados={setDados} />}
            {stepId === "irrigacao" && <IrrigacaoStep dados={dados} setDados={setDados} />}
            {stepId === "fertirrigacao" && <FertirrigacaoStep dados={dados} setDados={setDados} />}
            {stepId === "forma" && <FormaStep dados={dados} setDados={setDados} />}
            {stepId === "forma_semente_marca" && <SementeMarcaStep dados={dados} setDados={setDados} />}
            {stepId === "forma_semente_variedade" && (
              <SementeVariedadeStep dados={dados} setDados={setDados} cultura={dados.cultura} />
            )}
            {stepId === "forma_semente_substrato" && <SementeSubstratoStep dados={dados} setDados={setDados} />}
            {stepId === "forma_semente_bandeja" && <SementeBandejaStep dados={dados} setDados={setDados} />}
            {stepId === "forma_muda_variedade" && (
              <MudaVariedadeStep dados={dados} setDados={setDados} cultura={dados.cultura} />
            )}
            {stepId === "forma_muda_fornecedor" && <MudaFornecedorStep dados={dados} setDados={setDados} />}
            {stepId === "forma_muda_bandeja" && <MudaBandejaStep dados={dados} setDados={setDados} />}
            {stepId === "localizacao" && <LocalizacaoStep dados={dados} setDados={setDados} />}
            {stepId === "materiais" && <MateriaisStep dados={dados} setDados={setDados} />}
            {stepId === "adubo" && <AduboStep dados={dados} setDados={setDados} />}
            {stepId === "revisao" && <RevisaoStep dados={dados} goto={goto} />}
          </WizardTransition>
        </StepCard>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <FooterNav
        onBack={back}
        onNext={next}
        onComplete={onComplete ? () => onComplete(dados) : undefined}
        canBack={current > 0}
        isLast={stepId === "revisao"}
      />

      {/* keyframes locais para pequenos toques visuais */}
      <style>{`
        @keyframes wiggle { 0%,100%{ transform: translateX(0);} 15%{ transform: translateX(-4px);} 30%{ transform: translateX(4px);} 45%{ transform: translateX(-3px);} 60%{ transform: translateX(3px);} 75%{ transform: translateX(-2px);} 90%{ transform: translateX(2px);} }
        .animate-wiggle { animation: wiggle .35s ease-in-out; }
        @keyframes pop { 0%{ transform: scale(.98); } 100%{ transform: scale(1); } }
        .animate-pop { animation: pop .18s ease-out; }
      `}</style>
    </div>
  );
}

// -------------------- Subcomponentes de UI --------------------

function WizardHeader({ progresso, onExit }: { progresso: string; onExit?: () => void }) {
  const [done, total] = progresso.split("/").map(Number);
  const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
        {onExit && (
          <button
            onClick={onExit}
            className="p-2 -ml-2 rounded-xl text-neutral-700 hover:bg-neutral-100 active:translate-y-px"
            aria-label="Voltar para o início"
            title="Voltar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}
        <div className="h-1 w-full overflow-hidden rounded bg-neutral-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="min-w-[64px] text-xs text-neutral-600">{progresso}</span>
      </div>
    </header>
  );
}

function OfflineBadge() {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    function on() { setOnline(true); }
    function off() { setOnline(false); }
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online) return null;
  return (
    <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 animate-pop">
      Sem internet agora — salvando no aparelho
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div id="step-card" className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-medium">{children}</h2>
      {hint && <p className="mt-1 text-sm text-neutral-600">{hint}</p>}
    </div>
  );
}

function FooterNav({ onBack, onNext, onComplete, canBack, isLast }: { onBack: () => void; onNext: () => void; onComplete?: () => void; canBack: boolean; isLast: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/90 p-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md gap-2">
        <button
          onClick={onBack}
          disabled={!canBack}
          className={clsx(
            "h-12 flex-1 rounded-xl border px-4 text-base transition active:translate-y-px",
            canBack ? "border-neutral-300 text-neutral-800 bg-white" : "border-neutral-200 text-neutral-400 bg-neutral-50"
          )}
        >
          Voltar
        </button>
        <button
          onClick={() => {
            if (isLast && onComplete) {
              onComplete();
            } else {
              onNext();
            }
          }}
          className="h-12 flex-1 rounded-xl bg-emerald-600 px-4 text-base font-medium text-white shadow-sm transition active:translate-y-px hover:brightness-110"
        >
          {isLast ? "Confirmar" : "Próximo"}
        </button>
      </div>
    </div>
  );
}

function Chip({ selected, children, onClick }: { selected?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full border px-4 py-2 text-sm transition-colors",
        selected ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
      )}
    >
      {children}
    </button>
  );
}

function CardOption({ title, subtitle, selected, onClick }: { title: string; subtitle?: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full rounded-2xl border p-4 text-left transition-colors",
        selected ? "border-emerald-600 bg-emerald-50" : "border-neutral-200 bg-white hover:bg-neutraAl-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-medium">{title}</div>
          {subtitle && <div className="text-sm text-neutral-600">{subtitle}</div>}
        </div>
        <div className={clsx("h-4 w-4 rounded-full transition-colors", selected ? "bg-emerald-600" : "bg-neutral-300")} />
      </div>
    </button>
  );
}

function NumberUnitInput({ value, onChange, unit, setUnit }: { value: number | null; onChange: (v: number | null) => void; unit: UnidadeArea; setUnit: (u: UnidadeArea) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value.replace(",", ".");
          onChange(v === "" ? null : Number(v));
        }}
        placeholder="Ex.: 600"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value as UnidadeArea)}
        className="h-12 min-w-[88px] rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      >
        <option value="m2">m²</option>
        <option value="ha">ha</option>
      </select>
    </div>
  );
}

// -------------------- Etapas (Views) --------------------

function AreaStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label hint="Pode chutar um valor aproximado.">Qual o tamanho da área pra plantar?</Label>
      <NumberUnitInput
        value={dados.area.valor}
        onChange={(valor) => setDados((d) => ({ ...d, area: { ...d.area, valor } }))}
        unit={dados.area.unidade}
        setUnit={(unidade) => setDados((d) => ({ ...d, area: { ...d.area, unidade } }))}
      />
    </div>
  );
}

function CulturaStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  const [query, setQuery] = useState("");
  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CULTURAS_SUGERIDAS.filter((c) => c.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  return (
    <div>
      <Label hint="Ex.: Rúcula, Alface, Tomate.">O que você vai plantar?</Label>
      <input
        value={dados.cultura ?? ""}
        onChange={(e) => setDados((d) => ({ ...d, cultura: e.target.value }))}
        placeholder="Digite a cultura (ex.: Rúcula)"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar sugestões…"
          className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none transition-colors focus:border-emerald-600"
        />
        {filtradas.map((c) => (
          <Chip key={c} selected={dados.cultura?.toLowerCase() === c.toLowerCase()} onClick={() => setDados((d) => ({ ...d, cultura: c }))}>{c}</Chip>
        ))}
      </div>
    </div>
  );
}

function SoloStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label hint="Se não fez ainda, a gente te lembra.">Já corrigiu o solo?</Label>
      <div className="grid grid-cols-1 gap-2">
        <CardOption title="Sim" selected={dados.solo.correcaoFeita === true} onClick={() => setDados((d) => ({ ...d, solo: { ...d.solo, correcaoFeita: true } }))} />
        <CardOption title="Ainda não" selected={dados.solo.correcaoFeita === false} onClick={() => setDados((d) => ({ ...d, solo: { ...d.solo, correcaoFeita: false } }))} />
      </div>
    </div>
  );
}

function SoloPendenciasStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  function toggle(item: string) {
    setDados((d) => {
      const on = d.solo.pendencias.includes(item);
      return { ...d, solo: { ...d.solo, pendencias: on ? d.solo.pendencias.filter((x) => x !== item) : [...d.solo.pendencias, item] } };
    });
  }
  return (
    <div>
      <Label hint="Marque o que falta (opcional).">O que tá faltando pra corrigir?</Label>
      <div className="flex flex-wrap gap-2">
        {PENDENCIAS_SOLO.map((p) => (
          <Chip key={p} selected={dados.solo.pendencias.includes(p)} onClick={() => toggle(p)}>{p}</Chip>
        ))}
      </div>
    </div>
  );
}

function SoloLembreteStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label hint="Podemos te lembrar depois (não trava o cadastro).">Quer um lembrete pra fazer a correção?</Label>
      <div className="flex items-center gap-3">
        <input
          id="lembrete"
          type="checkbox"
          checked={dados.solo.lembrete}
          onChange={(e) => setDados((d) => ({ ...d, solo: { ...d.solo, lembrete: e.target.checked } }))}
          className="h-5 w-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600"
        />
        <label htmlFor="lembrete" className="text-base">Ativar lembrete</label>
      </div>
    </div>
  );
}

function PlantioStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  const modo = dados.plantio.modo;
  return (
    <div>
      <Label>Vai plantar como?</Label>
      <div className="grid grid-cols-1 gap-2">
        <CardOption title="Linha" subtitle="Sulcos" selected={modo === "linha"} onClick={() => setDados((d) => ({ ...d, plantio: { ...d.plantio, modo: "linha" } }))} />
        <CardOption title="Canteiro" subtitle="Elevado" selected={modo === "canteiro"} onClick={() => setDados((d) => ({ ...d, plantio: { ...d.plantio, modo: "canteiro" } }))} />
      </div>
      {modo === "linha" && (
        <div className="mt-3">
          <label className="mb-1 block text-sm text-neutral-700">Dimensão (opcional)</label>
          <input
            value={dados.plantio.dimensoes ?? ""}
            onChange={(e) => setDados((d) => ({ ...d, plantio: { ...d.plantio, dimensoes: e.target.value } }))}
            placeholder="Ex.: 10 × 5 m"
            className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
          />
        </div>
      )}
    </div>
  );
}

function IrrigacaoStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  const usa = dados.irrigacao.usa;
  return (
    <div>
      <Label>Vai usar irrigação?</Label>
      <div className="grid grid-cols-1 gap-2">
        <CardOption title="Sim" selected={usa === true} onClick={() => setDados((d) => ({ ...d, irrigacao: { ...d.irrigacao, usa: true } }))} />
        <CardOption title="Não" selected={usa === false} onClick={() => setDados((d) => ({ ...d, irrigacao: { ...d.irrigacao, usa: false, tipo: undefined } }))} />
      </div>
      {usa === true && (
        <div className="mt-3">
          <label className="mb-1 block text-sm text-neutral-700">Qual tipo?</label>
          <div className="flex flex-wrap gap-2">
            {(["gotejamento", "aspersao", "outro"] as const).map((t) => (
              <Chip key={t} selected={dados.irrigacao.tipo === t} onClick={() => setDados((d) => ({ ...d, irrigacao: { ...d.irrigacao, tipo: t } }))}>
                {t === "gotejamento" ? "Gotejamento" : t === "aspersao" ? "Aspersão" : "Outro"}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FertirrigacaoStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  const v = dados.fertirrigacao;
  return (
    <div>
      <Label hint="Misturar adubo na água da irrigação.">Quer fazer fértil‑irrigação?</Label>
      <div className="grid grid-cols-1 gap-2">
        <CardOption title="Sim" selected={v === "sim"} onClick={() => setDados((d) => ({ ...d, fertirrigacao: "sim" }))} />
        <CardOption title="Não sei o que é" selected={v === "nao_sei"} onClick={() => setDados((d) => ({ ...d, fertirrigacao: "nao_sei" }))} />
        <CardOption title="Não" selected={v === "nao"} onClick={() => setDados((d) => ({ ...d, fertirrigacao: "nao" }))} />
      </div>
    </div>
  );
}

function FormaStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  const tipo = dados.forma.tipo;
  return (
    <div>
      <Label>Vai de semente ou muda?</Label>
      <div className="grid grid-cols-1 gap-2">
        <CardOption title="Semente" selected={tipo === "semente"} onClick={() => setDados((d) => ({ ...d, forma: { ...d.forma, tipo: "semente" } }))} />
        <CardOption title="Muda" selected={tipo === "muda"} onClick={() => setDados((d) => ({ ...d, forma: { ...d.forma, tipo: "muda" } }))} />
      </div>
    </div>
  );
}

function SementeMarcaStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label>Qual a marca da semente?</Label>
      <input
        value={dados.forma.semente?.marca ?? ""}
        onChange={(e) => setDados((d) => ({ ...d, forma: { ...d.forma, semente: { ...(d.forma.semente ?? { variedade: null, substrato: null, bandeja: null, marca: null }), marca: e.target.value } } }))}
        placeholder="Ex.: Isla, Feltrin, Horticeres…"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
    </div>
  );
}

function SementeVariedadeStep({ dados, setDados, cultura }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>>; cultura: string | null }) {
  const sugestoes = useMemo(() => {
    if (!cultura) return ["Variedade 1", "Variedade 2", "Variedade 3"];
    const c = cultura.toLowerCase();
    if (c.includes("rúcula") || c.includes("rucula")) return ["Folha Larga", "Selvática", "Asta Fi"];
    if (c.includes("alface")) return ["Crespa", "Americana", "Lisa"];
    if (c.includes("tomate")) return ["Santa Clara", "Cereja", "Italiano"];
    return ["Variedade A", "Variedade B", "Variedade C"];
  }, [cultura]);

  return (
    <div>
      <Label>Qual a variedade?</Label>
      <input
        value={dados.forma.semente?.variedade ?? ""}
        onChange={(e) => setDados((d) => ({ ...d, forma: { ...d.forma, semente: { ...(d.forma.semente ?? { marca: null, substrato: null, bandeja: null, variedade: null }), variedade: e.target.value } } }))}
        placeholder="Ex.: Folha Larga"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {sugestoes.map((v) => (
          <Chip key={v} selected={dados.forma.semente?.variedade?.toLowerCase() === v.toLowerCase()} onClick={() => setDados((d) => ({ ...d, forma: { ...d.forma, semente: { ...(d.forma.semente ?? { marca: null, substrato: null, bandeja: null, variedade: null }), variedade: v } } }))}>{v}</Chip>
        ))}
      </div>
    </div>
  );
}

function SementeSubstratoStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label hint="Substrato pra germinar a semente.">Qual substrato?</Label>
      <input
        value={dados.forma.semente?.substrato ?? ""}
        onChange={(e) => setDados((d) => ({ ...d, forma: { ...d.forma, semente: { ...(d.forma.semente ?? { marca: null, variedade: null, bandeja: null, substrato: null }), substrato: e.target.value } } }))}
        placeholder="Ex.: Turfa, Fibra de coco"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
    </div>
  );
}

function SementeBandejaStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label>Qual bandeja?</Label>
      <div className="flex flex-wrap gap-2">
        {BANDEJAS.map((b) => (
          <Chip key={b} selected={dados.forma.semente?.bandeja === b} onClick={() => setDados((d) => ({ ...d, forma: { ...d.forma, semente: { ...(d.forma.semente ?? { marca: null, variedade: null, substrato: null, bandeja: null }), bandeja: b } } }))}>{b} células</Chip>
        ))}
      </div>
    </div>
  );
}

function MudaVariedadeStep({ dados, setDados, cultura }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>>; cultura: string | null }) {
  const sugestoes = useMemo(() => {
    if (!cultura) return ["Comum", "Premium"];
    const c = cultura.toLowerCase();
    if (c.includes("rúcula") || c.includes("rucula")) return ["Folha Larga", "Selvática"];
    if (c.includes("alface")) return ["Crespa", "Americana"];
    if (c.includes("tomate")) return ["Santa Clara", "Cereja"];
    return ["Variedade A", "Variedade B"];
  }, [cultura]);
  return (
    <div>
      <Label>Qual a variedade da muda?</Label>
      <input
        value={dados.forma.muda?.variedade ?? ""}
        onChange={(e) => setDados((d) => ({ ...d, forma: { ...d.forma, muda: { ...(d.forma.muda ?? { fornecedor: null, bandeja: null, variedade: null }), variedade: e.target.value } } }))}
        placeholder="Ex.: Folha Larga"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {sugestoes.map((v) => (
          <Chip key={v} selected={dados.forma.muda?.variedade?.toLowerCase() === v.toLowerCase()} onClick={() => setDados((d) => ({ ...d, forma: { ...d.forma, muda: { ...(d.forma.muda ?? { fornecedor: null, bandeja: null, variedade: null }), variedade: v } } }))}>{v}</Chip>
        ))}
      </div>
    </div>
  );
}

function MudaFornecedorStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label>Quem fornece as mudas?</Label>
      <input
        value={dados.forma.muda?.fornecedor ?? ""}
        onChange={(e) => setDados((d) => ({ ...d, forma: { ...d.forma, muda: { ...(d.forma.muda ?? { variedade: null, bandeja: null, fornecedor: null }), fornecedor: e.target.value } } }))}
        placeholder="Ex.: Viveiro São José"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
    </div>
  );
}

function MudaBandejaStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label>Qual bandeja da muda?</Label>
      <div className="flex flex-wrap gap-2">
        {BANDEJAS.map((b) => (
          <Chip key={b} selected={dados.forma.muda?.bandeja === b} onClick={() => setDados((d) => ({ ...d, forma: { ...d.forma, muda: { ...(d.forma.muda ?? { variedade: null, fornecedor: null, bandeja: null }), bandeja: b } } }))}>{b} células</Chip>
        ))}
      </div>
    </div>
  );
}

function LocalizacaoStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  return (
    <div>
      <Label hint="Se preferir, só o nome que você usa aí na roça.">Onde fica essa área?</Label>
      <input
        value={dados.localizacao.talhao ?? ""}
        onChange={(e) => setDados((d) => ({ ...d, localizacao: { ...d.localizacao, talhao: e.target.value } }))}
        placeholder="Talhão/Lote (ex.: A‑01)"
        className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
      />
      {/* Botão "Marcar no mapa" pode ser integrado no futuro */}
    </div>
  );
}

function MateriaisStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  const st = dados.materiais.status;
  function toggle(item: string) {
    setDados((d) => {
      const on = d.materiais.itens.includes(item);
      return { ...d, materiais: { ...d.materiais, itens: on ? d.materiais.itens.filter((x) => x !== item) : [...d.materiais.itens, item] } };
    });
  }
  return (
    <div>
      <Label>Já comprou os materiais?</Label>
      <div className="grid grid-cols-1 gap-2">
        <CardOption title="Já comprei" selected={st === "ja_comprou"} onClick={() => setDados((d) => ({ ...d, materiais: { ...d.materiais, status: "ja_comprou" } }))} />
        <CardOption title="Ainda não" selected={st === "nao_comprou"} onClick={() => setDados((d) => ({ ...d, materiais: { ...d.materiais, status: "nao_comprou", itens: [] } }))} />
      </div>
      {st === "ja_comprou" && (
        <div className="mt-3">
          <label className="mb-1 block text-sm text-neutral-700">Marque o que você já tem</label>
          <div className="flex flex-wrap gap-2">
            {ITENS_MATERIAIS.map((it) => (
              <Chip key={it} selected={dados.materiais.itens.includes(it)} onClick={() => toggle(it)}>{it}</Chip>
            ))}
          </div>
        </div>
      )}
      {st === "nao_comprou" && <p className="mt-3 text-sm text-neutral-600">Comece por semente/muda, substrato e bandeja.</p>}
    </div>
  );
}

function AduboStep({ dados, setDados }: { dados: Dados; setDados: React.Dispatch<React.SetStateAction<Dados>> }) {
  const tipo = dados.aduboPlantio.tipo;
  return (
    <div>
      <Label>Vai usar qual adubo no plantio?</Label>
      <div className="grid grid-cols-1 gap-2">
        <CardOption title="Granulado" selected={tipo === "granulado"} onClick={() => setDados((d) => ({ ...d, aduboPlantio: { ...d.aduboPlantio, tipo: "granulado", descricao: null } }))} />
        <CardOption title="Orgânico" selected={tipo === "organico"} onClick={() => setDados((d) => ({ ...d, aduboPlantio: { ...d.aduboPlantio, tipo: "organico", descricao: null } }))} />
        <CardOption title="Já possuo" selected={tipo === "ja_possuo"} onClick={() => setDados((d) => ({ ...d, aduboPlantio: { ...d.aduboPlantio, tipo: "ja_possuo" } }))} />
      </div>
      {tipo === "ja_possuo" && (
        <div className="mt-3">
          <label className="mb-1 block text-sm text-neutral-700">Qual?</label>
          <input
            value={dados.aduboPlantio.descricao ?? ""}
            onChange={(e) => setDados((d) => ({ ...d, aduboPlantio: { ...d.aduboPlantio, descricao: e.target.value } }))}
            placeholder="Ex.: 04‑14‑08, Composto orgânico"
            className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base outline-none transition-colors focus:border-emerald-600"
          />
        </div>
      )}
    </div>
  );
}

function RevisaoStep({ dados, goto }: { dados: Dados; goto: (id: StepId) => void }) {
  return (
    <div>
      <Label hint="Pode editar depois, sem estresse.">Confere aí antes de salvar</Label>
      <ResumoCard title="Área" onEdit={() => goto("area")}>
        {dados.area.valor ? `${dados.area.valor} ${dados.area.unidade}` : "—"}
      </ResumoCard>
      <ResumoCard title="Cultura" onEdit={() => goto("cultura")}>
        {dados.cultura || "—"}
      </ResumoCard>
      <ResumoCard title="Correção do solo" onEdit={() => goto("solo")}>
        {dados.solo.correcaoFeita === null ? "—" : dados.solo.correcaoFeita ? "Feita" : "Ainda não"}
      </ResumoCard>
      {!dados.solo.correcaoFeita && (
        <ResumoCard title="Pendências do solo" onEdit={() => goto("solo_pendencias")}>
          {dados.solo.pendencias.length ? dados.solo.pendencias.join(", ") : "—"}
        </ResumoCard>
      )}
      <ResumoCard title="Plantio" onEdit={() => goto("plantio")}>
        {dados.plantio.modo ? (dados.plantio.modo === "linha" ? `Linha${dados.plantio.dimensoes ? ` – ${dados.plantio.dimensoes}` : ""}` : "Canteiro") : "—"}
      </ResumoCard>
      <ResumoCard title="Irrigação" onEdit={() => goto("irrigacao")}>
        {dados.irrigacao.usa === null ? "—" : dados.irrigacao.usa ? `Sim${dados.irrigacao.tipo ? ` – ${dados.irrigacao.tipo}` : ""}` : "Não"}
      </ResumoCard>
      <ResumoCard title="Fértil‑irrigação" onEdit={() => goto("fertirrigacao")}>
        {dados.fertirrigacao ? (dados.fertirrigacao === "sim" ? "Sim" : dados.fertirrigacao === "nao_sei" ? "Não sei" : "Não") : "—"}
      </ResumoCard>
      <ResumoCard title="Forma" onEdit={() => goto("forma")}>
        {dados.forma.tipo ? (dados.forma.tipo === "semente" ? "Semente" : "Muda") : "—"}
      </ResumoCard>
      {dados.forma.tipo === "semente" && (
        <>
          <ResumoCard title="Semente – Marca" onEdit={() => goto("forma_semente_marca")}>
            {dados.forma.semente?.marca || "—"}
          </ResumoCard>
          <ResumoCard title="Semente – Variedade" onEdit={() => goto("forma_semente_variedade")}>
            {dados.forma.semente?.variedade || "—"}
          </ResumoCard>
          <ResumoCard title="Semente – Substrato" onEdit={() => goto("forma_semente_substrato")}>
            {dados.forma.semente?.substrato || "—"}
          </ResumoCard>
          <ResumoCard title="Semente – Bandeja" onEdit={() => goto("forma_semente_bandeja")}>
            {dados.forma.semente?.bandeja ? `${dados.forma.semente?.bandeja} células` : "—"}
          </ResumoCard>
        </>
      )}
      {dados.forma.tipo === "muda" && (
        <>
          <ResumoCard title="Muda – Variedade" onEdit={() => goto("forma_muda_variedade")}>
            {dados.forma.muda?.variedade || "—"}
          </ResumoCard>
          <ResumoCard title="Muda – Fornecedor" onEdit={() => goto("forma_muda_fornecedor")}>
            {dados.forma.muda?.fornecedor || "—"}
          </ResumoCard>
          <ResumoCard title="Muda – Bandeja" onEdit={() => goto("forma_muda_bandeja")}>
            {dados.forma.muda?.bandeja ? `${dados.forma.muda?.bandeja} células` : "—"}
          </ResumoCard>
        </>
      )}
      <ResumoCard title="Localização" onEdit={() => goto("localizacao")}>
        {dados.localizacao.talhao || "—"}
      </ResumoCard>
      <ResumoCard title="Materiais" onEdit={() => goto("materiais")}>
        {dados.materiais.status === "ja_comprou"
          ? dados.materiais.itens.length
            ? `Tem: ${dados.materiais.itens.join(", ")}`
            : "Já comprou"
          : dados.materiais.status === "nao_comprou"
          ? "Ainda não comprou"
          : "—"}
      </ResumoCard>
      <ResumoCard title="Adubo de plantio" onEdit={() => goto("adubo")}>
        {dados.aduboPlantio.tipo === "ja_possuo"
          ? dados.aduboPlantio.descricao || "Já possuo"
          : dados.aduboPlantio.tipo === "granulado"
          ? "Granulado"
          : dados.aduboPlantio.tipo === "organico"
          ? "Orgânico"
          : "—"}
      </ResumoCard>
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Ao confirmar, salvamos esse plantio. Depois dá pra editar.</div>
    </div>
  );
}

function ResumoCard({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="mb-3 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-800">{title}</div>
        {onEdit && (
          <button onClick={onEdit} className="text-sm text-emerald-700 underline-offset-2 hover:underline">Editar</button>
        )}
      </div>
      <div className="text-sm text-neutral-700">{children}</div>
    </div>
  );
}

// -------------------- Validações --------------------

function validate(step: StepId, d: Dados): [true, null] | [false, string] {
  switch (step) {
    case "area": {
      if (!d.area.valor || d.area.valor <= 0) return [false, "Informe um número maior que 0."];
      return [true, null];
    }
    case "cultura": {
      if (!d.cultura || !d.cultura.trim()) return [false, "Diga a cultura (ex.: Rúcula)."];
      return [true, null];
    }
    case "solo": {
      if (d.solo.correcaoFeita === null) return [false, "Escolha uma opção."];
      return [true, null];
    }
    case "plantio": {
      if (!d.plantio.modo) return [false, "Escolha Linha ou Canteiro."];
      return [true, null];
    }
    case "irrigacao": {
      if (d.irrigacao.usa === null) return [false, "Escolha Sim ou Não."];
      if (d.irrigacao.usa && !d.irrigacao.tipo) return [false, "Selecione o tipo de irrigação."];
      return [true, null];
    }
    case "fertirrigacao": {
      if (!d.fertirrigacao) return [false, "Escolha uma opção."];
      return [true, null];
    }
    case "forma": {
      if (!d.forma.tipo) return [false, "Escolha Semente ou Muda."];
      return [true, null];
    }
    case "forma_semente_marca": {
      if (!d.forma.semente?.marca) return [false, "Informe a marca."];
      return [true, null];
    }
    case "forma_semente_variedade": {
      if (!d.forma.semente?.variedade) return [false, "Informe a variedade."];
      return [true, null];
    }
    case "forma_semente_substrato": {
      if (!d.forma.semente?.substrato) return [false, "Informe o substrato."];
      return [true, null];
    }
    case "forma_semente_bandeja": {
      if (!d.forma.semente?.bandeja) return [false, "Escolha a bandeja."];
      return [true, null];
    }
    case "forma_muda_variedade": {
      if (!d.forma.muda?.variedade) return [false, "Informe a variedade da muda."];
      return [true, null];
    }
    case "forma_muda_fornecedor": {
      if (!d.forma.muda?.fornecedor) return [false, "Informe o fornecedor."];
      return [true, null];
    }
    case "forma_muda_bandeja": {
      if (!d.forma.muda?.bandeja) return [false, "Escolha a bandeja."];
      return [true, null];
    }
    case "localizacao": {
      if (!d.localizacao.talhao || !d.localizacao.talhao.trim()) return [false, "Informe a localização (talhão/lote)."];
      return [true, null];
    }
    case "materiais": {
      if (!d.materiais.status) return [false, "Escolha uma opção."];
      return [true, null];
    }
    case "adubo": {
      if (!d.aduboPlantio.tipo) return [false, "Escolha uma opção."];
      if (d.aduboPlantio.tipo === "ja_possuo" && !d.aduboPlantio.descricao) return [false, "Descreva o adubo que você possui."];
      return [true, null];
    }
    default:
      return [true, null];
  }
}
