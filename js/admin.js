const ADMIN_EMAIL = "campogestor@gmail.com";

function session() {
  try { return JSON.parse(localStorage.getItem(SB_AUTH_KEY) || "null"); } catch (e) { return null; }
}
function emailFromSess(sess) {
  return String((sess && sess.user && sess.user.email) || "").trim().toLowerCase();
}
function headers(token) {
  return {
    apikey: SB_KEY,
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}
async function listReqs(token) {
  const res = await fetch(SB_URL + "/rest/v1/account_requests?select=*&order=created_at.desc", {
    headers: headers(token)
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    const msg = data.message || data.hint || data.error || ("HTTP " + res.status);
    throw new Error(msg);
  }
  return data;
}
async function addReq(token, email, farm) {
  const res = await fetch(SB_URL + "/rest/v1/account_requests", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ email: email, farm_name: farm || null, status: "pendente" })
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error(data.message || data.hint || ("HTTP " + res.status));
}
async function setStatus(token, id, status) {
  const res = await fetch(SB_URL + "/rest/v1/account_requests?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ status: status, decided_at: new Date().toISOString() })
  });
  if (!res.ok) {
    const data = await res.json().catch(function () { return {}; });
    throw new Error(data.message || data.hint || ("HTTP " + res.status));
  }
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
    <small>${x.farm_name || "—"} · ${x.status} · ${String(x.created_at || "").slice(0, 10)}</small>
    ${acoes}
  </div>`;
}
async function render() {
  const root = document.getElementById("admin-root");
  const sess = session();
  const email = emailFromSess(sess);
  if (!sess || !sess.access_token) {
    root.innerHTML = `<p class="kicker">CAMPOGESTOR</p><h1>Admin</h1><p class="muted">Faça login no app e volte aqui.</p><p><a class="btn primary" href="./index.html">Ir para o app</a></p>`;
    return;
  }
  if (email !== ADMIN_EMAIL) {
    root.innerHTML = `<p class="kicker">CAMPOGESTOR</p><h1>Sem permissão</h1><p>Logado como <b>${email || "—"}</b>.</p><p><a href="./index.html">Voltar ao app</a></p>`;
    return;
  }
  root.innerHTML = `<p class="muted">Carregando pedidos da nuvem…</p>`;
  let list = [];
  let err = "";
  try {
    list = await listReqs(sess.access_token);
  } catch (e) {
    err = String(e.message || e);
  }
  const pend = list.filter(function (x) { return x.status === "pendente"; });
  const outros = list.filter(function (x) { return x.status !== "pendente"; });
  const aviso = err
    ? `<div class="card" style="margin:12px 0"><p class="card-title">Tabela ainda não existe ou RLS bloqueou</p><p class="muted">${err}</p><p class="muted">No Supabase: SQL Editor → cole docs/etapa4-account-requests.sql → Run.</p></div>`
    : "";
  root.innerHTML = `
    <p class="kicker">CAMPOGESTOR</p>
    <h1>Admin</h1>
    <p class="muted">${email} · pedidos no Supabase</p>
    <p><a href="./index.html">← Voltar ao app</a></p>
    ${aviso}
    <div class="card" style="margin:16px 0">
      <p class="card-title">Pré-aprovar e-mail</p>
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
  document.getElementById("adm-add").onclick = async function () {
    const em = String(document.getElementById("adm-email").value || "").trim().toLowerCase();
    const farm = String(document.getElementById("adm-farm").value || "").trim();
    if (!em || em.indexOf("@") < 0) { alert("E-mail inválido"); return; }
    try {
      await addReq(sess.access_token, em, farm);
      render();
    } catch (e) { alert(e.message || e); }
  };
  document.querySelectorAll("[data-adm]").forEach(function (btn) {
    btn.onclick = async function () {
      try {
        await setStatus(sess.access_token, btn.getAttribute("data-id"), btn.getAttribute("data-adm"));
        render();
      } catch (e) { alert(e.message || e); }
    };
  });
}
render();
