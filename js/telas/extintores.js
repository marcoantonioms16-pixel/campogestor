/* Tela: extintores. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.extintores = function() {
  let html = "";
    if(!state.extintores) state.extintores=[];
    const hoje=hojeISO();
    const stOf=e=>{
      if((e.obs||"").toLowerCase().includes("vazio")) return {id:"warn",label:"Vazio"};
      const v=e.validade||"";
      if(!v) return {id:"muted",label:"Sem data"};
      if(v<hoje) return {id:"danger",label:"Vencido"};
      const rest=Math.round((new Date(v+"T12:00:00")-new Date(hoje+"T12:00:00"))/86400000);
      if(rest<=30) return {id:"warn",label:"Vence em "+rest+"d"};
      return {id:"ok",label:"Em dia"};
    };
    const lista=state.extintores.filter(e=>catExt==="todos"||e.grupo===catExt)
      .slice().sort((a,b)=>String(a.local||a.maquina||"").localeCompare(b.local||b.maquina||"","pt-BR"));
    html +=headerBar("Prevenção","Extintores");
    html +=`<div class="page-actions">
      <button type="button" class="btn sm" id="btn-xls-ext">Excel</button>
      <button type="button" class="btn primary sm" data-new="extintor">+ Novo</button>
    </div>`;
    html +=`<div class="chips" style="justify-content:center">
      <button type="button" class="chip ${catExt==="todos"?"on":""}" data-cat-ext="todos">Todos</button>
      <button type="button" class="chip ${catExt==="santa-rita"?"on":""}" data-cat-ext="santa-rita">Santa Rita</button>
      <button type="button" class="chip ${catExt==="maquinario"?"on":""}" data-cat-ext="maquinario">Maquinário</button>
    </div>`;
    html +=`<p class="sub">${lista.length} aparelho(s)</p>`;
    html +=`<ul class="list card" style="padding:.25rem 1rem">`;
    if(!lista.length) html +=`<li class="muted">Nenhum extintor neste filtro.</li>`;
    lista.forEach(e=>{
      const st=stOf(e);
      const onde=e.grupo==="maquinario"?(e.maquina||e.local||"")+(e.nrInterno?" · "+e.nrInterno:""):(e.local||"");
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(onde)}</div>
        <div class="muted">${esc(e.fazenda||"Santa Rita")} · ${esc(e.tipo||"")} · ${esc(e.carga||"")}${e.codigo?" · nº "+esc(e.codigo):""}</div>
        <div class="muted">Recarga ${e.recarga?e.recarga.split("-").reverse().join("/"):"—"} · Venc. ${e.validade?e.validade.split("-").reverse().join("/"):"—"}</div></div>
        <span class="badge ${st.id}">${st.label}</span>
        <button type="button" class="btn sm" data-edit="extintor" data-id="${e.id}">✎</button></li>`;
    });
    html +=`</ul>`;
  return html;
};
