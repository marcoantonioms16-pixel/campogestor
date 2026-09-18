/* Tela: mais. Utilidades e configurações; autenticação fica no perfil. */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.mais = function() {
  let html = headerBar("CAMPOGESTOR","Fazenda");
  html += `<div class="card mais-card propriedade-card">
    <p class="mais-kicker">Propriedade</p>
    <p class="mais-title">${esc(state.farm.nome)}</p>
    <p class="mais-line">${esc(state.farm.municipio)}</p>
    <p class="mais-line">Safra ${esc(state.farm.safra)} · ${ha(state.farm.areaTotal)}</p>
    <p class="mais-line">${esc(state.farm.cargo)}</p>
    <p class="mais-line">Gerente: ${esc(state.farm.gerente)}</p>
    <button type="button" class="btn" data-edit="farm" style="margin-top:.8rem">Editar fazenda</button>
  </div>`;
  html += `<div class="more-list">
    <button type="button" class="more-row" data-go="talhoes"><span>🗺️</span><div><b>Talhões</b><small>Lista e histórico por talhão</small></div></button>
    <button type="button" class="more-row" data-go="aplicacao"><span>💧</span><div><b>Aplicação</b><small>Ordens de campo e produtos</small></div></button>
    <button type="button" class="more-row" data-go="safra"><span>🌾</span><div><b>Safra</b><small>Centro histórico por safra</small></div></button>
    <button type="button" class="more-row" data-go="equatorial"><span>⚡</span><div><b>Energia</b><small>Equatorial / UCs</small></div></button>
    <button type="button" class="more-row" data-go="extintores"><span>🧯</span><div><b>Extintores</b><small>Controle e recarga</small></div></button>
    <button type="button" class="more-row" data-go="folgas"><span>📅</span><div><b>Folgas</b><small>Plantão e faltas</small></div></button>
  </div>`;
  html += `<div class="card mais-card manutencao-card">
    <p class="card-title">Manutenção</p>
    <p class="mais-line">Troque o usuário pelo perfil no topo.</p>
    <p class="mais-line">Visitante é somente consulta.</p>
    <p class="mais-line">Os dados da equipe ficam na nuvem, após o login.</p>
    <button type="button" class="btn block" id="btn-reset" style="margin-top:.7rem">Restaurar cadastro oficial</button>
  </div>`;
  return html;
};
