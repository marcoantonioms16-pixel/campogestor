import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSeed, type SeedData } from "./seed";
import { hojeISO } from "./format";
import type {
  Abastecimento,
  Atividade,
  AtividadeMecanizada,
  Compra,
  Embalagem,
  Estagio,
  Manutencao,
  Movimento,
  OrdemCampo,
  Pesagem,
  Recebimento,
  Refeicao,
  SetorCompra,
  StatusAtividade,
  Talhao,
} from "./types";

function uid() {
  return crypto.randomUUID();
}

interface FarmStore extends SeedData {
  hydrated: boolean;
  setHydrated: () => void;
  resetSeed: () => void;

  updateFarm: (patch: Partial<SeedData["farm"]>) => void;

  toggleRotina: (id: string) => void;

  addAbastecimento: (a: Omit<Abastecimento, "id">) => void;
  recolherFicha: (id: string) => void;
  recolherAtvMec: (id: string) => void;
  addAtvMec: (a: Omit<AtividadeMecanizada, "id">) => void;
  concluirManutencao: (id: string) => void;
  addManutencao: (m: Omit<Manutencao, "id">) => void;

  ajustarInsumo: (id: string, quantidade: number) => void;
  addPesagem: (p: Omit<Pesagem, "id">) => void;
  addMovimento: (m: Omit<Movimento, "id">) => void;
  devolverEmbalagem: (id: string, qtd: number) => void;
  conferirRecebimento: (id: string) => void;
  enviarRecebimento: (id: string) => void;
  addRecebimento: (r: Omit<Recebimento, "id">) => void;

  addCompra: (c: Omit<Compra, "id">) => void;
  receberCompra: (id: string) => void;

  setDiaristaPresente: (id: string, presente: boolean) => void;
  addDiaristaDia: (pessoaId: string, servico: string) => void;
  addFolga: (pessoaId: string, data: string, tipo: "folga" | "atestado" | "ferias") => void;
  setRefeicao: (r: Omit<Refeicao, "id">) => void;
  assinarHolerite: (id: string) => void;
  solicitarEpi: (id: string) => void;
  atenderEpi: (id: string) => void;
  toggleAdmissao: (id: string, campo: "docs" | "exame" | "contrato" | "epi" | "assinatura") => void;

  setOrdemStatus: (id: string, status: OrdemCampo["status"]) => void;
  addOrdem: (o: Omit<OrdemCampo, "id">) => void;

  addTalhao: (t: Omit<Talhao, "id">) => void;
  updateTalhao: (id: string, patch: Partial<Talhao>) => void;

  addAtividade: (a: Omit<Atividade, "id">) => void;
  setAtividadeStatus: (id: string, status: StatusAtividade, horas?: number | null) => void;
}

const empty = createSeed();

export const useFarmStore = create<FarmStore>()(
  persist(
    (set) => ({
      ...empty,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      resetSeed: () => set({ ...createSeed(), hydrated: true }),

      updateFarm: (patch) =>
        set((s) => ({
          farm: { ...s.farm, ...patch },
        })),

      toggleRotina: (id) =>
        set((s) => {
          const hoje = hojeISO();
          const next = { ...s.rotinaFeita };
          if (next[id] === hoje) delete next[id];
          else next[id] = hoje;
          return { rotinaFeita: next };
        }),

      addAbastecimento: (a) =>
        set((s) => ({
          abastecimentos: [{ ...a, id: uid() }, ...s.abastecimentos],
          diesel: { ...s.diesel, litros: Math.max(0, s.diesel.litros - a.litros) },
        })),
      recolherFicha: (id) =>
        set((s) => ({
          abastecimentos: s.abastecimentos.map((x) =>
            x.id === id ? { ...x, fichaRecolhida: true } : x,
          ),
        })),
      recolherAtvMec: (id) =>
        set((s) => ({
          atividadesMec: s.atividadesMec.map((x) =>
            x.id === id ? { ...x, recolhida: true } : x,
          ),
        })),
      addAtvMec: (a) =>
        set((s) => ({ atividadesMec: [{ ...a, id: uid() }, ...s.atividadesMec] })),
      concluirManutencao: (id) =>
        set((s) => ({
          manutencoes: s.manutencoes.map((m) =>
            m.id === id ? { ...m, status: "feita" } : m,
          ),
        })),
      addManutencao: (m) =>
        set((s) => ({ manutencoes: [{ ...m, id: uid() }, ...s.manutencoes] })),

      ajustarInsumo: (id, quantidade) =>
        set((s) => ({
          insumos: s.insumos.map((i) => (i.id === id ? { ...i, quantidade } : i)),
        })),
      addPesagem: (p) => set((s) => ({ pesagens: [{ ...p, id: uid() }, ...s.pesagens] })),
      addMovimento: (m) => set((s) => ({ movimentos: [{ ...m, id: uid() }, ...s.movimentos] })),
      devolverEmbalagem: (id, qtd) =>
        set((s) => ({
          embalagens: s.embalagens.map((e) =>
            e.id === id
              ? {
                  ...e,
                  pendentes: Math.max(0, e.pendentes - qtd),
                  devolvidas: e.devolvidas + qtd,
                }
              : e,
          ),
        })),
      conferirRecebimento: (id) =>
        set((s) => ({
          recebimentos: s.recebimentos.map((r) =>
            r.id === id ? { ...r, conferido: true } : r,
          ),
        })),
      enviarRecebimento: (id) =>
        set((s) => ({
          recebimentos: s.recebimentos.map((r) =>
            r.id === id ? { ...r, enviadoEscritorio: true } : r,
          ),
        })),
      addRecebimento: (r) =>
        set((s) => ({ recebimentos: [{ ...r, id: uid() }, ...s.recebimentos] })),

      addCompra: (c) => set((s) => ({ compras: [{ ...c, id: uid() }, ...s.compras] })),
      receberCompra: (id) =>
        set((s) => ({
          compras: s.compras.map((c) =>
            c.id === id ? { ...c, status: "recebida" } : c,
          ),
        })),

      setDiaristaPresente: (id, presente) =>
        set((s) => ({
          diaristas: s.diaristas.map((d) => (d.id === id ? { ...d, presente } : d)),
        })),
      addDiaristaDia: (pessoaId, servico) =>
        set((s) => ({
          diaristas: [
            { id: uid(), pessoaId, data: hojeISO(), servico, presente: true },
            ...s.diaristas,
          ],
        })),
      addFolga: (pessoaId, data, tipo) =>
        set((s) => ({
          folgas: [{ id: uid(), pessoaId, data, tipo }, ...s.folgas],
        })),
      setRefeicao: (r) =>
        set((s) => {
          const existing = s.refeicoes.find((x) => x.data === r.data);
          if (existing) {
            return {
              refeicoes: s.refeicoes.map((x) =>
                x.data === r.data ? { ...x, ...r } : x,
              ),
            };
          }
          return { refeicoes: [{ ...r, id: uid() }, ...s.refeicoes] };
        }),
      assinarHolerite: (id) =>
        set((s) => ({
          holerites: s.holerites.map((h) =>
            h.id === id ? { ...h, assinado: true } : h,
          ),
        })),
      solicitarEpi: (id) =>
        set((s) => ({
          epis: s.epis.map((e) => (e.id === id ? { ...e, status: "solicitar" } : e)),
        })),
      atenderEpi: (id) =>
        set((s) => ({
          epis: s.epis.map((e) => (e.id === id ? { ...e, status: "ok" } : e)),
        })),
      toggleAdmissao: (id, campo) =>
        set((s) => ({
          admissoes: s.admissoes.map((a) =>
            a.id === id ? { ...a, [campo]: !a[campo] } : a,
          ),
        })),

      setOrdemStatus: (id, status) =>
        set((s) => ({
          ordens: s.ordens.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
      addOrdem: (o) => set((s) => ({ ordens: [{ ...o, id: uid() }, ...s.ordens] })),

      addTalhao: (t) =>
        set((s) => {
          const novo = { ...t, id: uid() };
          const areaTotal = s.talhoes.reduce((a, x) => a + x.area, 0) + novo.area;
          return {
            talhoes: [...s.talhoes, novo],
            farm: { ...s.farm, areaTotal },
          };
        }),
      updateTalhao: (id, patch) =>
        set((s) => {
          const talhoes = s.talhoes.map((t) => (t.id === id ? { ...t, ...patch } : t));
          const areaTotal = talhoes.reduce((a, x) => a + x.area, 0);
          return { talhoes, farm: { ...s.farm, areaTotal } };
        }),

      addAtividade: (a) =>
        set((s) => ({ atividades: [{ ...a, id: uid() }, ...s.atividades] })),
      setAtividadeStatus: (id, status, horas) =>
        set((s) => ({
          atividades: s.atividades.map((a) =>
            a.id === id
              ? { ...a, status, horas: horas !== undefined ? horas : a.horas }
              : a,
          ),
        })),
    }),
    {
      name: "campo-gestor-santa-rita-v2",
      skipHydration: true,
      partialize: (s) => ({
        farm: s.farm,
        diesel: s.diesel,
        maquinas: s.maquinas,
        abastecimentos: s.abastecimentos,
        atividadesMec: s.atividadesMec,
        manutencoes: s.manutencoes,
        insumos: s.insumos,
        pesagens: s.pesagens,
        movimentos: s.movimentos,
        embalagens: s.embalagens,
        recebimentos: s.recebimentos,
        compras: s.compras,
        pessoas: s.pessoas,
        diaristas: s.diaristas,
        folgas: s.folgas,
        refeicoes: s.refeicoes,
        holerites: s.holerites,
        epis: s.epis,
        admissoes: s.admissoes,
        ordens: s.ordens,
        rotinaFeita: s.rotinaFeita,
        talhoes: s.talhoes,
        atividades: s.atividades,
      }),
    },
  ),
);

export type { SetorCompra, Embalagem, Estagio };
