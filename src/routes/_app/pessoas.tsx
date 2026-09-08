import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Field } from "@/components/field";
import { PendenteBadge } from "@/components/status-badge";
import { TabsBar } from "@/components/tabs-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { dataCurta, hojeISO, n } from "@/lib/format";
import { useFarmStore } from "@/lib/store";

export const Route = createFileRoute("/_app/pessoas")({
  component: PessoasPage,
});

type Tab = "diaristas" | "folgas" | "refeicoes" | "holerites" | "epi" | "admissao";

function PessoasPage() {
  const pessoas = useFarmStore((s) => s.pessoas);
  const diaristas = useFarmStore((s) => s.diaristas);
  const folgas = useFarmStore((s) => s.folgas);
  const refeicoes = useFarmStore((s) => s.refeicoes);
  const holerites = useFarmStore((s) => s.holerites);
  const epis = useFarmStore((s) => s.epis);
  const admissoes = useFarmStore((s) => s.admissoes);
  const setDiaristaPresente = useFarmStore((s) => s.setDiaristaPresente);
  const addDiaristaDia = useFarmStore((s) => s.addDiaristaDia);
  const addFolga = useFarmStore((s) => s.addFolga);
  const setRefeicao = useFarmStore((s) => s.setRefeicao);
  const assinarHolerite = useFarmStore((s) => s.assinarHolerite);
  const atenderEpi = useFarmStore((s) => s.atenderEpi);
  const toggleAdmissao = useFarmStore((s) => s.toggleAdmissao);

  const [tab, setTab] = useState<Tab>("diaristas");
  const [openD, setOpenD] = useState(false);
  const [openF, setOpenF] = useState(false);
  const [pessoaId, setPessoaId] = useState("");
  const [servico, setServico] = useState("");
  const [fData, setFData] = useState(hojeISO());
  const [fTipo, setFTipo] = useState<"folga" | "atestado" | "ferias">("folga");

  const hoje = hojeISO();
  const diaristasHoje = diaristas.filter((d) => d.data === hoje);
  const nome = (id: string) => pessoas.find((p) => p.id === id)?.nome ?? "—";
  const refeicaoHoje = refeicoes.find((r) => r.data === hoje) ?? {
    id: "tmp",
    data: hoje,
    cafe: 0,
    almoco: 0,
    jantar: 0,
  };

  const diaristasCad = useMemo(() => pessoas.filter((p) => p.tipo === "diarista"), [pessoas]);
  const efetivos = useMemo(() => pessoas.filter((p) => p.tipo === "efetivo"), [pessoas]);

  return (
    <div>
      <PageHeader
        kicker="Folha da fazenda"
        title="Pessoas"
        action={
          tab === "diaristas" ? (
            <Button size="icon" onClick={() => setOpenD(true)} aria-label="Lançar diarista">
              <Plus className="size-5" />
            </Button>
          ) : tab === "folgas" ? (
            <Button size="icon" onClick={() => setOpenF(true)} aria-label="Nova folga">
              <Plus className="size-5" />
            </Button>
          ) : undefined
        }
      />

      <TabsBar
        value={tab}
        onChange={setTab}
        options={[
          { id: "diaristas", label: "Diaristas" },
          { id: "folgas", label: "Folgas" },
          { id: "refeicoes", label: "Refeições" },
          { id: "holerites", label: "Holerites" },
          { id: "epi", label: "EPIs" },
          { id: "admissao", label: "Admissão" },
        ]}
      />

      {tab === "diaristas" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {diaristasHoje.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
              Nenhum diarista lançado hoje.
            </p>
          ) : (
            diaristasHoje.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{nome(d.pessoaId)}</p>
                  <p className="text-xs text-muted">{d.servico}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDiaristaPresente(d.id, !d.presente)}
                  className="shrink-0"
                >
                  <PendenteBadge ok={d.presente} okLabel="Presente" pendingLabel="Falta" />
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "folgas" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {folgas.map((f) => (
            <li key={f.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{nome(f.pessoaId)}</p>
                  <p className="text-sm text-muted">{dataCurta(f.data)}</p>
                </div>
                <Badge tone={f.tipo === "atestado" ? "warn" : "muted"}>{f.tipo}</Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "refeicoes" ? (
        <div className="px-4 pb-4 md:px-8">
          <p className="mb-3 text-sm text-muted">Contagem de hoje. Toque para ajustar.</p>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["cafe", "Café", refeicaoHoje.cafe],
                ["almoco", "Almoço", refeicaoHoje.almoco],
                ["jantar", "Jantar", refeicaoHoje.jantar],
              ] as const
            ).map(([k, label, val]) => (
              <div key={k} className="rounded-xl border border-border bg-surface p-4 text-center">
                <p className="text-xs text-muted">{label}</p>
                <p className="font-display text-3xl tabular-nums">{val}</p>
                <div className="mt-2 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setRefeicao({
                        data: hoje,
                        cafe: k === "cafe" ? Math.max(0, val - 1) : refeicaoHoje.cafe,
                        almoco: k === "almoco" ? Math.max(0, val - 1) : refeicaoHoje.almoco,
                        jantar: k === "jantar" ? Math.max(0, val - 1) : refeicaoHoje.jantar,
                      })
                    }
                  >
                    −
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      setRefeicao({
                        data: hoje,
                        cafe: k === "cafe" ? val + 1 : refeicaoHoje.cafe,
                        almoco: k === "almoco" ? val + 1 : refeicaoHoje.almoco,
                        jantar: k === "jantar" ? val + 1 : refeicaoHoje.jantar,
                      })
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Total do dia: {n(refeicaoHoje.cafe + refeicaoHoje.almoco + refeicaoHoje.jantar, 0)} refeições
          </p>
        </div>
      ) : null}

      {tab === "holerites" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {holerites.map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{nome(h.pessoaId)}</p>
                <p className="text-xs text-muted">Competência {h.competencia}</p>
              </div>
              {h.assinado ? (
                <PendenteBadge ok okLabel="Assinado" />
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    assinarHolerite(h.id);
                    toast.success("Assinatura recolhida");
                  }}
                >
                  Recolher
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "epi" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {epis.map((e) => (
            <li key={e.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{e.item}</p>
                  <p className="text-sm text-muted">
                    {nome(e.pessoaId)} · tam. {e.tamanho}
                  </p>
                </div>
                <PendenteBadge ok={e.status === "ok"} okLabel="Ok" pendingLabel="Solicitar" />
              </div>
              {e.status === "solicitar" ? (
                <Button
                  size="sm"
                  className="mt-3"
                  variant="secondary"
                  onClick={() => {
                    atenderEpi(e.id);
                    toast.success("EPI atendido");
                  }}
                >
                  Marcar como entregue
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "admissao" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {admissoes.map((a) => {
            const steps: { key: "docs" | "exame" | "contrato" | "epi" | "assinatura"; label: string }[] = [
              { key: "docs", label: "Documentos" },
              { key: "exame", label: "Exame" },
              { key: "contrato", label: "Contrato" },
              { key: "epi", label: "EPI" },
              { key: "assinatura", label: "Assinatura" },
            ];
            const done = steps.filter((s) => a[s.key]).length;
            return (
              <li key={a.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="font-medium">{nome(a.pessoaId)}</p>
                <p className="mb-3 text-xs text-muted">
                  {pessoas.find((p) => p.id === a.pessoaId)?.funcao} · {done}/5
                </p>
                <div className="flex flex-wrap gap-2">
                  {steps.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleAdmissao(a.id, s.key)}
                    >
                      <Badge tone={a[s.key] ? "ok" : "muted"}>{s.label}</Badge>
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Drawer open={openD} onOpenChange={setOpenD} title="Diarista de hoje">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pessoaId) {
              toast.error("Escolha a pessoa");
              return;
            }
            addDiaristaDia(pessoaId, servico.trim() || "Serviços gerais");
            toast.success("Diarista lançado");
            setServico("");
            setOpenD(false);
          }}
        >
          <Field label="Pessoa">
            <NativeSelect value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
              <option value="">Selecione</option>
              {diaristasCad.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Serviço">
            <Input value={servico} onChange={(e) => setServico(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Lançar
          </Button>
        </form>
      </Drawer>

      <Drawer open={openF} onOpenChange={setOpenF} title="Registrar folga">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pessoaId) {
              toast.error("Escolha a pessoa");
              return;
            }
            addFolga(pessoaId, fData, fTipo);
            toast.success("Folga lançada");
            setOpenF(false);
          }}
        >
          <Field label="Pessoa">
            <NativeSelect value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
              <option value="">Selecione</option>
              {efetivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Tipo">
            <NativeSelect value={fTipo} onChange={(e) => setFTipo(e.target.value as "folga" | "atestado" | "ferias")}>
              <option value="folga">Folga</option>
              <option value="atestado">Atestado</option>
              <option value="ferias">Férias</option>
            </NativeSelect>
          </Field>
          <Field label="Data">
            <Input type="date" value={fData} onChange={(e) => setFData(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Registrar
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
