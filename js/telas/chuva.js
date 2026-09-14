/* Tela: chuva. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.chuva = function() {
  let html = "";
    if(!state.chuva) state.chuva=[];
    const lista=[...state.chuva].sort((a,b)=>(b.data||"").localeCompare(a.data||""));
    html +=headerBar("Pluviometria","Chuva",`<button class="btn primary sm" data-new="chuva">+ Registrar</button>`);
    html +=`<p class="sub">Registre a data e os milímetros. O mais recente aparece na tela principal.</p>`;
    if(lista.length){
      const u=lista[0];
      html +=`<div class="card"><p class="card-title">Última chuva</p>
        <p style="font-size:1.4rem;font-weight:500;margin:.2rem 0">${n(u.mm,1)} mm</p>
        <p class="muted">${(u.data||"").split("-").reverse().join("/")}${u.obs?" · "+esc(u.obs):""}</p></div>`;
    }
    html +=`<p class="sec">Histórico</p><ul class="list card" style="padding:.25rem 1rem">`;
    if(!lista.length) html +=`<li class="muted">Nenhum registro ainda.</li>`;
    lista.forEach(c=>{
      html +=`<li><div style="flex:1"><div style="font-weight:500">${n(c.mm,1)} mm</div>
        <div class="muted">${(c.data||"").split("-").reverse().join("/")}${c.obs?" · "+esc(c.obs):""}</div></div>
        <button class="btn sm" data-edit="chuva" data-id="${c.id}">✎</button></li>`;
    });
    html +=`</ul>`;
  return html;
};
