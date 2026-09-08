import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { PendenteBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { dataCurta } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { SETOR_LABEL, type SetorCompra } from "@/lib/types";

export const Route = createFileRoute("/_app/compras")({
  component: ComprasPage,
});

function ComprasPage() {
  const compras = useFarmStore((s) => s.compras);
  const addCompra = useFarmStore((s) => s.addCompra);
  const receberCompra = useFarmStore((s) => s.receberCompra);
  const [open, setOpen] = useState(false);
  const [setor, setSetor] = useState<SetorCompra>("cantina");
  const [item, setItem] = useState("");
  const [qtd, setQtd] = useState("");

  return (
    <div>
      <header className="flex items-center gap-2 px-2 pt-4 md:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link to="/mais">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Pedidos</p>
          <h1 className="font-display text-2xl font-medium tracking-tight">Compras</h1>
        </div>
        <Button size="icon" onClick={() => setOpen(true)} aria-label="Nova solicitação">
          <Plus className="size-5" />
        </Button>
      </header>

      <p className="px-4 pt-2 text-sm text-muted md:px-8">
        Cantina, alojamento, escritório, diesel e EPI.
      </p>

      <ul className="mt-4 flex flex-col gap-2 px-4 pb-4 md:px-8">
        {compras.map((c) => (
          <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">
                  {dataCurta(c.data)} · {SETOR_LABEL[c.setor]}
                </p>
                <p className="font-medium">{c.item}</p>
                <p className="text-sm text-muted">{c.quantidade}</p>
              </div>
              <PendenteBadge
                ok={c.status === "recebida"}
                okLabel="Recebida"
                pendingLabel="Solicitada"
              />
            </div>
            {c.status === "solicitada" ? (
              <Button
                size="sm"
                className="mt-3"
                variant="secondary"
                onClick={() => {
                  receberCompra(c.id);
                  toast.success("Marcado como recebido");
                }}
              >
                Chegou na fazenda
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <Drawer open={open} onOpenChange={setOpen} title="Solicitar compra">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!item.trim()) {
              toast.error("Informe o item");
              return;
            }
            addCompra({
              data: new Date().toISOString().slice(0, 10),
              setor,
              item: item.trim(),
              quantidade: qtd.trim() || "—",
              status: "solicitada",
            });
            toast.success("Solicitação enviada");
            setItem("");
            setQtd("");
            setOpen(false);
          }}
        >
          <Field label="Setor">
            <NativeSelect value={setor} onChange={(e) => setSetor(e.target.value as SetorCompra)}>
              {Object.entries(SETOR_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="O que precisa">
            <Textarea value={item} onChange={(e) => setItem(e.target.value)} />
          </Field>
          <Field label="Quantidade">
            <Input value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Solicitar
          </Button>
        </form>
      </Drawer>
    </div>
  );
}

void Badge;
