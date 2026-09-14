/* Tela: hoje. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.hoje = function() {
  let html = "";
    const listaRotina=rotinaHoje(hoje);
    const feitas=listaRotina.filter(r=>state.rotinaFeita[r.id]===hoje).length;
    const pct=listaRotina.length?Math.round((feitas/listaRotina.length)*100):0;
    const dieselInv=dieselInventario();
    const dieselLitros=dieselInv ? dieselInv.total : Number(state.diesel.litros)||0;
    const dieselPct=Math.round((dieselLitros/state.diesel.capacidade)*100);
    const niverHoje=state.pessoas.filter(p=>aniversarioHoje(p.nascimento,hoje));
    const niver7=state.pessoas.filter(p=>p.nascimento&&aniversarioEmAte(p.nascimento,7,hoje)&&!aniversarioHoje(p.nascimento,hoje));
    const chuvaLista = (state.chuva||[]).slice().sort((a,b)=>(b.data||"").localeCompare(a.data||""));
    const ultimaChuva = chuvaLista[0];
    html +=headerBar("", esc(state.farm.nome), "");
    // Card Propriedade
    html +=`<div class="card">
      <p class="muted" style="text-transform:uppercase;letter-spacing:.06em;font-size:.7rem;margin:0">Propriedade</p>
      <p style="font-family:var(--display);font-size:1.2rem;margin:.2rem 0">${esc(state.farm.nome)}</p>
      <p class="muted">${esc(state.farm.municipio)} · safra ${esc(state.farm.safra)} · ${n(state.farm.areaTotal,0)} ha</p>
      <p class="muted" style="margin-top:.35rem">Gerente: ${esc(state.farm.gerente)}</p>
      <p class="muted">Auxiliar administrativo: Marcos Antonio da Silva Morais</p>
      ${(()=>{ const v=versiculoDoDia(hoje); return `<div style="margin-top:.85rem;padding-top:.75rem;border-top:1px solid var(--border)">
        <p style="font-family:var(--display);font-size:1.02rem;line-height:1.45">${esc(v[0])}</p>
        <p class="muted" style="margin-top:.4rem">${esc(v[1])}</p>
      </div>`; })()}
    </div>`;
    // Bloco resumo
    html +=`<div class="grid2">
      <button class="stat" data-hoje="diesel" style="text-align:left;border:1px solid var(--border)">
        <div class="lbl">⛽ Diesel · inventário</div><div class="val">${n(dieselLitros,0)} L</div><div class="muted">${dieselPct}% do tanque${dieselPct<30?" · baixo":""}</div>
      </button>
      <button class="stat" data-hoje="chuva" style="text-align:left;border:1px solid var(--border)">
        <div class="lbl">🌧 Última chuva</div><div class="val">${ultimaChuva ? n(ultimaChuva.mm,1)+" mm" : "—"}</div><div class="muted">${ultimaChuva ? (diasAtras(ultimaChuva.data,hoje)===0?"hoje":diasAtras(ultimaChuva.data,hoje)===1?"há 1 dia":"há "+diasAtras(ultimaChuva.data,hoje)+" dias") : "sem registro"}</div>
      </button>
      <button class="stat" data-hoje="equipe" style="text-align:left;border:1px solid var(--border)">
        <div class="lbl">👥 Equipe</div><div class="val">${state.pessoas.filter(p=>p.tipo!=="encerrado").length}</div><div class="muted">colaboradores</div>
      </button>
      <button class="stat" data-hoje="area" style="text-align:left;border:1px solid var(--border)">
        <div class="lbl">🗺 Área</div><div class="val">${n(state.farm.areaTotal,0)} ha</div><div class="muted">${state.talhoes.length} talhões</div>
      </button>
    </div>`;
    html +=`<button class="card" data-hoje="tarefas" style="width:calc(100% - 2rem);margin:.15rem 1rem;display:flex;align-items:center;gap:.9rem;text-align:left">
      <div class="ring" style="--p:${pct}"><span class="pct">${pct}%</span></div>
      <div>
        <div style="font-weight:500">Tarefas de hoje</div>
        <div class="muted">toque para ver</div>
      </div>
    </button>`;
    if(niverHoje.length){
      html +=`<div class="card" style="border-color:var(--primary)"><p class="card-title">🎂 Aniversário hoje — avise o gerente</p><ul class="list">`;
      niverHoje.forEach(p=>{ html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(p.nome)}</div><div class="muted">${esc(p.funcao)} · completa ${idadeEm(p.nascimento,hoje)+1} anos</div></div><span class="badge ok">Hoje</span></li>`; });
      html +=`</ul><p class="muted" style="margin-top:.5rem">Lembrete para ${esc(state.farm.gerente)}</p></div>`;
    }
    if(niver7.length){
      html +=`<div class="card"><p class="card-title">Próximos aniversários (7 dias)</p><ul class="list">`;
      niver7.forEach(p=>{ html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(p.nome)}</div><div class="muted">${esc(p.funcao)} · ${dataNascimentoFmt(p.nascimento)}</div></div><span class="badge warn">Em breve</span></li>`; });
      html +=`</ul></div>`;
    }
  return html;
};
