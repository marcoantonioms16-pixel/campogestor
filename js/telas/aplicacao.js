/* Tela: Aplicação — ordens de campo, seleção de talhões do dia, cálculo de produto e histórico. */
window.CampoGestorTelas = window.CampoGestorTelas || {};

window.CampoGestorTelas.aplicacao = function() {
  // Sub-views: lista | nova | detalhe
  if (aplicacaoView === "nova" || aplicacaoView === "editar") {
    return renderFormOrdem();
  }
  if (aplicacaoView === "detalhe" && aplicacaoId) {
    return renderDetalheOrdem(aplicacaoId);
  }

  let html = headerBar("Aplicação", "Ordens de campo e planejamento do dia");

  const ordens = (state.ordensCampo || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const apps = (state.aplicacoes || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  // Resumo do dia
  const hoje = hojeISO();
  const doDia = ordens.filter(o => o.data === hoje || o.status === "hoje");
  html += `<div class="card">
    <p class="card-title">Hoje · ${esc(dataLonga(hoje))}</p>
    <p class="muted">${doDia.length ? doDia.length + " ordem(ns) para hoje" : "Nenhuma ordem marcada para hoje"}</p>
    <button type="button" class="btn primary" id="btn-nova-ordem" style="margin-top:.6rem">+ Nova ordem de campo</button>
  </div>`;

  // Lista de ordens
  html += `<p class="sec">Ordens de campo</p>`;
  if (!ordens.length) {
    html += `<div class="card"><p class="muted">Nenhuma ordem cadastrada ainda. Crie a primeira para começar a planejar as aplicações.</p></div>`;
  } else {
    ordens.forEach(o => {
      const nTal = (o.talhaoIds || []).length;
      const nProd = (o.produtos || []).length;
      const st = o.status || "aberta";
      const stLabel = { aberta: "Aberta", hoje: "Para hoje", executado: "Executado", cancelado: "Cancelado" };
      const stBadge = { aberta: "warn", hoje: "ok", executado: "ok", cancelado: "muted" };
      html += `<button type="button" class="card safra-item" data-ordem-id="${esc(o.id)}" style="text-align:left;width:100%;cursor:pointer;margin-bottom:.45rem">
        <div class="safra-item-top">
          <p class="card-title" style="margin:0">${esc(o.titulo || o.tipo || "Ordem")}</p>
          <span class="badge ${stBadge[st] || "muted"}">${esc(stLabel[st] || st)}</span>
        </div>
        <p class="muted" style="margin:.2rem 0 0">${esc(o.data || "—")} · ${nTal} talhão(ões) · ${nProd} produto(s)</p>
      </button>`;
    });
  }

  // Histórico recente de aplicações executadas
  html += `<p class="sec">Histórico recente de aplicações</p>`;
  if (!apps.length) {
    html += `<div class="card"><p class="muted">Nenhuma aplicação registrada ainda.</p></div>`;
  } else {
    apps.slice(0, 15).forEach(a => {
      const prods = (a.produtos || []).map(p => p.nome || p.insumo).filter(Boolean).join(", ");
      html += `<div class="card safra-item" style="margin-bottom:.4rem">
        <div class="safra-item-top">
          <p class="card-title" style="margin:0;font-size:.92rem">${esc(a.titulo || a.tipo || "Aplicação")}</p>
          <span class="badge ok">Executado</span>
        </div>
        <p class="muted" style="margin:.2rem 0 0">${esc(a.data || "—")}${prods ? " · " + esc(prods) : ""}</p>
      </div>`;
    });
  }

  return html;
};

function renderFormOrdem() {
  const isEdit = aplicacaoView === "editar" && aplicacaoId;
  const o = isEdit ? (state.ordensCampo || []).find(x => x.id === aplicacaoId) : null;
  const base = o || {
    titulo: "",
    tipo: "herbicida",
    data: hojeISO(),
    status: "aberta",
    talhaoIds: [],
    produtos: [{ nome: "", doseHa: "", unidade: "L" }],
    obs: ""
  };

  const tipos = [
    { id: "herbicida", label: "Herbicida" },
    { id: "fungicida", label: "Fungicida" },
    { id: "inseticida", label: "Inseticida" },
    { id: "foliar", label: "Foliar / Nutrição" },
    { id: "outro", label: "Outro" }
  ];

  let html = headerBar(isEdit ? "Editar ordem" : "Nova ordem de campo", "Preencha e selecione os talhões");

  html += `<button type="button" class="btn sm" id="btn-voltar-aplicacao" style="margin-bottom:.7rem">← Voltar</button>`;

  html += `<div class="card">
    <div class="field"><label>Título / descrição</label>
      <input id="ord-titulo" value="${esc(base.titulo)}" placeholder="Ex: Aplicação pré-emergente"/></div>
    <div class="field"><label>Tipo de aplicação</label>
      <select id="ord-tipo">${tipos.map(t => `<option value="${t.id}" ${base.tipo === t.id ? "selected" : ""}>${t.label}</option>`).join("")}</select></div>
    <div class="field"><label>Data</label>
      <input id="ord-data" type="date" value="${esc(base.data || hojeISO())}"/></div>
    <div class="field"><label>Status</label>
      <select id="ord-status">
        <option value="aberta" ${base.status === "aberta" ? "selected" : ""}>Aberta</option>
        <option value="hoje" ${base.status === "hoje" ? "selected" : ""}>Para hoje</option>
        <option value="executado" ${base.status === "executado" ? "selected" : ""}>Executado</option>
        <option value="cancelado" ${base.status === "cancelado" ? "selected" : ""}>Cancelado</option>
      </select></div>
  </div>`;

  // Produtos
  html += `<p class="sec">Produtos e dose</p>
  <div class="card" id="ord-produtos">`;
  (base.produtos || [{ nome: "", doseHa: "", unidade: "L" }]).forEach((p, i) => {
    html += `<div class="ord-prod-linha" data-i="${i}" style="display:grid;grid-template-columns:1fr 90px 70px;gap:6px;margin-bottom:8px">
      <input class="ord-prod-nome" placeholder="Nome do produto" value="${esc(p.nome || "")}"/>
      <input class="ord-prod-dose" type="number" step="0.01" placeholder="Dose/ha" value="${esc(p.doseHa || p.dose || "")}"/>
      <select class="ord-prod-un">
        <option value="L" ${(p.unidade || "L") === "L" ? "selected" : ""}>L</option>
        <option value="kg" ${(p.unidade || "") === "kg" ? "selected" : ""}>kg</option>
        <option value="g" ${(p.unidade || "") === "g" ? "selected" : ""}>g</option>
        <option value="ml" ${(p.unidade || "") === "ml" ? "selected" : ""}>ml</option>
      </select>
    </div>`;
  });
  html += `<button type="button" class="btn sm" id="ord-add-prod">+ Produto</button></div>`;

  // Seleção de talhões
  const selecionados = new Set(base.talhaoIds || []);
  html += `<p class="sec">Talhões desta ordem</p>
  <div class="card">`;
  (state.talhoes || []).forEach(t => {
    const checked = selecionados.has(t.id) ? "checked" : "";
    html += `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,.06)">
      <input type="checkbox" class="ord-talhao" value="${esc(t.id)}" ${checked}/>
      <span>${esc(t.nome || t.codigo)} <small class="muted">(${n(t.area, 1)} ha)</small></span>
    </label>`;
  });
  html += `</div>`;

  // Cálculo automático (preview)
  html += `<div class="card" id="ord-calculo">
    <p class="card-title">Quantidade necessária</p>
    <p class="muted" id="ord-calculo-txt">Selecione talhões e informe as doses para ver o cálculo.</p>
  </div>`;

  html += `<div class="field"><label>Observações</label>
    <textarea id="ord-obs" rows="2">${esc(base.obs || "")}</textarea></div>`;

  html += `<button type="button" class="btn primary block" id="ord-salvar" style="margin-top:.8rem">${isEdit ? "Salvar alterações" : "Salvar ordem"}</button>`;
  if (isEdit) {
    html += `<button type="button" class="btn block" id="ord-executar" style="margin-top:.4rem">Marcar como executado e gerar histórico</button>`;
  }

  return html;
}

function renderDetalheOrdem(id) {
  const o = (state.ordensCampo || []).find(x => x.id === id);
  if (!o) {
    aplicacaoView = "lista";
    aplicacaoId = null;
    return window.CampoGestorTelas.aplicacao();
  }

  let html = headerBar(o.titulo || "Ordem", "Detalhe da ordem de campo");
  html += `<button type="button" class="btn sm" id="btn-voltar-aplicacao" style="margin-bottom:.7rem">← Voltar</button>`;

  const stLabel = { aberta: "Aberta", hoje: "Para hoje", executado: "Executado", cancelado: "Cancelado" };
  html += `<div class="card">
    <p class="card-title">${esc(o.titulo || o.tipo)}</p>
    <p class="muted">Tipo: ${esc(o.tipo || "—")} · Data: ${esc(o.data || "—")}</p>
    <p class="muted">Status: <b>${esc(stLabel[o.status] || o.status)}</b></p>
    ${o.obs ? `<p class="muted">${esc(o.obs)}</p>` : ""}
  </div>`;

  // Produtos + cálculo
  const talhoesSel = (state.talhoes || []).filter(t => (o.talhaoIds || []).includes(t.id));
  const areaTotal = talhoesSel.reduce((s, t) => s + (Number(t.area) || 0), 0);

  html += `<p class="sec">Produtos e quantidade</p><div class="card">`;
  if (!(o.produtos || []).length) {
    html += `<p class="muted">Nenhum produto informado.</p>`;
  } else {
    html += `<ul class="safra-insumos">`;
    (o.produtos || []).forEach(p => {
      const dose = Number(p.doseHa || p.dose) || 0;
      const qtd = dose * areaTotal;
      const un = p.unidade || "L";
      html += `<li><b>${esc(p.nome)}</b><span>${dose} ${un}/ha → <b>${n(qtd, 2)} ${un}</b> (para ${n(areaTotal, 1)} ha)</span></li>`;
    });
    html += `</ul>`;
  }
  html += `</div>`;

  html += `<p class="sec">Talhões (${talhoesSel.length})</p><div class="card"><ul class="list" style="padding:0">`;
  talhoesSel.forEach(t => {
    html += `<li><div class="list-title">${esc(t.nome || t.codigo)}</div><div class="list-sub muted">${n(t.area, 2)} ha</div></li>`;
  });
  html += `</ul></div>`;

  html += `<div style="display:flex;gap:8px;margin-top:.8rem;flex-wrap:wrap">
    <button type="button" class="btn" id="btn-editar-ordem">Editar</button>
    ${o.status !== "executado" ? `<button type="button" class="btn primary" id="ord-executar">Marcar executado</button>` : ""}
  </div>`;

  return html;
}

/** Calcula quantidade total por produto com base nos talhões selecionados e doses */
function calcularProdutosOrdem(produtos, talhaoIds) {
  const talhoes = (state.talhoes || []).filter(t => (talhaoIds || []).includes(t.id));
  const area = talhoes.reduce((s, t) => s + (Number(t.area) || 0), 0);
  return (produtos || []).map(p => {
    const dose = Number(p.doseHa || p.dose) || 0;
    const un = p.unidade || "L";
    return {
      nome: p.nome || "",
      doseHa: dose,
      unidade: un,
      area,
      quantidade: +(dose * area).toFixed(2)
    };
  });
}
