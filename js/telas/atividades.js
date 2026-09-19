/* Tela: atividades — etapa 2 reusa a aplicação já existente. */
window.CampoGestorTelas = window.CampoGestorTelas || {};
window.CampoGestorTelas.atividades = function () {
  if (typeof window.CampoGestorTelas.aplicacao === "function") {
    return window.CampoGestorTelas.aplicacao();
  }
  let html = headerBar("CAMPOGESTOR", "Atividades");
  html += `<section class="card"><p class="card-title">Atividades</p><p class="muted">Em breve: por fazer e feitas no ciclo da safra.</p></section>`;
  return html;
};
