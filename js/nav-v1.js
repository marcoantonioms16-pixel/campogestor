/* ETAPA 2 — barra de 4 abas. Não troca a lógica das telas. */
(function () {
  if (typeof render !== "function") return;
  const prev = render;

  function loggedIn() {
    return !document.getElementById("btn-login");
  }

  function tabOn(id) {
    const p = typeof page === "string" ? page : "hoje";
    if (id === "atividades") return p === "atividades" || p === "aplicacao";
    if (id === "gestao") {
      return ["gestao", "safra", "estoque", "frota", "pessoas", "mais"].indexOf(p) >= 0;
    }
    return p === id;
  }

  function paintTabs() {
    const root = document.getElementById("app");
    if (!root || !loggedIn()) return;
    let nav = root.querySelector("nav.v1-tabs");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "bottom-nav v1-tabs";
      nav.setAttribute("aria-label", "Navegação principal");
      root.appendChild(nav);
    }
    const items = [
      { id: "hoje", ic: "🏠", label: "Hoje" },
      { id: "talhoes", ic: "🗺️", label: "Talhões" },
      { id: "atividades", ic: "☑️", label: "Atividades" },
      { id: "gestao", ic: "📋", label: "Gestão" }
    ];
    nav.innerHTML = items.map(function (it) {
      return '<button type="button" class="bottom-item' + (tabOn(it.id) ? " active" : "") +
        '" data-go="' + it.id + '"><span class="bi">' + it.ic + "</span>" + it.label + "</button>";
    }).join("");
    nav.querySelectorAll("[data-go]").forEach(function (btn) {
      btn.onclick = function () {
        page = btn.getAttribute("data-go");
        edit = null;
        if (typeof menuOpen !== "undefined") menuOpen = false;
        render();
      };
    });
  }

  window.render = function () {
    prev.apply(this, arguments);
    paintTabs();
  };
})();
