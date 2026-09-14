/* Tela: equatorial. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.equatorial = function() {
  let html = "";
    const eq = state.equatorial || SEED.equatorial;
    html +=headerBar("Energia · Equatorial / ENEL","Unidades",`<button type="button" class="btn primary sm" data-new="protocolo">+ Protocolo</button>`);
    html +=`<div class="card"><p class="card-title">Atendimento</p><p style="font-size:1.1rem;font-weight:500">${esc(eq.telefone)}</p>
      <p class="muted">Anote o protocolo após o atendimento.</p>
      <a class="btn primary block" style="margin-top:.6rem;text-align:center;text-decoration:none" id="btn-wa-clara" href="#">WhatsApp Clara</a>
      <p class="muted" style="margin-top:.4rem">0800-620-196 · Abre o WhatsApp do telefone. Com o número da Clara em Mais → Editar fazenda, já entra no chat dela.</p>
    </div>`;
    const ucKeep=["10026027184","980046051"];
    html +=`<p class="sec">Unidades consumidoras</p><ul class="list card" style="padding:.25rem 1rem">`;
    (eq.ucs||[]).filter(u=>ucKeep.includes(String(u.uc))).forEach(u=>{
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(u.desc)}</div>
        <div class="muted">UC ${esc(u.uc)} · ${esc(u.unid)} · ${esc(u.titular)}</div></div>
        <button type="button" class="btn sm" data-copy="${esc(u.uc)}">Copiar UC</button></li>`;
    });
    html +=`</ul>`;
    html +=`<p class="sec">Protocolos</p>
      <div style="padding:0 1rem .5rem;display:flex;gap:.4rem;flex-wrap:wrap"><button type="button" class="btn primary sm" data-new="protocolo">+ Adicionar protocolo</button><button type="button" class="btn" id="btn-exp-prot">Exportar protocolos CSV</button></div>
      <ul class="list card" style="padding:.25rem 1rem">`;
    const prots=[...(eq.protocolos||[])].slice().reverse();
    if(!prots.length) html +=`<li class="muted">Nenhum protocolo.</li>`;
    prots.forEach(p=>{
      const pid=p.id||(p.protocolo+"-"+p.data+"-"+p.hora);
      html +=`<li><div style="flex:1"><div style="font-weight:500">${esc(p.protocolo||"—")}</div>
        <div class="muted">${esc(p.data||"")} ${esc(p.hora||"")} · UC ${esc(p.uc||"")}</div>
        <div class="muted">${esc(p.hist||"")} · ${esc(p.local||"")}</div></div>
        <button type="button" class="btn sm" data-edit="protocolo" data-id="${esc(pid)}">✎</button></li>`;
    });
    html +=`</ul>`;
  return html;
};
