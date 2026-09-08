import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { MaqBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { dataCurta, horas, money, n } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { TIPO_MAQ_LABEL, type StatusMaquina } from "@/lib/types";

export const Route = createFileRoute("/_app/maquinas/$id")({
  component: MaquinaDetail,
});

function MaquinaDetail() {
  const { id } = Route.useParams();
  const maquina = useFarmStore((s) => s.maquinas.find((m) => m.id === id));
  const ordens = useFarmStore((s) => s.ordens.filter((o) => o.maquinaId === id));
  const apontar = useFarmStore((s) => s.apontarMaquina);
  const setStatus = useFarmStore((s) => s.setMaquinaStatus);
  const addOrdem = useFarmStore((s) => s.addOrdem);
  const concluirOrdem = useFarmStore((s) => s.concluirOrdem);

  const [apOpen, setApOpen] = useState(false);
  const [osOpen, setOsOpen] = useState(false);
  const [h, setH] = useState("");
  const [litros, setLitros] = useState("");
  const [nota, setNota] = useState("");
  const [osTitulo, setOsTitulo] = useState("");
  const [osCusto, setOsCusto] = useState("");
  const [osTipo, setOsTipo] = useState<"preventiva" | "corretiva">("preventiva");

  if (!maquina) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        Máquina não encontrada.{" "}
        <Link to="/maquinas" className="text-primary">
          Voltar
        </Link>
      </div>
    );
  }

  const atrasada = maquina.horas >= maquina.proximaRevisao;
  const span = Math.max(maquina.proximaRevisao, maquina.horas);
  const used = (maquina.horas / span) * 100;

  function submitAp(e: React.FormEvent) {
    e.preventDefault();
    const horasN = Number(h.replace(",", "."));
    if (!horasN) {
      toast.error("Informe as horas");
      return;
    }
    apontar(maquina!.id, horasN, litros ? Number(litros.replace(",", ".")) : null, nota);
    toast.success("Horas lançadas");
    setH("");
    setLitros("");
    setNota("");
    setApOpen(false);
  }

  function submitOs(e: React.FormEvent) {
    e.preventDefault();
    if (!osTitulo.trim()) {
      toast.error("Informe o título");
      return;
    }
    addOrdem({
      maquinaId: maquina!.id,
      titulo: osTitulo.trim(),
      tipo: osTipo,
      data: new Date().toISOString().slice(0, 10),
      status: "aberta",
      custo: Number(osCusto.replace(",", ".")) || 0,
    });
    toast.success("Ordem aberta");
    setOsTitulo("");
    setOsCusto("");
    setOsOpen(false);
  }

  return (
    <div>
      <header className="flex items-center gap-2 px-2 pt-4 md:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link to="/maquinas">
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
          <p className="mt-1 font-display text-2xl tabular-nums">{horas(maquina.horas)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Consumo médio</p>
          <p className="mt-1 font-display text-2xl tabular-nums">
            {maquina.consumoMedio ? `${n(maquina.consumoMedio, 0)} L/h` : "—"}
          </p>
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
          <Progress value={used} tone={atrasada ? "danger" : used > 85 ? "warn" : "primary"} />
        </div>
      </section>

      <section className="mt-4 px-4 md:px-8">
        <p className="mb-2 text-xs text-muted">Status operacional</p>
        <NativeSelect
          value={maquina.status}
          onChange={(e) => setStatus(maquina.id, e.target.value as StatusMaquina)}
        >
          <option value="operando">Operando</option>
          <option value="parada">Parada</option>
          <option value="manutencao">Manutenção</option>
        </NativeSelect>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 px-4 md:px-8">
        <Button onClick={() => setApOpen(true)}>Apontar horas</Button>
        <Button variant="secondary" onClick={() => setOsOpen(true)}>
          Nova OS
        </Button>
      </div>

      <section className="mt-6 px-4 md:px-8">
        <h2 className="mb-3 text-sm font-medium">Ordens de serviço</h2>
        {ordens.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
            Nenhuma OS nesta máquina.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {ordens.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{o.titulo}</p>
                  <p className="text-xs text-muted">
                    {o.tipo} · {dataCurta(o.data)}
                    {o.custo ? ` · ${money(o.custo)}` : ""}
                  </p>
                </div>
                {o.status === "aberta" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      concluirOrdem(o.id);
                      toast.success("OS concluída");
                    }}
                  >
                    Fechar
                  </Button>
                ) : (
                  <span className="text-xs text-ok">Concluída</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 px-4 pb-4 md:px-8">
        <h2 className="mb-3 text-sm font-medium">Últimos apontamentos</h2>
        {maquina.apontamentos.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
            Sem apontamentos ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {maquina.apontamentos.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm">{a.nota || "Apontamento"}</p>
                  <p className="text-xs text-muted">{dataCurta(a.data)}</p>
                </div>
                <p className="text-sm tabular-nums text-muted">
                  {n(a.horas, 1)} h{a.litros ? ` · ${n(a.litros, 0)} L` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Drawer open={apOpen} onOpenChange={setApOpen} title="Apontar horas">
        <form className="flex flex-col gap-4" onSubmit={submitAp}>
          <Field label="Horas">
            <Input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} />
          </Field>
          <Field label="Litros (opcional)">
            <Input inputMode="decimal" value={litros} onChange={(e) => setLitros(e.target.value)} />
          </Field>
          <Field label="Nota">
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Serviço, talhão…" />
          </Field>
          <Button type="submit" className="w-full">
            Lançar
          </Button>
        </form>
      </Drawer>

      <Drawer open={osOpen} onOpenChange={setOsOpen} title="Nova ordem de serviço">
        <form className="flex flex-col gap-4" onSubmit={submitOs}>
          <Field label="Título">
            <Input value={osTitulo} onChange={(e) => setOsTitulo(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <NativeSelect
              value={osTipo}
              onChange={(e) => setOsTipo(e.target.value as "preventiva" | "corretiva")}
            >
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
            </NativeSelect>
          </Field>
          <Field label="Custo estimado">
            <Input inputMode="decimal" value={osCusto} onChange={(e) => setOsCusto(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Abrir OS
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
