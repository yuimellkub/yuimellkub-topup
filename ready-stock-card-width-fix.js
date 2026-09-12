(function(){
  function apply(){
    const cards=[...document.querySelectorAll('.ready-stock-card')];
    if(!cards.length)return;
    cards.forEach(card=>{
      card.style.setProperty('min-width','340px','important');
      card.style.setProperty('width','340px','important');
      card.style.setProperty('max-width','340px','important');
      card.style.setProperty('box-sizing','border-box','important');
      card.style.setProperty('overflow','hidden','important');
      const wrap=card.querySelector('.ymk-qty-wrap');
      if(wrap){
        wrap.style.setProperty('width','220px','important');
        wrap.style.setProperty('min-width','220px','important');
        wrap.style.setProperty('max-width','220px','important');
        wrap.style.setProperty('flex','0 0 220px','important');
      }
      const confirm=card.querySelector('.ymk-confirm-order');
      if(confirm){
        confirm.style.setProperty('width','220px','important');
        confirm.style.setProperty('min-width','220px','important');
        confirm.style.setProperty('max-width','220px','important');
        confirm.style.setProperty('box-sizing','border-box','important');
      }
    });
    document.querySelectorAll('.ready-stock-grid').forEach(grid=>{
      grid.style.setProperty('grid-template-columns','repeat(3,340px)','important');
      grid.style.setProperty('gap','20px','important');
      grid.style.setProperty('overflow','visible','important');
    });
  }
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});};
  function start(){apply();if(document.body)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();