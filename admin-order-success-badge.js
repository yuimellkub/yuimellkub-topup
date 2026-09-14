(function(){
  'use strict';

  const style=document.createElement('style');
  style.textContent=`
    .ymk-order-success-badge{display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:6px 10px;border-radius:999px;background:#eef9f1;color:#48845a;border:1px solid #cde8d4;font-size:11px;font-weight:900}
  `;
  document.head.appendChild(style);

  function refreshCard(card){
    if(!card)return;
    const select=card.querySelector('.shopStatus');
    if(!select)return;
    let badge=card.querySelector('.ymk-order-success-badge');
    const done=select.value==='สำเร็จ';
    if(done){
      if(!badge){
        badge=document.createElement('div');
        badge.className='ymk-order-success-badge';
        badge.textContent='✓ เติมสำเร็จ';
        const top=card.querySelector('.cardTop');
        if(top&&top.firstElementChild)top.firstElementChild.appendChild(badge);
        else card.prepend(badge);
      }else badge.style.display='inline-flex';
    }else if(badge){
      badge.style.display='none';
    }
  }

  function enhance(){
    document.querySelectorAll('#orders .card').forEach(card=>{
      refreshCard(card);
      const select=card.querySelector('.shopStatus');
      if(select&&!select.dataset.ymkSuccessBound){
        select.dataset.ymkSuccessBound='1';
        select.addEventListener('change',()=>refreshCard(card));
      }
    });
  }

  const root=document.getElementById('orders');
  if(root)new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  enhance();
})();
