const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const num0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function money(value: number, cents = false) {
  return (cents ? brlCents : brl).format(value);
}

export function n(value: number, digits = 1) {
  return (digits === 0 ? num0 : num).format(value);
}

export function ha(value: number) {
  return `${n(value, value >= 100 ? 0 : 1)} ha`;
}

export function sc(value: number) {
  return `${n(value, 0)} sc`;
}

export function scHa(value: number) {
  return `${n(value, 1)} sc/ha`;
}

export function horas(value: number) {
  return `${n(value, 0)} h`;
}

export function dataCurta(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function dataLonga(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isHoje(iso: string) {
  return iso.slice(0, 10) === hojeISO();
}

export function litros(value: number) {
  return `${n(value, 0)} L`;
}

export function kg(value: number) {
  if (value >= 1000) return `${n(value / 1000, 1)} t`;
  return `${n(value, 0)} kg`;
}

export function isAtrasado(iso: string, status?: string) {
  if (status === "pago" || status === "concluida" || status === "feita" || status === "cumprido") {
    return false;
  }
  const hoje = hojeISO();
  return iso.slice(0, 10) < hoje;
}
