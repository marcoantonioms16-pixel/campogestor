/* Tela: sementes. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.sementes = function() {
  let html = "";
    const cults=["76KA72 CE","RAPTOR I2X","NEO761 I2X","NEO700 I2X","DM 72IX74 I2X","ST 752 I2X"];
    if(!state.sementes) state.sementes=[];
    const resumo={};
    cults.forEach(c=>resumo[c]={qtd:0,peso:0});
    state.sementes.forEach(s=>{
      if(!resumo[s.cultivar]) resumo[s.cultivar]={qtd:0,peso:0};
      resumo[s.cultivar].qtd++; resumo[s.cultivar].peso+=Number(s.peso)||0;
    });
    html +=headerBar("Conferência de big bags","Sementes soja",`<button type="button" class="btn primary sm" data-new="semente">+ Registrar</button>`);
    html +=`<p class="sub">Safra 2026/27 · tire foto da etiqueta e confira os dados no formulário (ou envie a foto no chat do Grok para extrair).</p>`;
    html +=`<div class="card"><p class="card-title">Resumo por cultivar</p><ul class="list">`;
    cults.forEach(c=>{
      const r=resumo[c];
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(c)}</div><div class="muted">${r.qtd} big bag(s)</div></div><div class="muted">${n(r.peso,0)} kg</div></li>`;
    });
    html +=`</ul><p class="muted" style="margin-top:.5rem">Total: ${state.sementes.length} registros</p></div>`;
    html +=`<p class="sec">Últimas conferências</p><ul class="list card" style="padding:.25rem 1rem">`;
    const lista=[...state.sementes].reverse().slice(0,40);
    if(!lista.length) html +=`<li class="muted">Nenhum big bag registrado ainda.</li>`;
    lista.forEach(s=>{
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(s.cultivar)}</div><div class="muted">Lote ${esc(s.lote||"—")} · ${esc(s.peso||"—")} kg · ${esc(s.fornecedor||"—")}</div><div class="muted">${esc(s.data||"")} · Bag ${esc(s.numero||"—")}${s.validade?" · val. "+esc(s.validade):""}</div></div>
        <button type="button" class="btn sm" data-edit="semente" data-id="${s.id}">✎</button></li>`;
    });
    html +=`</ul>`;
  return html;
};
