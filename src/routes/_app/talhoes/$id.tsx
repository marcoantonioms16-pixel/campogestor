import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ActivityForm } from "@/components/activity-form";
import { Field } from "@/components/field";
import { AtvBadge, EstagioBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { dataCurta, ha, money, scHa } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import {
  CULTURA_LABEL,
  ESTAGIO_LABEL,
  ESTAGIO_ORDEM,
  TIPO_ATV_LABEL,
  type Estagio,
} from "@/lib/types";

export const Route = createFileRoute("/_app/talhoes/$id")({
  component: TalhaoDetail,
});

function TalhaoDetail() {
  const { id } = Route.useParams();
  const talhao = useFarmStore((s) => s.talhoes.find((t) => t.id === id));
  const atividades = useFarmStore((s) => s.atividades.filter((a) => a.talhaoId === id));
  const updateTalhao = useFarmStore((s) => s.updateTalhao);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editArea, setEditArea] = useState("");

  if (!talhao) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        Talhão não encontrado.{" "}
        <Link to="/talhoes" className="text-primary">
          Voltar
        </Link>
      </div>
    );
  }

  const pct =
    talhao.produtividadeAlvo > 0
      ? (talhao.produtividadeEst / talhao.produtividadeAlvo) * 100
      : 0;

  function openEdit() {
    setEditNome(talhao!.nome);
    setEditArea(String(talhao!.area));
    setEditOpen(true);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const area = Number(editArea.replace(",", "."));
    if (!editNome.trim() || !area || area <= 0) {
      toast.error("Informe nome e área válidos");
      return;
    }
    updateTalhao(talhao!.id, { nome: editNome.trim(), area });
    toast.success("Talhão atualizado");
    setEditOpen(false);
  }

  return (
    <div>
      <header className="flex items-center gap-2 px-2 pt-4 md:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link to="/talhoes">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">{talhao.codigo}</p>
          <h1 className="font-display text-2xl font-medium tracking-tight">{talhao.nome}</h1>
        </div>
        <Button size="icon" variant="secondary" onClick={openEdit} aria-label="Editar talhão">
          <Pencil className="size-4" />
        </Button>
        <EstagioBadge estagio={talhao.estagio} />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-8">
        <Stat label="Área" value={ha(talhao.area)} />
        <Stat label="Cultura" value={`${CULTURA_LABEL[talhao.cultura]}`} />
        <Stat label="Variedade" value={talhao.variedade} />
        <Stat label="Custo/ha" value={talhao.custoHa ? money(talhao.custoHa) : "—"} />
      </div>

      <section className="mt-4 px-4 md:px-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <label className="text-xs text-muted">Estágio da lavoura</label>
          <NativeSelect
            className="mt-1"
            value={talhao.estagio}
            onChange={(e) => {
              const estagio = e.target.value as Estagio;
              updateTalhao(talhao.id, {
                estagio,
                plantioEm:
                  estagio === "plantio" || estagio === "desenvolvimento"
                    ? talhao.plantioEm ?? new Date().toISOString().slice(0, 10)
                    : talhao.plantioEm,
              });
            }}
          >
            {ESTAGIO_ORDEM.map((e) => (
              <option key={e} value={e}>
                {ESTAGIO_LABEL[e]}
              </option>
            ))}
          </NativeSelect>
          {talhao.plantioEm ? (
            <p className="mt-2 text-xs text-muted">Plantio em {dataCurta(talhao.plantioEm)}</p>
          ) : null}
        </div>
      </section>

      {talhao.produtividadeAlvo > 0 ? (
        <section className="mt-4 px-4 md:px-8">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>Produtividade</span>
              <span className="tabular-nums text-muted">
                {talhao.produtividadeEst ? scHa(talhao.produtividadeEst) : "sem estimativa"} /{" "}
                {scHa(talhao.produtividadeAlvo)}
              </span>
            </div>
            <Progress value={pct} />
          </div>
        </section>
      ) : null}

      <section className="mt-6 px-4 md:px-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Atividades neste talhão</h2>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Apontar
          </Button>
        </div>
        {atividades.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
            Nenhuma atividade lançada neste talhão.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {atividades.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.titulo}</p>
                  <p className="text-xs text-muted">
                    {TIPO_ATV_LABEL[a.tipo]} · {dataCurta(a.data)} · {a.responsavel}
                  </p>
                </div>
                <AtvBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActivityForm open={open} onOpenChange={setOpen} defaultTalhaoId={talhao.id} />

      <Drawer open={editOpen} onOpenChange={setEditOpen} title="Editar talhão">
        <form className="flex flex-col gap-4" onSubmit={saveEdit}>
          <Field label="Nome">
            <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
          </Field>
          <Field label="Área (ha)">
            <Input
              inputMode="decimal"
              value={editArea}
              onChange={(e) => setEditArea(e.target.value)}
              required
            />
          </Field>
          <p className="text-xs text-muted">Código: {talhao.codigo} (fixo)</p>
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </Drawer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
