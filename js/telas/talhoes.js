/* Tela: Talhões — lista + detalhe com histórico filtrado pela safra atual. */
window.CampoGestorTelas = window.CampoGestorTelas || {};

window.CampoGestorTelas.talhoes = function() {
  // Se tem talhão selecionado, mostra o detalhe
  if (talhaoDetalhe) {
    return renderTalhaoDetalhe(talhaoDetalhe);
  }

  let html = headerBar("Talhões", "Todos os talhões da fazenda");

  const talhoes = (state.talhoes || []).slice().sort((a, b) => {
    const na = (a.nome || a.codigo || "").toLowerCase();
    const nb = (b.nome || b.codigo || "").toLowerCase();
    return na.localeCompare(nb, "pt-BR");
  });

  const safraAtual = (state.farm && state.farm.safra) || "2026/27";

  html += `<div class="card" style="margin-bottom:.6rem">
    <p class="muted" style="margin:0">Safra atual: <b>${esc(safraAtual)}</b> · Toque em um talhão para ver o histórico</p>
  </div>`;

  if (!talhoes.length) {
    html += `<div class="card"><p class="muted">Nenhum talhão cadastrado.</p></div>`;
    return html;
  }

  // Agrupa por fazenda
  const grupos = {};
  talhoes.forEach(t => {
    const faz = t.fazenda === "campo-alegre" ? "Campo Alegre" : (t.fazenda === "santa-rita" || !t.fazenda ? "Santa Rita" : String(t.fazenda));
    if (!grupos[faz]) grupos[faz] = [];
    grupos[faz].push(t);
  });

  Object.keys(grupos).sort().forEach(faz => {
    html += `<p class="sec">${esc(faz)}</p>`;
    grupos[faz].forEach(t => {
      const area = Number(t.area) || 0;
      const cult = t.variedade || t.cultura || "—";
      const estagio = t.estagio || "planejado";
      const estLabel = { planejado: "Planejado", plantado: "Plantado", andamento: "Em andamento", colhido: "Colhido" };
      html += `<button type="button" class="card talhao-card" data-talhao-id="${esc(t.id)}" style="text-align:left;width:100%;cursor:pointer;margin-bottom:.5rem">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem">
          <div style="flex:1;min-width:0">
            <p class="card-title" style="margin:0">${esc(t.nome || t.codigo)}</p>
            <p class="muted" style="margin:.2rem 0 0">${n(area, 2)} ha · ${esc(cult)}</p>
          </div>
          <span class="badge muted">${esc(estLabel[estagio] || estagio)}</span>
        </div>
      </button>`;
    });
  });

  return html;
};

function renderTalhaoDetalhe(tid) {
  const t = (state.talhoes || []).find(x => x.id === tid);
  if (!t) {
    talhaoDetalhe = null;
    return window.CampoGestorTelas.talhoes();
  }

  const safraAtual = (state.farm && state.farm.safra) || "2026/27";
  const faz = t.fazenda === "campo-alegre" ? "Campo Alegre" : "Santa Rita";

  let html = headerBar(t.nome || t.codigo, "Histórico do talhão");

  html += `<button type="button" class="btn sm" id="btn-voltar-talhoes" style="margin-bottom:.7rem">← Voltar para lista</button>`;

  // Dados básicos
  html += `<div class="card">
    <p class="card-title">${esc(t.nome || t.codigo)}</p>
    <p class="muted">${n(t.area, 2)} ha · ${esc(faz)}</p>
    <p class="muted">Cultura: ${esc(t.cultura || "soja")} · Variedade: ${esc(t.variedade || "—")}</p>
    <p class="muted">Estágio: ${esc(t.estagio || "planejado")}</p>
    <p class="muted">Safra filtrada: <b>${esc(safraAtual)}</b></p>
  </div>`;

  // Histórico — monta a partir dos dados existentes + futuros registros
  const hist = montarHistoricoTalhao(t, safraAtual);

  if (!hist.length) {
    html += `<div class="card"><p class="muted">Nenhum registro de histórico para este talhão na safra ${esc(safraAtual)}.</p>
    <p class="muted" style="margin-top:.4rem">Quando você registrar preparo, adubação, plantio ou aplicações, eles aparecerão aqui.</p></div>`;
  } else {
    html += `<p class="sec">Histórico · ${esc(safraAtual)}</p>`;
    hist.forEach(h => {
      html += `<div class="card safra-item" style="margin-bottom:.45rem">
        <div class="safra-item-top">
          <p class="card-title" style="margin:0;font-size:.95rem">${esc(h.titulo)}</p>
          <span class="badge ${h.badge || "muted"}">${esc(h.status || "")}</span>
        </div>
        <p class="muted" style="margin:.25rem 0 0">${esc(h.data || "—")}${h.detalhe ? " · " + esc(h.detalhe) : ""}</p>
        ${h.produtos && h.produtos.length ? `<ul class="safra-insumos" style="margin-top:.35rem">${h.produtos.map(p => `<li><b>${esc(p.nome)}</b><span>${esc(p.qtd || "")}</span></li>`).join("")}</ul>` : ""}
      </div>`;
    });
  }

  return html;
}

/** Monta histórico do talhão a partir dos dados atuais (SAFRA + state) + futuros registros de aplicação */
function montarHistoricoTalhao(t, safra) {
  const hist = [];
  const nomeT = (t.nome || t.codigo || "").toLowerCase();
  const codigoT = (t.codigo || "").toLowerCase();

  // Helper: verifica se o grupo de talhões da SAFRA inclui este talhão
  function grupoInclui(strTalhoes) {
    if (!strTalhoes) return false;
    const s = String(strTalhoes).toLowerCase();
    return s.includes(nomeT) || (codigoT && s.includes(codigoT));
  }

  // Corretivo (Preparo de solo)
  (SAFRA.corretivo || []).forEach((r, i) => {
    if (!grupoInclui(r.talhoes)) return;
    const stKey = "cor-" + i;
    const st = (state.safraStatus && state.safraStatus[stKey]) || {};
    hist.push({
      tipo: "preparo",
      titulo: "Preparo de solo · Corretivo",
      data: st.data || "",
      status: st.status === "concluido" ? "Concluído" : (st.status === "andamento" ? "Em andamento" : "Pendente"),
      badge: st.status === "concluido" ? "ok" : (st.status === "andamento" ? "warn" : "muted"),
      detalhe: `${r.dose || ""} · ${r.volume || ""} · ${r.cultivar || ""}`,
      produtos: r.insumo ? [{ nome: r.insumo, qtd: r.volume || r.dose }] : [],
      ordem: st.data || "9999"
    });
  });

  // Adubação (Fertilizante)
  (SAFRA.fertilizante || []).forEach((g, i) => {
    if (!grupoInclui(g.talhoes)) return;
    const stKey = "fer-" + i;
    const st = (state.safraStatus && state.safraStatus[stKey]) || {};
    hist.push({
      tipo: "adubacao",
      titulo: "Adubação",
      data: st.data || "",
      status: st.status === "concluido" ? "Concluído" : (st.status === "andamento" ? "Em andamento" : "Pendente"),
      badge: st.status === "concluido" ? "ok" : (st.status === "andamento" ? "warn" : "muted"),
      detalhe: `${n(g.ha, 2)} ha · ${g.cultivar || ""}`,
      produtos: (g.itens || []).map(it => ({ nome: it.insumo, qtd: (it.dose || "") + (it.volume ? " · " + it.volume : "") })),
      ordem: st.data || "9999"
    });
  });

  // Plantio (por talhão individual no state)
  const idxPla = (state.talhoes || []).findIndex(x => x.id === t.id);
  if (idxPla >= 0) {
    const stKey = "pla-" + idxPla;
    const st = (state.safraStatus && state.safraStatus[stKey]) || {};
    const ov = (state.safraPlantio || {})[t.id] || {};
    const seeds = (ov.sementes && ov.sementes.length) ? ov.sementes : [{ cultivar: ov.cultivar || t.variedade || "—", qtd: "", un: "" }];
    hist.push({
      tipo: "plantio",
      titulo: "Plantio + Sulco",
      data: st.data || "",
      status: st.status === "concluido" ? "Concluído" : (st.status === "andamento" ? "Em andamento" : "Pendente"),
      badge: st.status === "concluido" ? "ok" : (st.status === "andamento" ? "warn" : "muted"),
      detalhe: seeds.map(s => s.cultivar + (s.qtd ? " · " + s.qtd + " " + (s.un || "") : "")).join(", "),
      produtos: seeds.map(s => ({ nome: s.cultivar || "Semente", qtd: (s.qtd || "") + " " + (s.un || "") })),
      ordem: st.data || "9999"
    });
  }

  // Sulco (global, mas aparece no talhão se plantio existe)
  (SAFRA.sulco || []).forEach((s, i) => {
    const stKey = "sul-" + i;
    const st = (state.safraStatus && state.safraStatus[stKey]) || {};
    // Só mostra se o talhão tem plantio ou se quiser mostrar sempre
    hist.push({
      tipo: "sulco",
      titulo: "Manejo de sulco · " + (s.insumo || ""),
      data: st.data || "",
      status: st.status === "concluido" ? "Concluído" : (st.status === "andamento" ? "Em andamento" : "Pendente"),
      badge: st.status === "concluido" ? "ok" : (st.status === "andamento" ? "warn" : "muted"),
      detalhe: `${s.tipo || ""} · ${s.fabricante || ""} · ${s.dose || ""}`,
      produtos: [{ nome: s.insumo, qtd: s.dose }],
      ordem: st.data || "9999"
    });
  });

  // Aplicações futuras (state.aplicacoes)
  const apps = (state.aplicacoes || []).filter(a => {
    if (a.safra && a.safra !== safra) return false;
    const tids = a.talhaoIds || [];
    return tids.includes(t.id) || (a.talhoesNomes || []).some(n => String(n).toLowerCase().includes(nomeT));
  });
  apps.forEach(a => {
    hist.push({
      tipo: "aplicacao",
      titulo: "Aplicação · " + (a.tipo || a.titulo || "Ordem de campo"),
      data: a.data || a.dataExecucao || "",
      status: a.status === "executado" ? "Executado" : (a.status || "Registrado"),
      badge: a.status === "executado" ? "ok" : "warn",
      detalhe: a.obs || "",
      produtos: (a.produtos || []).map(p => ({ nome: p.nome || p.insumo, qtd: (p.quantidade || p.qtd || "") + " " + (p.unidade || "") })),
      ordem: a.data || a.dataExecucao || "9999"
    });
  });

  // Ordena: os com data primeiro (mais recente), depois pendentes
  hist.sort((a, b) => {
    if (a.ordem === "9999" && b.ordem !== "9999") return 1;
    if (b.ordem === "9999" && a.ordem !== "9999") return -1;
    return (b.ordem || "").localeCompare(a.ordem || "");
  });

  return hist;
}
