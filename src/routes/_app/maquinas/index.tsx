import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Field } from "@/components/field";
import { MaqBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { horas, n } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { TIPO_MAQ_LABEL, type TipoMaquina } from "@/lib/types";

export const Route = createFileRoute("/_app/maquinas/")({
  component: MaquinasPage,
});

function MaquinasPage() {
  const maquinas = useFarmStore((s) => s.maquinas);
  const addMaquina = useFarmStore((s) => s.addMaquina);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [modelo, setModelo] = useState("");
  const [tipo, setTipo] = useState<TipoMaquina>("trator");
  const [h, setH] = useState("0");
  const [rev, setRev] = useState("500");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const horasAtuais = Number(h) || 0;
    addMaquina({
      nome: nome.trim(),
      modelo: modelo.trim() || "—",
      tipo,
      horas: horasAtuais,
      proximaRevisao: horasAtuais + (Number(rev) || 500),
      consumoMedio: 0,
      status: "parada",
    });
    toast.success("Máquina cadastrada");
    setNome("");
    setModelo("");
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        kicker="Frota"
        title="Máquinas"
        action={
          <Button size="icon" onClick={() => setOpen(true)} aria-label="Nova máquina">
            <Plus className="size-5" />
          </Button>
        }
      />

      <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
        {maquinas.map((m) => {
          const span = Math.max(m.proximaRevisao, m.horas);
          const used = (m.horas / span) * 100;
          const atrasada = m.horas >= m.proximaRevisao;
          return (
            <li key={m.id}>
              <Link
                to="/maquinas/$id"
                params={{ id: m.id }}
                className="block rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">{TIPO_MAQ_LABEL[m.tipo]} · {m.modelo}</p>
                    <p className="font-medium">{m.nome}</p>
                    <p className="text-sm tabular-nums text-muted">{horas(m.horas)}</p>
                  </div>
                  <MaqBadge status={m.status} />
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Revisão {n(m.proximaRevisao, 0)} h</span>
                    {atrasada ? <span className="text-danger">atrasada</span> : null}
                  </div>
                  <Progress value={used} tone={atrasada ? "danger" : used > 85 ? "warn" : "primary"} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <Drawer open={open} onOpenChange={setOpen} title="Nova máquina">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Trator 7" />
          </Field>
          <Field label="Tipo">
            <NativeSelect value={tipo} onChange={(e) => setTipo(e.target.value as TipoMaquina)}>
              {Object.entries(TIPO_MAQ_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Modelo">
            <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Horas atuais">
              <Input inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} />
            </Field>
            <Field label="Próxima revisão em">
              <Input inputMode="numeric" value={rev} onChange={(e) => setRev(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" className="w-full">
            Cadastrar
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
