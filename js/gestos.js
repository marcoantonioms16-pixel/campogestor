/* CampoGestor — gestos de toque (menu swipe + pull-to-refresh). */
(function gestosApp(){
  let x0=null, y0=null, t0=0;
  let ptrActive=false;
  let ptrEl=null;
  function ensurePtr(){
    if(ptrEl) return ptrEl;
    ptrEl=document.createElement("div");
    ptrEl.className="ptr-indicator";
    ptrEl.textContent="Atualizar";
    document.body.appendChild(ptrEl);
    return ptrEl;
  }
  function setPtr(state, text){
    const el=ensurePtr();
    el.textContent=text||"Atualizar";
    el.classList.toggle("visible", state==="pull"||state==="release");
    el.classList.toggle("refreshing", state==="refresh");
    if(state==="hide"){ el.classList.remove("visible","refreshing"); }
  }
  document.addEventListener("touchstart",e=>{
    if(e.touches.length!==1) return;
    // não interferir em inputs / scroll horizontal de tabelas
    const tag=(e.target&&e.target.tagName||"").toLowerCase();
    if(tag==="input"||tag==="textarea"||tag==="select") return;
    const t=e.touches[0];
    x0=t.clientX; y0=t.clientY; t0=Date.now();
    ptrActive=false;
  },{passive:true});
  document.addEventListener("touchmove",e=>{
    if(x0==null||y0==null) return;
    if(menuOpen) return;
    const t=e.touches[0];
    const dy=t.clientY-y0;
    const dx=t.clientX-x0;
    const scrollY=window.scrollY||document.documentElement.scrollTop||0;
    // Pull to refresh: só no topo, gesto vertical dominante
    if(scrollY<=2 && dy>40 && Math.abs(dy)>Math.abs(dx)*1.2){
      ptrActive=true;
      if(dy>90) setPtr("release","Solte para atualizar");
      else setPtr("pull","Puxe para atualizar");
    }
  },{passive:true});
  document.addEventListener("touchend",e=>{
    if(x0==null) return;
    const t=e.changedTouches[0];
    const dx=t.clientX-x0, dy=t.clientY-y0;
    const startX=x0;
    const startY=y0;
    x0=null; y0=null;

    // Pull to refresh
    if(ptrActive){
      ptrActive=false;
      const scrollY=window.scrollY||document.documentElement.scrollTop||0;
      if(scrollY<=4 && dy>90 && Math.abs(dy)>Math.abs(dx)){
        setPtr("refresh","Atualizando…");
        const run=async()=>{
          try{
            if(typeof pullCloud==="function" && sbUser) await pullCloud();
            if(typeof atualizarPrevisaoChuva==="function"){
              try{ await atualizarPrevisaoChuva(); }catch(_e){}
            } else if(typeof buscarPrevisaoChuva==="function"){
              try{ await buscarPrevisaoChuva(); }catch(_e){}
            }
          }catch(_e){}
          render();
          setTimeout(()=>setPtr("hide"),500);
        };
        run();
        return;
      }
      setPtr("hide");
    }

    // Swipe horizontal para menu
    if(Math.abs(dx)<56 || Math.abs(dx)<Math.abs(dy)*1.1) return;
    // Abrir: borda esquerda → direita
    if(!menuOpen && startX<36 && dx>70){
      menuOpen=true; render(); return;
    }
    // Fechar: qualquer área, swipe esquerda com menu aberto
    if(menuOpen && dx<-70){
      menuOpen=false; render(); return;
    }
  },{passive:true});
})();

