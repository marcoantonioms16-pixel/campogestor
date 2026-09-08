import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ClipboardList, Fuel, Package, Users } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { dataLonga, hojeISO, litros, n } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { ROTINA } from "@/lib/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

function Home() {
  const farm = useFarmStore((s) => s.farm);
  const diesel = useFarmStore((s) => s.diesel);
  const rotinaFeita = useFarmStore((s) => s.rotinaFeita);
  const toggleRotina = useFarmStore((s) => s.toggleRotina);
  const abastecimentos = useFarmStore((s) => s.abastecimentos);
  const atividadesMec = useFarmStore((s) => s.atividadesMec);
  const recebimentos = useFarmStore((s) => s.recebimentos);
  const holerites = useFarmStore((s) => s.holerites);
  const diaristas = useFarmStore((s) => s.diaristas);
  const epis = useFarmStore((s) => s.epis);
  const insumos = useFarmStore((s) => s.insumos);

  const hoje = hojeISO();
  const feitas = ROTINA.filter((r) => rotinaFeita[r.id] === hoje).length;
  const pct = (feitas / ROTINA.length) * 100;
  const dieselPct = (diesel.litros / diesel.capacidade) * 100;
  const fichasPend = abastecimentos.filter((a) => !a.fichaRecolhida).length;
  const atvPend = atividadesMec.filter((a) => !a.recolhida).length;
  const nfPend = recebimentos.filter((r) => !r.conferido || !r.enviadoEscritorio).length;
  const holeritePend = holerites.filter((h) => !h.assinado).length;
  const diaristasHoje = diaristas.filter((d) => d.data === hoje);
  const epiPend = epis.filter((e) => e.status === "solicitar").length;
  const insumoBaixo = insumos.filter((i) => i.quantidade < i.minimo).length;

  const grupos = [...new Set(ROTINA.map((r) => r.grupo))];

  return (
    <div>
      <PageHeader kicker={farm.cargo} title={farm.nome} />
      <p className="px-4 text-sm text-muted md:px-8">{dataLonga(hoje)} · {farm.municipio}</p>

      <div className="mt-4 px-4 md:px-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Rotina de hoje</p>
            <span className="tabular-nums text-sm text-muted">
              {feitas}/{ROTINA.length}
            </span>
          </div>
          <Progress value={pct} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-8">
        <Kpi label="Diesel no tanque" value={litros(diesel.litros)} hint={`${n(dieselPct, 0)}% da capacidade`} warn={dieselPct < 40} />
        <Kpi label="Fichas / atividades" value={`${fichasPend + atvPend}`} hint="ainda para recolher" warn={fichasPend + atvPend > 0} />
        <Kpi label="NF e material" value={`${nfPend}`} hint="conferir ou enviar" warn={nfPend > 0} />
        <Kpi label="Holerites" value={`${holeritePend}`} hint="sem assinatura" warn={holeritePend > 0} />
      </div>

      <section className="mt-6 px-4 md:px-8">
        <h2 className="mb-3 text-sm font-medium">Pendências</h2>
        <ul className="flex flex-col gap-2">
          {insumoBaixo > 0 ? (
            <Alert to="/estoque" text={`${insumoBaixo} insumo(s) abaixo do mínimo`} />
          ) : null}
          {epiPend > 0 ? <Alert to="/pessoas" text={`${epiPend} EPI(s) para solicitar`} /> : null}
          {diaristasHoje.some((d) => !d.presente) ? (
            <Alert to="/pessoas" text="Diarista sem presença lançada hoje" />
          ) : null}
          {dieselPct < 40 ? <Alert to="/compras" text="Diesel baixo — solicitar compra" /> : null}
        </ul>
      </section>

      <section className="mt-6 px-4 md:px-8">
        <h2 className="mb-3 text-sm font-medium">Lista da rotina</h2>
        {grupos.map((g) => (
          <div key={g} className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">{g}</p>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {ROTINA.filter((r) => r.grupo === g).map((r) => {
                const done = rotinaFeita[r.id] === hoje;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => toggleRotina(r.id)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border",
                          done ? "border-primary bg-primary text-primary-fg" : "border-border",
                        )}
                      >
                        {done ? <Check className="size-3" strokeWidth={3} /> : null}
                      </span>
                      <span className={cn("text-sm", done ? "text-muted line-through" : "text-fg")}>
                        {r.titulo}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 px-4 pb-4 md:grid-cols-4 md:px-8">
        <Quick to="/frota" icon={<Fuel className="size-4" />} label="Diesel e fichas" />
        <Quick to="/estoque" icon={<Package className="size-4" />} label="Estoque e NF" />
        <Quick to="/pessoas" icon={<Users className="size-4" />} label="Pessoas" />
        <Quick to="/campo" icon={<ClipboardList className="size-4" />} label="Ordens de campo" />
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-medium tabular-nums", warn && "text-warn")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </div>
  );
}

function Alert({ to, text }: { to: string; text: string }) {
  return (
    <li>
      <Link to={to} className="block rounded-lg border border-border bg-surface px-4 py-3 text-sm">
        {text}
      </Link>
    </li>
  );
}

function Quick({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
