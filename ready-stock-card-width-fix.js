(function(){
  function isMobile(){
    return window.innerWidth < 700;
  }
  function apply(){
    const cards=[...document.querySelectorAll('.ready-stock-card')];
    if(!cards.length)return;
    const mobile=isMobile();

    cards.forEach(card=>{
      if(mobile){
        card.style.setProperty('min-width','280px','important');
        card.style.setProperty('width','280px','important');
        card.style.setProperty('max-width','280px','important');
        card.style.setProperty('scroll-snap-align','start','important');
      }else{
        card.style.setProperty('min-width','0','important');
        card.style.setProperty('width','100%','important');
        card.style.setProperty('max-width','100%','important');
        card.style.removeProperty('scroll-snap-align');
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
      if(mobile){
        grid.style.setProperty('display','grid','important');
        grid.style.setProperty('grid-auto-flow','column','important');
        grid.style.setProperty('grid-auto-columns','280px','important');
        grid.style.setProperty('grid-template-columns','none','important');
        grid.style.setProperty('width','100%','important');
        grid.style.setProperty('max-width','100%','important');
        grid.style.setProperty('gap','12px','important');
        grid.style.setProperty('padding','0 14px 8px 0','important');
        grid.style.setProperty('margin-left','0','important');
        grid.style.setProperty('margin-right','0','important');
        grid.style.setProperty('overflow-x','auto','important');
        grid.style.setProperty('overflow-y','hidden','important');
        grid.style.setProperty('-webkit-overflow-scrolling','touch','important');
        grid.style.setProperty('scroll-snap-type','x proximity','important');
        grid.style.setProperty('touch-action','pan-x pan-y','important');
      }else{
        grid.style.setProperty('display','grid','important');
        grid.style.removeProperty('grid-auto-flow');
        grid.style.removeProperty('grid-auto-columns');
        grid.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
        grid.style.setProperty('gap','12px','important');
        grid.style.setProperty('padding','0','important');
        grid.style.setProperty('overflow','hidden','important');
        grid.style.removeProperty('-webkit-overflow-scrolling');
        grid.style.removeProperty('scroll-snap-type');
        grid.style.removeProperty('touch-action');

        if(window.innerWidth >= 900){
          const gridWidth=Math.min(1080,window.innerWidth-140);
          const parentRect=(grid.parentElement||document.body).getBoundingClientRect();
          const desiredLeft=(window.innerWidth-gridWidth)/2;
          const marginLeft=desiredLeft-parentRect.left;
          grid.style.setProperty('width',gridWidth+'px','important');
          grid.style.setProperty('max-width',gridWidth+'px','important');
          grid.style.setProperty('margin-left',marginLeft+'px','important');
          grid.style.setProperty('margin-right','0','important');
        }else{
          grid.style.setProperty('width','100%','important');
          grid.style.setProperty('max-width','100%','important');
          grid.style.setProperty('margin-left','0','important');
          grid.style.setProperty('margin-right','0','important');
        }
      }
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