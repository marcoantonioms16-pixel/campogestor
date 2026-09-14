/* Tela: mais. Utilidades e configurações; autenticação fica no perfil. */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.mais = function() {
  let html = headerBar("CAMPOGESTOR","Mais");
  html += `<div class="card"><p class="muted" style="text-transform:uppercase;letter-spacing:.06em;font-size:.7rem">Propriedade</p>
    <p style="font-family:var(--display);font-size:1.25rem;margin:.25rem 0">${esc(state.farm.nome)}</p>
    <p class="muted">${esc(state.farm.municipio)} · safra ${esc(state.farm.safra)} · ${ha(state.farm.areaTotal)}</p>
    <p class="muted">${esc(state.farm.cargo)} · Gerente: ${esc(state.farm.gerente)}</p>
    <button class="btn" style="margin-top:.75rem" data-edit="farm">Editar fazenda</button>
  </div>`;
  html += `<div class="more-grid">
    <button class="more-tile" data-go="safra"><span>🌾</span><b>Safra</b><small>Programação e plantio</small></button>
    <button class="more-tile" data-go="equatorial"><span>⚡</span><b>Energia</b><small>Equatorial / UCs</small></button>
    <button class="more-tile" data-go="extintores"><span>🧯</span><b>Extintores</b><small>Controle e recarga</small></button>
    <button class="more-tile" data-go="folgas"><span>📅</span><b>Folgas</b><small>Plantão e faltas</small></button>
  </div>`;
  html += `<div class="card"><p class="card-title">Manutenção do aplicativo</p><p class="muted">Use o perfil no topo para trocar de usuário e acompanhar a sincronização. O Visitante permanece somente para consulta.</p><button class="btn block" id="btn-reset">Restaurar cadastro oficial do app</button></div>`;
  return html;
};
