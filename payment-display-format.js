(function(){
  'use strict';
  function format(n){n=Number(String(n??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n.toLocaleString('th-TH')+' บาท':'';}
  function currentPrice(){
    try{
      const candidates=[
        window.YMK_SEND_ORDER_META?.total,
        window.YMK_SEND_ORDER_META?.price,
        window.YMK_SEND_SELECTION?.total,
        window.YMK_PENDING_ORDER_META?.p?.total,
        window.YMK_PENDING_ORDER_META?.total,
        window.YMK_PENDING_ORDER_META?.price,
        typeof lastOrder!=='undefined'&&lastOrder?lastOrder.price:null
      ];
      for(const v of candidates){const n=Number(String(v??'').replace(/[^0-9.-]/g,''));if(Number.isFinite(n)&&n>0)return n;}
    }catch(e){}
    return 0;
  }
  function paymentHeading(){return [...document.querySelectorAll('h1,h2,h3,div,p')].find(el=>!el.children.length&&/ชำระเงินก่อนส่งออเดอร์/.test(el.textContent||''));}
  function amountNode(){
    const head=paymentHeading();if(!head)return null;
    let root=head.closest('.modal-content,.modal-card,.payment-card,.card')||head.parentElement;
    for(let depth=0;root&&depth<4;depth++,root=root.parentElement){
      const label=[...root.querySelectorAll('*')].find(el=>!el.children.length&&(el.textContent||'').trim()==='ยอดที่ต้องชำระ');
      if(label){
        const box=label.parentElement;
        const direct=[...box.children].find(el=>el!==label&&/^\s*[\d,]+(?:\s*บาท)?\s*$/.test(el.textContent||''));
        if(direct)return direct;
        const any=[...box.querySelectorAll('*')].find(el=>!el.children.length&&/^\s*[\d,]+(?:\s*บาท)?\s*$/.test(el.textContent||''));
        if(any)return any;
      }
    }
    return null;
  }
  function fix(){
    const node=amountNode();if(!node)return;
    const active=currentPrice();
    let n=active||Number(String(node.textContent||'').replace(/[^0-9.-]/g,''));
    if(!n)return;
    const text=format(n);if(node.textContent!==text)node.textContent=text;
  }
  document.addEventListener('click',function(){setTimeout(fix,0);setTimeout(fix,80);setTimeout(fix,250);},true);
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
  fix();
})();
