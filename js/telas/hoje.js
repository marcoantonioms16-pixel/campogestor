/* Tela: hoje — dashboard principal. */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.hoje = function() {
  const hoje = hojeISO();
  const p = perfilAtual();
  const ativos = (state.pessoas||[]).filter(x=>x.tipo!=="encerrado");
  const dieselInv = dieselInventario();
  const dieselLitros = dieselInv ? dieselInv.total : Number(state.diesel?.litros)||0;
  const dieselCap = Number(state.diesel?.capacidade)||1;
  const dieselPct = Math.max(0, Math.min(100, Math.round(dieselLitros/dieselCap*100)));
  const chuvas = (state.chuva||[]).slice().sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  const ultima = chuvas[0];
  const area = Number(state.farm?.areaTotal)||0;
  const v = versiculoDoDia(hoje);
  const rotina = rotinaHoje(hoje);
  const feitas = rotina.filter(r=>state.rotinaFeita?.[r.id]===hoje).length;
  const pct = rotina.length ? Math.round(feitas/rotina.length*100) : 0;
  const niverHoje = ativos.filter(x=>aniversarioHoje(x.nascimento,hoje));
  const tarefasMarcos = p.id === "marcos";
  const tarefasVisiveis = tarefasMarcos ? rotina.slice(0,5) : [];

  let html = headerBar("CAMPOGESTOR", `Bem-vindo, ${esc(p.nome)}`, `<div class="farm-context">${esc(state.farm?.nome||"Fazenda Santa Rita")}</div>`);

  html += `<section class="today-hero">
    <div><span class="today-eyebrow">FAZENDA SANTA RITA</span><h2>Visão de hoje</h2><p>${esc(dataLonga(hoje))} · ${esc(state.farm?.municipio||"")}</p></div>
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
    <div class="today-weather-head"><div><span class="today-eyebrow dark">CLIMA</span><h3>Previsão de chuva</h3><p>Próximos dias · ${esc(state.farm?.municipio||"local da fazenda")}</p></div><span class="weather-live">● Atualização automática</span></div>
    <div class="weather-days" id="weather-days"><div class="weather-loading"><span class="weather-loader"></span><span>Buscando previsão…</span></div></div>
  </section>`;

  if(tarefasMarcos){
    const iconeGrupo = (g, titulo)=>{
      const t = String(titulo||"").toLowerCase();
      const gg = String(g||"").toLowerCase();
      if(/diesel|óleo|oleo|abastec/.test(t)) return "⛽";
      if(/epi|extintor|segurança|seguranca|incêndio|incendio/.test(t)) return "🧯";
      if(/diarista|equipe|assinatura|holerite|contrata/.test(t)) return "👥";
      if(/material|nota|nf|documento|pesagem|embalagem/.test(t)) return "📦";
      if(/frota|oficina|manuten/.test(t)) return "🚜";
      if(/folga/.test(t) || /folga/.test(gg)) return "📅";
      if(/segunda/.test(gg)) return "📌";
      if(/sexta/.test(gg)) return "📌";
      if(/mês|mes|dia 30|final/.test(gg)) return "🗓";
      if(/diário|diario/.test(gg)) return "📋";
      return "✓";
    };
    const chipGrupo = (g)=>{
      const gg = String(g||"");
      if(/diário|diario/i.test(gg)) return {cls:"task-chip-diario", label:"Diário"};
      if(/segunda/i.test(gg)) return {cls:"task-chip-semana", label:"Segunda"};
      if(/sexta/i.test(gg)) return {cls:"task-chip-semana", label:"Sexta"};
      if(/folga/i.test(gg)) return {cls:"task-chip-mes", label:"Folgas"};
      if(/mês|mes|dia 30|final|início/i.test(gg)) return {cls:"task-chip-mes", label: gg.slice(0,18)};
      if(/quando/i.test(gg)) return {cls:"task-chip-evento", label:"Quando precisar"};
      return {cls:"task-chip-evento", label: gg || "Rotina"};
    };
    html += `<section class="today-panel today-tasks">
      <div class="panel-title">
        <div>
          <h3>Tarefas de hoje</h3>
          <span class="today-task-progress">${feitas}/${rotina.length} concluídas · ${pct}%</span>
        </div>
        <button type="button" class="today-link" data-hoje="tarefas">Ver todas ›</button>
      </div>
      <div class="task-progress-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <div class="task-list task-list-cards">${tarefasVisiveis.map((r, idx)=>{
        const done = state.rotinaFeita?.[r.id]===hoje;
        const chip = chipGrupo(r.grupo);
        const icon = iconeGrupo(r.grupo, r.titulo);
        // "próxima" = primeira pendente da lista visível
        const isNext = !done && tarefasVisiveis.findIndex(x=>state.rotinaFeita?.[x.id]!==hoje)===idx;
        return `<label class="task-item task-card ${done?"done":""} ${isNext?"task-next":""}">
          <input type="checkbox" data-rotina="${esc(r.id)}" ${done?"checked":""}/>
          <span class="task-icon" aria-hidden="true">${icon}</span>
          <span class="task-copy">
            <b>${esc(r.titulo)}</b>
            <span class="task-meta"><span class="task-chip ${chip.cls}">${esc(chip.label)}</span>${done?`<span class="task-done-label">Concluída</span>`:(isNext?`<span class="task-next-label">Próxima</span>`:"")}</span>
          </span>
          <span class="task-check"></span>
        </label>`;
      }).join("")}</div>
      ${rotina.length>tarefasVisiveis.length?`<div class="task-more">+ ${rotina.length-tarefasVisiveis.length} tarefa${rotina.length-tarefasVisiveis.length>1?"s":""} na rotina de hoje</div>`:""}
    </section>`;
  }

  if(niverHoje.length) html += `<section class="today-panel today-birthday"><div class="panel-title"><h3>🎂 Aniversário hoje</h3><span>Equipe</span></div><div class="today-rows">${niverHoje.map(x=>`<div class="today-row"><span class="row-avatar">${esc((x.nome||"?").slice(0,1).toUpperCase())}</span><div><b>${esc(x.nome)}</b><small>${esc(x.funcao||"Colaborador")} · completa ${idadeEm(x.nascimento,hoje)+1} anos</small></div></div>`).join("")}</div></section>`;

  return html;
};
