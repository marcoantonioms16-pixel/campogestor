/* Tela: Aplicação — janelas por tipo, lista de ordens, seleção e soma de insumos. */
window.CampoGestorTelas = window.CampoGestorTelas || {};

const TIPOS_APLICACAO = [
  { id: "dessecacao-pre-plantio", label: "Dessecação Pré-Plantio" },
  { id: "aplique-e-plante", label: "Aplique e Plante" },
  { id: "pos-plantio", label: "Pós-Plantio" },
  { id: "pos-emergencia", label: "Pós-Emergência" },
  { id: "fungicida-0", label: "Fungicida 0" },
  { id: "fungicida-1", label: "Fungicida 1" },
  { id: "fungicida-2", label: "Fungicida 2" },
  { id: "fungicida-3", label: "Fungicida 3" },
  { id: "dessecacao-pre-colheita", label: "Dessecação Pré-Colheita" },
];

function labelTipoAplicacao(id) {
  const t = TIPOS_APLICACAO.find(x => x.id === id);
  return t ? t.label : (id || "Aplicação");
}

window.CampoGestorTelas.aplicacao = function() {
  if (aplicacaoView === "nova" || aplicacaoView === "editar") {
    return renderFormOrdem();
  }
  if (aplicacaoView === "detalhe" && aplicacaoId) {
    return renderDetalheOrdem(aplicacaoId);
  }
  if (aplicacaoView === "tipo") {
    return renderListaOrdensTipo();
  }

  let html = headerBar("Aplicação", "Tipos de aplicação");

  html += `<p class="sec">Janelas de aplicação</p>`;
  html += `<div class="aplicacao-chips">`;
  html += `<button type="button" class="chip-row" data-aplicacao-tipo="todos">
    <span>Todas as ordens</span>
    <small>${(state.ordensCampo || []).length}</small>
  </button>`;
  TIPOS_APLICACAO.forEach(t => {
    const qtd = (state.ordensCampo || []).filter(o => o.tipo === t.id).length;
    html += `<button type="button" class="chip-row" data-aplicacao-tipo="${esc(t.id)}">
      <span>${esc(t.label)}</span>
      <small>${qtd}</small>
    </button>`;
  });
  html += `</div>`;

  // Histórico recente (só executadas)
  const apps = (state.aplicacoes || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  if (apps.length) {
    html += `<p class="sec">Histórico recente</p>`;
    apps.slice(0, 10).forEach(a => {
      const prods = (a.produtos || []).map(p => p.nome || p.insumo).filter(Boolean).join(", ");
      html += `<div class="card safra-item" style="margin-bottom:.4rem">
        <div class="safra-item-top">
          <p class="card-title" style="margin:0;font-size:.9rem">${esc(a.titulo || labelTipoAplicacao(a.tipo) || "Aplicação")}</p>
          <span class="badge ok">Executado</span>
        </div>
        <p class="muted" style="margin:.2rem 0 0">${esc(a.data ? a.data.split("-").reverse().join("/") : "—")}${prods ? " · " + esc(prods) : ""}</p>
      </div>`;
    });
  }

  return html;
};


function insumosDaOrdem(o) {
  const talhoesSel = (state.talhoes || []).filter(t => (o.talhaoIds || []).includes(t.id));
  const areaTotal = talhoesSel.reduce((s, t) => s + (Number(t.area) || 0), 0);
  return (o.produtos || []).map(p => {
    const dose = Number(p.doseHa != null ? p.doseHa : p.dose) || 0;
    const un = p.unidade || "L";
    const qtd = p.quantidade != null && p.quantidade !== ""
      ? Number(p.quantidade)
      : dose * areaTotal;
    return { nome: p.nome || "", doseHa: dose, unidade: un, area: areaTotal, quantidade: Number(qtd) || 0 };
  }).filter(p => p.nome);
}

function somarInsumosOrdens(ordens) {
  const map = {};
  let area = 0;
  (ordens || []).forEach(o => {
    const itens = insumosDaOrdem(o);
    if (itens[0]) area += Number(itens[0].area) || 0;
    itens.forEach(c => {
      const key = c.nome.trim().toLowerCase() + "|" + c.unidade;
      if (!map[key]) map[key] = { nome: c.nome, unidade: c.unidade, quantidade: 0 };
      map[key].quantidade += Number(c.quantidade) || 0;
    });
  });
  return { itens: Object.values(map), area };
}

function renderListaOrdensTipo() {
  const filtro = aplicacaoFiltro || "todos";
  const titulo = filtro === "todos" ? "Todas as ordens" : labelTipoAplicacao(filtro);
  let html = headerBar("Aplicação", titulo);
  html += `<button type="button" class="btn sm" id="btn-voltar-aplicacao" style="margin-bottom:.7rem">← Voltar</button>`;

  let ordens = (state.ordensCampo || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  if (filtro !== "todos") ordens = ordens.filter(o => o.tipo === filtro);

  html += `<div style="margin:0 0 .7rem">
    <button type="button" class="btn primary block" id="btn-nova-ordem">+ Nova ordem neste tipo</button>
  </div>`;

  const sel = new Set(aplicacaoSel || []);
  const selecionadas = ordens.filter(o => sel.has(o.id));
  const soma = somarInsumosOrdens(selecionadas);

  html += `<div class="card" id="aplicacao-soma" style="margin-bottom:.7rem">
    <p class="card-title">Insumos das ordens selecionadas</p>
    ${!selecionadas.length
      ? `<p class="muted" style="margin:.25rem 0 0">Marque 1 ou mais ordens para somar as quantidades.</p>`
      : `<p class="muted" style="margin:.2rem 0 .35rem">${selecionadas.length} ordem(ns) · ${n(soma.area, 2)} ha</p>
         <ul class="safra-insumos">${soma.itens.map(i =>
           `<li><b>${esc(i.nome)}</b><span><b>${n(i.quantidade, 2)} ${esc(i.unidade)}</b></span></li>`
         ).join("") || "<li class=\"muted\">Sem produtos nas ordens selecionadas.</li>"}</ul>`}
  </div>`;

  html += `<p class="sec">${ordens.length} ordem(ns)</p>`;
  if (!ordens.length) {
    html += `<div class="card"><p class="muted">Nenhuma ordem neste tipo ainda.</p></div>`;
  } else {
    ordens.forEach(o => {
      const nTal = (o.talhaoIds || []).length;
      const nProd = (o.produtos || []).length;
      const st = o.status || "aberta";
      const stLabel = { aberta: "Aberta", hoje: "Para hoje", executado: "Executado", cancelado: "Cancelado" };
      const stBadge = { aberta: "warn", hoje: "ok", executado: "ok", cancelado: "muted" };
      const talNome = nTal === 1
        ? (() => {
            const t = (state.talhoes || []).find(x => x.id === (o.talhaoIds || [])[0]);
            return t ? (t.nome || t.codigo) : "1 talhão";
          })()
        : nTal + " talhões";
      const checked = sel.has(o.id) ? "checked" : "";
      html += `<div class="card safra-item ordem-sel-card" style="margin-bottom:.45rem">
        <div class="safra-item-top" style="align-items:flex-start;gap:8px">
          <label style="display:flex;align-items:flex-start;gap:10px;flex:1;min-width:0;cursor:pointer">
            <input type="checkbox" class="ord-sel" data-sel-ordem="${esc(o.id)}" ${checked} style="margin-top:4px;width:18px;height:18px;flex-shrink:0"/>
            <span style="min-width:0">
              <span class="card-title" style="display:block;font-size:.92rem">${esc(o.titulo || labelTipoAplicacao(o.tipo))}</span>
              <span class="muted" style="display:block;margin-top:.2rem">${esc(o.data ? o.data.split("-").reverse().join("/") : "—")} · ${esc(talNome)} · ${nProd} produto(s)${o.oc ? " · OC " + esc(o.oc) : ""}</span>
            </span>
          </label>
          <span class="badge ${stBadge[st] || "muted"}">${esc(stLabel[st] || st)}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:.55rem;flex-wrap:wrap">
          <button type="button" class="btn sm" data-ordem-id="${esc(o.id)}">Ver</button>
          <button type="button" class="btn sm" data-editar-ordem="${esc(o.id)}">Editar</button>
        </div>
      </div>`;
    });
  }
  return html;
}

function renderFormOrdem() {
  const isEdit = aplicacaoView === "editar" && aplicacaoId;
  const o = isEdit ? (state.ordensCampo || []).find(x => x.id === aplicacaoId) : null;
  const tipoDefault = (aplicacaoFiltro && aplicacaoFiltro !== "todos") ? aplicacaoFiltro : "dessecacao-pre-plantio";
  const base = o || {
    titulo: "",
    tipo: tipoDefault,
    data: hojeISO(),
    status: "aberta",
    talhaoIds: [],
    produtos: [{ nome: "", doseHa: "", unidade: "L" }],
    obs: "",
    oc: ""
  };

  let html = headerBar(isEdit ? "Editar ordem" : "Nova ordem", "Preencha e selecione os talhões");
  html += `<button type="button" class="btn sm" id="btn-voltar-aplicacao" style="margin-bottom:.7rem">← Voltar</button>`;

  html += `<div class="card">
    <div class="field"><label>Tipo de aplicação</label>
      <select id="ord-tipo">${TIPOS_APLICACAO.map(t =>
        `<option value="${t.id}" ${base.tipo === t.id ? "selected" : ""}>${esc(t.label)}</option>`
      ).join("")}</select></div>
    <div class="field"><label>Título (opcional)</label>
      <input id="ord-titulo" value="${esc(base.titulo || "")}" placeholder="Ex: OC 406 — Sede"/></div>
    <div class="field"><label>OC interna</label>
      <input id="ord-oc" value="${esc(base.oc || "")}" placeholder="Ex: 406"/></div>
    <div class="field"><label>Data da ordem (agrônomo)</label>
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
  html += `<p class="sec">Produtos e dose/ha</p>
  <div class="card" id="ord-produtos">`;
  (base.produtos && base.produtos.length ? base.produtos : [{ nome: "", doseHa: "", unidade: "L" }]).forEach((p) => {
    html += `<div class="ord-prod-linha" style="display:grid;grid-template-columns:1fr 72px 64px;gap:6px;margin-bottom:8px">
      <input class="ord-prod-nome" placeholder="Produto" value="${esc(p.nome || "")}"/>
      <input class="ord-prod-dose" type="number" step="0.01" placeholder="Dose" value="${esc(p.doseHa != null ? p.doseHa : (p.dose || ""))}"/>
      <select class="ord-prod-un">
        <option value="L" ${(p.unidade || "L") === "L" ? "selected" : ""}>L</option>
        <option value="kg" ${(p.unidade || "") === "kg" ? "selected" : ""}>kg</option>
        <option value="g" ${(p.unidade || "") === "g" ? "selected" : ""}>g</option>
        <option value="ml" ${(p.unidade || "") === "ml" ? "selected" : ""}>ml</option>
      </select>
    </div>`;
  });
  html += `<button type="button" class="btn sm" id="ord-add-prod">+ Produto</button></div>`;

  // Talhões
  const selecionados = new Set(base.talhaoIds || []);
  html += `<p class="sec">Talhões</p><div class="card" style="max-height:240px;overflow:auto">`;
  (state.talhoes || []).forEach(t => {
    const checked = selecionados.has(t.id) ? "checked" : "";
    html += `<label style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:.9rem">
      <input type="checkbox" class="ord-talhao" value="${esc(t.id)}" ${checked}/>
      <span style="flex:1">${esc(t.nome || t.codigo)} <small class="muted">(${n(t.area, 1)} ha)</small></span>
    </label>`;
  });
  html += `</div>`;

  html += `<div class="card" id="ord-calculo" style="margin-top:.6rem">
    <p class="card-title">Quantidade necessária</p>
    <div class="muted" id="ord-calculo-txt">Selecione talhões e doses.</div>
  </div>`;

  html += `<div class="field"><label>Observações</label>
    <textarea id="ord-obs" rows="2">${esc(base.obs || "")}</textarea></div>`;

  html += `<button type="button" class="btn primary block" id="ord-salvar" style="margin-top:.8rem">${isEdit ? "Salvar alterações" : "Salvar ordem"}</button>`;
  if (isEdit) {
    html += `<button type="button" class="btn block" id="ord-executar" style="margin-top:.4rem">Marcar como executado</button>`;
  }

  return html;
}

function renderDetalheOrdem(id) {
  const o = (state.ordensCampo || []).find(x => x.id === id);
  if (!o) {
    aplicacaoView = "tipo";
    aplicacaoId = null;
    return window.CampoGestorTelas.aplicacao();
  }

  let html = headerBar(o.titulo || labelTipoAplicacao(o.tipo), "Detalhe da ordem");
  html += `<button type="button" class="btn sm" id="btn-voltar-aplicacao" style="margin-bottom:.7rem">← Voltar</button>`;

  const stLabel = { aberta: "Aberta", hoje: "Para hoje", executado: "Executado", cancelado: "Cancelado" };
  html += `<div class="card">
    <p class="card-title">${esc(labelTipoAplicacao(o.tipo))}</p>
    <p class="muted">${o.titulo ? esc(o.titulo) + " · " : ""}${o.oc ? "OC " + esc(o.oc) + " · " : ""}Data ordem: ${esc(o.data ? o.data.split("-").reverse().join("/") : "—")}</p>
    <p class="muted">Status: <b>${esc(stLabel[o.status] || o.status)}</b></p>
    ${o.obs ? `<p class="muted" style="margin-top:.35rem">${esc(o.obs)}</p>` : ""}
  </div>`;

  const talhoesSel = (state.talhoes || []).filter(t => (o.talhaoIds || []).includes(t.id));
  const areaTotal = talhoesSel.reduce((s, t) => s + (Number(t.area) || 0), 0);

  html += `<p class="sec">Produtos</p><div class="card">`;
  if (!(o.produtos || []).length) {
    html += `<p class="muted">Nenhum produto.</p>`;
  } else {
    html += `<ul class="safra-insumos">`;
    (o.produtos || []).forEach(p => {
      const dose = Number(p.doseHa != null ? p.doseHa : p.dose) || 0;
      const un = p.unidade || "L";
      const qtd = p.quantidade != null ? Number(p.quantidade) : dose * areaTotal;
      html += `<li><b>${esc(p.nome)}</b><span>${dose} ${un}/ha → <b>${n(qtd, 2)} ${un}</b></span></li>`;
    });
    html += `</ul>
    <p class="muted" style="margin-top:.4rem">Área: ${n(areaTotal, 2)} ha</p>`;
  }
  html += `</div>`;

  html += `<p class="sec">Talhões (${talhoesSel.length})</p><div class="card">`;
  if (!talhoesSel.length) {
    html += `<p class="muted">Nenhum talhão vinculado.</p>`;
  } else {
    talhoesSel.forEach(t => {
      html += `<div style="padding:6px 0;border-bottom:1px solid rgba(0,0,0,.06)">
        <b>${esc(t.nome || t.codigo)}</b>
        <span class="muted"> · ${n(t.area, 2)} ha</span>
      </div>`;
    });
  }
  html += `</div>`;

  html += `<div style="display:flex;gap:8px;margin-top:.8rem;flex-wrap:wrap">
    <button type="button" class="btn" id="btn-editar-ordem">Editar</button>
    ${o.status !== "executado" ? `<button type="button" class="btn primary" id="ord-executar">Marcar executado</button>` : ""}
  </div>`;

  return html;
}

function calcularProdutosOrdem(produtos, talhaoIds) {
  const talhoes = (state.talhoes || []).filter(t => (talhaoIds || []).includes(t.id));
  const area = talhoes.reduce((s, t) => s + (Number(t.area) || 0), 0);
  return (produtos || []).map(p => {
    const dose = Number(p.doseHa != null ? p.doseHa : p.dose) || 0;
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
