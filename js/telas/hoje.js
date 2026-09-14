/* Tela: hoje — dashboard principal. Eventos continuam centralizados no app. */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.hoje = function() {
  const hoje = hojeISO();
  const p = perfilAtual();
  const ativos = state.pessoas.filter(x=>x.tipo!=="encerrado");
  const dieselInv = dieselInventario();
  const dieselLitros = dieselInv ? dieselInv.total : Number(state.diesel?.litros)||0;
  const dieselCap = Number(state.diesel?.capacidade)||1;
  const dieselPct = Math.max(0, Math.min(100, Math.round(dieselLitros/dieselCap*100)));
  const chuvas = (state.chuva||[]).slice().sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  const ultima = chuvas[0];
  const rotina = rotinaHoje(hoje);
  const feitas = rotina.filter(r=>state.rotinaFeita[r.id]===hoje).length;
  const pct = rotina.length ? Math.round(feitas/rotina.length*100) : 0;
  const niverHoje = ativos.filter(x=>aniversarioHoje(x.nascimento,hoje));
  const maquinas = state.maquinas || [];
  const operando = maquinas.filter(x=>x.status==="operando").length;
  const area = Number(state.farm?.areaTotal)||0;
  const talhoes = state.talhoes?.length||0;
  const v = versiculoDoDia(hoje);
  let html = headerBar("CAMPOGESTOR", `Bem-vindo, ${esc(p.nome)}`, `<div class="farm-context">${esc(state.farm.nome)}</div>`);

  html += `<section class="today-hero">
    <div><span class="today-eyebrow">FAZENDA SANTA RITA</span><h2>Visão de hoje</h2><p>${esc(dataLonga(hoje))} · ${esc(state.farm.municipio||"")}</p></div>
    <div class="today-sync"><span class="cloud-dot ${cloudStatus}"></span>${esc(perfilCloudResumo())}</div>
  </section>`;

  html += `<div class="today-metrics">
    <button class="today-metric" data-hoje="equipe"><span class="metric-symbol">👥</span><strong>${ativos.length}</strong><small>Pessoas</small></button>
    <button class="today-metric" data-hoje="area"><span class="metric-symbol">🌱</span><strong>${n(area,0)} ha</strong><small>Área plantada</small></button>
    <button class="today-metric" data-hoje="diesel"><span class="metric-symbol">⛽</span><strong>${n(dieselLitros,0)} L</strong><small>Diesel · ${dieselPct}%</small></button>
    <button class="today-metric" data-hoje="chuva"><span class="metric-symbol">🌧</span><strong>${ultima?n(ultima.mm,1)+" mm":"—"}</strong><small>${ultima?(diasAtras(ultima.data,hoje)===0?"Hoje":"há "+diasAtras(ultima.data,hoje)+" dias"):"Sem registro"}</small></button>
  </div>`;

  html += `<section class="today-feature">
    <div class="today-feature-top"><div><span class="today-eyebrow">OPERAÇÃO</span><h3>Fazenda em movimento</h3></div><span class="today-feature-badge">${operando}/${maquinas.length||0} máquinas</span></div>
    <div class="today-feature-grid"><div><strong>${n(area,0)} ha</strong><span>Área cadastrada</span></div><div><strong>${talhoes}</strong><span>Talhões</span></div><div><strong>${pct}%</strong><span>Rotina concluída</span></div></div>
    <button class="today-task" data-hoje="tarefas"><span class="ring" style="--p:${pct}"><span class="pct">${pct}%</span></span><span><b>Tarefas de hoje</b><small>${feitas} de ${rotina.length} concluídas · toque para abrir</small></span><span class="today-arrow">›</span></button>
  </section>`;

  if(niverHoje.length) html += `<section class="today-panel today-birthday"><div class="panel-title"><h3>🎂 Aniversário hoje</h3><span>Avise o gerente</span></div><div class="today-rows">${niverHoje.map(x=>`<div class="today-row"><span class="row-avatar">${esc((x.nome||"?").slice(0,1).toUpperCase())}</span><div><b>${esc(x.nome)}</b><small>${esc(x.funcao||"Colaborador")} · completa ${idadeEm(x.nascimento,hoje)+1} anos</small></div></div>`).join("")}</div></section>`;

  html += `<section class="today-panel"><div class="panel-title"><h3>Atalhos rápidos</h3><span>CampoGestor</span></div><div class="quick-grid"><button data-go="frota">🚜<b>Frota</b><small>${maquinas.length} cadastradas</small></button><button data-go="estoque">📦<b>Estoque</b><small>${state.insumos?.length||0} itens</small></button><button data-go="pessoas">👥<b>Pessoas</b><small>${ativos.length} ativas</small></button><button data-go="safra">🌾<b>Safra</b><small>${esc(state.farm?.safra||"Atual")}</small></button></div></section>`;

  html += `<section class="today-quote"><span>“</span><div><b>${esc(v[0])}</b><small>${esc(v[1])}</small></div></section>`;
  return html;
};
