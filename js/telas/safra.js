/* Tela: safra. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.safra = function() {
  let html = "";
    if(!state.safraStatus) state.safraStatus={};
    if(!state.safraPlantio) state.safraPlantio={};
    const stKey = (sec, i) => sec+"-"+i;
    const getSt = (sec, i) => (state.safraStatus[stKey(sec,i)]||{}).status || "pendente";
    const getStDate = (sec, i) => (state.safraStatus[stKey(sec,i)]||{}).data || "";
    const stLabel = {pendente:"Pendente", andamento:"Em andamento", concluido:"Concluído"};
    const stBadge = {pendente:"muted", andamento:"warn", concluido:"ok"};
    const matchFiltro = (sec, i) => safraFiltro==="todos" || getSt(sec,i)===safraFiltro;
    const countSt = (sec, total) => {
      let c=0; for(let i=0;i<total;i++) if(getSt(sec,i)==="concluido") c++; return c;
    };
    const nCor = SAFRA.corretivo.length, nFer = SAFRA.fertilizante.length, nPla = SAFRA.plantio.length, nSul = SAFRA.sulco.length;
    html +=headerBar("Caderno de campo","Safra 2026/27");
    {
      const j=janelaMapa();
      const st=statusJanela(hojeISO());
      const fmt=iso=>(iso||"").split("-").reverse().join("/");
      html +=`<div class="card safra-card">
        <p class="card-title">Janela oficial de plantio</p>
        <p><span class="badge ${st.cls}">${esc(st.label)}</span></p>
        <div class="safra-timeline">
          <div><b>${fmt(j.vazioIni)} → ${fmt(j.vazioFim)}</b><small>Vazio sanitário</small></div>
          <div><b>${fmt(j.semeaduraIni)} → ${fmt(j.semeaduraFim)}</b><small>Semeadura permitida</small></div>
        </div>
        <p class="muted" style="margin-top:.55rem;font-size:.68rem">${esc(j.portaria||"")}</p>
        <div class="safra-actions">
          <button type="button" class="btn sm" data-edit="janela">Editar janela</button>
          <a class="btn sm" href="${esc(j.fonte)}" target="_blank" rel="noopener">Consulta oficial</a>
        </div>
      </div>`;
    }
    html +=`<div class="card"><p class="card-title">Progresso da safra</p>
      <p class="muted">Corretivo ${countSt("cor",nCor)}/${nCor} · Fertilizante ${countSt("fer",nFer)}/${nFer} · Plantio ${countSt("pla",nPla)}/${nPla} · Sulco ${countSt("sul",nSul)}/${nSul}</p></div>`;
    html +=`<div class="chips">
      <button type="button" class="chip ${safraFiltro==="todos"?"on":""}" data-safra-filtro="todos">Todos</button>
      <button type="button" class="chip ${safraFiltro==="pendente"?"on":""}" data-safra-filtro="pendente">Pendente</button>
      <button type="button" class="chip ${safraFiltro==="andamento"?"on":""}" data-safra-filtro="andamento">Em andamento</button>
      <button type="button" class="chip ${safraFiltro==="concluido"?"on":""}" data-safra-filtro="concluido">Concluído</button>
    </div>`;
    // Corretivo
    html +=`<p class="sec">Corretivo (calcário)</p>`;
    SAFRA.corretivo.forEach((r,i)=>{
      if(!matchFiltro("cor",i)) return;
      const st=getSt("cor",i);
      html +=`<div class="card safra-item"><div class="safra-item-top">
        <p class="card-title">${esc(r.talhoes)}</p>
        <button type="button" class="badge ${stBadge[st]}" data-safra-st="cor" data-i="${i}">${stLabel[st]}</button>
      </div>
        <p class="muted">${n(r.ha,2)} ha · ${esc(r.cultivar)}</p>
        <p class="muted">${esc(r.dose)} · ${esc(r.volume)}</p>
        ${st==="concluido"&&getStDate("cor",i)?`<p class="muted">Concluído em ${getStDate("cor",i).split("-").reverse().join("/")}</p>`:""}
      </div>`;
    });
    // Fertilizante
    html +=`<p class="sec">Fertilizante</p>`;
    SAFRA.fertilizante.forEach((g,i)=>{
      if(!matchFiltro("fer",i)) return;
      const st=getSt("fer",i);
      html +=`<div class="card safra-item"><div class="safra-item-top">
        <p class="card-title">${esc(g.talhoes)}</p>
        <button type="button" class="badge ${stBadge[st]}" data-safra-st="fer" data-i="${i}">${stLabel[st]}</button>
      </div>
        <p class="muted">${n(g.ha,2)} ha · ${esc(g.cultivar)}</p>
        <ul class="safra-insumos">`;
      g.itens.forEach(it=>{ html +=`<li><b>${esc(it.insumo)}</b><span>${esc(it.dose)} · ${esc(it.volume)}</span></li>`; });
      html +=`</ul>
        ${st==="concluido"&&getStDate("fer",i)?`<p class="muted">Concluído em ${getStDate("fer",i).split("-").reverse().join("/")}</p>`:""}
      </div>`;
    });
    // Plantio — um card por talhão
    html +=`<p class="sec">Plantio soja</p>`;
    (state.talhoes||[]).forEach((t,i)=>{
      if(!matchFiltro("pla",i)) return;
      const st=getSt("pla",i);
      const ov = (state.safraPlantio||{})[t.id] || {};
      const seeds = (ov.sementes && ov.sementes.length) ? ov.sementes : [{cultivar: ov.cultivar || t.variedade || "—", qtd:"", un:"kg"}];
      html +=`<div class="card safra-item"><div class="safra-item-top">
        <p class="card-title">${esc(t.nome||t.codigo)}</p>
        <div class="safra-item-actions">
          <button type="button" class="badge ${stBadge[st]}" data-safra-st="pla" data-i="${i}">${stLabel[st]}</button>
          <button type="button" class="btn sm" data-edit-plantio="${t.id}">✎</button>
        </div>
      </div>
        <p class="muted">${n(t.area,2)} ha · ${t.fazenda==="campo-alegre"?"Campo Alegre":"Santa Rita"}</p>
        ${seeds.map(s=>`<p class="muted">${esc(s.cultivar||"—")}${s.qtd?` · ${esc(s.qtd)} ${esc(s.un||"")}`:""}</p>`).join("")}
        ${st==="concluido"&&getStDate("pla",i)?`<p class="muted">Concluído em ${getStDate("pla",i).split("-").reverse().join("/")}</p>`:""}
      </div>`;
    });
    // Sulco
    html +=`<p class="sec">Manejo de sulco (todos os talhões)</p>`;
    SAFRA.sulco.forEach((s,i)=>{
      if(!matchFiltro("sul",i)) return;
      const st=getSt("sul",i);
      html +=`<div class="card safra-item"><div class="safra-item-top">
        <p class="card-title">${esc(s.insumo)}</p>
        <button type="button" class="badge ${stBadge[st]}" data-safra-st="sul" data-i="${i}">${stLabel[st]}</button>
      </div>
        <p class="muted">${esc(s.tipo)} · ${esc(s.fabricante)} · ${esc(s.dose)}</p>
        ${st==="concluido"&&getStDate("sul",i)?`<p class="muted">Concluído em ${getStDate("sul",i).split("-").reverse().join("/")}</p>`:""}
      </div>`;
    });
    // Talhões
    html +=`<p class="sec">Talhões cadastrados</p><ul class="list card" style="padding:.25rem 1rem">`;
    state.talhoes.forEach(t=>{
      const tag=t.fazenda==="campo-alegre"?"Campo Alegre":"Santa Rita";
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(t.nome||t.codigo)}</div><div class="muted">${ha(t.area)} · ${tag}</div></div></li>`;
    });
    html +=`</ul>`;
  return html;
};
