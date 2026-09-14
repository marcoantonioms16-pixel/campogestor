/* Tela: folgas. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.folgas = function() {
  let html = "";
  const hoje = hojeISO();
    if(!state.folgas) state.folgas=[];
    const tipos={"":"—",X:"Folga",P:"Plantão",F:"Falta",T:"Trabalhado",V:"Férias",E:"Encerrou"};
    const meses=["01","02","03","04","05","06","07","08","09","10","11","12"];
    const nomesM=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    if(!folgaMes) folgaMes=hoje.slice(0,7);
    const [ano,mes]=folgaMes.split("-");
    const weeks=weekSlices(folgaMes);
    if(folgaSemana<1) folgaSemana=1;
    if(folgaSemana>weeks.length) folgaSemana=weeks.length;
    const nomes=nomesDoMes(folgaMes);
    const diasView = folgaMesTodo ? daysInMonth(folgaMes) : weeks[folgaSemana-1];
    html +=headerBar("Controle de equipe","Folgas e faltas");
    html +=`<div class="page-actions">
      <button type="button" class="btn primary sm" data-new="folga">+ Registrar</button>
      <button type="button" class="btn sm" id="btn-exp-folgas">CSV</button>
    </div>`;
    html +=`<div class="folga-legenda-fix">
      <span><i class="lg-box" style="background:color-mix(in srgb,var(--ok) 40%,#fff)"></i> X — folga</span>
      <span><i class="lg-box" style="background:color-mix(in srgb,var(--warn) 40%,#fff)"></i> P — plantão</span>
      <span><i class="lg-box" style="background:color-mix(in srgb,var(--danger) 40%,#fff)"></i> F — falta</span>
      <span>T — trabalhado · V — férias</span>
      <span>Toque na célula · Domingo X = folga</span>
    </div>`;
    html +=`<div style="padding:.4rem 1rem;display:flex;gap:.4rem;align-items:center;flex-wrap:wrap">
      <select id="sel-folga-mes" style="background:var(--elevated);border:1px solid var(--border);border-radius:10px;padding:.4rem .6rem">`;
    for(let y=2026;y<=2027;y++){
      meses.forEach((m,i)=>{
        const val=y+"-"+m;
        html +=`<option value="${val}" ${folgaMes===val?"selected":""}>${nomesM[i]} ${y}</option>`;
      });
    }
    html +=`</select>
      <button type="button" class="btn sm ${folgaMesTodo?"primary":""}" id="btn-mes-todo">${folgaMesTodo?"Ver por semana":"Ver mês inteiro"}</button>
    </div>`;
    if(!folgaMesTodo){
      html +=`<div class="chips">`;
      weeks.forEach((w,i)=>{
        html +=`<button type="button" class="chip ${folgaSemana===i+1?"on":""}" data-semana="${i+1}">${i+1}ª sem</button>`;
      });
      html +=`</div>`;
    } else {
      html +=`<p class="sub">Vire o celular para ver o mês todo com mais conforto.</p>`;
    }
    html +=`<div class="card folga-table-wrap">
      <table class="table" style="font-size:.72rem;min-width:${diasView.length*32+110}px">
        <tr><th style="position:sticky;left:0;background:var(--surface);min-width:100px">Nome</th>`;
    diasView.forEach(iso=>{
      html +=`<th style="text-align:center;padding:.2rem .1rem">${Number(iso.slice(8))}<br><span class="muted">${letraDow(iso)}</span></th>`;
    });
    html +=`<th>Saldo</th></tr>`;
    if(!nomes.length) html +=`<tr><td colspan="${diasView.length+2}" class="muted">Ninguém neste mês.</td></tr>`;
    nomes.forEach(nome=>{
      const s=saldoFolgas(nome);
      html +=`<tr><td style="position:sticky;left:0;background:var(--surface);font-weight:500;font-size:.7rem">${esc(nome)}</td>`;
      diasView.forEach(iso=>{
        const t=folgaTipoNoDia(nome,iso);
        const bg=t==="X"?"var(--ok)":t==="P"?"var(--warn)":t==="F"?"var(--danger)":"transparent";
        html +=`<td style="text-align:center;padding:.1rem"><button type="button" class="btn sm" data-cel-nome="${esc(nome)}" data-cel-dia="${iso}" style="min-width:1.5rem;padding:.1rem .15rem;font-size:.7rem;background:${t?`color-mix(in srgb,${bg} 28%,var(--elevated))`:"var(--elevated)"}">${t||"·"}</button></td>`;
      });
      const aTirar=s.ainda+s.casa;
      html +=`<td style="white-space:nowrap"><button type="button" class="btn sm" data-saldo-nome="${esc(nome)}" style="font-size:.62rem;padding:.12rem .3rem">A tirar ${aTirar}</button></td></tr>`;
    });
    html +=`</table>
    </div>`;
  return html;
};
