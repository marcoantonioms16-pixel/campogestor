import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { dataCurta, kg, n } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { CAT_INSUMO_LABEL } from "@/lib/types";

export const Route = createFileRoute("/_app/estoque")({
  component: EstoquePage,
});

type Tab = "insumos" | "balanca" | "movimento" | "embalagens" | "nf";

function EstoquePage() {
  const insumos = useFarmStore((s) => s.insumos);
  const pesagens = useFarmStore((s) => s.pesagens);
  const movimentos = useFarmStore((s) => s.movimentos);
  const embalagens = useFarmStore((s) => s.embalagens);
  const recebimentos = useFarmStore((s) => s.recebimentos);
  const ajustarInsumo = useFarmStore((s) => s.ajustarInsumo);
  const addPesagem = useFarmStore((s) => s.addPesagem);
  const addMovimento = useFarmStore((s) => s.addMovimento);
  const devolverEmbalagem = useFarmStore((s) => s.devolverEmbalagem);
  const conferirRecebimento = useFarmStore((s) => s.conferirRecebimento);
  const enviarRecebimento = useFarmStore((s) => s.enviarRecebimento);
  const addRecebimento = useFarmStore((s) => s.addRecebimento);

  const [tab, setTab] = useState<Tab>("insumos");
  const [editId, setEditId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [openP, setOpenP] = useState(false);
  const [openM, setOpenM] = useState(false);
  const [openR, setOpenR] = useState(false);
  const [openE, setOpenE] = useState<string | null>(null);
  const [devQ, setDevQ] = useState("");

  const [sentido, setSentido] = useState<"entrada" | "saida">("entrada");
  const [produto, setProduto] = useState("");
  const [peso, setPeso] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [nota, setNota] = useState("");

  const [mtipo, setMtipo] = useState<"transferencia" | "venda">("transferencia");
  const [mprod, setMprod] = useState("");
  const [mqtd, setMqtd] = useState("");
  const [mun, setMun] = useState("sc");
  const [mori, setMori] = useState("");
  const [mdest, setMdest] = useState("");

  const [rf, setRf] = useState("");
  const [rd, setRd] = useState("");
  const [rnf, setRnf] = useState("");

  const editing = insumos.find((i) => i.id === editId);

  return (
    <div>
      <PageHeader
        kicker="Depósito, balança e NF"
        title="Estoque"
        action={
          tab === "balanca" ? (
            <Button size="icon" onClick={() => setOpenP(true)} aria-label="Nova pesagem">
              <Plus className="size-5" />
            </Button>
          ) : tab === "movimento" ? (
            <Button size="icon" onClick={() => setOpenM(true)} aria-label="Novo movimento">
              <Plus className="size-5" />
            </Button>
          ) : tab === "nf" ? (
            <Button size="icon" onClick={() => setOpenR(true)} aria-label="Novo recebimento">
              <Plus className="size-5" />
            </Button>
          ) : undefined
        }
      />

      <TabsBar
        value={tab}
        onChange={setTab}
        options={[
          { id: "insumos", label: "Insumos" },
          { id: "balanca", label: "Balança" },
          { id: "movimento", label: "Venda / transf." },
          { id: "embalagens", label: "Embalagens" },
          { id: "nf", label: "NF e material" },
        ]}
      />

      {tab === "insumos" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {insumos.map((i) => {
            const baixo = i.quantidade < i.minimo;
            const ratio = i.minimo > 0 ? Math.min(100, (i.quantidade / (i.minimo * 2)) * 100) : 100;
            return (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEditId(i.id);
                    setQty(String(i.quantidade));
                  }}
                  className="w-full rounded-xl border border-border bg-surface p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">{CAT_INSUMO_LABEL[i.categoria]}</p>
                      <p className="font-medium">{i.nome}</p>
                      <p className="text-sm tabular-nums text-muted">
                        {n(i.quantidade, i.quantidade >= 100 ? 0 : 1)} {i.unidade}
                      </p>
                    </div>
                    {baixo ? <Badge tone="danger">A contar / baixo</Badge> : null}
                  </div>
                  <Progress className="mt-3" value={ratio} tone={baixo ? "danger" : "primary"} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {tab === "balanca" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {pesagens.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">
                    {dataCurta(p.data)} · {p.veiculo} · {p.nota}
                  </p>
                  <p className="font-medium">{p.produto}</p>
                  <p className="font-display text-xl tabular-nums">{kg(p.pesoKg)}</p>
                </div>
                <Badge tone={p.sentido === "entrada" ? "primary" : "muted"}>
                  {p.sentido === "entrada" ? "Entrada" : "Saída"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "movimento" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {movimentos.map((m) => (
            <li key={m.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">
                {dataCurta(m.data)} · {m.tipo === "venda" ? "Venda" : "Transferência"}
              </p>
              <p className="font-medium">{m.produto}</p>
              <p className="text-sm text-muted">
                {n(m.quantidade, 0)} {m.unidade} · {m.origem} → {m.destino}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "embalagens" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {embalagens.map((e) => (
            <li key={e.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{e.tipo}</p>
                  <p className="text-sm text-muted">
                    {e.pendentes} para devolver · {e.devolvidas} já devolvidas
                  </p>
                </div>
                {e.pendentes > 0 ? <Badge tone="warn">Pendente</Badge> : <Badge tone="ok">Em dia</Badge>}
              </div>
              {e.pendentes > 0 ? (
                <Button size="sm" className="mt-3" variant="secondary" onClick={() => { setOpenE(e.id); setDevQ(""); }}>
                  Registrar devolução
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "nf" ? (
        <ul className="flex flex-col gap-2 px-4 pb-4 md:px-8">
          {recebimentos.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">
                {dataCurta(r.data)} · NF {r.nf}
              </p>
              <p className="font-medium">{r.descricao}</p>
              <p className="text-sm text-muted">{r.fornecedor}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PendenteBadge ok={r.conferido} okLabel="Conferido" pendingLabel="Conferir" />
                <PendenteBadge ok={r.enviadoEscritorio} okLabel="Enviado" pendingLabel="Enviar ao escritório" />
              </div>
              <div className="mt-3 flex gap-2">
                {!r.conferido ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      conferirRecebimento(r.id);
                      toast.success("Material conferido");
                    }}
                  >
                    Conferir
                  </Button>
                ) : null}
                {!r.enviadoEscritorio ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      enviarRecebimento(r.id);
                      toast.success("Enviado ao escritório");
                    }}
                  >
                    Enviar NF
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Drawer
        open={!!editId}
        onOpenChange={(v) => {
          if (!v) setEditId(null);
        }}
        title={editing?.nome ?? "Contagem"}
      >
        <div className="flex flex-col gap-4">
          <Field label={`Quantidade (${editing?.unidade ?? ""})`}>
            <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Button
            className="w-full"
            onClick={() => {
              if (!editId) return;
              ajustarInsumo(editId, Number(qty.replace(",", ".")) || 0);
              toast.success("Saldo atualizado");
              setEditId(null);
            }}
          >
            Atualizar no sistema
          </Button>
        </div>
      </Drawer>

      <Drawer open={openP} onOpenChange={setOpenP} title="Pesagem">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const pesoKg = Number(peso.replace(",", "."));
            if (!produto.trim() || !pesoKg) {
              toast.error("Informe produto e peso");
              return;
            }
            addPesagem({
              data: new Date().toISOString().slice(0, 10),
              sentido,
              produto: produto.trim(),
              pesoKg,
              veiculo: veiculo.trim() || "—",
              nota: nota.trim() || "—",
            });
            toast.success("Pesagem registrada");
            setProduto("");
            setPeso("");
            setOpenP(false);
          }}
        >
          <Field label="Sentido">
            <NativeSelect value={sentido} onChange={(e) => setSentido(e.target.value as "entrada" | "saida")}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </NativeSelect>
          </Field>
          <Field label="Produto">
            <Input value={produto} onChange={(e) => setProduto(e.target.value)} />
          </Field>
          <Field label="Peso (kg)">
            <Input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
          </Field>
          <Field label="Veículo / placa">
            <Input value={veiculo} onChange={(e) => setVeiculo(e.target.value)} />
          </Field>
          <Field label="NF / romaneio">
            <Input value={nota} onChange={(e) => setNota(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Registrar
          </Button>
        </form>
      </Drawer>

      <Drawer open={openM} onOpenChange={setOpenM} title="Venda ou transferência">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mprod.trim()) {
              toast.error("Informe o produto");
              return;
            }
            addMovimento({
              data: new Date().toISOString().slice(0, 10),
              tipo: mtipo,
              produto: mprod.trim(),
              quantidade: Number(mqtd.replace(",", ".")) || 0,
              unidade: mun,
              origem: mori.trim() || "Sede",
              destino: mdest.trim() || "—",
            });
            toast.success("Movimento lançado");
            setMprod("");
            setOpenM(false);
          }}
        >
          <Field label="Tipo">
            <NativeSelect value={mtipo} onChange={(e) => setMtipo(e.target.value as "transferencia" | "venda")}>
              <option value="transferencia">Transferência</option>
              <option value="venda">Venda de produto</option>
            </NativeSelect>
          </Field>
          <Field label="Produto">
            <Input value={mprod} onChange={(e) => setMprod(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantidade">
              <Input inputMode="decimal" value={mqtd} onChange={(e) => setMqtd(e.target.value)} />
            </Field>
            <Field label="Unidade">
              <Input value={mun} onChange={(e) => setMun(e.target.value)} />
            </Field>
          </div>
          <Field label="Origem">
            <Input value={mori} onChange={(e) => setMori(e.target.value)} />
          </Field>
          <Field label="Destino">
            <Input value={mdest} onChange={(e) => setMdest(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Lançar
          </Button>
        </form>
      </Drawer>

      <Drawer
        open={!!openE}
        onOpenChange={(v) => {
          if (!v) setOpenE(null);
        }}
        title="Devolução de embalagem"
      >
        <div className="flex flex-col gap-4">
          <Field label="Quantidade devolvida">
            <Input inputMode="numeric" value={devQ} onChange={(e) => setDevQ(e.target.value)} />
          </Field>
          <Button
            onClick={() => {
              if (!openE) return;
              devolverEmbalagem(openE, Number(devQ) || 0);
              toast.success("Devolução registrada");
              setOpenE(null);
            }}
          >
            Registrar
          </Button>
        </div>
      </Drawer>

      <Drawer open={openR} onOpenChange={setOpenR} title="Material / NF que chegou">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rd.trim()) {
              toast.error("Informe a descrição");
              return;
            }
            addRecebimento({
              data: new Date().toISOString().slice(0, 10),
              fornecedor: rf.trim() || "—",
              descricao: rd.trim(),
              nf: rnf.trim() || "s/ NF",
              conferido: false,
              enviadoEscritorio: false,
            });
            toast.success("Recebimento lançado");
            setRf("");
            setRd("");
            setRnf("");
            setOpenR(false);
          }}
        >
          <Field label="Fornecedor">
            <Input value={rf} onChange={(e) => setRf(e.target.value)} />
          </Field>
          <Field label="O que chegou">
            <Input value={rd} onChange={(e) => setRd(e.target.value)} />
          </Field>
          <Field label="Número da NF">
            <Input value={rnf} onChange={(e) => setRnf(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Lançar para conferência
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
