export type StatusMaquina = "operando" | "parada" | "manutencao";
export type TipoMaquina =
  | "trator"
  | "colheitadeira"
  | "pulverizador"
  | "plantadeira"
  | "caminhao"
  | "outros";
export type CategoriaInsumo =
  | "semente"
  | "fertilizante"
  | "defensivo"
  | "combustivel"
  | "epi"
  | "cantina"
  | "outros";
export type SetorCompra = "cantina" | "alojamento" | "escritorio" | "diesel" | "epi";
export type TipoPessoa = "efetivo" | "diarista" | "candidato";
export type StatusSimples = "pendente" | "feito";

export type Cultura = "soja" | "milho" | "algodao" | "sorgo" | "outro";
export type Estagio =
  | "planejado"
  | "preparo"
  | "plantio"
  | "desenvolvimento"
  | "colheita"
  | "encerrado";
export type TipoAtividade =
  | "plantio"
  | "adubacao"
  | "pulverizacao"
  | "colheita"
  | "manutencao"
  | "outro";
export type StatusAtividade = "planejada" | "andamento" | "concluida" | "cancelada";

export interface Farm {
  nome: string;
  municipio: string;
  cargo: string;
  safra: string;
  areaTotal: number;
}

export interface DieselTanque {
  capacidade: number;
  litros: number;
}

export interface Maquina {
  id: string;
  nome: string;
  tipo: TipoMaquina;
  modelo: string;
  horimetro: number;
  proximaRevisao: number;
  status: StatusMaquina;
}

export interface Abastecimento {
  id: string;
  data: string;
  maquinaId: string;
  litros: number;
  horimetro: number;
  operador: string;
  fichaRecolhida: boolean;
}

export interface AtividadeMecanizada {
  id: string;
  data: string;
  maquinaId: string;
  operador: string;
  talhao: string;
  servico: string;
  horas: number;
  recolhida: boolean;
}

export interface Manutencao {
  id: string;
  maquinaId: string;
  data: string;
  titulo: string;
  tipo: "preventiva" | "corretiva";
  status: "aberta" | "feita";
}

export interface Insumo {
  id: string;
  nome: string;
  categoria: CategoriaInsumo;
  unidade: string;
  quantidade: number;
  minimo: number;
}

export interface Pesagem {
  id: string;
  data: string;
  sentido: "entrada" | "saida";
  produto: string;
  pesoKg: number;
  veiculo: string;
  nota: string;
}

export interface Movimento {
  id: string;
  data: string;
  tipo: "transferencia" | "venda";
  produto: string;
  quantidade: number;
  unidade: string;
  origem: string;
  destino: string;
}

export interface Embalagem {
  id: string;
  tipo: string;
  pendentes: number;
  devolvidas: number;
}

export interface Recebimento {
  id: string;
  data: string;
  fornecedor: string;
  descricao: string;
  nf: string;
  conferido: boolean;
  enviadoEscritorio: boolean;
}

export interface Compra {
  id: string;
  data: string;
  setor: SetorCompra;
  item: string;
  quantidade: string;
  status: "solicitada" | "recebida";
}

export interface Pessoa {
  id: string;
  nome: string;
  tipo: TipoPessoa;
  funcao: string;
}

export interface DiaristaDia {
  id: string;
  pessoaId: string;
  data: string;
  servico: string;
  presente: boolean;
}

export interface Folga {
  id: string;
  pessoaId: string;
  data: string;
  tipo: "folga" | "atestado" | "ferias";
}

export interface Refeicao {
  id: string;
  data: string;
  cafe: number;
  almoco: number;
  jantar: number;
}

export interface Holerite {
  id: string;
  pessoaId: string;
  competencia: string;
  assinado: boolean;
}

export interface EpiItem {
  id: string;
  pessoaId: string;
  item: string;
  tamanho: string;
  status: "ok" | "solicitar";
}

export interface Admissao {
  id: string;
  pessoaId: string;
  docs: boolean;
  exame: boolean;
  contrato: boolean;
  epi: boolean;
  assinatura: boolean;
}

export interface OrdemCampo {
  id: string;
  data: string;
  talhao: string;
  servico: string;
  responsavel: string;
  status: "aberta" | "andamento" | "feita";
}

export interface Talhao {
  id: string;
  codigo: string;
  nome: string;
  area: number;
  cultura: Cultura;
  variedade: string;
  estagio: Estagio;
  plantioEm: string | null;
  produtividadeAlvo: number;
  produtividadeEst: number;
  custoHa: number;
}

export interface Atividade {
  id: string;
  tipo: TipoAtividade;
  titulo: string;
  talhaoId: string | null;
  maquinaId: string | null;
  data: string;
  status: StatusAtividade;
  responsavel: string;
  observacao: string;
  horas: number | null;
}



export interface RotinaDef {
  id: string;
  titulo: string;
  grupo: string;
}

export const TIPO_MAQ_LABEL: Record<TipoMaquina, string> = {
  trator: "Trator",
  colheitadeira: "Colheitadeira",
  pulverizador: "Pulverizador",
  plantadeira: "Plantadeira",
  caminhao: "Caminhão",
  outros: "Outros",
};

export const CAT_INSUMO_LABEL: Record<CategoriaInsumo, string> = {
  semente: "Semente",
  fertilizante: "Fertilizante",
  defensivo: "Defensivo",
  combustivel: "Combustível",
  epi: "EPI",
  cantina: "Cantina",
  outros: "Outros",
};

export const SETOR_LABEL: Record<SetorCompra, string> = {
  cantina: "Cantina",
  alojamento: "Alojamento",
  escritorio: "Escritório",
  diesel: "Óleo diesel",
  epi: "EPI",
};

export const CULTURA_LABEL: Record<Cultura, string> = {
  soja: "Soja",
  milho: "Milho",
  algodao: "Algodão",
  sorgo: "Sorgo",
  outro: "Outro",
};

export const ESTAGIO_LABEL: Record<Estagio, string> = {
  planejado: "Planejado",
  preparo: "Preparo",
  plantio: "Plantio",
  desenvolvimento: "Desenvolvimento",
  colheita: "Colheita",
  encerrado: "Encerrado",
};

export const ESTAGIO_ORDEM: Estagio[] = [
  "planejado",
  "preparo",
  "plantio",
  "desenvolvimento",
  "colheita",
  "encerrado",
];

export const TIPO_ATV_LABEL: Record<TipoAtividade, string> = {
  plantio: "Plantio",
  adubacao: "Adubação",
  pulverizacao: "Pulverização",
  colheita: "Colheita",
  manutencao: "Manutenção",
  outro: "Outro",
};

export const ROTINA: RotinaDef[] = [
  { id: "r01", grupo: "Frota", titulo: "Recolher atividades mecanizadas e fichas de abastecimento" },
  { id: "r02", grupo: "Frota", titulo: "Verificar e lançar óleo diesel" },
  { id: "r03", grupo: "Frota", titulo: "Gerar relatório de abastecimento e conferência" },
  { id: "r04", grupo: "Frota", titulo: "Conferir frota e atualizar manutenção" },
  { id: "r05", grupo: "Estoque", titulo: "Contar insumos e atualizar o saldo" },
  { id: "r06", grupo: "Estoque", titulo: "Receber e conferir material e nota fiscal" },
  { id: "r07", grupo: "Estoque", titulo: "Pesar mercadorias que entram e saem" },
  { id: "r08", grupo: "Estoque", titulo: "Controlar devolução de embalagens vazias" },
  { id: "r09", grupo: "Estoque", titulo: "Controlar vendas e transferências de produtos" },
  { id: "r10", grupo: "Compras", titulo: "Verificar e solicitar EPIs" },
  { id: "r11", grupo: "Compras", titulo: "Solicitar compra para cantina, alojamento e escritório" },
  { id: "r12", grupo: "Compras", titulo: "Solicitar compra de óleo diesel" },
  { id: "r13", grupo: "Documentos", titulo: "Escanear documentos e NF-e e enviar ao escritório" },
  { id: "r14", grupo: "Documentos", titulo: "Recolher assinatura dos holerites" },
  { id: "r15", grupo: "Pessoas", titulo: "Checklist de admissão e recolhimento de assinatura" },
  { id: "r16", grupo: "Campo", titulo: "Controlar ordens de campo" },
  { id: "r17", grupo: "Pessoas", titulo: "Controlar diaristas" },
  { id: "r18", grupo: "Pessoas", titulo: "Controlar folgas" },
  { id: "r19", grupo: "Pessoas", titulo: "Controlar refeições" },
];
