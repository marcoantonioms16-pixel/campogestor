/* Tela: hoje — dashboard principal. */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.hoje = function() {
  const hoje = hojeISO();
  const p = perfilAtual();
  const ativos = (state.pessoas||[]).filter(x=>x.tipo!=="encerrado");
  const maquinas = state.maquinas || [];
  const dieselInv = dieselInventario();
  const dieselLitros = dieselInv ? dieselInv.total : Number(state.diesel?.litros)||0;
  const dieselCap = Number(state.diesel?.capacidade)||1;
  const dieselPct = Math.max(0, Math.min(100, Math.round(dieselLitros/dieselCap*100)));
  const chuvas = (state.chuva||[]).slice().sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  const ultima = chuvas[0];
  const area = Number(state.farm?.areaTotal)||0;
  const talhoes = state.talhoes?.length||0;
  const v = versiculoDoDia(hoje);
  const rotina = rotinaHoje(hoje);
  const feitas = rotina.filter(r=>state.rotinaFeita?.[r.id]===hoje).length;
  const pct = rotina.length ? Math.round(feitas/rotina.length*100) : 0;
  const niverHoje = ativos.filter(x=>aniversarioHoje(x.nascimento,hoje));
  const operando = maquinas.filter(x=>x.status==="operando").length;
  const tarefasMarcos = p.id === "marcos";
  const tarefasVisiveis = tarefasMarcos ? rotina.slice(0,5) : [];
  const atrasadosExt = (state.extintores||[]).filter(x=>x.validade && x.validade < hoje).length;
  const maquinasManut = maquinas.filter(x=>x.status==="manutencao").length;
  const alertas = [];
  if(maquinasManut) alertas.push({ic:"🚜",t:`${maquinasManut} máquina${maquinasManut>1?"s":""} em manutenção`,sub:"Confira a frota"});
  if(dieselPct < 25) alertas.push({ic:"⛽",t:"Diesel abaixo de 25%",sub:`${n(dieselLitros,0)} L disponíveis`});
  if(atrasadosExt) alertas.push({ic:"🧯",t:`${atrasadosExt} extintor${atrasadosExt>1?"es":""} com validade vencida`,sub:"Verifique a manutenção"});

  let html = headerBar("CAMPOGESTOR", `Bem-vindo, ${esc(p.nome)}`, `<div class="farm-context">${esc(state.farm.nome)}</div>`);

  html += `<section class="today-hero">
    <div><span class="today-eyebrow">FAZENDA SANTA RITA</span><h2>Visão de hoje</h2><p>${esc(dataLonga(hoje))} · ${esc(state.farm.municipio||"")}</p></div>
    <div class="today-sync"><span class="cloud-dot ${cloudStatus}"></span>${esc(perfilCloudResumo())}</div>
  </section>`;

  /* O versículo sobe para abrir a página antes dos indicadores/chips. */
  html += `<section class="today-quote today-quote-top"><span>“</span><div><b>${esc(v[0])}</b><small>${esc(v[1])}</small></div></section>`;

  html += `<div class="today-metrics">
    <button type="button" class="today-metric" data-hoje="equipe"><span class="metric-symbol">👥</span><strong>${ativos.length}</strong><small>Pessoas ativas</small></button>
    <button type="button" class="today-metric" data-hoje="area"><span class="metric-symbol">🌱</span><strong>${n(area,0)} ha</strong><small>Área cadastrada</small></button>
    <button type="button" class="today-metric" data-hoje="diesel"><span class="metric-symbol">⛽</span><strong>${n(dieselLitros,0)} L</strong><small>Diesel · ${dieselPct}%</small></button>
    <button type="button" class="today-metric" data-hoje="chuva"><span class="metric-symbol">🌧</span><strong>${ultima?n(ultima.mm,1)+" mm":"—"}</strong><small>${ultima?(diasAtras(ultima.data,hoje)===0?"Hoje":"há "+diasAtras(ultima.data,hoje)+" dias"):"Chuva registrada"}</small></button>
  </div>`;

  /* Substitui "Fazenda em movimento" por previsão real, carregada da API pública. */
  html += `<section class="today-weather" id="today-weather">
    <div class="today-weather-head"><div><span class="today-eyebrow dark">CLIMA</span><h3>Previsão de chuva</h3><p>Próximos dias · ${esc(state.farm.municipio||"local da fazenda")}</p></div><span class="weather-live">● Atualização automática</span></div>
    <div class="weather-days" id="weather-days"><div class="weather-loading"><span class="weather-loader"></span><span>Buscando previsão…</span></div></div>
  </section>`;

  html += `<section class="today-panel today-summary"><div class="panel-title"><h3>Resumo da operação</h3><span>Agora</span></div><div class="today-summary-grid">
    <div><strong>${operando}</strong><small>Máquinas operando</small></div>
    <div><strong>${maquinas.length}</strong><small>Total de máquinas</small></div>
    <div><strong>${talhoes}</strong><small>Talhões</small></div>
    <div><strong>${pct}%</strong><small>Rotina concluída</small></div>
  </div></section>`;

  if(alertas.length){
    html += `<section class="today-panel today-alerts"><div class="panel-title"><h3>⚠ Pontos de atenção</h3><span>${alertas.length} item${alertas.length>1?"s":""}</span></div><div class="today-rows">${alertas.map(a=>`<div class="today-row"><span class="row-avatar">${a.ic}</span><div><b>${esc(a.t)}</b><small>${esc(a.sub)}</small></div></div>`).join("")}</div></section>`;
  }

  if(tarefasMarcos){
    html += `<section class="today-panel today-tasks"><div class="panel-title"><div><h3>✓ Tarefas de hoje</h3><span class="today-task-progress">${feitas}/${rotina.length} concluídas · ${pct}%</span></div><button type="button" class="today-link" data-hoje="tarefas">Ver todas ›</button></div>
      <div class="task-list">${tarefasVisiveis.map(r=>{const done=state.rotinaFeita?.[r.id]===hoje; return `<label class="task-item ${done?"done":""}"><input type="checkbox" data-rotina="${esc(r.id)}" ${done?"checked":""}/><span class="task-check"></span><span class="task-copy"><b>${esc(r.titulo)}</b><small>${esc(r.grupo)}</small></span></label>`;}).join("")}</div>
      ${rotina.length>tarefasVisiveis.length?`<div class="task-more">+ ${rotina.length-tarefasVisiveis.length} tarefa${rotina.length-tarefasVisiveis.length>1?"s":""} na rotina de hoje</div>`:""}
    </section>`;
  }

  if(niverHoje.length) html += `<section class="today-panel today-birthday"><div class="panel-title"><h3>🎂 Aniversário hoje</h3><span>Equipe</span></div><div class="today-rows">${niverHoje.map(x=>`<div class="today-row"><span class="row-avatar">${esc((x.nome||"?").slice(0,1).toUpperCase())}</span><div><b>${esc(x.nome)}</b><small>${esc(x.funcao||"Colaborador")} · completa ${idadeEm(x.nascimento,hoje)+1} anos</small></div></div>`).join("")}</div></section>`;

  return html;
};
