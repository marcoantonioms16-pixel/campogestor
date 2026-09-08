import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ActivityForm } from "@/components/activity-form";
import { PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { AtvBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { dataCurta, isAtrasado, isHoje } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { TIPO_ATV_LABEL } from "@/lib/types";

export const Route = createFileRoute("/_app/atividades")({
  component: AtividadesPage,
});

type Filtro = "todas" | "hoje" | "andamento" | "planejadas" | "concluidas";

export function AtividadesPage() {
  const atividades = useFarmStore((s) => s.atividades);
  const talhoes = useFarmStore((s) => s.talhoes);
  const setStatus = useFarmStore((s) => s.setAtividadeStatus);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [horas, setHoras] = useState("");

  const lista = useMemo(() => {
    return atividades
      .filter((a) => {
        if (filtro === "hoje") return isHoje(a.data);
        if (filtro === "andamento") return a.status === "andamento";
        if (filtro === "planejadas") return a.status === "planejada";
        if (filtro === "concluidas") return a.status === "concluida";
        return a.status !== "cancelada";
      })
      .sort((a, b) => a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo));
  }, [atividades, filtro]);

  const active = atividades.find((a) => a.id === activeId) ?? null;

  function concluir() {
    if (!active) return;
    const h = horas ? Number(horas.replace(",", ".")) : active.horas;
    setStatus(active.id, "concluida", h ?? null);
    toast.success("Atividade concluída");
    setActiveId(null);
    setHoras("");
  }

  return (
    <div>
      <PageHeader
        kicker="Apontamento"
        title="Atividades"
        action={
          <Button size="icon" onClick={() => setOpen(true)} aria-label="Nova atividade">
            <Plus className="size-5" />
          </Button>
        }
      />

      <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:px-8">
        {(
          [
            ["todas", "Todas"],
            ["hoje", "Hoje"],
            ["andamento", "Andamento"],
            ["planejadas", "Planejadas"],
            ["concluidas", "Concluídas"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFiltro(k)}
            className={
              filtro === k
                ? "h-9 shrink-0 rounded-full bg-primary px-3 text-xs font-medium text-primary-fg"
                : "h-9 shrink-0 rounded-full bg-elevated px-3 text-xs font-medium text-muted"
            }
          >
            {l}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-8" />}
          title="Nada neste filtro"
          hint="Lance uma atividade de plantio, pulverização ou colheita."
        />
      ) : (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {lista.map((a) => {
            const talhao = talhoes.find((t) => t.id === a.talhaoId);
            const late = isAtrasado(a.data, a.status) && a.status === "planejada";
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(a.id);
                    setHoras(a.horas ? String(a.horas) : "");
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">
                      {dataCurta(a.data)}
                      {late ? " · atrasada" : ""}
                    </p>
                    <p className="font-medium">{a.titulo}</p>
                    <p className="text-sm text-muted">
                      {TIPO_ATV_LABEL[a.tipo]}
                      {talhao ? ` · ${talhao.codigo} ${talhao.nome}` : ""}
                      {` · ${a.responsavel}`}
                    </p>
                  </div>
                  <AtvBadge status={a.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ActivityForm open={open} onOpenChange={setOpen} />

      <Drawer
        open={!!active}
        onOpenChange={(v) => {
          if (!v) setActiveId(null);
        }}
        title={active?.titulo ?? "Atividade"}
      >
        {active ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              {TIPO_ATV_LABEL[active.tipo]} · {dataCurta(active.data)} · {active.responsavel}
            </p>
            {active.observacao ? <p className="text-sm">{active.observacao}</p> : null}
            {active.status !== "concluida" ? (
              <>
                <Field label="Horas trabalhadas">
                  <Input
                    inputMode="decimal"
                    value={horas}
                    onChange={(e) => setHoras(e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  {active.status === "planejada" ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStatus(active.id, "andamento");
                        toast.success("Em andamento");
                        setActiveId(null);
                      }}
                    >
                      Iniciar
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStatus(active.id, "cancelada");
                        toast.success("Cancelada");
                        setActiveId(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button onClick={concluir}>Concluir</Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-ok">Concluída{active.horas ? ` · ${active.horas} h` : ""}</p>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
