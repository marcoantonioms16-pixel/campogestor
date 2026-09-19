const ADMIN_EMAIL = "campogestor@gmail.com";
const REQ_KEY = "campogestor-admin-requests";

function loadReqs() {
  try { return JSON.parse(localStorage.getItem(REQ_KEY) || "[]"); } catch (e) { return []; }
}
function saveReqs(list) {
  localStorage.setItem(REQ_KEY, JSON.stringify(list));
}
function session() {
  try { return JSON.parse(localStorage.getItem(SB_AUTH_KEY) || "null"); } catch (e) { return null; }
}
function emailFromSess(sess) {
  return String((sess && sess.user && sess.user.email) || "").trim().toLowerCase();
}
function rowHtml(x) {
  const acoes = x.status === "pendente"
    ? `<div class="admin-actions">
         <button type="button" class="btn sm" data-adm="aprovado" data-id="${x.id}">Aprovar</button>
         <button type="button" class="btn sm" data-adm="recusado" data-id="${x.id}">Recusar</button>
       </div>`
    : "";
  return `<div class="admin-row">
    <b>${x.email}</b>
    <small>${x.farm} · ${x.status} · ${(x.em || "").slice(0, 10)}</small>
    ${acoes}
  </div>`;
}
function render() {
  const root = document.getElementById("admin-root");
  const sess = session();
  const email = emailFromSess(sess);
  if (!sess || !sess.access_token) {
    root.innerHTML = `<p class="kicker">CAMPOGESTOR</p><h1>Admin</h1><p class="muted">Faça login no app e volte aqui.</p><p><a class="btn primary" href="./index.html">Ir para o app</a></p>`;
    return;
  }
  if (email !== ADMIN_EMAIL) {
    root.innerHTML = `<p class="kicker">CAMPOGESTOR</p><h1>Sem permissão</h1><p>Logado como <b>${email || "—"}</b>.</p><p class="muted">Só ${ADMIN_EMAIL} acessa o admin.</p><p><a href="./index.html">Voltar ao app</a></p>`;
    return;
  }
  const list = loadReqs();
  const pend = list.filter((x) => x.status === "pendente");
  const outros = list.filter((x) => x.status !== "pendente");
  root.innerHTML = `
    <p class="kicker">CAMPOGESTOR</p>
    <h1>Admin</h1>
    <p class="muted">${email} · pedidos neste aparelho (ainda não é tabela do Supabase)</p>
    <p><a href="./index.html">← Voltar ao app</a></p>
    <div class="card" style="margin:16px 0">
      <p class="card-title">Pré-aprovar e-mail</p>
      <p class="muted">Anote o vizinho. A conta no Auth do Supabase você confirma lá no painel.</p>
      <div class="field"><label>E-mail</label><input id="adm-email" type="email" placeholder="vizinho01@gmail.com"/></div>
      <div class="field"><label>Nome da fazenda</label><input id="adm-farm" type="text" placeholder="Fazenda do vizinho"/></div>
      <button type="button" class="btn primary" id="adm-add">Registrar pedido</button>
    </div>
    <h2 style="font-size:1rem">Pendentes (${pend.length})</h2>
    <div class="admin-list" id="adm-pend"></div>
    <h2 style="font-size:1rem">Histórico (${outros.length})</h2>
    <div class="admin-list" id="adm-hist"></div>`;
  document.getElementById("adm-pend").innerHTML = pend.length ? pend.map(rowHtml).join("") : `<p class="muted">Nenhum pedido.</p>`;
  document.getElementById("adm-hist").innerHTML = outros.length ? outros.map(rowHtml).join("") : `<p class="muted">Vazio.</p>`;
  document.getElementById("adm-add").onclick = function () {
    const em = String(document.getElementById("adm-email").value || "").trim().toLowerCase();
    const farm = String(document.getElementById("adm-farm").value || "").trim();
    if (!em || em.indexOf("@") < 0) { alert("E-mail inválido"); return; }
    const cur = loadReqs();
    cur.unshift({ id: "r-" + Date.now(), email: em, farm: farm || "—", status: "pendente", em: new Date().toISOString() });
    saveReqs(cur);
    render();
  };
  document.querySelectorAll("[data-adm]").forEach(function (btn) {
    btn.onclick = function () {
      const id = btn.getAttribute("data-id");
      const ac = btn.getAttribute("data-adm");
      saveReqs(loadReqs().map(function (x) { if (x.id === id) x.status = ac; return x; }));
      render();
    };
  });
}
render();
