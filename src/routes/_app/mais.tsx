import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Pencil,
  RotateCcw,
  Sprout,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ha } from "@/lib/format";
import { useFarmStore } from "@/lib/store";

export const Route = createFileRoute("/_app/mais")({
  component: MaisPage,
});

function MaisPage() {
  const farm = useFarmStore((s) => s.farm);
  const talhoes = useFarmStore((s) => s.talhoes);
  const resetSeed = useFarmStore((s) => s.resetSeed);
  const updateFarm = useFarmStore((s) => s.updateFarm);

  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(farm.nome);
  const [municipio, setMunicipio] = useState(farm.municipio);
  const [cargo, setCargo] = useState(farm.cargo);
  const [safra, setSafra] = useState(farm.safra);

  function openEdit() {
    setNome(farm.nome);
    setMunicipio(farm.municipio);
    setCargo(farm.cargo);
    setSafra(farm.safra);
    setOpen(true);
  }

  function saveFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !municipio.trim()) {
      toast.error("Nome e local são obrigatórios");
      return;
    }
    updateFarm({
      nome: nome.trim(),
      municipio: municipio.trim(),
      cargo: cargo.trim() || "Auxiliar administrativo",
      safra: safra.trim() || "2026/27",
    });
    toast.success("Dados da fazenda atualizados");
    setOpen(false);
  }

  return (
    <div>
      <PageHeader kicker="CampoGestor" title="Mais" />

      <section className="px-4 md:px-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-muted">
                Propriedade
              </p>
              <p className="mt-1 font-display text-xl">{farm.nome}</p>
              <p className="text-sm text-muted">
                {farm.municipio} · safra {farm.safra} · {ha(farm.areaTotal)} ·{" "}
                {talhoes.length} talhões
              </p>
              <p className="mt-1 text-xs text-muted">{farm.cargo}</p>
            </div>
            <Button size="icon" variant="secondary" onClick={openEdit} aria-label="Editar fazenda">
              <Pencil className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <nav className="mt-4 flex flex-col gap-2 px-4 md:px-8">
        <MenuLink
          to="/estoque"
          icon={<Warehouse className="size-4" />}
          title="Estoque"
          hint="Insumos, sementes, diesel e grãos no silo"
        />
        <MenuLink
          to="/talhoes"
          icon={<Sprout className="size-4" />}
          title="Safra e talhões"
          hint="Nome, área, estágio e produtividade"
        />
      </nav>

      <section className="mt-8 px-4 md:px-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">Sobre</p>
        <p className="text-sm leading-relaxed text-muted">
          CampoGestor é a ferramenta do auxiliar administrativo da fazenda: rotina
          diária, frota, estoque, pessoas e talhões. Os dados ficam
          neste aparelho.
        </p>
      </section>

      <div className="mt-6 px-4 pb-4 md:px-8">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            resetSeed();
            toast.success("Dados de exemplo restaurados");
          }}
        >
          <RotateCcw className="size-4" />
          Restaurar fazenda de exemplo
        </Button>
      </div>

      <Drawer open={open} onOpenChange={setOpen} title="Editar fazenda">
        <form className="flex flex-col gap-4" onSubmit={saveFarm}>
          <Field label="Nome da fazenda">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </Field>
          <Field label="Local (município)">
            <Input
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Sorriso — MT"
              required
            />
          </Field>
          <Field label="Seu cargo">
            <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </Field>
          <Field label="Safra">
            <Input value={safra} onChange={(e) => setSafra(e.target.value)} placeholder="2026/27" />
          </Field>
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </Drawer>
    </div>
  );
}

function MenuLink({
  to,
  icon,
  title,
  hint,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
    >
      <span className="flex size-10 items-center justify-center rounded-md bg-elevated text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <ArrowRight className="size-4 text-subtle" />
    </Link>
  );
}
