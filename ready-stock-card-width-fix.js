(function(){
  function deviceMode(){
    const w=window.innerWidth;
    const coarse=window.matchMedia('(pointer: coarse)').matches;
    if(coarse && w < 700)return 'mobile';
    if(coarse && w >= 700 && w <= 1400)return 'tablet';
    return 'desktop';
  }
  function apply(){
    const cards=[...document.querySelectorAll('.ready-stock-card')];
    if(!cards.length)return;
    const mode=deviceMode();
    cards.forEach(card=>{
      if(mode==='mobile'){
        card.style.setProperty('min-width','0','important');
        card.style.setProperty('width','100%','important');
        card.style.setProperty('max-width','100%','important');
      }else if(mode==='tablet'){
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
        const controlWidth=mode==='mobile'?'min(170px,100%)':'170px';
        wrap.style.setProperty('width',controlWidth,'important');
        wrap.style.setProperty('min-width',mode==='mobile'?'0':'170px','important');
        wrap.style.setProperty('max-width','170px','important');
        wrap.style.setProperty('flex',mode==='mobile'?'0 1 170px':'0 0 170px','important');
      }
      const confirm=card.querySelector('.ymk-confirm-order');
      if(confirm){
        confirm.style.setProperty('width',mode==='mobile'?'min(170px,100%)':'170px','important');
        confirm.style.setProperty('min-width',mode==='mobile'?'0':'170px','important');
        confirm.style.setProperty('max-width','170px','important');
        confirm.style.setProperty('box-sizing','border-box','important');
      }
    });
    document.querySelectorAll('.ready-stock-grid').forEach(grid=>{
      if(mode==='mobile'){
        grid.style.setProperty('grid-template-columns','minmax(0,1fr)','important');
        grid.style.setProperty('width','100%','important');
        grid.style.setProperty('max-width','100%','important');
        grid.style.setProperty('gap','12px','important');
        grid.style.setProperty('padding','0','important');
        grid.style.setProperty('margin-left','0','important');
        grid.style.setProperty('margin-right','0','important');
      }else if(mode==='tablet'){
        grid.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
        grid.style.setProperty('gap','12px','important');
        grid.style.setProperty('padding','0','important');
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
      }else{
        grid.style.setProperty('grid-template-columns','repeat(3,300px)','important');
        grid.style.removeProperty('width');
        grid.style.removeProperty('max-width');
        grid.style.setProperty('gap','16px','important');
        grid.style.removeProperty('padding');
        grid.style.removeProperty('margin-left');
        grid.style.removeProperty('margin-right');
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