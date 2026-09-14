/* Tela: mais. Somente renderização; eventos continuam centralizados no app. */

window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.mais = function() {
  let html = "";
    html +=headerBar("CampoGestor","Mais");
    html +=`<div class="card"><p class="card-title">Conta e sincronização</p>
      <p class="muted" id="cloud-status">${cloudLabel()}</p>`;
    if(!sbUser){
      html +=`<div class="field"><label>E-mail</label><input id="auth-email" type="email" placeholder="seu@email.com" autocomplete="username"/></div>
        <div class="field"><label>Senha (mín. 6)</label><input id="auth-pass" type="password" placeholder="••••••" autocomplete="current-password"/></div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn primary" id="btn-login">Entrar</button>
          <button class="btn" id="btn-signup">Criar conta</button>
        </div>
        <p class="muted" style="margin-top:.5rem">Você e o gerente usam o <b>mesmo e-mail e a mesma senha</b>. Assim o que um lança aparece no celular do outro.</p>
        <p class="muted">1) Crie a conta uma vez · 2) Entre nos dois aparelhos com essa conta · 3) O app salva sozinho na nuvem.</p>
        <p class="muted">Contas diferentes = cadernetas diferentes. Não misturam.</p>`;
    } else {
      html +=`<p class="muted">Conta da fazenda: ${esc(sbUser.email||"")}</p>
        <p class="muted">O Célio precisa entrar com este mesmo e-mail. O que um salvar, o outro vê ao abrir o app (ou em “Buscar da nuvem”).</p>
        <button class="btn" id="btn-logout" style="margin-top:.5rem">Sair</button>
        <button class="btn" id="btn-push" style="margin-top:.5rem">Salvar na nuvem agora</button>
        <button class="btn" id="btn-pull" style="margin-top:.5rem">Buscar da nuvem</button>`;
    }
    html +=`</div>`;
    html +=`<div class="card"><p class="muted" style="text-transform:uppercase;letter-spacing:.06em;font-size:.7rem">Propriedade</p>
      <p style="font-family:var(--display);font-size:1.25rem;margin:.25rem 0">${esc(state.farm.nome)}</p>
      <p class="muted">${esc(state.farm.municipio)} · safra ${esc(state.farm.safra)} · ${ha(state.farm.areaTotal)}</p>
      <p class="muted">${esc(state.farm.cargo)} · Gerente: ${esc(state.farm.gerente)}</p>
      <button class="btn" style="margin-top:.75rem" data-edit="farm">Editar fazenda</button>
    </div>
    <div style="padding:.5rem 1rem;display:flex;flex-direction:column;gap:.5rem">
      <button class="btn block" data-go="safra">Abrir programação da safra</button>
      <button class="btn block" data-go="equatorial">Equatorial / energia (UCs)</button>
      <button class="btn block" data-go="extintores">Extintores</button>
      <button class="btn block" data-go="folgas">Folgas, plantão e faltas</button>
      <button class="btn block" id="btn-reset">Restaurar cadastro oficial do app</button>
    </div>
    <div class="card">
      <p class="card-title">Restaurar</p>
      <p class="muted">Volta o cadastro gravado neste arquivo. Lançamentos feitos depois são apagados.</p>
    </div>`;
  return html;
};
