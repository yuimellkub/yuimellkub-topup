(function(){
  function apply(){
    const cards=[...document.querySelectorAll('.ready-stock-card')];
    if(!cards.length)return;
    cards.forEach(card=>{
      card.style.setProperty('min-width','300px','important');
      card.style.setProperty('width','300px','important');
      card.style.setProperty('max-width','300px','important');
      card.style.setProperty('box-sizing','border-box','important');
      const wrap=card.querySelector('.ymk-qty-wrap');
      if(wrap){
        wrap.style.setProperty('width','190px','important');
        wrap.style.setProperty('min-width','190px','important');
        wrap.style.setProperty('max-width','190px','important');
        wrap.style.setProperty('flex','0 0 190px','important');
      }
      const confirm=card.querySelector('.ymk-confirm-order');
      if(confirm){
        confirm.style.setProperty('width','190px','important');
        confirm.style.setProperty('min-width','190px','important');
        confirm.style.setProperty('max-width','190px','important');
      }
    });
    document.querySelectorAll('.ready-stock-grid').forEach(grid=>{
      grid.style.setProperty('grid-template-columns','repeat(3,minmax(300px,1fr))','important');
    });
  }
  const o=new MutationObserver(apply);
  function start(){apply();if(document.body)o.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();