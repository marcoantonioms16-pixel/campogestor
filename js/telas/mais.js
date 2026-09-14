/* Tela: mais. Utilidades e configurações; autenticação fica no perfil. */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.mais = function() {
  let html = headerBar("CAMPOGESTOR","Mais");
  html += `<div class="card mais-card"><p class="mais-kicker">Propriedade</p>
    <p class="mais-title">${esc(state.farm.nome)}</p>
    <p class="muted">${esc(state.farm.municipio)} · safra ${esc(state.farm.safra)}</p>
    <p class="muted">${ha(state.farm.areaTotal)} · ${esc(state.farm.cargo)}</p>
    <p class="muted">Gerente: ${esc(state.farm.gerente)}</p>
    <button type="button" class="btn" style="margin-top:.75rem" data-edit="farm">Editar fazenda</button>
  </div>`;
  html += `<div class="more-list">
    <button type="button" class="more-row" data-go="safra"><span>🌾</span><div><b>Safra</b><small>Programação e plantio</small></div></button>
    <button type="button" class="more-row" data-go="equatorial"><span>⚡</span><div><b>Energia</b><small>Equatorial / UCs</small></div></button>
    <button type="button" class="more-row" data-go="extintores"><span>🧯</span><div><b>Extintores</b><small>Controle e recarga</small></div></button>
    <button type="button" class="more-row" data-go="folgas"><span>📅</span><div><b>Folgas</b><small>Plantão e faltas</small></div></button>
  </div>`;
  html += `<div class="card mais-card"><p class="card-title">Manutenção</p><p class="muted">Troque o usuário pelo perfil no topo. Visitante é só consulta.</p><button type="button" class="btn block" id="btn-reset">Restaurar cadastro oficial</button></div>`;
  return html;
};
