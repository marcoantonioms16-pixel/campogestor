/* Tela: safra. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.safra = function() {
  let html = "";
    if(!state.safraStatus) state.safraStatus={};
    if(!state.safraPlantio) state.safraPlantio={}; // overrides: {idx: {cultivar, sem_m, sem_ha}}
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
    html +=headerBar("Caderno de campo","Safra 2026/27",``);
    html +=`<p class="sub">Programação · Grupo Segredo · Fazenda Santa Rita</p>`;
    {
      const j=janelaMapa();
      const st=statusJanela(hojeISO());
      const fmt=iso=>(iso||"").split("-").reverse().join("/");
      html +=`<div class="card">
        <p class="card-title">Janela oficial de plantio · Soja Goiás</p>
        <p><span class="badge ${st.cls}">${esc(st.label)}</span></p>
        <p style="margin-top:.45rem">Semeadura: <b>${fmt(j.semeaduraIni)}</b> a <b>${fmt(j.semeaduraFim)}</b></p>
        <p class="muted">Vazio sanitário: ${fmt(j.vazioIni)} a ${fmt(j.vazioFim)}</p>
        <p class="muted" style="margin-top:.35rem">${esc(j.portaria)}</p>
        <p class="muted">Fonte gravada no app (não puxa internet sozinha). Se o MAPA retificar, edite as datas.</p>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.6rem">
          <button class="btn sm" data-edit="janela">Editar janela</button>
          <a class="btn sm" href="${esc(j.fonte)}" target="_blank" rel="noopener">Agrodefesa / consulta</a>
        </div>
      </div>`;
    }
    // Progresso geral
    html +=`<div class="card"><p class="card-title">Progresso da safra</p>
      <p class="muted">Corretivo ${countSt("cor",nCor)}/${nCor} · Fertilizante ${countSt("fer",nFer)}/${nFer} · Plantio ${countSt("pla",nPla)}/${nPla} · Sulco ${countSt("sul",nSul)}/${nSul}</p></div>`;
    // Filtro
    html +=`<div class="chips">
      <button class="chip ${safraFiltro==="todos"?"on":""}" data-safra-filtro="todos">Todos</button>
      <button class="chip ${safraFiltro==="pendente"?"on":""}" data-safra-filtro="pendente">Pendente</button>
      <button class="chip ${safraFiltro==="andamento"?"on":""}" data-safra-filtro="andamento">Em andamento</button>
      <button class="chip ${safraFiltro==="concluido"?"on":""}" data-safra-filtro="concluido">Concluído</button>
    </div>`;
    // Corretivo
    html +=`<p class="sec">Corretivo (calcário)</p>`;
    SAFRA.corretivo.forEach((r,i)=>{
      if(!matchFiltro("cor",i)) return;
      const st=getSt("cor",i);
      html +=`<div class="card"><div class="row">
        <div style="flex:1"><p class="card-title" style="margin:0">${esc(r.talhoes)}</p>
          <p class="muted">${n(r.ha,2)} ha · ${esc(r.cultivar)} · ${esc(r.dose)} · ${esc(r.volume)}</p>
          ${st==="concluido"&&getStDate("cor",i)?`<p class="muted">Concluído em ${getStDate("cor",i).split("-").reverse().join("/")}</p>`:""}
        </div>
        <button class="badge ${stBadge[st]}" data-safra-st="cor" data-i="${i}" style="border:none;cursor:pointer">${stLabel[st]}</button>
      </div></div>`;
    });
    // Fertilizante
    html +=`<p class="sec">Fertilizante</p>`;
    SAFRA.fertilizante.forEach((g,i)=>{
      if(!matchFiltro("fer",i)) return;
      const st=getSt("fer",i);
      html +=`<div class="card"><div class="row" style="align-items:flex-start">
        <div style="flex:1"><p class="card-title" style="margin:0">${esc(g.talhoes)} · ${n(g.ha,2)} ha · ${esc(g.cultivar)}</p>
          <ul class="list">`;
      g.itens.forEach(it=>{ html +=`<li style="padding:.35rem 0"><div style="flex:1"><div style="font-weight:500">${esc(it.insumo)}</div><div class="muted">${esc(it.dose)}</div></div><div class="muted">${esc(it.volume)}</div></li>`; });
      html +=`</ul>
          ${st==="concluido"&&getStDate("fer",i)?`<p class="muted">Concluído em ${getStDate("fer",i).split("-").reverse().join("/")}</p>`:""}
        </div>
        <button class="badge ${stBadge[st]}" data-safra-st="fer" data-i="${i}" style="border:none;cursor:pointer;margin-top:.2rem">${stLabel[st]}</button>
      </div></div>`;
    });
    // Plantio
    html +=`<p class="sec">Plantio soja</p>`;
    SAFRA.plantio.forEach((r,i)=>{
      if(!matchFiltro("pla",i)) return;
      const st=getSt("pla",i);
      const ov = (state.safraPlantio||{})[i] || {};
      const cult = ov.cultivar || r.cultivar;
      const semM = ov.sem_m || r.sem_m;
      const semHa = ov.sem_ha || r.sem_ha;
      html +=`<div class="card"><div class="row" style="align-items:flex-start">
        <div style="flex:1"><p class="card-title" style="margin:0">${esc(r.talhoes)} · ${n(r.ha,2)} ha</p>
          <p class="muted">${esc(cult)} · ${esc(semM)} sem/m · ${esc(r.espac)} · ${esc(semHa)} sem/ha</p>
          ${st==="concluido"&&getStDate("pla",i)?`<p class="muted">Concluído em ${getStDate("pla",i).split("-").reverse().join("/")}</p>`:""}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.35rem">
          <button class="badge ${stBadge[st]}" data-safra-st="pla" data-i="${i}" style="border:none;cursor:pointer">${stLabel[st]}</button>
          <button class="btn sm" data-edit-plantio="${i}">✎</button>
        </div>
      </div></div>`;
    });
    // Sulco
    html +=`<p class="sec">Manejo de sulco (todos os talhões)</p>`;
    SAFRA.sulco.forEach((s,i)=>{
      if(!matchFiltro("sul",i)) return;
      const st=getSt("sul",i);
      html +=`<div class="card"><div class="row">
        <div style="flex:1"><p style="font-weight:500;margin:0">${esc(s.insumo)}</p>
          <p class="muted">${esc(s.tipo)} · ${esc(s.fabricante)} · ${esc(s.dose)}</p>
          ${st==="concluido"&&getStDate("sul",i)?`<p class="muted">Concluído em ${getStDate("sul",i).split("-").reverse().join("/")}</p>`:""}
        </div>
        <button class="badge ${stBadge[st]}" data-safra-st="sul" data-i="${i}" style="border:none;cursor:pointer">${stLabel[st]}</button>
      </div></div>`;
    });
    // Talhões
    html +=`<p class="sec">Talhões cadastrados</p><ul class="list card" style="padding:.25rem 1rem">`;
    state.talhoes.forEach(t=>{
      const tag=t.fazenda==="campo-alegre"?"C. Alegre":"Sta Rita";
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(t.nome||t.codigo)}</div><div class="muted">${ha(t.area)} · ${esc(t.variedade||"")} · ${tag}</div></div></li>`;
    });
    html +=`</ul>`;
  return html;
};
