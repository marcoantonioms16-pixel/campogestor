/* Tela: equatorial. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.equatorial = function() {
  let html = "";
    const eq = state.equatorial || SEED.equatorial;
    html +=headerBar("Energia","Equatorial");
    html +=`<div class="page-actions">
      <button type="button" class="btn primary sm" data-new="protocolo">+ Protocolo</button>
      <button type="button" class="btn sm" id="btn-exp-prot">Exportar CSV</button>
    </div>`;
    html +=`<div class="card energia-card">
      <p class="card-title">Atendimento Equatorial</p>
      <p class="energia-fone">${esc(eq.telefone||"0800-620-196")}</p>
      <p class="muted">Ligue e anote o protocolo. Depois registre abaixo.</p>
      <a class="btn primary block" style="margin-top:.7rem;text-align:center;text-decoration:none" id="btn-wa-clara" href="#">WhatsApp Clara</a>
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
