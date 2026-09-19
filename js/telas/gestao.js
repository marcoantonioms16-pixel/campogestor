/* Tela: gestão — escritório da fazenda (V1). */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.gestao = function () {
  const farm = (state && state.farm) || {};
  let html = headerBar("CAMPOGESTOR", "Gestão", `<div class="farm-context">${esc(farm.nome || "Fazenda")}</div>`);
  html += `<p class="muted" style="padding:0 16px 8px">Escritório da propriedade. O lançamento no talhão fica em Atividades.</p>`;
  html += `<div class="more-list">
    <button type="button" class="more-row" data-go="safra"><span>🌾</span><div><b>Safra</b><small>Ciclo e progresso por talhão</small></div></button>
    <button type="button" class="more-row" data-go="estoque"><span>📦</span><div><b>Estoque</b><small>Insumos e saldo</small></div></button>
    <button type="button" class="more-row" data-go="frota"><span>🚜</span><div><b>Máquinas</b><small>Frota, horímetro e manutenção</small></div></button>
    <button type="button" class="more-row" data-go="pessoas"><span>👥</span><div><b>Equipe</b><small>Todos registrados na fazenda</small></div></button>
    <button type="button" class="more-row" data-go="mais"><span>🏡</span><div><b>Fazenda</b><small>Dados da propriedade</small></div></button>
  </div>`;
  return html;
};
