/* Tela: pessoas. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.pessoas = function() {
  let html = "";
  const hoje = hojeISO();
    html +=headerBar(`Equipe · ${state.pessoas.filter(p=>p.tipo!=="encerrado").length}`,"Pessoas");
    html +=`<div class="page-actions">
      <button type="button" class="btn primary sm" data-new="pessoa">+ Nova</button>
      <button type="button" class="btn sm" id="btn-notif">Avisos de aniversário</button>
    </div>`;
    const ativos=state.pessoas.filter(p=>p.tipo!=="encerrado");
    const exs=[];
    const sortFn=(a,b)=>{
      if(sortPessoas==="aniversario"){
        const ka=(a.nascimento||"99-12-31").slice(5);
        const kb=(b.nascimento||"99-12-31").slice(5);
        return ka.localeCompare(kb);
      }
      return a.nome.localeCompare(b.nome,"pt-BR");
    };
    function cardPessoa(p){
      const hojeN=aniversarioHoje(p.nascimento,hoje);
      const tempo=tempoDeCasa(p.admissao,hoje);
      let h=`<li style="align-items:flex-start">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">
            <span class="list-title pessoa-nome">${esc(p.nome)}</span>
            ${hojeN?'<span class="badge ok">Hoje</span>':''}
            ${p.tipo==="encerrado"?'<span class="badge muted">Encerrado</span>':''}
          </div>
          <div class="list-sub pessoa-meta">${esc(p.funcao||"—")} · ${esc(p.tipo)}</div>
          ${p.nascimento?`<div class="list-sub pessoa-meta">Aniversário: ${dataNascimentoFmt(p.nascimento)} de ${String(p.nascimento).slice(0,4)}</div>`:""}
          ${p.admissao?`<div class="list-sub pessoa-meta">Início / admissão: ${String(p.admissao).split("-").reverse().join("/")}</div>`:""}
          ${p.contratoFim?`<div class="list-sub pessoa-meta">Encerrou contrato: ${String(p.contratoFim).split("-").reverse().join("/")}</div>`:""}
          ${tempo && p.tipo!=="encerrado"?`<div class="list-sub pessoa-meta">Tempo de casa: <b>${esc(tempo)}</b></div>`:""}
          ${p.carteira?`<div style="margin-top:.45rem;padding:.5rem .6rem;background:var(--elevated);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:.5rem">
            <div><div class="muted" style="font-size:.7rem">Carteira Unimed</div><div style="font-weight:500">${esc(p.carteira)}</div></div>
            <button type="button" class="btn sm" data-copy="${esc(p.carteira)}" data-copy-kind="carteira">Copiar</button>
          </div>`:`<div class="muted" style="margin-top:.35rem">Sem carteira</div>`}
        </div>
        <button type="button" class="btn sm" data-edit="pessoa" data-id="${p.id}">✎</button>
      </li>`;
      return h;
    }
    html +=`<ul class="list card" style="padding:.25rem 1rem">`;
    if(!ativos.length) html +=`<li class="empty-state"><span class="empty-ico">👥</span><b>Nenhuma pessoa ativa</b><span>Cadastre alguém em + Nova pessoa.</span></li>`;
    [...ativos].sort(sortFn).forEach(p=>{ html +=cardPessoa(p); });
    html +=`</ul>`;
    if(exs.length){
      html +=`<p class="sec">Contratos encerrados / histórico</p><ul class="list card" style="padding:.25rem 1rem">`;
      [...exs].sort(sortFn).forEach(p=>{ html +=cardPessoa(p); });
      html +=`</ul>`;
    }
  return html;
};
