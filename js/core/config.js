/* Configurações estáveis do aplicativo. */
const KEY = "campogestor-fsrt-dist-v13";
const SB_URL = "https://tetrqmzahbrfgrxzbnwj.supabase.co";
const THEME_KEY = "campogestor-tema";
const SB_KEY = "sb_publishable_tIgk-4oZtKneqljdgIqAWw_Ni6PtoIv";
const SB_AUTH_KEY = "cg-sb-session";

const ROTINA = [
  {id:"d1",grupo:"Diário",titulo:"Recolher atividades mecanizadas e fichas de abastecimento",freq:"diario"},
  {id:"d2",grupo:"Diário",titulo:"Verificar e lançar óleo diesel",freq:"diario"},
  {id:"d3",grupo:"Quando chega",titulo:"Receber e conferir material e nota fiscal",freq:"evento"},
  {id:"d4",grupo:"Quando chega",titulo:"Escanear documentos/NF-e e enviar ao escritório",freq:"evento"},
  {id:"d5",grupo:"Contínuo",titulo:"Pesagem de mercadorias (entrada/saída) e registro",freq:"evento"},
  {id:"d6",grupo:"Contínuo",titulo:"Conferência de frota e registro de manutenção",freq:"evento"},
  {id:"d7",grupo:"Contínuo",titulo:"Controle de ordens de campo",freq:"evento"},
  {id:"d8",grupo:"Contínuo",titulo:"Controle de devolução de embalagens vazias",freq:"evento"},
  {id:"d9",grupo:"Contínuo",titulo:"Controlar vendas e transferências de produtos",freq:"evento"},
  {id:"d10",grupo:"Quando precisar",titulo:"Solicitação de compra de óleo diesel",freq:"evento"},
  {id:"d11",grupo:"Quando precisar",titulo:"Checklist de contratação e recolhimento de assinaturas",freq:"evento"},
  {id:"s1",grupo:"Segunda-feira",titulo:"Contagem de insumos e atualização no servidor",freq:"segunda"},
  {id:"s2",grupo:"Segunda-feira",titulo:"Verificação e solicitação de EPIs",freq:"segunda"},
  {id:"x1",grupo:"Sexta-feira (antes 8:30)",titulo:"Controle de diaristas — passar lista ao gerente",freq:"sexta"},
  {id:"m1",grupo:"Início do mês",titulo:"Recolher assinatura dos holerites",freq:"inicio_mes"},
  {id:"m2",grupo:"Dia 30",titulo:"Solicitação de compra: cantina, alojamento e escritório",freq:"dia30"},
  {id:"m3",grupo:"Final do mês (até dia 25)",titulo:"Controle de folgas — fechar até dia 25",freq:"folgas"},
  {id:"m4",grupo:"Final do mês",titulo:"Gerar relatório de abastecimento e conferência",freq:"fim_mes"},
  {id:"m5",grupo:"Final do mês",titulo:"Controle de refeições",freq:"fim_mes"},
];
const TIPO_MAQ = {trator:"Trator",colheitadeira:"Colheitadeira",pulverizador:"Pulverizador",plantadeira:"Plantadeira",caminhao:"Caminhão",veiculo:"Veículo",distribuidor:"Distribuidor",implemento:"Implemento",equipamento:"Equipamento",maquina:"Máquina",outros:"Outros"};
const CAT = {semente:"Semente",fertilizante:"Fertilizante",defensivo:"Defensivo",combustivel:"Combustível",outros:"Outros"};
const CATS = Object.keys(CAT);
const TIPOS_M = Object.keys(TIPO_MAQ);

