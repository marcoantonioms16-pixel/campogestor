/* Tela: estoque. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.estoque = function() {
  let html = "";
    const lista = state.insumos.filter(i=>{
      const q=(qInsumo||"").toLowerCase().trim();
      const blob=[i.nome,i.tecnico,i.tipoDef,i.codigo,i.categoria].map(x=>String(x||"").toLowerCase()).join(" ");
      const okQ = !q || blob.includes(q);
      const okC = catInsumo==="todos" || i.categoria===catInsumo;
      return okQ && okC;
    }).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    html +=headerBar(`Almoxarifado · ${state.insumos.length} itens`,"Estoque",`<button type="button" class="btn primary sm" data-new="insumo">+ Novo</button>`);
    html +=`<div style="padding:.25rem 1rem"><button type="button" class="btn block" data-new="saida">Lançamento de saída</button></div>`;
    html +=`<div class="search"><input id="q-insumo" placeholder="Pesquisar nome, ativo ou código..." value="${esc(qInsumo)}"/></div>`;
    html +=`<div class="chips"><button type="button" class="chip ${catInsumo==="todos"?"on":""}" data-cat="todos">Todos</button>`;
    CATS.forEach(c=>{ html +=`<button type="button" class="chip ${catInsumo===c?"on":""}" data-cat="${c}">${CAT[c]}</button>`; });
    html +=`</div>`;
    html +=`<ul class="list card" style="padding:.25rem 1rem">`;
    if(!lista.length) html +=`<li class="muted">Nenhum insumo encontrado.</li>`;
    lista.forEach(i=>{
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(i.nome)}</div>
        <div class="muted">${i.codigo?("Cód. "+esc(i.codigo)+" · "):""}${esc(i.tipoDef||CAT[i.categoria]||"")} · ${esc(i.tecnico||"—")}</div></div>
        <div style="text-align:right"><div style="font-weight:500">${n(i.quantidade,i.quantidade>=100?0:1)} ${esc(i.unidade)}</div></div>
        <button type="button" class="btn sm" data-edit="insumo" data-id="${i.id}">✎</button></li>`;
    });
    html +=`</ul>`;
    // Histórico entra / sai
    if(!state.entradas) state.entradas=[];
    const mov=[];
    (state.saidas||[]).forEach(s=>mov.push({data:s.data, sentido:"saiu", tipo:s.tipo, itens:s.itens, extra:[s.destino,s.responsavel].filter(Boolean).join(" · "), raw:s}));
    (state.entradas||[]).forEach(e=>mov.push({data:e.data, sentido:"entrou", tipo:e.tipo||"Entrada", itens:e.itens||[{nome:e.nome,qtd:e.qtd,un:e.un}], extra:e.obs||"", raw:e}));
    mov.sort((a,b)=>(b.data||"").localeCompare(a.data||""));
    const mesesMov=[...new Set(mov.map(s=>(s.data||"").slice(0,7)).filter(Boolean))];
    let listaMov=mov;
    if(qSaidaMes!=="todos") listaMov=mov.filter(s=>(s.data||"").startsWith(qSaidaMes));
    html +=`<p class="sec">Histórico de insumos</p>
      <div style="padding:0 1rem .4rem"><select id="sel-saida-mes">
        <option value="todos" ${qSaidaMes==="todos"?"selected":""}>Todas as datas</option>
        ${mesesMov.map(m=>`<option value="${m}" ${qSaidaMes===m?"selected":""}>${m.split("-").reverse().join("/")}</option>`).join("")}
      </select></div>`;
    if(!listaMov.length) html +=`<p class="muted" style="padding:0 1rem">Nenhuma entrada ou saída ainda.</p>`;
    else {
      html +=`<ul class="list card" style="padding:.25rem 1rem">`;
      listaMov.slice(0,40).forEach(s=>{
        const produtos=(s.itens||[]).map(it=>`${it.nome} (${it.qtd} ${it.un||""})`).join(", ");
        const sraw=s.raw||{};
        html +=`<li><div style="flex:1"><div style="font-weight:500">${s.sentido==="entrou"?"Entrou":"Saiu"} · ${esc(s.tipo||"")} · ${(s.data||"").split("-").reverse().join("/")}</div>
          <div class="muted">${esc(produtos)}</div>
          ${s.extra?`<div class="muted">${esc(s.extra)}</div>`:""}
          ${sraw.tipo==="Empréstimo" && !sraw.devolvido?`<button type="button" class="btn sm" style="margin-top:.3rem" data-devolver="${sraw.id}">Devolvido</button>`:""}
          ${sraw.devolvido?'<span class="badge ok">Devolvido</span>':""}
        </div></li>`;
      });
      html +=`</ul>`;
    }
  return html;
};
