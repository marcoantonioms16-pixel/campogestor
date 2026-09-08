import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Field } from "@/components/field";
import { EstagioBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { ha, scHa } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import {
  CULTURA_LABEL,
  ESTAGIO_LABEL,
  ESTAGIO_ORDEM,
  type Cultura,
  type Estagio,
} from "@/lib/types";

export const Route = createFileRoute("/_app/talhoes/")({
  component: TalhoesPage,
});

function TalhoesPage() {
  const talhoes = useFarmStore((s) => s.talhoes);
  const addTalhao = useFarmStore((s) => s.addTalhao);
  const [filtro, setFiltro] = useState<Estagio | "todos">("todos");
  const [open, setOpen] = useState(false);

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [area, setArea] = useState("");
  const [cultura, setCultura] = useState<Cultura>("soja");
  const [variedade, setVariedade] = useState("");
  const [estagio, setEstagio] = useState<Estagio>("planejado");
  const [alvo, setAlvo] = useState("68");

  const lista = useMemo(
    () =>
      talhoes
        .filter((t) => filtro === "todos" || t.estagio === filtro)
        .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [talhoes, filtro],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(area.replace(",", "."));
    if (!codigo.trim() || !nome.trim() || !a) {
      toast.error("Preencha código, nome e área");
      return;
    }
    addTalhao({
      codigo: codigo.trim().toUpperCase(),
      nome: nome.trim(),
      area: a,
      cultura,
      variedade: variedade.trim() || "—",
      estagio,
      plantioEm: null,
      produtividadeAlvo: Number(alvo) || 0,
      produtividadeEst: 0,
      custoHa: 0,
    });
    toast.success("Talhão cadastrado");
    setCodigo("");
    setNome("");
    setArea("");
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        kicker="Safra 2026/27"
        title="Talhões"
        action={
          <Button size="icon" onClick={() => setOpen(true)} aria-label="Novo talhão">
            <Plus className="size-5" />
          </Button>
        }
      />

      <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:px-8">
        {(["todos", ...ESTAGIO_ORDEM] as const).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setFiltro(e)}
            className={
              filtro === e
                ? "h-9 shrink-0 rounded-full bg-primary px-3 text-xs font-medium text-primary-fg"
                : "h-9 shrink-0 rounded-full bg-elevated px-3 text-xs font-medium text-muted"
            }
          >
            {e === "todos" ? "Todos" : ESTAGIO_LABEL[e]}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
        {lista.map((t) => {
          const pct =
            t.produtividadeAlvo > 0 ? (t.produtividadeEst / t.produtividadeAlvo) * 100 : 0;
          return (
            <li key={t.id}>
              <Link
                to="/talhoes/$id"
                params={{ id: t.id }}
                className="block rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted">{t.codigo}</p>
                    <p className="font-medium">{t.nome}</p>
                    <p className="text-sm text-muted">
                      {ha(t.area)} · {CULTURA_LABEL[t.cultura]} {t.variedade}
                    </p>
                  </div>
                  <EstagioBadge estagio={t.estagio} />
                </div>
                {t.produtividadeEst > 0 ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>Estimada {scHa(t.produtividadeEst)}</span>
                      <span>Alvo {scHa(t.produtividadeAlvo)}</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <Drawer open={open} onOpenChange={setOpen} title="Novo talhão">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código">
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="TL-11" />
            </Field>
            <Field label="Área (ha)">
              <Input
                inputMode="decimal"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="120"
              />
            </Field>
          </div>
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Baixada 2" />
          </Field>
          <Field label="Cultura">
            <NativeSelect value={cultura} onChange={(e) => setCultura(e.target.value as Cultura)}>
              {Object.entries(CULTURA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Variedade">
            <Input
              value={variedade}
              onChange={(e) => setVariedade(e.target.value)}
              placeholder="TMG 2378"
            />
          </Field>
          <Field label="Estágio">
            <NativeSelect value={estagio} onChange={(e) => setEstagio(e.target.value as Estagio)}>
              {ESTAGIO_ORDEM.map((e) => (
                <option key={e} value={e}>
                  {ESTAGIO_LABEL[e]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Alvo (sc/ha)">
            <Input inputMode="decimal" value={alvo} onChange={(e) => setAlvo(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Cadastrar
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
