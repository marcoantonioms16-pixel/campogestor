import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MaqBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { dataCurta, horas, litros, n } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { TIPO_MAQ_LABEL } from "@/lib/types";

export const Route = createFileRoute("/_app/frota/$id")({
  component: MaquinaDetail,
});

function MaquinaDetail() {
  const { id } = Route.useParams();
  const maquina = useFarmStore((s) => s.maquinas.find((m) => m.id === id));
  const abs = useFarmStore((s) => s.abastecimentos.filter((a) => a.maquinaId === id));
  const atv = useFarmStore((s) => s.atividadesMec.filter((a) => a.maquinaId === id));
  const os = useFarmStore((s) => s.manutencoes.filter((m) => m.maquinaId === id));

  if (!maquina) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        Máquina não encontrada.{" "}
        <Link to="/frota" className="text-primary">
          Voltar
        </Link>
      </div>
    );
  }

  const atrasada = maquina.horimetro >= maquina.proximaRevisao;
  const used = (maquina.horimetro / Math.max(maquina.proximaRevisao, maquina.horimetro)) * 100;
  const litros30 = abs.reduce((a, x) => a + x.litros, 0);

  return (
    <div>
      <header className="flex items-center gap-2 px-2 pt-4 md:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link to="/frota">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            {TIPO_MAQ_LABEL[maquina.tipo]} · {maquina.modelo}
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight">{maquina.nome}</h1>
        </div>
        <MaqBadge status={maquina.status} />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3 px-4 md:px-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Horímetro</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{horas(maquina.horimetro)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Diesel lançado</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{litros(litros30)}</p>
        </div>
      </div>

      <section className="mt-4 px-4 md:px-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Próxima revisão</span>
            <span className={atrasada ? "text-danger" : "text-muted"}>
              {n(maquina.proximaRevisao, 0)} h{atrasada ? " · atrasada" : ""}
            </span>
          </div>
          <Progress value={used} tone={atrasada ? "danger" : "primary"} />
        </div>
      </section>

      <section className="mt-6 px-4 md:px-8">
        <h2 className="mb-3 text-sm font-medium">Abastecimentos</h2>
        {abs.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">Sem lançamentos.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {abs.map((a) => (
              <li key={a.id} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {dataCurta(a.data)} · {a.operador}
                </span>
                <span className="tabular-nums text-muted">{litros(a.litros)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 px-4 md:px-8">
        <h2 className="mb-3 text-sm font-medium">Atividades recolhidas</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {atv.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <p className="text-sm font-medium">{a.servico}</p>
              <p className="text-xs text-muted">
                {a.talhao} · {n(a.horas, 1)} h · {a.recolhida ? "recolhida" : "pendente"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 px-4 pb-4 md:px-8">
        <h2 className="mb-3 text-sm font-medium">Manutenção</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {os.map((m) => (
            <li key={m.id} className="flex justify-between px-4 py-3 text-sm">
              <span>{m.titulo}</span>
              <span className="text-muted">{m.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
