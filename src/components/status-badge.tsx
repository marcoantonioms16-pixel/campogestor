import { Badge } from "@/components/ui/badge";
import type { Estagio, StatusAtividade, StatusMaquina } from "@/lib/types";
import { ESTAGIO_LABEL } from "@/lib/types";

export function MaqBadge({ status }: { status: StatusMaquina }) {
  const tone = status === "operando" ? "ok" : status === "manutencao" ? "warn" : "muted";
  const label =
    status === "operando" ? "Operando" : status === "manutencao" ? "Manutenção" : "Parada";
  return <Badge tone={tone}>{label}</Badge>;
}

export function PendenteBadge({
  ok,
  okLabel = "Ok",
  pendingLabel = "Pendente",
}: {
  ok: boolean;
  okLabel?: string;
  pendingLabel?: string;
}) {
  return <Badge tone={ok ? "ok" : "warn"}>{ok ? okLabel : pendingLabel}</Badge>;
}

export function EstagioBadge({ estagio }: { estagio: Estagio }) {
  const tone =
    estagio === "colheita" || estagio === "encerrado"
      ? "ok"
      : estagio === "plantio" || estagio === "desenvolvimento"
        ? "warn"
        : "muted";
  return <Badge tone={tone}>{ESTAGIO_LABEL[estagio]}</Badge>;
}

export function AtvBadge({ status }: { status: StatusAtividade }) {
  const map: Record<StatusAtividade, { tone: "ok" | "warn" | "muted" | "danger"; label: string }> = {
    planejada: { tone: "muted", label: "Planejada" },
    andamento: { tone: "warn", label: "Andamento" },
    concluida: { tone: "ok", label: "Concluída" },
    cancelada: { tone: "danger", label: "Cancelada" },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

