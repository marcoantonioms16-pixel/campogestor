/* Tela: Safra — Centro Histórico por safra.
 * Ao abrir, escolhe a safra e vê as seções: Preparo de solo, Adubação, Plantio+Sulco, Aplicações.
 */
window.CampoGestorTelas = window.CampoGestorTelas || {};

window.CampoGestorTelas.safra = function() {
  const safrasDisponiveis = getSafrasDisponiveis();
  const safraAtual = safraSelecionada || (state.farm && state.farm.safra) || "2026/27";

  let html = headerBar("Safra", "Centro histórico");

  // Seletor de safra
  html += `<div class="card">
    <p class="card-title">Escolha a safra</p>
    <div class="chips" style="margin-top:.4rem">
      ${safrasDisponiveis.map(s => `
        <button type="button" class="chip ${safraAtual === s ? "on" : ""}" data-safra-sel="${esc(s)}">${esc(s)}</button>
      `).join("")}
    </div>
  </div>`;

  // Progresso resumido (só para a safra atual dos dados SEED)
  if (safraAtual === ((state.farm && state.farm.safra) || "2026/27")) {
    if (!state.safraStatus) state.safraStatus = {};
    const nCor = (SAFRA.corretivo || []).length;
    const nFer = (SAFRA.fertilizante || []).length;
    const nPla = (state.talhoes || []).length;
    const nSul = (SAFRA.sulco || []).length;
    const countSt = (sec, total) => {
      let c = 0;
      for (let i = 0; i < total; i++) {
        const st = (state.safraStatus[sec + "-" + i] || {}).status || "pendente";
        if (st === "concluido") c++;
      }
      return c;
    };
    html += `<div class="card">
      <p class="card-title">Progresso · ${esc(safraAtual)}</p>
      <p class="muted">Preparo ${countSt("cor", nCor)}/${nCor} · Adubação ${countSt("fer", nFer)}/${nFer} · Plantio ${countSt("pla", nPla)}/${nPla} · Sulco ${countSt("sul", nSul)}/${nSul}</p>
    </div>`;
  }

  // ========== SEÇÃO: Preparo de solo ==========
  html += `<p class="sec">Preparo de solo (corretivo)</p>`;
  if (!(SAFRA.corretivo || []).length || safraAtual !== ((state.farm && state.farm.safra) || "2026/27")) {
    html += `<div class="card"><p class="muted">Sem registros de preparo para esta safra.</p></div>`;
  } else {
    SAFRA.corretivo.forEach((r, i) => {
      const stKey = "cor-" + i;
      const st = (state.safraStatus[stKey] || {}).status || "pendente";
      const stDate = (state.safraStatus[stKey] || {}).data || "";
      const stLabel = { pendente: "Pendente", andamento: "Em andamento", concluido: "Concluído" };
      const stBadge = { pendente: "muted", andamento: "warn", concluido: "ok" };
      html += `<div class="card safra-item">
        <div class="safra-item-top">
          <p class="card-title">${esc(r.talhoes)}</p>
          <button type="button" class="badge ${stBadge[st]}" data-safra-st="cor" data-i="${i}">${stLabel[st]}</button>
        </div>
        <p class="muted">${n(r.ha, 2)} ha · ${esc(r.cultivar)}</p>
        <p class="muted">${esc(r.dose)} · ${esc(r.volume)}</p>
        ${st === "concluido" && stDate ? `<p class="muted">Concluído em ${stDate.split("-").reverse().join("/")}</p>` : ""}
      </div>`;
    });
  }

  // ========== SEÇÃO: Adubação ==========
  html += `<p class="sec">Adubação</p>`;
  if (!(SAFRA.fertilizante || []).length || safraAtual !== ((state.farm && state.farm.safra) || "2026/27")) {
    html += `<div class="card"><p class="muted">Sem registros de adubação para esta safra.</p></div>`;
  } else {
    SAFRA.fertilizante.forEach((g, i) => {
      const stKey = "fer-" + i;
      const st = (state.safraStatus[stKey] || {}).status || "pendente";
      const stDate = (state.safraStatus[stKey] || {}).data || "";
      const stLabel = { pendente: "Pendente", andamento: "Em andamento", concluido: "Concluído" };
      const stBadge = { pendente: "muted", andamento: "warn", concluido: "ok" };
      html += `<div class="card safra-item">
        <div class="safra-item-top">
          <p class="card-title">${esc(g.talhoes)}</p>
          <button type="button" class="badge ${stBadge[st]}" data-safra-st="fer" data-i="${i}">${stLabel[st]}</button>
        </div>
        <p class="muted">${n(g.ha, 2)} ha · ${esc(g.cultivar)}</p>
        <ul class="safra-insumos">`;
      (g.itens || []).forEach(it => {
        html += `<li><b>${esc(it.insumo)}</b><span>${esc(it.dose)} · ${esc(it.volume)}</span></li>`;
      });
      html += `</ul>
        ${st === "concluido" && stDate ? `<p class="muted">Concluído em ${stDate.split("-").reverse().join("/")}</p>` : ""}
      </div>`;
    });
  }

  // ========== SEÇÃO: Plantio + Sulco ==========
  html += `<p class="sec">Plantio + Sulco</p>`;
  if (safraAtual !== ((state.farm && state.farm.safra) || "2026/27")) {
    html += `<div class="card"><p class="muted">Sem registros de plantio para esta safra.</p></div>`;
  } else {
    (state.talhoes || []).forEach((t, i) => {
      const stKey = "pla-" + i;
      const st = (state.safraStatus[stKey] || {}).status || "pendente";
      const stDate = (state.safraStatus[stKey] || {}).data || "";
      const stLabel = { pendente: "Pendente", andamento: "Em andamento", concluido: "Concluído" };
      const stBadge = { pendente: "muted", andamento: "warn", concluido: "ok" };
      const ov = (state.safraPlantio || {})[t.id] || {};
      const seeds = (ov.sementes && ov.sementes.length) ? ov.sementes : [{ cultivar: ov.cultivar || t.variedade || "—", qtd: "", un: "kg" }];
      html += `<div class="card safra-item">
        <div class="safra-item-top">
          <p class="card-title">${esc(t.nome || t.codigo)}</p>
          <div class="safra-item-actions">
            <button type="button" class="badge ${stBadge[st]}" data-safra-st="pla" data-i="${i}">${stLabel[st]}</button>
            <button type="button" class="btn sm" data-edit-plantio="${t.id}">✎</button>
          </div>
        </div>
        <p class="muted">${n(t.area, 2)} ha · ${t.fazenda === "campo-alegre" ? "Campo Alegre" : "Santa Rita"}</p>
        ${seeds.map(s => `<p class="muted">${esc(s.cultivar || "—")}${s.qtd ? ` · ${esc(s.qtd)} ${esc(s.un || "")}` : ""}</p>`).join("")}
        ${st === "concluido" && stDate ? `<p class="muted">Concluído em ${stDate.split("-").reverse().join("/")}</p>` : ""}
      </div>`;
    });

    html += `<p class="sec" style="margin-top:1rem">Manejo de sulco</p>`;
    (SAFRA.sulco || []).forEach((s, i) => {
      const stKey = "sul-" + i;
      const st = (state.safraStatus[stKey] || {}).status || "pendente";
      const stDate = (state.safraStatus[stKey] || {}).data || "";
      const stLabel = { pendente: "Pendente", andamento: "Em andamento", concluido: "Concluído" };
      const stBadge = { pendente: "muted", andamento: "warn", concluido: "ok" };
      html += `<div class="card safra-item">
        <div class="safra-item-top">
          <p class="card-title">${esc(s.insumo)}</p>
          <button type="button" class="badge ${stBadge[st]}" data-safra-st="sul" data-i="${i}">${stLabel[st]}</button>
        </div>
        <p class="muted">${esc(s.tipo)} · ${esc(s.fabricante)} · ${esc(s.dose)}</p>
        ${st === "concluido" && stDate ? `<p class="muted">Concluído em ${stDate.split("-").reverse().join("/")}</p>` : ""}
      </div>`;
    });
  }

  // ========== SEÇÃO: Aplicações (resumo) ==========
  html += `<p class="sec">Aplicações</p>`;
  const apps = (state.aplicacoes || []).filter(a => !a.safra || a.safra === safraAtual)
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  if (!apps.length) {
    html += `<div class="card"><p class="muted">Nenhuma aplicação registrada nesta safra.</p>
    <p class="muted">Use a tela <b>Aplicação</b> para registrar ordens de campo.</p></div>`;
  } else {
    apps.forEach(a => {
      const prods = (a.produtos || []).map(p => {
        const q = p.quantidade != null ? p.quantidade : (p.qtd || "");
        return `${p.nome || p.insumo}${q ? " · " + q + " " + (p.unidade || "") : ""}`;
      }).join("; ");
      html += `<div class="card safra-item">
        <div class="safra-item-top">
          <p class="card-title">${esc(a.titulo || a.tipo || "Aplicação")}</p>
          <span class="badge ok">${esc(a.data ? a.data.split("-").reverse().join("/") : "—")}</span>
        </div>
        <p class="muted">${esc(prods || "Sem produtos")}</p>
      </div>`;
    });
  }

  return html;
};

function getSafrasDisponiveis() {
  const set = new Set();
  const atual = (state.farm && state.farm.safra) || "2026/27";
  set.add(atual);
  (state.aplicacoes || []).forEach(a => { if (a.safra) set.add(a.safra); });
  (state.ordensCampo || []).forEach(o => { if (o.safra) set.add(o.safra); });
  if (!set.has("Safrinha 2027")) set.add("Safrinha 2027");
  return Array.from(set);
}
