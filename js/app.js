/* CampoGestor — orquestração principal.
 * As telas, dados e configurações ficam em arquivos separados para reduzir regressões.
 */

function temaAtual(){ return "sol"; }
function applyTema(){ document.documentElement.setAttribute("data-theme", "sol"); try{ localStorage.removeItem(THEME_KEY); }catch(e){} }

function dieselInventario(){
  const itens=(state && state.insumos)||[];
  const diesel=itens.filter(i=>{
    const nome=String(i.nome||"").toLowerCase();
    const tipo=String(i.tipoDef||"").toLowerCase();
    return nome.includes("diesel") || tipo.includes("diesel");
  });
  if(!diesel.length) return null;
  const total=diesel.reduce((sum,i)=>sum+(Number(i.quantidade)||0),0);
  return { total:Number(total.toFixed(2)), itens:diesel };
}
function sincronizaDieselInventario(){
  const d=dieselInventario();
  if(d) state.diesel.litros=d.total;
  return d;
}

function sbHeaders(token) {
  const h = {
    "apikey": SB_KEY,
    "Content-Type": "application/json",
  };
  if (token) h["Authorization"] = "Bearer " + token;
  else h["Authorization"] = "Bearer " + SB_KEY;
  return h;
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SB_AUTH_KEY) || "null"); } catch(e) { return null; }
}
function saveSession(sess) {
  if (sess) localStorage.setItem(SB_AUTH_KEY, JSON.stringify(sess));
  else localStorage.removeItem(SB_AUTH_KEY);
}

async function sbSignup(email, password) {
  const res = await fetch(SB_URL + "/auth/v1/signup", {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.msg || data.error || data.message || ("Erro " + res.status));
  if (data.access_token) {
    saveSession(data);
    sbUser = data.user;
  } else if (data.user) {
    // email confirmation required — try login anyway or inform
    sbUser = data.user;
    if (data.session && data.session.access_token) {
      saveSession(data.session);
    }
  }
  return data;
}

async function sbLogin(email, password) {
  const res = await fetch(SB_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error_description || data.msg || data.error || data.message || ("Erro " + res.status);
    if (String(msg).toLowerCase().includes("confirm") || String(msg).toLowerCase().includes("email")) {
      throw new Error("E-mail ainda não confirmado. No Supabase: Authentication → Users → confirme o usuário, ou desligue Confirm email.");
    }
    throw new Error(msg);
  }
  saveSession(data);
  sbUser = data.user;
  const pulled = await pullCloud();
  if (pulled === true) {
    cloudStatus = "synced";
  } else if (pulled === false) {
    // Primeiro acesso sem cadastro na nuvem: preserva o que está neste aparelho.
    await pushCloud();
  } else {
    // Erro de leitura: não sobrescreve a nuvem com dados locais.
    cloudStatus = "error";
  }
  return data;
}

async function sbLogout() {
  const sess = loadSession();
  if (sess && sess.access_token) {
    try {
      await fetch(SB_URL + "/auth/v1/logout", { method: "POST", headers: sbHeaders(sess.access_token) });
    } catch(e) {}
  }
  saveSession(null);
  sbUser = null;
  cloudStatus = "local";
}

async function initAuth() {
  const sess = loadSession();
  if (!sess || !sess.access_token) return;
  // validate session
  try {
    const res = await fetch(SB_URL + "/auth/v1/user", { headers: sbHeaders(sess.access_token) });
    if (!res.ok) { saveSession(null); return; }
    const user = await res.json();
    sbUser = user;
    await pullCloud();
  } catch(e) {
    console.warn(e);
  }
}

async function pushCloud() {
  if (!sbUser) return;
  const sess = loadSession();
  if (!sess || !sess.access_token) return;
  try {
    cloudStatus = "syncing";
    const payload = { user_id: sbUser.id, data: state, updated_at: new Date().toISOString() };
    const res = await fetch(SB_URL + "/rest/v1/app_state?on_conflict=user_id", {
      method: "POST",
      headers: Object.assign(sbHeaders(sess.access_token), {
        "Prefer": "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || ("HTTP " + res.status));
    }
    cloudStatus = "synced";
  } catch(e) {
    console.warn("cloud save", e);
    cloudStatus = "error";
    cloudError = (e && e.message) ? e.message : String(e);
  }
  const el = document.getElementById("cloud-status");
  if (el) el.textContent = cloudLabel();
}

async function pullCloud() {
  if (!sbUser) return false;
  const sess = loadSession();
  if (!sess || !sess.access_token) return false;
  try {
    const res = await fetch(SB_URL + "/rest/v1/app_state?user_id=eq." + encodeURIComponent(sbUser.id) + "&select=data,updated_at", {
      headers: sbHeaders(sess.access_token),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const rows = await res.json();
    if (rows && rows[0] && rows[0].data) {
      const data = rows[0].data;
      state = {
        ...JSON.parse(JSON.stringify(SEED)),
        ...data,
        farm: { ...SEED.farm, ...(data.farm || {}) },
        diesel: { ...SEED.diesel, ...(data.diesel || {}) },
      };
      sincronizaDieselInventario();
      if (!state.sementes) state.sementes = [];
      if (!state.folgas) state.folgas = [];
      if (!state.equatorial) state.equatorial = SEED.equatorial;
      localStorage.setItem(KEY, JSON.stringify(state));
      cloudStatus = "synced";
      return true;
    }
  } catch(e) {
    console.warn("cloud pull", e);
    cloudStatus = "error";
    cloudError = (e && e.message) ? e.message : String(e);
    return null;
  }
  return false;
}

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      const d = JSON.parse(raw);
      return {
        ...JSON.parse(JSON.stringify(SEED)),
        ...d,
        farm:{...SEED.farm, ...(d.farm||{})},
        diesel:{...SEED.diesel, ...(d.diesel||{})},
        insumos: Array.isArray(d.insumos) ? d.insumos : SEED.insumos,
        maquinas: Array.isArray(d.maquinas) ? d.maquinas : SEED.maquinas,
        pessoas: d.pessoas && d.pessoas.length ? d.pessoas : SEED.pessoas,
        talhoes: d.talhoes && d.talhoes.length ? d.talhoes : SEED.talhoes,
        extintores: d.extintores && d.extintores.length ? d.extintores : (SEED.extintores||[]),
        sementes: Array.isArray(d.sementes) ? d.sementes : (SEED.sementes||[]),
        folgas: Array.isArray(d.folgas) ? d.folgas : (SEED.folgas||[]),
        chuva: Array.isArray(d.chuva) ? d.chuva : (SEED.chuva||[]),
        saidas: Array.isArray(d.saidas) ? d.saidas : (SEED.saidas||[]),
        safraStatus: d.safraStatus || {},
        safraPlantio: d.safraPlantio || {},
        equatorial: d.equatorial || SEED.equatorial,
        rotinaFeita: d.rotinaFeita || {},
      };
    }
  }catch(e){}
  return JSON.parse(JSON.stringify(SEED));
}
function save(){
  sincronizaDieselInventario();
  localStorage.setItem(KEY, JSON.stringify(state));
  scheduleCloudSave();
}
let cloudTimer=null;
function scheduleCloudSave(){
  if(!sbUser) return;
  cloudStatus="syncing";
  clearTimeout(cloudTimer);
  cloudTimer=setTimeout(pushCloud, 800);
}


function cloudLabel(){
  if(!sbUser) return "Só neste aparelho (não logado)";
  if(cloudStatus==="syncing") return "Salvando na nuvem…";
  if(cloudStatus==="synced") return "Sincronizado na nuvem ✓ · " + (sbUser.email||"");
  if(cloudStatus==="error") return "Erro sync: " + (cloudError || "falha") + " — dados locais ok";
  return "Logado: "+(sbUser.email||"");
}
function uid(){ return (crypto.randomUUID && crypto.randomUUID()) || ("id-"+Date.now()+"-"+Math.random().toString(16).slice(2)); }

const PROFILE_KEY = "campogestor_perfil_atual_v1";
const PERFIS = [
  { id: "celio", nome: "Célio Carlos", inicial: "CC", role: "Administrador", canEdit: true },
  { id: "marcos", nome: "Marcos Antônio", inicial: "MA", role: "Administrador", canEdit: true },
  { id: "visitante", nome: "Visitante", inicial: "V", role: "Somente consulta", canEdit: false },
];
function perfilAtual(){
  try {
    const id = localStorage.getItem(PROFILE_KEY) || "marcos";
    return PERFIS.find(p=>p.id===id) || PERFIS[1];
  } catch(e) { return PERFIS[1]; }
}
function setPerfil(id){
  const p=PERFIS.find(x=>x.id===id);
  if(!p) return;
  try { localStorage.setItem(PROFILE_KEY, p.id); } catch(e) {}
}
function isVisitante(){ return perfilAtual().id === "visitante"; }
function perfilCloudResumo(){
  if(!sbUser) return "Somente neste aparelho";
  if(cloudStatus === "syncing") return "Sincronizando com a nuvem…";
  if(cloudStatus === "synced") return "Sincronizado agora";
  if(cloudStatus === "error") return "Nuvem indisponível · dados locais preservados";
  return "Conectado à nuvem";
}

let state = load();
sincronizaDieselInventario();
let sbUser = null;
let cloudStatus = "local"; // local | syncing | synced | error
let cloudError = "";

let page = "hoje";
let menuOpen = false;
let qInsumo = "";
let qMaq = "";
let catExt = "todos";
let catInsumo = "todos";
let catMaq = "todos";
let qSaidaMes = "todos";
let catFaz = "todos";
let safraFiltro = "todos"; // todos | pendente | andamento | concluido
let sortPessoas = "nome"; // nome | aniversario
let folgaMes = (new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0"));
let folgaPessoa = null;
let folgaSemana = 1;
let folgaMesTodo = false;
let edit = null; // {kind, id} or {kind:'novo-...'}
let toastTimer;

function hojeISO(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function diaSemana(ref){ return new Date(ref+"T12:00:00").getDay(); }
function diaDoMes(ref){ return new Date(ref+"T12:00:00").getDate(); }
function ultimoDiaMes(ref){ const d=new Date(ref+"T12:00:00"); return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }
function isSegunda(ref){ return diaSemana(ref)===1; }
function isSexta(ref){ return diaSemana(ref)===5; }
function isInicioMes(ref){ return diaDoMes(ref)<=5; }
function isDia30(ref){ const d=diaDoMes(ref), u=ultimoDiaMes(ref); return d===30 || (u<30 && d===u); }
function isFolgas(ref){ const d=diaDoMes(ref); return d>=20 && d<=25; }
function isFimMes(ref){ const d=diaDoMes(ref), u=ultimoDiaMes(ref); return d>=u-3; }
function rotinaHoje(ref){
  const list=[];
  // diários sempre
  list.push(...ROTINA.filter(r=>r.freq==="diario"));
  if(isSegunda(ref)) list.push(...ROTINA.filter(r=>r.freq==="segunda"));
  if(isSexta(ref)) list.push(...ROTINA.filter(r=>r.freq==="sexta"));
  if(isInicioMes(ref)) list.push(...ROTINA.filter(r=>r.freq==="inicio_mes"));
  if(isDia30(ref)) list.push(...ROTINA.filter(r=>r.freq==="dia30"));
  if(isFolgas(ref)) list.push(...ROTINA.filter(r=>r.freq==="folgas"));
  if(isFimMes(ref)) list.push(...ROTINA.filter(r=>r.freq==="fim_mes"));
  return list;
}


function headerBar(kicker, title, rightHtml=""){
  const p=perfilAtual();
  return `<header class="header">
    <button type="button" class="menu-btn" id="btn-menu" aria-label="Menu" aria-expanded="${menuOpen?"true":"false"}">☰</button>
    <div class="header-main" style="flex:1;min-width:0">${kicker?`<p class="kicker">${kicker}</p>`:""}<h1>${title}</h1></div>
    ${rightHtml||""}
    <button type="button" class="profile-trigger" id="btn-profile" aria-label="Perfil de ${esc(p.nome)}">
      <span class="profile-avatar">${esc(p.inicial)}</span>
      <span class="profile-trigger-name">${esc(p.nome)}</span>
    </button>
  </header>`;
}

function progressoHoje(ref){
  const list = rotinaHoje(ref);
  if(!list.length) return {total:0,done:0,pct:0};
  const done = list.filter(r => state.rotinaFeita[r.id]===ref).length;
  const pct = Math.round((done/list.length)*100);
  return {total:list.length, done, pct};
}

function rotinaLegenda(ref){
  const parts=["Diário"];
  if(isSegunda(ref)) parts.push("Segunda");
  if(isSexta(ref)) parts.push("Sexta · diaristas ≤8:30");
  if(isInicioMes(ref)) parts.push("Início do mês");
  if(isDia30(ref)) parts.push("Dia 30 · compras");
  if(isFolgas(ref)) parts.push("Folgas (até dia 25)");
  if(isFimMes(ref)) parts.push("Final do mês");
  return "Lembretes de hoje: "+parts.join(" · ");
}
function proximosLembretes(ref){
  const d=new Date(ref+"T12:00:00");
  const avisos=[];
  // look ahead 7 days for special
  for(let i=1;i<=7;i++){
    const x=new Date(d); x.setDate(d.getDate()+i);
    const iso=x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
    const labels=[];
    if(isSegunda(iso)) labels.push("insumos + EPIs");
    if(isSexta(iso)) labels.push("diaristas");
    if(isDia30(iso)) labels.push("compras cantina/alojamento");
    if(isFolgas(iso) && diaDoMes(iso)===20) labels.push("iniciar fechamento de folgas");
    if(isFimMes(iso) && diaDoMes(iso)===ultimoDiaMes(iso)-3) labels.push("relatório abastecimento + refeições");
    if(isInicioMes(iso) && diaDoMes(iso)===1) labels.push("holerites");
    if(labels.length) avisos.push({iso, labels:labels.join(", ")});
  }
  return avisos;
}

function n(v,d=1){ return Number(v).toLocaleString("pt-BR",{maximumFractionDigits:d}); }
function ha(v){ return n(v, v>=100?0:1)+" ha"; }
function dataLonga(iso){ const d=new Date(iso+"T12:00:00"); return d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}); }
function dataNascimentoFmt(iso){ const d=new Date(iso+"T12:00:00"); return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"long"}); }
function mesDia(iso){ return iso.slice(5,10); }
function aniversarioHoje(nasc, ref){ return nasc && mesDia(nasc)===mesDia(ref); }
function aniversarioEmAte(nasc, dias, ref){
  if(!nasc) return false;
  const base=new Date(ref+"T12:00:00");
  for(let i=0;i<=dias;i++){ const d=new Date(base); d.setDate(base.getDate()+i);
    const md=String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    if(mesDia(nasc)===md) return true; }
  return false;
}
function idadeEm(nasc, ref){ const n0=new Date(nasc+"T12:00:00"), r=new Date(ref+"T12:00:00"); let idade=r.getFullYear()-n0.getFullYear(); const m=r.getMonth()-n0.getMonth(); if(m<0||(m===0&&r.getDate()<n0.getDate())) idade--; return idade; }
function tempoDeCasa(admissao, ref){
  if(!admissao) return null;
  const a=new Date(admissao+"T12:00:00"), r=new Date(ref+"T12:00:00");
  if(r < a) return "Recém-admitido";
  let anos = r.getFullYear() - a.getFullYear();
  let meses = r.getMonth() - a.getMonth();
  if(r.getDate() < a.getDate()) meses--;
  if(meses < 0){ anos--; meses += 12; }
  const partes=[];
  if(anos > 0) partes.push(anos + (anos===1?" ano":" anos"));
  if(meses > 0) partes.push(meses + (meses===1?" mês":" meses"));
  if(!partes.length){
    const dias = Math.floor((r - a) / 86400000);
    return dias <= 1 ? "1 dia" : dias + " dias";
  }
  return partes.join(" e ");
}
function janelaMapa(){
  const d={vazioIni:"2026-06-27",vazioFim:"2026-09-24",semeaduraIni:"2026-09-25",semeaduraFim:"2027-01-02",portaria:"Portaria SDA/MAPA nº 1.579, de 9 de abril de 2026",fonte:"https://goias.gov.br/agrodefesa/programa-de-soja/"};
  return Object.assign(d, (state.farm&&state.farm.janela)||{});
}
function statusJanela(iso){
  const j=janelaMapa();
  if(iso>=j.vazioIni && iso<=j.vazioFim) return {id:"vazio", label:"Vazio sanitário", cls:"warn"};
  if(iso>=j.semeaduraIni && iso<=j.semeaduraFim) return {id:"ok", label:"Pode semear (janela MAPA)", cls:"ok"};
  if(iso>j.semeaduraFim) return {id:"fim", label:"Janela encerrada", cls:"danger"};
  return {id:"antes", label:"Antes do vazio / janela", cls:"muted"};
}
function diasAtras(iso, hoje){
  if(!iso) return null;
  const a=new Date(iso+"T12:00:00");
  const b=new Date((hoje||hojeISO())+"T12:00:00");
  return Math.round((b-a)/86400000);
}
function nomeTalhao(t){ return (t && (t.nome||t.codigo)) || ""; }
const VERSETOS=[
["O Senhor é o meu pastor; nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.","Salmo 23:1–2"],
["Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.","Provérbios 3:5–6"],
["Tudo posso naquele que me fortalece.","Filipenses 4:13"],
["Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento.","Isaías 41:10"],
["Lança o teu cuidado sobre o Senhor, e ele te susterá; nunca permitirá que o justo seja abalado.","Salmo 55:22"],
["Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.","Salmo 91:1"],
["Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.","Jeremias 29:11"],
["O Senhor te abençoe e te guarde; o Senhor faça resplandecer o rosto sobre ti e tenha misericórdia de ti.","Números 6:24–25"],
["Buscai primeiro o Reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.","Mateus 6:33"],
["Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.","Mateus 11:28"],
["Sede fortes e corajosos. Não temais, nem vos atemorizeis, porque o Senhor vosso Deus é quem vai convosco.","Deuteronômio 31:6"],
["Entrega o teu caminho ao Senhor; confia nele, e ele o fará.","Salmo 37:5"],
["A semeadura e a colheita, o frio e o calor, o verão e o inverno, o dia e a noite nunca cessarão.","Gênesis 8:22"],
["Os que semeiam em lágrimas segarão com alegria.","Salmo 126:5"],
["Tudo tem o seu tempo determinado, e há tempo para todo propósito debaixo do céu.","Eclesiastes 3:1"],
["O homem de bem deixa herança aos filhos de seus filhos.","Provérbios 13:22"],
["Melhor é o pouco com o temor do Senhor do que um grande tesouro onde há inquietação.","Provérbios 15:16"],
["O preguiçoso não lavra por causa do inverno, pelo que mendigará na sega e nada receberá.","Provérbios 20:4"],
["Quem observa o vento nunca semeará, e o que olha para as nuvens nunca segará.","Eclesiastes 11:4"],
["Não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.","Gálatas 6:9"],
["Aquele que suprirá a semente ao que semeia também vos suprirá e aumentará a sementeira.","2 Coríntios 9:10"],
["Honra ao Senhor com os teus bens e com as primícias de toda a tua renda.","Provérbios 3:9"],
["O justo conhece a causa dos pobres.","Provérbios 29:7"],
["Aquele que é fiel no mínimo também é fiel no muito.","Lucas 16:10"],
["Tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor.","Colossenses 3:23"],
["A vossa palavra seja sempre agradável, temperada com sal.","Colossenses 4:6"],
["Aquele que guarda a sua boca e a sua língua guarda das angústias a sua alma.","Provérbios 21:23"],
["Melhor é o longânimo do que o valente.","Provérbios 16:32"],
["O Senhor dará força ao seu povo; o Senhor abençoará o seu povo com paz.","Salmo 29:11"],
["Em paz também me deitarei e dormirei, porque só tu, Senhor, me fazes habitar em segurança.","Salmo 4:8"],
["Este é o dia que fez o Senhor; alegremo-nos e exultemos nele.","Salmo 118:24"],
["A tua palavra é lâmpada para os meus pés e luz para o meu caminho.","Salmo 119:105"],
["Aquietai-vos e sabei que eu sou Deus.","Salmo 46:10"],
["O Senhor está perto dos que têm o coração quebrantado.","Salmo 34:18"],
["Lâmpada do Senhor é o espírito do homem, a qual esquadrinha o mais íntimo do coração.","Provérbios 20:27"],
["O temor do Senhor é o princípio da sabedoria.","Provérbios 9:10"],
["Ainda que a figueira não floresça, eu me alegrarei no Senhor.","Habacuque 3:17–18"],
["Bem-aventurado o homem que põe no Senhor a sua confiança.","Salmo 40:4"],
["O Senhor é a minha luz e a minha salvação; a quem temerei?","Salmo 27:1"],
["Ensina-nos a contar os nossos dias, de tal maneira que alcancemos coração sábio.","Salmo 90:12"]
];
function versiculoDoDia(iso){
  const [y,m,d]=(iso||hojeISO()).split("-").map(Number);
  const idx=(y*367+m*31+d)%VERSETOS.length;
  return VERSETOS[idx];
}
function isoDow(iso){ return new Date(iso+"T12:00:00").getDay(); } // 0=dom
function daysInMonth(ym){
  const [y,m]=ym.split("-").map(Number);
  const last=new Date(y,m,0).getDate();
  const arr=[];
  for(let d=1;d<=last;d++) arr.push(ym+"-"+String(d).padStart(2,"0"));
  return arr;
}
function weekSlices(ym){
  const dias=daysInMonth(ym);
  const weeks=[];
  for(let i=0;i<dias.length;i+=7) weeks.push(dias.slice(i,i+7));
  return weeks;
}
function letraDow(iso){ return ["D","S","T","Q","Q","S","S"][isoDow(iso)]; }
function folgaTipoNoDia(nome, iso){
  const f=(state.folgas||[]).find(x=>x.pessoaNome===nome && x.data===iso);
  return f? f.tipo : "";
}
function setFolgaDia(nome, iso, tipo){
  if(!state.folgas) state.folgas=[];
  const i=state.folgas.findIndex(x=>x.pessoaNome===nome && x.data===iso);
  if(!tipo){
    if(i>=0) state.folgas.splice(i,1);
  } else if(i>=0){
    state.folgas[i].tipo=tipo;
  } else {
    const p=state.pessoas.find(x=>x.nome===nome);
    state.folgas.push({id:uid(), pessoaId:p?p.id:"", pessoaNome:nome, data:iso, tipo, obs:""});
  }
  save();
}
function pessoaNoMes(p, ym){
  const ini=ym+"-01";
  const fim=daysInMonth(ym).slice(-1)[0];
  if(p.admissao && p.admissao>fim) return false;
  if(p.contratoFim && p.contratoFim<ini) return false;
  return true;
}
function nomesDoMes(ym){
  const set=new Set();
  const ativos=new Set((state.pessoas||[]).filter(p=>p.tipo!=="encerrado" && pessoaNoMes(p,ym)).map(p=>p.nome));
  ativos.forEach(n=>set.add(n));
  (state.folgas||[]).forEach(f=>{
    if(!(f.data||"").startsWith(ym+"-") || !f.pessoaNome) return;
    const p=(state.pessoas||[]).find(x=>x.nome===f.pessoaNome);
    if(p && p.tipo==="encerrado") return;
    if(!p || ativos.has(f.pessoaNome) || pessoaNoMes(p,ym)) set.add(f.pessoaNome);
  });
  return [...set].filter(n=>{
    const p=(state.pessoas||[]).find(x=>x.nome===n);
    return !p || p.tipo!=="encerrado";
  }).sort((a,b)=>a.localeCompare(b,"pt-BR"));
}
function saldoFolgas(nome){
  // casa acumulada até o fim de folgaMes; ainda = direito do mês atual
  const diasMes=daysInMonth(folgaMes);
  let casa=0;
  const porMes={};
  (state.folgas||[]).filter(f=>f.pessoaNome===nome).forEach(f=>{
    const ym=(f.data||"").slice(0,7);
    if(!porMes[ym]) porMes[ym]={xUtil:0, regs:{}};
    porMes[ym].regs[f.data]=f.tipo;
    const dow=isoDow(f.data);
    if(f.tipo==="X" && dow>=1 && dow<=5) porMes[ym].xUtil++;
  });
  // percorrer meses de 2026-03 até folgaMes
  const months=[];
  let [y,m]=[2026,7];
  const [y2,m2]=folgaMes.split("-").map(Number);
  while(y<y2 || (y===y2 && m<=m2)){
    months.push(y+"-"+String(m).padStart(2,"0"));
    m++; if(m>12){m=1;y++;}
  }
  const pes=(state.pessoas||[]).find(x=>x.nome===nome);
  months.forEach(ym=>{
    if(pes && !pessoaNoMes(pes,ym)) return;
    const info=porMes[ym]||{xUtil:0, regs:{}};
    const dias=daysInMonth(ym);
    dias.forEach(iso=>{
      if(isoDow(iso)!==0) return;
      const t=info.regs[iso]||"";
      if(t==="X") return;
      casa++;
    });
    const extra=Math.max(0, (info.xUtil||0)-1);
    casa=Math.max(0, casa-extra);
  });
  const atual=porMes[folgaMes]||{xUtil:0};
  const ainda=Math.max(0, 1-(atual.xUtil||0));
  return {ainda, casa, xUtil: atual.xUtil||0};
}
function detalheSaldo(nome){
  const mensal=[], domingoX=[], domingoTrab=[];
  const s=saldoFolgas(nome);
  const pes=(state.pessoas||[]).find(x=>x.nome===nome);
  const start="2026-07";
  let [y,m]=[2026,7];
  const [y2,m2]=folgaMes.split("-").map(Number);
  while(y<y2 || (y===y2 && m<=m2)){
    const ym=y+"-"+String(m).padStart(2,"0");
    if(!pes || pessoaNoMes(pes,ym)){
      daysInMonth(ym).forEach(iso=>{
        const t=folgaTipoNoDia(nome,iso);
        const dow=isoDow(iso);
        if(dow>=1 && dow<=5 && t==="X") mensal.push(iso);
        if(dow===0 && t==="X") domingoX.push(iso);
        if(dow===0 && t!=="X") domingoTrab.push(iso);
      });
    }
    m++; if(m>12){m=1;y++;}
  }
  return {s, mensal, domingoX, domingoTrab};
}

function esc(s){ return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }
function exportCSV(filename, rows){
  const csv = rows.map(r=>r.map(c=>{
    const s=String(c??"");
    return /[",\n;]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(";")).join("\n");
  const blob = new Blob(["\ufeff"+csv], {type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  toast("Arquivo gerado: "+filename);
}
function toast(msg){ let el=document.getElementById("toast"); if(!el){ el=document.createElement("div"); el.id="toast"; el.className="toast"; document.body.appendChild(el);} el.textContent=msg; el.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.add("hidden"),2000); }

function notifyRotina(){
  if(!("Notification" in window) || Notification.permission!=="granted") return;
  const hoje=hojeISO();
  const key="cg-rotina-"+hoje;
  if(sessionStorage.getItem(key)) return;
  const msgs=[];
  if(isSexta(hoje)) msgs.push("Hoje é sexta: controle de diaristas antes das 8:30 e avise o gerente.");
  if(isSegunda(hoje)) msgs.push("Segunda: contagem de insumos e solicitação de EPIs.");
  if(isDia30(hoje)) msgs.push("Dia 30: solicitar compras de cantina, alojamento e escritório.");
  if(isFolgas(hoje) && diaDoMes(hoje)>=23) msgs.push("Fechar controle de folgas até o dia 25.");
  if(isFimMes(hoje)) msgs.push("Final do mês: relatório de abastecimento e controle de refeições.");
  if(isInicioMes(hoje) && diaDoMes(hoje)<=3) msgs.push("Início do mês: recolher assinatura dos holerites.");
  if(!msgs.length) return;
  try{
    new Notification("CampoGestor — lembrete", {body: msgs.join(" "), tag:key});
    sessionStorage.setItem(key,"1");
  }catch(e){}
}

function notifyBirthdays(){
  const hoje=hojeISO();
  const list=(state.pessoas||[]).filter(p=>aniversarioHoje(p.nascimento,hoje));
  if(!list.length||!("Notification" in window)) return;
  const key="cg-niver-"+hoje; if(sessionStorage.getItem(key)) return;
  const body="Hoje: "+list.map(p=>p.nome).join("; ")+". Lembre o gerente "+state.farm.gerente+".";
  const show=()=>{ try{ new Notification("Aniversário na fazenda",{body,tag:key}); sessionStorage.setItem(key,"1"); }catch(e){} };
  if(Notification.permission==="granted") show();
  else if(Notification.permission!=="denied") Notification.requestPermission().then(p=>{ if(p==="granted") show(); });
}


function exportExtExcel(){
  const stOf=e=>{
    if((e.obs||"").toLowerCase().includes("vazio")) return "Vazio";
    const v=e.validade||"";
    const hoje=hojeISO();
    if(!v) return "Sem data";
    if(v<hoje) return "Venceu";
    const rest=Math.round((new Date(v+"T12:00:00")-new Date(hoje+"T12:00:00"))/86400000);
    if(rest<=30) return "Vence em "+rest+"d";
    return "Em dia";
  };
  const cell=v=>`<Cell><Data ss:Type="String">${String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;")}</Data></Cell>`;
  const sheet=(name,headers,rows)=>{
    let t=`<Worksheet ss:Name="${name}"><Table>`;
    t+=`<Row>${headers.map(cell).join("")}</Row>`;
    rows.forEach(r=>{ t+=`<Row>${r.map(cell).join("")}</Row>`; });
    t+=`</Table></Worksheet>`;
    return t;
  };
  const sr=(state.extintores||[]).filter(e=>e.grupo!=="maquinario");
  const mq=(state.extintores||[]).filter(e=>e.grupo==="maquinario");
  const s1=sheet("SANTA RITA",["FAZENDA","EXTINTOR","LT/KG","NR CILINDRO","LOCALIZAÇÃO","DATA ULTIMA RECARGA","VENCIMENTO","STATUS"],
    sr.map(e=>[e.fazenda,e.tipo,e.carga,e.codigo,e.local,e.recarga,e.validade,stOf(e)]));
  const s2=sheet("MAQUINARIO",["EXTINTOR","LT/KG","NR CILINDRO","NOME DO EQUIPAMENTO","NR INTERNO","DATA ULTIMA RECARGA","VENCIMENTO","FAZENDA","STATUS"],
    mq.map(e=>[e.tipo,e.carga,e.codigo,e.maquina||e.local,e.nrInterno,e.recarga,e.validade,e.fazenda,stOf(e)]));
  const xml=`<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${s1}${s2}</Workbook>`;
  const blob=new Blob([xml],{type:"application/vnd.ms-excel"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="RECARGA-EXTINTORES-SANTA-RITA.xls";
  a.click();
}

function openEdit(kind, id){ if(isVisitante()){ toast("O perfil Visitante é somente para consulta"); return; } edit={kind,id}; render(); }
function closeEdit(){ edit=null; render(); }

function renderDrawer(){
  if(!edit) return "";
  let body="";
  if(edit.kind==="insumo" || edit.kind==="novo-insumo"){
    const i = edit.kind==="insumo" ? state.insumos.find(x=>x.id===edit.id) : {nome:"",categoria:"defensivo",unidade:"L",quantidade:0,minimo:0};
    body=`<h2>${edit.kind==="insumo"?"Editar insumo":"Novo insumo"}</h2>
      <div class="field"><label>Nome</label><input id="e-nome" value="${esc(i.nome||"")}"/></div>
      <div class="field"><label>Categoria</label><select id="e-cat">${CATS.map(c=>`<option value="${c}" ${i.categoria===c?"selected":""}>${CAT[c]}</option>`).join("")}</select></div>
      <div class="field"><label>Nome técnico / princípio ativo</label><input id="e-tec" value="${esc(i.tecnico||"")}"/></div>
      <div class="field"><label>Tipo (herbicida, inseticida…)</label><input id="e-tipodef" value="${esc(i.tipoDef||"")}"/></div>
      <div class="field"><label>Unidade</label><input id="e-un" value="${esc(i.unidade||"L")}"/></div>
      <div class="field"><label>Quantidade</label><input id="e-qtd" inputmode="decimal" value="${i.quantidade??0}"/></div>
      <button class="btn primary block" id="e-save">Salvar</button>
      ${edit.kind==="insumo"?`<button class="btn block" id="e-del" style="margin-top:.5rem;color:var(--danger)">Excluir</button>`:""}`;
  }
  if(edit.kind==="maquina" || edit.kind==="novo-maquina"){
    const m = edit.kind==="maquina" ? state.maquinas.find(x=>x.id===edit.id) : {nome:"",tipo:"trator",modelo:"",status:"operando",placa:""};
    body=`<h2>${edit.kind==="maquina"?"Editar máquina":"Nova máquina"}</h2>
      <div class="field"><label>Nome</label><input id="e-nome" value="${esc(m.nome||"")}"/></div>
      <div class="field"><label>Tipo</label><select id="e-tipo">${TIPOS_M.map(t=>`<option value="${t}" ${m.tipo===t?"selected":""}>${TIPO_MAQ[t]}</option>`).join("")}</select></div>
      <div class="field"><label>Modelo</label><input id="e-mod" value="${esc(m.modelo||"")}"/></div>
      <div class="field"><label>Placa / nº</label><input id="e-placa" value="${esc(m.placa||"")}"/></div>
      <div class="field"><label>Status</label><select id="e-st">
        <option value="operando" ${m.status==="operando"?"selected":""}>Operando</option>
        <option value="parada" ${m.status==="parada"?"selected":""}>Parada</option>
        <option value="manutencao" ${m.status==="manutencao"?"selected":""}>Manutenção</option>
      </select></div>
      <button class="btn primary block" id="e-save">Salvar</button>
      ${edit.kind==="maquina"?`<button class="btn block" id="e-del" style="margin-top:.5rem;color:var(--danger)">Excluir</button>`:""}`;
  }
  if(edit.kind==="pessoa" || edit.kind==="novo-pessoa"){
    const p = edit.kind==="pessoa" ? state.pessoas.find(x=>x.id===edit.id) : {nome:"",tipo:"efetivo",funcao:"",nascimento:"",admissao:""};
    body=`<h2>${edit.kind==="pessoa"?"Editar pessoa":"Nova pessoa"}</h2>
      <div class="field"><label>Nome</label><input id="e-nome" value="${esc(p.nome||"")}"/></div>
      <div class="field"><label>Função</label><input id="e-fun" value="${esc(p.funcao||"")}"/></div>
      <div class="field"><label>Tipo</label><select id="e-tipo">
        <option value="efetivo" ${p.tipo==="efetivo"?"selected":""}>Efetivo</option>
        <option value="diarista" ${p.tipo==="diarista"?"selected":""}>Diarista</option>
        <option value="candidato" ${p.tipo==="candidato"?"selected":""}>Candidato</option>
        <option value="encerrado" ${p.tipo==="encerrado"?"selected":""}>Encerrado (some das telas)</option>
      </select></div>
      <div class="field"><label>Nascimento</label><input id="e-nasc" type="date" value="${esc(p.nascimento||"")}"/></div>
      <div class="field"><label>Admissão / início</label><input id="e-adm" type="date" value="${esc(p.admissao||"")}"/></div>
      <div class="field"><label>Encerrou contrato</label><input id="e-fim" type="date" value="${esc(p.contratoFim||"")}"/></div>
      <p class="muted">Encerrado some das telas (Pessoas e Folgas). Continua no CSV da planilha.</p>
      <button class="btn primary block" id="e-save">Salvar</button>
      ${edit.kind==="pessoa"?`<button class="btn block" id="e-del" style="margin-top:.5rem;color:var(--danger)">Excluir</button>`:""}`;
  }
  if(edit.kind==="semente" || edit.kind==="novo-semente"){
    const cults=["76KA72 CE","RAPTOR I2X","NEO761 I2X","NEO700 I2X","DM 72IX74 I2X","ST 752 I2X"];
    const s = edit.kind==="semente" ? (state.sementes||[]).find(x=>x.id===edit.id) : {cultivar:"76KA72 CE",lote:"",validade:"",peso:"",fornecedor:"",numero:"",pureza:"",germinacao:"",obs:""};
    body=`<h2>${edit.kind==="semente"?"Editar big bag":"Registrar big bag"}</h2>
      <p class="muted" style="margin-bottom:.6rem">Use a câmera do celular para ler a etiqueta e digite os dados. Depois confirme.</p>
      <div class="field"><label>Cultivar</label><select id="e-cult">${cults.map(c=>`<option value="${c}" ${(s.cultivar||"")===c?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Lote</label><input id="e-lote" value="${esc(s.lote||"")}"/></div>
      <div class="field"><label>Validade</label><input id="e-val" type="date" value="${esc(s.validade||"")}"/></div>
      <div class="field"><label>Peso (kg)</label><input id="e-peso" inputmode="decimal" value="${esc(s.peso||"")}"/></div>
      <div class="field"><label>Fornecedor</label><input id="e-forn" value="${esc(s.fornecedor||"")}"/></div>
      <div class="field"><label>Nº big bag</label><input id="e-num" value="${esc(s.numero||"")}"/></div>
      <div class="field"><label>Pureza (%)</label><input id="e-pur" inputmode="decimal" value="${esc(s.pureza||"")}"/></div>
      <div class="field"><label>Germinação (%)</label><input id="e-ger" inputmode="decimal" value="${esc(s.germinacao||"")}"/></div>
      <div class="field"><label>Observação</label><input id="e-obs" value="${esc(s.obs||"")}"/></div>
      <button class="btn primary block" id="e-save">Salvar conferência</button>
      ${edit.kind==="semente"?`<button class="btn block" id="e-del" style="margin-top:.5rem;color:var(--danger)">Excluir</button>`:""}`;
  }
  if(edit.kind==="folga" || edit.kind==="novo-folga"){
    const f = edit.kind==="folga" ? (state.folgas||[]).find(x=>x.id===edit.id) : {pessoaId:"",pessoaNome:"",data:hojeISO(),tipo:"X",obs:""};
    const opts = state.pessoas.map(p=>`<option value="${p.id}" ${(f.pessoaId||"")===p.id?"selected":""}>${esc(p.nome)}</option>`).join("");
    body=`<h2>${edit.kind==="folga"?"Editar registro":"Registrar folga / falta"}</h2>
      <div class="field"><label>Pessoa</label><select id="e-pes"><option value="">—</option>${opts}</select></div>
      <div class="field"><label>Data</label><input id="e-data" type="date" value="${esc(f.data||hojeISO())}"/></div>
      <div class="field"><label>Tipo</label><select id="e-tipo">
        <option value="X" ${f.tipo==="X"?"selected":""}>X — Folga</option>
        <option value="P" ${f.tipo==="P"?"selected":""}>P — Plantão de incêndio</option>
        <option value="F" ${f.tipo==="F"?"selected":""}>F — Falta</option>
        <option value="T" ${f.tipo==="T"?"selected":""}>T — Trabalhado</option>
        <option value="V" ${f.tipo==="V"?"selected":""}>V — Férias</option>
        <option value="E" ${f.tipo==="E"?"selected":""}>E — Encerrou contrato</option>
      </select></div>
      <div class="field"><label>Observação</label><input id="e-obs" value="${esc(f.obs||"")}"/></div>
      <button class="btn primary block" id="e-save">Salvar</button>
      ${edit.kind==="folga"?`<button class="btn block" id="e-del" style="margin-top:.5rem;color:var(--danger)">Excluir</button>`:""}`;
  }
  if(edit.kind==="protocolo" || edit.kind==="novo-protocolo"){
    const eq = state.equatorial || SEED.equatorial;
    const lista=eq.protocolos||[];
    const p = edit.kind==="protocolo" ? lista.find(x=>(x.id||(x.protocolo+"-"+x.data+"-"+x.hora))===edit.id) : null;
    const ucKeep=["10026027184","980046051"];
    const ucSel=p?p.uc:"";
    const ucOpts = (eq.ucs||[]).filter(u=>ucKeep.includes(String(u.uc))).map(u=>`<option value="${esc(u.uc)}" ${String(u.uc)===String(ucSel)?"selected":""}>${esc(u.uc)} — ${esc(u.desc)}</option>`).join("");
    const agora=String(new Date().getHours()).padStart(2,"0")+":"+String(new Date().getMinutes()).padStart(2,"0");
    body=`<h2>${p?"Editar protocolo":"Novo protocolo Equatorial"}</h2>
      <div class="field"><label>Unidade (UC)</label><select id="e-uc">${ucOpts}</select></div>
      <div class="field"><label>Nº protocolo</label><input id="e-prot" placeholder="Ex: 498274640" value="${esc(p&&p.protocolo||"")}"/></div>
      <div class="field"><label>Data</label><input id="e-data" type="date" value="${esc((p&&p.data)||hojeISO())}"/></div>
      <div class="field"><label>Hora</label><input id="e-hora" type="time" value="${esc((p&&p.hora)||agora)}"/></div>
      <div class="field"><label>Ocorrência</label><input id="e-hist" value="${esc((p&&p.hist)||"Falta de energia")}"/></div>
      <div class="field"><label>Local</label><input id="e-local" value="${esc((p&&p.local)||"SANTA RITA")}"/></div>
      <button class="btn primary block" id="e-save">Salvar protocolo</button>
      ${p?`<button class="btn danger block" id="e-del" style="margin-top:.4rem">Excluir</button>`:""}`;
  }
  if(edit.kind==="chuva" || edit.kind==="novo-chuva"){
    const c = edit.kind==="chuva" ? (state.chuva||[]).find(x=>x.id===edit.id) : {data:hojeISO(), mm:"", obs:""};
    body=`<h2>${edit.kind==="chuva"?"Editar chuva":"Registrar chuva"}</h2>
      <div class="field"><label>Data</label><input id="e-data" type="date" value="${esc(c.data||hojeISO())}"/></div>
      <div class="field"><label>Milímetros (mm)</label><input id="e-mm" inputmode="decimal" value="${esc(c.mm??"")}"/></div>
      <div class="field"><label>Observação</label><input id="e-obs" value="${esc(c.obs||"")}"/></div>
      <button class="btn primary block" id="e-save">Salvar</button>
      ${edit.kind==="chuva"?`<button class="btn block" id="e-del" style="margin-top:.5rem;color:var(--danger)">Excluir</button>`:""}`;
  }
  if(edit.kind==="saida" || edit.kind==="novo-saida"){
    const prodOpts = state.insumos.map(i=>`<option value="${i.id}">${esc(i.nome)} (${n(i.quantidade,i.quantidade>=100?0:1)} ${esc(i.unidade)})</option>`).join("");
    const linha=()=>`<div class="saida-linha" style="display:grid;grid-template-columns:1fr 5.5rem;gap:.4rem;margin-bottom:.4rem">
        <select class="e-prod">${prodOpts}</select>
        <input class="e-qtd" inputmode="decimal" placeholder="Qtd"/>
      </div>`;
    body=`<h2>Lançamento de saída</h2>
      <div class="field"><label>Data</label><input id="e-data" type="date" value="${hojeISO()}"/></div>
      <div class="field"><label>Tipo de saída</label><select id="e-tipo">
        <option value="Aplicação">Aplicação</option>
        <option value="Transferência">Transferência</option>
        <option value="Empréstimo">Empréstimo</option>
        <option value="Baixa">Baixa</option>
      </select></div>
      <div class="field"><label>Produtos e quantidades</label>
        <div id="saida-itens">${linha()}</div>
        <button type="button" class="btn sm" id="add-prod-saida" style="margin-top:.25rem">+ Outro produto</button>
      </div>
      <div class="field"><label>Destino *</label><input id="e-destino" placeholder="Obrigatório"/></div>
      <div class="field"><label>Responsável *</label><input id="e-resp" placeholder="Obrigatório"/></div>
      <div class="field"><label>Observação</label><input id="e-obs" placeholder="Opcional"/></div>
      <button class="btn primary block" id="e-save">Salvar e dar baixa</button>`;
  }
  if(edit.kind==="edit-plantio"){
    const idx=Number(edit.id);
    const r=SAFRA.plantio[idx]||{};
    const ov=(state.safraPlantio||{})[idx]||{};
    const cults=["76KA72 CE","Raptor I2X","NEO761 I2X","NEO700 I2X","DM 72IX74 I2X","ST 752 I2X","RAPTOR I2X"];
    const curCult=ov.cultivar||r.cultivar||"";
    body=`<h2>Editar plantio</h2>
      <p class="muted" style="margin-bottom:.6rem">${esc(r.talhoes||"")} · ${n(r.ha||0,2)} ha</p>
      <div class="field"><label>Cultivar / semente</label><select id="e-cult">${cults.map(c=>`<option value="${c}" ${curCult===c?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Sementes por metro (sem/m)</label><input id="e-semm" value="${esc(ov.sem_m||r.sem_m||"")}"/></div>
      <div class="field"><label>Sementes por hectare (sem/ha)</label><input id="e-semha" value="${esc(ov.sem_ha||r.sem_ha||"")}"/></div>
      <button class="btn primary block" id="e-save-plantio">Salvar</button>`;
  }
  if(edit.kind==="cel-folga"){
    const nome=edit.nome, dia=edit.dia;
    const cur=folgaTipoNoDia(nome,dia)||"";
    const opts=[["","— vazio / trabalhou"],["X","X — Folga"],["P","P — Plantão de incêndio"],["F","F — Falta"],["V","V — Férias"],["E","E — Encerrou contrato"]];
    body=`<h2>${esc(nome)}</h2>
      <p class="muted" style="margin-bottom:.7rem">${(dia||"").split("-").reverse().join("/")} · ${["domingo","segunda","terça","quarta","quinta","sexta","sábado"][isoDow(dia)]}</p>
      ${opts.map(([v,l])=>`<button class="btn block" data-set-folga="${v}" style="margin-bottom:.35rem;${cur===v?"background:var(--primary);color:var(--bg)":""}">${l}</button>`).join("")}`;
  }
  if(edit.kind==="saldo-folga"){
    const nome=edit.nome;
    const d=detalheSaldo(nome);
    const fmt=iso=>(iso||"").split("-").reverse().join("/");
    const lis=(arr,vazio)=>arr.length?arr.map(x=>`<li>${fmt(x)}</li>`).join(""):`<li class="muted">${vazio}</li>`;
    body=`<h2>${esc(nome)}</h2>
      <p class="muted">A tirar agora: <b>${d.s.ainda + d.s.casa}</b> (${d.s.ainda} do mês + ${d.s.casa} na casa)</p>
      <p class="card-title" style="margin-top:.8rem">Folga mensal (seg–sex)</p>
      <ul style="padding-left:1.1rem">${lis(d.mensal,"Nenhuma marcada ainda")}</ul>
      <p class="muted">Direito do mês: 1 · já usadas: ${d.s.xUtil} · ainda neste mês: ${d.s.ainda}</p>
      <p class="card-title" style="margin-top:.8rem">Domingo — folga obrigatória (X)</p>
      <ul style="padding-left:1.1rem">${lis(d.domingoX,"Nenhum domingo com X")}</ul>
      <p class="card-title" style="margin-top:.8rem">Domingo trabalhado / plantão (gera folga na casa)</p>
      <ul style="padding-left:1.1rem">${lis(d.domingoTrab,"Nenhum")}</ul>
      <p class="muted" style="margin-top:.6rem">Folga na casa acumula mês a mês. Extra de seg–sex além da 1 do mês abate da casa.</p>`;
  }
  if(edit.kind==="hoje-tarefas"){
    const hoje=hojeISO();
    const listaRotina=rotinaHoje(hoje);
    const feitas=listaRotina.filter(r=>state.rotinaFeita[r.id]===hoje).length;
    body=`<h2>Tarefas de hoje</h2><p class="muted">${rotinaLegenda(hoje)} · ${feitas}/${listaRotina.length}</p>`;
    if(!listaRotina.length){
      body+=`<p class="muted" style="margin-top:.5rem">Nada obrigatório hoje. Segunda: frota, estoque e aniversariantes. Sexta antes das 8:30: diaristas. Fim do mês: inventário.</p>`;
    } else {
      const pendentes=listaRotina.filter(r=>state.rotinaFeita[r.id]!==hoje);
      if(!pendentes.length) body+=`<p style="color:var(--ok);margin-top:.5rem">Tudo concluído por hoje. Voltam amanhã.</p>`;
      else pendentes.forEach(r=>{
        body+=`<label class="check"><input type="checkbox" data-rotina="${r.id}"/><span><span class="titulo" style="display:block">${esc(r.titulo)}</span><span class="muted">${esc(r.grupo)}</span></span></label>`;
      });
    }
    const prox=proximosLembretes(hoje);
    if(prox.length){
      body+=`<p class="card-title" style="margin-top:.8rem">Próximos dias</p>`;
      prox.forEach(p=>{ body+=`<p class="muted">${esc(p.iso.split("-").reverse().join("/"))} · ${esc(p.labels)}</p>`; });
    }
    body+=`<p class="card-title" style="margin-top:.8rem">Quando ocorrer</p>`;
    ROTINA.filter(r=>r.freq==="evento").forEach(r=>{
      const done=state.rotinaFeita[r.id]===hoje;
      body+=`<label class="check ${done?"done":""}"><input type="checkbox" ${done?"checked":""} data-rotina="${r.id}"/><span><span class="titulo" style="display:block">${esc(r.titulo)}</span><span class="muted">${esc(r.grupo)}</span></span></label>`;
    });
  }
  if(edit.kind==="hoje-diesel"){
    const dinv=dieselInventario();
    const litros=dinv ? dinv.total : Number(state.diesel.litros)||0;
    const p=Math.round((litros/state.diesel.capacidade)*100);
    const col=p>=50?"var(--ok)":p>=25?"var(--warn)":"var(--danger)";
    body=`<h2>Diesel</h2>
      <div class="ring-wrap" style="justify-content:center">
        <div class="ring" style="--p:${p};width:110px;height:110px;background:conic-gradient(${col} calc(${p}*1%), var(--elevated) 0)">
          <span class="pct">${p}%</span>
        </div>
      </div>
      <p style="text-align:center">${n(litros,0)} L de ${n(state.diesel.capacidade,0)} L</p>
      <p class="muted" style="text-align:center">Saldo puxado automaticamente do inventário.</p>`;
  }
  if(edit.kind==="hoje-chuva"){
    const lista=(state.chuva||[]).slice().sort((a,b)=>(b.data||"").localeCompare(a.data||""));
    const u=lista[0];
    body=`<h2>Última chuva</h2>
      ${u?`<p style="font-size:1.4rem;font-weight:500">${n(u.mm,1)} mm</p><p class="muted">${(u.data||"").split("-").reverse().join("/")}${u.obs?" · "+esc(u.obs):""}</p>`:`<p class="muted">Sem registro ainda.</p>`}`;
  }
  if(edit.kind==="hoje-area"){
    const ts=(state.talhoes||[]).slice().sort((a,b)=>String(a.codigo||a.nome).localeCompare(String(b.codigo||b.nome),"pt-BR"));
    body=`<h2>Área</h2><p>${n(state.farm.areaTotal,0)} ha · ${ts.length} talhões</p>
      <ul class="list" style="margin-top:.6rem">${ts.map(t=>`<li><div style="flex:1">${esc(nomeTalhao(t))}</div><div>${n(t.area,2)} ha</div></li>`).join("")||'<li class="muted">Sem talhões</li>'}</ul>`;
  }
  if(edit.kind==="janela"){
    const j=janelaMapa();
    body=`<h2>Janela MAPA · Soja GO</h2>
      <p class="muted">Calendário oficial da safra. Altere só se sair retificação.</p>
      <div class="field"><label>Início do vazio sanitário</label><input id="j-vi" type="date" value="${esc(j.vazioIni)}"/></div>
      <div class="field"><label>Fim do vazio sanitário</label><input id="j-vf" type="date" value="${esc(j.vazioFim)}"/></div>
      <div class="field"><label>Início da semeadura</label><input id="j-si" type="date" value="${esc(j.semeaduraIni)}"/></div>
      <div class="field"><label>Fim da semeadura</label><input id="j-sf" type="date" value="${esc(j.semeaduraFim)}"/></div>
      <div class="field"><label>Portaria / referência</label><input id="j-po" value="${esc(j.portaria)}"/></div>
      <div class="field"><label>Link de consulta</label><input id="j-fo" value="${esc(j.fonte)}"/></div>
      <button class="btn primary block" id="e-save-janela">Salvar janela</button>`;
  }
  if(edit.kind==="extintor" || edit.kind==="novo-extintor"){
    const e = edit.kind==="extintor" ? (state.extintores||[]).find(x=>x.id===edit.id)||{} : {fazenda:"Santa Rita",grupo:"santa-rita",local:"",maquina:"",tipo:"Pó ABC",carga:"6 kg",codigo:"",recarga:"",validade:"",obs:"",nrInterno:""};
    const locais=["Balança","Oficina","Moega","Cantina interno","Cantina externo","Alojamento interno","Alojamento externo","Tanque de combustível","Gerador","Depósito de embalagens vazias","Casinha do gás","Almoxarifado","Classificação","Outro"];
    const maqs=(state.maquinas||[]).slice().sort((a,b)=>String(a.nome).localeCompare(b.nome,"pt-BR"));
    const tipos=["Pó ABC","CO2 BC","Pó BC","Água","Água ABC","Espuma AB"];
    const cargas=["4 kg","4,5 kg","6 kg","10 L","50 kg"];
    const locVal=e.local||"";
    const isMaq=e.grupo==="maquinario";
    const maqVal=e.maquina||e.codigoMaq||"";
    body=`<h2>${edit.kind==="extintor"?"Editar extintor":"Novo extintor"}</h2>
      <div class="field"><label>Fazenda</label><select id="x-faz"><option>Santa Rita</option></select></div>
      <div class="field"><label>Grupo</label><select id="x-grupo">
        <option value="santa-rita" ${!isMaq?"selected":""}>Santa Rita (local)</option>
        <option value="maquinario" ${isMaq?"selected":""}>Maquinário</option>
      </select></div>
      <div class="field"><label>Local</label><select id="x-local" ${isMaq?"disabled":""}>${locais.map(t=>`<option ${locVal===t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label>Máquina (frota)</label><select id="x-maq" ${isMaq?"":"disabled"}><option value="">—</option>${maqs.map(t=>{
        const val=t.id;
        const lab=`${t.codigo?t.codigo+" · ":""}${t.nome}`;
        const sel=(e.maqId===t.id || e.maquina===t.nome || e.nrInterno===t.codigo)?"selected":"";
        return `<option value="${val}" ${sel}>${esc(lab)}</option>`;
      }).join("")}</select></div>
      <div class="field"><label>Nr. interno da máquina</label><input id="x-nr" value="${esc(e.nrInterno||"")}" placeholder="2403" ${isMaq?"":"disabled"}/></div>
      <div class="field"><label>Tipo</label><select id="x-tipo">${tipos.map(t=>`<option ${e.tipo===t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label>Carga</label><select id="x-carga">${cargas.map(t=>`<option ${e.carga===t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label>Nº cilindro</label><input id="x-cod" value="${esc(e.codigo||"")}"/></div>
      <div class="field"><label>Última recarga</label><input id="x-rec" type="date" value="${esc(e.recarga||"")}"/></div>
      <div class="field"><label>Vencimento</label><input id="x-val" type="date" value="${esc(e.validade||"")}"/></div>
      <div class="field"><label>Observação</label><input id="x-obs" value="${esc(e.obs||"")}" placeholder="vazio, etc."/></div>
      <button class="btn primary block" id="e-save-ext">Salvar</button>
      ${edit.kind==="extintor"?`<button class="btn danger block" id="e-del-ext" style="margin-top:.4rem">Excluir</button>`:""}`;
  }
  if(edit.kind==="farm"){
    body=`<h2>Editar fazenda</h2>
      <div class="field"><label>Nome</label><input id="f-nome" value="${esc(state.farm.nome)}"/></div>
      <div class="field"><label>Local</label><input id="f-mun" value="${esc(state.farm.municipio)}"/></div>
      <div class="field"><label>Cargo</label><input id="f-cargo" value="${esc(state.farm.cargo)}"/></div>
      <div class="field"><label>Gerente</label><input id="f-ger" value="${esc(state.farm.gerente)}"/></div>
      <div class="field"><label>Safra</label><input id="f-safra" value="${esc(state.farm.safra)}"/></div>
      <div class="field"><label>WhatsApp Clara (DDD + número)</label><input id="f-wa" placeholder="62999999999" value="${esc(state.farm.whatsappClara||"6232432020")}"/></div>
      <button class="btn primary block" id="e-save-farm">Salvar</button>`;
  }
  const mid = edit && String(edit.kind||"").startsWith("hoje-");
  return `<div class="drawer-bg${mid?" center":""}" id="drawer"><div class="drawer">${body}</div></div>`;
}

function renderProfileModal(){
  const p=perfilAtual();
  return `<div class="profile-overlay" id="profile-overlay" role="dialog" aria-modal="true" aria-label="Perfil do usuário">
    <section class="profile-modal">
      <div class="profile-modal-head">
        <div>
          <div class="profile-modal-kicker">CAMPOGESTOR</div>
          <h2>Seu perfil</h2>
          <p class="muted">Escolha quem está usando o aplicativo.</p>
        </div>
        <button type="button" class="profile-close" id="profile-close" aria-label="Fechar">×</button>
      </div>
      <div class="profile-current">
        <span class="profile-avatar large">${esc(p.inicial)}</span>
        <div><strong>${esc(p.nome)}</strong><span>${esc(p.role)}</span></div>
      </div>
      <div class="profile-options">
        ${PERFIS.map(x=>`<button type="button" class="profile-option ${x.id===p.id?"active":""}" data-profile-id="${x.id}">
          <span class="profile-avatar">${esc(x.inicial)}</span>
          <span class="profile-option-text"><strong>${esc(x.nome)}</strong><small>${esc(x.role)}</small></span>
          ${x.id===p.id?`<span class="profile-check">✓</span>`:""}
        </button>`).join("")}
      </div>
      <div class="profile-cloud">
        <span class="cloud-dot ${cloudStatus}"></span>
        <div><strong>Sincronização</strong><span>${esc(perfilCloudResumo())}</span></div>
      </div>
      ${sbUser?`<div class="profile-email">${esc(sbUser.email||"")}</div>`:""}
    </section>
  </div>`;
}

function render(){
  const root=document.getElementById("app");
  const hoje=hojeISO();
  let html="";

  const renderers = window.CampoGestorTelas || {};
  const renderPage = renderers[page];
  if(renderPage) html += renderPage();

  const navItems=[
    {id:"hoje",ic:"🏠",label:"Hoje"},
    {id:"frota",ic:"🚜",label:"Frota"},
    {id:"estoque",ic:"📦",label:"Estoque"},
    {id:"pessoas",ic:"👥",label:"Pessoas"},
    {id:"safra",ic:"🌾",label:"Safra"},
    {id:"chuva",ic:"🌧️",label:"Chuva"},

    {id:"folgas",ic:"📅",label:"Folgas"},
    {id:"equatorial",ic:"⚡",label:"Energia"},
    {id:"extintores",ic:"🧯",label:"Extintores"},
    {id:"mais",ic:"⋯",label:"Mais"},
  ];
  html+=`<div class="menu-overlay ${menuOpen?"open":""}" id="side-bg" aria-hidden="${menuOpen?"false":"true"}"></div>`;
  if(menuOpen){
    html+=`<section class="floating-menu" id="floating-menu" aria-label="Menu CampoGestor">
      <div class="floating-menu-head">
        <div>
          <div class="floating-brand">CAMPO<span>GESTOR</span></div>
          <div class="floating-sub">${esc(state.farm.nome)} · Navegação</div>
        </div>
        <button type="button" class="floating-close" id="floating-close" aria-label="Fechar menu">×</button>
      </div>
      <div class="menu-bubbles">
        ${navItems.map((it,i)=>`<button class="menu-bubble ${page===it.id?"active":""}" data-go="${it.id}" style="--bubble-delay:${i*35}ms">
          <span class="bubble-icon">${it.ic}</span><span class="bubble-label">${it.label}</span>
        </button>`).join("")}
      </div>
      <div class="floating-menu-foot">Toque fora para fechar</div>
    </section>`;
  }
  html+=renderProfileModal();
  html+=renderDrawer();
  root.innerHTML=html;
  bind();
  if(page==="hoje"){ notifyBirthdays(); notifyRotina(); }
}

function bind(){
  const bpfl=document.getElementById("btn-profile");
  if(bpfl) bpfl.onclick=()=>{ const ov=document.getElementById("profile-overlay"); if(ov) ov.classList.add("open"); };
  const pclose=document.getElementById("profile-close");
  if(pclose) pclose.onclick=()=>{ const ov=document.getElementById("profile-overlay"); if(ov) ov.classList.remove("open"); };
  const pov=document.getElementById("profile-overlay");
  if(pov) pov.onclick=(e)=>{ if(e.target===pov) pov.classList.remove("open"); };
  document.querySelectorAll("[data-profile-id]").forEach(b=>{ b.onclick=()=>{ const id=b.getAttribute("data-profile-id"); setPerfil(id); render(); }; });

  document.querySelectorAll("[data-go]").forEach(btn=>{ btn.onclick=()=>{ page=btn.getAttribute("data-go"); edit=null; menuOpen=false; render(); }; });
  document.querySelectorAll("[data-hoje]").forEach(b=>{
    b.onclick=()=>{
      const k=b.getAttribute("data-hoje");
      if(k==="equipe"){ page="pessoas"; edit=null; menuOpen=false; render(); return; }
      if(k==="diesel") edit={kind:"hoje-diesel"};
      if(k==="chuva") edit={kind:"hoje-chuva"};
      if(k==="area") edit={kind:"hoje-area"};
      if(k==="tarefas") edit={kind:"hoje-tarefas"};
      render();
    };
  });
  document.querySelectorAll("[data-ver-pessoa]").forEach(el=>{
    el.onclick=()=>{ edit={kind:"ver-pessoa", id:el.getAttribute("data-ver-pessoa")}; render(); };
  });
  document.querySelectorAll("[data-sort-pes]").forEach(b=>{
    b.onclick=()=>{ sortPessoas=b.getAttribute("data-sort-pes"); render(); };
  });
  const ssm=document.getElementById("sel-saida-mes");
  if(ssm) ssm.onchange=()=>{ qSaidaMes=ssm.value; render(); };
  const sfm=document.getElementById("sel-folga-mes");
  if(sfm) sfm.onchange=()=>{ folgaMes=sfm.value; folgaPessoa=null; folgaSemana=1; folgaMesTodo=false; render(); };
  document.querySelectorAll("[data-semana]").forEach(b=>{
    b.onclick=()=>{ folgaSemana=Number(b.getAttribute("data-semana")); folgaMesTodo=false; render(); };
  });
  const bmt=document.getElementById("btn-mes-todo");
  if(bmt) bmt.onclick=()=>{ folgaMesTodo=!folgaMesTodo; render(); };
  document.querySelectorAll("[data-cel-nome]").forEach(b=>{
    b.onclick=()=>{
      edit={kind:"cel-folga", nome:b.getAttribute("data-cel-nome"), dia:b.getAttribute("data-cel-dia")};
      render();
    };
  });
  document.querySelectorAll("[data-saldo-nome]").forEach(b=>{
    b.onclick=()=>{ edit={kind:"saldo-folga", nome:b.getAttribute("data-saldo-nome")}; render(); };
  });
  document.querySelectorAll("[data-folga-pes]").forEach(el=>{
    el.onclick=()=>{ folgaPessoa=el.getAttribute("data-folga-pes"); render(); };
  });
  const bfv=document.getElementById("btn-folga-voltar");
  if(bfv) bfv.onclick=()=>{ folgaPessoa=null; render(); };
  const bwa=document.getElementById("btn-wa-clara");
  if(bwa) bwa.onclick=(ev)=>{
    ev.preventDefault();
    let num=(state.farm.whatsappClara||"6232432020").replace(/\D/g,"");
    if(num==="6232433020"||num==="556232433020") num="6232432020";
    if(num.startsWith("55") && num.length>=12) num=num;
    else if(num.length>=10) num="55"+num;
    if(num.length>=12){
      const app="whatsapp://send?phone="+num;
      const web="https://wa.me/"+num;
      const t=Date.now();
      location.href=app;
      setTimeout(()=>{ if(Date.now()-t<1800) location.href=web; }, 600);
    } else {
      location.href="whatsapp://";
      setTimeout(()=>{ location.href="https://wa.me/"; }, 500);
      toast("Abriu o WhatsApp do telefone. Para ir direto na Clara, grave o número em Mais → Editar fazenda.");
    }
  };
  document.querySelectorAll("[data-safra-filtro]").forEach(b=>{
    b.onclick=()=>{ safraFiltro=b.getAttribute("data-safra-filtro"); render(); };
  });
  document.querySelectorAll("[data-safra-st]").forEach(b=>{
    b.onclick=()=>{
      if(!state.safraStatus) state.safraStatus={};
      const sec=b.getAttribute("data-safra-st");
      const i=b.getAttribute("data-i");
      const key=sec+"-"+i;
      const cur=(state.safraStatus[key]||{}).status||"pendente";
      const next=cur==="pendente"?"andamento":cur==="andamento"?"concluido":"pendente";
      const entry={status:next};
      if(next==="concluido") entry.data=hojeISO();
      // histórico simples
      if(!state.safraStatus[key]) state.safraStatus[key]={};
      if(!state.safraStatus[key].hist) state.safraStatus[key].hist=[];
      state.safraStatus[key].hist.push({de:cur, para:next, em:hojeISO()});
      state.safraStatus[key]={...state.safraStatus[key], ...entry};
      save(); render();
    };
  });
  document.querySelectorAll("[data-edit-plantio]").forEach(b=>{
    b.onclick=()=>{ edit={kind:"edit-plantio", id:b.getAttribute("data-edit-plantio")}; render(); };
  });

  const bm=document.getElementById("btn-menu");
  if(bm) {
    bm.setAttribute("aria-expanded", menuOpen ? "true" : "false");
    bm.onclick=()=>{ menuOpen=!menuOpen; render(); };
  }
  const sbg=document.getElementById("side-bg");
  if(sbg) sbg.onclick=()=>{ menuOpen=false; render(); };
  const fc=document.getElementById("floating-close");
  if(fc) fc.onclick=()=>{ menuOpen=false; render(); };

  document.querySelectorAll("[data-rotina]").forEach(cb=>{ cb.onchange=()=>{ const id=cb.getAttribute("data-rotina"); const hoje=hojeISO();
    if(state.rotinaFeita[id]===hoje) delete state.rotinaFeita[id]; else state.rotinaFeita[id]=hoje; save(); render(); }; });
  document.querySelectorAll("[data-cat]").forEach(b=>{ b.onclick=()=>{ catInsumo=b.getAttribute("data-cat"); render(); }; });
  document.querySelectorAll("[data-cat-maq]").forEach(b=>{
    b.onclick=()=>{
      const v=b.getAttribute("data-cat-maq")||"todos";
      if(v==="todos"){ catMaq="todos"; catFaz="todos"; }
      else { catMaq = (catMaq===v ? "todos" : v); }
      render();
    };
  });
  document.querySelectorAll("[data-cat-faz]").forEach(b=>{
    b.onclick=()=>{
      const v=b.getAttribute("data-cat-faz")||"todos";
      if(v==="todos"){ catMaq="todos"; catFaz="todos"; }
      else { catFaz = (catFaz===v ? "todos" : v); }
      render();
    };
  });
  document.querySelectorAll("[data-cat-ext]").forEach(b=>{
    b.onclick=()=>{ catExt=b.getAttribute("data-cat-ext"); render(); };
  });
  const bx=document.getElementById("btn-xls-ext");
  if(bx) bx.onclick=()=>exportExtExcel();
  const qm=document.getElementById("q-maq");
  if(qm){ qm.oninput=()=>{ qMaq=qm.value; clearTimeout(qm._t); qm._t=setTimeout(()=>render(),200); }; }
  const qi=document.getElementById("q-insumo");
  if(qi){ qi.oninput=()=>{ qInsumo=qi.value; /* live filter without full redraw of input focus - debounce simple */ clearTimeout(qi._t); qi._t=setTimeout(()=>render(),200); };
    setTimeout(()=>{ const el=document.getElementById("q-insumo"); if(el){ el.focus(); el.selectionStart=el.selectionEnd=el.value.length; } },0);
  }
  document.querySelectorAll("[data-edit]").forEach(b=>{ b.onclick=()=>{ openEdit(b.getAttribute("data-edit"), b.getAttribute("data-id")||null); }; });
  document.querySelectorAll("[data-set-folga]").forEach(b=>{
    b.onclick=()=>{
      if(!edit || edit.kind!=="cel-folga") return;
      setFolgaDia(edit.nome, edit.dia, b.getAttribute("data-set-folga")||"");
      toast("Registro atualizado");
      closeEdit();
    };
  });
  document.querySelectorAll("[data-new]").forEach(b=>{ b.onclick=()=>{ openEdit("novo-"+b.getAttribute("data-new"), null); }; });
  if(isVisitante()){
    document.querySelectorAll("[data-new],[data-edit]").forEach(b=>{ b.classList.add("visitor-disabled"); b.setAttribute("aria-disabled","true"); });
  }
  const dr=document.getElementById("drawer");
  if(dr) dr.onclick=(e)=>{ if(e.target===dr) closeEdit(); };

  const aps=document.getElementById("add-prod-saida");
  if(aps) aps.onclick=()=>{
    const box=document.getElementById("saida-itens");
    if(!box) return;
    const first=box.querySelector(".saida-linha");
    if(first) box.appendChild(first.cloneNode(true));
    const last=box.querySelector(".saida-linha:last-child .e-qtd");
    if(last) last.value="";
  };
  const es=document.getElementById("e-save");
  if(es) es.onclick=()=>{
    if(edit.kind==="insumo"||edit.kind==="novo-insumo"){
      const row={ nome:document.getElementById("e-nome").value.trim(), categoria:document.getElementById("e-cat").value,
        tecnico:(document.getElementById("e-tec")&&document.getElementById("e-tec").value.trim())||"",
        tipoDef:(document.getElementById("e-tipodef")&&document.getElementById("e-tipodef").value.trim())||"",
        unidade:document.getElementById("e-un").value.trim()||"un", quantidade:Number(String(document.getElementById("e-qtd").value).replace(",",".")||0),
        minimo:0 };
      if(!row.nome){ toast("Informe o nome"); return; }
      if(edit.kind==="insumo"){ state.insumos=state.insumos.map(x=>x.id===edit.id?{...x,...row}:x); }
      else {
        const nid=uid();
        state.insumos.push({id:nid,...row});
        if(!state.entradas) state.entradas=[];
        if(row.quantidade) state.entradas.push({id:uid(), data:hojeISO(), tipo:"Entrada", itens:[{id:nid,nome:row.nome,qtd:row.quantidade,un:row.unidade}], obs:"Cadastro"});
      }
      save(); toast("Insumo salvo"); closeEdit(); return;
    }
    if(edit.kind==="maquina"||edit.kind==="novo-maquina"){
      const row={ nome:document.getElementById("e-nome").value.trim(), tipo:document.getElementById("e-tipo").value,
        modelo:document.getElementById("e-mod").value.trim(), placa:document.getElementById("e-placa").value.trim(), status:document.getElementById("e-st").value };
      if(!row.nome){ toast("Informe o nome"); return; }
      if(edit.kind==="maquina") state.maquinas=state.maquinas.map(x=>x.id===edit.id?{...x,...row}:x);
      else state.maquinas.push({id:uid(),...row});
      save(); toast("Máquina salva"); closeEdit(); return;
    }
    if(edit.kind==="semente"||edit.kind==="novo-semente"){
      if(!state.sementes) state.sementes=[];
      const row={ cultivar:document.getElementById("e-cult").value, lote:document.getElementById("e-lote").value.trim(),
        validade:document.getElementById("e-val").value||"", peso:document.getElementById("e-peso").value.trim(),
        fornecedor:document.getElementById("e-forn").value.trim(), numero:document.getElementById("e-num").value.trim(),
        pureza:document.getElementById("e-pur").value.trim(), germinacao:document.getElementById("e-ger").value.trim(),
        obs:document.getElementById("e-obs").value.trim(), data: new Date().toLocaleString("pt-BR") };
      if(edit.kind==="semente") state.sementes=state.sementes.map(x=>x.id===edit.id?{...x,...row}:x);
      else state.sementes.push({id:uid(),...row});
      save(); toast("Big bag registrado"); closeEdit(); return;
    }
    if(edit.kind==="pessoa"||edit.kind==="novo-pessoa"){
      const row={ nome:document.getElementById("e-nome").value.trim(), funcao:document.getElementById("e-fun").value.trim(),
        tipo:document.getElementById("e-tipo").value, nascimento:document.getElementById("e-nasc").value||null, admissao:document.getElementById("e-adm").value||null,
        contratoFim:document.getElementById("e-fim")? (document.getElementById("e-fim").value||null):null };
      if(!row.nome){ toast("Informe o nome"); return; }
      if(row.tipo==="encerrado" && !row.contratoFim) row.contratoFim=hojeISO();
      if(edit.kind==="pessoa") state.pessoas=state.pessoas.map(x=>x.id===edit.id?{...x,...row}:x);
      else state.pessoas.push({id:uid(),...row});
      save(); toast(row.tipo==="encerrado"?"Encerrado: some das telas, fica no CSV":"Pessoa salva"); closeEdit(); return;
    }
    if(edit.kind==="chuva"||edit.kind==="novo-chuva"){
      if(!state.chuva) state.chuva=[];
      const row={ data:document.getElementById("e-data").value||hojeISO(), mm:Number(String(document.getElementById("e-mm").value).replace(",",".")||0), obs:document.getElementById("e-obs").value.trim() };
      if(!row.mm && row.mm!==0){ toast("Informe os mm"); return; }
      if(edit.kind==="chuva") state.chuva=state.chuva.map(x=>x.id===edit.id?{...x,...row}:x);
      else state.chuva.push({id:uid(),...row});
      save(); toast("Chuva registrada"); closeEdit(); return;
    }
    if(edit.kind==="saida"||edit.kind==="novo-saida"){
      if(!state.saidas) state.saidas=[];
      const dest=(document.getElementById("e-destino").value||"").trim();
      const resp=(document.getElementById("e-resp").value||"").trim();
      if(!dest || !resp){ toast("Destino e responsável são obrigatórios"); return; }
      const linhas=[...document.querySelectorAll("#saida-itens .saida-linha")];
      const itens=[];
      for(const ln of linhas){
        const prodId=ln.querySelector(".e-prod").value;
        const prod=state.insumos.find(x=>x.id===prodId);
        const qtd=Number(String(ln.querySelector(".e-qtd").value).replace(",",".")||0);
        if(!prod || !qtd) continue;
        if(qtd>prod.quantidade){ toast(prod.nome+" sem estoque suficiente"); return; }
        itens.push({id:prod.id, nome:prod.nome, qtd, un:prod.unidade});
      }
      if(!itens.length){ toast("Informe pelo menos um produto e quantidade"); return; }
      const row={
        id:uid(),
        data:document.getElementById("e-data").value||hojeISO(),
        tipo:document.getElementById("e-tipo").value,
        itens,
        destino:dest,
        responsavel:resp,
        obs:document.getElementById("e-obs").value.trim(),
        devolvido:false
      };
      state.saidas.push(row);
      itens.forEach(it=>{
        state.insumos=state.insumos.map(x=>x.id===it.id?{...x, quantidade: Number((x.quantidade-it.qtd).toFixed(2))}:x);
      });
      // Diesel é derivado do inventário; a baixa acima já alterou os itens.
      sincronizaDieselInventario();
      save(); toast("Saída lançada e baixa no estoque"); closeEdit(); return;
    }
    if(edit.kind==="protocolo"||edit.kind==="novo-protocolo"){
      if(!state.equatorial) state.equatorial=JSON.parse(JSON.stringify(SEED.equatorial||{}));
      if(!state.equatorial.protocolos) state.equatorial.protocolos=[];
      const num=(document.getElementById("e-prot")&&document.getElementById("e-prot").value.trim())||"";
      if(!num){ toast("Informe o número do protocolo"); return; }
      const ucEl=document.getElementById("e-uc");
      const uc=ucEl?ucEl.value:"";
      const ucObj=(state.equatorial.ucs||[]).find(u=>String(u.uc)===String(uc));
      const row={
        id: edit.kind==="protocolo" && edit.id && !String(edit.id).includes("-") ? edit.id : (edit.kind==="protocolo"?edit.id:uid()),
        data:document.getElementById("e-data").value||hojeISO(),
        hora:(document.getElementById("e-hora")&&document.getElementById("e-hora").value)||"",
        uc,
        protocolo:num,
        hist:(document.getElementById("e-hist")&&document.getElementById("e-hist").value.trim())||"",
        local:(document.getElementById("e-local")&&document.getElementById("e-local").value.trim())||(ucObj?ucObj.desc:"")
      };
      if(edit.kind==="protocolo"){
        let found=false;
        state.equatorial.protocolos=state.equatorial.protocolos.map(x=>{
          const key=x.id||(x.protocolo+"-"+x.data+"-"+x.hora);
          if(key===edit.id){ found=true; return {...x,...row, id:x.id||uid()}; }
          return x;
        });
        if(!found) state.equatorial.protocolos.push({...row,id:uid()});
      } else {
        state.equatorial.protocolos.push({...row,id:uid()});
      }
      save(); toast("Protocolo salvo"); closeEdit(); return;
    }
  };
  const ed=document.getElementById("e-del");
  if(ed) ed.onclick=()=>{
    if(!confirm("Excluir este registro?")) return;
    if(edit.kind==="insumo") state.insumos=state.insumos.filter(x=>x.id!==edit.id);
    if(edit.kind==="maquina") state.maquinas=state.maquinas.filter(x=>x.id!==edit.id);
    if(edit.kind==="pessoa") state.pessoas=state.pessoas.filter(x=>x.id!==edit.id);
    if(edit.kind==="chuva") state.chuva=(state.chuva||[]).filter(x=>x.id!==edit.id);
    if(edit.kind==="protocolo"){
      if(!state.equatorial) state.equatorial={protocolos:[]};
      state.equatorial.protocolos=(state.equatorial.protocolos||[]).filter(x=>{
        const key=x.id||(x.protocolo+"-"+x.data+"-"+x.hora);
        return key!==edit.id;
      });
    }
    save(); toast("Excluído"); closeEdit();
  };
  // Devolver empréstimo
  document.querySelectorAll("[data-devolver]").forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.getAttribute("data-devolver");
      const s=(state.saidas||[]).find(x=>x.id===id);
      if(!s || s.devolvido) return;
      (s.itens||[]).forEach(it=>{
        state.insumos=state.insumos.map(x=>x.id===it.id?{...x, quantidade: Number((x.quantidade+it.qtd).toFixed(2))}:x);
        if((it.nome||"").toLowerCase().includes("diesel")){
          state.diesel.litros = Number((state.diesel.litros + it.qtd).toFixed(0));
        }
      });
      s.devolvido=true;
      save(); toast("Empréstimo devolvido — estoque restaurado"); render();
    };
  });
  const sj=document.getElementById("e-save-janela");
  if(sj) sj.onclick=()=>{
    if(!state.farm.janela) state.farm.janela={};
    state.farm.janela={
      vazioIni:document.getElementById("j-vi").value,
      vazioFim:document.getElementById("j-vf").value,
      semeaduraIni:document.getElementById("j-si").value,
      semeaduraFim:document.getElementById("j-sf").value,
      portaria:document.getElementById("j-po").value.trim(),
      fonte:document.getElementById("j-fo").value.trim()
    };
    save(); toast("Janela MAPA atualizada"); closeEdit();
  };
  const xg=document.getElementById("x-grupo");
  const applyExtLock=()=>{
    const m=xg && xg.value==="maquinario";
    const loc=document.getElementById("x-local");
    const maq=document.getElementById("x-maq");
    const nr=document.getElementById("x-nr");
    if(loc) loc.disabled=!!m;
    if(maq) maq.disabled=!m;
    if(nr) nr.disabled=!m;
  };
  if(xg){ xg.onchange=applyExtLock; applyExtLock(); }
  const xm=document.getElementById("x-maq");
  if(xm) xm.onchange=()=>{
    const m=(state.maquinas||[]).find(x=>x.id===xm.value);
    const nr=document.getElementById("x-nr");
    if(m && nr) nr.value=m.codigo||m.placa||"";
  };
  const sx=document.getElementById("e-save-ext");
  if(sx) sx.onclick=()=>{
    if(!state.extintores) state.extintores=[];
    const grupo=document.getElementById("x-grupo").value;
    const row={
      fazenda:document.getElementById("x-faz").value,
      grupo,
      local:document.getElementById("x-local").value.trim(),
      maqId:document.getElementById("x-maq").value,
      maquina:(()=>{ const id=document.getElementById("x-maq").value; const m=(state.maquinas||[]).find(x=>x.id===id); return m?m.nome:""; })(),
      nrInterno:document.getElementById("x-nr").value.trim() || (()=>{ const id=document.getElementById("x-maq").value; const m=(state.maquinas||[]).find(x=>x.id===id); return m?(m.codigo||m.placa||""):""; })(),
      tipo:document.getElementById("x-tipo").value,
      carga:document.getElementById("x-carga").value,
      codigo:document.getElementById("x-cod").value.trim(),
      recarga:document.getElementById("x-rec").value||"",
      validade:document.getElementById("x-val").value||"",
      obs:document.getElementById("x-obs").value.trim()
    };
    if(grupo==="maquinario" && row.maquina) row.local=row.maquina;
    if(!row.local && !row.maquina){ toast("Informe o local ou a máquina"); return; }
    if(edit.kind==="extintor") state.extintores=state.extintores.map(x=>x.id===edit.id?{...x,...row}:x);
    else state.extintores.push({id:uid(),...row});
    save(); toast("Extintor salvo"); closeEdit();
  };
  const dx=document.getElementById("e-del-ext");
  if(dx) dx.onclick=()=>{
    if(!confirm("Excluir este extintor?")) return;
    state.extintores=(state.extintores||[]).filter(x=>x.id!==edit.id);
    save(); toast("Removido"); closeEdit();
  };
  const ef=document.getElementById("e-save-farm");
  if(ef) ef.onclick=()=>{
    state.farm.nome=document.getElementById("f-nome").value.trim()||state.farm.nome;
    state.farm.municipio=document.getElementById("f-mun").value.trim()||state.farm.municipio;
    state.farm.cargo=document.getElementById("f-cargo").value.trim()||state.farm.cargo;
    state.farm.gerente=document.getElementById("f-ger").value.trim()||state.farm.gerente;
    state.farm.safra=document.getElementById("f-safra").value.trim()||state.farm.safra;
    const wa=document.getElementById("f-wa");
    if(wa) state.farm.whatsappClara=wa.value.replace(/\D/g,"");
    save(); toast("Fazenda atualizada"); closeEdit();
  };
  const ep=document.getElementById("e-save-plantio");
  if(ep) ep.onclick=()=>{
    if(!state.safraPlantio) state.safraPlantio={};
    const idx=Number(edit.id);
    state.safraPlantio[idx]={
      cultivar:document.getElementById("e-cult").value,
      sem_m:document.getElementById("e-semm").value.trim(),
      sem_ha:document.getElementById("e-semha").value.trim()
    };
    save(); toast("Plantio atualizado"); closeEdit();
  };
  const bn=document.getElementById("btn-notif");
  if(bn) bn.onclick=()=>{ if(!("Notification" in window)){ toast("Sem suporte a notificação"); return; }
    Notification.requestPermission().then(p=>{ if(p==="granted"){ toast("Avisos ativados"); new Notification("CampoGestor",{body:"Aniversários ativos"}); } else toast("Permissão negada"); }); };

  const bex=document.getElementById("btn-exp-folgas");
  if(bex) bex.onclick=()=>{
    const tipos={X:"Folga",P:"Plantão incêndio",F:"Falta",T:"Trabalhado",V:"Férias",E:"Encerrou"};
    const rows=[["Data","Pessoa","Tipo","Codigo","Observacao"]];
    (state.folgas||[]).forEach(f=>rows.push([f.data||"", f.pessoaNome||"", tipos[f.tipo]||f.tipo, f.tipo||"", f.obs||""]));
    exportCSV("folgas-santa-rita.csv", rows);
  };
  const bep=document.getElementById("btn-exp-prot");
  if(bep) bep.onclick=()=>{
    const eq=state.equatorial||SEED.equatorial;
    const rows=[["Data","Hora","UC","Protocolo","Ocorrencia","Local"]];
    (eq.protocolos||[]).forEach(p=>rows.push([p.data||"",p.hora||"",p.uc||"",p.protocolo||"",p.hist||"",p.local||""]));
    exportCSV("protocolos-equatorial.csv", rows);
  };
  document.querySelectorAll("[data-copy]").forEach(b=>{
    b.onclick=async()=>{ try{ await navigator.clipboard.writeText(b.getAttribute("data-copy")); toast("UC copiada"); }catch(e){ toast(b.getAttribute("data-copy")); } };
  });


  const bl=document.getElementById("btn-login");
  if(bl) bl.onclick=async()=>{
    const email=document.getElementById("auth-email").value.trim();
    const pass=document.getElementById("auth-pass").value;
    if(!email||!pass){ toast("Preencha e-mail e senha"); return; }
    try{ await sbLogin(email, pass); toast("Login ok — dados sincronizados"); render(); }
    catch(e){ toast(e.message||"Falha no login"); }
  };
  const bs=document.getElementById("btn-signup");
  if(bs) bs.onclick=async()=>{
    const email=document.getElementById("auth-email").value.trim();
    const pass=document.getElementById("auth-pass").value;
    if(!email||pass.length<6){ toast("Senha com pelo menos 6 caracteres"); return; }
    try{
      await sbSignup(email, pass);
      try { await sbLogin(email, pass); toast("Conta criada e logada"); }
      catch(e2){ toast("Conta criada — confirme o e-mail no Supabase ou tente Entrar"); }
      render();
    } catch(e){ toast(e.message||"Falha ao criar conta"); }
  };
  const bo=document.getElementById("btn-logout");
  if(bo) bo.onclick=async()=>{ await sbLogout(); toast("Saiu da conta"); render(); };
  const bp=document.getElementById("btn-push");
  if(bp) bp.onclick=async()=>{ await pushCloud(); toast(cloudStatus==="synced"?"Salvo na nuvem":"Erro ao salvar"); render(); };
  const bpull=document.getElementById("btn-pull");
  if(bpull) bpull.onclick=async()=>{ const ok=await pullCloud(); toast(ok===true?"Dados da nuvem carregados":ok===false?"Nada cadastrado na nuvem":"Erro ao buscar a nuvem — dados locais preservados"); render(); };

  const br=document.getElementById("btn-reset");
  if(br) br.onclick=()=>{
    if(!confirm("Restaurar o cadastro oficial do app? Os lançamentos feitos depois serão apagados.")) return;
    state=JSON.parse(JSON.stringify(SEED)); state.rotinaFeita={}; save(); toast("Dados restaurados"); render();
  };
}

document.addEventListener("keydown", e=>{
  if(e.key === "Escape"){ const pov=document.getElementById("profile-overlay"); if(pov && pov.classList.contains("open")){ pov.classList.remove("open"); return; } if(menuOpen){ menuOpen=false; render(); } }
});

(function swipeMenu(){
  let x0=null,y0=null;
  document.addEventListener("touchstart",e=>{
    const t=e.changedTouches[0];
    x0=t.clientX; y0=t.clientY;
  },{passive:true});
  document.addEventListener("touchend",e=>{
    if(x0==null) return;
    const t=e.changedTouches[0];
    const dx=t.clientX-x0, dy=t.clientY-y0;
    x0=null;
    const start=t.clientX-dx;
    if(start<32 && dx>64 && Math.abs(dy)<90){ menuOpen=true; render(); }
  },{passive:true});
})();
applyTema();
(function bootSplash(){
  const splash=document.createElement("div");
  splash.className="app-splash";
  splash.innerHTML=`<div class="splash-inner"><div class="splash-mark" aria-hidden="true"></div><div class="splash-title">CAMPO<span>GESTOR</span></div><div class="splash-sub">Gestão inteligente do campo</div><div class="splash-loading" aria-label="Carregando"><span></span></div></div>`;
  document.body.appendChild(splash);
  window.setTimeout(()=>splash.classList.add("hide"),1100);
  window.setTimeout(()=>splash.remove(),1650);
})();
initAuth().then(()=>render()).catch(()=>render());
