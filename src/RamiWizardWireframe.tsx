import React, { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Sprout, Droplets, Leaf, ClipboardList, Tractor, Package, Layers, FileCheck2 } from "lucide-react";

// Wireframe navegável (MVP) – agora otimizado para mobile
// - Head mobile-first com etapa atual + barra de progresso
// - Touch targets maiores (botões e inputs)
// - Layout responsivo mantendo o visual no desktop

// Tipos de dados do fluxo
type PlantioModo = "linha" | "canteiro" | "convencional" | "nao_informado";

type IrrigacaoTipo = "aspersao" | "gotejamento" | "manual" | "nao_informado";

type AduboTipo = "granulado" | "organico" | "nao_informado";

type SementeOuMuda = "semente" | "muda" | "nao_informado";

interface FormData {
  area_m2: number | "";
  correcao_solo_feita: boolean | null;
  cultura: string;
  plantio: {
    modo: PlantioModo;
    dimensao: string; // ex: "10x5"
  };
  irrigacao: {
    tipo: IrrigacaoTipo;
    fertirrigacao: boolean | null;
  };
  semente_ou_muda: SementeOuMuda;
  insumos: {
    adubo: AduboTipo;
    substrato: string;
    bandeja: string; // ex: "128 células"
    marca?: string;
    variedade?: string;
  };
  localizacao: string;
  materiais_adquiridos: boolean | null;
  status: "rascunho" | "em_andamento" | "finalizado";
}

const CULTURAS_SUGERIDAS = [
  { value: "rucula", label: "Rúcula" },
  { value: "alface", label: "Alface" },
  { value: "couve", label: "Couve" },
  { value: "coentro", label: "Coentro" },
  { value: "cebolinha", label: "Cebolinha" },
];

const RECOMENDACOES_ADUBO: Record<string, { adubo: AduboTipo; observacao: string }[]> = {
  rucula: [
    { adubo: "organico", observacao: "Para canteiro, bom equilíbrio NPK com matéria orgânica." },
    { adubo: "granulado", observacao: "Caso já faça correção de solo, usar NPK 10-10-10 leve." },
  ],
  alface: [
    { adubo: "organico", observacao: "Substrato rico e adubação de plantio orgânica." },
  ],
  default: [
    { adubo: "organico", observacao: "Opção segura para a maioria das culturas folhosas." },
  ],
};

const RECOMENDACOES_IRRIGACAO: Record<string, { tipo: IrrigacaoTipo; dica: string }[]> = {
  rucula: [
    { tipo: "aspersao", dica: "Aspersão leve 2× ao dia em fases quentes." },
    { tipo: "gotejamento", dica: "Gotejo reduz doenças fúngicas em climas úmidos." },
  ],
  default: [
    { tipo: "manual", dica: "Para áreas pequenas, regador já resolve no início." },
  ],
};

const STEPS = [
  { key: "area", label: "Área", icon: Layers },
  { key: "solo", label: "Correção do Solo", icon: Tractor },
  { key: "cultura", label: "Cultura", icon: Sprout },
  { key: "plantio", label: "Plantio", icon: ClipboardList },
  { key: "irrigacao", label: "Irrigação", icon: Droplets },
  { key: "semente_muda", label: "Semente/Muda", icon: Leaf },
  { key: "insumos", label: "Insumos", icon: Package },
  { key: "resumo", label: "Resumo", icon: FileCheck2 },
] as const;

type StepKey = typeof STEPS[number]["key"];

function StepHeader({ current }: { current: number }) {
  const total = STEPS.length;
  const pct = Math.round(((current + 1) / total) * 100);
  const CurrentIcon = STEPS[current].icon;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl md:text-2xl font-semibold">Rami · Fluxo do Produtor</h1>
        <span className="text-xs md:text-sm opacity-70">{current + 1}/{total}</span>
      </div>
      {/* Mobile: etapa atual + barra de progresso */}
      <div className="md:hidden mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 inline-flex items-center gap-2">
            <CurrentIcon className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium">{STEPS[current].label}</span>
          </div>
          <span className="text-xs opacity-70">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-emerald-400/60" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {/* Desktop: grid completo de passos */}
      <div className="hidden md:grid grid-cols-8 gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const active = idx === current;
          const done = idx < current;
          return (
            <div key={s.key} className={`group relative flex items-center gap-2 rounded-2xl border p-2 ${active ? "border-white/20 bg-white/5" : done ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10"}`}>
              <Icon className={`h-4 w-4 ${done ? "text-emerald-400" : "text-white/70"}`} />
              <span className={`text-xs ${active ? "font-semibold" : "opacity-80"}`}>{s.label}</span>
              {done && <Check className="absolute -right-1 -top-1 h-3 w-3 text-emerald-400" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <div className="text-sm font-medium">{label}</div>
      {children}
      {hint && <p className="text-xs opacity-70">{hint}</p>}
    </label>
  );
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {right}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function FooterNav({ onPrev, onNext, disableNext, showSkip, onSkip, isLast }: { onPrev: () => void; onNext: () => void; disableNext?: boolean; showSkip?: boolean; onSkip?: () => void; isLast?: boolean }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button onClick={onPrev} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 md:py-2 text-sm hover:bg-white/5">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="flex items-center gap-2">
        {showSkip && (
          <button onClick={onSkip} className="rounded-xl border border-white/15 px-4 py-3 md:py-2 text-sm hover:bg-white/5">Pular</button>
        )}
        <button disabled={disableNext} onClick={onNext} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 md:py-2 text-sm ${disableNext ? "border border-white/10 opacity-50" : "border border-emerald-400/30 hover:bg-emerald-400/10"}`}>
          {isLast ? "Gerar Resumo" : "Avançar"} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function RamiWizardWireframe() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    area_m2: "",
    correcao_solo_feita: null,
    cultura: "",
    plantio: { modo: "nao_informado", dimensao: "" },
    irrigacao: { tipo: "nao_informado", fertirrigacao: null },
    semente_ou_muda: "nao_informado",
    insumos: { adubo: "nao_informado", substrato: "", bandeja: "" },
    localizacao: "",
    materiais_adquiridos: null,
    status: "rascunho",
  });

  const currentKey: StepKey = STEPS[step].key;

  const valid = useMemo(() => {
    switch (currentKey) {
      case "area":
        return typeof data.area_m2 === "number" && data.area_m2 > 0;
      case "solo":
        return data.correcao_solo_feita !== null && data.localizacao.trim().length > 0;
      case "cultura":
        return data.cultura.trim().length > 0;
      case "plantio":
        return data.plantio.modo !== "nao_informado" && data.plantio.dimensao.trim().length > 0;
      case "irrigacao":
        return data.irrigacao.tipo !== "nao_informado" && data.irrigacao.fertirrigacao !== null;
      case "semente_muda":
        return data.semente_ou_muda !== "nao_informado";
      case "insumos":
        return data.insumos.adubo !== "nao_informado";
      case "resumo":
        return true;
      default:
        return false;
    }
  }, [currentKey, data]);

  const recomendacaoAdubo = useMemo(() => {
    const key = (data.cultura || "default").toLowerCase();
    return RECOMENDACOES_ADUBO[key] ?? RECOMENDACOES_ADUBO.default;
  }, [data.cultura]);

  const recomendacaoIrrigacao = useMemo(() => {
    const key = (data.cultura || "default").toLowerCase();
    return RECOMENDACOES_IRRIGACAO[key] ?? RECOMENDACOES_IRRIGACAO.default;
  }, [data.cultura]);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }
  function skip() {
    next();
  }

  function formatResumo() {
    const linhas: string[] = [];
    linhas.push(`Área: ${data.area_m2 || "—"} m² · Local: ${data.localizacao || "—"}`);
    linhas.push(`Correção de solo: ${data.correcao_solo_feita === null ? "—" : data.correcao_solo_feita ? "Feita" : "Não feita"}`);
    linhas.push(`Cultura: ${data.cultura || "—"}`);
    linhas.push(`Plantio: modo ${data.plantio.modo} · dimensão ${data.plantio.dimensao || "—"}`);
    linhas.push(`Irrigação: ${data.irrigacao.tipo} · Fértil irrigação: ${data.irrigacao.fertirrigacao === null ? "—" : data.irrigacao.fertirrigacao ? "Sim" : "Não"}`);
    linhas.push(`Propagação: ${data.semente_ou_muda}`);
    linhas.push(`Insumos: adubo ${data.insumos.adubo} · substrato ${data.insumos.substrato || "—"} · bandeja ${data.insumos.bandeja || "—"}`);
    if (data.insumos.marca || data.insumos.variedade) {
      linhas.push(`Marca/Variedade: ${data.insumos.marca || "—"} · ${data.insumos.variedade || "—"}`);
    }
    linhas.push(`Materiais adquiridos: ${data.materiais_adquiridos === null ? "—" : data.materiais_adquiridos ? "Sim" : "Não"}`);
    return linhas.join("");
  }

  const isLast = currentKey === "resumo";

  const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 md:py-2 h-12 text-base outline-none";
  const btnChoice = (active: boolean) => `rounded-xl border px-3 py-3 md:py-2 text-sm ${active ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/15"}`;

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24 text-white">
      <StepHeader current={step} />

      {/* Área */}
      {currentKey === "area" && (
        <div className="mt-6 space-y-4">
          <Section title="Cadastro da Área" right={<span className="text-xs opacity-70">Etapa 1/8</span>}>
            <Field label="Tamanho da área (m²)" hint="Informe um valor aproximado. Pode ajustar depois.">
              <input
                type="number"
                min={1}
                placeholder="Ex.: 500"
                className={inputCls}
                value={data.area_m2}
                onChange={(e) => setData((d) => ({ ...d, area_m2: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
            </Field>
            <Field label="Localização (sítio/roça/bairro/cidade)" hint="Ajuda nas recomendações de irrigação e manejo.">
              <input
                type="text"
                placeholder="Ex.: Assentamento Santa Luzia – Campo Grande/MS"
                className={inputCls}
                value={data.localizacao}
                onChange={(e) => setData((d) => ({ ...d, localizacao: e.target.value }))}
              />
            </Field>
          </Section>
          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} />
        </div>
      )}

      {/* Solo */}
      {currentKey === "solo" && (
        <div className="mt-6 space-y-4">
          <Section title="Correção de Solo" right={<span className="text-xs opacity-70">Etapa 2/8</span>}>
            <Field label="Já foi feita a correção de solo?">
              <div className="flex gap-2">
                <button
                  className={btnChoice(data.correcao_solo_feita === true)}
                  onClick={() => setData((d) => ({ ...d, correcao_solo_feita: true }))}
                >
                  Sim
                </button>
                <button
                  className={btnChoice(data.correcao_solo_feita === false)}
                  onClick={() => setData((d) => ({ ...d, correcao_solo_feita: false }))}
                >
                  Não
                </button>
              </div>
            </Field>
          </Section>
          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} />
        </div>
      )}

      {/* Cultura */}
      {currentKey === "cultura" && (
        <div className="mt-6 space-y-4">
          <Section title="Escolha da Cultura" right={<span className="text-xs opacity-70">Etapa 3/8</span>}>
            <Field label="Cultura principal">
              <select
                className={inputCls}
                value={data.cultura}
                onChange={(e) => setData((d) => ({ ...d, cultura: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {CULTURAS_SUGERIDAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </Section>
          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} />
        </div>
      )}

      {/* Plantio */}
      {currentKey === "plantio" && (
        <div className="mt-6 space-y-4">
          <Section title="Definição do Plantio" right={<span className="text-xs opacity-70">Etapa 4/8</span>}>
            <Field label="Modo de plantio">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {([
                  { v: "linha", t: "Linha" },
                  { v: "canteiro", t: "Canteiro" },
                  { v: "convencional", t: "Convencional" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setData((d) => ({ ...d, plantio: { ...d.plantio, modo: opt.v as PlantioModo } }))}
                    className={btnChoice(data.plantio.modo === opt.v)}
                  >
                    {opt.t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Dimensão do canteiro/linha" hint="Ex.: 10x5, 1x20m, etc.">
              <input
                type="text"
                placeholder="Ex.: 10x5"
                className={inputCls}
                value={data.plantio.dimensao}
                onChange={(e) => setData((d) => ({ ...d, plantio: { ...d.plantio, dimensao: e.target.value } }))}
              />
            </Field>
          </Section>
          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} />
        </div>
      )}

      {/* Irrigação */}
      {currentKey === "irrigacao" && (
        <div className="mt-6 space-y-4">
          <Section title="Irrigação" right={<span className="text-xs opacity-70">Etapa 5/8</span>}>
            <Field label="Tipo de irrigação">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "aspersao", t: "Aspersão" },
                  { v: "gotejamento", t: "Gotejamento" },
                  { v: "manual", t: "Manual" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setData((d) => ({ ...d, irrigacao: { ...d.irrigacao, tipo: opt.v as IrrigacaoTipo } }))}
                    className={btnChoice(data.irrigacao.tipo === opt.v)}
                  >
                    {opt.t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Deseja fazer fértil irrigação?">
              <div className="flex gap-2">
                <button
                  className={btnChoice(data.irrigacao.fertirrigacao === true)}
                  onClick={() => setData((d) => ({ ...d, irrigacao: { ...d.irrigacao, fertirrigacao: true } }))}
                >
                  Sim
                </button>
                <button
                  className={btnChoice(data.irrigacao.fertirrigacao === false)}
                  onClick={() => setData((d) => ({ ...d, irrigacao: { ...d.irrigacao, fertirrigacao: false } }))}
                >
                  Não
                </button>
              </div>
            </Field>
          </Section>

          <Section title="Sugestões baseadas na cultura" right={<span className="text-xs opacity-70">Auto · dica</span>}>
            <div className="md:col-span-2 text-sm opacity-90">
              <ul className="list-disc pl-5 space-y-1">
                {recomendacaoIrrigacao.map((rec, i) => (
                  <li key={i}>Preferir <b>{rec.tipo}</b>: {rec.dica}</li>
                ))}
              </ul>
            </div>
          </Section>

          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} />
        </div>
      )}

      {/* Semente/Muda */}
      {currentKey === "semente_muda" && (
        <div className="mt-6 space-y-4">
          <Section title="Semente ou Muda" right={<span className="text-xs opacity-70">Etapa 6/8</span>}>
            <Field label="Opção de propagação">
              <div className="flex gap-2">
                {([
                  { v: "semente", t: "Semente" },
                  { v: "muda", t: "Muda" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setData((d) => ({ ...d, semente_ou_muda: opt.v as SementeOuMuda }))}
                    className={btnChoice(data.semente_ou_muda === opt.v)}
                  >
                    {opt.t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Marca (opcional)">
              <input
                type="text"
                placeholder="Ex.: Isla, Feltrin..."
                className={inputCls}
                value={data.insumos.marca ?? ""}
                onChange={(e) => setData((d) => ({ ...d, insumos: { ...d.insumos, marca: e.target.value } }))}
              />
            </Field>
            <Field label="Variedade (opcional)">
              <input
                type="text"
                placeholder="Ex.: Folha larga, Crespa..."
                className={inputCls}
                value={data.insumos.variedade ?? ""}
                onChange={(e) => setData((d) => ({ ...d, insumos: { ...d.insumos, variedade: e.target.value } }))}
              />
            </Field>
            <Field label="Bandeja (qtd. células)" hint="Ex.: 128 células">
              <input
                type="text"
                placeholder="Ex.: 128 células"
                className={inputCls}
                value={data.insumos.bandeja}
                onChange={(e) => setData((d) => ({ ...d, insumos: { ...d.insumos, bandeja: e.target.value } }))}
              />
            </Field>
            <Field label="Substrato (opcional)">
              <input
                type="text"
                placeholder="Ex.: Biomix, Carolina Soil..."
                className={inputCls}
                value={data.insumos.substrato}
                onChange={(e) => setData((d) => ({ ...d, insumos: { ...d.insumos, substrato: e.target.value } }))}
              />
            </Field>
          </Section>
          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} showSkip onSkip={skip} />
        </div>
      )}

      {/* Insumos */}
      {currentKey === "insumos" && (
        <div className="mt-6 space-y-4">
          <Section title="Adubo de Plantio" right={<span className="text-xs opacity-70">Etapa 7/8</span>}>
            <Field label="Tipo de adubo sugerido">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "organico", t: "Orgânico" },
                  { v: "granulado", t: "Granulado" },
                  { v: "nao_informado", t: "Decidir depois" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setData((d) => ({ ...d, insumos: { ...d.insumos, adubo: opt.v as AduboTipo } }))}
                    className={btnChoice(data.insumos.adubo === opt.v)}
                  >
                    {opt.t}
                  </button>
                ))}
              </div>
            </Field>
            <div className="md:col-span-2 text-sm">
              <p className="mb-2 opacity-80">Recomendações ({data.cultura || "geral"}):</p>
              <ul className="list-disc pl-5 space-y-1">
                {recomendacaoAdubo.map((r, i) => (
                  <li key={i}><b>{r.adubo}</b>: {r.observacao}</li>
                ))}
              </ul>
            </div>
          </Section>

          <Section title="Materiais" right={<span className="text-xs opacity-70">Checklist</span>}>
            <Field label="Já adquiriu os materiais? (sementes/mudas, bandeja, substrato, adubo)">
              <div className="flex gap-2">
                <button
                  className={btnChoice(data.materiais_adquiridos === true)}
                  onClick={() => setData((d) => ({ ...d, materiais_adquiridos: true }))}
                >
                  Sim
                </button>
                <button
                  className={btnChoice(data.materiais_adquiridos === false)}
                  onClick={() => setData((d) => ({ ...d, materiais_adquiridos: false }))}
                >
                  Não
                </button>
              </div>
            </Field>
          </Section>

          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} />
        </div>
      )}

      {/* Resumo */}
      {currentKey === "resumo" && (
        <div className="mt-6 space-y-4">
          <Section title="Resumo do Plano Inicial" right={<span className="text-xs opacity-70">Etapa 8/8</span>}>
            <div className="md:col-span-2">
              <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                {formatResumo()}
              </pre>
            </div>
          </Section>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setData((d) => ({ ...d, status: "em_andamento" }))}
              className="rounded-xl border border-white/15 px-4 py-3 md:py-2 text-sm hover:bg-white/5"
            >
              Salvar como rascunho
            </button>
            <button
              onClick={() => setData((d) => ({ ...d, status: "finalizado" }))}
              className="rounded-xl border border-emerald-400/30 px-4 py-3 md:py-2 text-sm hover:bg-emerald-400/10"
            >
              Concluir fluxo
            </button>
          </div>
          {data.status !== "rascunho" && (
            <p className="text-xs opacity-70">Status atual: {data.status}</p>
          )}
          <FooterNav onPrev={prev} onNext={next} disableNext={!valid} isLast />
        </div>
      )}
    </div>
  );
}
