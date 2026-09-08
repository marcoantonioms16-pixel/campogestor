import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { hojeISO } from "@/lib/format";
import { useFarmStore } from "@/lib/store";
import { TIPO_ATV_LABEL, type TipoAtividade } from "@/lib/types";

export function ActivityForm({
  open,
  onOpenChange,
  defaultTalhaoId,
  defaultMaquinaId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTalhaoId?: string | null;
  defaultMaquinaId?: string | null;
}) {
  const talhoes = useFarmStore((s) => s.talhoes);
  const maquinas = useFarmStore((s) => s.maquinas);
  const addAtividade = useFarmStore((s) => s.addAtividade);

  const [tipo, setTipo] = useState<TipoAtividade>("plantio");
  const [titulo, setTitulo] = useState("");
  const [talhaoId, setTalhaoId] = useState(defaultTalhaoId ?? "");
  const [maquinaId, setMaquinaId] = useState(defaultMaquinaId ?? "");
  const [data, setData] = useState(hojeISO());
  const [responsavel, setResponsavel] = useState("");
  const [observacao, setObservacao] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const label = TIPO_ATV_LABEL[tipo];
    addAtividade({
      tipo,
      titulo: titulo.trim() || label,
      talhaoId: talhaoId || null,
      maquinaId: maquinaId || null,
      data,
      status: "planejada",
      responsavel: responsavel.trim() || "Equipe",
      observacao: observacao.trim(),
      horas: null,
    });
    toast.success("Atividade lançada");
    setTitulo("");
    setObservacao("");
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Nova atividade">
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Tipo">
          <NativeSelect
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAtividade)}
          >
            {Object.entries(TIPO_ATV_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Título">
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={TIPO_ATV_LABEL[tipo]}
          />
        </Field>
        <Field label="Talhão">
          <NativeSelect value={talhaoId} onChange={(e) => setTalhaoId(e.target.value)}>
            <option value="">Sem talhão</option>
            {talhoes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} · {t.nome}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Máquina">
          <NativeSelect value={maquinaId} onChange={(e) => setMaquinaId(e.target.value)}>
            <option value="">Sem máquina</option>
            {maquinas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Data">
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Responsável">
          <Input
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            placeholder="Equipe"
          />
        </Field>
        <Field label="Observação">
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Dose, janela, umidade…"
          />
        </Field>
        <Button type="submit" className="mt-2 w-full">
          Lançar
        </Button>
      </form>
    </Drawer>
  );
}
