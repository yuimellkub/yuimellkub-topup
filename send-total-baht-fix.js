(function(){
  'use strict';
  function isSend(){return window.YMK_SEND_ORDER_META?.mode==='send'||window.YMK_SEND_SELECTION?.mode==='send'||window.YMK_PENDING_ORDER_META?.orderMode==='send';}
  function fix(root){
    if(!isSend())return;
    const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const text=node.nodeValue||'';
      if(/ยอดรวม:\s*[\d,]+\s*$/.test(text)){
        node.nodeValue=text.replace(/ยอดรวม:\s*([\d,]+)\s*$/,function(_,n){return 'ยอดรวม: '+n+' บาท';});
      }
    }
  }
  document.addEventListener('click',function(){setTimeout(()=>fix(document.body),0);setTimeout(()=>fix(document.body),80);setTimeout(()=>fix(document.body),250);},true);
  new MutationObserver(function(){fix(document.body);}).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
