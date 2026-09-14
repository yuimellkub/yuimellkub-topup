(function(){
  function isTablet(){
    return window.matchMedia('(pointer: coarse)').matches && window.innerWidth >= 700 && window.innerWidth <= 1400;
  }
  function apply(){
    const cards=[...document.querySelectorAll('.ready-stock-card')];
    if(!cards.length)return;
    const tablet=isTablet();
    cards.forEach(card=>{
      if(tablet){
        card.style.setProperty('min-width','0','important');
        card.style.setProperty('width','100%','important');
        card.style.setProperty('max-width','100%','important');
      }else{
        card.style.setProperty('min-width','300px','important');
        card.style.setProperty('width','300px','important');
        card.style.setProperty('max-width','300px','important');
      }
      card.style.setProperty('box-sizing','border-box','important');
      card.style.setProperty('overflow','hidden','important');
      const wrap=card.querySelector('.ymk-qty-wrap');
      if(wrap){
        wrap.style.setProperty('width','170px','important');
        wrap.style.setProperty('min-width','170px','important');
        wrap.style.setProperty('max-width','170px','important');
        wrap.style.setProperty('flex','0 0 170px','important');
      }
      const confirm=card.querySelector('.ymk-confirm-order');
      if(confirm){
        confirm.style.setProperty('width','170px','important');
        confirm.style.setProperty('min-width','170px','important');
        confirm.style.setProperty('max-width','170px','important');
        confirm.style.setProperty('box-sizing','border-box','important');
      }
    });
    document.querySelectorAll('.ready-stock-grid').forEach(grid=>{
      if(tablet){
        grid.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
        grid.style.setProperty('width','100%','important');
        grid.style.setProperty('max-width','100%','important');
        grid.style.setProperty('gap','12px','important');
        grid.style.setProperty('padding-right','12px','important');
      }else{
        grid.style.setProperty('grid-template-columns','repeat(3,300px)','important');
        grid.style.removeProperty('width');
        grid.style.removeProperty('max-width');
        grid.style.setProperty('gap','16px','important');
        grid.style.removeProperty('padding-right');
      }
      grid.style.setProperty('overflow','hidden','important');
      grid.style.setProperty('box-sizing','border-box','important');
    });
  }
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});};
  function start(){
    apply();
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('orientationchange',schedule,{passive:true});
    if(document.body)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();