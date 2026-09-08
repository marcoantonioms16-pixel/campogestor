import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Field } from "@/components/field";
import { MaqBadge, PendenteBadge } from "@/components/status-badge";
import { TabsBar } from "@/components/tabs-bar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { dataCurta, hojeISO, horas, litros, n } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { TIPO_MAQ_LABEL } from "@/lib/types";

export const Route = createFileRoute("/_app/frota/")({
  component: FrotaPage,
});

type Tab = "abastecimento" | "fichas" | "maquinas" | "manutencao";

function FrotaPage() {
  const diesel = useFarmStore((s) => s.diesel);
  const maquinas = useFarmStore((s) => s.maquinas);
  const abastecimentos = useFarmStore((s) => s.abastecimentos);
  const atividadesMec = useFarmStore((s) => s.atividadesMec);
  const manutencoes = useFarmStore((s) => s.manutencoes);
  const addAbastecimento = useFarmStore((s) => s.addAbastecimento);
  const recolherFicha = useFarmStore((s) => s.recolherFicha);
  const recolherAtvMec = useFarmStore((s) => s.recolherAtvMec);
  const concluirManutencao = useFarmStore((s) => s.concluirManutencao);

  const [tab, setTab] = useState<Tab>("abastecimento");
  const [open, setOpen] = useState(false);
  const [maquinaId, setMaquinaId] = useState(maquinas[0]?.id ?? "");
  const [lts, setLts] = useState("");
  const [hor, setHor] = useState("");
  const [op, setOp] = useState("");

  const dieselPct = (diesel.litros / diesel.capacidade) * 100;
  const hojeAbs = abastecimentos.filter((a) => a.data === hojeISO());
  const litrosHoje = hojeAbs.reduce((a, x) => a + x.litros, 0);
  const fichasPend = abastecimentos.filter((a) => !a.fichaRecolhida);
  const atvPend = atividadesMec.filter((a) => !a.recolhida);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const litrosN = Number(lts.replace(",", "."));
    if (!maquinaId || !litrosN) {
      toast.error("Informe máquina e litros");
      return;
    }
    const mq = maquinas.find((m) => m.id === maquinaId);
    addAbastecimento({
      data: hojeISO(),
      maquinaId,
      litros: litrosN,
      horimetro: Number(hor.replace(",", ".")) || mq?.horimetro || 0,
      operador: op.trim() || "Operador",
      fichaRecolhida: true,
    });
    toast.success("Diesel lançado");
    setLts("");
    setHor("");
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        kicker="Fichas e horímetro"
        title="Frota"
        action={
          <Button size="icon" onClick={() => setOpen(true)} aria-label="Lançar diesel">
            <Plus className="size-5" />
          </Button>
        }
      />

      <div className="px-4 md:px-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Tanque de diesel</span>
            <span className="tabular-nums text-muted">
              {litros(diesel.litros)} / {litros(diesel.capacidade)}
            </span>
          </div>
          <Progress value={dieselPct} tone={dieselPct < 40 ? "danger" : dieselPct < 60 ? "warn" : "primary"} />
          <p className="mt-2 text-xs text-muted">
            Hoje saíram {litros(litrosHoje)} · {hojeAbs.length} lançamento(s)
          </p>
        </div>
      </div>

      <div className="mt-4">
        <TabsBar
          value={tab}
          onChange={setTab}
          options={[
            { id: "abastecimento", label: "Abastecimento" },
            { id: "fichas", label: "Recolher" },
            { id: "maquinas", label: "Máquinas" },
            { id: "manutencao", label: "Manutenção" },
          ]}
        />
      </div>

      {tab === "abastecimento" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {abastecimentos.map((a) => {
            const mq = maquinas.find((m) => m.id === a.maquinaId);
            return (
              <li key={a.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">
                      {dataCurta(a.data)} · {a.operador}
                    </p>
                    <p className="font-medium">{mq?.nome ?? "Máquina"}</p>
                    <p className="text-sm tabular-nums text-muted">
                      {litros(a.litros)} · horímetro {n(a.horimetro, 0)}
                    </p>
                  </div>
                  <PendenteBadge ok={a.fichaRecolhida} okLabel="Ficha ok" pendingLabel="Sem ficha" />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {tab === "fichas" ? (
        <div className="px-4 pb-4 md:px-8">
          <h2 className="mb-2 text-sm font-medium">Fichas de abastecimento</h2>
          {fichasPend.length === 0 ? (
            <p className="mb-4 rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
              Todas as fichas foram recolhidas.
            </p>
          ) : (
            <ul className="mb-6 flex flex-col gap-2">
              {fichasPend.map((a) => {
                const mq = maquinas.find((m) => m.id === a.maquinaId);
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{mq?.nome}</p>
                      <p className="text-xs text-muted">
                        {a.operador} · {dataCurta(a.data)} · {litros(a.litros)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        recolherFicha(a.id);
                        toast.success("Ficha recolhida");
                      }}
                    >
                      Recolher
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <h2 className="mb-2 text-sm font-medium">Atividades mecanizadas</h2>
          {atvPend.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
              Atividades do campo já recolhidas.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {atvPend.map((a) => {
                const mq = maquinas.find((m) => m.id === a.maquinaId);
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.servico}</p>
                      <p className="text-xs text-muted">
                        {mq?.nome} · {a.talhao} · {a.operador} · {n(a.horas, 1)} h
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        recolherAtvMec(a.id);
                        toast.success("Atividade recolhida");
                      }}
                    >
                      Recolher
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "maquinas" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {maquinas.map((m) => {
            const atrasada = m.horimetro >= m.proximaRevisao;
            const used = (m.horimetro / Math.max(m.proximaRevisao, m.horimetro)) * 100;
            return (
              <li key={m.id}>
                <Link
                  to="/frota/$id"
                  params={{ id: m.id }}
                  className="block rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">
                        {TIPO_MAQ_LABEL[m.tipo]} · {m.modelo}
                      </p>
                      <p className="font-medium">{m.nome}</p>
                      <p className="text-sm tabular-nums text-muted">{horas(m.horimetro)}</p>
                    </div>
                    <MaqBadge status={m.status} />
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>Revisão {n(m.proximaRevisao, 0)} h</span>
                      {atrasada ? <span className="text-danger">atrasada</span> : null}
                    </div>
                    <Progress value={used} tone={atrasada ? "danger" : "primary"} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {tab === "manutencao" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {manutencoes.map((m) => {
            const mq = maquinas.find((x) => x.id === m.maquinaId);
            return (
              <li key={m.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">
                      {mq?.nome} · {m.tipo} · {dataCurta(m.data)}
                    </p>
                    <p className="font-medium">{m.titulo}</p>
                  </div>
                  <PendenteBadge ok={m.status === "feita"} okLabel="Feita" pendingLabel="Aberta" />
                </div>
                {m.status === "aberta" ? (
                  <Button
                    size="sm"
                    className="mt-3"
                    variant="secondary"
                    onClick={() => {
                      concluirManutencao(m.id);
                      toast.success("Manutenção atualizada");
                    }}
                  >
                    Marcar como feita
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <Drawer open={open} onOpenChange={setOpen} title="Lançar diesel">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label="Máquina">
            <NativeSelect value={maquinaId} onChange={(e) => setMaquinaId(e.target.value)}>
              {maquinas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Litros">
            <Input inputMode="decimal" value={lts} onChange={(e) => setLts(e.target.value)} />
          </Field>
          <Field label="Horímetro">
            <Input inputMode="decimal" value={hor} onChange={(e) => setHor(e.target.value)} />
          </Field>
          <Field label="Operador">
            <Input value={op} onChange={(e) => setOp(e.target.value)} placeholder="Nome" />
          </Field>
          <Button type="submit" className="w-full">
            Lançar
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
