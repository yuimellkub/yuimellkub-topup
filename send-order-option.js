(function(){
'use strict';

function normalButton(card){
  return card?.querySelector('.ready-stock-order-btn') || null;
}

function enabled(btn){
  return !!(
    btn &&
    !btn.disabled &&
    btn.dataset.sendEnabled === '1' &&
    Number(btn.dataset.sendPrice || 0) > 0
  );
}

function styleLayout(card){
  const bottom=card?.querySelector('.ymk-store-bottom');
  const normal=normalButton(card);
  const send=card?.querySelector('.ymk-send-choice');
  const price=card?.querySelector('.ymk-store-price');
  if(!bottom||!normal)return;

  bottom.style.setProperty('display','flex','important');
  bottom.style.setProperty('flex-direction','column','important');
  bottom.style.setProperty('align-items','stretch','important');
  bottom.style.setProperty('gap','7px','important');

  if(price){
    price.style.setProperty('width','100%','important');
    price.style.setProperty('text-align','center','important');
  }

  normal.style.setProperty('width','100%','important');
  normal.style.setProperty('margin','0','important');

  if(send){
    send.style.setProperty('width','100%','important');
    send.style.setProperty('margin','0','important');
  }
}

function add(card){
  if(!card)return;
  const normal=normalButton(card);
  const bottom=card.querySelector('.ymk-store-bottom');
  if(!normal||!bottom)return;

  let send=card.querySelector('.ymk-send-choice');

  if(!enabled(normal)){
    if(send)send.remove();
    styleLayout(card);
    return;
  }

  if(!send){
    send=document.createElement('button');
    send.type='button';
    send.className='ymk-send-choice';
    send.textContent='แบบส่ง';
    send.setAttribute('aria-label','สั่งซื้อแบบส่ง');
    bottom.appendChild(send);

    send.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if(send.dataset.busy==='1')return;
      send.dataset.busy='1';

      try{
        if(typeof window.YMK_OPEN_NATIVE_PRODUCT_ORDER!=='function'){
          console.warn('Preview native order flow not ready');
          return;
        }

        // v16 reads the clicked card on pointerdown/click.
        // Only open the Preview native flow once; do not patch DOM repeatedly here.
        window.YMK_OPEN_NATIVE_PRODUCT_ORDER(normal,'send');
      }finally{
        setTimeout(()=>{delete send.dataset.busy},180);
      }
    },true);
  }

  styleLayout(card);
}

let scanQueued=false;
function scan(){
  if(scanQueued)return;
  scanQueued=true;
  requestAnimationFrame(()=>{
    scanQueued=false;
    document.querySelectorAll('.ready-stock-card').forEach(add);
  });
}

document.addEventListener('ymk-storefront-products-rendered',scan);

function boot(){
  scan();

  // Observe only card creation/removal. No send metadata/summary mutations here,
  // preventing the old observer -> patchFlow -> mutation loop that could freeze clicks.
  const root=document.getElementById('products') || document.body;
  new MutationObserver(scan).observe(root,{childList:true,subtree:true});
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();