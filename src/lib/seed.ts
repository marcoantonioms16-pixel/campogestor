import type {
  Abastecimento,
  Admissao,
  Atividade,
  AtividadeMecanizada,
  Compra,
  DieselTanque,
  DiaristaDia,
  Embalagem,
  EpiItem,
  Farm,
  Folga,
  Holerite,
  Insumo,
  Manutencao,
  Maquina,
  Movimento,
  OrdemCampo,
  Pesagem,
  Pessoa,
  Recebimento,
  Refeicao,
  Talhao,
} from "./types";

export interface SeedData {
  farm: Farm;
  diesel: DieselTanque;
  maquinas: Maquina[];
  abastecimentos: Abastecimento[];
  atividadesMec: AtividadeMecanizada[];
  manutencoes: Manutencao[];
  insumos: Insumo[];
  pesagens: Pesagem[];
  movimentos: Movimento[];
  embalagens: Embalagem[];
  recebimentos: Recebimento[];
  compras: Compra[];
  pessoas: Pessoa[];
  diaristas: DiaristaDia[];
  folgas: Folga[];
  refeicoes: Refeicao[];
  holerites: Holerite[];
  epis: EpiItem[];
  admissoes: Admissao[];
  ordens: OrdemCampo[];
  rotinaFeita: Record<string, string>;
  talhoes: Talhao[];
  atividades: Atividade[];
}

export function createSeed(): SeedData {
  return {
    farm: {
      nome: "Fazenda Santa Rita",
      municipio: "Sorriso — MT",
      cargo: "Auxiliar administrativo",
      safra: "2026/27",
      areaTotal: 1850,
    },
    diesel: { capacidade: 15000, litros: 6200 },
    rotinaFeita: { r01: "2026-09-08" },
    maquinas: [
      { id: "mq-1", nome: "Trator 8R", tipo: "trator", modelo: "8R 410", horimetro: 3240, proximaRevisao: 3400, status: "operando" },
      { id: "mq-2", nome: "Trator BH", tipo: "trator", modelo: "BH 194", horimetro: 4120, proximaRevisao: 4000, status: "manutencao" },
      { id: "mq-3", nome: "Colheitadeira", tipo: "colheitadeira", modelo: "Axial-Flow 8250", horimetro: 1890, proximaRevisao: 2000, status: "parada" },
      { id: "mq-4", nome: "Pulverizador", tipo: "pulverizador", modelo: "Imperial 3000", horimetro: 980, proximaRevisao: 1200, status: "operando" },
      { id: "mq-5", nome: "Plantadeira", tipo: "plantadeira", modelo: "Exacta 24", horimetro: 760, proximaRevisao: 900, status: "operando" },
      { id: "mq-6", nome: "Caminhão", tipo: "caminhao", modelo: "Constellation 26.260", horimetro: 245000, proximaRevisao: 250000, status: "operando" },
    ],
    abastecimentos: [
      { id: "ab-1", data: "2026-09-08", maquinaId: "mq-1", litros: 180, horimetro: 3240, operador: "João", fichaRecolhida: false },
      { id: "ab-2", data: "2026-09-08", maquinaId: "mq-5", litros: 95, horimetro: 760, operador: "Carlos", fichaRecolhida: false },
      { id: "ab-3", data: "2026-09-07", maquinaId: "mq-4", litros: 120, horimetro: 978, operador: "Rafael", fichaRecolhida: true },
      { id: "ab-4", data: "2026-09-07", maquinaId: "mq-6", litros: 210, horimetro: 244980, operador: "Pedro", fichaRecolhida: true },
    ],
    atividadesMec: [
      { id: "am-1", data: "2026-09-08", maquinaId: "mq-5", operador: "Carlos", talhao: "TL-02 Lagoa", servico: "Plantio soja", horas: 4.5, recolhida: false },
      { id: "am-2", data: "2026-09-08", maquinaId: "mq-1", operador: "João", talhao: "TL-03 Cerradão", servico: "Adubação de base", horas: 3, recolhida: true },
      { id: "am-3", data: "2026-09-08", maquinaId: "mq-4", operador: "Rafael", talhao: "TL-04 Baixada", servico: "Dessecação", horas: 2.5, recolhida: false },
      { id: "am-4", data: "2026-09-07", maquinaId: "mq-5", operador: "Carlos", talhao: "TL-03 Cerradão", servico: "Plantio soja", horas: 8, recolhida: true },
    ],
    manutencoes: [
      { id: "mt-1", maquinaId: "mq-2", data: "2026-09-05", titulo: "Troca de óleo e filtros", tipo: "preventiva", status: "aberta" },
      { id: "mt-2", maquinaId: "mq-3", data: "2026-08-28", titulo: "Ajuste de rotores", tipo: "corretiva", status: "feita" },
    ],
    insumos: [
      { id: "in-1", nome: "Semente soja TMG 2378", categoria: "semente", unidade: "sc", quantidade: 420, minimo: 200 },
      { id: "in-2", nome: "Semente soja NS 7709", categoria: "semente", unidade: "sc", quantidade: 180, minimo: 150 },
      { id: "in-3", nome: "MAP 11-52-00", categoria: "fertilizante", unidade: "t", quantidade: 28, minimo: 15 },
      { id: "in-4", nome: "Ureia", categoria: "fertilizante", unidade: "t", quantidade: 12, minimo: 10 },
      { id: "in-5", nome: "Glifosato 480", categoria: "defensivo", unidade: "L", quantidade: 980, minimo: 500 },
      { id: "in-6", nome: "Óleo diesel", categoria: "combustivel", unidade: "L", quantidade: 6200, minimo: 3000 },
      { id: "in-7", nome: "Botina PVC", categoria: "epi", unidade: "par", quantidade: 8, minimo: 15 },
      { id: "in-8", nome: "Arroz tipo 1", categoria: "cantina", unidade: "kg", quantidade: 45, minimo: 30 },
    ],
    pesagens: [
      { id: "psg-1", data: "2026-09-08", sentido: "entrada", produto: "Soja", pesoKg: 28500, veiculo: "ABC-1D23", nota: "NF 45821" },
      { id: "psg-2", data: "2026-09-07", sentido: "saida", produto: "Soja", pesoKg: 42000, veiculo: "DEF-4G56", nota: "NF 45818" },
    ],
    movimentos: [
      { id: "mv-1", data: "2026-09-07", tipo: "venda", produto: "Soja", quantidade: 700, unidade: "sc", origem: "Silo 1", destino: "Cooperativa" },
      { id: "mv-2", data: "2026-09-06", tipo: "transferencia", produto: "Soja", quantidade: 1200, unidade: "sc", origem: "Silo 2", destino: "Silo 1" },
    ],
    embalagens: [
      { id: "emb-1", tipo: "Big bag adubo", pendentes: 18, devolvidas: 42 },
      { id: "emb-2", tipo: "Bombona 20L", pendentes: 6, devolvidas: 24 },
    ],
    recebimentos: [
      { id: "rc-1", data: "2026-09-08", fornecedor: "Agroinsumos MT", descricao: "MAP + ureia", nf: "45830", conferido: false, enviadoEscritorio: false },
      { id: "rc-2", data: "2026-09-07", fornecedor: "Sementes Brasil", descricao: "Soja TMG 2378", nf: "11204", conferido: true, enviadoEscritorio: false },
      { id: "rc-3", data: "2026-09-05", fornecedor: "Posto Rural", descricao: "Diesel", nf: "8891", conferido: true, enviadoEscritorio: true },
    ],
    compras: [
      { id: "cp-1", data: "2026-09-08", setor: "cantina", item: "Feijão e óleo", quantidade: "20 kg / 10 L", status: "solicitada" },
      { id: "cp-2", data: "2026-09-07", setor: "epi", item: "Botinas 41 e 42", quantidade: "12 pares", status: "solicitada" },
      { id: "cp-3", data: "2026-09-06", setor: "diesel", item: "Óleo diesel S10", quantidade: "8.000 L", status: "recebida" },
    ],
    pessoas: [
      { id: "ps-1", nome: "João Silva", tipo: "efetivo", funcao: "Operador de trator" },
      { id: "ps-2", nome: "Carlos Mendes", tipo: "efetivo", funcao: "Operador de plantadeira" },
      { id: "ps-3", nome: "Rafael Souza", tipo: "efetivo", funcao: "Pulverizador" },
      { id: "ps-4", nome: "Pedro Lima", tipo: "efetivo", funcao: "Motorista" },
      { id: "ps-5", nome: "Ana Costa", tipo: "efetivo", funcao: "Administrativo" },
      { id: "ps-6", nome: "Marcos Dias", tipo: "diarista", funcao: "Ajudante geral" },
      { id: "ps-7", nome: "José Alves", tipo: "diarista", funcao: "Ajudante geral" },
      { id: "ps-8", nome: "Paulo Rocha", tipo: "diarista", funcao: "Ajudante de máquina" },
      { id: "ps-9", nome: "Lucas Ferreira", tipo: "candidato", funcao: "Operador" },
      { id: "ps-10", nome: "Bruno Nunes", tipo: "candidato", funcao: "Mecânico" },
    ],
    diaristas: [
      { id: "dd-1", pessoaId: "ps-6", data: "2026-09-08", servico: "Limpeza do pátio", presente: true },
      { id: "dd-2", pessoaId: "ps-7", data: "2026-09-08", servico: "Limpeza do barracão", presente: true },
      { id: "dd-3", pessoaId: "ps-8", data: "2026-09-08", servico: "Abastecimento da plantadeira", presente: false },
      { id: "dd-4", pessoaId: "ps-6", data: "2026-09-07", servico: "Carregamento de adubo", presente: true },
    ],
    folgas: [
      { id: "fg-1", pessoaId: "ps-4", data: "2026-09-08", tipo: "folga" },
      { id: "fg-2", pessoaId: "ps-5", data: "2026-09-09", tipo: "folga" },
      { id: "fg-3", pessoaId: "ps-1", data: "2026-09-11", tipo: "atestado" },
    ],
    refeicoes: [
      { id: "rf-1", data: "2026-09-08", cafe: 14, almoco: 18, jantar: 12 },
      { id: "rf-2", data: "2026-09-07", cafe: 13, almoco: 17, jantar: 11 },
    ],
    holerites: [
      { id: "hl-1", pessoaId: "ps-1", competencia: "08/2026", assinado: true },
      { id: "hl-2", pessoaId: "ps-2", competencia: "08/2026", assinado: true },
      { id: "hl-3", pessoaId: "ps-3", competencia: "08/2026", assinado: false },
      { id: "hl-4", pessoaId: "ps-4", competencia: "08/2026", assinado: false },
      { id: "hl-5", pessoaId: "ps-5", competencia: "08/2026", assinado: true },
    ],
    epis: [
      { id: "ep-1", pessoaId: "ps-1", item: "Botina", tamanho: "42", status: "ok" },
      { id: "ep-2", pessoaId: "ps-1", item: "Protetor auricular", tamanho: "U", status: "solicitar" },
      { id: "ep-3", pessoaId: "ps-3", item: "Máscara com filtro", tamanho: "M", status: "solicitar" },
      { id: "ep-4", pessoaId: "ps-6", item: "Luva nitrílica", tamanho: "G", status: "solicitar" },
      { id: "ep-5", pessoaId: "ps-2", item: "Capacete", tamanho: "U", status: "ok" },
    ],
    admissoes: [
      { id: "ad-1", pessoaId: "ps-9", docs: true, exame: true, contrato: false, epi: false, assinatura: false },
      { id: "ad-2", pessoaId: "ps-10", docs: true, exame: false, contrato: false, epi: false, assinatura: false },
    ],
    ordens: [
      { id: "oc-1", data: "2026-09-08", talhao: "TL-02 Lagoa", servico: "Plantio soja TMG 2378", responsavel: "Carlos", status: "andamento" },
      { id: "oc-2", data: "2026-09-08", talhao: "TL-04 Baixada", servico: "Dessecação pré-plantio", responsavel: "Rafael", status: "aberta" },
      { id: "oc-3", data: "2026-09-07", talhao: "TL-03 Cerradão", servico: "Plantio soja NS 7709", responsavel: "Carlos", status: "feita" },
      { id: "oc-4", data: "2026-09-09", talhao: "TL-01 Retiro", servico: "Herbicida pós-emergente", responsavel: "Rafael", status: "aberta" },
    ],
    talhoes: [
      { id: "tl-1", codigo: "TL-01", nome: "Retiro", area: 320, cultura: "soja", variedade: "TMG 2378", estagio: "planejado", plantioEm: null, produtividadeAlvo: 68, produtividadeEst: 0, custoHa: 3200 },
      { id: "tl-2", codigo: "TL-02", nome: "Lagoa", area: 480, cultura: "soja", variedade: "TMG 2378", estagio: "plantio", plantioEm: "2026-09-06", produtividadeAlvo: 70, produtividadeEst: 0, custoHa: 3350 },
      { id: "tl-3", codigo: "TL-03", nome: "Cerradão", area: 550, cultura: "soja", variedade: "NS 7709", estagio: "plantio", plantioEm: "2026-09-05", produtividadeAlvo: 65, produtividadeEst: 0, custoHa: 3100 },
      { id: "tl-4", codigo: "TL-04", nome: "Baixada", area: 500, cultura: "soja", variedade: "TMG 2378", estagio: "preparo", plantioEm: null, produtividadeAlvo: 66, produtividadeEst: 0, custoHa: 3000 },
    ],
    atividades: [
      { id: "at-1", tipo: "plantio", titulo: "Plantio soja TL-02", talhaoId: "tl-2", maquinaId: "mq-5", data: "2026-09-08", status: "andamento", responsavel: "Carlos", observacao: "", horas: 4.5 },
      { id: "at-2", tipo: "adubacao", titulo: "Adubação de base TL-03", talhaoId: "tl-3", maquinaId: "mq-1", data: "2026-09-08", status: "concluida", responsavel: "João", observacao: "", horas: 3 },
      { id: "at-3", tipo: "pulverizacao", titulo: "Dessecação TL-04", talhaoId: "tl-4", maquinaId: "mq-4", data: "2026-09-08", status: "planejada", responsavel: "Rafael", observacao: "Aguardar umidade", horas: null },
      { id: "at-4", tipo: "plantio", titulo: "Plantio soja TL-03", talhaoId: "tl-3", maquinaId: "mq-5", data: "2026-09-07", status: "concluida", responsavel: "Carlos", observacao: "", horas: 8 },
    ],
  };
}
