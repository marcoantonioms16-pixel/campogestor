/* CampoGestor — autenticação e sincronização na nuvem (Supabase).
 * Depende de: js/core/config.js, js/core/data.js
 * Usa globals: state, SEED, KEY, sincronizaDieselInventario (app.js)
 */
let sbUser = null;
let cloudStatus = "local"; // local | syncing | synced | error
let cloudError = "";
let cloudTimer = null;

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

async function sbRefreshSession(sess) {
  if (!sess || !sess.refresh_token) return null;
  try {
    const res = await fetch(SB_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({ refresh_token: sess.refresh_token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) return null;
    // Mantém refresh_token se a API não devolver um novo
    if (!data.refresh_token && sess.refresh_token) data.refresh_token = sess.refresh_token;
    saveSession(data);
    return data;
  } catch (e) {
    console.warn("refresh session", e);
    return null;
  }
}

function isAppOnline() {
  try { return navigator.onLine !== false; } catch (e) { return true; }
}

async function initAuth() {
  let sess = loadSession();
  if (!sess || (!sess.access_token && !sess.refresh_token)) return;

  // Offline: não desloga — mantém sessão e dados locais
  if (!isAppOnline()) {
    if (sess.user) sbUser = sess.user;
    else sbUser = sbUser || { id: "offline", email: "" };
    cloudStatus = "offline";
    return;
  }

  try {
    let user = null;
    if (sess.access_token) {
      const res = await fetch(SB_URL + "/auth/v1/user", { headers: sbHeaders(sess.access_token) });
      if (res.ok) user = await res.json();
    }
    if (!user) {
      const refreshed = await sbRefreshSession(sess);
      if (!refreshed || !refreshed.access_token) {
        // Só limpa sessão se estiver online e o refresh falhou de verdade
        if (isAppOnline()) saveSession(null);
        else cloudStatus = "offline";
        return;
      }
      sess = refreshed;
      if (sess.user) user = sess.user;
      else {
        const res2 = await fetch(SB_URL + "/auth/v1/user", { headers: sbHeaders(sess.access_token) });
        if (!res2.ok) {
          if (isAppOnline()) saveSession(null);
          return;
        }
        user = await res2.json();
      }
    }
    sbUser = user;
    if (sess && !sess.user && user) {
      try {
        const s = loadSession() || sess;
        s.user = user;
        saveSession(s);
      } catch (e) {}
    }
    await pullCloud();
  } catch (e) {
    console.warn(e);
    // Rede falhou no meio: preserva sessão local
    if (sess.user) sbUser = sess.user;
    cloudStatus = isAppOnline() ? "error" : "offline";
  }
}

async function pushCloud() {
  if (!sbUser) return;
  if (!isAppOnline()) { cloudStatus = "offline"; return; }
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
  if (!isAppOnline()) { cloudStatus = "offline"; return false; }
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
            if (!Array.isArray(state.ordensCampo)) state.ordensCampo = [];
      if (typeof ORDENS_CATA_SEED !== "undefined" && Array.isArray(ORDENS_CATA_SEED)) {
        const existing = new Set(state.ordensCampo.map(o => o.id));
        ORDENS_CATA_SEED.forEach(o => {
          if (!existing.has(o.id)) state.ordensCampo.push(JSON.parse(JSON.stringify(o)));
        });
      }
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
    let out;
    if(raw){
      const d = JSON.parse(raw);
      out = {
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
        ordensCampo: Array.isArray(d.ordensCampo) ? d.ordensCampo : [],
        aplicacoes: Array.isArray(d.aplicacoes) ? d.aplicacoes : [],
      };
    } else {
      out = JSON.parse(JSON.stringify(SEED));
      out.ordensCampo = out.ordensCampo || [];
      out.aplicacoes = out.aplicacoes || [];
    }
    // Importa ordens CATA (Dessecação Pré-Plantio) se ainda não existirem
    if (typeof ORDENS_CATA_SEED !== "undefined" && Array.isArray(ORDENS_CATA_SEED)) {
      if (!Array.isArray(out.ordensCampo)) out.ordensCampo = [];
      const existing = new Set(out.ordensCampo.map(o => o.id));
      ORDENS_CATA_SEED.forEach(o => {
        if (!existing.has(o.id)) out.ordensCampo.push(JSON.parse(JSON.stringify(o)));
      });
    }
    return out;
  }catch(e){}
  const fallback = JSON.parse(JSON.stringify(SEED));
  fallback.ordensCampo = fallback.ordensCampo || [];
  fallback.aplicacoes = fallback.aplicacoes || [];
  if (typeof ORDENS_CATA_SEED !== "undefined" && Array.isArray(ORDENS_CATA_SEED)) {
    fallback.ordensCampo = JSON.parse(JSON.stringify(ORDENS_CATA_SEED));
  }
  return fallback;
}
function save(){
  sincronizaDieselInventario();
  localStorage.setItem(KEY, JSON.stringify(state));
  scheduleCloudSave();
}
function scheduleCloudSave(){
  if(!sbUser) return;
  cloudStatus="syncing";
  clearTimeout(cloudTimer);
  cloudTimer=setTimeout(pushCloud, 800);
}


function cloudLabel(){
  if (!isAppOnline() || cloudStatus === "offline") {
    return sbUser ? "Sem internet · dados neste aparelho" : "Sem internet · modo local";
  }
  if(!sbUser) return "Só neste aparelho (não logado)";
  if(cloudStatus==="syncing") return "Salvando na nuvem…";
  if(cloudStatus==="synced") return "Sincronizado na nuvem ✓ · " + (sbUser.email||"");
  if(cloudStatus==="error") return "Erro sync: " + (cloudError || "falha") + " — dados locais ok";
  return "Logado: "+(sbUser.email||"");
}
