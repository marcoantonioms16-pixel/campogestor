/* Tela: frota. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.frota = function() {
  let html = "";
    const ordem=["trator","colheitadeira","plantadeira","pulverizador","distribuidor","veiculo","implemento","equipamento","maquina","caminhao","outros"];
    const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
    const canonTipo=v=>{
      const n=norm(v).replace(/[ -]+/g,"_");
      const map={
        trator:"trator",tratores:"trator",
        colheitadeira:"colheitadeira",colheitadeiras:"colheitadeira",
        plantadeira:"plantadeira",plantadeiras:"plantadeira",
        pulverizador:"pulverizador",pulverizadores:"pulverizador",
        distribuidor:"distribuidor",distribuidores:"distribuidor",
        veiculo:"veiculo",veiculos:"veiculo","veiculo_":"veiculo",
        caminhao:"caminhao",caminhoes:"caminhao",
        implemento:"implemento",implementos:"implemento",
        equipamento:"equipamento",equipamentos:"equipamento",
        maquina:"maquina",maquinas:"maquina",outro:"outros",outros:"outros"
      };
      return map[n]||n||"outros";
    };
    const fazendaDe=m=>{
      const f=norm(m.fazenda).replace(/[()]/g," ").replace(/\s+/g," ").trim();
      if(f.includes("santa rita")||f.includes("sta rita")||f.includes("s rita")) return "SANTA RITA";
      if(f.includes("segredo")) return "SEGREDO";
      return f ? String(m.fazenda).trim().toUpperCase() : "SEM FAZENDA";
    };
    const fazendas=[...new Set((state.maquinas||[]).map(fazendaDe))].filter(Boolean).sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const presentes=new Set((state.maquinas||[]).map(m=>canonTipo(m.tipo)));
    const q=norm(qMaq);
    const lista=state.maquinas.filter(m=>{
      const okT=catMaq==="todos" || canonTipo(m.tipo)===catMaq;
      const fz=fazendaDe(m);
      const okF=catFaz==="todos" || fz===catFaz;
      const blob=norm([m.nome,m.modelo,m.codigo,m.placa,m.fazenda,m.tipo,m.descricao,TIPO_MAQ[canonTipo(m.tipo)]].join(" "));
      const okQ=!q || blob.includes(q);
      return okT && okF && okQ;
    });
    html +=headerBar(`Máquinas · ${lista.length}/${state.maquinas.length}`,"Frota",`<button class="btn primary sm" data-new="maquina">+ Nova</button>`);
    html +=`<div class="card" style="padding:.65rem .75rem"><input id="q-maq" placeholder="Pesquisar nome, código, marca, fazenda..." value="${esc(qMaq)}" style="width:100%;background:var(--elevated);border:1px solid var(--border);border-radius:10px;padding:.55rem .7rem"/></div>`;
    html +=`<div class="chips" style="justify-content:center">`;
    html +=`<button class="chip ${catMaq==="todos"&&catFaz==="todos"?"on":""}" data-cat-maq="todos" data-cat-faz="todos">Todos</button>`;
    fazendas.forEach(f=>{
      const nome=f==="SANTA RITA"?"Santa Rita":f==="SEGREDO"?"Segredo":f;
      html +=`<button class="chip ${catFaz===f?"on":""}" data-cat-faz="${esc(f)}">${esc(nome)}</button>`;
    });
    ordem.filter(t=>presentes.has(t)).forEach(t=>{
      html +=`<button class="chip ${catMaq===t?"on":""}" data-cat-maq="${t}">${TIPO_MAQ[t]||t}</button>`;
    });
    html +=`</div>`;
    html +=`<ul class="list card" style="padding:.25rem 1rem">`;
    if(!lista.length) html +=`<li class="muted">Nenhuma máquina nesta categoria.</li>`;
    lista.forEach(m=>{
      const tone=m.status==="operando"?"ok":m.status==="manutencao"?"warn":"muted";
      const label=m.status==="operando"?"Operando":m.status==="manutencao"?"Manutenção":"Parada";
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(m.nome)}</div><div class="muted">${m.codigo?("Cód. "+esc(m.codigo)+" · "):""}${esc(m.fazenda||"—")} · ${TIPO_MAQ[m.tipo]||m.tipo}${m.placa && m.placa!==m.codigo?" · "+esc(m.placa):""}</div></div>
        <span class="badge ${tone}">${label}</span>
        <button class="btn sm" data-edit="maquina" data-id="${m.id}">✎</button></li>`;
    });
    html +=`</ul>`;
  return html;
};
